<template>

  <section>


    <h2>Språk</h2>

    <p class="explain">
      Denna sida visar kopplingar mellan språk, verk och översättare i översättarlexikonet.
      <strong>Originalspråk</strong> listar språk och översättare utifrån originalverkens 
      språk. Eftersom verk kan vara andrahandsöversättningar visar dessa listor
      inte nödvändigtvis vilket språk översättaren har översatt från.
      <strong>Översatta från</strong> listar språk som översättningen har gjorts från. I denna vy
      ignoreras alltså originalspråket om det rör sig om en andrahandsöversättning.
      <strong>Översatta till</strong> listar de språk, utom svenska, som översatts till.
    </p>
    <div class="filters">
      <select v-model="langSelect" @change="onLangChange(langSelect)">
        <option value="">Alla språk</option>
        <option :value="lang" v-for="lang in langs">{{lang}}</option>
      </select>
      <select v-model="type" @change="onLangTypeChange(type)">
        <!-- <option value="">Alla språk</option> -->
        <option value="original">Originalspråk</option>
        <option value="fran">Översatta från</option>
        <option value="till">Översatta till</option>
      </select>

    </div>
    <!-- <h2>{{header}}</h2> -->

    <ul>
        <li v-for="(items, lang) in groups">
            <h2>{{lang}}</h2>
            <ul>
                <li class="row" v-for="item in items">
                  <div class="col-6">
                    <nuxt-link :to="'/artiklar/' + item.URLName">{{item.ArticleName}}</nuxt-link> <span v-if="item.TranslatorYearBirth"> ({{item.TranslatorYearBirth}}–{{item.TranslatorYearDeath}})</span>

                    – <nuxt-link class="sc" :to="getUrl(item, lang)">Verk</nuxt-link>
                  </div>
                  <!-- <div class="col-6 offset-12 lang-link"><nuxt-link :to="getUrl(item, lang)">Verk från {{lang.toLowerCase()}}</nuxt-link></div> -->
                </li>
            </ul>
        </li>
    </ul>

  </section>
</template>

<style lang="scss">
  h2 {
    // text-transform: capitalize;
  }
  .lang-link {
    text-align: right;
  }
  .to_bibl {

  }
  .explain {
    margin-bottom: 1em;
  }
  .filters {
    select:first-child {
      margin-right: 1em;
    }
    margin-bottom: 2em;
  }
</style>

<script>

import backend from "assets/backend"
var c = console
import _ from "lodash"



export default {
    name : "Languages",
    head () {
      return {title : "Språklista"}
    },
    data() {
      return {
        groups : null,
        langs : null,
        langSelect : "",
        type : "original"
      }
    },
    async asyncData ({error, env, params, redirect}) {
      if(!params.id) {
        redirect("/listor/sprak/original")
        return {groups: null}
      }
      try {
        let groupId = {original : "original", "fran": "source", till: "target"}[params.id]
        let groups = await backend.getLangs(groupId)
        return {groups : groups, langs: _.keys(groups), id : params.id} 
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
        return `/listor/avoversattare/${item.URLName}/${this.id}/${lang}`
      }
    }
}

</script>

