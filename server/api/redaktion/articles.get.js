/**
 * Artiklar att koppla importerade verk till, sökta på namn i Directus.
 * Även opublicerade, eftersom verk ofta importeras till en artikel som inte
 * är klar. Kräver inloggning.
 */
export default defineEventHandler(async event => {
    await currentEditor(event)
    const q = String(getQuery(event).q || '').trim()
    if (q.length < 2) return { articles: [] }
    const { data } = await editorRequest(event, '/items/Articles', {
        query: {
            fields: 'id,ArticleName,URLName,Status,TranslatorYearBirth,TranslatorYearDeath',
            filter: JSON.stringify({ ArticleName: { _icontains: q } }),
            sort: 'ArticleName',
            limit: 20
        }
    })
    return { articles: data }
})
