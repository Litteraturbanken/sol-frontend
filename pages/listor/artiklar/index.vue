<template>
  <section class="">
    <input v-model="filterstr">
    <ul><li v-for="(items, letter) in groups" v-if="letterHasVisibleArticle(letter)">
        <h2>{{letter}}</h2>
        <ul><li v-for="item in items" v-if="!filterstr || isFilterInArticle(item)">
            <a :href="'/artiklar/' + item.Metadata.URLName">{{item.ArticleID}}</a>
        </li></ul>
    </li></ul>
  </section>
</template>

<script>
import _ from "lodash"
import backend from "assets/model"
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
      error("Ett fel uppstod, vänligen försök igen senare.")
      return {groups : null}
    }
  },
  computed : {

  },
  methods : {
    isFilterInArticle: function(item) {
      return item.ArticleID.toLowerCase().includes(this.filterstr.toLowerCase())
    },
    letterHasVisibleArticle : function(letter) {
      return this.groups[letter].filter( (item) => {
          return this.isFilterInArticle(item)
      }).length
    }
  }
}

</script>