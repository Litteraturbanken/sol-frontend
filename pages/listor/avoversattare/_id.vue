<template>
    <div class="">
    <h2>Bibliografi – {{article}}</h2>
    

    <h3><div class="label">Språkurval och sortering</div> </h3>
    <select v-model="lang" @change="onLangChange(lang)">
      <option value="">Alla språk</option>
      <optgroup label="Originalspråk" >
        <option :value="[lang.LanguageName, 'original']" v-for="lang in original">
            {{lang.LanguageName}}
        </option>
      </optgroup>
      <optgroup label="Källspråk">
        <option :value="[lang.LanguageName, 'fran']" v-for="lang in source">
            {{lang.LanguageName}}
        </option>
      </optgroup>
    </select>

    <select class="sort" name="" id="" v-model="sortVal" @change="onSortChange(sortVal)">
        <option value="RealYear">År</option>
        <option value="Authors">Författare</option>
        <option value="TitleSwedish">Titel</option>
    </select>
    

    <!-- <a class="sc" :href="'/listor/avoversattare/' + $route.params.id" >Alla</a>
    
    <h3>
        <div class="label">Originalspråk</div>
    </h3>
    <ul class="lang-filter list">
        <li v-for="lang in original" class="list-item sc">
            <nuxt-link :to="'/listor/avoversattare/' + $route.params.id + '/original/' + lang.LanguageName">{{lang.LanguageName}}</nuxt-link>
        </li>
    </ul>
    
    <h3>
        <div class="label">Källspråk</div>
    </h3>
    <ul class="lang-filter list">
        <li v-for="lang in source" class="list-item sc">
            <nuxt-link :to="'/listor/avoversattare/' + $route.params.id + '/fran/' + lang.LanguageName">{{lang.LanguageName}}</nuxt-link>
        </li>
    </ul> -->

    <ul class="results">
        <li v-for="item in sortedGroups" v-if="filterWorks(item.works).length">
            <h2 v-if="item.type == 2">Om {{ article }}</h2>
            <h2 v-if="item.type == 3">Skrifter av {{ article }}</h2>
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

<style lang="scss" scoped>
    h2 {
        margin-top: 1.8em;
    }
    .sort {
        margin-left: 2em;
    }
    .work {
        margin-bottom: 2em;
        max-width : 400px;
    }
    .list-inline-item:not(:last-child) {
        margin-right: 10px;
    }
    .label {
        // font-weight: bold;
        display : block;
        &:not(:first-of-type) {
            margin-top: 1em;
        }
    }
    
    .list-item {
            
    }

    .lang-filter {
        columns: 150px 4;
        max-width: 500px;
    }

    .results {
        margin-top: 3em;
    }
</style>

<script>
    import backend from "assets/backend"
    import work from "~/components/work.vue"
    import _ from "lodash"

    import naturalSort from "natural-sort"

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
        data() {
            console.log("data")
            return {
                sortVal : "RealYear",
                connectionGroups : [],
                lang : "",
                source : null,
                original : null,
                article : null
            }
        },
        async asyncData ({ params, error, route, from }) {
            let lang = ""
            if(params.lang) {
                lang = [params.lang, params.type]
            }
            let sortVal = route.query.sort || "RealYear"
            if(from && (from.matched[0].name == "listor-avoversattare-id" || from.matched[0].name == "avoversattare-filter")) {
                console.log("bailed asyncdata")
                return {lang, sortVal}
            }
            try{
                console.log("params", params)
                var {source, original, works, article, connectionGroups} = await backend.getWorksByAuthor(params.id)

            } catch(err) {
                console.log("Article fetch error.", err)
                error({ message: "Artikeln kunde inte hittas.", statusCode: 404 })
            }
            return { works, source, original, article, connectionGroups, lang, sortVal }
        },
        methods : {
            onLangChange : function([lang, type]) {
                if(lang) {
                    this.$router.push(`/listor/avoversattare/${this.$route.params.id}/${type}/${lang}`)
                } else {
                    this.$router.push(`/listor/avoversattare/${this.$route.params.id}`)
                    
                }

            },
            onSortChange : function(sortVal) {
                console.log("this.$router", this.$router)
                this.$router.push(window.location.pathname + "?" + "sort=" + sortVal)
            },
            filterWorks : function(works) {
                return works.filter((work) => {
                    if(!this.$route.params.lang) return true
                    if(this.$route.params.type == "original") {
                        return this.$route.params.lang == work.LanguageOriginalName
                    } else if(this.$route.params.type == "fran") {
                        return this.$route.params.lang == work.LanguageSourceName
                    }
                })
            },
        },
        computed : {
            langName : function() {
                return this.$route.query.l
            },
            langType : function() {
                return this.$route.query.lt
            },
            sortedGroups : function() {
                // if(!this.connectionGroups) return []
                let output = _.map(this.connectionGroups, ({type, works}) => {
                    return {type, works: _.sortBy(works, this.sortVal)}
                })
                return output
            }

        }
    }
</script>
