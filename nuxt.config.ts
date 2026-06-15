// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 3001
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3001',
      assetsUrl: process.env.NUXT_PUBLIC_ASSETS_URL || '',
      calcServiceUrl: process.env.NUXT_PUBLIC_CALC_SERVICE_URL || '',
      getresultServiceUrl: process.env.NUXT_PUBLIC_GETRESULT_SERVICE_URL || '',
    }
  }
})
