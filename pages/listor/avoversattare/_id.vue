<template>
    <div class="">
    {{langName}} {{langType}}


    
    <ul class="lang-filter list-inline">
        <li class="list-inline-item">OriginalSpråk:</li>
        <li v-for="lang in original" class="list-inline-item">
            <nuxt-link :to="'/listor/avoversattare/' + $route.params.id + '/original/' + lang.LanguageName">{{lang.LanguageName}}</nuxt-link>
        </li>
    </ul>
    
    <ul class="lang-filter list-inline">
        <li class="list-inline-item">Källspråk:</li>
        <li v-for="lang in source" class="list-inline-item">
            <nuxt-link :to="'/listor/avoversattare/' + $route.params.id + '/fran/' + lang.LanguageName">{{lang.LanguageName}}</nuxt-link>
        </li>
    </ul>

    <ul>
        <li v-for="work in works" v-if="filterLang(work)">
            <work :work="work"></work>
        </li>
    </ul>
    <!-- <pre>{{query | json}}</pre> -->
    </div>
</template>

<style lang="scss">
    .work {
        margin-bottom: 2em;
    }
    .list-inline-item:not(:last-child) {
        margin-right: 10px;
    }
</style>

<script>
    import backend from "assets/backend"
    import work from "~components/work.vue"
    export default {
        name : "AvOversattare",
        head () {
            return {
                title : "Av översättare" + " – Svenskt översättarlexikon"
            }
        },
        components : {
            work : work
        },
        async asyncData ({ params, error, route }) {
            try{
                console.log("params", params)
                var {source, original, works} = await backend.getWorksByAuthor(params.id)

            } catch(err) {
                console.log("Article fetch error.")
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { works, source, original }
        },
        methods : {
            filterLang : function(work) {
                if(!this.$route.params.lang) return true
                if(this.$route.params.type == "original") {
                    return this.$route.params.lang == work.LanguageOriginalName
                } else if(this.$route.params.type == "fran") {
                    return this.$route.params.lang == work.LanguageSourceName

                }

            }
        },
        computed : {
            langName : function() {
                return this.$route.query.l
            },
            langType : function() {
                return this.$route.query.lt
            },

        }
    }
</script>
