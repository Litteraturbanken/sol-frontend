<template>
    <section>
        <h1>Översättarlexikonets artikelförfattare</h1>
        <ul>
            <li v-for="contributor in contributors">
                <!-- <a :href="'/medarbetare/' + encodeURIComponent(contributor.FirstName) + ' ' + encodeURIComponent(contributor.LastName)">{{contributor.FirstName}} {{contributor.LastName}}</a> -->
                <a :href="'/medarbetare/' + contributor.URLName">{{contributor.FirstName}} {{contributor.LastName}}</a>
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
        name : "Medarbetare",
        head () {
            return {
                // title : this.data.ContributerLastname + " – Svenskt översättarlexikon"
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
