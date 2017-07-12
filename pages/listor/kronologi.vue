<template>
  <section class="">
  kronologi
  <ul>
      <li v-for="article in articles">
          {{article.ArticleName}}
      </li>
  </ul>
  </section>
</template>

<script>

    import backend from "assets/backend"

    export default {
        name : "AvOversattare",
        head () {
            return {
                title : "Av översättare" + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error, route }) {
            let data = await backend.chronology("1983", "1990")

            console.log("data", data)
            return {articles : data}
        }
    }

</script>

<style>
</style>
