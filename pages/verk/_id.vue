<template>
    <div class="colorlinks">
        <h2>{{work.TitleSwedish}}<span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span></h2>
        <work :work="work" :article="article"></work>
        <!-- <pre style="font-size:smaller">{{work | json}}</pre> -->
    </div>
</template>

<style lang="scss" scoped>
    .work {
        max-width : 500px;
    }
    h2 {
        max-width : 600px;
    }

</style>

<script>
    
    import backend from "assets/backend"
    import work from "~/components/work.vue"

    export default {
        name : "Work",
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
                var {work, article} = await backend.getWork(params.id)
                // console.log("work", article, work)
                return {work, article}
            } catch (e) {
                console.error(e)
            }
        }
    }
</script>
