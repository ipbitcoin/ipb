<template>
  <div>
    <IPBPageHeader
      :eyebrow="t('join.eyebrow')"
      :title="t('nav.join')"
      :description="t('join.subtitle')"
    >
      <!-- The payment providers send people back here with the outcome. -->
      <template v-if="notice" #before>
        <div
          role="status"
          class="flex max-w-2xl items-start gap-3 rounded-2xl border border-transparent bg-white p-4 shadow-border"
        >
          <span
            class="grid size-8 shrink-0 place-items-center rounded-full"
            :class="
              notice.ok
                ? 'bg-brand text-neutral-950'
                : 'bg-neutral-100 text-neutral-600'
            "
          >
            <IconCheck v-if="notice.ok" class="size-4" />
            <IconClose v-else class="size-4" />
          </span>
          <p class="pt-1 leading-6 text-pretty">{{ notice.text }}</p>
        </div>
      </template>

      <div class="flex flex-wrap gap-3">
        <UiButton size="lg" to="#membership">
          {{ t("join.member") }}
          <IconArrow class="size-4 rotate-90" />
        </UiButton>
        <UiButton size="lg" variant="outline" to="#donate">
          {{ t("join.donate") }}
          <IconArrow class="size-4 rotate-90" />
        </UiButton>
      </div>
    </IPBPageHeader>

    <!-- No bottom padding: the donate section below brings its own. -->
    <IPBMembershipTiers
      id="membership"
      class="section section-gap pb-0"
      @select="selectTier"
    />

    <section
      id="donate"
      aria-labelledby="donate-heading"
      class="section section-gap"
    >
      <div
        class="relative isolate rounded-3xl bg-neutral-950 px-6 py-14 text-white max-sm:-mx-6 max-sm:rounded-none sm:px-12 sm:py-16 lg:px-16 lg:py-20"
      >
        <!-- The site's grid motif, fading out from the corner. -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 -z-10 rounded-[inherit] bg-[linear-gradient(to_right,oklch(1_0_0/0.06)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.06)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_70%_60%_at_0%_0%,black,transparent_70%)]"
        />

        <!-- On phones the form follows the pitch, ahead of the longer mission
             text. On wide screens it sits beside both and stays in view. -->
        <div
          class="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-x-16 lg:gap-y-10 xl:gap-x-24"
        >
          <div class="reveal max-w-xl">
            <div class="flex flex-col gap-4">
              <p class="eyebrow text-white/50">
                {{ t("join.donationsTitle") }}
              </p>
              <h2 id="donate-heading" class="section-title">
                {{ t("join.donateHeading") }}
              </h2>
            </div>
            <p class="mt-6 text-lg leading-relaxed text-pretty text-white/70">
              {{ t("join.mission") }}
            </p>
          </div>

          <div
            class="reveal max-w-xl lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
            style="--reveal-delay: 100ms"
          >
            <div
              class="rounded-2xl border border-transparent bg-white p-5 text-neutral-950 shadow-popover sm:p-8"
            >
              <p class="leading-relaxed text-pretty text-neutral-600">
                {{ t("join.donationsDescription") }}
              </p>

              <fieldset class="mt-6">
                <legend class="text-sm font-medium">
                  {{ t("join.frequency") }}
                </legend>
                <div
                  class="relative mt-2.5 grid grid-cols-3 gap-1 rounded-full bg-neutral-100 p-1"
                >
                  <!-- One pill slides over to the chosen frequency. -->
                  <span
                    aria-hidden="true"
                    class="absolute inset-y-1 left-1 w-[calc((100%-1rem)/3)] rounded-full border border-transparent bg-white shadow-button-light transition-[translate] duration-200 ease-in-out motion-reduce:transition-none"
                    :style="{
                      translate: `calc(${modeIndex} * (100% + 0.25rem)) 0`,
                    }"
                  />
                  <label
                    v-for="mode in DONATION_MODES"
                    :key="mode.value"
                    class="relative"
                  >
                    <input
                      v-model="donationMode"
                      type="radio"
                      name="donation-mode"
                      :value="mode.value"
                      class="peer sr-only"
                    />
                    <span :class="SEGMENT">{{ t(mode.label) }}</span>
                  </label>
                </div>
              </fieldset>

              <fieldset class="mt-6">
                <legend class="text-sm font-medium">
                  {{ t("join.amountEur") }}
                </legend>
                <div class="mt-2.5 grid grid-cols-4 gap-2">
                  <label v-for="preset in DONATION_PRESETS" :key="preset">
                    <input
                      type="radio"
                      name="donation-amount"
                      :value="preset"
                      :checked="isPreset(preset)"
                      class="peer sr-only"
                      @change="pickPreset(preset)"
                    />
                    <span
                      :class="[TILE, isPreset(preset) ? 'chip-on' : 'chip-off']"
                    >
                      €{{ preset }}
                    </span>
                  </label>
                </div>
                <div class="relative mt-2">
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute inset-y-0 left-4 flex items-center text-neutral-500"
                  >
                    €
                  </span>
                  <input
                    v-model="donationCustom"
                    type="number"
                    min="1"
                    :max="identify ? undefined : ANONYMOUS_CEILING"
                    :placeholder="t('join.other')"
                    :aria-label="t('join.other')"
                    class="field-box h-12 rounded-xl pl-9 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    @input="donationAmount = 0"
                  />
                </div>
              </fieldset>

              <div class="mt-6 border-t border-black/10 pt-6">
                <label class="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    v-model="identify"
                    type="checkbox"
                    class="mt-0.5 size-4 shrink-0 cursor-pointer accent-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                  />
                  {{ t("join.identifyMe") }}
                </label>
                <div
                  v-if="identify"
                  class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1"
                >
                  <div class="flex flex-col gap-1.5">
                    <label for="donor-name" class="text-sm font-medium">
                      {{ t("join.donorName") }}
                    </label>
                    <input
                      id="donor-name"
                      v-model="donorName"
                      type="text"
                      autocomplete="name"
                      :placeholder="t('join.donorNamePlaceholder')"
                      class="field-box"
                    />
                  </div>
                  <div class="flex flex-col gap-1.5">
                    <label for="donor-email" class="text-sm font-medium">
                      {{ t("join.donorEmail") }}
                    </label>
                    <input
                      id="donor-email"
                      v-model="donorEmail"
                      type="email"
                      autocomplete="email"
                      :placeholder="t('join.donorEmailPlaceholder')"
                      class="field-box"
                    />
                  </div>
                </div>
                <p
                  v-else
                  class="mt-3 text-[13px] leading-relaxed text-pretty text-neutral-500"
                >
                  {{ t("join.anonymousNotice") }}
                </p>
              </div>

              <p
                v-if="overCeiling"
                role="alert"
                class="mt-4 text-sm text-red-700"
              >
                {{ t("join.ceilingWarning") }}
              </p>

              <div class="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                <UiButton
                  size="lg"
                  :loading="stripeLoading"
                  :disabled="!canSubmitDonation || stripeLoading"
                  @click="handleStripeCheckout"
                >
                  {{ t("join.donateCard") }}
                </UiButton>
                <UiButton
                  size="lg"
                  variant="brand"
                  :loading="opennodeLoading"
                  :disabled="!canSubmitDonation || opennodeLoading"
                  @click="handleOpennodeCheckout"
                >
                  {{ t("join.donateBtc") }}
                </UiButton>
              </div>
              <p class="mt-3 text-[13px] text-neutral-500">
                {{ t("join.btcOneTimeNote") }}
              </p>
              <p
                v-if="stripeError || opennodeError"
                role="alert"
                class="mt-3 text-sm text-red-700"
              >
                {{ stripeError || opennodeError }}
              </p>
            </div>
          </div>

          <div class="reveal max-w-xl lg:col-start-1">
            <ul class="border-t border-white/10">
              <li
                v-for="(point, index) in MISSION_POINTS"
                :key="point"
                class="flex items-baseline gap-5 border-b border-white/10 py-5"
              >
                <span
                  aria-hidden="true"
                  class="font-mono text-xs font-medium text-brand tabular-nums"
                >
                  {{ String(index + 1).padStart(2, "0") }}
                </span>
                <p class="leading-relaxed text-pretty text-white/60">
                  <span class="font-medium text-white">
                    {{ t(`join.missionPoints.${point}.bold`) }}
                  </span>
                  {{ t(`join.missionPoints.${point}.text`) }}
                </p>
              </li>
            </ul>

            <p class="mt-10 leading-relaxed text-pretty text-white/70">
              {{ t("join.supportImpact") }}
            </p>
            <p class="mt-4 text-sm leading-relaxed text-pretty text-white/50">
              {{ t("join.orgInfo") }}
            </p>
          </div>
        </div>
      </div>

      <p
        class="mt-6 max-w-3xl text-[13px] leading-relaxed text-pretty text-neutral-500"
      >
        {{ t("join.disclaimer") }}
      </p>
    </section>

    <dialog
      ref="memberDialog"
      aria-labelledby="member-dialog-title"
      class="dialog m-auto max-h-[90dvh] w-[min(92vw,34rem)] overflow-y-auto rounded-3xl border border-transparent bg-white p-0 text-neutral-950 shadow-popover"
      @pointerdown="onDialogPointerDown"
      @click="onDialogClick"
      @close="unlockScroll"
    >
      <div class="p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <h2
            id="member-dialog-title"
            class="text-2xl leading-tight tracking-tight"
          >
            {{ t("join.memberFormTitle") }}
          </h2>
          <button
            type="button"
            class="focus-ring -mt-1 -mr-2 grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-neutral-500 transition-[background-color,color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-black/5 hover:text-neutral-950"
            :aria-label="t('join.close')"
            @click="memberDialog?.close()"
          >
            <IconClose class="size-4" />
          </button>
        </div>

        <div
          class="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-brand-soft px-5 py-4"
        >
          <div>
            <p class="eyebrow text-neutral-600">
              {{ t(`join.tiers.${tierKey}.label`) }}
            </p>
            <p class="mt-1.5 font-medium">
              {{ t(`join.tiers.${tierKey}.name`) }}
            </p>
          </div>
          <p class="flex shrink-0 items-baseline gap-1 tabular-nums">
            <span class="text-3xl tracking-[-0.03em]">€21</span>
            <span class="text-sm text-neutral-600">
              {{
                memberForm.paymentPlan === "annual"
                  ? t("join.tiers.perYear")
                  : t("join.tiers.perMonth")
              }}
            </span>
          </p>
        </div>

        <form
          class="mt-6 flex flex-col gap-5"
          @submit.prevent="handleMemberSubmit"
        >
          <div class="flex flex-col gap-1.5">
            <label for="member-name" class="text-sm font-medium">
              {{ t("join.form.name") }}
              <span aria-hidden="true" class="text-neutral-500">*</span>
            </label>
            <input
              id="member-name"
              v-model="memberForm.name"
              type="text"
              required
              autocomplete="name"
              :placeholder="t('join.form.namePlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="member-email" class="text-sm font-medium">
              {{ t("join.form.email") }}
              <span aria-hidden="true" class="text-neutral-500">*</span>
            </label>
            <input
              id="member-email"
              v-model="memberForm.email"
              type="email"
              required
              autocomplete="email"
              :placeholder="t('join.form.emailPlaceholder')"
              class="field-box"
            />
          </div>
          <fieldset>
            <legend class="text-sm font-medium">
              {{ t("join.form.dateOfBirth") }}
              <span class="font-normal text-neutral-500">
                ({{ t("join.form.optional") }})
              </span>
            </legend>
            <div class="mt-1.5 flex items-center gap-2">
              <input
                v-model="memberBirthDay"
                type="text"
                inputmode="numeric"
                maxlength="2"
                autocomplete="bday-day"
                placeholder="DD"
                :aria-label="t('join.form.day')"
                class="field-box w-14 px-2 text-center tabular-nums"
              />
              <span aria-hidden="true" class="text-neutral-400">/</span>
              <input
                v-model="memberBirthMonth"
                type="text"
                inputmode="numeric"
                maxlength="2"
                autocomplete="bday-month"
                placeholder="MM"
                :aria-label="t('join.form.month')"
                class="field-box w-14 px-2 text-center tabular-nums"
              />
              <span aria-hidden="true" class="text-neutral-400">/</span>
              <input
                v-model="memberBirthYear"
                type="text"
                inputmode="numeric"
                maxlength="4"
                autocomplete="bday-year"
                :placeholder="t('join.form.yearPlaceholder')"
                :aria-label="t('join.form.year')"
                class="field-box w-20 px-2 text-center tabular-nums"
              />
            </div>
          </fieldset>
          <div class="flex flex-col gap-1.5">
            <label for="member-citizen-card" class="text-sm font-medium">
              {{ t("join.form.citizenCard") }}
              <span class="font-normal text-neutral-500">
                ({{ t("join.form.optional") }})
              </span>
            </label>
            <input
              id="member-citizen-card"
              v-model="memberForm.citizenCardNumber"
              type="text"
              :placeholder="t('join.form.citizenCardPlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="member-fiscal-number" class="text-sm font-medium">
              {{ t("join.form.fiscalNumber") }}
              <span class="font-normal text-neutral-500">
                ({{ t("join.form.optional") }})
              </span>
            </label>
            <input
              id="member-fiscal-number"
              v-model="memberForm.fiscalNumber"
              type="text"
              inputmode="numeric"
              :placeholder="t('join.form.fiscalNumberPlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="member-address" class="text-sm font-medium">
              {{ t("join.form.address") }}
              <span class="font-normal text-neutral-500">
                ({{ t("join.form.optional") }})
              </span>
            </label>
            <textarea
              id="member-address"
              v-model="memberForm.address"
              rows="3"
              autocomplete="street-address"
              :placeholder="t('join.form.addressPlaceholder')"
              class="field-box resize-none"
            />
          </div>
          <UiButton
            size="lg"
            arrow
            type="submit"
            class="mt-1 w-full"
            :loading="memberLoading"
            :disabled="!canSubmitMember || memberLoading"
          >
            {{ t("join.form.submit") }}
          </UiButton>
          <p v-if="memberError" role="alert" class="text-sm text-red-700">
            {{ memberError }}
          </p>
        </form>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n();
