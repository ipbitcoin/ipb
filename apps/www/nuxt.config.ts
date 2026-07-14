import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  app: {
    head: {
      link: [{ rel: "icon", type: "image/png", href: "/favicon.png" }],
      meta: [{ name: "theme-color", content: "#0f0f0f" }],
      titleTemplate: "%s | Instituto Português de Bitcoin",
    },
  },
  compatibilityDate: "2025-07-15",
  css: ["~/assets/css/main.css"],
  devtools: { enabled: true },
  experimental: {
    typedPages: true,
  },
  extends: ["@ipb/ui"],
  googleFonts: {
    families: {
      Inter: [300, 400, 500, 600, 700],
    },
  },
  i18n: {
    customRoutes: "config",
    defaultLocale: "pt",
    locales: [
      {
        code: "en",
        language: "en-US",
        file: "en.json",
        name: "English",
      },
      {
        code: "pt",
        language: "pt-PT",
        file: "pt.json",
        name: "Português",
      },
    ],
    pages: {
      "artigo-slug": {
        en: "/article/[slug]",
        pt: "/artigo/[slug]",
      },
      "autor-slug": {
        en: "/author/[slug]",
        pt: "/autor/[slug]",
      },
      contactos: {
        en: "/contacts",
        pt: "/contactos",
      },
      educacao: {
        en: "/education",
        pt: "/educacao",
      },
      equipa: {
        en: "/team",
        pt: "/equipa",
      },
      formacoes: {
        en: "/training",
        pt: "/formacoes",
      },
      investigacao: {
        en: "/research",
        pt: "/investigacao",
      },
      "investigacao-categoria": {
        en: "/research/[categoria]",
        pt: "/investigacao/[categoria]",
      },
      juntar: {
        en: "/join",
        pt: "/juntar",
      },
      manifesto: {
        en: "/manifest",
        pt: "/manifesto",
      },
      noticias: {
        en: "/news",
        pt: "/noticias",
      },
    },
    strategy: "prefix_except_default",
  },
  modules: [
    "reka-ui/nuxt",
    "@nuxtjs/google-fonts",
    "@nuxtjs/i18n",
    "motion-v/nuxt",
    "vue-sonner/nuxt",
    "@nuxtjs/mdc",
    "@vueuse/nuxt",
    "@nuxtjs/seo",
    "@vercel/analytics",
    "@nuxt/image",
  ],
  ogImage: {
    enabled: false,
  },
  robots: {
    blockNonSeoBots: true,
    disallow: ["/api/", "/_nuxt/", "/_ipx/", "/__nuxt_error"],
    sitemap: "https://institutobitcoin.pt/sitemap.xml",
  },
  router: {
    options: {
      scrollBehaviorType: "smooth",
    },
  },
  runtimeConfig: {
    APP_URL: process.env.APP_URL,
    OPENNODE_API_KEY: process.env.OPENNODE_API_KEY,
    SERVICE_KEY: process.env.SERVICE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    public: {
      CONVEX_URL: process.env.CONVEX_URL,
      SUBSTACK_URL: process.env.SUBSTACK_URL,
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },
  schemaOrg: {
    identity: {
      address: {
        "@type": "PostalAddress",
        addressCountry: "PT",
      },
      alternateName: "IPB",
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: "info@institutobitcoin.pt",
      },
      description:
        "Instituto de referência sobre Bitcoin em Portugal. Investigação, educação, formação e política pública.",
      foundingDate: "2024",
      logo: "https://institutobitcoin.pt/ipb_color_dark.svg",
      name: "Instituto Português de Bitcoin",
      type: "Organization",
      url: "https://institutobitcoin.pt",
    },
  },
  seo: {
    fallbackTitle: true,
    splash: false,
  },
  site: {
    defaultLocale: "pt",
    description:
      "Instituto de referência sobre Bitcoin em Portugal. Investigação, educação, formação e política pública sobre Bitcoin.",
    name: "Instituto Português de Bitcoin",
    url: "https://institutobitcoin.pt",
  },
  sitemap: {
    cacheMaxAgeSeconds: 3600, // regenerates every hour — picks up new Convex content automatically
    credits: false,
    sources: ["/api/__sitemap__/urls"],
    xsl: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
