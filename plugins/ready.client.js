// A stable readiness signal for browser tests interacting with SSR controls.
export default defineNuxtPlugin(() => {
    onNuxtReady(() => { document.documentElement.dataset.nuxtReady = 'true' })
})
