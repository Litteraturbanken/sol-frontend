<template>
    <div class="container">
        <h2>{{article.ArticleName}}<span v-if="article.TranslatorYearBirth">, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</span></h2>
        <figure v-if="article.Files && article.Files.length">
            <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + maybeFilename"
                onerror="this.style.display='none'">
            <figcaption>{{article.Files[0].Author}}</figcaption>
        </figure>
        <div v-html="article.ArticleText"></div>
        <div class="bibliography" v-if="works.length">
            <h3>Bibliografi</h3>
            <ul>
                <li v-for="item in connectionGroups">
                    <h2 v-if="item.type == 3">Om {{ article.ArticleName}}</h2>
                    <h2 v-if="item.type == 2">Skrifter av {{ article.ArticleName}}</h2>
                    <h2 v-if="item.type == 1">Översättningar i bokform</h2>
                    <ul>
                        <li v-for="work in item.works">
                            <a :href="'/verk/' + work.WorkID">{{work.TitleSwedish}}</a> <span v-if="work.Authors">/ {{work.Authors}}</span>
                        </li>
                    </ul>            
                    
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
    import backend from "assets/backend"
    export default {
        name : "Article",
        head () {
            return {
                title : this.article.ArticleName + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error, payload }) {
            if(payload) {
                return { article : payload }
            }
            try{
                var {article, works, connectionGroups} = await backend.getArticle(params.id)
                console.log("article", article, "works.length", works.length)
            } catch(err) {
                console.log("Article fetch error.")
                console.error(err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }

            return { article, works, connectionGroups }
        },
        computed : {
            maybeFilename : function() {
                if(this.article.Files && this.article.Files.length) {
                    return this.article.Files[0].FileName
                }
            }
        },
    }
</script>
