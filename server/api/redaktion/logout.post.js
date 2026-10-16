/** Utloggning: tar bort sessionskakan och refresh-token i Directus. */
export default defineEventHandler(async event => {
    await logoutEditor(event)
    return { ok: true }
})
