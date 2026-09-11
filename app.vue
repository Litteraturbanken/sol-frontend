<script setup>
useHead({ titleTemplate: title => title ? `${title} - Svenskt översättarlexikon` : 'Svenskt översättarlexikon' })
</script>

<template>
    <NuxtLoadingIndicator color="#618296" />
    <NuxtLayout><NuxtPage :page-key="route => route.path" /></NuxtLayout>
</template>
