/**
 * Läsklient mot Directus (filisol), som är lexikonets databas.
 *
 * Serverlagret i server/api/sol/ återger Python-API:ts svar fält för fält,
 * så att sidorna inte behöver ändras. Därför finns en del hjälpfunktioner
 * här som härmar SQL-beteenden: svensk kollation i sorteringen, och
 * ORDER BY-uttryck av typen "CASE WHEN x = '' THEN ... ELSE x END".
 */

const collator = new Intl.Collator('sv', { sensitivity: 'variant' })

let config = null

function directusConfig() {
    if (!config) {
        const runtime = useRuntimeConfig()
        const url = String(runtime.directusUrl || '').replace(/\/+$/, '')
        const token = String(runtime.directusToken || '')
        if (!url || !token) {
            throw createError({
                statusCode: 500,
                statusMessage: 'Directus is not configured',
                message: 'Sätt NUXT_DIRECTUS_URL och NUXT_DIRECTUS_TOKEN i miljön.'
            })
        }
        config = { url, token }
    }
    return config
}

/** Rått anrop mot Directus. Fel översätts till 502 med orsaken kvar. */
export async function directusRequest(path, query) {
    const { url, token } = directusConfig()
    try {
        return await $fetch(path, {
            baseURL: url,
            headers: { Authorization: `Bearer ${token}` },
            query
        })
    } catch (error) {
        const detail =
            error?.data?.errors?.map(item => item.message).join('; ') || error?.message || 'okänt fel'
        throw createError({
            statusCode: 502,
            statusMessage: 'Directus request failed',
            message: `Directus ${path}: ${detail}`
        })
    }
}

/**
 * Filtret skickas i URL:en, och Node avvisar begäranden över 16 kB med 431.
 * En "_in"-lista med fler id:n än så här delas därför upp i flera anrop.
 * Ett sök på en kort fras kan träffa tjugotusen verk.
 */
const IN_CHUNK = 500
const IN_CONCURRENCY = 4

/** Hittar en lång "_in"-lista i filtret: returnerar [{ ids, replace(chunk) }] eller null. */
function longInList(filter) {
    let found = null
    const walk = (node, set) => {
        if (found || !node || typeof node !== 'object') return
        for (const [key, value] of Object.entries(node)) {
            if (key === '_in' && Array.isArray(value) && value.length > IN_CHUNK) {
                found = { ids: value, replace: chunk => set({ ...node, _in: chunk }) }
                return
            }
            if (value && typeof value === 'object') {
                walk(value, replacement => {
                    if (Array.isArray(node)) {
                        const copy = node.slice()
                        copy[key] = replacement
                        set(copy)
                    } else {
                        set({ ...node, [key]: replacement })
                    }
                })
            }
        }
    }
    let result = filter
    walk(filter, replacement => {
        result = replacement
    })
    if (!found) return null
    const { ids, replace } = found
    return {
        ids,
        withChunk: chunk => {
            result = filter
            replace(chunk)
            return result
        }
    }
}

/** Kör funktionen över listan med högst `limit` anrop i taget, i ordning. */
async function mapLimit(list, limit, fn) {
    const results = new Array(list.length)
    let next = 0
    const worker = async () => {
        while (next < list.length) {
            const index = next++
            results[index] = await fn(list[index])
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, list.length) }, worker))
    return results
}

/**
 * Hämtar rader ur en collection. `filter`, `sort`, `fields` och `deep` följer
 * Directus egen syntax. limit -1 betyder alla rader.
 *
 * En lång "_in"-lista i filtret delas upp i block om IN_CHUNK id:n och
 * svaren slås ihop. Det gäller bara när alla rader hämtas (limit -1, ingen
 * sidindelning eller aggregering); raderna kommer då blockvis, så den som
 * behöver en viss ordning sorterar själv, vilket alla anropare redan gör.
 */
export async function items(collection, options = {}) {
    const { filter, limit = -1, page, offset, aggregate, groupBy } = options
    const long = filter && limit === -1 && page === undefined && offset === undefined && !aggregate && !groupBy
        ? longInList(filter)
        : null
    if (long) {
        const chunks = []
        for (let i = 0; i < long.ids.length; i += IN_CHUNK) chunks.push(long.ids.slice(i, i + IN_CHUNK))
        const parts = await mapLimit(chunks, IN_CONCURRENCY, chunk =>
            singleRequest(collection, { ...options, filter: long.withChunk(chunk) })
        )
        return parts.flat()
    }
    return singleRequest(collection, options)
}

