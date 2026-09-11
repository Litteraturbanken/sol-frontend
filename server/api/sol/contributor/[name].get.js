/**
 * En medarbetare med de artiklar hen skrivit. Python-API:t hämtar hela
 * Contributors-raden men bara show-fälten för artiklarna, och returnerar
 * contributor: null när namnet inte finns.
 */
export default defineEventHandler(async event => {
    const name = decodedParam(event, 'name')
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })

    const contributor = await firstItem('Contributors', { filter: { URLName: { _eq: name } } })
    if (!contributor) return { data: { contributor: null, articles: [] } }

    const links = await items('ArticleAuthors', {
        fields: ['ArticleID'],
        filter: { ContributorID: { _eq: contributor.id } }
    })
    const articleIds = links.map(row => row.ArticleID).filter(id => id !== null)
    if (!articleIds.length) return { data: { contributor: fixDates(contributor), articles: [] } }

    const fields = fieldsFor(tokens, 'Articles', ['TranslatorLastname', 'TranslatorFirstname'])
    const rows = await items('Articles', {
        fields: fields.length ? fields : undefined,
        filter: { _and: [{ id: { _in: articleIds } }, publishedFilter] }
    })
    const sorted = sortBySwedish(
        rows,
        row => row.TranslatorLastname,
        row => row.TranslatorFirstname
    )
    return {
        data: {
            contributor: fixDates(contributor),
            articles: sorted.map(row =>
                fixDates(projectShow(tokens, { Articles: row, Contributors: contributor }, 'Articles'))
            )
        }
    }
})
