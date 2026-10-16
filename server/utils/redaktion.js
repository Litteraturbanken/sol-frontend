/**
 * Inloggning för redaktörsverktygen under /redaktion. Redaktörerna loggar
 * in med sina Directus-konton; allt de sparar går till Directus med deras
 * egen token, så att Directus rättigheter gäller och aktivitetsloggen visar
 * vem som gjorde vad.
 *
 * Sessionen är Directus access- och refresh-token i en httpOnly-kaka som
 * bara gäller appens sökväg. Utgången access-token förnyas med refresh-
 * token; misslyckas det är sessionen slut.
 */

const COOKIE = 'sol_redaktion'
const SESSION_DAYS = 7

function directusUrl() {
    return String(useRuntimeConfig().directusUrl || '').replace(/\/+$/, '')
}

function cookieOptions() {
    const base = encodeURI(decodeURI(useRuntimeConfig().app.baseURL || '/')).replace(/\/+$/, '') || '/'
    return {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: 'strict',
        path: base,
        maxAge: SESSION_DAYS * 24 * 3600
    }
}

function readSession(event) {
    // En session som förnyats under den här begäran: kakan i begäran har
    // fortfarande den gamla refresh-token, som Directus redan har bytt ut.
    if (event.context.editorSession) return event.context.editorSession
    const raw = getCookie(event, COOKIE)
    if (!raw) return null
    try {
        const session = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
        return session?.access ? session : null
    } catch {
        return null
    }
}

function writeSession(event, tokens) {
    const session = {
        access: tokens.access_token,
        refresh: tokens.refresh_token ?? null,
        expires: tokens.expires ? Date.now() + Number(tokens.expires) : null
    }
    setCookie(event, COOKIE, Buffer.from(JSON.stringify(session)).toString('base64url'), cookieOptions())
    event.context.editorSession = session
    return session
}

export function clearEditorSession(event) {
    event.context.editorSession = null
    deleteCookie(event, COOKIE, cookieOptions())
}

function unauthorized(message = 'Logga in') {
    return createError({ statusCode: 401, statusMessage: 'Unauthorized', message })
}

/** Directus-fel med Directus egen statuskod och meddelande. */
function directusError(error) {
    const status = error?.response?.status || 502
    const message = error?.data?.errors?.map(e => e.message).join('; ') || error?.message || 'okänt fel'
    return createError({ statusCode: status, statusMessage: 'Directus', message })
}

export async function loginEditor(event, email, password) {
    let session
    try {
        const { data } = await $fetch('/auth/login', {
            baseURL: directusUrl(),
            method: 'POST',
            body: { email, password, mode: 'json' }
        })
        session = writeSession(event, data)
    } catch (error) {
        if (error?.response?.status === 401) throw unauthorized('Fel e-post eller lösenord')
        throw directusError(error)
    }
    // Den nya kakan finns bara i svaret, inte i den här begäran: fråga med token.
    return editorFromToken(session.access)
}

function editorName(user) {
    return { name: [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email, email: user.email }
}

async function editorFromToken(token) {
    try {
        const { data } = await $fetch('/users/me', {
            baseURL: directusUrl(),
            query: { fields: 'first_name,last_name,email' },
            headers: { Authorization: `Bearer ${token}` }
        })
        return editorName(data)
    } catch (error) {
        throw directusError(error)
    }
}

export async function logoutEditor(event) {
    const session = readSession(event)
    clearEditorSession(event)
    if (session?.refresh) {
        await $fetch('/auth/logout', {
            baseURL: directusUrl(),
            method: 'POST',
            body: { refresh_token: session.refresh, mode: 'json' }
        }).catch(() => {})
    }
}

/**
 * Directus byter ut refresh-token vid varje förnyelse (mode json har ingen
 * respitperiod), så den gamla går inte att använda igen. Samtidiga begäranden
 * med samma kaka delar därför på en förnyelse, och svaret sparas en stund
 * för begäranden som kommer strax efter med den gamla kakan.
 */
const refreshes = new Map()
const REFRESH_REUSE_MS = 30_000

function directusRefresh(token) {
    const hit = refreshes.get(token)
    if (hit) return hit
    const pending = $fetch('/auth/refresh', {
        baseURL: directusUrl(),
        method: 'POST',
        body: { refresh_token: token, mode: 'json' }
    }).then(({ data }) => data)
    refreshes.set(token, pending)
    const forget = () => setTimeout(() => refreshes.delete(token), REFRESH_REUSE_MS).unref?.()
    pending.then(forget, () => refreshes.delete(token))
    return pending
}

async function refreshSession(event, session) {
    if (!session.refresh) throw unauthorized('Sessionen har gått ut')
    try {
        return writeSession(event, await directusRefresh(session.refresh))
    } catch {
        clearEditorSession(event)
        throw unauthorized('Sessionen har gått ut')
    }
}

/** Anrop mot Directus som den inloggade redaktören. */
export async function editorRequest(event, path, options = {}) {
    let session = readSession(event)
    if (!session) throw unauthorized()
    if (session.expires && session.expires < Date.now() + 10_000) session = await refreshSession(event, session)
    const call = s => $fetch(path, {
        baseURL: directusUrl(),
        ...options,
        headers: { ...(options.headers || {}), Authorization: `Bearer ${s.access}` }
    })
    try {
        return await call(session)
    } catch (error) {
        if (error?.response?.status !== 401) throw directusError(error)
        session = await refreshSession(event, session)
        try {
            return await call(session)
        } catch (retry) {
            throw directusError(retry)
        }
    }
}

/** Den inloggade redaktören, eller 401. */
export async function currentEditor(event) {
    const { data } = await editorRequest(event, '/users/me', { query: { fields: 'first_name,last_name,email' } })
    return editorName(data)
}
