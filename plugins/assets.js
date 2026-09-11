/**
 * Basadressen till artikelbilderna, tillgänglig som $assetsBase i mallarna.
 *
 * Bilderna ligger i Directus filarkiv och adresseras med filens id, som
 * API:t returnerar i FileName. Adressen är konfigurerbar så att en annan
 * instans kan användas utan att röra sidorna.
 */
export default defineNuxtPlugin(nuxtApp => {
    const base = String(useRuntimeConfig().public.assetsBase || '').replace(/\/+$/, '')
    nuxtApp.vueApp.config.globalProperties.$assetsBase = `${base}/`
})
