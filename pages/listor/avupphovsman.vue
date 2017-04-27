<template>
    <div class="">
    </div>
</template>

<style lang="scss">

</style>

<script>
    import backend from "assets/model"
    export default {
        name : "AvUpphovsman",
        head () {
            return {
                title : "Av upphovsman" + " – Svenskt översättarlexikon"
            }
        },
        async asyncData ({ params, error }) {
            return {}
            try{
                // var article = await backend.getArticle(params.id)
            }
            catch(err) {
                console.log("Article fetch error.")
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { article }
        },
        computed : {

        }
    }
</script>