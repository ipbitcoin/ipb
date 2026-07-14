<template>
  <div>
    <main>
      <div class="max-w-screen-xl mx-auto flex flex-col mb-12 mt-20 gap-4 px-8">
        <h1 class="text-6xl sm:text-7xl font-light max-w-3xl">
          {{ $t("nav.join") }}
        </h1>
        <div
          v-if="status === 'success'"
          class="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded"
        >
          {{ t("join.successDonation") }}
        </div>
        <div
          v-if="status === 'member-success'"
          class="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded"
        >
          {{ t("join.successMember") }}
        </div>
        <div
          v-if="status === 'cancel' || status === 'member-cancel'"
          class="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded"
        >
          {{ t("join.cancelled") }}
        </div>
        <div
          class="grid grid-cols-1 lg:grid-cols-[1fr_540px] gap-12 items-start"
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
            <p>{{ t("join.orgInfo") }}</p>
            <p class="mt-2">{{ t("join.supportImpact") }}</p>
            <p class="hidden lg:block mt-8 text-xs text-black/50">
              {{ t("join.disclaimer") }}
            </p>
          </div>
          <div
            class="flex flex-col gap-0 lg:sticky lg:top-8 border-t-2 border-black pt-6"
          >
            <div class="flex gap-0 mb-6">
              <button
                @click="activeTab = 'member'"
                :class="[
                  'cursor-pointer flex-1 py-2.5 text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors',
                  activeTab === 'member'
                    ? 'border-black text-black'
                    : 'border-transparent text-black/40 hover:text-black/70',
                ]"
              >
                {{ t("join.memberTitle") }}
              </button>
              <button
                @click="activeTab = 'donations'"
                :class="[
                  'cursor-pointer flex-1 py-2.5 text-sm font-semibold uppercase tracking-wide border-b-2 transition-colors',
                  activeTab === 'donations'
                    ? 'border-black text-black'
                    : 'border-transparent text-black/40 hover:text-black/70',
                ]"
              >
                {{ t("join.donationsTitle") }}
              </button>
            </div>
            <div v-show="activeTab === 'member'">
              <p class="mb-4 text-base">{{ t("join.memberDescription") }}</p>
              <div
                class="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-6"
              >
                <h3 class="text-lg font-bold mb-3">
                  {{ t("join.memberBenefitsTitle") }}
                </h3>
                <ul class="flex flex-col gap-2">
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>{{ t("join.benefits.earlyAccess") }}</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>{{ t("join.benefits.trainingDiscount") }}</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>{{ t("join.benefits.memberCard") }}</p>
                  </li>
                  <li class="flex items-baseline gap-2">
                    <div class="bg-black rounded-full min-h-2 min-w-2"></div>
                    <p>{{ t("join.benefits.exclusiveNetwork") }}</p>
                  </li>
                </ul>
              </div>
              <div class="mt-6 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-bold mb-4">
                  {{ t("join.memberFormTitle") }}
                </h3>
                <form
                  @submit.prevent="handleMemberSubmit"
                  class="flex flex-col gap-4"
                >
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
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
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
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
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
                        class="px-1 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black w-12 text-center"
                      />
                      <span class="text-gray-400">/</span>
                      <input
                        v-model="memberBirthMonth"
                        type="text"
                        inputmode="numeric"
                        maxlength="2"
                        placeholder="MM"
                        class="px-1 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black w-12 text-center"
                      />
                      <span class="text-gray-400">/</span>
                      <input
                        v-model="memberBirthYear"
                        type="text"
                        inputmode="numeric"
                        maxlength="4"
                        placeholder="AAAA"
                        class="px-1 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black w-16 text-center"
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
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
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
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
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
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black resize-none"
                    ></textarea>
                  </div>
                  <div class="flex flex-col gap-2">
                    <label class="text-sm font-medium"
                      >{{ t("join.form.paymentPlan") }} *</label
                    >
                    <div class="flex gap-4">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          v-model="memberForm.paymentPlan"
                          value="annual"
                          class="accent-black"
                        />
                        <span class="text-sm">{{ t("join.form.annual") }}</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          v-model="memberForm.paymentPlan"
                          value="monthly"
                          class="accent-black"
                        />
                        <span class="text-sm">{{
                          t("join.form.monthly")
                        }}</span>
                      </label>
                    </div>
                  </div>
                  <UiButton
                    size="lg"
                    :loading="memberLoading"
                    :disabled="!canSubmitMember || memberLoading"
                    type="submit"
                    class="mt-2 w-fit"
                  >
                    {{ t("join.form.submit") }}
                  </UiButton>
                  <p v-if="memberError" class="text-red-600 text-sm">
                    {{ memberError }}
                  </p>
                </form>
              </div>
            </div>
            <div v-show="activeTab === 'donations'">
              <p class="mb-4 text-base">{{ t("join.donationsDescription") }}</p>
              <div class="flex gap-4 mt-4">
                <button
                  @click="donationType = 'anonymous'"
                  :class="[
                    'px-5 py-2 rounded-[3px] border text-sm font-semibold cursor-pointer transition-colors duration-200',
                    donationType === 'anonymous'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100',
                  ]"
                >
                  {{ t("join.anonymous") }}
                </button>
                <button
                  @click="donationType = 'identified'"
                  :class="[
                    'px-5 py-2 rounded-[3px] border text-sm font-semibold cursor-pointer transition-colors duration-200',
                    donationType === 'identified'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-gray-300 hover:bg-gray-100',
                  ]"
                >
                  {{ t("join.identified") }}
                </button>
              </div>
              <p
                v-if="donationType === 'anonymous'"
                class="mt-4 mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded"
              >
                {{ t("join.anonymousNotice") }}
              </p>
              <div class="mt-4 border border-gray-200 rounded-lg p-6">
                <h3 class="text-lg font-bold mb-4">
                  {{ t("join.fiatCardTitle") }}
                </h3>
                <div class="flex flex-col gap-3">
                  <label class="text-sm font-medium">{{
                    t("join.amountEur")
                  }}</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="preset in fiatPresetsForType"
                      :key="preset"
                      @click="
                        fiatAmount = preset;
                        fiatCustom = '';
                      "
                      :class="[
                        'px-4 py-2 rounded-[3px] border text-sm font-semibold cursor-pointer transition-colors duration-200',
                        fiatAmount === preset && !fiatCustom
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300 hover:bg-gray-100',
                      ]"
                    >
                      €{{ preset }}
                    </button>
                    <input
                      v-model="fiatCustom"
                      type="number"
                      min="1"
                      :max="donationType === 'anonymous' ? 300 : undefined"
                      :placeholder="t('join.other')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm w-24 focus:outline-none focus:border-black"
                      @input="fiatAmount = 0"
                    />
                  </div>
                  <p
                    v-if="
                      (donationType === 'anonymous' ||
                        fiatMode === 'subscription_month') &&
                      effectiveFiatAmount > 300
                    "
                    class="text-red-600 text-sm"
                  >
                    {{ t("join.ceilingWarning") }}
                  </p>
                  <div class="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                    <label class="flex items-center gap-2 cursor-pointer"
                      ><input
                        type="radio"
                        v-model="fiatMode"
                        value="payment"
                        class="accent-black"
                      /><span class="text-sm">{{
                        t("join.oneTime")
                      }}</span></label
                    >
                    <label class="flex items-center gap-2 cursor-pointer"
                      ><input
                        type="radio"
                        v-model="fiatMode"
                        value="subscription_month"
                        class="accent-black"
                      /><span class="text-sm">{{
                        t("join.recurringMonthly")
                      }}</span></label
                    >
                    <label class="flex items-center gap-2 cursor-pointer"
                      ><input
                        type="radio"
                        v-model="fiatMode"
                        value="subscription"
                        class="accent-black"
                      /><span class="text-sm">{{
                        t("join.recurringYearly")
                      }}</span></label
                    >
                  </div>
                  <div
                    v-if="donationType === 'identified'"
                    class="flex flex-col gap-3 mt-3 border-t border-gray-100 pt-3"
                  >
                    <label class="text-sm font-medium">{{
                      t("join.donorName")
                    }}</label>
                    <input
                      v-model="donorName"
                      type="text"
                      :placeholder="t('join.donorNamePlaceholder')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                    <label class="text-sm font-medium">{{
                      t("join.donorEmail")
                    }}</label>
                    <input
                      v-model="donorEmail"
                      type="email"
                      :placeholder="t('join.donorEmailPlaceholder')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <UiButton
                    size="lg"
                    :loading="stripeLoading"
                    :disabled="!canSubmitFiat || stripeLoading"
                    @click="handleStripeCheckout"
                    class="mt-2 w-fit"
                    >{{ t("join.donateCard") }}</UiButton
                  >
                  <p v-if="stripeError" class="text-red-600 text-sm">
                    {{ stripeError }}
                  </p>
                </div>
              </div>
              <div class="border border-gray-200 rounded-lg p-6 mt-4">
                <h3 class="text-lg font-bold mb-4">{{ t("join.btcTitle") }}</h3>
                <div class="flex flex-col gap-3">
                  <label class="text-sm font-medium">{{
                    t("join.amountEur")
                  }}</label>
                  <div class="flex flex-wrap gap-2">
                    <button
                      v-for="preset in btcPresetsForType"
                      :key="preset"
                      @click="
                        btcAmount = preset;
                        btcCustom = '';
                      "
                      :class="[
                        'px-4 py-2 rounded-[3px] border text-sm font-semibold cursor-pointer transition-colors duration-200',
                        btcAmount === preset && !btcCustom
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-300 hover:bg-gray-100',
                      ]"
                    >
                      €{{ preset }}
                    </button>
                    <input
                      v-model="btcCustom"
                      type="number"
                      min="1"
                      :max="donationType === 'anonymous' ? 300 : undefined"
                      :placeholder="t('join.other')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm w-24 focus:outline-none focus:border-black"
                      @input="btcAmount = 0"
                    />
                  </div>
                  <p
                    v-if="
                      donationType === 'anonymous' && effectiveBtcAmount > 300
                    "
                    class="text-red-600 text-sm"
                  >
                    {{ t("join.ceilingWarning") }}
                  </p>
                  <div
                    v-if="donationType === 'identified'"
                    class="flex flex-col gap-3 mt-3 border-t border-gray-100 pt-3"
                  >
                    <label class="text-sm font-medium">{{
                      t("join.donorName")
                    }}</label>
                    <input
                      v-model="btcDonorName"
                      type="text"
                      :placeholder="t('join.donorNamePlaceholder')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                    <label class="text-sm font-medium">{{
                      t("join.donorEmail")
                    }}</label>
                    <input
                      v-model="btcDonorEmail"
                      type="email"
                      :placeholder="t('join.donorEmailPlaceholder')"
                      class="px-4 py-2 rounded-[3px] border border-gray-300 text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                  <UiButton
                    size="lg"
                    :loading="opennodeLoading"
                    :disabled="!canSubmitBtc || opennodeLoading"
                    @click="handleOpennodeCheckout"
                    class="mt-2 w-fit"
                    >{{ t("join.donateBtc") }}</UiButton
                  >
                  <p v-if="opennodeError" class="text-red-600 text-sm">
                    {{ opennodeError }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <p class="lg:hidden mt-4 text-xs text-black/50">
          {{ t("join.disclaimer") }}
        </p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const { locale, t } = useI18n();
const route = useRoute();

const status = computed(() => {
  const value = route.query.status;
  return typeof value === "string" ? value : undefined;
});

const activeTab = ref<"member" | "donations">("member");

const donationType = ref<"anonymous" | "identified">("anonymous");

const fiatPresetsAnonymous = [25, 50, 100, 200];
const fiatPresetsIdentified = [25, 50, 100, 250, 500];
const fiatPresetsForType = computed(() =>
  donationType.value === "anonymous"
    ? fiatPresetsAnonymous
    : fiatPresetsIdentified
);

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

const fiatAmount = ref(50);
const fiatCustom = ref("");
const fiatMode = ref<"payment" | "subscription" | "subscription_month">(
  "payment"
);
const stripeLoading = ref(false);
const stripeError = ref("");
const donorName = ref("");
const donorEmail = ref("");

const effectiveFiatAmount = computed(() => {
  if (fiatCustom.value) {
    return Number(fiatCustom.value);
  }
  return fiatAmount.value;
});

const canSubmitFiat = computed(() => {
  const amount = effectiveFiatAmount.value;
  if (!amount || amount < 1) {
    return false;
  }
  if (donationType.value === "anonymous" && amount > 300) {
    return false;
  }
  if (fiatMode.value === "subscription_month" && amount > 300) {
    return false;
  }
  return true;
});

async function handleStripeCheckout() {
  stripeLoading.value = true;
  stripeError.value = "";
  try {
    const { url } = await $fetch<{ url: string }>("/api/stripe-checkout", {
      body: {
        amount: effectiveFiatAmount.value,
        currency: "eur",
        locale: locale.value,
        mode: fiatMode.value,
        ...(donationType.value === "identified" && {
          donorName: donorName.value,
          donorEmail: donorEmail.value,
        }),
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

// BITCOIN (OpenNode) DONATIONS
const btcPresetsAnonymous = [10, 25, 50, 100];
const btcPresetsIdentified = [10, 25, 50, 100, 250];
const btcPresetsForType = computed(() =>
  donationType.value === "anonymous"
    ? btcPresetsAnonymous
    : btcPresetsIdentified
);

const btcAmount = ref(25);
const btcCustom = ref("");
const opennodeLoading = ref(false);
const opennodeError = ref("");
const btcDonorName = ref("");
const btcDonorEmail = ref("");

const effectiveBtcAmount = computed(() => {
  if (btcCustom.value) {
    return Number(btcCustom.value);
  }
  return btcAmount.value;
});

const canSubmitBtc = computed(() => {
  const amount = effectiveBtcAmount.value;
  if (!amount || amount < 1) {
    return false;
  }
  if (donationType.value === "anonymous" && amount > 300) {
    return false;
  }
  return true;
});

async function handleOpennodeCheckout() {
  opennodeLoading.value = true;
  opennodeError.value = "";
  try {
    const { url } = await $fetch<{ url: string }>("/api/opennode-checkout", {
      body: {
        amount: effectiveBtcAmount.value,
        currency: "EUR",
        locale: locale.value,
        ...(donationType.value === "identified" && {
          donorName: btcDonorName.value,
          donorEmail: btcDonorEmail.value,
        }),
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
