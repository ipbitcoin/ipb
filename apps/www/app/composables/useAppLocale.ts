/** Current locale narrowed to the app's supported pair — no casts needed at call sites. */
export default function useAppLocale() {
  const { locale } = useI18n();
  return computed<"pt" | "en">(() => (locale.value === "en" ? "en" : "pt"));
}
