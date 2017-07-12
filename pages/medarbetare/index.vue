<template>
    <section>
        <h1>Översättarlexikonets artikelförfattare</h1>
        <ul>
            <li v-for="contributor in contributors">
                <a :href="'/medarbetare/' + contributor.FirstName + ' ' + contributor.LastName">{{contributor.FirstName}} {{contributor.LastName}}</a>
            </li>
        </ul>
    </section>
</template>

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