const appLocale = useAppLocale();
const localePath = useLocalePath();
const route = useRoute();

const SEO = {
  en: {
    description:
      "Support the Portuguese Bitcoin Institute: become a member from €21 a year, or donate in Bitcoin or by card.",
    title: "Membership and Donations",
  },
  pt: {
    description:
      "Apoie a missão do Instituto Português de Bitcoin: torne-se membro a partir de €21 por ano ou faça um donativo em Bitcoin ou cartão.",
    title: "Membros e Donativos",
  },
} as const;
const seo = computed(() => SEO[appLocale.value]);

// The title runs through the global "%s | Instituto Português de Bitcoin"
// template; social titles do not, so they carry the short name instead.
useSeoMeta({
  description: () => seo.value.description,
  ogDescription: () => seo.value.description,
  ogTitle: () => `${seo.value.title} | IPB`,
  title: () => seo.value.title,
  twitterDescription: () => seo.value.description,
  twitterTitle: () => `${seo.value.title} | IPB`,
});

useSchemaOrg([
  defineBreadcrumb({
    itemListElement: [
      { item: localePath("index"), name: t("seo.title") },
      { item: localePath("juntar"), name: t("nav.join") },
    ],
  }),
]);

const status = computed(() => {
  const value = route.query.status;
  return typeof value === "string" ? value : undefined;
});

