/**
 * Shares the page with its own image instead of the site-wide default.
 *
 * The default (public/og-image.png) comes with its size and type, set in
 * app.vue and inferred by nuxt-seo-utils. Left in place, they would describe
 * the wrong image, so null clears them.
 */
export default function useShareImage(image: { alt: string; url: string }) {
  useSeoMeta({
    ogImage: image,
    ogImageHeight: null,
    ogImageType: null,
    ogImageWidth: null,
    twitterImage: image,
    twitterImageHeight: null,
    twitterImageType: null,
    twitterImageWidth: null,
  });
}
