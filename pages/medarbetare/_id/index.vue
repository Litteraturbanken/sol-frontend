<template>
    <section>
        <h2>Översättarlexikonets artikelförfattare</h2>
        <h3>{{contributor.FirstName}} {{contributor.LastName}}</h3>
        <p v-html="contributor.Description"></p>
        
        <section class="articles">
            <h4>Artiklar</h4>
            <ul class="resultlist">
                <li v-for="article in articles">
                    <a :href="'/artiklar/' + article.URLName">{{article.ArticleName}}</a>
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
    import backend from "assets/backend"

    export default {
        name : "Medarbetare",
        head () {
            return {
                // title : this.data.ContributerLastname
                title : "Medarbetare – Svenskt översättarlexikon"
            }
        },
        data () {
            return {
                contributor: null,
                articles : null
            }
        },

        async asyncData ({ params, error, payload }) {
            if(payload) {
                return payload
            }

            try {
                let data = await backend.getContributor(params.id)
                console.log("constributor data", data)
                return data
            } catch(e) {
                console.log("Contributor fetch error:", e)
            }

        }
    }
</script>
