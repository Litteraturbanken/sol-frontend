<template>
  <section class="">
  <h2>Tema</h2>
    <ul class="resultlist">
        <li v-for="item in items">
            <nuxt-link :to="'/artiklar/' + item.URLName">{{item.ArticleName}}</nuxt-link>
        </li>
    </ul>
  </section>
</template>

<script>
import backend from "assets/backend"

export default {
    name : "Themes",
    head : {
      title : "Temaartiklar – Svenskt översättarlexikon"
    },
    data() {
      return {
        items: null
      }
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

<style scoped>
  ul {
    columns: 270px 2;
    max-width: 840px;
  }
</style>
