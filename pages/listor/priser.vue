<template>
  <section class="">
    <h2>Priser för översättare</h2>
    <ul class="resultlist">
        <li v-for="item in items">
            <a :href="'/artiklar/' + item.URLName">{{item.ArticleName}}</a>
        </li>
    </ul>
  </section>
</template>

<script>

import backend from "assets/backend"


export default {
    name : "Prizes",
    head : {
      title : "Priser"
    },
    async asyncData ({error, env}) {
      try {
        return {items : await backend.listPrizeArticles()} 
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
