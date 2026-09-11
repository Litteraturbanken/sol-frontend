export default defineEventHandler(async event => {
    const languageType = decodedParam(event, 'type')
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })
    const result = await languageLists(languageType)
    return { data: projectLanguageArticles(result, languageType, tokens) }
})