const notice = computed(() => {
  switch (status.value) {
    case "success": {
      return { ok: true, text: t("join.successDonation") };
    }
    case "member-success": {
      return { ok: true, text: t("join.successMember") };
    }
    case "cancel":
    case "member-cancel": {
      return { ok: false, text: t("join.cancelled") };
    }
    default: {
      return null;
    }
  }
});

const MISSION_POINTS = [
  "promote",
  "establish",
  "accelerate",
  "engage",
] as const;

// DONATIONS — one amount, one frequency, two payment methods.
const DONATION_PRESETS = [25, 50, 100, 250];
const DONATION_MODES = [
  { label: "join.oneTime", value: "payment" },
  { label: "join.recurringMonthly", value: "subscription_month" },
  { label: "join.recurringYearly", value: "subscription" },
] as const;
const ANONYMOUS_CEILING = 300;

// Radios drawn as a segmented control and as tiles; the inputs stay in the
// page (visually hidden), so arrow keys and screen readers work as usual.
const SEGMENT =
  "flex h-9 cursor-pointer items-center justify-center rounded-full px-2 text-sm font-medium text-neutral-600 transition-[color] duration-150 ease-out select-none [-webkit-tap-highlight-color:transparent] hover:text-neutral-950 peer-checked:text-neutral-950 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";
