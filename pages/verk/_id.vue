<template>


    <div>
        <h2>{{work.TitleSwedish}}<span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span></h2>
        <ul>
            <li>{{work.Authors}}</li>
            <li>{{work.TitleSwedish}}<span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span> / PLACEHOLDER – {{work.PublishingHousePlace}} : {{work.PublishingHouseSwedish}}, {{work.PublishingYearSwedish}}</li>
            <li><ul>
                <li>Orginaltitel: {{work.TitleOriginal}}</li>
                <li>Orginalspråk: {{work.LanguageOriginal.data.LanguageName}}</li>
            </ul></li>
        </ul>
        <!-- <pre style="font-size:smaller">{{work | json}}</pre> -->
    </div>
</template>

<script>
    import axios from "axios"
    import backend from "assets/backend"

    export default {
        name : "Article",
        head () {
            return {
                // title : this.article.ArticleID + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error, payload}) {
            if(payload) {
                return { work : payload}
            }
            try {
                var work = await backend.getWork(params.id)
                console.log("work", work)
                return {work}
            } catch (e) {
                console.error(e)
            }
        }
    }
</script>