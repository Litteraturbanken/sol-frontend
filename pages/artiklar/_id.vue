<template>
    <section>
        <div class="row">
            <div class="article-text col-md-8">
                <h2>{{article.ArticleName}}<span v-if="article.TranslatorYearBirth">, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</span></h2>
        
        
                <figure >
                    <img :src="'https://ws.spraakbanken.gu.se/ws/sol/storage/uploads/' + article.FileName"
                        onerror="this.style.display='none'">
                    <!-- <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName"
                        onerror="this.style.display='none'"> -->
                    <!-- <img src="https://spraakbanken.gu.se/karp/data/sol/artikelfiler/Roland_Adlerberth7.jpg"
                        onerror="this.style.display='none'"> -->
                    <!-- <figcaption>{{article.Files[0].Author}}</figcaption> -->
                    <figcaption v-html="article.FileAuthor"></figcaption>
                </figure>
                
                <section v-html="article.ArticleText"></section>
                <div class="mt-4">
                    <nuxt-link :to="'/medarbetare/' + mainContributor.URLName" rel="author">{{mainContributor.FirstName}} {{mainContributor.LastName}}</nuxt-link>
                </div>
            </div>
        
            
            <div class="bibliography col-md-4" v-if="works.length">
                <header>
                    <h3>Bibliografi</h3>
                    <div><nuxt-link class="detailed" :to="'/listor/avoversattare/' + $route.params.id">Gå till detaljerad bibliografi</nuxt-link></div>
                </header>
                <ul>
                    <li v-for="item in connectionGroups">
                        <h3 v-if="item.type == 2">Om {{ article.ArticleName}}</h3>
                        <h3 v-else-if="item.type == 3">Skrifter av {{ article.ArticleName}}</h3>
                        <h3 v-else-if="item.type == 4">Referenser</h3>
                        <h3 v-else-if="item.type == 5">I artikeln omnämnda verk</h3>
                        <ul v-if="[2,3,4,5].includes(item.type)">
                            <li v-for="work in item.works">
                                <nuxt-link class="work" :to="'/verk/' + work.id">{{work.TitleSwedish}}</nuxt-link> <span v-if="work.Authors"> / {{work.Authors}}</span>
                            </li>
                        </ul>

                        
                        
                        <template v-else-if="item.type == 1">
                            <h3>Översättningar i bokform</h3>
                            

                            <div v-for="obj in biblTypeGroups">
                                <h4 v-if="obj.type != 1">{{getBiblTypeName(obj.type)}}</h4>
                                <ul>
                                    <li v-for="work in obj.works">
                                        <nuxt-link class="work" :to="'/verk/' + work.id">{{work.TitleSwedish}}</nuxt-link> <span v-if="work.Authors"> / {{work.Authors}}</span>
                                    </li>
                                </ul>
                            </div>
                        </template>
                    </li>
                </ul>
                <template v-if="links.length">
                    <h3>Externa länkar</h3>
                    <ul>
                        <li v-for="link in links">
                            <a :href="link.ArticleLinkURL">{{link.ArticleLinkTitle}}</a>
                        </li>
                    </ul>
                </template>
            </div>
        </div>
        <div class="prizewinners row flex-column no-gutters" v-if="prizewinners">
            <h3>Prisvinnare</h3>
            <ul>
                <li v-for="article in prizewinners">
    
                    <nuxt-link v-if="article.ArticleName" :to="'/artiklar/' + encodeURIComponent(article.URLName)">{{article.Year}} {{article.PrizeWinner}}</nuxt-link>
                    
                    <span v-if="!article.ArticleName">{{article.Year}} {{article.PrizeWinner}}</span>
                </li>
            </ul>
        </div>
    </section>
</template>

<style lang="scss" scoped>
    figure {
        float : right;
        margin-left : 1em;
    }
    img {
        border: 1px solid white;
    }
    figcaption {
        text-transform: uppercase;
        font-size: 0.5em;
        vertical-align: bottom;
        margin-top: 0.8em;
        max-width: 200px;
    }

    .container {
    }
    .article-text {
        max-width: 35em;
        h2:first-child {
            margin-top: 0;
        }
        margin-bottom: 2em;

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
        border-left: 1px solid white;
        font-size : 0.8em;

        h3 {
            font-size: 1.2rem;
            margin-top: 1.2rem;
        }

        h4 {
            font-size: 1.2rem;
            margin-top: 1em;
            font-weight: normal;
        }

        .work {
            font-weight : 700;
        }
    }
    .prizewinners {
        margin-top: 2em;
        ul {
            columns: 250px 2;
        }
        li span {
            color : grey;
        }
    }

    @media only screen and (max-width: 987px) {
        .bibliography {
            border: none;
            padding-left: 15px;
            margin-left: 0;
        }
    }


</style>

<script>
    import backend from "assets/backend"
    export default {
        name : "Article",
        head () {
            if(!this.article) {
                return
            }
            return {
                title : this.article.ArticleName
            }
        },
        data () {
            return {
                article : {},
                prizewinners : null,
                biblTypeGroups : null,
                biblTypeData : null,
                connectionGroups : null,
                works : [],
                links : null
            }
        },
        async asyncData ({ params, error, payload, from }) {
            if(payload) {
                return payload
            }
            try{
                let article = await backend.getArticle(params.id)
                console.log("article", article)
                return article
                // console.log("article", article, "works.length", works.length)
            } catch(err) {
                console.log("Article fetch error.")
                console.error(err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }

        },
        computed : {
            mainContributor : function() {
                if(!this.contributor || !this.contributor.length) return {} 
                return this.contributor[0]
            }
        },
        methods : {
            getBiblTypeName(type) {
                return this.biblTypeData[String(type)][0].BibliographyTypeName
            }
        }
    }
</script>
