// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    compatibilityDate: '2024-11-01',
    devtools: { enabled: true },
    modules: [
        '@nuxtjs/tailwindcss',
        '@pinia/nuxt',
    ],
    app: {
        head: {
            title: 'Audio Enhancer',
            meta: [
                { name: 'description', content: 'Improve your audio quality with AI-powered tools' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
            ]
        }
    },
    typescript: {
        strict: true
    }
})
