<template>
  <div class="search" @keydown.enter="onSubmit"
        @keyup.down="down" @keyup.up="up" @keyup.enter.prevent="enter" @keyup.esc="escape">
      <input v-model="searchstr" 
            placeholder="Sök i lexikonet"
            @focus="backend(searchstr)" 
            @input="$emit('input', $event.target.value)"
            ref="inputField"
            keyup.enter.prevent=""
            >
      <ul v-click-outside="outside" role="menu" class="dropdown-menu" v-show="autocompleteData.length" >
          <li class="dropdown-item" :class="{active: item.active}" role="menuitem" v-for="item in autocompleteData">
            <a :href="item.url" >{{item.label}}</a>
          </li>
      </ul>        
  </div>
</template>

<style scoped>
  .dropdown-menu {
    display : block;
  }
  .dropdown-item.active a {
    color : white;
  }
  .search {
    position : relative;
  }
</style>

<script>
import _ from "lodash"
export default {
  data () {
    return {
      autocompleteData : [],
      searchstr: "",
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
        this.$router.push(active.url)
      }
    },
    escape : function() {
      this.autocompleteData = []
    },
    down : function() {
      let d = this.autocompleteData
      console.log("this.autocompleteData", this.autocompleteData)
      if(!this.autocompleteData.length) {
        this.fetchData(this.searchstr)
      }
      let i = _.findIndex(d, "active")
      if(i == -1) {
        d[0].active = true
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
      let data = (await this.backend(val)).slice(0, 10)
      console.log("data", data)
      this.autocompleteData = _.map(data, item => {
        item.active = false
        return item
      })
      if(this.autocompleteData.length) {
        this.autocompleteData[0].active = true
      }
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




