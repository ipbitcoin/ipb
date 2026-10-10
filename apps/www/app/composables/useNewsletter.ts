export default function useNewsletter() {
  const { $toast } = useNuxtApp();
  const { locale, t } = useI18n();

  const loading = ref(false);
  const error = ref<Error>();
  const success = ref(false);

  async function subscribe(email: Ref<string>) {
    loading.value = true;
    error.value = undefined;
    success.value = false;

    try {
      await $fetch("/api/newsletter-subscribe", {
        body: { email: email.value, locale: locale.value },
        method: "POST",
      });

      success.value = true;
      email.value = "";
      $toast.success(t("newsletter.pending"));
    } catch (_error) {
      if (_error instanceof Error) {
        error.value = _error;
      }
      $toast.error(t("newsletter.error"));
    } finally {
      loading.value = false;
    }
  }

  return {
    error,
    loading,
    subscribe,
    success,
  };
}
