import { fileURLToPath } from 'node:url'

const baseURL = decodeURI(process.env.NUXT_APP_BASE_URL || process.env.BASE_URL || '/')

export default defineNuxtConfig({
    compatibilityDate: '2026-09-10',
    srcDir: '.',
    dir: { public: 'static' },
    devtools: { enabled: false },
    // Runtime routing matches decoded paths; Nitro error redirects compare URL-encoded paths.
    nitro: { baseURL: encodeURI(baseURL) },
    app: {
        baseURL,
        head: {
                        meta: [
                { charset: "utf-8" },
                { name: "viewport", content: "width=device-width, initial-scale=1" },
                {
                    name: "google-site-verification",
                    content: "N0kL5tDA6UPMmyqv6bJBPNMsvOv27pcF7_ABjT94v5c"
                }
            ],
            link: [
                // { rel: 'icon', type: 'image/x-icon', href: 'http://www.oversattarlexikon.se/images/icons/favicon.png' },
                // { href: '/bootstrap.css', rel: "stylesheet" },
                // { rel: 'stylesheet', href: '/font/fa-custom.otf' }
                // <link rel="stylesheet" type="text/css" href="https://cloud.typography.com/7426274/770508/css/fonts.css" />
                {
                    rel: "apple-touch-icon",
                    sizes: "57x57",
                    href: "favicon/apple-icon-57x57.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "60x60",
                    href: "favicon/apple-icon-60x60.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "72x72",
                    href: "favicon/apple-icon-72x72.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "76x76",
                    href: "favicon/apple-icon-76x76.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "114x114",
                    href: "favicon/apple-icon-114x114.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "120x120",
                    href: "favicon/apple-icon-120x120.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "144x144",
                    href: "favicon/apple-icon-144x144.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "152x152",
                    href: "favicon/apple-icon-152x152.png"
                },
                {
                    rel: "apple-touch-icon",
                    sizes: "180x180",
                    href: "favicon/apple-icon-180x180.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "192x192",
                    href: "favicon/android-icon-192x192.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "32x32",
                    href: "favicon/favicon-32x32.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "96x96",
                    href: "favicon/favicon-96x96.png"
                },
                {
                    rel: "icon",
                    type: "image/png",
                    sizes: "16x16",
                    href: "favicon/favicon-16x16.png"
                },
                { rel: "manifest", href: "favicon/manifest.json" },
                { name: "msapplication-TileColor", content: "#ffffff" },
                {
                    name: "msapplication-TileImage",
                    content: "favicon/ms-icon-144x144.png"
                },
                { name: "theme-color", content: "#ffffff" }
            ]
        }
    },
    runtimeConfig: {
        public: { apiBase: 'https://litteraturbanken.se/sol/api' }
    },
    css: [
        '~/assets/fontawesome-custom/css/fa-custom.css',
        '~/assets/fontawesome-custom/css/animation.css',
        '~/assets/bootstrap_custom.scss',
        '~/assets/styles.scss'
    ],
    vite: {
        // These CommonJS dependencies are also imported by lazy-loaded pages.
        // Optimize them at startup so discovering a page cannot trigger a full reload.
        optimizeDeps: { include: ['lodash', 'natural-sort'] },
        css: { preprocessorOptions: { scss: {
            additionalData: '@use "~/assets/_imports.scss" as *;',
            silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'legacy-js-api', 'slash-div', 'if-function']
        } } }
    },
    hooks: {
        'pages:extend'(pages) {
            pages.push({ name: 'avoversattare-filter', path: '/listor/avoversattare/:id/:type?/:lang?', file: fileURLToPath(new URL('./pages/listor/avoversattare/[id].vue', import.meta.url)) })
            pages.push({ name: 'bibliografi-filter', path: '/listor/bibliografi/:id/:type?/:lang?', file: fileURLToPath(new URL('./pages/listor/avoversattare/[id].vue', import.meta.url)) })
            pages.push({ name: 'sprak-filter', path: '/listor/sprak/:id?/:lang?', file: fileURLToPath(new URL('./pages/listor/sprak/[id].vue', import.meta.url)) })
        },
        async 'prerender:routes'(ctx) {
            if (!process.argv.includes('generate')) return
            const base = process.env.NUXT_PUBLIC_API_BASE || 'https://litteraturbanken.se/sol/api'
            const get = async path => {
                const response = await fetch(base + path)
                if (!response.ok) throw new Error(`Prerender API returned ${response.status}: ${path}`)
                return response.json()
            }
            const [contributors, articles, bibliography] = await Promise.all([
                get('/contributors?show=URLName,FirstName,LastName'),
                get('/articles?show=URLName'), get('/bibliography/_all')
            ])
            for (const item of contributors.data) ctx.routes.add('/medarbetare/' + item.URLName)
            for (const item of articles.data) {
                ctx.routes.add('/artiklar/' + decodeURIComponent(item.URLName))
                ctx.routes.add('/listor/avoversattare/' + decodeURIComponent(item.URLName))
            }
            for (const item of bibliography.works) ctx.routes.add('/verk/' + item.id)
        }
    }
})
