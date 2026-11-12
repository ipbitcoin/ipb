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
  // Admin panel: no SEO, every page is behind auth, and data comes from Nitro
  // routes anyway, so a pure client app avoids SSR hydration work and keeps the
  // door open for client-side Convex live queries later.
  ssr: false,
  spaLoadingTemplate: true,
  routeRules: {
    // Where admins let AI apps in: never inside another site's frame.
    "/connect": {
      headers: {
        "Content-Security-Policy": "frame-ancestors 'none'",
        "X-Frame-Options": "DENY",
      },
    },
  },
  runtimeConfig: {
    SERVICE_KEY: process.env.SERVICE_KEY,
    // The admin's public address, e.g. https://admin.institutobitcoin.pt. AI
    // apps connect to <SITE_URL>/mcp; unset, the request's own address is used.
    SITE_URL: process.env.SITE_URL ?? "",
    public: {
      CDN_HOST: process.env.NUXT_PUBLIC_CDN_HOST ?? "cdn.institutobitcoin.pt",
      CONVEX_URL: process.env.CONVEX_URL,
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
