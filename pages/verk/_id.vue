<template>


    <div>
        <h2>{{work.TitleSwedish}}<span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span></h2>
        <work :work="work"></work>
        <!-- <pre style="font-size:smaller">{{work | json}}</pre> -->
    </div>
</template>

<style lang="scss" scoped>
    .work {
        max-width : 400px;
    }
    h2 {
        max-width : 600px;
    }

</style>

<script>
    
    import backend from "assets/backend"
    import work from "~/components/work.vue"

    export default {
        name : "Article",
        head () {
            return {
                // title : this.article.id
            }
        },
        components : {
            work : work
        },
        async asyncData ({ params, error, payload }) {
            if(payload) {
                return { work : payload }
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
