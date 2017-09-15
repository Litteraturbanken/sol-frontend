<template>
    <div class="row">
        <div class="article-text col-md-8">
            <h2>{{article.ArticleName}}<span v-if="article.TranslatorYearBirth">, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</span></h2>


            <figure >
                <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName"
                    onerror="this.style.display='none'">
                <!-- <img src="https://spraakbanken.gu.se/karp/data/sol/artikelfiler/Roland_Adlerberth7.jpg"
                    onerror="this.style.display='none'"> -->
                <!-- <figcaption>{{article.Files[0].Author}}</figcaption> -->
                <figcaption>{{article.FileAuthor}}</figcaption>
            </figure>
            
            <section v-html="article.ArticleText"></section>
            <p>
                <nuxt-link :to="'/medarbetare/' + article.ContributorFirstname + ' ' + article.ContributorLastname" rel="author">{{article.ContributorFirstname}} {{article.ContributorLastname}}</nuxt-link>
            </p>
        </div>

        
        <div class="bibliography col-md-4" v-if="works.length">
            <header>
                <h3>Bibliografi</h3>
                <div><nuxt-link :to="'/listor/avoversattare/' + $route.params.id">Gå till detaljerad bibliografi</nuxt-link></div>
            </header>
            <ul>
                <li v-for="item in connectionGroups">
                    <h3 v-if="item.type == 2">Om {{ article.ArticleName}}</h3>
                    <h3 v-if="item.type == 3">Skrifter av {{ article.ArticleName}}</h3>
                    <h3 v-if="item.type == 1">Översättningar i bokform</h3>
                    <ul>
                        <li v-for="work in item.works">
                            <nuxt-link class="work" :to="'/verk/' + work.WorkID">{{work.TitleSwedish}}</nuxt-link> <span v-if="work.Authors"> / {{work.Authors}}</span>
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
        margin-left : 1em;
    }
    figcaption {
        text-transform: uppercase;
        font-size: 0.6em;
        vertical-align: bottom;
        margin-top: 0.2em;
    }

    .container {
    }
    .article-text {
        max-width: 35em;
        h2:first-child {
            margin-top: 0;
        }

    }
    .bibliography {
        header {
            h3:first-child {
                margin-top: 0;
            }
            margin-bottom: 1.5rem;
        }
        margin-left: 1em;
        padding-left : 1.5em;
        border-left: 1px solid grey;
        font-size : 0.8em;

        h3 {
            font-size: 1.2rem;
            margin-top: 1.2rem;
        }

        .work {
            font-weight : 700;
        }
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
                // console.log("article", article, "works.length", works.length)
            } catch(err) {
                console.log("Article fetch error.")
                console.error(err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }

            return { article, works, connectionGroups }
        },
        computed : {
        },
    }
</script>
