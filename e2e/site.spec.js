import { test, expect } from '@playwright/test'

// Relative URLs intentionally retain the deployment's configured subpath.
test.beforeEach(async ({ page }) => {
    // The font CDN can stall document readiness; API requests remain live.
    await page.route('https://cloud.typography.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
        if (/Hydration.*mismatch/i.test(message.text())) errors.push(message.text())
    })
    page.errors = errors
})
test.afterEach(async ({ page }) => {
    expect(page.errors).toEqual([])
})

test('page renders and hydrates while the font service is unavailable', async ({ page }) => {
    await page.route('https://cloud.typography.com/**', () => {})
    await page.goto('./', { waitUntil: 'domcontentloaded', timeout: 10000 })
    await expect(page.locator('html')).toHaveAttribute('data-nuxt-ready', 'true')
    await expect(page.locator('h1')).toBeVisible()
    await page.getByRole('link', { name: 'Språk', exact: true }).click()
    await expect(page).toHaveURL(/\/listor\/sprak\/original$/)
})

test('start page has server-rendered content', async ({ page, request }) => {
    const response = await request.get('./')
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('Om Svenskt översättarlexikon')
    await page.goto('./', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await expect(page.locator('h1')).toHaveText('Svenskt översättarlexikon')
    await expect(page.locator('.mainview')).toContainText('Läs mer')
    const buildId = (await response.text()).match(/buildId:"([^"]+)"/)[1]
    const manifestPath = decodeURI(new URL(`_nuxt/builds/meta/${buildId}.json`, response.url()).pathname)
    const manifestId = await page.evaluate(async url => (await globalThis.$fetch(url)).id, manifestPath)
    expect(manifestId).toBe(buildId)
})

test('language selection changes the route and filters results', async ({ page }) => {
    await page.goto('listor/sprak/original', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    const originalCount = await page.locator('.results > li').count()
    await page.locator('.filters select').nth(0).selectOption('till')
    await expect(page).toHaveURL(/\/listor\/sprak\/till$/)
    const groups = page.locator('.results > li')
    await expect.poll(() => groups.count()).toBeLessThan(originalCount)
    await expect(groups).not.toHaveCount(0)
    const initial = await groups.count()
    await page.locator('.filters select').nth(1).selectOption('Franska')
    await expect(page).toHaveURL(/\/listor\/sprak\/till\/Franska$/)
    await expect(groups).toHaveCount(1)
    expect(initial).toBeGreaterThan(1)
    await page.goBack()
    await expect(groups).toHaveCount(initial)
})

test('article links to a populated detailed bibliography', async ({ page }) => {
    await page.goto('artiklar/Gunnar_Ekelöf', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await expect(page).toHaveTitle(/Gunnar Ekelöf/)
    await page.locator('.bibliography .detailed a').click()
    await expect(page).toHaveURL(/\/listor\/avoversattare\/Gunnar_Ekel(?:%C3%B6|ö)f$/)
    await expect(page.locator('.work').first()).toBeVisible()
})

test('bibliography filters actual works and can reset the filter', async ({ page }) => {
    await page.goto('listor/avoversattare/Gunnar_Ekelöf', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    const works = page.locator('.work')
    await expect(works.first()).toBeVisible()
    const initial = await works.count()
    await page.locator('select').nth(0).selectOption({ label: 'Arabiska' })
    await expect(page).toHaveURL(/\/original\/Arabiska$/)
    await expect.poll(() => works.count()).toBeLessThan(initial)
    await expect(works.first()).toBeVisible()
    await page.locator('select').nth(0).selectOption({ label: 'Alla språk' })
    await expect(works).toHaveCount(initial)
})

test('Arabic writer has works', async ({ page }) => {
    await page.goto('listor/avupphovsman/?a=Ibn%20Baṭṭūṭa,%20Muḥammad', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await expect(page.locator('.work').first()).toBeVisible()
})

test('article list can filter using Vue 3 templates', async ({ page }) => {
    await page.goto('listor/artiklar', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await page.locator('.mainview input').fill('Gunnar Ekelöf')
    await expect(page.locator('.inner li')).toHaveCount(1)
    await expect(page.locator('.inner li')).toContainText('Gunnar Ekelöf')
})

test('chronology slider updates years and URL', async ({ page }) => {
    await page.goto('listor/kronologi', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await expect(page.locator('.results li').first()).toBeVisible()
    const knob = page.locator('.range-slider-knob-from')
    const box = await knob.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.mouse.move(box.x + 60, box.y + box.height / 2, { steps: 5 })
    await page.mouse.up()
    await expect(page).not.toHaveURL(/#1900-1950$/)
    await expect(page).toHaveURL(/#\d+-\d+$/)
})

test('search finds articles and preserves the query', async ({ page }) => {
    await page.goto('sok?fras=Gunnar%20Ekel%C3%B6f', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.articles_section')).toContainText('Gunnar Ekelöf')
    await expect(page.locator('.mainview input')).toHaveValue('Gunnar Ekelöf')
})

test('work and contributor links load their detail pages', async ({ page }) => {
    await page.goto('artiklar/Gunnar_Ekelöf', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await page.locator('.bibliography a.work').first().click()
    await expect(page).toHaveURL(/\/verk\/\d+$/)
    await expect(page.locator('.mainview h2')).not.toBeEmpty()
    await expect(page.locator('.mainview .work')).toHaveCount(1)
    await expect(page.locator('.mainview .work')).toBeVisible()
    await page.goto('medarbetare', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    await page.locator('.mainview a').first().click()
    await expect(page).toHaveURL(/\/medarbetare\/[^/]+$/)
    await expect(page.locator('.mainview h3')).not.toBeEmpty()
})

test('missing article returns HTTP 404', async ({ request }) => {
    const response = await request.get('artiklar/this-article-does-not-exist-playwright')
    expect(response.status()).toBe(404)
    expect(await response.text()).toContain('Artikeln kunde inte hittas')
})

test('a newer search cancels the previous request', async ({ page }) => {
    let releaseFirst
    const firstResponse = new Promise(resolve => { releaseFirst = resolve })
    await page.route('**/api/autocomplete/**', route => route.fulfill({ json: { data: [] } }))
    await page.route('**/api/sol/search/**', async route => {
        const term = decodeURIComponent(new URL(route.request().url()).pathname.split('/').at(-1))
        if (term === 'first') await firstResponse
        await route.fulfill({ json: {
            articles: [{ ArticleName: term, URLName: term, Type: 1 }],
            works: [], prizes: [], suggestion: null
        } })
    })
    await page.goto('sok', { waitUntil: 'domcontentloaded' })
    await page.waitForFunction(() => document.documentElement.dataset.nuxtReady === 'true')
    const input = page.locator('.mainview input')
    const firstRequest = page.waitForRequest('**/api/sol/search/first')
    await input.fill('first')
    await input.press('Enter')
    await firstRequest
    await expect(page).toHaveURL(/[?&]fras=first$/)
    const cancelled = page.waitForEvent('requestfailed', request => request.url().endsWith('/search/first'))
    const secondRequest = page.waitForRequest('**/api/sol/search/second')
    try {
        await input.fill('second')
        await input.press('Enter')
        await secondRequest
    } finally {
        releaseFirst()
    }
    await cancelled
    await expect(page.locator('.articles_section li')).toHaveCount(1)
    await expect(page.locator('.articles_section li a')).toHaveText('second')
})
