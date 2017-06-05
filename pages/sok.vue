<template>
  <section class="">
    <h1>Sök</h1>

    <form v-on:submit.prevent="onSubmit(searchstr)">
        <input v-model="searchstr" autofocus>
    </form>

    <section class="results">
        <ul>
            <li v-for="article in articles">
                {{article.ArticleID}}
                
            </li>
        </ul>
    </section>
  </section>
</template>

<script>
import axios from "axios"
import backend from "assets/backend"
var c = console

export default {
    data () {
        return {
            searchstr: "",
            articles : null
        }
    },

    async asyncData ({ params, error }) {
        
    },

    methods : {
        onSubmit : async function(searchstr) {
            var articles = await backend.search(searchstr)
            console.log("submit", searchstr, articles)

            try{
            }
            catch(err) {
                console.log("Article fetch error.")
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            console.log("assign")
            this.articles = articles

        }
    }
}

</script>