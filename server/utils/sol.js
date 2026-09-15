/**
 * Lexikonets datamodell ovanpå Directus.
 *
 * Två saker härmas från Python-API:t med flit, eftersom svaren måste se
 * likadana ut för sidorna:
 *
 *  - `show=`-parametern. Den är en SELECT-lista där `A.B` hämtar kolumn B ur
 *    tabell A och `A.B:C` döper om den till C. Utdatanyckeln blir aliaset,
 *    annars kolumnnamnet.
 *  - Vyn `WorkConnection`, som i MySQL är en UNION av fem kopplingstabeller.
 *    Vyn har inget unikt id och kan därför inte registreras som en collection
 *    i Directus, så de fem tabellerna läses var för sig och slås ihop här.
 */

export const CONNECTION_COLLECTIONS = [
    'WorkConnectionTranslator',
    'WorkConnectionAboutArticle',
    'WorkConnectionAuthor',
    'WorkConnectionReference',
    'WorkConnectionAboutWork'
]

const PUBLISHED = 3

// ---------------------------------------------------------------------------
// show=
// ---------------------------------------------------------------------------

/**
 * Tolkar `show` till en lista av {source, column, alias}. `prefix` är den
 * tabell som kolumner utan punkt hör till, `additional` läggs till sist
 * precis som i Python-API:t.
 */
