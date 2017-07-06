<template>
  <section class="">
    <h1>Sök</h1>

    <autocomplete :backend="autocompleteBackend"></autocomplete>

    <section class="results">
        <ul>
            <li v-for="article in articles">
                {{article.ArticleID}}
            </li>
        </ul>
    </section>
  </section>
</template>

<style lang="scss">
    .search {
        position: absolute;
        .dropdown-menu {
            display : block;
        }
    }
</style>

<script>
import backend from "assets/backend"
// import _ from "lodash"
import {debounce} from "assets/utils"
import Autocomplete from "~components/autocomplete.vue"



export default {
    data () {
        return {
            
            articles : null,
            autocompleteData : []
        }
    },

    async asyncData ({ params, error }) {
        
    },
    components : {autocomplete: Autocomplete},
    methods : {
        

        autocompleteBackend : debounce(async function(str) {
            console.log("debounce", str)
            if(!str) return []
            return await backend.autocomplete(str)
        }, 150),

        onSubmit : async function(searchstr) {
            // var articles = await backend.search(searchstr)
            console.log("submit", searchstr)

            // try{
            // }
            // catch(err) {
            //     console.log("Article fetch error.")
            //     error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            // }
            // console.log("assign")
            // this.articles = articles

        }
    },

    
    
     

}

</script>
