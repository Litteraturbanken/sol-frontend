<template>
    <div class="work row">
        <ul class="col-md-7">
            <li class=""><strong>{{work.Authors}}</strong></li>
            <li class="row col-md-12">
                <div>
                    <span>{{work.TitleSwedish}} </span> <span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}} </span> <span v-if="getCreatorRole"> / {{getCreatorRole}}</span><span v-if="work.PublishingHousePlace"> – {{work.PublishingHousePlace}} : {{work.PublishingHouseSwedish}}, </span> {{work.PublishingYearSwedish}}<span v-if="work.SerialTitle">. – ({{work.SerialTitle}})</span>
                </div>
            </li>
            <li><ul>
                <li v-if="work.TitleOriginal"><span class="sc">Orginaltitel</span> {{work.TitleOriginal}}</li>
                <li v-if="work.LanguageOriginalName"><span class="sc">Orginalspråk</span> {{work.LanguageOriginalName}}</li>
                <li v-if="work.TitleSource">Titel på <span class="sc">källspråksutgåva</span> {{work.TitleSource}}</li>
                <li v-if="work.LanguageSourceName"><span class="sc">Källtitelns språk</span> {{work.LanguageSourceName}}</li>
                
                <li v-if="work.PublishingYearOriginal"><span class="sc">Utgivnings/tillkomstår för original</span> {{work.PublishingYearOriginal}}</li>
                <li v-if="work.PublishingYearSource"><span class="sc">Utgivningsår för källspråksutgåva</span> {{work.PublishingYearSource}}</li>
                <li v-if="work.PartOf_Title"><span class="sc">Ingår i</span> {{work.PartOf_Title}}<span v-if="work.PartOf_Localization">. – {{work.PartOf_Localization}}</span></li>
            </ul></li>
            <li>
                <ul>
                    <li v-if="!work.NotInLibris"><a class="sc" :href="'http://libris.kb.se/bib/' + work.LibrisID">Titeln i Libris</a></li>
                    <li><a class="sc" :href='"/listor/avupphovsman/?a=" + work.Authors'>Andra verk av {{work.Authors}}</a></li>
                </ul>
            </li>
        </ul>
        <!-- <div class="more-info col-md-5">
            <h3>Mer information</h3>
            <ul>
                <li><a :href='"/listor/avupphovsman/?a=" + work.Authors'>Andra verk av {{work.Authors}}</a></li>
                <li v-if="!work.NotInLibris"><a :href="'http://libris.kb.se/bib/' + work.LibrisID">Titeln i Libris</a></li>
            </ul>
        </div> -->
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
        props : ["work"],
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
