<template>
  <section class="">
    <input class="col-4" placeholder="Sök" v-model="filterstr">
    <ul class="col-12"><li v-for="(items, letter) in groups" v-if="letterHasVisibleArticle(letter)">
        <h2>{{letter}}</h2>
        <ul><li v-for="item in items" v-if="!filterstr || isFilterInArticle(item)">
            <a :href="'/artiklar/' + item.URLName">{{item.ArticleName}} </a>
            <span v-if="item.TranslatorYearBirth">{{item.TranslatorYearBirth}}–{{item.TranslatorYearDeath}}</span>
        </li></ul>
    </li></ul>
  </section>
</template>

<script>
import _ from "lodash"
import backend from "assets/backend"
var c = console

export default {
  name : "ArticleList",
  head : {
      title : "Alla artiklar – Svenskt översättarlexikon",
      meta : [{
        vmid : "description", name: "description", content : "Alla artiklar – Svenskt översättarlexikon",
      }]
  },
  data() {
    return {
      filterstr : ""
    }
  },
  async asyncData ({error, env}) {
    try {
      return {groups : await backend.listArticles()} 
    } catch(err) {
      console.error(err)
      error("Ett fel uppstod, vänligen försök igen senare.")
      return {groups : null}
    }
  },
  computed : {

  },
  methods : {
    isFilterInArticle: function(item) {
      return item.ArticleName.toLowerCase().includes(this.filterstr.toLowerCase())
    },
    letterHasVisibleArticle : function(letter) {
      return this.groups[letter].filter( (item) => {
          return this.isFilterInArticle(item)
      }).length
    }
  }
}

</script>