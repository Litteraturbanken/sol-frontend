/** SELECT * FROM StaticPages WHERE StaticPageID = <sida>. */
export default defineEventHandler(async event => {
    const page = decodedParam(event, 'page')
    const row = await firstItem('StaticPages', { filter: { StaticPageID: { _eq: page } } })
    return { page: row ? fixDates(row) : null }
})
