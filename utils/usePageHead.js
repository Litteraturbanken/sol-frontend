/** Read page metadata from the same reactive payload used by Options API asyncData. */
export function usePageHead(getHead) {
    const nuxtApp = useNuxtApp()
    const fetchKey = getCurrentInstance().type.fetchKey()
    useHead(() => getHead(nuxtApp.payload.data['options:asyncdata:' + fetchKey] || {}))
}
