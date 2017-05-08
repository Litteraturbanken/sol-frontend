<template>
    <div class="container">
        <figure v-if="article.Files && article.Files.length">
            <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + maybeFilename"
                onerror="this.style.display='none'">
            <figcaption>{{article.Files[0].Author}}</figcaption>
        </figure>
        <div v-html="article.TextLong"></div>
    </div>
</template>

<style lang="scss">
    figure {
        float : right;
        margin-left : 0.5em;
    }

    .container {
        max-width: 40em;
    }
</style>

<script>
    import axios from "axios"
    import backend from "assets/model"
    export default {
        name : "Article",
        head () {
            return {
                title : this.article.ArticleID + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error }) {
            try{
                var article = await backend.getArticle(params.id)
            }
            catch(err) {
                console.log("Article fetch error.")
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { article }
        },
        computed : {
            maybeFilename : function() {
                if(this.article.Files && this.article.Files.length) 
                    return this.article.Files[0].FileName
            }

        }
    }
</script>