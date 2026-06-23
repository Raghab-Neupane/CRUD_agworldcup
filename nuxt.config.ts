// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  devServer: {
    port: 9000
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || '',
      appUrl: process.env.NUXT_PUBLIC_APP_URL || '',
      assetsUrl: process.env.NUXT_PUBLIC_ASSETS_URL || '',
      calcServiceUrl: process.env.NUXT_PUBLIC_CALC_SERVICE_URL || '',
      getresultServiceUrl: process.env.NUXT_PUBLIC_GETRESULT_SERVICE_URL || '',
      commentsServiceUrl: process.env.NUXT_PUBLIC_COMMENTS_SERVICE_URL || '',
      clearCalcServiceUrl: process.env.NUXT_PUBLIC_CLEAR_CALC_SERVICE_URL || '',
      analyzeServiceUrl: process.env.NUXT_PUBLIC_ANALYZE_SERVICE_URL || '',
    }
  }
})
