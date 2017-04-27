import axios from "axios"
import _ from "lodash"
const KARP = "https://ws.spraakbanken.gu.se/ws/karplabb/"
const QUERY = KARP + "query"
const MINIENTRY = KARP + "minientry"
const STATS = KARP + "statistics"

function karpGet(url, params) {
    return axios.get(url, {
        params : _.extend({}, {
            resource : "sol-articles",
            mode : "sol"
        }, params)
    })        
}

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
export default new KarpBackend()