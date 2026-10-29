/**
 * The opening of an article's Markdown as plain text, for meta descriptions.
 * Markup is dropped (links keep their text) and long text is cut at a word
 * boundary, so search results never show a broken word or a stray "**".
 */
export function toExcerpt(markdown: string, max = 160): string {
  const text = markdown
    // MDC blocks such as ::youtube-video{…} … ::
    .replace(/^::.*$/gm, " ")
    // Raw HTML, like the <br> spacer lines
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Horizontal rules, then heading, quote and list markers
    .replace(/^[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*$/gm, " ")
    .replace(
      /^[ \t]{0,3}(?:#{1,6}[ \t]+|>[ \t]?|[-*+][ \t]+|\d+[.)][ \t]+)/gm,
      ""
    )
    .replace(/[*_`~]+/g, "")
    // One sentence per block, so a heading never runs into the paragraph
    // after it ("…da Bitcoin O consumo…")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((block) => (/[.!?:;…"”»)]$/.test(block) ? block : `${block}.`))
    .join(" ");

  if (text.length <= max) {
    return text;
  }

  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const words = lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut;
  return `${words.replace(/[\s,;:.!?–—-]+$/, "")}…`;
}
