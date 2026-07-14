/** Converts an author name to a URL-safe slug. "Pedro Deakin" → "pedro-deakin" */
export default function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replaceAll(/[̀-ͯ]/g, "") // strip accents
    .replaceAll(/[^a-z0-9\s-]/g, "")
    .trim()
    .replaceAll(/\s+/g, "-");
}
