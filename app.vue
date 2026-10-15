<script setup>
import backend from '~/assets/backend'
import { DEFAULT_THEME, themeVariables, validTheme } from '~/assets/themes'

// Bilderna kommer från Directus på en annan värd; anslutningen öppnas i förväg.
const assetsOrigin = (() => {
    try { return new URL(useRuntimeConfig().public.assetsBase).origin } catch { return null }
})()
useHead({
    titleTemplate: title => title ? `${title} - Svenskt översättarlexikon` : 'Svenskt översättarlexikon',
    link: assetsOrigin ? [{ rel: 'preconnect', href: assetsOrigin }] : []
})

// Temat sätts redan i serverrenderingen, så att sidan aldrig visas i fel färg.
// ?tema=<namn> förhandsvisar ett annat tema än det som är sparat i Directus,
// utan att spara något.
const route = useRoute()
const { data: meta } = await useAsyncData('sol-meta', () =>
    backend.getMeta().catch(() => ({ theme: DEFAULT_THEME }))
)

const theme = computed(() => validTheme(route.query.tema) || meta.value?.theme || DEFAULT_THEME)

useHead(() => ({
    htmlAttrs: {
        'data-theme': theme.value,
        style: Object.entries(themeVariables(theme.value))
            .map(([name, value]) => `${name}: ${value}`)
            .join('; ')
    }
}))
</script>

<template>
    <NuxtLoadingIndicator color="#618296" />
    <NuxtLayout><NuxtPage :page-key="route => route.path" /></NuxtLayout>
</template>
