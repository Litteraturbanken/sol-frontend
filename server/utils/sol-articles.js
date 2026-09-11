/**
 * Artikellistorna. Delas av /articles, /articles/<typ>, /articles/latest
 * och /articles/random, som skiljer sig bara i urval och sortering.
 */

/** Sorteringen i list_articles: efternamn, förnamn, med artikelnamn som reserv. */
function articleSortKeys(row) {
    return [
        blank(row.TranslatorLastname) ? row.ArticleName : row.TranslatorLastname,
        blank(row.TranslatorFirstname) ? row.ArticleName : row.TranslatorFirstname
    ]
}

const SORT_FIELDS = ['TranslatorLastname', 'TranslatorFirstname', 'ArticleName']

export async function listArticles(event, articleType = null) {
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })
    const fields = fieldsFor(tokens, 'Articles', SORT_FIELDS)
    const filter =
        articleType === null
            ? publishedFilter
            : { _and: [{ Type: { _eq: articleType } }, publishedFilter] }

    const rows = await items('Articles', { fields: fields.length ? fields : undefined, filter })
    const sorted = sortBySwedish(
        rows,
        row => articleSortKeys(row)[0],
        row => articleSortKeys(row)[1]
    )
    return { data: sorted.map(row => fixDates(projectShow(tokens, { Articles: row }, 'Articles'))) }
}

export async function latestArticles(event, articleType = null) {
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })
    const fields = fieldsFor(tokens, 'Articles', ['DatePublished'])
    const filter =
        articleType === null
            ? publishedFilter
            : { _and: [{ Type: { _eq: articleType } }, publishedFilter] }

    const rows = await items('Articles', {
        fields: fields.length ? fields : undefined,
        filter,
        sort: ['-DatePublished'],
        limit: 8
    })
    return { data: rows.map(row => fixDates(projectShow(tokens, { Articles: row }, 'Articles'))) }
}

/**
 * random_articles: en slumpad publicerad artikel med en ingress som säger
 * något (mer än 15 tecken). För typ 1 krävs dessutom en porträttbild,
 * FileType 4. Directus kan varken sortera slumpmässigt eller mäta
 * stränglängd, så urvalet görs här.
 */
export async function randomArticle(event, articleType = null) {
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })
    const filter =
        articleType === null
            ? publishedFilter
            : { _and: [{ Type: { _eq: articleType } }, publishedFilter] }

    const candidates = await items('Articles', { fields: ['id', 'Ingress'], filter })
    let pool = candidates.filter(row => String(row.Ingress || '').length > 15)

    const portraits = await items('ArticleFiles', {
        fields: ['ArticleID', 'image_ref'],
        filter: { FileType: { _eq: 4 } }
    })
    const portraitByArticle = new Map(portraits.map(row => [row.ArticleID, row.image_ref]))
    if (articleType === 1) pool = pool.filter(row => portraitByArticle.has(row.id))
    if (!pool.length) return { data: [] }

    const pick = pool[Math.floor(Math.random() * pool.length)]
    const fields = fieldsFor(tokens, 'Articles', ['id'])
    const row = await firstItem('Articles', {
        fields: fields.length ? fields : undefined,
        filter: { id: { _eq: pick.id } }
    })
    const projected = fixDates(projectShow(tokens, { Articles: row }, 'Articles'))
    projected.FileName = portraitByArticle.get(pick.id) ?? null
    return { data: [projected] }
}
