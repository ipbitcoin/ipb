/**
 * Scroll-reveal for `.reveal` / `.reveal-coin` elements.
 *
 * The hidden state is gated behind `.js-reveal-ready` on <html>, which this
 * plugin adds. If JS never runs, nothing is ever hidden and the page reads
 * normally — the enter animation is an enhancement, not a prerequisite.
 */
export default defineNuxtPlugin(() => {
  if (typeof window === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.add("js-reveal-ready");

  let observer: IntersectionObserver | undefined;

  const reveal = (element: Element) => element.classList.add("is-visible");

  const scan = () => {
    const targets = document.querySelectorAll(
      ".reveal:not(.is-visible), .reveal-coin:not(.is-visible)"
    );
    for (const target of targets) {
      observer?.observe(target);
    }
  };

  const start = () => {
    if (!("IntersectionObserver" in window)) {
      // No observer: show everything rather than leave it hidden.
      for (const element of document.querySelectorAll(
        ".reveal, .reveal-coin"
      )) {
        reveal(element);
      }
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal(entry.target);
            observer?.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.01 }
    );

    scan();
  };

  const nuxtApp = useNuxtApp();
  nuxtApp.hook("app:mounted", start);
  // New sections arrive after each navigation and after lazy data lands.
  nuxtApp.hook("page:finish", () => requestAnimationFrame(scan));
});
