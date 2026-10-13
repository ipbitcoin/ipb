/** Lowercase without accents, so "acao" finds "Ação". */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replaceAll(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-PT");
}

/** Whether any of the texts holds the query; an empty query matches all. */
export function matchesQuery(
  query: string,
  texts: (string | undefined)[]
): boolean {
  const needle = foldText(query.trim());
  return (
    needle === "" ||
    texts.some((text) => text !== undefined && foldText(text).includes(needle))
  );
}
