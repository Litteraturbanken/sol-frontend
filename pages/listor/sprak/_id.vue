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
      <select v-model="type" @change="onLangTypeChange(type)">
        <!-- <option value="">Alla språk</option> -->
        <option value="original">Originalspråk</option>
        <option value="fran">Översatta från</option>
        <option value="till">Översatta till</option>
      </select>
      <select v-model="langSelect" @change="onLangChange(langSelect)">
        <option value="">Alla språk</option>
        <option :value="lang" v-for="lang in langs" v-if="lang != 'Flera språk'">{{lang}}</option>
      </select>

    </div>
    <!-- <h2>{{header}}</h2> -->

    <ul class="results resultlist">
        <li v-for="(items, lang) in groups" >
            <h2>{{lang}}</h2>
            <ul :class="{'few': items.length < 6}">
                <li class="" v-for="item in items">
                  <div class="">
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

<style lang="scss" scoped>
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
  .results {
    & > li {
      // -webkit-column-break-inside: avoid;
    }

    ul:not(.few) {
      columns: 250px 2;
    }
  }

  @media only screen and (max-width: 800px) {
      .results ul {
          columns: unset;
      }
  }

</style>

<script>

import backend from "assets/backend"
import _ from "lodash"



export default {
    name : "Languages",
    head () {
      let title = "Språklista"
      if(this.langSelect) {
        title = "Språk: " + this.langSelect
      }
      return {
        title : `${title} – Svenskt översättarlexikon`
      }
    },
    data() {
      console.log("lang data init")
      // let params = document.location.search()

      // let lang = params.get("l")
      // console.log("data", arguments)
      return {
        groups : null,
        langs : null,
        langSelect : "",
        type : "original",
      }
    },
    async asyncData ({error, env, params, redirect, route}) {
      console.log("lang asyncData", params, route.query, route)

      var langSelect = params.lang || ""
      if(params.id) {
        var type = params.id
      }
      if(!type) {
        redirect("/listor/sprak/original")
        return {groups: null}
      }
      try {
        let groupId = {original : "original", "fran": "source", till: "target"}[type]
        let data = await backend.getLangs(groupId, langSelect)
        let groups = data[groupId]
        let langs = data.languages
        if(langSelect && !groups[langSelect]) {
          console.log("reset langSelect", langSelect)
          // langSelect = ""
          redirect("/listor/sprak/" + type)
          return {groups: null}
        }
        return {
          groups : groups, 
          langs,
          type, 
          langSelect
        } 
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
        }[this.type]
      }
    },
    methods : {
      // getFilteredArticles(lang) {
      //   if(!lang) {
      //     return this.groups
      //   } else {
      //     return {[lang]: this.groups[lang]}
      //   }

      // },
      getUrl : function(item, lang) {
        return `/listor/avoversattare/${item.URLName}/${this.type}/${lang}`
      },
      onLangChange : function(lang) {
        // this.$router.push({query: {l: lang || null}})
        this.$router.push({path: `/listor/sprak/${this.type}/${lang}`})
      },
      onLangTypeChange : function(type) {
        let path = _.compact([`/listor/sprak/${type}`, this.langSelect]).join("/")
        this.$router.push({path})
      }
    }
}

</script>

