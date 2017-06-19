import axios from "axios"
import _ from "lodash"
const KARP = "https://ws.spraakbanken.gu.se/ws/karplabb/"
const QUERY = KARP + "query"
const MINIENTRY = KARP + "minientry"
const STATS = KARP + "statistics"

// const DIRECTUS = "http://demo.spraakdata.gu.se/fklittb/directus"
const DIRECTUS = "https://ws.spraakbanken.gu.se/ws/sol"
const PYTHON_API = "http://litteraturbanken.se/sol/api"


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
function urljoin(...urls) {
    return "/" + urls.map(item => _.trim(item, "/")).join("/")
}
async function pythonGet(endpoint, params) {
    let {data} = await axios.get(PYTHON_API + endpoint, {params})
    return data
}

class PythonBackend {

    constructor() {
        this.articleTypes = {
            "översättare" : 1,
            "översättarpris" : 2,
            "förlag" : 3,
            "temaartikel": 4,
            "översättarorganisation": 5
        }
    }


    async getArticle(articleId) {
        let resp = (await pythonGet(urljoin("article", encodeURIComponent(encodeURIComponent(articleId))), {
            show : "ArticleID,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        }))
        let {article, works} = resp
        let connectionGroups = _.groupBy(works, "ConnectionType")
        return {article, works, connectionGroups}
    }

    async listArticles() {
        let articles = (await pythonGet("/articles", 
            {show: "ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data

        function normalizeSortLetter(letter) {
            return {
                "Ü" : "U"
            }[letter.toUpperCase()] || letter.toUpperCase() 

        }

        console.log("articles", articles, articles.length)
        let groups = _(articles).groupBy((item) => {
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
        let {work} = await pythonGet("/bibliography/" + workid)
        return work[0]
    }
    
    async getWorksByAuthorName(authorname) {
        let {data} = await pythonGet("/author/" + authorname)
        console.log("works", data)
        return data
    }
    
    async getWorksByAuthor(urlname) {
        let {languages, works} = (await pythonGet(urljoin("/bibliography", urlname)))
        let original = _.filter(languages, "Original")
        let source = _.filter(languages, "Source")
        let connectionGroups = _.groupBy(works, "ConnectionType")
        console.log("connectionGroups", connectionGroups)
        return {source, original, works, connectionGroups}

    }

    async getLangs(groupName) {
        let langMap = (await pythonGet("/languages/1", 
            {show: "Articles.ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        return langMap[groupName]
    }
    async listPrizeArticles() {
        let data = (await pythonGet("/articles/2", 
            {show: "Articles.ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        return data
    }
        
    async listThemeArticles() {
        let data = (await pythonGet("/articles/4", 
            {show: "Articles.ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        return data
    }
    
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

        // console.log("datas", resp)
        let data = resp.data.data

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
        // console.log("resp", resp)  

        return resp.data.data[0]
    }

    async getLangs() {}
    async listPrizeArticles() {}
    async listThemeArticles() {}
}

export default new PythonBackend()
// export default new DirectusBackend()
