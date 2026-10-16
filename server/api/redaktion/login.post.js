/** Inloggning med Directus-konto. Sätter sessionskakan. */
export default defineEventHandler(async event => {
    const { email, password } = (await readBody(event)) || {}
    if (!email || !password) {
        throw createError({ statusCode: 400, statusMessage: 'Bad Request', message: 'Ange e-post och lösenord' })
    }
    return loginEditor(event, String(email), String(password))
})