const TILE =
  "chip h-12 w-full rounded-xl px-2 text-base tabular-nums motion-safe:active:scale-[0.96] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand";

const donationAmount = ref(50);
const donationCustom = ref("");
const donationMode = ref<"payment" | "subscription" | "subscription_month">(
  "payment"
);
const identify = ref(false);
const donorName = ref("");
const donorEmail = ref("");
const stripeLoading = ref(false);
const stripeError = ref("");
const opennodeLoading = ref(false);
const opennodeError = ref("");

const modeIndex = computed(() =>
  DONATION_MODES.findIndex((mode) => mode.value === donationMode.value)
);

const effectiveAmount = computed(() =>
  donationCustom.value ? Number(donationCustom.value) : donationAmount.value
);

const overCeiling = computed(
  () => !identify.value && effectiveAmount.value > ANONYMOUS_CEILING
);

const canSubmitDonation = computed(
  () =>
    effectiveAmount.value >= 1 &&
    !overCeiling.value &&
    !(
      donationMode.value === "subscription_month" &&
      effectiveAmount.value > ANONYMOUS_CEILING
    )
);

const isPreset = (preset: number) =>
  donationAmount.value === preset && !donationCustom.value;

function pickPreset(preset: number) {
  donationAmount.value = preset;
  donationCustom.value = "";
}

