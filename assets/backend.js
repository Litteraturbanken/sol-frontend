import axios from "axios"
import _ from "lodash"
const KARP = "https://ws.spraakbanken.gu.se/ws/karplabb/"
const QUERY = KARP + "query"
const MINIENTRY = KARP + "minientry"
const STATS = KARP + "statistics"

const DIRECTUS = "http://demo.spraakdata.gu.se/fklittb/directus"

function karpGet(url, params) {
    return axios.get(url, {
        params : _.extend({}, {
            resource : "sol-articles",
            mode : "sol"
        }, params)
    })        
}


function directusGet(table, params) {
    return axios.get(`${DIRECTUS}/api/1.1/tables/${table}/rows`,
        {
            auth: {
                username : "test-token"
            },
            params : _.extend({}, {
                // TODO: add active only searching here
                // resource : "sol-articles",
                // mode : "sol"
                
            }, params)
        })
}
class DirectusBackend {
    
    async getArticle(articleId) {
        
        let {data} = await directusGet("Articles", {
            "filters[URLName][eq]" : encodeURIComponent(articleId)
        })

        return data.data[0]
    }
    async listArticles() {
        let resp = await directusGet("Articles", {
            limit : 10000,
            columns : "ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
        })

        console.log("datas", resp)
        let data = resp.data.data;

        function normalizeSortLetter(letter) {
            return {
                "Ü" : "U"
            }[letter.toUpperCase()] || letter.toUpperCase() 

        }

        let groups = _(data).groupBy((item) => {
            return normalizeSortLetter( (item.TranslatorLastname || item.ArticleName)[0] )
        }).toPairs().sortBy(([key, item]) => {
            return key
        }).fromPairs().value()
        for (let letter in groups) {
            groups[letter] = _.sortBy(groups[letter], (item) => item.TranslatorLastname || item.ArticleName)
        }
        return groups
    }

    async getWork(workid) {
        let resp = await directusGet("Works", {
            // columns : "id,ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname"
            "filters[WorkID][eq]" : workid
        })
        console.log("resp", resp)  

        return resp.data.data[0]
    }

    async getLangs() {}
    async listPrizeArticles() {}
    async listThemeArticles() {}
}
// use for: http://oversattarlexikon.se/listor/avoversattare/Roland_Adlerberth
// https://ws.spraakbanken.gu.se/ws/karplabb/query?q=extended%7C%7Cand%7Cverkid%7Cequals|1026|1027|1028&resource=sol-works&mode=sol&size=10000
class KarpBackend {
    async getArticle(articleId) {
        try {
            var resp = await karpGet(QUERY, {
                q : `extended||and|url_name|equals|${encodeURIComponent(articleId)}`,
            })
        } catch({response}) {
            console.log("err", JSON.stringify(_.pick(response, "request.path", "data", "statusText", "status"), null, 2))
            throw err
        }
        return resp.data.hits.hits[0]._source

    } 


    async listArticles() {
        var resp = await karpGet(MINIENTRY, {
            q : "extended||and|artikelid|exists",
            size : 10000,
            show : "artikelid,url_name,namn,fodd,dod" // TOOD: fix add fodd/dod to list

        })
        let sourceList = resp.data.hits.hits.map((item) =>
          item._source  
        )

        function normalizeSortLetter(letter) {
            return {
                "Ü" : "U"
            }[letter.toUpperCase()] || letter.toUpperCase() 

        }

        let groups = _(sourceList).groupBy((item) => {
            return normalizeSortLetter( 
                (
                    (item.name && item.name.lastname) ? 
                    item.name.lastname : item.ArticleID
                )[0])
        }).toPairs().sortBy(([key, item]) => {
            return key
        }).fromPairs().value()
        return groups
    }

    async listThemeArticles() {
        var resp = await karpGet(MINIENTRY, {
            q : "extended||and|artikeltyp|equals|Temaartikel",
            size : 10000,
            show : "artikelid,url_name"

        })
        let sourceList = resp.data.hits.hits.map((item) =>
          item._source  
        )
        return sourceList
    }
    async listPrizeArticles() {
        var resp = await karpGet(MINIENTRY, {
            q : "extended||and|artikeltyp|equals|Översättarpris",
            size : 10000,
            show : "artikelid,url_name"

        })
        let sourceList = resp.data.hits.hits.map((item) =>
          item._source  
        )
        return sourceList
    }

    async getLangs() {
        var resp = await karpGet(STATS, {
            resource : "sol-works",
            buckets : "sprak_original,forfattare.bucket"
        })

        return _(resp.data.aggregations.q_statistics["LanguageOriginal.LanguageName"].buckets).map( (lang_bucket) => {
            let lang = lang_bucket.key
            // TODO:  this is not the right author field
            let authors = _.map(lang_bucket["Authors.raw"].buckets, "key")

            return [lang, authors]
        }).fromPairs().value()
        return ret
    }

    async search(term) {
        var resp = await karpGet(MINIENTRY, {
            q : `extended||and|textlang|equals|${term}`,
            size : 10000,
            show : "artikelid,url_name"

        })
        let sourceList = resp.data.hits.hits.map((item) =>
          item._source  
        )

        return sourceList
    }

    // async getWorks(author) {

    // }

}
export default new DirectusBackend()