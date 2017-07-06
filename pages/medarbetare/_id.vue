<template>
    <section>
        <h2>Översättarlexikonets artikelförfattare</h2>
        <h3>{{contributor.FirstName}} {{contributor.LastName}}</h3>
        <p v-html="contributor.Description"></p>
        
        <section class="articles">
            <ul>
                <li v-for="article in articles">
                    <a :href="'/artiklar/' + decodeURIComponent(article.URLName)">{{article.ArticleName}}</a>
                </li>
            </ul>
        </section>
    </section>
</template>

<style lang="scss">
    
</style>

<script>
    import backend from "assets/backend"

    export default {
        name : "Medarbetare",
        head () {
            return {
                // title : this.data.ContributerLastname + " – Svenskt översättarlexikon"
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
                return { data : payload }
            }

            return {...(await backend.getContributor(params.id))}
        }
    }
</script>
