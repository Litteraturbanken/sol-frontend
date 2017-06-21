<template>
    <div class="work row">
        <ul class="col-md-7">
            <li>{{work.Authors}}</li>
            <li class="row col-md-12">
                <div>
                    <span>{{work.TitleSwedish}} </span> <span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}} </span> <span v-if="getCreatorRole"> / {{getCreatorRole}}</span><span v-if="work.PublishingHousePlace"> – {{work.PublishingHousePlace}} : {{work.PublishingHouseSwedish}}, </span> {{work.PublishingYearSwedish}}
                </div>
            </li>
            <li><ul>
                <li v-if="work.TitleOriginal">Orginaltitel: {{work.TitleOriginal}}</li>
                <li v-if="work.LanguageOriginalName">Orginalspråk: {{work.LanguageOriginalName}}</li>
                <li v-if="work.TitleSource">Titel på källspråksutgåva: {{work.TitleSource}}</li>
                <li v-if="work.LanguageSourceName">Källtitelns språk: {{work.LanguageSourceName}}</li>
                
                <li v-if="work.PublishingYearOriginal">Utgivnings/tillkomstår för original: {{work.PublishingYearOriginal}}</li>
                <li v-if="work.PublishingYearSource">Utgivningsår för källspråksutgåva: {{work.PublishingYearSource}}</li>
                <li v-if="work.PartOf_Title">Ingår i: {{work.PartOf_Title}}</li>
            </ul></li>
        </ul>
        <!-- <pre style="font-size:smaller">{{work | json}}</pre> -->
        <div class="more-info col-md-5">
            <h3>Mer information</h3>
            <ul>
                <li><a :href='"/listor/avupphovsman/?a=" + work.Authors'>Andra verk av {{work.Authors}}</a></li>
                <li v-if="!work.NotInLibris"><a :href="'http://libris.kb.se/bib/' + work.LibrisID">Titeln i Libris</a></li>
            </ul>
        </div>
    </div>
</template>

<style lang="scss">
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
