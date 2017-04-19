<template>
    <div>
        <!-- <div v-html="article.TextIngress"></div> -->
        <div v-html="article.TextLong"></div>
    </div>
</template>

<script>
    import axios from "axios"
    import backend from "assets/model"
    export default {
        name : "Article",
        async asyncData ({ params, error }) {
            try{
                var article = await backend.getArticle(params.id)
            }
            catch(err) {
                console.log("Article fetch error.")
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { article }
          }
    }
</script>