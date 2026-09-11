/**
 * Ruttparametrar. Flask-rutterna är typade som <int:article_type>, så en
 * icke-numerisk typ ska ge 404 i stället för att tolkas som noll.
 */
export function articleTypeParam(event) {
    const raw = getRouterParam(event, 'type')
    if (!/^\d+$/.test(String(raw))) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    return Number(raw)
}

/** Ruttparameter som är procentkodad i URL:en, t.ex. artikelnamn. */
export function decodedParam(event, name) {
    const raw = getRouterParam(event, name)
    if (raw === undefined || raw === null || raw === '') {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    try {
        return decodeURIComponent(raw)
    } catch {
        return String(raw)
    }
}
