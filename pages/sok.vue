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
            <li v-for="article in articles" class="d-flex">
                <figure v-if="article.FileName">
                    <img class="mr-3 align-top" :src="'https://sol-admin.lb.se/assets/' + article.FileName"
                        onerror="this.style.display='none'">
                </figure>

                <div>
                    <nuxt-link :to="'/artiklar/' + article.URLName">{{article.ArticleName}}</nuxt-link>
                    <span v-if="article.TranslatorYearBirth"> ({{article.TranslatorYearBirth}}-{{article.TranslatorYearDeath}})</span>
                    <div class="articletype">{{articleTypeLabel(article.Type)}}</div>
                </div>
            </li>
        </ul>
        
    </section>
    <section class="bibliography" v-if="works.length">
        <h2>Verk</h2>
        <ul class="works resultlist">
            <li v-for="work in works">
                <div>
                    <nuxt-link class="work" :to="'/verk/' + work.id">{{work.TitleSwedish}} <span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span></nuxt-link><span v-if="work.PublishingYearSwedish">, {{work.PublishingYearSwedish}}</span>
                </div>
                <div><span v-if="work.Authors">{{work.Authors}}, </span> <em>{{connectionLabel(work.ConnectionType)}}:</em> {{work.Translator}} </div>
            </li>
        </ul>
    </section>
    <section v-if="lb_autocomplete && lb_autocomplete.length">
        <button class="btn btn-secondary btn-sm" @click="expand = !expand">Visa {{countLBAuthors}} författare och {{countLBWorks}} verk från Litteraturbankens samlingar</button>
        <ul class="works collapse resultlist" :class="{show : expand}">
            <li v-for="item in lb_autocomplete">
                <span v-if="item.type == 'author'">Författare: <a :href="item.url" >{{item.label}}</a></span>
                <span v-if="item.type == 'work'"> Verk: <a :href="item.url" >{{item.label}}</a></span>
            </li>
        </ul>
    </section>
  </section>
</template>

<style  scoped>
    .works li {
        margin-bottom: 1em;
    }
    .work {
        font-weight : bold;
    }
    input {
        padding-left: 0.4em;
    }
    .articles {
        columns: 200px 2;
        max-width : 60em;
    }
    .articles li {
        margin-bottom: 1em;
        break-inside: avoid;
    }
    .articles .articletype {
        font-size: 0.8rem;
    }
    .articles_section {
        margin-bottom: 2em;
    }
    .bibliography {
        max-width : 30em;
    }

    .search {
        position: relative;
    }
    .search .dropdown-menu {
        display : block;
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
    name: "Sok",
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
        articleTypeLabel(type) {
            return [
                "Översättare",
                "Översättarpris",
                "Förlag",
                "Temaartikel"
            ][Number(type) - 1]
        },
        connectionLabel(type) {
            return [
                "översättare",
                "handlar om",
                "författare",
                "referens till",
                "handlar om verket"
            ][Number(type) - 1]

        },

        onSubmit : async function(searchstr) {
            console.log("submit", searchstr)
            this.searchstr = searchstr
            this.$router.replace({query : {fras : searchstr}})
            
            let [{articles, works, suggestion, prizes}, lbAutocomplete] = await Promise.all([backend.search(searchstr), backend.autocomplete(searchstr)])

            this.articles = articles.concat(prizes)
            this.works = works
            this.suggestion = suggestion
            this.lb_autocomplete = lbAutocomplete
        }
    },
}

</script>
