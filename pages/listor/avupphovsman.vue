<template>
    <div class="">
    <h2>Verk av {{$route.query.a}}</h2>
        <ul class="col-md-5">
            <li v-for="work in works">
                <work :work="work"></work>
            </li>
        </ul>
    </div>
</template>

<style lang="scss">
    .work {
        margin-bottom: 2em;
    }
</style>

<script>
    import backend from "assets/backend"
    import Work from "~/components/work.vue"
    export default {
        name : "AvUpphovsman",
        components: {work : Work},
        head () {
            return {
                title : "Av upphovsman" + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error, route }) {
            try{
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
    }
</script>
