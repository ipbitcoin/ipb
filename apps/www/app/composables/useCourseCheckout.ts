/**
 * Buying a course: optional member-discount check (the same emailed code as
 * the in-person training), then Stripe Checkout with a card.
 */
export default function useCourseCheckout(
  courseSlug: MaybeRefOrGetter<string>
) {
  const lang = useAppLocale();
  const copy = computed(() => COURSE_COPY[lang.value]);

  const email = ref("");
  const code = ref("");
  const step = ref<"idle" | "code" | "verified">("idle");
  const memberToken = ref("");
  const memberLayer = ref<1 | 2 | undefined>();
  const busy = ref(false);
  const problem = ref("");
  const info = ref("");
  const owned = ref(false);

  const emailValid = computed(() => EMAIL_PATTERN.test(email.value.trim()));
  const priceCents = computed(() => coursePriceCents(memberLayer.value));

  // A different email than the verified one means a different customer.
  watch(email, () => {
    if (step.value !== "idle") {
      step.value = "idle";
      memberToken.value = "";
      memberLayer.value = undefined;
      code.value = "";
    }
    problem.value = "";
    info.value = "";
    owned.value = false;
  });

  async function sendCode() {
    if (!emailValid.value) {
      problem.value = copy.value.wrongEmail;
      return;
    }
    busy.value = true;
    problem.value = "";
    try {
      const res = await $fetch<{ devCode?: string }>(
        "/api/member-verify/request",
        {
          body: { email: email.value.trim(), locale: lang.value },
          method: "POST",
        }
      );
      step.value = "code";
      info.value = copy.value.codeSent;
      if (res.devCode) {
        code.value = res.devCode; // local dev only: the API hands the code back
      }
    } catch {
      problem.value = copy.value.memberFail;
    } finally {
      busy.value = false;
    }
  }

  async function confirmCode() {
    busy.value = true;
    problem.value = "";
    try {
      const res = await $fetch<{ memberLayer?: 1 | 2; token: string }>(
        "/api/member-verify/confirm",
        {
          body: { code: code.value.trim(), email: email.value.trim() },
          method: "POST",
        }
      );
      memberToken.value = res.token;
      memberLayer.value = res.memberLayer;
      step.value = "verified";
      info.value = res.memberLayer
        ? copy.value.memberDiscount(
            COURSE_DISCOUNT_PCT[res.memberLayer],
            copy.value.memberLayers[res.memberLayer]
          )
        : "";
    } catch {
      problem.value = copy.value.memberFail;
    } finally {
      busy.value = false;
    }
  }

  async function buy() {
    if (!emailValid.value) {
      problem.value = copy.value.wrongEmail;
      return;
    }
    busy.value = true;
    problem.value = "";
    try {
      const res = await $fetch<{ url: string }>("/api/curso/checkout", {
        body: {
          course: toValue(courseSlug),
          email: email.value.trim(),
          locale: lang.value,
          memberToken: memberToken.value || undefined,
        },
        method: "POST",
      });
      window.location.href = res.url;
    } catch (error: unknown) {
      busy.value = false;
      if (fetchErrorStatus(error) === 409) {
        owned.value = true;
      } else {
        problem.value = copy.value.genericError;
      }
    }
  }

  return {
    buy,
    busy,
    code,
    confirmCode,
    copy,
    email,
    emailValid,
    error: problem,
    info,
    memberLayer,
    owned,
    priceCents,
    sendCode,
    step,
  };
}
