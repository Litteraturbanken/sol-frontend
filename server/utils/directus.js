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
 * Hämtar rader ur en collection. `filter`, `sort`, `fields` och `deep` följer
 * Directus egen syntax. limit -1 betyder alla rader.
 */
export async function items(collection, { fields, filter, sort, limit = -1, page, offset, deep, aggregate, groupBy } = {}) {
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
 */
const CACHE_TTL_MS = 60_000
const cache = new Map()

export async function cached(key, loader, ttl = CACHE_TTL_MS) {
    const hit = cache.get(key)
    if (hit && Date.now() - hit.at < ttl) return hit.value
    const value = await loader()
    cache.set(key, { at: Date.now(), value })
    return value
}

export function clearCache() {
    cache.clear()
}
