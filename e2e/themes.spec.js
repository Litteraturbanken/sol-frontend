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

// Ett tema med bild på startsidan: brödtexten ska hålla AA även mot bildens
// mörkaste procent, sedd genom slöjan i temats färg.
for (const name of Object.keys(THEMES)) {
    if (name === DEFAULT_THEME) continue
    test(`start page image for ${name} keeps readable contrast`, async ({ page }) => {
        await page.route('https://cloud.typography.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
        await page.goto(`./?tema=${name}`, { waitUntil: 'domcontentloaded' })
        const darkest = await page.evaluate(async () => {
            const background = getComputedStyle(document.body).backgroundImage
            const url = background.match(/url\("([^"]+)"\)/)?.[1]
            if (!url) return null
            const veil = background.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/)
            const [veilRgb, opacity] = veil ? [veil.slice(1, 4).map(Number), Number(veil[4] ?? 1)] : [[0, 0, 0], 0]
            const image = new Image()
            image.src = url
            await image.decode()
            const canvas = document.createElement('canvas')
            canvas.width = 400
            canvas.height = Math.round((400 * image.height) / image.width)
            const context = canvas.getContext('2d')
            context.drawImage(image, 0, 0, canvas.width, canvas.height)
            const data = context.getImageData(0, 0, canvas.width, canvas.height).data
            const colors = []
            for (let i = 0; i < data.length; i += 4) {
                const rgb = [0, 1, 2].map(k => Math.round(veilRgb[k] * opacity + data[i + k] * (1 - opacity)))
                colors.push('#' + rgb.map(c => c.toString(16).padStart(2, '0')).join(''))
            }
            return colors
        })
        test.skip(darkest === null, 'temat har ingen bild')
        const ratios = darkest.map(color => contrast(TEXT_COLOR, color)).sort((a, b) => a - b)
        expect(ratios[Math.floor(ratios.length / 100)]).toBeGreaterThanOrEqual(4.5)
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
