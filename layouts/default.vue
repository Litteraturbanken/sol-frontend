<template>
  <div class="outer row justify-content-lg-center">
  <div class="col-10 no-gutters" >
    <header class="col-12 ">
      <div>
        <h1 class=""><nuxt-link to="/">Svenskt översättarlexikon</nuxt-link></h1>
        
        <nav class="navbar navbar-toggleable-md">
            <div class="navbar-nav">
        
              <nuxt-link class="nav-item nav-link" to="/listor/artiklar">Översättare A-Ö</nuxt-link>
              <nuxt-link class="nav-item nav-link" to="/listor/artiklar/tema">Temaartiklar</nuxt-link>
              <nuxt-link class="nav-item nav-link" to="/listor/priser">Översättarpriser</nuxt-link>
              <nuxt-link class="nav-item nav-link" to="/listor/kronologi">Kronologi</nuxt-link>
              <nuxt-link class="nav-item nav-link" to="/listor/sprak">Språk</nuxt-link>
              
              <form @submit.prevent="$router.push({path : '/sok', query : {'fras' : searchstr}})">
                <autocomplete ref="autocomplete" :backend="autocompleteBackend" v-model="searchstr"></autocomplete>
              </form>
            </div>
        </nav>
      </div>
    </header>
    <nuxt class="mainview"/>

  </div>
    <footer class="footer col-10 no-gutters justify-content-lg-center">
      <nav class="navbar navbar-toggleable-md">
          <div class="navbar-nav">
          <!-- <nuxt-link class="nav-item" to="" >Om</nuxt-link> -->
          <nuxt-link class="nav-item nav-link" to="/om">Om lexikonet</nuxt-link>
          <nuxt-link class="nav-item nav-link" to="/medarbetare">Medarbetare</nuxt-link>
          <nuxt-link class="nav-item nav-link" to="/kontakt">Kontakt</nuxt-link>
          <a class="nav-item nav-link" href="http://litteraturbanken.se">Litteraturbanken</a>
        </div>
      </nav>
    </footer>
  </div>

</template>

<script>
  import Vue from "vue"
  import BootstrapVue from 'bootstrap-vue'
  Vue.use(BootstrapVue)

  import Autocomplete from "~/components/autocomplete.vue"
  import {debounce} from "assets/utils"
  import backend from "assets/backend"
  import _ from "lodash"

  // Register a global custom directive called v-focus
  Vue.directive('focus', {
    // When the bound element is inserted into the DOM...
    inserted: function (el) {
      // Focus the element
      el.focus()
    }
  })

  export default {
    components : {autocomplete: Autocomplete},
    data () {
      return {
        showNav : false,
        searchstr : ""
      }
    },
    mounted : function() {
      window.addEventListener('keyup', this.onKeyup)
    },
    beforeDestroy : function() {
      window.removeEventListener('keyup', this.onKeyup)
    },
    methods : {
      // TODO: to use the article search as a typeahead, partial string search must be implemented
      onKeyup : function(e) {
         if(["input", "textarea"].includes(e.target.nodeName.toLowerCase())) {
          return
        }
        if(e.keyCode == 83) {
          this.$refs.autocomplete.focus()
        }
      },
      autocompleteBackend : debounce(async function(str) {
        if(!str) return []

        let {articles, suggestion, works} = await backend.search(str)

        return [..._.map(articles, (item) => {
            return {label : item.ArticleName, url : '/artiklar/' + item.URLName}
          })
        ]
      }, 150)
    }
  }
</script>


<!-- <style reboot src="bootstrap/dist/css/bootstrap-reboot.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap-grid.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap.min.css"></style> -->


<style lang="scss">
  

</style>
