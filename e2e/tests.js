import { Selector, ClientFunction } from 'testcafe' // first import testcafe selectors
/* global fixture, test */

const host = `http://${process.env.TEST_SERVER || 'localhost'}:3000`

fixture `Getting Started`// declare the fixture
    .page `${host}/`  // specify the start page


// then create a test and place your code there
test('Start page has content', async t => {
    await t
        .expect(Selector('h1').innerText).eql('SVENSKT ÖVERSÄTTARLEXIKON')
})

test.page(`${host}/listor/sprak/original`)(
    'language change page on select', async t => {
        const getLocation  = ClientFunction(() => document.location.href.toString())
        await t
            .click(Selector(".filters select").nth(0))
            .click(Selector("option[value='till']"))
            // .wait(0)
            .expect(getLocation()).eql(`${host}/listor/sprak/till/`)

        let initialLis = await Selector("li").count

        await t
            .click(Selector(".filters select").nth(1))
            .click(Selector("option[value='Franska']"))

            .expect(Selector("li").count).lt(initialLis)
})

// test.page(`${host}/listor/sprak/original`)(
//     'language change page on select', async t => {
//         const getLocation  = ClientFunction(() => document.location.href.toString())
//         await t
//             .click(Selector(".filters select").nth(0))
//             .click(Selector("option[value='till']"))
//             // .wait(0)
//             .expect(getLocation()).eql(`${host}/listor/sprak/till/`)
//             .assert(false)
// })

