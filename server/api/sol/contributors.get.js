/** SELECT <show> FROM Contributors ORDER BY LastName, FirstName. */
export default defineEventHandler(async event => {
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Contributors' })
    const fields = fieldsFor(tokens, 'Contributors', ['LastName', 'FirstName'])
    const rows = await items('Contributors', { fields: fields.length ? fields : undefined })
    const sorted = sortBySwedish(
        rows,
        row => row.LastName,
        row => row.FirstName
    )
    return { data: sorted.map(row => fixDates(projectShow(tokens, { Contributors: row }, 'Contributors'))) }
})
