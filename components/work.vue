<template>
    <div class="work">
        <ul>
            <li><strong>{{work.Authors}}</strong></li>
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
                <li v-if="work.TitleOriginal"><span class="sc">Originaltitel</span> {{work.TitleOriginal}}</li>
                <li v-if="work.LanguageOriginalName"><span class="sc">Orginalspråk</span> {{work.LanguageOriginalName}}</li>
                <li v-if="work.TitleSource">Titel på <span class="sc">källspråksutgåva</span> {{work.TitleSource}}</li>
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
                    }" v-html="work.RemarkContent + work.Remark"></div>
                </li>
            </ul></li>
            <li v-if="articles">
                <span class="sc">Översättare</span> 
                <ul class="ml-4">
                    <li v-for="article in articles">

                        <span v-if="article.URLName"><a :href="'/artiklar/' + article.URLName"> {{article.ArticleName}}</a> <a :href="'/avoversattare/' + article.URLName"> (bibliografi)</a></span>
                        <span v-if="!article.URLName"> {{article.ArticleName}}</span>
                        
                    </li>
                </ul>
            </li>
            <li>
                <ul>
                    <li v-if="!work.NotInLibris"><a class="sc" :href="'http://libris.kb.se/bib/' + work.LibrisID">Titeln i Libris</a></li>
                    <li v-if="work.Authors && $route.query.a != work.Authors"><a class="sc" :href='"/listor/avupphovsman/?a=" + work.Authors'>Andra verk av {{work.Authors}}</a></li>
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
        }
    }
</script>
