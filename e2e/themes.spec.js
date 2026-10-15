import { test, expect } from '@playwright/test'
import { DEFAULT_THEME, TEXT_COLOR, THEMES, contrast } from '../assets/themes.js'

// Redaktörerna väljer tema fritt, så varje tema måste vara läsbart: AAA för
// brödtexten och AA för länkar och dämpad text (WCAG 2.1).
for (const [name, theme] of Object.entries(THEMES)) {
    if (name === DEFAULT_THEME) continue
    test(`theme ${name} keeps readable contrast`, () => {
        expect(contrast(TEXT_COLOR, theme.bg), 'text').toBeGreaterThanOrEqual(7)
        expect(contrast(theme.link, theme.bg), 'link').toBeGreaterThanOrEqual(4.5)
        expect(contrast(theme.muted, theme.bg), 'muted').toBeGreaterThanOrEqual(4.5)
    })
}

test('theme preview comes from the query string and is server-rendered', async ({ request }) => {
    const html = await (await request.get('./?tema=salvia')).text()
    expect(html).toMatch(/<html[^>]*data-theme="salvia"/)
    expect(html).toMatch(new RegExp(`--sol-bg:\\s*${THEMES.salvia.bg}`))
})

test('unknown theme falls back to the saved one', async ({ request }) => {
    const html = await (await request.get('./?tema=finns-inte')).text()
    const theme = html.match(/<html[^>]*data-theme="([^"]+)"/)?.[1]
    expect(Object.keys(THEMES)).toContain(theme)
})
