// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/ui'],
  runtimeConfig: {
    pinboardApiToken: process.env.PINBOARD_API_TOKEN,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    public: {
      siteUrl: process.env.SITE_URL || 'http://localhost:3000'
    }
  }
})