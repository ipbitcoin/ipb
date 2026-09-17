import type { RouterConfig } from "nuxt/schema";

/** Give a lazily-rendered section this long to appear before giving up. */
const HASH_TARGET_TIMEOUT_MS = 1000;

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

const routerOptions: RouterConfig = {
  async scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }

    if (to.hash) {
      const element = await waitForElement(to.hash);
      if (element) {
        // `el` alone races the section mounting, so scroll it ourselves.
        element.scrollIntoView({ behavior: "smooth", block: "start" });
        return false;
      }
      return { behavior: "smooth", top: 0 };
    }

    return { behavior: "smooth", left: 0, top: 0 };
  },
};

export default routerOptions;
