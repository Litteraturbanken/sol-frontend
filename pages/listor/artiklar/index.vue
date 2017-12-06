<template>
  <section class="">
    <input  v-focus class="col-4" placeholder="Sök" v-model="filterstr">
    <ul class="resultlist col-12"><li v-for="(items, letter) in groups" v-if="letterHasVisibleArticle(letter)">
        <h2>{{letter}}</h2>
        <ul class="inner"><li v-for="item in items" v-if="!filterstr || isFilterInArticle(item)">
            <nuxt-link :to="'/artiklar/' + item.URLName">{{item.ArticleName}} </nuxt-link>
            <!-- <a :href="'/artiklar/' + item.URLName">{{item.ArticleName}} </a> -->
            <span v-if="item.TranslatorYearBirth">{{item.TranslatorYearBirth}}–{{item.TranslatorYearDeath}}</span>
        </li></ul>
    </li></ul>
  </section>
</template>

<style scoped>
  input {
    margin-left: 15px;
    width: 200px;
    font-variant: small-caps;
    text-transform: lowercase;
    font-size: 14px;
  }
  .inner {
    max-width: 740px;
    columns: 250px 2;
    column-gap: 55px;
  }
</style>

<script>
// import _ from "lodash"
import backend from "assets/backend"

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
      let groups = await backend.listArticles()
      return {groups : groups} 
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
      let str = this.filterstr.toLowerCase()

      if(str.length == 1) {
        let name = item.TranslatorLastname || item.ArticleName
        return name[0].toLowerCase() == str
      } else {
        return item.ArticleName.toLowerCase().includes(str)
      }

    },
    letterHasVisibleArticle : function(letter) {
      return this.groups[letter].filter( (item) => {
          return this.isFilterInArticle(item)
      }).length
    }
  }
}

</script>
