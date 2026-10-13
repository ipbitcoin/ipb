/** Label swatches, matching the backend's `labelColor` validator. */
export const LABEL_COLORS = [
  "gray",
  "blue",
  "green",
  "yellow",
  "orange",
  "red",
  "pink",
  "purple",
  "teal",
] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];

export const LABEL_COLOR_NAMES: Record<LabelColor, string> = {
  blue: "Azul",
  gray: "Cinzento",
  green: "Verde",
  orange: "Laranja",
  pink: "Rosa",
  purple: "Roxo",
  red: "Vermelho",
  teal: "Turquesa",
  yellow: "Amarelo",
};

/** Solid swatch for dots. */
export const SWATCH_CLASSES: Record<LabelColor, string> = {
  blue: "bg-blue-500",
  gray: "bg-neutral-400",
  green: "bg-green-500",
  orange: "bg-orange-500",
  pink: "bg-pink-500",
  purple: "bg-violet-500",
  red: "bg-red-500",
  teal: "bg-teal-500",
  yellow: "bg-yellow-400",
};

/** A new label's color: whichever the fewest labels wear, so they stay told apart. */
export function nextLabelColor(labels: { color: LabelColor }[]): LabelColor {
  const uses = (color: LabelColor) =>
    labels.filter((label) => label.color === color).length;
  // Sorting is stable, so ties keep palette order.
  const [color = "gray"] = LABEL_COLORS.filter(
    (item) => item !== "gray"
  ).toSorted((a, b) => uses(a) - uses(b));
  return color;
}
