/**
 * Scroll-reveal for `.reveal` elements.
 *
 * The hidden state is gated behind `.js-reveal-ready` on <html>, which this
 * plugin adds. If JS never runs, nothing is ever hidden and the page reads
 * normally — the enter animation is an enhancement, not a prerequisite.
 *
 * Anything already on screen when hydration finishes is marked visible
 * *before* the gate goes up, so server-rendered content never blinks out and
 * back in.
 *
 * Revealed elements get a `data-revealed` attribute rather than a class: Vue
 * owns the class of the elements it renders, and re-renders a bound class
 * wholesale, which would hide an element again for good.
 */
export default defineNuxtPlugin(() => {
  if (
    typeof window === "undefined" ||
    !("IntersectionObserver" in window) ||
    !("MutationObserver" in window)
  ) {
    // No observers: never gate, so everything stays visible.
    return;
  }

  const root = document.documentElement;
  let observer: IntersectionObserver | undefined;
  let scanQueued = false;

  // `.reveal` only ever sits on HTML elements.
  const reveal = (element: Element) => {
    (element as HTMLElement).dataset.revealed = "";
  };

  const scan = () => {
    scanQueued = false;
    for (const target of document.querySelectorAll(
      ".reveal:not([data-revealed])"
    )) {
      observer?.observe(target);
    }
  };

  // Batch DOM changes into at most one scan per frame.
  const queueScan = () => {
    if (!scanQueued) {
      scanQueued = true;
      requestAnimationFrame(scan);
    }
  };

  const start = () => {
    const fold = window.innerHeight;
    for (const element of document.querySelectorAll(".reveal")) {
      if (element.getBoundingClientRect().top < fold) {
        reveal(element);
      }
    }
    root.classList.add("js-reveal-ready");

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

    // Sections fed by lazy data, "show more" and route changes all add
    // `.reveal` elements long after mount; pick each of them up.
    new MutationObserver(queueScan).observe(document.body, {
      childList: true,
      subtree: true,
    });
  };

  // Not at mount: a page that awaits its data hydrates later than that, and
  // touching its server-rendered elements before then is a hydration mismatch.
  // This fires once the whole app has hydrated (or rendered, without SSR).
  useNuxtApp().hooks.hookOnce("app:suspense:resolve", start);
});
