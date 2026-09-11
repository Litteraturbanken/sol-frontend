/**
 * Skapar läsåtkomsten som sol-frontend behöver i Directus (filisol).
 *
 * En policy "SOL-frontend (läs)" med read på de collections lexikonet visar,
 * kopplad till en API-användare utan app-access. Utan app-access räknas
 * användaren inte som en Studio-plats i licensen, och den kan inte logga in
 * i admin.
 *
 * Publiceringsstatus filtreras INTE här. Python-API:t filtrerar per endpoint,
 * och /article/<namn> visar med flit även opublicerade artiklar så att
 * redaktörer kan förhandsgranska. Samma regel gäller i serverlagret.
 *
 * Idempotent. Skriver ut en ny token sist; den ska in i NUXT_DIRECTUS_TOKEN.
 *
 *   DIRECTUS_URL=https://filisol.lb.se DIRECTUS_TOKEN=<admin> \
 *     node scripts/directus-access.mjs [--dry-run] [--keep-token]
 */

import { randomBytes } from 'node:crypto'

const baseUrl = String(process.env.DIRECTUS_URL || '').replace(/\/+$/, '')
const token = process.env.DIRECTUS_TOKEN
const dryRun = process.argv.includes('--dry-run')
const keepToken = process.argv.includes('--keep-token')

if (!baseUrl || !token) {
    console.error('Sätt DIRECTUS_URL och DIRECTUS_TOKEN (en admin-token) i miljön.')
    process.exit(1)
}

const POLICY = 'SOL-frontend (läs)'
const EMAIL = 'sol-frontend@lb.se'

/** Collections som lexikonets sidor läser. */
export const SOL_COLLECTIONS = [
    'Articles',
    'ArticleTypes',
    'ArticleFiles',
    'ArticleLinks',
    'ArticleAuthors',
    'Contributors',
    'Works',
    'WorkConnectionTranslator',
    'WorkConnectionAuthor',
    'WorkConnectionAboutArticle',
    'WorkConnectionAboutWork',
    'WorkConnectionReference',
    'WorkConnectionTypes',
    'BibliographyTypes',
    'Languages',
    'PrizeWinners',
    'StaticPages'
]

async function api(method, path, body) {
    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
    })
    const text = await response.text()
    const json = text ? JSON.parse(text) : {}
    if (!response.ok) {
        const message = json?.errors?.map(e => e.message).join('; ') || text
        throw new Error(`${method} ${path} -> ${response.status}: ${message}`)
    }
    return json.data
}

const filter = obj => `filter=${encodeURIComponent(JSON.stringify(obj))}`

async function main() {
    const info = await api('GET', '/server/info')
    console.log(`Directus – ${info?.project?.project_name} (${baseUrl})${dryRun ? ' [dry-run]' : ''}`)

    let [policy] = await api('GET', `/policies?${filter({ name: { _eq: POLICY } })}&fields=id`)
    if (!policy) {
        if (dryRun) console.log(`[dry-run] skapa policy ${POLICY}`)
        else
            policy = await api('POST', '/policies', {
                name: POLICY,
                icon: 'menu_book',
                description: 'Läsåtkomst för Svenskt översättarlexikon (sol-frontend)',
                admin_access: false,
                app_access: false,
                enforce_tfa: false
            })
    }

    const present = policy
        ? new Set(
              (
                  await api(
                      'GET',
                      `/permissions?${filter({ policy: { _eq: policy.id } })}&fields=collection,action&limit=-1`
                  )
              ).map(p => `${p.collection}:${p.action}`)
          )
        : new Set()

    // directus_files behövs för bildernas /assets/<id>-uppslag.
    // directus_fields låter serverlagret läsa vilka kolumner som är riktiga
    // och vilka som är Directus egna relationsfält, så att svaren innehåller
    // samma fält som SQL:ens "SELECT tabell.*" gav.
    const created = []
    for (const collection of [...SOL_COLLECTIONS, 'directus_files', 'directus_fields']) {
        if (present.has(`${collection}:read`)) continue
        if (dryRun) {
            console.log(`[dry-run] läsrätt på ${collection}`)
            continue
        }
        await api('POST', '/permissions', {
            policy: policy.id,
            collection,
            action: 'read',
            permissions: {},
            validation: {},
            presets: {},
            fields: ['*']
        })
        created.push(collection)
    }

    let [user] = await api('GET', `/users?${filter({ email: { _eq: EMAIL } })}&fields=id`)
    let newToken = null
    if (dryRun) {
        console.log(`[dry-run] ${user ? 'uppdatera' : 'skapa'} användaren ${EMAIL}`)
    } else {
        newToken = keepToken && user ? null : 'sol-' + randomBytes(24).toString('base64url')
        if (!user) {
            user = await api('POST', '/users', {
                email: EMAIL,
                first_name: 'SOL',
                last_name: 'frontend',
                status: 'active',
                token: newToken
            })
        } else if (newToken) {
            await api('PATCH', `/users/${user.id}`, { token: newToken })
        }
        const access = await api(
            'GET',
            `/access?${filter({ _and: [{ user: { _eq: user.id } }, { policy: { _eq: policy.id } }] })}&fields=id`
        )
        if (!access.length) await api('POST', '/access', { user: user.id, policy: policy.id })
    }

    console.log(
        JSON.stringify(
            { policy: POLICY, user: EMAIL, permissionsCreated: created, tokenRotated: Boolean(newToken) },
            null,
            2
        )
    )
    if (newToken) console.log(`\nNUXT_DIRECTUS_TOKEN=${newToken}`)
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
