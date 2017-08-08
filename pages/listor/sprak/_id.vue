<template>

  <section>
    <h1>{{header}}</h1>
    <ul>
        <li v-for="(items, lang) in groups">
            <h2>{{lang}}</h2>
            <ul>
                <li class="row" v-for="item in items">
                  <div class="col-6">
                    <a :href="'/artiklar/' + item.URLName">{{item.ArticleName}}</a> <span v-if="item.TranslatorYearBirth"> ({{item.TranslatorYearBirth}}–{{item.TranslatorYearDeath}})</span>
                  </div>
                  <div class="col-6 offset-12 lang-link"><a :href="getUrl(item, lang)">Verk från {{lang.toLowerCase()}}</a></div>
                </li>
            </ul>
        </li>
    </ul>
  </section>
</template>

<style lang="scss">
  h2 {
    text-transform: capitalize;
  }
  .lang-link {
    text-align: right;
  }
</style>

<script>

import backend from "assets/backend"
var c = console



export default {
    name : "Languages",
    head () {
      return {title : "Språklista"}
    },
    async asyncData ({error, env, params, redirect}) {
      if(!params.id) {
        redirect("/listor/sprak/original")
        return {groups: null}
      }
      try {
        let groupId = {original : "original", "fran": "source", till: "target"}[params.id]
        return {groups : await backend.getLangs(groupId), id : params.id} 
      } catch(err) {
        console.log("err", err)
        error("Ett fel uppstod, vänligen försök igen senare.")
        return {groups : null}
      }
    },
    computed : {
      header : function() {
        return {
          "original" : "Originalspråk",
          "fran" : "Språk, översatta från",
          "till" : "Språk, översatta till",
        }[this.id]
      }
    },
    methods : {
      getUrl : function(item, lang) {
        return `/listor/avoversattare/${item.URLName}?lt=${this.id}&l=/${lang}`
      }
    }
}

</script>

