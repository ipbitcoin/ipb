<template>
  <div>
    <main>
      <div class="section flex flex-col gap-4 pt-20 pb-16 sm:pt-24">
        <h1
          class="max-w-3xl text-5xl leading-[1.02] font-light text-balance sm:text-6xl"
        >
          {{ $t("nav.join") }}
        </h1>
        <p class="max-w-2xl text-lg text-black/70">{{ t("join.subtitle") }}</p>
        <div
          v-if="status === 'success'"
          role="status"
          class="rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800"
        >
          {{ t("join.successDonation") }}
        </div>
        <div
          v-if="status === 'member-success'"
          role="status"
          class="rounded border border-green-300 bg-green-50 px-4 py-3 text-green-800"
        >
          {{ t("join.successMember") }}
        </div>
        <div
          v-if="status === 'cancel' || status === 'member-cancel'"
          role="status"
          class="rounded border border-yellow-300 bg-yellow-50 px-4 py-3 text-yellow-800"
        >
          {{ t("join.cancelled") }}
        </div>
        <IPBMembershipTiers class="mt-8" @select="selectTier" />

        <section
          class="mt-16 grid grid-cols-1 gap-10 border-t-2 border-black pt-10 lg:grid-cols-[1fr_480px] lg:items-start lg:gap-12"
          aria-labelledby="donate-heading"
        >
          <div class="flex flex-col gap-4 text-black text-lg">
            <p>{{ t("join.mission") }}</p>

            <ul class="flex flex-col gap-2">
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>
                  <span class="font-bold">{{
                    t("join.missionPoints.promote.bold")
                  }}</span>
                  {{ t("join.missionPoints.promote.text") }}
                </p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>
                  <span class="font-bold">{{
                    t("join.missionPoints.establish.bold")
                  }}</span>
                  {{ t("join.missionPoints.establish.text") }}
                </p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>
                  <span class="font-bold">{{
                    t("join.missionPoints.accelerate.bold")
                  }}</span>
                  {{ t("join.missionPoints.accelerate.text") }}
                </p>
              </li>
              <li class="flex items-baseline gap-2">
                <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                <p>
                  <span class="font-bold">{{
                    t("join.missionPoints.engage.bold")
                  }}</span>
                  {{ t("join.missionPoints.engage.text") }}
                </p>
              </li>
            </ul>
            <p>{{ t("join.supportImpact") }}</p>
            <p class="text-base text-black/60">{{ t("join.orgInfo") }}</p>
          </div>

          <div class="flex flex-col gap-6">
            <div class="flex flex-col gap-2">
              <h2 id="donate-heading" class="text-2xl font-light">
                {{ t("join.donationsTitle") }}
              </h2>
              <p class="max-w-xl text-lg text-black/70">
                {{ t("join.donationsDescription") }}
              </p>
            </div>

            <div class="flex flex-col gap-5 rounded-lg p-6 shadow-border">
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="preset in DONATION_PRESETS"
                  :key="preset"
                  type="button"
                  :aria-pressed="donationAmount === preset && !donationCustom"
                  :class="[
                    'chip tabular-nums',
                    donationAmount === preset && !donationCustom
                      ? 'chip-on'
                      : 'chip-off',
                  ]"
                  @click="pickPreset(preset)"
                >
                  €{{ preset }}
                </button>
                <input
                  v-model="donationCustom"
                  type="number"
                  min="1"
                  :max="identify ? undefined : ANONYMOUS_CEILING"
                  :placeholder="t('join.other')"
                  :aria-label="t('join.amountEur')"
                  class="field-box w-24 tabular-nums"
                  @input="donationAmount = 0"
                />
              </div>

              <div class="flex flex-wrap gap-2" role="group">
                <button
                  v-for="mode in DONATION_MODES"
                  :key="mode.value"
                  type="button"
                  :aria-pressed="donationMode === mode.value"
                  :class="[
                    'chip',
                    donationMode === mode.value ? 'chip-on' : 'chip-off',
                  ]"
                  @click="donationMode = mode.value"
                >
                  {{ t(mode.label) }}
                </button>
              </div>

              <div class="flex flex-col gap-3">
                <label class="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    v-model="identify"
                    type="checkbox"
                    class="accent-black"
                  />
                  {{ t("join.identifyMe") }}
                </label>
                <template v-if="identify">
                  <input
                    v-model="donorName"
                    type="text"
                    :placeholder="t('join.donorNamePlaceholder')"
                    :aria-label="t('join.donorName')"
                    class="field-box"
                  />
                  <input
                    v-model="donorEmail"
                    type="email"
                    :placeholder="t('join.donorEmailPlaceholder')"
                    :aria-label="t('join.donorEmail')"
                    class="field-box"
                  />
                </template>
                <p v-else class="text-xs text-black/60">
                  {{ t("join.anonymousNotice") }}
                </p>
              </div>

              <p v-if="overCeiling" role="alert" class="text-sm text-red-600">
                {{ t("join.ceilingWarning") }}
              </p>

              <div class="flex flex-col gap-2 sm:flex-row">
                <UiButton
                  size="lg"
                  class="flex-1"
                  :loading="stripeLoading"
                  :disabled="!canSubmitDonation || stripeLoading"
                  @click="handleStripeCheckout"
                >
                  {{ t("join.donateCard") }}
                </UiButton>
                <UiButton
                  size="lg"
                  variant="outline"
                  class="flex-1"
                  :loading="opennodeLoading"
                  :disabled="!canSubmitDonation || opennodeLoading"
                  @click="handleOpennodeCheckout"
                >
                  {{ t("join.donateBtc") }}
                </UiButton>
              </div>
              <p class="text-xs text-black/60">
                {{ t("join.btcOneTimeNote") }}
              </p>
              <p
                v-if="stripeError || opennodeError"
                role="alert"
                class="text-sm text-red-600"
              >
                {{ stripeError || opennodeError }}
              </p>
            </div>
          </div>
        </section>

        <p class="mt-10 text-xs text-black/50">
          {{ t("join.disclaimer") }}
        </p>
      </div>
    </main>

    <dialog
      ref="memberDialog"
      aria-labelledby="member-dialog-title"
      class="m-auto max-h-[90dvh] w-[min(92vw,34rem)] overflow-y-auto rounded-lg bg-white p-0 shadow-popover backdrop:bg-black/50"
      @click.self="memberDialog?.close()"
      @close="unlockScroll"
    >
      <div class="flex flex-col gap-5 p-6 sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <h2 id="member-dialog-title" class="text-2xl font-light">
            {{ t("join.memberFormTitle") }}
          </h2>
          <button
            type="button"
            class="focus-ring -m-1 cursor-pointer rounded p-1 text-black/60 hover:text-black"
            :aria-label="t('join.close')"
            @click="memberDialog?.close()"
          >
            <IconClose class="size-5" aria-hidden="true" />
          </button>
        </div>
        <div
          class="flex items-center justify-between gap-4 rounded-lg bg-brand-soft p-4"
        >
          <div>
            <p class="eyebrow">{{ t(`join.tiers.${tierKey}.label`) }}</p>
            <p class="font-semibold">{{ t(`join.tiers.${tierKey}.name`) }}</p>
          </div>
          <p class="flex items-baseline gap-1 tabular-nums">
            <span class="text-3xl font-semibold">€21</span>
            <span class="text-black/60">{{
              memberForm.paymentPlan === "annual"
                ? t("join.tiers.perYear")
                : t("join.tiers.perMonth")
            }}</span>
          </p>
        </div>
        <form @submit.prevent="handleMemberSubmit" class="flex flex-col gap-4">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium"
              >{{
                locale === "pt" ? "Nome / Nickname" : "Name / Nickname"
              }}
              *</label
            >
            <input
              v-model="memberForm.name"
              type="text"
              :placeholder="
                locale === 'pt'
                  ? 'O seu nome ou nickname'
                  : 'Your name or nickname'
              "
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium"
              >{{ t("join.form.email") }} *</label
            >
            <input
              v-model="memberForm.email"
              type="email"
              required
              :placeholder="t('join.form.emailPlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">
              {{ t("join.form.dateOfBirth") }}
              <span class="text-xs font-normal text-black/40"
                >({{ locale === "pt" ? "opcional" : "optional" }})</span
              >
            </label>
            <div class="flex items-center gap-1">
              <input
                v-model="memberBirthDay"
                type="text"
                inputmode="numeric"
                maxlength="2"
                placeholder="DD"
                class="field-box w-12 px-1 text-center tabular-nums"
              />
              <span class="text-gray-400">/</span>
              <input
                v-model="memberBirthMonth"
                type="text"
                inputmode="numeric"
                maxlength="2"
                placeholder="MM"
                class="field-box w-12 px-1 text-center tabular-nums"
              />
              <span class="text-gray-400">/</span>
              <input
                v-model="memberBirthYear"
                type="text"
                inputmode="numeric"
                maxlength="4"
                placeholder="AAAA"
                class="field-box w-16 px-1 text-center tabular-nums"
              />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">
              {{ t("join.form.citizenCard") }}
              <span class="text-xs font-normal text-black/40"
                >({{ locale === "pt" ? "opcional" : "optional" }})</span
              >
            </label>
            <input
              v-model="memberForm.citizenCardNumber"
              type="text"
              :placeholder="t('join.form.citizenCardPlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">
              {{ t("join.form.fiscalNumber") }}
              <span class="text-xs font-normal text-black/40"
                >({{ locale === "pt" ? "opcional" : "optional" }})</span
              >
            </label>
            <input
              v-model="memberForm.fiscalNumber"
              type="text"
              :placeholder="t('join.form.fiscalNumberPlaceholder')"
              class="field-box"
            />
          </div>
          <div class="flex flex-col gap-1">
            <label class="text-sm font-medium">
              {{ t("join.form.address") }}
              <span class="text-xs font-normal text-black/40"
                >({{ locale === "pt" ? "opcional" : "optional" }})</span
              >
            </label>
            <textarea
              v-model="memberForm.address"
              rows="3"
              :placeholder="t('join.form.addressPlaceholder')"
              class="field-box resize-none"
            ></textarea>
          </div>
          <UiButton
            size="lg"
            :loading="memberLoading"
            :disabled="!canSubmitMember || memberLoading"
            type="submit"
            class="mt-2 w-full"
          >
            {{ t("join.form.submit") }}
          </UiButton>
          <p v-if="memberError" role="alert" class="text-sm text-red-600">
            {{ memberError }}
          </p>
        </form>
      </div>
    </dialog>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n();
