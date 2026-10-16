import { test, expect } from '@playwright/test'
import fs from 'node:fs'
import { parseMarcXml, prepareRecords, workPayload, librisQuery } from '../assets/libris.js'

// Ett riktigt svar från Libris xsearch: Nonnen, svenska böcker, 40 poster.
// Tolkningen gav samma fält som den tidigare Python-importen, utom att
// utgivning nu också läses ur MARC 264.
const xml = fs.readFileSync(new URL('./fixtures/libris-nonnen.xml', import.meta.url), 'utf8')

test('MARC records from Libris are parsed like the old import', () => {
    const { total, records } = parseMarcXml(xml)
    expect(total).toBe(52)
    expect(records).toHaveLength(40)
    expect(records[0]).toMatchObject({
        libris: '2937363',
        lang_this: 'swe',
        author: 'Nonnen, Edward',
        title_main: 'Prospect öfver landtbruks-institutet på Degeberg'
    })
    expect(records.filter(r => Array.isArray(r.authors_others))).toHaveLength(15)
})

test('publication is read from 264 when a record has no 260', () => {
    const { records } = parseMarcXml(xml)
    expect(records[0]).toMatchObject({ publishing_place: 'Stockholm', publishing_house: 'Elmén & Granberg', publishing_year: '1835' })
    expect(records.every(r => r.publishing_year)).toBe(true)
    const both = '<xsearch records="1"><collection><record><controlfield tag="001">1</controlfield>' +
        '<datafield tag="260" ind1=" " ind2=" "><subfield code="a">Lund :</subfield><subfield code="c">1901</subfield></datafield>' +
        '<datafield tag="264" ind1=" " ind2="1"><subfield code="a">Malmö :</subfield><subfield code="c">2001</subfield></datafield>' +
        '</record></collection></xsearch>'
    expect(parseMarcXml(both).records[0]).toMatchObject({ publishing_place: 'Lund', publishing_year: '1901' })
})

test('records get warnings and flattened lists for the page', () => {
    const { records } = parseMarcXml(xml)
    const prepared = prepareRecords(records, ['2937363'])
    const first = prepared.find(r => r.libris === '2937363')
    expect(first._warnings).toContain('dupe')
    const withEditors = prepared.find(r => r.authors_others)
    expect(typeof withEditors.authors_others).toBe('string')
    const noLang = prepareRecords([{ libris: '9', title_main: 'X' }])[0]
    expect(noLang._warnings).toEqual(['year', 'lang'])
})

test('a record becomes a work with the old import defaults', () => {
    const ids = { swe: 15, eng: 1 }
    const work = workPayload({
        libris: '123',
        author: 'Nonnen, Emily',
        authors_others: 'A;B',
        title_main: 'Café',
        lang_this: 'swe',
        lang_orig_source: 'und',
        publishing_year: '1890;',
        publishings: [{ publishing_place: 'Lund', publishing_house: 'Gleerup', publishing_year: '1901' }],
        warnings: ['titledupe', 'okänd']
    }, { languageId: code => ids[code], now: '2026-10-16T10:00:00' })
    expect(work).toMatchObject({
        BibliographyType: 1,
        Authors: 'Nonnen, Emily',
        Editors: 'A;B',
        TitleSwedish: 'Café',
        LanguageTarget: 15,
        LanguageOriginal: null,
        PublishingYearSwedish: '1890',
        RealYear: '1890',
        Publishings: 'Lund : Gleerup, 1901',
        RemarkHidden: 'Librisimporterad: titledupe',
        Unpublished: '2',
        Translation: 1,
        LibrisID: '123',
        CreatedDate: '2026-10-16T10:00:00'
    })
    expect(workPayload({ libris: '1', publishing_year: '[1890]' }, { languageId: () => null, now: '' }).RealYear).toBeNull()
})

test('the Libris query limits to Swedish books by default', () => {
    expect(librisQuery(' Nonnen ')).toBe('Nonnen språk:(swe) mat:(böcker)')
    expect(librisQuery('Nonnen', { swedishOnly: false, booksOnly: false })).toBe('Nonnen')
})

test('editor tools require login and are not indexed', async ({ request }) => {
    const page = await request.get('./redaktion/libris')
    expect(page.status()).toBe(200)
    expect(page.headers()['x-robots-tag']).toContain('noindex')
    expect(page.headers()['cache-control']).toBe('no-store')
    for (const [method, path] of [['get', 'me'], ['get', 'articles?q=Nonnen'], ['get', 'libris/search?q=Nonnen'], ['post', 'libris/save']]) {
        const response = await request[method](`./api/redaktion/${path}`, method === 'post' ? { data: {} } : undefined)
        expect(response.status(), path).toBe(401)
    }
    const login = await request.post('./api/redaktion/login', { data: { email: 'nobody@example.com', password: 'fel' } })
    expect(login.status()).toBe(401)
})

// I webbläsaren, under appens basadress: sidan ska visa inloggningen och
// inte appens egen 404 (som den gjorde med ssr: false i produktion).
test('the Libris page renders in the browser', async ({ page }) => {
    await page.route('https://cloud.typography.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }))
    await page.goto('redaktion/libris', { waitUntil: 'networkidle' })
    await expect(page.locator('form.login')).toBeVisible()
    await expect(page.locator('h2')).toHaveText('Librisimport')
})

// Kräver ett riktigt Directus-konto: SOL_TEST_EMAIL och SOL_TEST_PASSWORD.
test('an editor can log in and stays logged in', async ({ request }) => {
    test.skip(!process.env.SOL_TEST_EMAIL, 'SOL_TEST_EMAIL och SOL_TEST_PASSWORD saknas')
    const login = await request.post('./api/redaktion/login', {
        data: { email: process.env.SOL_TEST_EMAIL, password: process.env.SOL_TEST_PASSWORD }
    })
    expect(login.status()).toBe(200)
    expect((await login.json()).email).toBe(process.env.SOL_TEST_EMAIL)
    expect((await request.get('./api/redaktion/me')).status()).toBe(200)
    await request.post('./api/redaktion/logout')
    expect((await request.get('./api/redaktion/me')).status()).toBe(401)
})
