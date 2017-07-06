<template>
  <form class="search" v-on:submit.prevent="onSubmit(searchstr)">
      <input focus autofocus v-model="searchstr" v-on:focus="backend(searchstr)" >
      <div v-click-outside="outside" class="dropdown-menu" v-show="autocompleteData.length">
          <a class="dropdown-item" :href="item.url" v-for="item in autocompleteData">{{item.label}}</a>
          <!-- <a href="" class="dropdown-item">Hej</a> -->
      </div>        
  </form>
</template>

<style scoped>
</style>

<script>

export default {
  data () {
    return {
      autocompleteData : [],
      searchstr: "",
    }
  },
  // created : function() {
  // },
  props : ["backend"],
  methods: {
    outside : function() {
        this.autocompleteData = []
    },
  },
  watch : {
    searchstr : async function(newVal) {
      this.autocompleteData = await this.backend(newVal)
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




