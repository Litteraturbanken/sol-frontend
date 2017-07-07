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

function groupConnections(works) {
    let connectionGroups = _.groupBy(works, "ConnectionType")
    return _(connectionGroups)
        .toPairs(connectionGroups)
        .map(([type, works]) => {
            return {type: Number(type), works}
        })
        .sortBy(({item}) => item * -1)
        .value()
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

    async autocomplete(str) {
        console.log("str", str)
        let {data} = await axios.get("http://litteraturbanken.se/api/autocomplete/" + str)

        return _(data.data)
            .filter(item => ["etext", "faksimil", "author"].includes(item.doc_type))
            .map( (item) => {
                if(item.doc_type == "author") {
                    return {
                        label: item.name_for_index, 
                        url : "http://litteraturbanken.se/forfattare/" + item.author_id,
                        type: "author"
                    }
                } else {
                    return {
                        label: item.shorttitle, 
                        url : `http://litteraturbanken.se/forfattare/${item.authors[0].author_id}/titlar/${item.title_id}/sida/${item.startpagename}/${item.doc_type}`,
                        type : "work"
                    }
                }
            }).value()

    }

    async getArticle(articleId) {
        let resp = (await pythonGet(urljoin("article", encodeURIComponent(encodeURIComponent(articleId))), {
            show : "ArticleID,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,AuthorID,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname"
        }))
        let {article, works} = resp
        // console.log("article", article)
        
        return {article, works, connectionGroups : groupConnections(works)}
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

        // console.log("articles", articles, articles.length)
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

    async getContributor(name) {
        return (await pythonGet("/contributor/" + name.replace(/\s/g, "_"), 
            {show: "ArticleName,Articles.URLName"}
        )).data

    }

    async getWork(workid) {
        let {work} = await pythonGet("/bibliography/" + workid)
        return work[0]
    }
    
    async getWorksByAuthorName(authorname) {
        let {data} = await pythonGet("/author/" + authorname)
        // console.log("works", data)
        return data
    }
    
    async getWorksByAuthor(urlname) {
        let {languages, works, article} = (await pythonGet(urljoin("/bibliography", urlname)))
        // console.log("works", works)
        let original = _.filter(languages, "Original")
        let source = _.filter(languages, "Source")
        return {source, original, works, article, connectionGroups : groupConnections(works)}

    }

    async getLangs(groupName) {
        let langMap = (await pythonGet("/languages/1", 
            {show: "Articles.ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        // console.log("langMap", langMap)
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

    async search(str) {
        let data = (await pythonGet("/search/" + str, 
            // {show: "Articles.ArticleID,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        ))
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
