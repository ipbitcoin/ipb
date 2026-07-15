import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }],
      meta: [{ name: "robots", content: "noindex, nofollow" }],
      title: "IPB Admin",
    },
  },
  compatibilityDate: "2025-07-15",
  css: ["~/assets/css/main.css"],
  devServer: {
    port: 3001,
  },
  devtools: { enabled: false },
  extends: ["@ipb/ui"],
  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700],
    },
  },
  modules: [
    "reka-ui/nuxt",
    "nuxt-auth-utils",
    "vue-sonner/nuxt",
    "@nuxtjs/mdc",
    "@nuxtjs/google-fonts",
  ],
  runtimeConfig: {
    SERVICE_KEY: process.env.SERVICE_KEY,
    public: {
      CDN_HOST: process.env.NUXT_PUBLIC_CDN_HOST ?? "cdn.institutobitcoin.pt",
      CONVEX_URL: process.env.CONVEX_URL,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
