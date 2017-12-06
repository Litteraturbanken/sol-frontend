<template>
  <section class="">
    <h2>Sök i artiklar och efter verk</h2>

    <!-- :backend="autocompleteBackend" -->
    <form @submit.prevent="onSubmit(searchstr)">
        <input focus autofocus v-model="searchstr"></input>
    </form>
    <section class="suggestion" v-if="!works.length && !articles.length && suggestion">
        Menade du <a :href="'?fras=' + suggestion" @click.prevent="onSubmit(suggestion)">{{suggestion}}</a>?
    </section>
    <section class="articles_section" v-if="articles.length">
        <h2>Artiklar</h2>
        <ul class="articles resultlist">
            <li v-for="article in articles">
                <a :href="'/artiklar/' + article.URLName">{{article.ArticleName}}</a>
            </li>
        </ul>
        
    </section>
    <section v-if="works.length">
        <h2>Verk</h2>
        <ul class="works resultlist">
            <li v-for="work in works">
                <div>
                    <a class="work" :href="'/verk/' + work.id">{{work.TitleSwedish}}</a>, {{work.PublishingYearSwedish}}
                </div>
                <div><span v-if="work.Authors">{{work.Authors}}, </span> <em>{{connectionLabel(work.ConnectionType)}}:</em> {{work.Translator}} </div>
            </li>
        </ul>
    </section>
    <section v-if="lb_autocomplete && lb_autocomplete.length">
        <button class="btn btn-secondary btn-sm" @click="expand = !expand">Visa {{countLBAuthors}} författare och {{countLBWorks}} verk från Litteraturbankens samlingar</button>
        <ul class="works collapse resultlist" :class="{show : expand}">
            <li v-for="item in lb_autocomplete">
                <span v-if="item.type == 'author'">Författare: <a  :href="item.url" >{{item.label}}</a></span>
                <span v-if="item.type == 'work'"> Verk: <a  :href="item.url" >{{item.label}}</a></span>
            </li>
        </ul>
    </section>
  </section>
</template>

<style lang="scss" scoped>
    .works {
        li {
            margin-bottom: 1em;
        }
    }
    .work {
        font-weight : bold;
    }
    .articles {
        columns: 200px 2;
    }
    .articles_section {
        margin-bottom: 2em;
    }
    .search {
        position: relative;
        .dropdown-menu {
            display : block;
        }
    }

    button {
        cursor : pointer;
        margin-top: 1em;
        margin-bottom: 1em;
        border-radius : 0;
    }
</style>

<script>
import backend from "assets/backend"
import _ from "lodash"

import Autocomplete from "~/components/autocomplete.vue"



export default {
    data () {
        return {
            searchstr : this.$route.query.fras || "",
            articles : [],
            works : [],
            suggestion : null,
            lb_autocomplete : [],
            expand : false
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
    computed : {
        countLBWorks : function() {
            return _.filter(this.lb_autocomplete, (item) => item.type == "work").length
        },
        countLBAuthors : function() {
            return _.filter(this.lb_autocomplete, (item) => item.type == "author").length
        }
    },
    methods : {
        connectionLabel : function(type) {
            return [
                "översättare",
                "skrifter av",
                "handlar om"
            ][Number(type) - 1]

        },
        

        

        onSubmit : async function(searchstr) {
            console.log("submit", searchstr)
            this.searchstr = searchstr
            this.$router.replace({query : {fras : searchstr}})
            // var {articles, works, suggestion} = await backend.search(searchstr)

            // let [lbAutocomplete] = await Promise.all([backend.autocomplete(searchstr)])
            let [{articles, works, suggestion}, lbAutocomplete] = await Promise.all([backend.search(searchstr), backend.autocomplete(searchstr)])

            // console.log("articles, works", articles, works, suggestion)
            this.articles = articles
            this.works = works
            this.suggestion = suggestion
            this.lb_autocomplete = lbAutocomplete



            // if(!articles.length && !works.length) {
            //     this.lb_autocomplete = await backend.autocomplete(searchstr)
            // }


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
