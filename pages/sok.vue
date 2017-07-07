<template>
  <section class="">
    <h1>Sök</h1>

    <!-- :backend="autocompleteBackend" -->
    <form @submit.prevent="onSubmit(searchstr)">
        <input focus autofocus v-model="searchstr"></input>
    </form>
    <section class="suggestion" v-if="!works.length && !articles.length && suggestion">
        Menade du <a :href="'?fras=' + suggestion" @click.prevent="onSubmit(suggestion)">{{suggestion}}</a>?
    </section>
    <section class="" v-if="articles.length">
        <h2>Artiklar</h2>
        <ul class="articles">
            <li v-for="article in articles">
                {{article.ArticleName}}
            </li>
        </ul>
        
    </section>
    <section v-if="works.length">
        <h2>Verk</h2>
        <ul class="works">
            <li v-for="work in works">
                {{work.TitleSwedish}}
            </li>
        </ul>
    </section>
    <section v-if="lb_autocomplete && lb_autocomplete.length">
        <h2>Från Litteraturbanken</h2>
        <ul class="works">
            <li v-for="item in lb_autocomplete">
                <span v-if="item.type == 'author'">Författare: <a  :href="item.url" >{{item.label}}</a></span>
                <span v-if="item.type == 'work'"> Verk: <a  :href="item.url" >{{item.label}}</a></span>
            </li>
        </ul>
    </section>
  </section>
</template>

<style lang="scss">
    .search {
        position: relative;
        .dropdown-menu {
            display : block;
        }
    }
</style>

<script>
import backend from "assets/backend"
// import _ from "lodash"

import Autocomplete from "~components/autocomplete.vue"



export default {
    data () {
        return {
            searchstr : this.$route.query.fras || "",
            articles : [],
            works : [],
            suggestion : null,
            lb_autocomplete : []
        }
    },

    async asyncData ({ params, error }) {
        
    },
    mounted : function() {
        if(this.searchstr) {
            this.onSubmit(this.searchstr)
        }
    },
    components : {autocomplete: Autocomplete},
    methods : {
        

        

        onSubmit : async function(searchstr) {
            console.log("submit", searchstr)
            this.searchstr = searchstr
            this.$router.replace({query : {fras : searchstr}})
            var {articles, works, suggestion} = await backend.search(searchstr)
            console.log("articles, works", articles, works, suggestion)
            this.articles = articles
            this.works = works
            this.suggestion = suggestion

            if(!articles.length && !works.length) {
                // this.$refs.autocomplete.show(await backend.autocomplete(searchstr))
                this.lb_autocomplete = await backend.autocomplete(searchstr)
            }


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
