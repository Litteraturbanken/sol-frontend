/**
 * Verk av en viss upphovsman, med de artiklar varje verk är kopplat till.
 * Matchningen är exakt på Works.Authors, som i Python-API:t.
 */
export default defineEventHandler(async event => {
    const author = decodedParam(event, 'author')
    const tokens = parseShow(getQuery(event).show, { prefix: 'Works' })
    const languages = await languagesById()

    const fields = tokens.length
        ? fieldsFor(tokens, 'Works', ['id', 'RealYear', 'PublishingYearSwedish', 'LanguageOriginal', 'LanguageTarget', 'LanguageSource'])
        : await realFields('Works')
    const works = await items('Works', {
        fields,
        filter: { _and: [{ Authors: { _eq: author } }, { Unpublished: { _eq: 0 } }] }
    })
    if (!works.length) return { data: [] }

    // LEFT JOIN mot kopplingar och artiklar: verk utan koppling ska med.
    const workIds = works.map(row => row.id)
    const parts = await Promise.all(
        CONNECTION_COLLECTIONS.map(collection =>
            items(collection, {
                fields: ['WorkID', 'ArticleID', 'ConnectionType'],
                filter: { WorkID: { _in: workIds } }
            })
        )
    )
    const connections = parts.flat()
    const articleIds = connections.map(row => row.ArticleID).filter(id => id !== null)
    const articles = articleIds.length
        ? await items('Articles', {
              fields: ['id', 'ArticleName', 'URLName', 'Status'],
              filter: { _and: [{ id: { _in: articleIds } }, { Status: { _in: [3, 5] } }] }
          })
        : []
    const articleById = new Map(articles.map(row => [row.id, row]))

    const byWork = new Map()
    for (const connection of connections) {
        const list = byWork.get(connection.WorkID) ?? []
        list.push(connection)
        byWork.set(connection.WorkID, list)
    }

    const sorted = sortBySwedish(
        works,
        row => row.RealYear,
        row => row.PublishingYearSwedish,
        row => String(row.id).padStart(12, '0')
    )

    return {
        data: sorted.map(row => {
            const base = tokens.length ? projectShow(tokens, { Works: row }, 'Works') : { ...row }
            const work = {
                ...fixDates(base),
                LanguageOriginalName: languages.get(row.LanguageOriginal) ?? null,
                LanguageTargetName: languages.get(row.LanguageTarget) ?? null,
                LanguageSourceName: languages.get(row.LanguageSource) ?? null
            }
            // SELECT-listan har både Works.* och ett uttryckligt Works.id, och
            // MySQLdb gav den andra kolumnen nyckeln "Works.id".
            if ('id' in work) work['Works.id'] = row.id
            else work.id = row.id
            const links = byWork.get(row.id) ?? []
            // ConnectionType på verket kommer från den första kopplingen,
            // precis som i SQL-resultatets första rad för verket.
            work.ConnectionType = links.length ? links[0].ConnectionType : null
            work.articles = links
                .filter(link => articleById.has(link.ArticleID))
                .map(link => ({
                    ArticleName: articleById.get(link.ArticleID).ArticleName,
                    URLName: articleById.get(link.ArticleID).URLName,
                    ConnectionType: link.ConnectionType
                }))
            return work
        })
    }
})
