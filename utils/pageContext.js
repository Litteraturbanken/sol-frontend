/** Route and error helpers for Options API page loaders. */
export function pageContext(nuxtApp) {
    const route = nuxtApp.$router.currentRoute.value
    const userAgent = import.meta.server
        ? nuxtApp.ssrContext?.event.node.req.headers['user-agent'] || ''
        : navigator.userAgent
    return {
        route,
        params: route.params,
        error(details) {
            throw createError(typeof details === 'string' ? { statusCode: 500, message: details } : details)
        },
        redirect: path => nuxtApp.runWithContext(() => navigateTo(path, { replace: true })),
        $ua: { isFromCrawler: () => /bot|crawler|spider|crawling/i.test(userAgent) }
    }
}
