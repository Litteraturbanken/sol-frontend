<template>
    <section>
        <div class="row">
            <div class="article-text col-md-8">
                <h2>{{article.ArticleName}}<span v-if="article.TranslatorYearBirth">, {{article.TranslatorYearBirth}}–{{article.TranslatorYearDeath}}</span></h2>

                <p class="redirected" v-if="isRedirected">(Omdirigerad från {{redirectedName}})</p>
        
        
                <figure >
                    <img :src="'https://ws.spraakbanken.gu.se/ws/sol/storage/uploads/' + article.FileName"
                        onerror="this.style.display='none'">
                    <!-- <img :src="'https://spraakbanken.gu.se/karp/data/sol/artikelfiler/' + article.FileName"
                        onerror="this.style.display='none'"> -->
                    <!-- <img src="https://spraakbanken.gu.se/karp/data/sol/artikelfiler/Roland_Adlerberth7.jpg"
                        onerror="this.style.display='none'"> -->
                    <!-- <figcaption>{{article.Files[0].Author}}</figcaption> -->
                    <figcaption v-html="article.FileDescription"></figcaption>
                </figure>
                
                <section class="textbody" v-html="article.ArticleText"></section>
                <p class="mt-4">
                    <nuxt-link :to="'/medarbetare/' + mainContributor.URLName" rel="author">{{mainContributor.FirstName}} {{mainContributor.LastName}}</nuxt-link>
                </p>

                <section class="awarded colorlinks" v-if="prizes.length">
                    <h3>Tilldelade översättarpriser</h3>
                    <ul>
                        <li v-for="item in prizes">
                            {{item.Year}} <nuxt-link :to="'/artiklar/' + item.URLName">{{item.Prize}}</nuxt-link>
                        </li>
                    </ul>
                </section>

            </div>
        
            
            <div class="bibliography col" v-if="works.length">
                <header>
                    <h3>Bibliografi</h3>

                    <div class="detailed"><nuxt-link  :to="'/listor/' + biblLink +'/' + actualId">Gå till detaljerad bibliografi</nuxt-link></div>
                    <div class="sort colorlinks">
                        <span class="sc">Sortera på</span> 
                        <a @click="onSortChange('RealYear')">År</a>
                        <a @click="onSortChange('Authors')">Författare</a>
                        <a @click="onSortChange('TitleSwedish')">Titel</a>
                    </div>

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
                            <a v-if="link.ArticleLinkURL.match('^(http|https)')" :href="link.ArticleLinkURL">{{link.ArticleLinkTitle}}</a>
                            <nuxt-link v-else :to="link.ArticleLinkURL">{{link.ArticleLinkTitle}}</nuxt-link>
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
        image-orientation : 0deg;
    }
    figcaption {
        font-size: 0.7em;
        vertical-align: bottom;
        margin-top: 0.5em;
        max-width: 200px;
        color: lighten(#333, 15%)
    }
    .redirected {
        font-size: 0.7em;
        margin-top: -17px;
        margin-bottom: 1em;
    }
    .container {
    }
    .article-text {
        max-width: 35em;
        // margin-right: ;
        h2:first-child {
            margin-top: 0;
        }
        margin-bottom: 2em;

    }
    .awarded {
        margin-top: 2em;
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

        h4 {
            font-size: 1.2rem;
            margin-top: 1em;
            font-weight: normal;
            text-transform: unset;
        }

        .work {
            font-weight : 700;
        }
    }
    .prizewinners {
        ul {
            columns: 250px 2;
        }
        li span {
            color : grey;
        }
    }

    .detailed {
        margin-bottom: 1em;
    }
    .sort {
        a {
            color : $primary_color;
            cursor: pointer;
            margin-left: 1em;
        }
    }

    @media only screen and (max-width: 991px) {
        .bibliography {
            border: none;
            padding-left: 15px;
            margin-left: 0;
        }
    }


</style>

<script>
    import backend from "assets/backend"
    import {naturalSort} from "assets/utils"

    let redirects = {
        "Ann-Sofi_Rein" : "Ann-Sofi_Rein_och_Sten_Rein",
        "Sten_Rein" : "Ann-Sofi_Rein_och_Sten_Rein",
        "Lisbeth_Renner" : "Lisbeth_och_Louis_Renner",
        "Louis_Renner" : "Lisbeth_och_Louis_Renner",
        "Ivo_Iliste" : "Ivo_Iliste_och_Birgitta_Göranson_Iliste",
    }


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
                connectionGroups : [],
                works : [],
                links : null,
                prizes : null, 
                isRedirected : false,
                redirectedName : "",
                sortBy: "RealYear"
            }
        },
        async asyncData ({ params, error, payload, from }) {
            if(payload) {
                return payload
            }

            try{
                // let article = await backend.getArticle(redirects[params.id] || params.id)
                let data = await backend.getArticle(params.id)
                let isRedirected = !!data.article.RedirectToArticle
                if(isRedirected) {
                    var redirectedName = data.article.ArticleName
                    data = await backend.getArticle(data.article.RedirectToArticle)
                }
                return {...data, isRedirected, redirectedName}
                // console.log("article", article, "works.length", works.length)
            } catch(err) {
                console.log("Article fetch error.")
                console.error(err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }

        },
        computed : {
            actualId() {
                return redirects[this.$route.params.id] || this.$route.params.id
            },
            mainContributor : function() {
                if(!this.contributors || !this.contributors.length) return {} 
                return this.contributors[0]
            },
            biblLink : function() {
                return this.article.Type == 1 ? "avoversattare" : "bibliografi"
            },
        },
        methods : {
            onSortChange(sortVal) {
                function sortGroups(group) {
                    for(let {works} of group) {
                        naturalSort(works, sortVal)
                    }
                }
                sortGroups(this.connectionGroups)
                sortGroups(this.biblTypeGroups)

            },
            getBiblTypeName(type) {
                return this.biblTypeData[String(type)][0].BibliographyTypeName
            },
            orderBy(works) {
                return _.orderBy(works, this.sortBy)
            }
        }
    }
</script>
