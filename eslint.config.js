import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    { ignores: ['.nuxt/**', '.output/**', 'dist/**', 'static/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
    js.configs.recommended,
    ...vue.configs['flat/essential'],
    {
        languageOptions: { globals: { ...globals.browser, ...globals.node, defineNuxtConfig: 'readonly', defineNuxtComponent: 'readonly', defineNuxtPlugin: 'readonly', useRuntimeConfig: 'readonly', useHead: 'readonly', createError: 'readonly', navigateTo: 'readonly', pageContext: 'readonly', getCurrentInstance: 'readonly', useRoute: 'readonly', useNuxtApp: 'readonly', onNuxtReady: 'readonly', usePageHead: 'readonly' } },
        rules: {
            'no-unused-vars': 'off', 'no-empty': 'off', 'no-useless-escape': 'off',
            'no-redeclare': 'off', 'no-constant-condition': 'off',
            'vue/multi-word-component-names': 'off', 'vue/require-v-for-key': 'off',
            'vue/no-reserved-component-names': 'off'
        }
    }
]
