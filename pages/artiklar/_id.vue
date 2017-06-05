<template>
    <div class="container">
        <h2>{{article.ArticleName}}<span v-if="article.TranslatorYearBirth">, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</span></h2>
        <figure v-if="article.Files && article.Files.length">
            <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + maybeFilename"
                onerror="this.style.display='none'">
            <figcaption>{{article.Files[0].Author}}</figcaption>
        </figure>
        <div v-html="article.ArticleText"></div>
        <div class="bibliography" v-if="article.Works.data.length">
            <h3>Bibliografi</h3>
            <ul>
                <li v-for="work in article.Works.data">
                    <a :href="'/verk/' + work.WorkID">{{work.TitleSwedish}}</a>
                </li>
            </ul>            
        </div>
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
    import backend from "assets/backend"
    export default {
        name : "Article",
        head () {
            return {
                title : this.article.ArticleID + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error, payload}) {
            if(payload) {
                return { article : payload}
            }
            try{
                var article = await backend.getArticle(params.id)
                console.log("article", article)
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