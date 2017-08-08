<template>
    <div class="">
    <h1>Bibliografi – {{article}}</h1>
    Språkurval: <a :href="'/listor/avoversattare/' + $route.params.id" >Alla</a>
    
    <ul class="lang-filter list-inline">
        <li class="list-inline-item">Originalspråk:</li>
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
        <li v-for="item in connectionGroups" v-if="filterWorks(item.works).length">
            <h2 v-if="item.type == 3">Om {{ article }}</h2>
            <h2 v-if="item.type == 2">Skrifter av {{ article }}</h2>
            <h2 v-if="item.type == 1">Översättningar i bokform</h2>
            <ul>
                <li v-for="work in filterWorks(item.works)">
                    <work :work="work"></work>
                </li>
            </ul>            
            
        </li>
    </ul>

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
    import work from "~/components/work.vue"
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
                var {source, original, works, article, connectionGroups} = await backend.getWorksByAuthor(params.id)

            } catch(err) {
                console.log("Article fetch error.", err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { works, source, original, article, connectionGroups }
        },
        methods : {
            filterWorks : function(works) {
                return works.filter((work) => {
                    if(!this.$route.params.lang) return true
                    if(this.$route.params.type == "original") {
                        return this.$route.params.lang == work.LanguageOriginalName
                    } else if(this.$route.params.type == "fran") {
                        return this.$route.params.lang == work.LanguageSourceName
                    }
                })
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
