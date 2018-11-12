<template>
    <div class="work">
        <ul>
            <li><strong v-unsupported-chars="work.Authors"></strong></li>
            <li>
                <div>
                    <span>{{work.TitleSwedish}} </span>
                     <span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}} </span>
                     <span v-if="getCreatorRole"> / {{getCreatorRole}}</span>
                     <span v-if="work.PublishingHousePlace"> – {{work.PublishingHousePlace}} : {{work.PublishingHouseSwedish}}, </span>
                     <span>{{work.PublishingYearSwedish}}</span><span v-if="work.SerialTitle">. – ({{work.SerialTitle}})</span>

                </div>
            </li>
            <li><ul>
                <li v-if="work.RemarkManuscript">{{work.RemarkManuscript}}</li>
                <li v-if="work.TitleOriginal"><span class="sc">Originaltitel</span> <span v-unsupported-chars="work.TitleOriginal"></span></li>
                <li v-if="work.LanguageOriginalName"><span class="sc">Orginalspråk</span> {{work.LanguageOriginalName}}</li>
                <li v-if="work.VariantTitle"><span class="sc">Varianttitel</span> {{work.VariantTitle}}</li>
                <li v-if="work.TitleSource"><span class="sc">Titel på källspråksutgåva</span> {{work.TitleSource}}</li>
                <li v-if="work.LanguageSourceName"><span class="sc">Källtitelns språk</span> {{work.LanguageSourceName}}</li>
                
                <li v-if="work.PublishingYearOriginal"><span class="sc">Utgivnings- eller tillkomstår för original</span> {{work.PublishingYearOriginal}}</li>
                <li v-if="work.Publishings"><span class="sc">Nya upplagor</span> {{work.Publishings}}</li>
                <li v-if="work.PublishingYearSource"><span class="sc">Utgivningsår för källspråksutgåva</span> {{work.PublishingYearSource}}</li>
                <li v-if="work.PartOf_Title"><span class="sc">Ingår i</span> {{work.PartOf_Title}}<span v-if="work.PartOf_Localization">. – {{work.PartOf_Localization}}</span></li>

                <li v-if="work.RemarkContent || work.Remark" >
                    <span class="sc" v-if="work.RemarkContent" >Innehåll </span> 
                    <div :class="{
                        'ml-4': (work.RemarkContent + work.Remark).length > 150,
                        'd-inline-block': (work.RemarkContent + work.Remark).length <= 150,
                    }">
                        <div v-html="work.RemarkContent"></div>
                        <div v-html="work.Remark"></div>
                    </div>
                </li>
            </ul></li>
            <li>
                <ul class="lower">
                    <li v-if="work.Authors && $route.query.a != work.Authors"><nuxt-link class="sc" :to='"/listor/avupphovsman/?a=" + work.Authors'>Andra verk av <span v-unsupported-chars="work.Authors"></span></nuxt-link></li>
                    <li v-if="!work.NotInLibris"><a class="sc" :href="'http://libris.kb.se/bib/' + work.LibrisID">Titeln i Libris</a></li>
                    <li v-if="articles">
                        <ul>
                            <li v-for="article in articles">
                                <span class="sc">{{connectionLabel(article.ConnectionType)}}</span> 

                                <span v-if="article.URLName"><nuxt-link :to="'/artiklar/' + article.URLName"> {{article.ArticleName}}</nuxt-link> <nuxt-link :to="'/listor/avoversattare/' + article.URLName"> (bibliografi)</nuxt-link></span>
                                <span v-if="!article.URLName"> {{article.ArticleName}}</span>
                                
                            </li>
                        </ul>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</template>

<style lang="scss">
    .work > ul > li {
        line-height : 1.3;
    }
    .more-info {
        
    }
    h3 {
        font-size: 1.2rem;
    }
    .lower {
        // margin-left: 1em;
        padding-left: 0.7em;
        position: relative;
        &:before {
            border-left: 1px solid #618296;
            content: "";
            position: absolute;
            height : 75%;
            left: 0;
            top: 13%;
        }
        
    }
</style>

<script>
    // import {getLang} from "~assets/typeMappings"
    export default {
        // methods: {
        //     getLang
        // },
        props : ["work", "articles"],
        // data() {
        //     return {

        //     }
        // }
        computed : {
            getCreatorRole : function() {
                return this.work.CreatorRole
            }
        },
        methods: {
            connectionLabel(type) {
                return [
                    "översättare",
                    "handlar om",
                    "författare",
                    "referens till",
                    "handlar om verket"
                ][Number(type) - 1]

            }
        }
    }
</script>
