export default function useNewsletter() {
  const { $toast } = useNuxtApp();
  const { t } = useI18n();
  const config = useRuntimeConfig();

  const loading = ref(false);
  const error = ref<Error>();
  const success = ref(false);

  async function silentSubstackSubscribe(emailValue: string) {
    if (!import.meta.client) {
      return;
    }
    const rawSubstackUrl = config.public.SUBSTACK_URL;
    if (typeof rawSubstackUrl !== "string" || rawSubstackUrl === "") {
      return;
    }
    const substackBase = rawSubstackUrl.replace(/\/$/, "");

    const url = `${substackBase}/api/v1/free`;
    const body = JSON.stringify({
      additional_referring_pub_ids: [],
      coupon_code: "",
      email: emailValue,
      first_name: "",
      last_name: "",
      referring_pub_id: null,
    });

    try {
      const res = await fetch(url, {
        body,
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (!res.ok) {
        throw new Error(`Substack responded ${res.status}`);
      }
    } catch {
      // Fallback: no-cors with form-encoded (simple request, bypasses CORS preflight)
      try {
        const formData = new URLSearchParams({
          email: emailValue,
          first_name: "",
          last_name: "",
        });
        await fetch(url, {
          body: formData.toString(),
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          method: "POST",
          mode: "no-cors",
        });
      } catch {
        // Silent fail
      }
    }
  }

  async function subscribe(email: Ref<string>) {
    loading.value = true;
    error.value = undefined;
    success.value = false;

    try {
      await $fetch("/api/newsletter-subscribe", {
        body: { email: email.value },
        method: "POST",
      });

      silentSubstackSubscribe(email.value);

      success.value = true;
      email.value = "";
      $toast.success(t("newsletter.success"));
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
