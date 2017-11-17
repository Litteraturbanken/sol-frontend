import { Selector } from 'testcafe' // first import testcafe selectors
/* global fixture, test */

fixture `Getting Started`// declare the fixture
    .page `http://${process.env.TEST_SERVER || 'localhost'}:3000/`  // specify the start page


// then create a test and place your code there
test('My first test', async t => {
    await t
        // .typeText('#developer-name', 'John Smith')
        // .click('#submit-button')

        // Use the assertion to check if the actual header text is equal to the expected one
        .expect(Selector('h1').innerText).eql('SVENSKT ÖVERSÄTTARLEXIKON')
})
