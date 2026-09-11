/** Normalize encoded browser/error URLs before Nuxt's router initializes. */
export default defineNuxtPlugin({
    name: 'base-url',
    order: -30,
    setup(nuxtApp) {
        const config = useRuntimeConfig()
        const encodedBase = encodeURI(decodeURI(config.app.baseURL)).replace(/\/$/, '')
        if (import.meta.server && encodedBase && nuxtApp.ssrContext.url.startsWith(encodedBase + '/')) {
            // Nuxt's error renderer receives a URL with the encoded prefix still attached.
            nuxtApp.ssrContext.url = nuxtApp.ssrContext.url.slice(encodedBase.length)
            nuxtApp.payload.path = nuxtApp.ssrContext.url
        }
    }
})
