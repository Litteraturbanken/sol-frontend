<template>
  <section class="">
    <input v-model="filterstr">
    <ul><li v-for="(items, letter) in groups">
        <h2>{{letter}}</h2>
        <ul><li v-for="item in items" v-if="!filterstr || item.ArticleID.toLowerCase().includes(filterstr.toLowerCase())">
            <a :href="'/artiklar/' + item.Metadata.URLName">{{item.ArticleID}}</a>
        </li></ul>
    </li></ul>
  </section>
</template>

<script>
import axios from "axios"
import _ from "lodash"
import backend from "assets/model"
var c = console

export default {
  // components: {
  //   Logo
  // }
  name : "ArticleList",
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

  }
}

</script>