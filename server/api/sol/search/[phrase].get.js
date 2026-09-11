/**
 * Fritextsökning. Artiklarna kommer från OpenSearch, verken och priserna
 * från Directus.
 *
 * Detta är den enda endpointen som inte kan ge samma svar som Python-API:t.
 * Där rankades träffar med en handskriven poängformel byggd på MySQL REGEXP,
 * och stavningsförslagen kom från hunspell. OpenSearch rankar på sitt eget
 * sätt och föreslår ord ur lexikonets egen text. Träffmängden blir alltså
 * snarlik men ordningen en annan, och svarets form är densamma.
 */

const WORK_TEXT_FIELDS = [
    'TitleSwedish',
    'TitleOriginal',
    'VariantTitle',
    'Authors',
    'Remark',
    'CreatorRole',
    'PartOf_Title'
]

const WORK_FIELDS = [
    'id',
    'TitleSwedish',
    'SubtitleSwedish',
    'PublishingYearSwedish',
    'Authors',
    'Remark'
]

export default defineEventHandler(async event => {
    const phrase = decodedParam(event, 'phrase')
    const libris = String(getQuery(event).libris ?? '').toLowerCase() === 'true'

    const [articles, works, prizes] = await Promise.all([
        articleHits(phrase, libris),
        libris ? [] : workHits(phrase),
        prizeHits(phrase)
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
 * Verk vars egna fält matchar frasen, eller som är kopplade till en artikel
 * vars namn matchar. Titelträffar rankas högst, som i den gamla formeln.
 */
async function workHits(phrase) {
    const [byText, byArticle] = await Promise.all([
        items('Works', {
            fields: ['id'],
            filter: {
                _and: [
                    { Unpublished: { _eq: 0 } },
                    { _or: WORK_TEXT_FIELDS.map(field => ({ [field]: { _contains: phrase } })) }
                ]
            }
        }),
        articleMatchedWorkIds(phrase)
    ])

    const ids = [...new Set([...byText.map(row => row.id), ...byArticle])]
    if (!ids.length) return []

    const works = await worksByIds(ids, { fields: WORK_FIELDS })
    const connections = await connectionsForWorks([...works.keys()])
    const articleIds = connections.map(row => row.ArticleID).filter(id => id != null)
    const articles = articleIds.length
        ? await items('Articles', {
              fields: ['id', 'ArticleName'],
              filter: { _and: [{ id: { _in: articleIds } }, publishedFilter] }
          })
        : []
    const articleById = new Map(articles.map(row => [row.id, row]))

    const needle = phrase.toLowerCase()
    const rows = []
    for (const [id, work] of works) {
        const links = connections.filter(row => row.WorkID === id && articleById.has(row.ArticleID))
        // INNER JOIN mot publicerade artiklar: verk utan sådan koppling
        // kommer inte med i resultatet.
        if (!links.length) continue
        const names = sortBySwedish(
            [...new Set(links.map(row => articleById.get(row.ArticleID).ArticleName))],
            name => name
        )
        rows.push({
            id,
            TitleSwedish: work.TitleSwedish,
            SubtitleSwedish: work.SubtitleSwedish,
            PublishingYearSwedish: work.PublishingYearSwedish,
            Authors: work.Authors,
            Remark: work.Remark,
            ConnectionType: links[0].ConnectionType,
            Translator: names.join(', '),
            Score: String(work.TitleSwedish || '').toLowerCase().includes(needle) ? 1 : 0
        })
    }

    return sortBySwedish(
        rows.sort((a, b) => b.Score - a.Score),
        row => (row.Score === 1 ? '0' : '1'),
        row => row.TitleSwedish
    ).slice(0, 50)
}

async function articleMatchedWorkIds(phrase) {
    const articles = await items('Articles', {
        fields: ['id'],
        filter: { _and: [{ ArticleName: { _contains: phrase } }, publishedFilter] }
    })
    if (!articles.length) return []
    const ids = articles.map(row => row.id)
    const parts = await Promise.all(
        CONNECTION_COLLECTIONS.map(collection =>
            items(collection, { fields: ['WorkID'], filter: { ArticleID: { _in: ids } } })
        )
    )
    return parts.flat().map(row => row.WorkID)
}

async function connectionsForWorks(workIds) {
    if (!workIds.length) return []
    const parts = await Promise.all(
        CONNECTION_COLLECTIONS.map(collection =>
            items(collection, {
                fields: ['WorkID', 'ArticleID', 'ConnectionType'],
                filter: { WorkID: { _in: workIds } }
            })
        )
    )
    return parts.flat()
}

/**
 * Pristagare vars namn matchar frasen. Träffen leder till prisets artikel,
 * inte till pristagarens, eftersom joinen går på PrizeID.
 */
async function prizeHits(phrase) {
    const winners = await items('PrizeWinners', {
        fields: ['PrizeID', 'PrizeWinner'],
        filter: { PrizeWinner: { _contains: phrase } }
    })
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
