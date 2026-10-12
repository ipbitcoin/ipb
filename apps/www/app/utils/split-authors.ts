/** A book's authors, entered comma-separated in the CMS. "A, B" → ["A", "B"] */
export default function splitAuthors(names: string): string[] {
  return names
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
