/**
 * Fritextsökning. Artiklarna kommer från OpenSearch, verken och priserna
 * matchas i minnet mot cachade index ur Directus.
 *
 * Artikeldelen är den enda som inte ger samma svar som Python-API:t. Där
 * rankades träffar med en handskriven poängformel byggd på MySQL REGEXP,
 * och stavningsförslagen kom från hunspell. OpenSearch rankar på sitt eget
 * sätt och föreslår ord ur lexikonets egen text. Träffmängden blir alltså
 * snarlik men ordningen en annan, och svarets form är densamma.
 *
 * Verk och priser matchas som i Python-API:t: varje term i frasen måste
 * stå i början av ett ord, se searchTerms(). Autokompletteringen frågar för
 * varje tangenttryckning, så inget av det går till Directus per sökning.
 */

export default defineEventHandler(async event => {
    const phrase = decodedParam(event, 'phrase')
    const libris = String(getQuery(event).libris ?? '').toLowerCase() === 'true'
    const terms = searchTerms(phrase)

    const [articles, works, prizes] = await Promise.all([
        articleHits(phrase, libris),
        libris || !terms.length ? [] : workHits(terms),
        terms.length ? prizeHits(terms) : []
    ])

    const suggestion = !articles.length && !works.length ? await spellingSuggestion(phrase) : ''
    return { articles, works, prizes, suggestion }
})

/** Bilder i sökträffarna är FileType 3, inte samma som på artikelsidan. */
async function searchImages(articleIds) {
    if (!articleIds.length) return new Map()
    const rows = await items('ArticleFiles', {
        fields: ['ArticleID', 'image_ref'],
        filter: { _and: [{ ArticleID: { _in: articleIds } }, { FileType: { _eq: 3 } }] }
    })
    return new Map(rows.map(row => [row.ArticleID, row.image_ref]))
}

async function articleHits(phrase, libris) {
    const hits = await searchArticles(phrase, { size: 20, publishedOnly: !libris })
    if (!hits.length) return []
    const images = await searchImages(hits.map(hit => hit.id).filter(id => id != null))
    const top = hits[0]?._score || 1
    return hits.map(hit => ({
        id: hit.id ?? null,
        ArticleName: hit.ArticleName ?? null,
        URLName: hit.URLName ?? null,
        TranslatorYearBirth: hit.TranslatorYearBirth ?? null,
        TranslatorYearDeath: hit.TranslatorYearDeath ?? null,
        Type: hit.Type ?? null,
        FileName: images.get(hit.id) ?? null,
        // Poängen normaliseras till 0–1 så att fältet betyder samma sak som
        // förut för den som läser svaret.
        Score: Math.round((hit._score / top) * 1000) / 1000
    }))
}

/**
 * Verk vars egna fält matchar termerna, eller som är kopplade till en
 * publicerad artikel vars namn matchar. Titelträffar rankas högst och
 * resultatet sorteras på titel, som i den gamla SQL-frågan. Bara verk med
 * koppling till en publicerad artikel räknas (INNER JOIN).
 */
async function workHits(terms) {
    const [index, connections, articleNames] = await Promise.all([
        worksSearchIndex(),
        allConnections(),
        publishedArticleNames()
    ])

    const matchedArticles = new Set()
    for (const [id, name] of articleNames) if (matchesAll(terms, name)) matchedArticles.add(id)

    // Kopplingar per verk, bara till publicerade artiklar.
    const linksByWork = new Map()
    for (const row of connections) {
        if (!articleNames.has(row.ArticleID)) continue
        const list = linksByWork.get(row.WorkID) ?? []
        list.push(row)
        linksByWork.set(row.WorkID, list)
    }

    const rows = []
    for (const work of index) {
        const links = linksByWork.get(work.id)
        if (!links) continue
        const byText = matchesAll(terms, work.haystack)
        if (!byText && !links.some(row => matchedArticles.has(row.ArticleID))) continue
        const names = sortBySwedish([...new Set(links.map(row => articleNames.get(row.ArticleID)))], name => name)
        rows.push({
            id: work.id,
            TitleSwedish: work.TitleSwedish,
            SubtitleSwedish: work.SubtitleSwedish,
            PublishingYearSwedish: work.PublishingYearSwedish,
            Authors: work.Authors,
            Remark: work.Remark,
            ConnectionType: links[0].ConnectionType,
            Translator: names.join(', '),
            Score: matchesAll(terms, work.TitleSwedish) ? 1 : 0
        })
    }

    return sortBySwedish(
        rows,
        row => (row.Score === 1 ? '0' : '1'),
        row => row.TitleSwedish
    ).slice(0, 50)
}

/**
 * Pristagare vars namn matchar frasen. Träffen leder till prisets artikel,
 * inte till pristagarens, eftersom joinen går på PrizeID.
 */
async function prizeHits(terms) {
    const winners = (await prizeWinners()).filter(row => matchesAll(terms, row.PrizeWinner))
    if (!winners.length) return []
    const ids = winners.map(row => row.PrizeID).filter(id => id != null)
    const articles = ids.length
        ? await items('Articles', {
              fields: ['id', 'ArticleName', 'URLName', 'Type'],
              filter: { _and: [{ id: { _in: ids } }, publishedFilter] }
          })
        : []
    const articleById = new Map(articles.map(row => [row.id, row]))
    const images = await searchImages([...articleById.keys()])

    const rows = winners.map(winner => {
        const article = articleById.get(winner.PrizeID) ?? null
        return {
            ArticleName: article?.ArticleName ?? null,
            URLName: article?.URLName ?? null,
            Type: article?.Type ?? null,
            FileName: article ? (images.get(article.id) ?? null) : null
        }
    })
    return sortBySwedish(rows, row => row.ArticleName).slice(0, 20)
}
