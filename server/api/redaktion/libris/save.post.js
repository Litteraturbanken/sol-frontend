/**
 * Sparar importerade verk i Directus som den inloggade redaktören och
 * kopplar dem till en artikel.
 *
 * Kropp: { articleId, connection (1–5), records: [...], dryRun? }
 *
 * Verk vars Libris-id redan finns hoppas över. Går kopplingarna inte att
 * spara tas de nya verken bort igen, så att inga verk blir utan artikel.
 * dryRun svarar med det som skulle sparas utan att skriva något.
 */
import { CONNECTIONS, workPayload } from '~/assets/libris'

function badRequest(message) {
    return createError({ statusCode: 400, statusMessage: 'Bad Request', message })
}

/** Lokal svensk tid, som de verk den tidigare importen skapade. */
function stockholmNow() {
    const parts = Object.fromEntries(
        new Intl.DateTimeFormat('sv-SE', {
            timeZone: 'Europe/Stockholm', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date()).map(p => [p.type, p.value])
    )
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`
}

export default defineEventHandler(async event => {
    const editor = await currentEditor(event)
    const body = (await readBody(event)) || {}
    const articleId = Number(body.articleId)
    const connection = CONNECTIONS[Number(body.connection)]
    const records = Array.isArray(body.records) ? body.records : []
    if (!Number.isInteger(articleId) || articleId < 1) throw badRequest('Välj en artikel')
    if (!connection) throw badRequest('Välj en kopplingstyp')
    if (!records.length) throw badRequest('Inga verk att spara')
    // Äldre Libris-id:n är siffror, nyare (Libris XL) bokstäver och siffror.
    if (records.some(r => !/^[0-9a-z]{1,40}$/i.test(String(r?.libris ?? '')))) throw badRequest('Varje verk behöver ett Libris-id')

    const article = await firstItem('Articles', { fields: ['id', 'ArticleName'], filter: { id: { _eq: articleId } } })
    if (!article) throw badRequest('Artikeln finns inte')

    const ids = [...new Set(records.map(r => String(r.libris)))]
    const existing = new Set(
        (await items('Works', { fields: ['LibrisID'], filter: { LibrisID: { _in: ids } } })).map(w => String(w.LibrisID))
    )
    const languages = await cached('libris:languages', () => items('Languages', { fields: ['id', 'MarcCode'] }))
    const languageIds = new Map(languages.filter(l => l.MarcCode).map(l => [l.MarcCode, l.id]))
    const now = stockholmNow()

    const seen = new Set()
    const works = []
    const skipped = []
    for (const record of records) {
        const id = String(record.libris)
        if (existing.has(id) || seen.has(id)) {
            skipped.push(id)
            continue
        }
        seen.add(id)
        works.push(workPayload(record, { languageId: code => languageIds.get(code), now }))
    }

    const summary = { article: article.ArticleName, connection: connection.table, editor: editor.name, skipped }
    if (body.dryRun) return { ...summary, dryRun: true, works }
    if (!works.length) return { ...summary, created: [] }

    const { data: created } = await editorRequest(event, '/items/Works', {
        method: 'POST',
        body: works,
        query: { fields: 'id,LibrisID' }
    })
    const workIds = created.map(w => w.id)
    try {
        await editorRequest(event, `/items/${connection.table}`, {
            method: 'POST',
            body: workIds.map(WorkID => ({ WorkID, ArticleID: articleId, ConnectionType: Number(body.connection) })),
            query: { fields: 'id' }
        })
    } catch (error) {
        await editorRequest(event, '/items/Works', { method: 'DELETE', body: workIds }).catch(() => {})
        throw error
    }
    return { ...summary, created: created.map(w => ({ id: w.id, libris: String(w.LibrisID) })) }
})
