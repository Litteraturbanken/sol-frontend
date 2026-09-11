<template>
    <div class="colorlinks">
        <h2><span v-unsupported-chars="work.TitleSwedish"></span><span v-if="work.SubtitleSwedish">: {{work.SubtitleSwedish}}</span></h2>
        <work :work="work" :articles="articles"></work>
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

    import backend from "~/assets/backend"
    import work from "~/components/work.vue"

    export default defineNuxtComponent({
    fetchKey: () => 'pages/verk/[id].vue' + decodeURI(useRoute().path) + JSON.stringify(useRoute().query),
        name : "Work",
        setup() {
        usePageHead(data => {
            return {
                title: data.work?.TitleSwedish
            }

        })
        return {}
    },
        components : {
            work : work
        },
        async asyncData(nuxtApp) {
      const { params, error, payload } = pageContext(nuxtApp)
            if(payload) {
                return { work : payload }
            }
            try {
                var {work, articles} = await backend.getWork(params.id)
                // console.log("work", article, work)
                return {work, articles}
            } catch (e) {
                error({ statusCode: 404, message: "Verket kunde inte hittas." })
            }
        },
    })
</script>
