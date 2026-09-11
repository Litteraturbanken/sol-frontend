export default defineNuxtPlugin(nuxtApp => {
    if (location.hostname !== 'litteraturbanken.se') return
    window.dataLayer = window.dataLayer || []
    window.gtag = function () { window.dataLayer.push(arguments) }
    window.gtag('js', new Date())
    window.gtag('config', 'UA-132486790-2')
    const base = useRuntimeConfig().app.baseURL.replace(/\/$/, '')
    window._paq = window._paq || []
    window._paq.push(['trackPageView'], ['enableLinkTracking'], ['setTrackerUrl', 'https://lb.se/matomo/matomo.php'], ['setSiteId', '1'])
    useHead({ script: [
        { async: true, src: 'https://www.googletagmanager.com/gtag/js?id=UA-132486790-2' },
        { async: true, src: 'https://lb.se/matomo/matomo.js' }
    ] })
    nuxtApp.$router.afterEach(to => {
        window.gtag('config', 'UA-132486790-2', { page_path: base + to.fullPath })
        window._paq.push(['setCustomUrl', base + to.fullPath], ['trackPageView'])
    })
})
