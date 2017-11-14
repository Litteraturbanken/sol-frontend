import axios from "axios"
import _ from "lodash"
const KARP = "https://ws.spraakbanken.gu.se/ws/karplabb/"
const QUERY = KARP + "query"
const MINIENTRY = KARP + "minientry"
const STATS = KARP + "statistics"

// const DIRECTUS = "http://demo.spraakdata.gu.se/fklittb/directus"
const DIRECTUS = "https://ws.spraakbanken.gu.se/ws/sol"
const PYTHON_API = "https://litteraturbanken.se/sol/api"


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
async function pythonGet(endpoint, params, config) {

    console.log("PYTHON_API + endpoint", PYTHON_API + endpoint + "?" + _.toPairs(params).map(a => a.join("=")).join("&"))
    let {data} = await axios.get(PYTHON_API + endpoint, {...config, params})
    return data
}

function groupConnections(works) {
    let connectionGroups = _.groupBy(works, "ConnectionType")
    return _(connectionGroups)
        .toPairs(connectionGroups)
        .map(([type, works]) => {
            return {type: Number(type), works}
        })
        .sortBy(({type}) => [2,3,1,4,5,6,7].indexOf(type))
        .value()
}
function groupBiblType(works) {
    let connectionGroups = _.groupBy(works, "BibliographyType")
    return _(connectionGroups)
        .toPairs(connectionGroups)
        .map(([type, works]) => {
            return {type: Number(type), works}
        })
        .sortBy(({type}) => [1,5,4,6,7,8].indexOf(type))
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
        let resp = (await pythonGet(urljoin("article", encodeURIComponent(articleId)), {
            show : "id,ArticleName,TranslatorFirstname,TranslatorLastname,TranslatorYearBirth,TranslatorYearDeath,Author,ArticleText,ArticleTypes.ArticleTypeName,Contributors.FirstName:ContributorFirstname,Contributors.LastName:ContributorLastname,ArticleFiles.FileName,ArticleFiles.Author:FileAuthor"
        }))
        let {article, works, prizewinners, bibliography_types} = resp
        works = _.sortBy(works, "RealYear")
        // console.log("article", article)
        
        return {
            article,
            works,
            connectionGroups : groupConnections(works),
            prizewinners,
            biblTypeGroups : groupBiblType(works),
            biblTypeData : _.groupBy(bibliography_types, "id")
        }
    }

    async listArticles() {
        let articles = (await pythonGet("/articles", 
            {show: "id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
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

    async getContributors() {
        return (await pythonGet("/contributors",
            {show: "URLName,FirstName,LastName"}
        )).data
    }
    async getContributor(name) {
        console.log("getContributor", encodeURIComponent(name.replace(/\s/g, "_")))
        return (await pythonGet("/contributor/" + encodeURIComponent(name.replace(/\s/g, "_")),
        // return (await pythonGet("/contributor/" + encodeURIComponent(name),
            {show: "ArticleName,Articles.URLName:URLName"}
        )).data
    }

    async getRandom(type) {
        try {
            return (await pythonGet("/articles/random/" + type,
                {show: "TranslatorYearBirth,TranslatorYearDeath,ArticleName,URLName,Ingress,FileName,ArticleFiles.FileName"}
            )).data[0]
        } catch(e) {
            console.log("error in random", e)
            throw e
        }
    }
    
    async getLatest() {
        try {
            return (await pythonGet("/articles/latest",
                {show: "ArticleName,URLName,DatePublished"}
            )).data
        } catch(e) {
            console.log("error in /latest", e)
        }
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
        let {languages, works, article, bibliography_types} = (await pythonGet(urljoin("/bibliography", urlname)))
        // console.log("works", works)
        for(let work of works) {
            work.RealYear = Number(work.RealYear)
        }
        let original = _.filter(languages, "Original")
        let source = _.filter(languages, "Source")

        bibliography_types = _.map(bibliography_types, (item) => {
            item.id = String(item.id)
            return item
        })
        let biblTypeData = _.groupBy(bibliography_types, "id")
        let biblTypeGroups = groupBiblType(works)
        console.log('biblTypeGroups', biblTypeGroups)

        return {source, original, article, biblTypeGroups, biblTypeData, connectionGroups : groupConnections(works)}

    }

    async getLangs(groupName) {
        let langMap = (await pythonGet("/languages/1", 
            {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        // console.log("langMap", langMap)
        return langMap[groupName]
    }
    async listPrizeArticles() {
        let data = (await pythonGet("/articles/2", 
            {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        return data
    }
        
    async listThemeArticles() {
        let data = (await pythonGet("/articles/4", 
            {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        )).data
        return data
    }

    async search(str) {
        if(this.cancel) this.cancel()
        
        let CancelToken = axios.CancelToken

        try {
            var data = (await pythonGet("/search/" + str, {},
                // {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
                {
                    cancelToken: new CancelToken( (c) => {
                      // An executor function receives a cancel function as a parameter
                      this.cancel = c
                    })
                }
            ))
            
        } catch(e) {
            if(e.__CANCEL__) {
                return {articles : [], suggestion : null, works : null}
            } else {
                throw e
            }
        }

        return data
    } 
    
    async chronology(from, to) {
        let {articles} = (await pythonGet(`/chronology/${from}/${to}`, 
            {show: "Articles.id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"}
        ))
        return articles
    } 

    async getStatic(page) {
        return (await pythonGet('/static/' + page)).page
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
            columns : "id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname,ArticleName"
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
            // columns : "id,id,TranslatorYearBirth,TranslatorYearDeath,URLName,TranslatorFirstname,TranslatorLastname"
            "filters[id][eq]" : workid
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
