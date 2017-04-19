import axios from "axios"
import _ from "lodash"
const KARP = "https://ws.spraakbanken.gu.se/ws/karplabb/"
const QUERY = KARP + "query"
const MINIENTRY = KARP + "minientry"

function karpGet(url, params) {
    return axios.get(url, {
        params : _.extend({
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
            show : "artikelid,url_name,namn"

        })
        let sourceList = resp.data.hits.hits.map((item) =>
          item._source  
        )
        let groups = _(sourceList).groupBy((item) => {
            return ( (item.name && item.name.lastname) ? item.name.lastname : item.ArticleID)[0]
        }).toPairs().sortBy(([key, item]) => {
            return key
        }).fromPairs().value()
        return groups
    }
}
export default new KarpBackend()