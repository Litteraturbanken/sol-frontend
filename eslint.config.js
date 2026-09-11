import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

/**
 * Nuxt importerar allt i server/utils automatiskt i serverrutterna. ESLint
 * ser inte det, så exportnamnen läses ur filerna och registreras som
 * globaler. Då slipper nya hjälpfunktioner läggas till här för hand.
 */
function serverUtilExports() {
    const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'server/utils')
    if (!fs.existsSync(dir)) return {}
    const names = {}
    for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.js'))) {
        const source = fs.readFileSync(path.join(dir, file), 'utf8')
        for (const match of source.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([\w$]+)/gm)) {
            names[match[1]] = 'readonly'
        }
    }
    return names
}

/** Globaler som Nitro och h3 tillhandahåller i serverrutter. */
const nitroGlobals = {
    defineEventHandler: 'readonly',
    defineCachedEventHandler: 'readonly',
    getQuery: 'readonly',
    getRouterParam: 'readonly',
    getRouterParams: 'readonly',
    readBody: 'readonly',
    setHeader: 'readonly',
    setResponseStatus: 'readonly',
    sendRedirect: 'readonly',
    createError: 'readonly',
    useRuntimeConfig: 'readonly',
    useStorage: 'readonly',
    $fetch: 'readonly'
}

export default [
    { ignores: ['.nuxt/**', '.output/**', 'dist/**', 'static/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
    js.configs.recommended,
    ...vue.configs['flat/essential'],
    {
        languageOptions: { globals: { ...globals.browser, ...globals.node, defineNuxtConfig: 'readonly', defineNuxtComponent: 'readonly', defineNuxtPlugin: 'readonly', useRuntimeConfig: 'readonly', useHead: 'readonly', createError: 'readonly', navigateTo: 'readonly', pageContext: 'readonly', getCurrentInstance: 'readonly', useRoute: 'readonly', useNuxtApp: 'readonly', onNuxtReady: 'readonly', usePageHead: 'readonly', $fetch: 'readonly' } },
        rules: {
            'no-unused-vars': 'off', 'no-empty': 'off', 'no-useless-escape': 'off',
            'no-redeclare': 'off', 'no-constant-condition': 'off',
            'vue/multi-word-component-names': 'off', 'vue/require-v-for-key': 'off',
            'vue/no-reserved-component-names': 'off'
        }
    },
    {
        files: ['server/**/*.js'],
        languageOptions: { globals: { ...globals.node, ...nitroGlobals, ...serverUtilExports() } }
    }
]