async function singleRequest(collection, { fields, filter, sort, limit = -1, page, offset, deep, aggregate, groupBy }) {
    const query = {}
    if (fields?.length) query.fields = fields.join(',')
    if (filter) query.filter = JSON.stringify(filter)
    if (sort?.length) query.sort = sort.join(',')
    if (limit !== undefined) query.limit = limit
    if (page !== undefined) query.page = page
    if (offset !== undefined) query.offset = offset
    if (deep) query.deep = JSON.stringify(deep)
    if (aggregate) for (const [fn, field] of Object.entries(aggregate)) query[`aggregate[${fn}]`] = field
    if (groupBy?.length) query['groupBy[]'] = groupBy
    const response = await directusRequest(`/items/${collection}`, query)
    return response?.data ?? []
}

/** Första raden, eller null. Motsvarar fetchone() i Python-API:t. */
export async function firstItem(collection, options) {
    const rows = await items(collection, { ...options, limit: 1 })
    return rows[0] ?? null
}

/**
 * Kolumnerna som faktiskt finns i databastabellen. Directus lägger till
 * relationsfält (o2m och m2m) som inte är kolumner, och de ska inte med när
 * Python-API:t skrev "SELECT tabell.*".
 */
export function realFields(collection) {
    return cached(`fields:${collection}`, async () => {
        const response = await directusRequest(`/fields/${collection}`)
        return (response?.data ?? []).filter(field => field.type !== 'alias').map(field => field.field)
    })
}

/** Kolumner i en tabell som är datum, och därför ska serialiseras som Flask. */
export function dateFields(collection) {
    return cached(`dates:${collection}`, async () => {
        const response = await directusRequest(`/fields/${collection}`)
        return new Set(
            (response?.data ?? [])
                .filter(field => ['dateTime', 'timestamp', 'date'].includes(field.type))
                .map(field => field.field)
        )
    })
}

// ---------------------------------------------------------------------------
// SQL-härmande hjälpare
// ---------------------------------------------------------------------------

/**
 * Jämför som MySQL med utf8_swedish_ci och stigande ordning. NULL sorteras
 * före allt annat, även före tom sträng, vilket skiljer artiklar utan
 * översättarnamn från dem som har fältet tomt.
 */
export function compareSwedish(a, b) {
    const aNull = a === null || a === undefined
    const bNull = b === null || b === undefined
    if (aNull || bNull) return aNull && bNull ? 0 : aNull ? -1 : 1
    if (a === b) return 0
    return collator.compare(String(a), String(b))
}

/** Sorterar på flera nycklar, var och en en funktion som ger ett värde. */
export function sortBySwedish(rows, ...keys) {
    return [...rows].sort((a, b) => {
        for (const key of keys) {
            const result = compareSwedish(key(a), key(b))
            if (result !== 0) return result
        }
        return 0
    })
}

/** Tom sträng och null räknas som saknat värde, som i SQL-uttrycken. */
export function blank(value) {
    return value === null || value === undefined || value === ''
}

/**
 * Enkel cache för uppslagstabeller som ändras sällan. Lexikonet redigeras
 * några gånger i veckan, så en minut är rikligt och sparar Directus-anrop
 * på varje sidvisning.
 *
 * Ett utgånget värde lämnas ut direkt medan ett nytt hämtas i bakgrunden,
 * så att stora index (verksökningen) inte ger en långsam sida när de
 * förnyas. Samtidiga anrop delar på samma hämtning.
 */
const CACHE_TTL_MS = 60_000
const cache = new Map()

export async function cached(key, loader, ttl = CACHE_TTL_MS) {
    const hit = cache.get(key)
    const fresh = hit && 'value' in hit && Date.now() - hit.at < ttl
    if (fresh) return hit.value
    if (!hit?.pending) {
        const pending = loader().then(
            value => {
                cache.set(key, { at: Date.now(), value })
                return value
            },
            error => {
                if (hit && 'value' in hit) cache.set(key, { at: hit.at, value: hit.value })
                else cache.delete(key)
                throw error
            }
        )
        cache.set(key, { ...(hit ?? {}), pending })
        if (hit && 'value' in hit) {
            pending.catch(() => {})
            return hit.value
        }
        return pending
    }
    return 'value' in hit ? hit.value : hit.pending
}

export function clearCache() {
    cache.clear()
}
