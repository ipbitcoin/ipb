import type { RouterConfig } from "nuxt/schema";

/** Give a lazily-rendered section this long to appear before giving up. */
const HASH_TARGET_TIMEOUT_MS = 1000;

/** Keep a hash target in view this long while the page around it settles. */
const HASH_SETTLE_MS = 3000;

/** Any of these means the reader is scrolling on their own. */
const READER_INPUT = ["keydown", "pointerdown", "touchstart", "wheel"] as const;

/**
 * Wait for a hash target to exist. Sections fed by Convex mount after the route
 * commits, so `#faq` is not in the DOM yet when we navigate in from another page.
 */
function waitForElement(hash: string): Promise<Element | null> {
  const selector = decodeURIComponent(hash);
  const existing = document.querySelector(selector);
  if (existing) {
    return Promise.resolve(existing);
  }

  const { promise, resolve } = Promise.withResolvers<Element | null>();
  const deadline = Date.now() + HASH_TARGET_TIMEOUT_MS;

  const poll = () => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    if (Date.now() > deadline) {
      resolve(null);
      return;
    }
    requestAnimationFrame(poll);
  };
  requestAnimationFrame(poll);

  return promise;
}

/**
 * Scroll to a hash target and stay on it. Sections above it swap their
 * skeletons for content once their data arrives, often mid-scroll, which moves
 * the target while the scroll is still heading for its old position. Follow it
 * until the page settles, and let go as soon as the reader takes over.
 */
function scrollToElement(element: Element, behavior: ScrollBehavior) {
  const documentTop = () =>
    element.getBoundingClientRect().top + window.scrollY;

  element.scrollIntoView({ behavior, block: "start" });

  let lastTop = documentTop();
  const deadline = Date.now() + HASH_SETTLE_MS;
  const controller = new AbortController();
  for (const type of READER_INPUT) {
    window.addEventListener(type, () => controller.abort(), {
      once: true,
      passive: true,
      signal: controller.signal,
    });
  }

  const follow = () => {
    if (controller.signal.aborted) {
      return;
    }
    if (Date.now() > deadline || !element.isConnected) {
      controller.abort();
      return;
    }
    const top = documentTop();
    if (Math.abs(top - lastTop) >= 1) {
      lastTop = top;
      element.scrollIntoView({ behavior, block: "start" });
    }
    requestAnimationFrame(follow);
  };
  requestAnimationFrame(follow);
}

const routerOptions: RouterConfig = {
  async scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      const element = await waitForElement(to.hash);
      if (element) {
        // Gliding to a section shows where it sits on the page; under reduced
        // motion jump straight there. `el` alone races the section mounting.
        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)"
        ).matches;
        scrollToElement(element, reduceMotion ? "auto" : "smooth");
        return false;
      }
      return { left: 0, top: 0 };
    }

    // A new page starts at the top. Animating the scroll back up from the
    // footer only replays the page you are leaving.
    return { left: 0, top: 0 };
  },
};

export default routerOptions;
