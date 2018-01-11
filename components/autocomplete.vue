<template>
  <div class="search" @keydown.enter="onSubmit"
        @keyup.down="down" @keyup.up="up" @keyup.enter.prevent="enter" @keyup.esc="escape">
      <input v-model="searchstr" 
            placeholder="Sök"
            @focus="fetchData(searchstr)" 
            @input="$emit('input', $event.target.value)"
            ref="inputField"
            keyup.enter.prevent=""
            >
      <transition name="fade">
        <i class="loading icon icon-spinner animate-spin" v-show="isLoading"></i>
      </transition>
      <ul v-click-outside="outside" role="menu" class="dropdown-menu" v-show="autocompleteData.length" >
          <li class="dropdown-item" :class="{active: isFirstActive}"><a  :href="'/sok?fras=' + searchstr">Sök på "{{searchstr}}"</a></li>
          <li class="dropdown-item"
              :class="{active: item.active}"
              role="menuitem"
              v-for="item in autocompleteData.slice(1, autocompleteData.length)" 
              ng-if="item.label">
            <a :href="item.url" >{{item.label}}</a>
          </li>
      </ul>        
  </div>
</template>

<style scoped>
  .fade-enter-active, .fade-leave-active {
    transition: opacity .5s
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
    opacity: 0
  }
  .loading {
    position: relative;
    top: 6px;
  }

  input {
    text-align: center;
    font-variant: small-caps;
    text-transform: lowercase;
    width : 100px;
  }
  .dropdown-menu {
    display : block;
    font-size: 0.8rem;
  }
  .dropdown-item a {
    color : #333;
    transition : none;
  }
  .dropdown-item.active, .dropdown-item:active {
    background-color : #777;
  }
  .dropdown-item.active a {
    transition : none;
    color : white;
  }
  .search {
    position : relative;
    white-space: nowrap;
  }
</style>

<script>
import _ from "lodash"
export default {
  data () {
    return {
      autocompleteData : [],
      searchstr: "",
      isLoading : false
    }
  },
  created : function() {
    this.searchstr = this.value
  },
  props : {
    backend: {type: Function, default : _.identity}, 
    value: {type : String}
  },
  methods: {
    outside : function() {
        this.autocompleteData = []
    },
    onSubmit : function(event) {
      if(_.find(this.autocompleteData, "active")) {
        event.preventDefault()
      }
    },
    enter : function(event) {
      let active = _.find(this.autocompleteData, "active")
      console.log("active", active)
      if(active) {
        this.autocompleteData = []
      }
      if(active.url) {
        this.$router.push(active.url)
      } else {
        this.$router.push({path: "/sok", query: {fras : this.searchstr}})
      }
      this.searchstr = ""
    },
    escape : function() {
      this.autocompleteData = []
    },
    down : function() {
      let d = this.autocompleteData
      console.log("this.autocompleteData", d)
      if(!d.length) {
        this.fetchData(this.searchstr)
        return
      }
      let i = _.findIndex(d, "active")
      console.log("i", i)
      // eslint-disable-next-line
      // debugger
      if(i == -1) {
        // d[0].active = true
        return
      }
      d[i].active = false
      let next = (d[i + 1] || d[0])
      next.active = true
      // this.$set(next, "active", true)
      console.log("next", next)
    },
    up : function() {
      let d = this.autocompleteData
      if(!d.length) {
        return
      }
      let i = _.findIndex(d, "active")
      d[i].active = false

      if(i == -1) {
        d[-1].active = true
        return
      }

      if(!i) {
        _.last(d).active = true
      } else {
        d[i - 1].active = true
      }
    },
    show : function(data) {
      this.autocompleteData = _.map(data, item => {
        item.active = false
        return item
      })
    },
    focus : function() {
      this.$refs.inputField.focus()
    },
    async fetchData(val) {
      if(!val.trim(/\s/)) {
        this.autocompleteData = []
        return
      }
      this.isLoading = true
      let data = (await this.backend(val)).slice(0, 10)
      this.isLoading = false
      let i = _.findIndex(this.autocompleteData, "active")
      let firstObj = {
        stringsearch: true
      }
      data.splice(0, 0, firstObj)
      this.autocompleteData = _.map(data, item => {
        item.active = false
        return item
      })
      
      if(this.autocompleteData[i]) {
        this.autocompleteData[i].active = true
      } else {
        this.autocompleteData[0].active = true
      }
    }
  },
  computed : {
    isFirstActive : function() {
      return this.autocompleteData.length && this.autocompleteData[0].active
    }
  },
  watch : {
    value : function(newVal) {
      this.searchstr = newVal
    },
    searchstr : async function(newVal) {
      this.fetchData(newVal)
    }
  },
  directives: {
    'click-outside': {
      bind: function(el, binding, vNode) {
        // Provided expression must evaluate to a function.
        if (typeof binding.value !== 'function') {
         const compName = vNode.context.name
          let warn = `[Vue-click-outside:] provided expression '${binding.expression}' is not a function, but has to be`
          if (compName) { warn += `Found in component '${compName}'` }
          
          console.warn(warn)
        }
        // Define Handler and cache it on the element
        const bubble = binding.modifiers.bubble
        const handler = (e) => {
          if (bubble || (!el.contains(e.target) && el !== e.target)) {
             binding.value(e)
          }
        }
        el.__vueClickOutside__ = handler

        // add Event Listeners
        document.addEventListener('click', handler)
         },
      
      unbind: function(el, binding) {
        // Remove Event Listeners
        document.removeEventListener('click', el.__vueClickOutside__)
        el.__vueClickOutside__ = null

      }
    }
  }
}
</script>




