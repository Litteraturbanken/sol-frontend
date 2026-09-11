<template>
    <section>
        <h2>Översättarlexikonets artikelförfattare</h2>
        <ul class="resultlist">
            <li v-for="contributor in contributors">
                <!-- <a :href="'/medarbetare/' + encodeURIComponent(contributor.FirstName) + ' ' + encodeURIComponent(contributor.LastName)">{{contributor.FirstName}} {{contributor.LastName}}</a> -->
                <nuxt-link :to="'/medarbetare/' + contributor.URLName">{{contributor.FirstName}} {{contributor.LastName}}</nuxt-link>
            </li>
        </ul>
    </section>
</template>

<style lang="scss" scoped>
    ul {
        columns: 3 300px;
    }
</style>

<script>
    import backend from "~/assets/backend"

    export default defineNuxtComponent({
    fetchKey: () => 'pages/medarbetare/index.vue' + decodeURI(useRoute().path) + JSON.stringify(useRoute().query),
        name : "MedarbetareIndex",
        setup() {
        usePageHead(data => {
            return {
                // title : data.data.ContributerLastname
                title : "Medarbetare – Svenskt översättarlexikon"
            }

        })
        return {}
    },
        data () {
            return {
                contributors: [],
            }
        },

        async asyncData(nuxtApp) {
      const { params, error, payload } = pageContext(nuxtApp)
            return {contributors : (await backend.getContributors())}
        }
    })
</script>