const route = useRoute();

const status = computed(() => {
  const value = route.query.status;
  return typeof value === "string" ? value : undefined;
});

// DONATIONS — one amount, one frequency, two payment methods.
const DONATION_PRESETS = [25, 50, 100, 250];
const DONATION_MODES = [
  { label: "join.oneTime", value: "payment" },
  { label: "join.recurringMonthly", value: "subscription_month" },
  { label: "join.recurringYearly", value: "subscription" },
] as const;
const ANONYMOUS_CEILING = 300;

useSeoMeta({
  description:
    locale.value === "pt"
      ? "Apoie a missão do Instituto Português de Bitcoin. Torne-se membro ou faça um donativo em Bitcoin ou cartão de crédito."
      : "Support the mission of the Portuguese Bitcoin Institute. Become a member or donate in Bitcoin or credit card.",
  ogDescription:
    locale.value === "pt"
      ? "Apoie a missão do Instituto Português de Bitcoin. Torne-se membro ou faça um donativo em Bitcoin ou cartão."
      : "Support the mission of the Portuguese Bitcoin Institute. Become a member or donate in Bitcoin or credit card.",
  ogTitle: locale.value === "pt" ? "Juntar-se ao IPB" : "Join the IPB",
  title: locale.value === "pt" ? "Juntar-se ao IPB" : "Join the IPB",
  twitterDescription:
    locale.value === "pt"
      ? "Apoie a missão do Instituto Português de Bitcoin. Torne-se membro ou faça um donativo em Bitcoin ou cartão."
      : "Support the mission of the Portuguese Bitcoin Institute. Become a member or donate in Bitcoin or credit card.",
  twitterTitle: locale.value === "pt" ? "Juntar-se ao IPB" : "Join the IPB",
});

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
