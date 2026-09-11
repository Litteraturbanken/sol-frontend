<template>
    <section class="row flex-column no-gutters colorlinks">
    <h2>Verk av <span v-unsupported-chars="$route.query.a"></span></h2>
        <ul class="col-md-7">
            <li v-for="work in works">
                <work :work="work" :articles="work.articles"></work>
            </li>
        </ul>
    </section>
</template>

<style lang="scss">
    .work {
        margin-bottom: 2em;
    }
</style>

<script>
    import backend from "~/assets/backend"
    import Work from "~/components/work.vue"
    export default defineNuxtComponent({
    fetchKey: () => 'pages/listor/avupphovsman.vue' + decodeURI(useRoute().path) + JSON.stringify(useRoute().query),
        name : "AvUpphovsman",
        components: {work : Work},
        setup() {
        usePageHead(data => {
            return {
                title : "Av upphovsman"
            }

        })
        return {}
    },
        async asyncData(nuxtApp) {
      const { params, error, route } = pageContext(nuxtApp)
            try{
                console.log("route.query.a", route.query.a)
                var works = await backend.getWorksByAuthorName(route.query.a)
            } catch(err) {
                console.error("Article fetch error.")
                console.error(err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { works }
        },
        computed : {

        }
    })
</script>
