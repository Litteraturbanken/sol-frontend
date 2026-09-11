export default defineNuxtPlugin(() => {
    onNuxtReady(() => {
        // The external font service must not block rendering or hydration.
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cloud.typography.com/7426274/6964792/css/fonts.css'
        document.head.appendChild(link)
    })
})
