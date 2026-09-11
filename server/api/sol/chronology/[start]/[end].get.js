/**
 * Översättare vars verk utkom inom ett årsspann, och som levde då.
 *
 * SQL:en jämför RealYear mot spannet som tal men mot översättarens
 * födelse- och dödsår som text, eftersom alla tre kolumnerna är varchar och
 * MySQL konverterar bara när ena sidan är ett tal. Samma blandning görs här.
 */

/** MySQL:s konvertering av sträng till tal: inledande siffror, annars noll. */
function mysqlNumber(value) {
    const match = /^\s*[-+]?\d*\.?\d*/.exec(String(value ?? ''))
    const number = Number.parseFloat(match?.[0] ?? '')
    return Number.isFinite(number) ? number : 0
}

const CHRONOLOGY_TYPES = [1, 3]

export default defineEventHandler(async event => {
    const start = mysqlNumber(decodedParam(event, 'start'))
    const end = mysqlNumber(decodedParam(event, 'end'))
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })

    const [range, works, connections, articles] = await Promise.all([
        yearRange(),
        worksIndex(),
        allConnections(),
        items('Articles', {
            fields: [
                ...new Set([
                    ...fieldsFor(tokens, 'Articles'),
                    'id',
                    'TranslatorLastname',
                    'TranslatorFirstname',
                    'TranslatorYearBirth',
                    'TranslatorYearDeath'
                ])
            ],
            filter: { _and: [{ Type: { _eq: 1 } }, publishedFilter] }
        })
    ])
    const articleById = new Map(articles.map(row => [row.id, row]))

    const matched = new Map()
    for (const connection of connections) {
        if (!CHRONOLOGY_TYPES.includes(Number(connection.ConnectionType))) continue
        const article = articleById.get(connection.ArticleID)
        if (!article || matched.has(article.id)) continue
        const work = works.get(connection.WorkID)
        if (!work || Number(work.Unpublished) !== 0) continue

        const year = mysqlNumber(work.RealYear)
        if (year < start || year > end) continue

        const realYear = String(work.RealYear ?? '')
        if (compareSwedish(realYear, String(article.TranslatorYearBirth ?? '')) < 0) continue
        const death = article.TranslatorYearDeath
        if (!blank(death) && compareSwedish(realYear, String(death)) > 0) continue

        matched.set(article.id, article)
    }

    const sorted = sortBySwedish(
        [...matched.values()],
        row => row.TranslatorLastname,
        row => row.TranslatorFirstname
    )

    return {
        articles: sorted.map(row => fixDates(projectShow(tokens, { Articles: row }, 'Articles'))),
        min: range.min,
        max: range.max
    }
})

/**
 * Spannet som tidslinjen visar: tidigaste födelseår och senaste dödsår över
 * alla artiklar, oavsett publiceringsstatus. Kolumnerna är text, så MIN och
 * MAX är bokstavsordning precis som i SQL.
 */
function yearRange() {
    return cached('chronologyRange', async () => {
        const rows = await items('Articles', {
            fields: ['TranslatorYearBirth', 'TranslatorYearDeath']
        })
        const births = rows.map(row => row.TranslatorYearBirth).filter(value => value !== '' && value !== null)
        const deaths = rows.map(row => row.TranslatorYearDeath).filter(value => value !== null)
        const min = births.sort(compareSwedish)[0]
        const max = deaths.sort(compareSwedish)[deaths.length - 1]
        return { min: Number.parseInt(min, 10), max: Number.parseInt(max, 10) }
    })
}
