import { createMemoryHistory, createWebHistory } from 'vue-router'

export default {
    history: base => import.meta.server
        ? createMemoryHistory(encodeURI(decodeURI(base)))
        : createWebHistory(encodeURI(decodeURI(base))),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) return savedPosition
        // Chronology stores a year range in the hash, not a DOM anchor.
        if (/^#\d+-\d+$/.test(to.hash)) return false
        if (to.hash) return { el: to.hash }
        return { top: 0 }
    }
}
