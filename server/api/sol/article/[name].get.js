/**
 * En artikel med allt sidan behöver: artikelraden, dess bild, medarbetare,
 * länkar, priser och kopplade verk.
 *
 * Statusfiltret saknas med flit. Python-API:t har samma kommentar: en
 * opublicerad artikel ska gå att förhandsgranska via sin adress.
 */

const IMAGE_FILE_TYPES = [1, 2]

export default defineEventHandler(async event => {
    const name = decodedParam(event, 'name')
    const tokens = parseShow(getQuery(event).show, {
        prefix: 'A1',
        additional: [
            'A1.id',
            'A1.URLName',
            'A1.Type',
            'A2.URLName:RedirectToArticle',
            'A1.Status',
            'directus_files.id:FileName'
        ]
    })

    const fields = fieldsFor(tokens, 'A1', ['id', 'URLName', 'Type', 'Status', 'RedirectToArticleID'])
    const article = await firstItem('Articles', {
        fields,
        filter: { URLName: { _eq: name } }
    })
    if (!article) {
        throw createError({ statusCode: 404, statusMessage: 'Article not found' })
    }

    // ORDER BY FileType LIMIT 1 bland FileType 1 och 2: omslag före porträtt.
    const [files, types, redirect, contributors, links, prizes, works, bibliographyTypeRows] =
        await Promise.all([
            items('ArticleFiles', {
                fields: ['FileType', 'FileDescription', 'image_ref'],
                filter: {
                    _and: [{ ArticleID: { _eq: article.id } }, { FileType: { _in: IMAGE_FILE_TYPES } }]
                },
                sort: ['FileType'],
                limit: 1
            }),
            article.Type === null || article.Type === undefined
                ? []
                : items('ArticleTypes', { filter: { id: { _eq: article.Type } }, limit: 1 }),
            article.RedirectToArticleID
                ? items('Articles', {
                      fields: ['URLName'],
                      filter: { id: { _eq: article.RedirectToArticleID } },
                      limit: 1
                  })
                : [],
            articleContributors(article.id),
            items('ArticleLinks', {
                fields: ['ArticleLinkTitle', 'ArticleLinkURL'],
                filter: { ArticleID: { _eq: article.id } }
            }),
            articlePrizes(article.id),
            getWorks(article.URLName),
            bibliographyTypes()
        ])

    const file = files[0] ?? null
    const result = {
        article: fixDates(
            projectShow(
                tokens,
                {
                    A1: article,
                    A2: redirect[0] ?? null,
                    ArticleTypes: types[0] ?? null,
                    ArticleFiles: file,
                    directus_files: file?.image_ref ? { id: file.image_ref } : null
                },
                'A1'
            )
        ),
        contributors,
        works,
        bibliography_types: bibliographyTypeRows,
        links,
        prizes,
        files: []
    }

    if (article.Type === 2) {
        result.prizewinners = await prizeWinners(article.id)
    }
    return result
})

/** Artikelns skribenter, via ArticleAuthors. */
async function articleContributors(articleId) {
    const links = await items('ArticleAuthors', {
        fields: ['ContributorID'],
        filter: { ArticleID: { _eq: articleId } }
    })
    const ids = links.map(row => row.ContributorID).filter(id => id !== null)
    if (!ids.length) return []
    const rows = await items('Contributors', {
        fields: ['id', 'FirstName', 'LastName', 'URLName'],
        filter: { id: { _in: ids } }
    })
    const byId = new Map(rows.map(row => [row.id, row]))
    return ids
        .map(id => byId.get(id))
        .filter(Boolean)
        .map(({ FirstName, LastName, URLName }) => ({ FirstName, LastName, URLName }))
}

/** Priser som artikeln tilldelats: namnet på priset och året. */
async function articlePrizes(articleId) {
    const rows = await items('PrizeWinners', {
        fields: ['PrizeID', 'Year'],
        filter: { ArticleID: { _eq: articleId } }
    })
    const prizeIds = rows.map(row => row.PrizeID).filter(id => id !== null)
    if (!prizeIds.length) return []
    const prizeArticles = await items('Articles', {
        fields: ['id', 'ArticleName', 'URLName'],
        filter: { id: { _in: prizeIds } }
    })
    const byId = new Map(prizeArticles.map(row => [row.id, row]))
    return rows
        .filter(row => byId.has(row.PrizeID))
        .map(row => ({
            Prize: byId.get(row.PrizeID).ArticleName,
            Year: row.Year,
            URLName: byId.get(row.PrizeID).URLName
        }))
}

/**
 * Pristagare för en prisartikel. Namnet tas från den vunnande artikeln när
 * den är publicerad, annars från den fritext som står i PrizeWinners.
 */
async function prizeWinners(prizeId) {
    const rows = await items('PrizeWinners', {
        fields: ['Year', 'ArticleID', 'PrizeWinner'],
        filter: { PrizeID: { _eq: prizeId } }
    })
    const articleIds = rows.map(row => row.ArticleID).filter(id => id !== null)
    const articles = articleIds.length
        ? await items('Articles', {
              fields: ['id', 'ArticleName', 'URLName'],
              filter: { _and: [{ id: { _in: articleIds } }, publishedFilter] }
          })
        : []
    const byId = new Map(articles.map(row => [row.id, row]))
    const mapped = rows.map(row => {
        const article = byId.get(row.ArticleID) ?? null
        return {
            Year: row.Year,
            id: article?.id ?? null,
            ArticleName: article?.ArticleName ?? null,
            URLName: article?.URLName ?? null,
            PrizeWinner: article?.ArticleName ?? row.PrizeWinner
        }
    })
    return sortBySwedish(mapped, row => row.Year)
}
