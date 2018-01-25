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
    import backend from "assets/backend"

    export default {
        name : "MedarbetareIndex",
        head () {
            return {
                // title : this.data.ContributerLastname
                title : "Medarbetare – Svenskt översättarlexikon"
            }
        },
        data () {
            return {
                contributors: [],
            }
        },

        async asyncData ({ params, error, payload }) {
            return {contributors : (await backend.getContributors())}
        }
    }
</script>
