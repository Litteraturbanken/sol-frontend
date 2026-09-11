export default defineEventHandler(async event => {
    const languageType = decodedParam(event, 'type')
    const language = decodedParam(event, 'language')
    const tokens = parseShow(getQuery(event).show, { defaultSource: 'Articles' })
    const result = await languageLists(languageType, language)
    return { data: projectLanguageArticles(result, languageType, tokens) }
})
