<template>
    <section>
        <h2>Översättarlexikonets artikelförfattare</h2>
        <h3>{{contributor.FirstName}} {{contributor.LastName}}</h3>
        <p v-html="contributor.Description"></p>

        <section class="articles">
            <h4>Artiklar</h4>
            <ul class="resultlist">
                <li v-for="article in articles">
                    <nuxt-link :to="'/artiklar/' + article.URLName">{{article.ArticleName}}</nuxt-link>
                </li>
            </ul>
        </section>
    </section>
</template>

<style lang="scss">
    .articles {
        margin-top: 2em;
    }
</style>

<script>
    import backend from "~/assets/backend"

    export default defineNuxtComponent({
    fetchKey: () => 'pages/medarbetare/[id]/index.vue' + decodeURI(useRoute().path) + JSON.stringify(useRoute().query),
        name : "Medarbetare",
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
                contributor: null,
                articles : null
            }
        },

        async asyncData(nuxtApp) {
      const { params, error, payload } = pageContext(nuxtApp)
            if(payload) {
                return payload
            }

            try {
                let data = await backend.getContributor(params.id)
                console.log("constributor data", data)
                return data
            } catch(e) {
                error({ statusCode: 404, message: "Medarbetaren kunde inte hittas." })
            }

        }
    })
</script>
