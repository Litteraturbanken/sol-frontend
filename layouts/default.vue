<template>
  <div class="container">
    <header class="row">
      <h1 class="col-12"><a href="/">Svenskt översättarlexikon</a></h1>

      <nav class="navbar navbar-toggleable-md navbar col-12">
          <div class="navbar-nav">

            <nuxt-link class="nav-item nav-link" to="/listor/artiklar">Översättare A-Ö</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/artiklar/tema">Temaartiklar</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/priser">Översättarpriser</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/kronologi">Kronologi</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/listor/sprak">Språk</nuxt-link>
            <nuxt-link class="nav-item nav-link" to="/om">Om</nuxt-link>
            <form @submit.prevent="$router.push({path : '/sok', query : {'fras' : searchstr}})">
              <autocomplete :backend="autocompleteBackend" v-model="searchstr"></autocomplete>
            </form>
          </div>
      </nav>
    </header>
    <nuxt class="mainview"/>
  </div>

</template>

<script>
  import Vue from "vue"
  import BootstrapVue from 'bootstrap-vue'
  Vue.use(BootstrapVue)

  import Autocomplete from "~components/autocomplete.vue"
  import {debounce} from "assets/utils"
  import backend from "assets/backend"

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
    methods : {
      // TODO: to use the article search as a typeahead, partial string search must be implemented
      autocompleteBackend : debounce(async function(str) {
          if(!str) return []
          return await backend.search(str)
      }, 150)
    }
  }
</script>


<!-- <style reboot src="bootstrap/dist/css/bootstrap-reboot.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap-grid.min.css"></style>  -->
<!-- <style src="bootstrap/dist/css/bootstrap.min.css"></style> -->

<style lang="scss">
  .navbar {
    .nav-link:first-child {
      padding-left : 0;
    }
  }
</style>

<style lang="scss">
html {
  font-size: 16px;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  box-sizing: border-box;
  padding : 1em;
}

body {
  font-family : Georgia, serif;
}

.outer-container {
  display : flex;
  flex-direction : column;
  align-items: center;
  justify-content: center;

  & > * {
    width : 700px;
  }
}
.container {
  padding-left: 0;
  padding-right: 0;
}
.mainview {
}
a {
  color : #333;
  &:hover {
    color : grey;
  }
  &:active {
    color : #333;
  }
}
p {
  max-width : 40em;
  line-height: 143%;
}
p + p {
  margin-top : 1em;
}
li {
  list-style : none;
}
header {
  margin-bottom: 3em;
  h1 {
    font-size: 2.5em;
  }
}
*, *:before, *:after
{
  box-sizing: border-box;
  margin: 0;
}
// .mainmenu {
//   margin-left : 0;
//   padding-left : 0;
//   li {
//     display : inline-block;
//     margin-right: 1em;
//     &:first-child {
//     }
//   }
// }
.nuxt-link-exact-active {
  color : darkgrey !important;
}

blockquote {
  margin: 0 3em 1em 3em;
}
</style>