const donorFields = () =>
  identify.value
    ? { donorEmail: donorEmail.value, donorName: donorName.value }
    : {};

async function handleStripeCheckout() {
  stripeLoading.value = true;
  stripeError.value = "";
  try {
    const { url } = await $fetch<{ url: string }>("/api/stripe-checkout", {
      body: {
        amount: effectiveAmount.value,
        currency: "eur",
        locale: locale.value,
        mode: donationMode.value,
        ...donorFields(),
      },
      method: "POST",
    });
    if (url) {
      navigateTo(url, { external: true });
    }
  } catch {
    stripeError.value = t("join.errorPayment");
  } finally {
    stripeLoading.value = false;
  }
}

// Bitcoin (OpenNode) only supports one-time donations.
async function handleOpennodeCheckout() {
  opennodeLoading.value = true;
  opennodeError.value = "";
  try {
    const { url } = await $fetch<{ url: string }>("/api/opennode-checkout", {
      body: {
        amount: effectiveAmount.value,
        currency: "EUR",
        locale: locale.value,
        ...donorFields(),
      },
      method: "POST",
    });
    if (url) {
      navigateTo(url, { external: true });
    }
  } catch {
    opennodeError.value = t("join.errorPayment");
  } finally {
    opennodeLoading.value = false;
  }
}

// MEMBERSHIP
const memberLoading = ref(false);
const memberError = ref("");

const memberBirthDay = ref("");
const memberBirthMonth = ref("");
const memberBirthYear = ref("");

interface MemberForm {
  address: string;
  citizenCardNumber: string;
  dateOfBirth: string;
  email: string;
  fiscalNumber: string;
  name: string;
  paymentPlan: "annual" | "monthly";
}

const memberForm = reactive<MemberForm>({
  address: "",
  citizenCardNumber: "",
  dateOfBirth: "",
  email: "",
  fiscalNumber: "",
  name: "",
  paymentPlan: "annual",
});

const memberDialog = ref<HTMLDialogElement | null>(null);

// Tier 1 = annual, Tier 2 = monthly (matches the cards in IPBMembershipTiers).
const tierKey = computed(() =>
  memberForm.paymentPlan === "annual" ? "t1" : "t2"
);

function selectTier(plan: MemberForm["paymentPlan"]) {
  memberForm.paymentPlan = plan;
  memberError.value = "";
  document.body.classList.add("overflow-hidden");
  memberDialog.value?.showModal();
}

function unlockScroll() {
  document.body.classList.remove("overflow-hidden");
}

// Leaving the page with the dialog open removes it without a `close` event.
onBeforeUnmount(unlockScroll);

// A click on the backdrop closes the dialog, but only one that also started
// there: selecting text in a field and letting go outside it ends on the
// dialog too, and must not throw the form away.
let pressedBackdrop = false;

function onDialogPointerDown(event: PointerEvent) {
  pressedBackdrop = event.target === memberDialog.value;
}

function onDialogClick(event: MouseEvent) {
  if (pressedBackdrop && event.target === memberDialog.value) {
    memberDialog.value?.close();
  }
  pressedBackdrop = false;
}

watch([memberBirthDay, memberBirthMonth, memberBirthYear], ([d, m, y]) => {
  if (d && m && y && y.length === 4) {
    memberForm.dateOfBirth = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  } else {
    memberForm.dateOfBirth = "";
  }
});

const canSubmitMember = computed(() => !!(memberForm.name && memberForm.email));

async function handleMemberSubmit() {
  memberLoading.value = true;
  memberError.value = "";
  try {
    const { url } = await $fetch<{ url: string }>("/api/member-register", {
      body: {
        ...memberForm,
        locale: locale.value,
      },
      method: "POST",
    });
    if (url) {
      navigateTo(url, { external: true });
    }
  } catch (error: unknown) {
    memberError.value = fetchErrorMessage(error) || t("join.errorMember");
  } finally {
    memberLoading.value = false;
  }
}
</script>
