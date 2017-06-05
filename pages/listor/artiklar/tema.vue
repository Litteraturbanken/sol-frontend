<template>
  <section class="">
  <h1>Tema</h1>
    <ul>
        <li v-for="item in items">
            <a :href="'/artiklar/' + item.Metadata.URLName">{{item.ArticleID}}</a>
        </li>
    </ul>
  </section>
</template>

<script>
import axios from "axios"
import backend from "assets/backend"
var c = console




export default {
    name : "Themes",
    head : {
      title : "Tema"
    },
    async asyncData ({error, env}) {
      try {
        return {items : await backend.listThemeArticles()} 
      } catch(err) {
        console.log("err", err)
        error("Ett fel uppstod, vänligen försök igen senare.")
        return {items : null}
      }
    },
}

    
</script>

<style>
</style>
