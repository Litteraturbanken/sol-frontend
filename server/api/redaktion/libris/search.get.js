/**
 * Sökning i Libris xsearch. Svarar med posterna tolkade ur MARC och med de
 * Libris-id:n som redan finns som verk i Directus. Kräver inloggning.
 *
 *   ?q=Nonnen&swe=1&books=1
 */
import { XSEARCH_URL, librisQuery, parseMarcXml } from '~/assets/libris'

export default defineEventHandler(async event => {
    await currentEditor(event)
    const params = getQuery(event)
    const q = String(params.q || '').trim()
    if (!q) throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ange en sökning' })
    const query = librisQuery(q, { swedishOnly: params.swe !== '0', booksOnly: params.books !== '0' })

    let xml
    try {
        xml = await $fetch(XSEARCH_URL, {
            query: { query, format: 'marcxml', format_level: 'full', n: 2000, order: '-chronological' },
            responseType: 'text',
            timeout: 60_000
        })
    } catch (error) {
        throw createError({ statusCode: 502, statusMessage: 'Libris', message: `Libris svarade inte: ${error?.message}` })
    }
    const { total, records } = parseMarcXml(xml)
    const ids = records.map(r => r.libris).filter(Boolean)
    const existing = ids.length
        ? (await items('Works', { fields: ['LibrisID'], filter: { LibrisID: { _in: ids } } })).map(w => String(w.LibrisID))
        : []
    return { query, total, records, existing }
})
