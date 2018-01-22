import { Selector, ClientFunction } from 'testcafe' // first import testcafe selectors
/* global fixture, test */

const getLocation  = ClientFunction(() => document.location.href.toString())

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
        await t
            .click(Selector(".filters select").nth(0))
            .click(Selector("option[value='till']"))
            .wait(200)
            .expect(getLocation()).eql(`${host}/listor/sprak/till`)

        let initialLis = await Selector("li").count

        await t
            .click(Selector(".filters select").nth(1))
            .click(Selector("option[value='Franska']"))

            .expect(Selector("li").count).lt(initialLis)
})

test.page(`${host}/artiklar/Gunnar_Ekelöf`)(
    'detailed bibliography has works', async t => {
        await t
            .click(Selector(".bibliography .detailed"))
            .wait(200)
            .expect(getLocation()).eql(`${host}/listor/avoversattare/Gunnar_Ekel%C3%B6f`)
            .expect(Selector(".work").count).gt(0)
})

test.page(`${host}/listor/avoversattare/Gunnar_Ekelöf`)(
    'detailed bibliography can filter', async t => {
        let nInitialWorks = await Selector(".work").count
        await t
            .click(Selector("select").nth(0))
            .click(Selector("option[value='Arabiska,original']"))

            .expect(Selector(".works").count).lt(nInitialWorks)
})

test.page(`${host}/listor/avupphovsman/?a=Ibn%20Baṭṭūṭa,%20Muḥammad`)(
    'arabic writer has works', async t => {
        await t
            .expect(Selector(".work").count).gt(0)
})
