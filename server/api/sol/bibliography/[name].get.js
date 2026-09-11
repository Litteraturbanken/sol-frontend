/**
 * Bibliografi. Samma rutt tjänar två syften i Python-API:t, som skiljer dem
 * åt på om parametern är ett tal:
 *
 *   /bibliography/<artikelns URLName>  hela översättarens bibliografi
 *   /bibliography/<verk-id>            ett enskilt verk med sina artiklar
 *
 * Namnet `_all` ger alla verk och används av den statiska genereringen.
 */
export default defineEventHandler(async event => {
    const name = decodedParam(event, 'name')
    if (/^\d+$/.test(name)) return singleWork(Number(name))
    return bibliographyForArticle(name, null)
})

/** Språkräkningen i get_bibliography: SUM(CASE ...) per språk. */
export async function languageCounts(articleUrlName) {
    const languages = await items('Languages', { fields: ['id', 'LanguageName'], sort: ['id'] })

    let connections
    if (articleUrlName === '_all') {
        // INNER JOIN Articles ... WHERE Articles.Status = 3: bara kopplingar
        // till publicerade artiklar räknas.
        const published = await publishedArticleIds()
        connections = (await allConnections()).filter(row => published.has(row.ArticleID))
    } else {
        const article = await firstItem('Articles', {
            fields: ['id', 'Status'],
            filter: { URLName: { _eq: articleUrlName } }
        })
        if (!article || article.Status !== PUBLISHED_STATUS) return []
        connections = await connectionsForArticle(article.id)
    }
    if (!connections.length) return []

    const works = await worksByIds(connections.map(row => row.WorkID), {
        fields: ['id', 'LanguageOriginal', 'LanguageTarget', 'LanguageSource']
    })

    const counts = new Map(
        languages.map(row => [row.id, { matched: false, original: 0, target: 0, source: 0 }])
    )
    for (const connection of connections) {
        const work = works.get(connection.WorkID)
        if (!work) continue
        // INNER JOIN Languages ON id = original OR target OR source. Ett verk
        // bidrar alltså till varje språk det nämner, och ett språk kommer med
        // i svaret så snart joinen träffat det, även om alla summor blir noll.
        for (const language of languages) {
            const bucket = counts.get(language.id)
            const hit =
                work.LanguageOriginal === language.id ||
                work.LanguageTarget === language.id ||
                work.LanguageSource === language.id
            if (!hit) continue
            bucket.matched = true
            if (work.LanguageOriginal === language.id) bucket.original += 1
            if (work.LanguageTarget === language.id && Number(connection.ConnectionType) === 1) {
                bucket.target += 1
            }
            if (
                work.LanguageSource === language.id ||
                (work.LanguageSource === null && work.LanguageOriginal === language.id)
            ) {
                bucket.source += 1
            }
        }
    }

    return languages
        .filter(language => counts.get(language.id).matched)
        .map(language => {
            const { original, target, source } = counts.get(language.id)
            return { id: language.id, LanguageName: language.LanguageName, original, target, source }
        })
}

export async function bibliographyForArticle(name, connectionType) {
    const [works, languages, types] = await Promise.all([
        getWorks(name, connectionType),
        languageCounts(name),
        bibliographyTypes()
    ])

    let article = ''
    if (name !== '_all') {
        const row = await firstItem('Articles', {
            fields: ['ArticleName'],
            filter: { _and: [{ URLName: { _eq: name } }, publishedFilter] }
        })
        article = row ? row.ArticleName : ''
    }
    return { works, languages, article, bibliography_types: types }
}

/** Ett verk och de artiklar det är kopplat till. */
export async function singleWork(workId) {
    const languages = await languagesById()
    const fields = await realFields('Works')
    const rows = await items('Works', { fields, filter: { id: { _eq: workId } } })
    const work = rows.map(row => ({
        ...fixDates(row),
        LanguageOriginalName: languages.get(row.LanguageOriginal) ?? null,
        LanguageSourceName: languages.get(row.LanguageSource) ?? null
    }))

    const connections = await connectionsForWork(workId)
    const articleIds = connections.map(row => row.ArticleID).filter(id => id !== null)
    const articles = articleIds.length
        ? await items('Articles', {
              fields: ['id', 'ArticleName', 'URLName', 'Status'],
              filter: { _and: [{ id: { _in: articleIds } }, { Status: { _in: [3, 5] } }] }
          })
        : []
    const byId = new Map(articles.map(row => [row.id, row]))

    return {
        work,
        articles: connections
            .filter(row => byId.has(row.ArticleID))
            .map(row => {
                const article = byId.get(row.ArticleID)
                return {
                    ArticleName: article.ArticleName,
                    URLName: article.Status === PUBLISHED_STATUS ? article.URLName : null,
                    ConnectionType: row.ConnectionType
                }
            })
    }
}