export function parseShow(show, { prefix = null, additional = [], defaultSource = null } = {}) {
    const raw = String(show || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    const all = [...raw.map(item => (prefix && !item.includes('.') ? `${prefix}.${item}` : item)), ...additional]
    return all.map(item => {
        const [path, alias] = item.split(':')
        const parts = path.split('.')
        const column = parts.pop()
        // Utan prefix skriver anroparen ibland "ArticleName" och ibland
        // "Articles.ArticleName". Båda pekar på samma tabell.
        const source = parts.pop() || prefix || defaultSource
        return { source, column, alias: alias || column }
    })
}

/**
 * Bygger ett svarsobjekt av tolkade show-fält. `sources` är en karta från
 * tabellnamn till radobjekt (eller null när joinen inte gav någon rad).
 * Tom `tokens` betyder SELECT *, alltså hela huvudraden.
 */
export function projectShow(tokens, sources, defaultSource) {
    if (!tokens.length) return { ...(sources[defaultSource] || {}) }
    const result = {}
    for (const { source, column, alias } of tokens) {
        const row = sources[source ?? defaultSource]
        const value = row ? (row[column] ?? null) : null
        // MySQLdb:s DictCursor särskiljer kolumner som får samma namn genom
        // att sätta tabellnamnet före. Artikelsvaret innehåller därför både
        // "id" och "A1.id" när show och de fasta fälten överlappar.
        const key = alias in result ? `${source ?? defaultSource}.${column}` : alias
        result[key] = value
    }
    return result
}

/** Plockar fälten en show-lista behöver ur en viss tabell, plus extrafält. */
export function fieldsFor(tokens, source, extra = []) {
    const wanted = tokens.filter(token => token.source === source).map(token => token.column)
    return [...new Set([...wanted, ...extra])]
}

/**
 * Flask serialiserar MySQL:s datetime som RFC 1123 i UTC, t.ex.
 * "Wed, 18 Mar 2026 10:24:00 GMT". Directus ger ISO utan tidszon. Utan den
 * här omvandlingen tolkar webbläsaren tiden som lokal och datumet kan hoppa
 * ett dygn i sidornas datumformatering.
 */
export function toFlaskDate(value) {
    if (!value) return null
    const text = String(value)
    const utc = /[Zz]|[+-]\d\d:?\d\d$/.test(text) ? text : `${text.replace(' ', 'T')}Z`
    const date = new Date(utc)
    return Number.isNaN(date.getTime()) ? value : date.toUTCString()
}

/** Datumkolumnerna i SOL-schemat, hämtade ur Directus fältdefinitioner. */
const DATE_COLUMNS = new Set(['CreatedDate', 'DatePublished', 'LastUpdated', 'ModifiedDate'])

/** Kör toFlaskDate på de kolumner som är datum i SOL-schemat. */
export function fixDates(row) {
    if (!row) return row
    const result = { ...row }
    for (const key of Object.keys(result)) {
        if (DATE_COLUMNS.has(key)) result[key] = toFlaskDate(result[key])
    }
    return result
}

// ---------------------------------------------------------------------------
// Uppslagstabeller
// ---------------------------------------------------------------------------

export function languagesById() {
    return cached('languages', async () => {
        const rows = await items('Languages', { fields: ['id', 'LanguageName'] })
        return new Map(rows.map(row => [row.id, row.LanguageName]))
    })
}

export function bibliographyTypes() {
    return cached('bibliographyTypes', () => items('BibliographyTypes', { sort: ['id'] }))
}

/** Alla kopplingar bok–artikel, sammanslagna ur de fem tabellerna. */
export function allConnections() {
    return cached('connections', async () => {
        const parts = await Promise.all(
            CONNECTION_COLLECTIONS.map(collection =>
                items(collection, { fields: ['WorkID', 'ArticleID', 'ConnectionType'] })
            )
        )
        return parts.flat()
    })
}

/**
 * Kompakt index över alla verk: bara de kolumner som språk- och
 * kronologisidorna räknar på. Tabellen har drygt fyrtiotusen rader, så den
 * hämtas en gång och återanvänds i stället för att läsas per besök.
 */
export function worksIndex() {
    return cached('worksIndex', async () => {
        const rows = await items('Works', {
            fields: ['id', 'LanguageOriginal', 'LanguageTarget', 'LanguageSource', 'Unpublished', 'RealYear']
        })
        return new Map(rows.map(row => [row.id, row]))
    })
}

/**
 * Id:n för alla artiklar. Kopplingstabellerna innehåller några rader som
 * pekar på artiklar som inte finns, och SQL:ens INNER JOIN mot Articles
 * sorterade bort dem.
 */
export function allArticleIds() {
    return cached('allArticleIds', async () => {
        const rows = await items('Articles', { fields: ['id'] })
        return new Set(rows.map(row => row.id))
    })
}

/** Id:n för publicerade artiklar, för join-villkoret Articles.Status = 3. */
export function publishedArticleIds() {
    return cached('publishedArticleIds', async () => {
        const rows = await items('Articles', { fields: ['id'], filter: publishedFilter })
        return new Set(rows.map(row => row.id))
    })
}

/** Namn på publicerade artiklar, id → ArticleName. Några hundra rader. */
export function publishedArticleNames() {
    return cached('publishedArticleNames', async () => {
        const rows = await items('Articles', { fields: ['id', 'ArticleName'], filter: publishedFilter })
        return new Map(rows.map(row => [row.id, row.ArticleName]))
    })
}

/** Kopplingar för en viss artikel. Små mängder, hämtas direkt. */
export async function connectionsForArticle(articleId) {
    const parts = await Promise.all(
        CONNECTION_COLLECTIONS.map(collection =>
            items(collection, {
                fields: ['WorkID', 'ArticleID', 'ConnectionType'],
                filter: { ArticleID: { _eq: articleId } }
            })
        )
    )
    return parts.flat()
}

/** Kopplingar för ett visst verk. */
export async function connectionsForWork(workId) {
    const parts = await Promise.all(
        CONNECTION_COLLECTIONS.map(collection =>
            items(collection, {
                fields: ['WorkID', 'ArticleID', 'ConnectionType'],
                filter: { WorkID: { _eq: workId } }
            })
        )
    )
    return parts.flat()
}

/** Hämtar verk på id. Långa id-listor delas upp av items(). */
export async function worksByIds(ids, { fields, publishedOnly = true } = {}) {
    const unique = [...new Set(ids)]
    if (!unique.length) return new Map()
    // "SELECT Works.*" i SQL gav bara riktiga kolumner, inte Directus
    // relationsfält.
    fields = fields ?? (await realFields('Works'))
    const filter = publishedOnly
        ? { _and: [{ id: { _in: unique } }, { Unpublished: { _eq: 0 } }] }
        : { id: { _in: unique } }
    const rows = await items('Works', { fields, filter })
    return new Map(rows.map(row => [row.id, row]))
}

/** Lägger på språknamnen som get_works() hämtar via tre LEFT JOIN. */
export function withLanguageNames(work, languages) {
    return {
        LanguageOriginalName: languages.get(work.LanguageOriginal) ?? null,
        LanguageTargetName: languages.get(work.LanguageTarget) ?? null,
        LanguageSourceName: languages.get(work.LanguageSource) ?? null,
        ...fixDates(work)
    }
}

/**
 * ORDER BY CASE WHEN RealYear = '' THEN 9999 ELSE RealYear END COLLATE
 * utf8_swedish_ci. Jämförelsen är alltså på sträng, inte tal.
 *
 * Verk med samma år låg i MySQL i den ordning UNION-vyns temporärtabell
 * råkade ge, alltså inget som går att återskapa och inget redaktionellt
 * menat. Här sorteras de i stället på verkets id, så att listan blir
 * densamma varje gång.
 */
export function sortWorksByRealYear(works) {
    const year = work => (blank(work.RealYear) ? '9999' : String(work.RealYear))
    return sortBySwedish(works, year, work => String(work.id).padStart(12, '0'))
}

/**
 * Verk kopplade till en artikel, i Python-API:ts form: en rad per koppling,
 * med ConnectionType och språknamn, opublicerade verk bortsorterade.
 */
export async function getWorks(articleUrlName, connectionType = null) {
    const languages = await languagesById()

    let connections
    if (articleUrlName === '_all') {
        const articles = await allArticleIds()
        connections = (await allConnections()).filter(row => articles.has(row.ArticleID))
    } else {
        const article = await firstItem('Articles', {
            fields: ['id'],
            filter: { URLName: { _eq: articleUrlName } }
        })
        if (!article) return []
        connections = await connectionsForArticle(article.id)
    }
    if (connectionType !== null) {
        connections = connections.filter(row => Number(row.ConnectionType) === Number(connectionType))
    }
    if (!connections.length) return []

    const works = await worksByIds(connections.map(row => row.WorkID))
    const rows = []
    for (const connection of connections) {
        const work = works.get(connection.WorkID)
        if (!work) continue
        rows.push({ ConnectionType: connection.ConnectionType, ...withLanguageNames(work, languages) })
    }
    return sortWorksByRealYear(rows)
}

/** Artiklar som är publicerade (Status = 3), som i de flesta endpoints. */
export const publishedFilter = { Status: { _eq: PUBLISHED } }
export const PUBLISHED_STATUS = PUBLISHED
