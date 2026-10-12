/** Absolute id of a node in the site's JSON-LD graph. */
function graphId(fragment: string) {
  return new URL(`/#${fragment}`, useSiteConfig().url).href;
}

/** The institute itself, as nuxt-schema-org registers `schemaOrg.identity`. */
export function identitySchemaId() {
  return graphId("identity");
}

/**
 * A person on the site, keyed by author slug. Every Person node needs one:
 * without an explicit id, a top-level Person takes the identity's id and is
 * merged into the institute's own node. Shared by the article, author and
 * team pages, so search engines see one person rather than one per page.
 */
export function personSchemaId(slug: string) {
  return graphId(`/schema/person/${slug}`);
}
