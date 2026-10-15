/**
 * Skapar singletonen Meta i Directus (filisol): sajtens färgtema, som
 * redaktörerna ändrar själva.
 *
 *   Theme  ett av temana i assets/themes.js
 *
 * Redaktörspolicyn "Editors" får läsa och ändra. Frontendens läsrätt sköts
 * av directus-access.mjs, där Meta finns i listan. Färgerna ligger i koden,
 * inte i Directus, så att inget val kan göra sajten svårläst.
 *
 * Idempotent: det som redan finns lämnas orört, utom temavalen, som alltid
 * följer assets/themes.js.
 *
 *   DIRECTUS_URL=https://filisol.pub.lb.se DIRECTUS_TOKEN=<admin> \
 *     node scripts/directus-meta.mjs [--dry-run]
 */

import { DEFAULT_THEME, THEMES } from '../assets/themes.js'

const baseUrl = String(process.env.DIRECTUS_URL || '').replace(/\/+$/, '')
const token = process.env.DIRECTUS_TOKEN
const dryRun = process.argv.includes('--dry-run')

if (!baseUrl || !token) {
    console.error('Sätt DIRECTUS_URL och DIRECTUS_TOKEN (en admin-token) i miljön.')
    process.exit(1)
}

const COLLECTION = 'Meta'
const EDITOR_POLICY = 'Editors'

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

const CHOICES = Object.entries(THEMES).map(([value, theme]) => ({ text: theme.label, value }))

const THEME_FIELD = {
    field: 'Theme',
    type: 'string',
    meta: {
        interface: 'select-radio',
        options: { choices: CHOICES },
        display: 'labels',
        required: true,
        sort: 2,
        width: 'full',
        translations: [
            { language: 'sv-SE', translation: 'Tema' },
            { language: 'en-US', translation: 'Tema' }
        ],
        note: 'Bakgrundsfärg för hela sajten. Alla teman håller läsbarheten. Syns på sajten inom en minut.'
    },
    schema: { default_value: DEFAULT_THEME, is_nullable: false, max_length: 32 }
}

async function main() {
    const info = await api('GET', '/server/info')
    console.log(`Directus ${info?.version ?? ''} – ${info?.project?.project_name} (${baseUrl})${dryRun ? ' [dry-run]' : ''}`)
    const done = []
    const step = async (label, action) => {
        if (dryRun) console.log(`[dry-run] ${label}`)
        else await action()
        done.push(label)
    }

    const collections = await api('GET', '/collections')
    const exists = collections.some(c => c.collection === COLLECTION)
    if (!exists) {
        await step(`skapa singletonen ${COLLECTION}`, () =>
            api('POST', '/collections', {
                collection: COLLECTION,
                meta: {
                    singleton: true,
                    icon: 'palette',
                    note: 'Sajtens utseende: färgtemat.',
                    accountability: 'all'
                },
                schema: {},
                fields: [
                    {
                        field: 'id',
                        type: 'integer',
                        meta: { hidden: true, readonly: true, interface: 'input', sort: 1 },
                        schema: { is_primary_key: true, has_auto_increment: true }
                    }
                ]
            })
        )
    }

    const fields = exists ? await api('GET', `/fields/${COLLECTION}`) : []
    const theme = fields.find(f => f.field === 'Theme')
    if (!theme) {
        await step(`fältet ${COLLECTION}.Theme`, () => api('POST', `/fields/${COLLECTION}`, THEME_FIELD))
    } else if (JSON.stringify(theme.meta?.options?.choices) !== JSON.stringify(CHOICES)) {
        await step(`temavalen i ${COLLECTION}.Theme`, () =>
            api('PATCH', `/fields/${COLLECTION}/Theme`, { meta: { options: { choices: CHOICES } } })
        )
    }

    const [policy] = await api('GET', `/policies?${filter({ name: { _eq: EDITOR_POLICY } })}&fields=id`)
    if (!policy) throw new Error(`Policyn ${EDITOR_POLICY} finns inte`)
    const granted = new Set(
        (
            await api(
                'GET',
                `/permissions?${filter({ _and: [{ policy: { _eq: policy.id } }, { collection: { _eq: COLLECTION } }] })}&fields=action&limit=-1`
            )
        ).map(p => p.action)
    )
    // create behövs första gången singletonen sparas.
    for (const action of ['read', 'create', 'update']) {
        if (granted.has(action)) continue
        await step(`${EDITOR_POLICY}: ${action} på ${COLLECTION}`, () =>
            api('POST', '/permissions', {
                policy: policy.id,
                collection: COLLECTION,
                action,
                permissions: {},
                validation: {},
                presets: {},
                fields: ['*']
            })
        )
    }

    // Singletonen får en rad med standardtemat, så att sajten ser ut som förut.
    const current = exists ? await api('GET', `/items/${COLLECTION}`) : null
    if (!current?.id) {
        await step(`första raden i ${COLLECTION} (tema ${DEFAULT_THEME})`, () =>
            api('PATCH', `/items/${COLLECTION}`, { Theme: DEFAULT_THEME })
        )
    }

    console.log(JSON.stringify({ collection: COLLECTION, changes: done }, null, 2))
}

main().catch(error => {
    console.error(error.message)
    process.exit(1)
})
