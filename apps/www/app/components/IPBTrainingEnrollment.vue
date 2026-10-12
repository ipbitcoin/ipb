<template>
  <div ref="root">
    <!-- Always mounted, so busy states and member checks are announced. -->
    <p role="status" class="sr-only">{{ announcement }}</p>

    <!-- Idle comes first: a Stripe redirect lands here with no form state. -->
    <template v-if="paymentState === 'idle'">
      <p v-if="unavailable" class="text-pretty text-neutral-600">
        {{ text.unavailable }}
      </p>

      <div v-else-if="!sessions.length" class="flex flex-col gap-5">
        <p class="text-pretty text-neutral-600">{{ text.empty }}</p>
        <div class="flex flex-wrap gap-3">
          <UiButton
            v-for="social in SOCIALS"
            :key="social.label"
            :href="social.href"
            target="_blank"
            variant="outline"
          >
            <component :is="social.icon" class="size-4" />
            {{ social.label }}
            <span class="sr-only">({{ $t("common.newTab") }})</span>
          </UiButton>
        </div>
      </div>

      <form
        v-else
        novalidate
        class="flex flex-col gap-10"
        @focusin.once="preloadStripe"
        @submit.prevent="handleSubmit"
      >
        <fieldset>
          <legend class="text-lg leading-snug font-medium tracking-[-0.01em]">
            {{ text.session }}
            <span aria-hidden="true" class="text-neutral-500">*</span>
          </legend>
          <div class="mt-4 grid gap-3">
            <label
              v-for="session in sessions"
              :key="session.documentId"
              :class="[
                'relative flex items-start gap-3.5 rounded-xl border p-4 transition-[border-color,box-shadow] duration-150 ease-out select-none [-webkit-tap-highlight-color:transparent] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand',
                tileClass(session),
              ]"
            >
              <input
                v-model="form.trainingDocumentId"
                type="radio"
                name="training-session"
                required
                :value="session.documentId"
                :disabled="session.stock_left === 0"
                v-bind="fieldAttrs('trainingDocumentId')"
                class="peer sr-only"
                @change="validateField('trainingDocumentId')"
              />
              <!-- Radio mark: the dot takes the ring's colour once checked. -->
              <span
                aria-hidden="true"
                class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border border-black/45 bg-white text-transparent transition-[background-color,border-color,color] duration-150 ease-out peer-checked:border-neutral-950 peer-checked:bg-neutral-950 peer-checked:text-white peer-disabled:border-black/20 peer-disabled:bg-transparent"
              >
                <span class="size-2 rounded-full bg-current" />
              </span>
              <span class="flex min-w-0 flex-col gap-1">
                <span class="leading-snug font-medium">
                  {{ formatDate(session.start_date) }}
                </span>
                <span
                  :class="[
                    'text-sm text-pretty',
                    session.stock_left > 0 && 'text-neutral-600',
                  ]"
                >
                  <span class="tabular-nums">{{ timeRange(session) }}</span>
                  <span aria-hidden="true"> · </span>
                  <a
                    v-if="session.location_url"
                    :href="session.location_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="link"
                    @click.stop
                  >
                    {{ session.location }}
                    <span class="sr-only">({{ $t("common.newTab") }})</span>
                  </a>
                  <template v-else>{{ session.location }}</template>
                </span>
                <span class="mt-1 flex items-center gap-2 text-sm">
                  <span
                    aria-hidden="true"
                    :class="[
                      'size-1.5 shrink-0 rounded-full',
                      session.stock_left > 0 ? 'bg-brand' : 'bg-neutral-400',
                    ]"
                  />
                  {{
                    session.stock_left > 0
                      ? text.spots(session.stock_left)
                      : text.soldOut
                  }}
                </span>
              </span>
            </label>
          </div>
          <p
            v-if="errors.trainingDocumentId"
            :id="errorId('trainingDocumentId')"
            class="mt-3 text-sm text-red-700"
          >
            {{ errors.trainingDocumentId }}
          </p>
        </fieldset>

        <div class="flex flex-col gap-5 border-t border-black/10 pt-8">
          <h3 class="text-lg leading-snug font-medium tracking-[-0.01em]">
            {{ text.personal }}
          </h3>

          <div class="flex flex-col gap-1.5">
            <label :for="fieldId('name')" class="text-sm font-medium">
              {{ text.name }}
              <span aria-hidden="true" class="text-neutral-500">*</span>
            </label>
            <input
              :id="fieldId('name')"
              v-model="form.name"
              type="text"
              required
              autocomplete="name"
              :placeholder="text.namePlaceholder"
              v-bind="fieldAttrs('name')"
              class="field-box"
              @blur="validateField('name')"
              @input="revalidate('name')"
            />
            <p
              v-if="errors.name"
              :id="errorId('name')"
              class="text-sm text-red-700"
            >
              {{ errors.name }}
            </p>
          </div>

          <div class="flex flex-col gap-1.5">
            <label :for="fieldId('email')" class="text-sm font-medium">
              {{ text.email }}
              <span aria-hidden="true" class="text-neutral-500">*</span>
            </label>
            <input
              :id="fieldId('email')"
              v-model="form.email"
              type="email"
              required
              autocomplete="email"
              spellcheck="false"
              :placeholder="text.emailPlaceholder"
              v-bind="fieldAttrs('email')"
              class="field-box"
              @blur="validateField('email')"
              @input="revalidate('email')"
            />
            <p
              v-if="errors.email"
              :id="errorId('email')"
              class="text-sm text-red-700"
            >
              {{ errors.email }}
            </p>

            <!-- Member discount, verified with a code sent by email. -->
            <div v-if="emailLooksValid" class="mt-1.5 flex flex-col gap-3">
              <p
                v-if="memberToken"
                class="flex items-start gap-2 text-sm font-medium text-green-700"
              >
                <IconCheck class="mt-0.5 size-4 shrink-0" />
                {{ memberStatus }}
              </p>
              <template v-else>
                <button
                  v-if="verifyStep === 'idle'"
                  type="button"
                  class="link w-fit cursor-pointer rounded-sm text-left text-sm text-pretty text-neutral-600 transition-[color] duration-150 ease-out hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-wait"
                  :disabled="verifyLoading"
                  @click="requestCode"
                >
                  {{ text.memberPrompt }}
                </button>
                <div
                  v-else
                  class="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4"
                >
                  <p
                    :id="fieldId('code-hint')"
                    class="text-sm text-pretty text-neutral-600"
                  >
                    {{ text.codeSent }}
                  </p>
                  <div class="flex flex-wrap gap-2">
                    <input
                      ref="codeInput"
                      v-model="verifyCode"
                      type="text"
                      inputmode="numeric"
                      maxlength="6"
                      autocomplete="one-time-code"
                      placeholder="000000"
                      :aria-label="text.code"
                      :aria-describedby="fieldId('code-hint')"
                      class="field-box h-11 w-36 text-center tracking-[0.3em] tabular-nums"
                      @keydown.enter.prevent="confirmCode"
                    />
                    <UiButton
                      type="button"
                      variant="outline"
                      size="lg"
                      :loading="verifyLoading"
                      :disabled="verifyCode.length !== 6 || verifyLoading"
                      @click="confirmCode"
                    >
                      {{ text.verify }}
                    </UiButton>
                  </div>
                </div>
                <p v-if="verifyError" role="alert" class="text-sm text-red-700">
                  {{ verifyError }}
                </p>
              </template>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label :for="fieldId('phone')" class="text-sm font-medium">
              {{ text.phone }}
              <span class="font-normal text-neutral-500">
                ({{ text.optional }})
              </span>
            </label>
            <input
              :id="fieldId('phone')"
              v-model="form.phone"
              type="tel"
              autocomplete="tel"
              :placeholder="text.phonePlaceholder"
              class="field-box"
            />
          </div>

          <!-- Validated once focus leaves the group, not between its boxes. -->
          <fieldset @focusout="onBirthdayFocusOut">
            <legend class="text-sm font-medium">
              {{ text.birthday }}
              <span aria-hidden="true" class="text-neutral-500">*</span>
            </legend>
            <div class="mt-1.5 flex items-center gap-2">
              <input
                v-model="birthDay"
                type="text"
                inputmode="numeric"
                maxlength="2"
                required
                autocomplete="bday-day"
                placeholder="DD"
                :aria-label="text.day"
                v-bind="fieldAttrs('birthday')"
                class="field-box w-14 px-2 text-center tabular-nums"
              />
              <span aria-hidden="true" class="text-neutral-400">/</span>
              <input
                v-model="birthMonth"
                type="text"
                inputmode="numeric"
                maxlength="2"
                required
                autocomplete="bday-month"
                placeholder="MM"
                :aria-label="text.month"
                v-bind="fieldAttrs('birthday')"
                class="field-box w-14 px-2 text-center tabular-nums"
              />
              <span aria-hidden="true" class="text-neutral-400">/</span>
              <input
                v-model="birthYear"
                type="text"
                inputmode="numeric"
                maxlength="4"
                required
                autocomplete="bday-year"
                :placeholder="text.yearPlaceholder"
                :aria-label="text.year"
                v-bind="fieldAttrs('birthday')"
                class="field-box w-20 px-2 text-center tabular-nums"
              />
            </div>
            <p
              v-if="errors.birthday"
              :id="errorId('birthday')"
              class="mt-1.5 text-sm text-red-700"
            >
              {{ errors.birthday }}
            </p>
          </fieldset>

          <div class="flex flex-col gap-1.5">
            <label :for="fieldId('nif')" class="text-sm font-medium">
              NIF
              <span class="font-normal text-neutral-500">
                ({{ text.nifHint }})
              </span>
            </label>
            <input
              :id="fieldId('nif')"
              v-model="form.nif"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="123456789"
              v-bind="fieldAttrs('nif')"
              class="field-box"
              @blur="validateField('nif')"
              @input="revalidate('nif')"
            />
            <p
              v-if="errors.nif"
              :id="errorId('nif')"
              class="text-sm text-red-700"
            >
              {{ errors.nif }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-5 border-t border-black/10 pt-8">
          <div class="flex flex-col gap-1">
            <h3 class="text-lg leading-snug font-medium tracking-[-0.01em]">
              {{ text.profile }}
              <span class="text-base font-normal text-neutral-500">
                ({{ text.optional }})
              </span>
            </h3>
            <p class="text-sm text-pretty text-neutral-600">
              {{ text.profileHint }}
            </p>
          </div>

          <div class="divide-y divide-black/10 border-y border-black/10">
            <UiYesNoField
              v-for="question in QUESTIONS"
              :key="question"
              v-model="form[question]"
              :label="text.questions[question]"
              :yes-label="text.yes"
              :no-label="text.no"
              class="py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label :for="fieldId('expectations')" class="text-sm font-medium">
              {{ text.expectations }}
              <span class="font-normal text-neutral-500">
                ({{ text.optional }})
              </span>
            </label>
            <textarea
              :id="fieldId('expectations')"
              v-model="form.expectations"
              :maxlength="MAX_EXPECTATIONS"
              rows="4"
              :placeholder="text.expectationsPlaceholder"
              v-bind="fieldAttrs('expectations')"
              class="field-box resize-none"
              @input="validateField('expectations')"
            />
            <div class="flex justify-between gap-4 text-sm">
              <p
                v-if="errors.expectations"
                :id="errorId('expectations')"
                class="text-red-700"
              >
                {{ errors.expectations }}
              </p>
              <p class="ml-auto text-neutral-500 tabular-nums">
                {{ form.expectations.length }}/{{ MAX_EXPECTATIONS }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-5 border-t border-black/10 pt-8">
          <div class="flex items-end justify-between gap-4">
            <p class="text-sm font-medium">
              {{ text.total }}
              <span class="block font-normal text-neutral-500">
                {{ text.vatIncluded }}
              </span>
            </p>
            <p class="flex items-baseline gap-2 tabular-nums">
              <s v-if="discounted" class="text-neutral-500">
                <span class="sr-only">{{ text.originalPrice }}</span>
                {{ formatPrice(BASE_PRICE_EUR) }}
              </s>
              <span
                class="text-3xl leading-none font-medium tracking-[-0.03em]"
              >
                {{ formatPrice(priceEur) }}
              </span>
            </p>
          </div>
          <UiButton type="submit" size="lg" arrow class="w-full">
            {{ text.submit }}
          </UiButton>
          <p class="text-center text-sm text-pretty text-neutral-500">
            {{ text.paymentHint }}
          </p>
        </div>
      </form>
    </template>

    <div
      v-else-if="paymentState === 'submitting' || paymentState === 'confirming'"
      class="flex flex-col items-center gap-4 py-16 text-center"
    >
      <span
        aria-hidden="true"
        class="size-8 animate-spin rounded-full border-2 border-black/15 border-t-neutral-950"
      />
      <p class="font-medium">
        {{ paymentState === "submitting" ? text.processing : text.confirming }}
      </p>
      <p
        v-if="paymentState === 'confirming'"
        class="max-w-sm text-sm text-pretty text-neutral-600"
      >
        {{ text.confirmingHint }}
      </p>
    </div>

    <div
      v-else-if="paymentState === 'awaiting_payment'"
      class="flex flex-col gap-8"
    >
      <div class="flex flex-col gap-2">
        <h3
          ref="stateHeading"
          tabindex="-1"
          class="text-xl leading-snug font-medium tracking-[-0.015em] outline-none"
        >
          {{ text.paymentTitle }}
        </h3>
        <p class="text-sm text-pretty text-neutral-600">
          {{ text.paymentMethods }}
        </p>
      </div>

      <!-- Stripe mounts the Payment Element here. -->
      <div id="stripe-payment-element" class="min-h-50" />

      <div class="flex flex-col gap-5 border-t border-black/10 pt-8">
        <div class="flex items-end justify-between gap-4">
          <p class="text-sm font-medium">
            {{ text.total }}
            <span class="block font-normal text-neutral-500">
              {{ text.vatIncluded }}
            </span>
          </p>
          <p class="flex items-baseline gap-2 tabular-nums">
            <s v-if="discounted" class="text-neutral-500">
              <span class="sr-only">{{ text.originalPrice }}</span>
              {{ formatPrice(BASE_PRICE_EUR) }}
            </s>
            <span class="text-3xl leading-none font-medium tracking-[-0.03em]">
              {{ formatPrice(priceEur) }}
            </span>
          </p>
        </div>
        <UiButton size="lg" arrow class="w-full" @click="handleConfirmPayment">
          {{ text.pay(formatPrice(priceEur)) }}
        </UiButton>
      </div>
    </div>

    <!-- Seen once, after paying: the confirmation can take a staged entrance. -->
    <div
      v-else-if="paymentState === 'success'"
      class="flex flex-col items-center gap-4 py-10 text-center"
    >
      <span
        class="enter grid size-14 place-items-center rounded-full bg-brand text-neutral-950 shadow-button-brand"
      >
        <IconCheck class="size-6" />
      </span>
      <h3
        ref="stateHeading"
        tabindex="-1"
        class="enter text-2xl leading-tight font-medium tracking-[-0.02em] text-balance outline-none"
        style="--enter-delay: 100ms"
      >
        {{ text.successTitle }}
      </h3>
      <p
        class="enter max-w-sm text-pretty text-neutral-600"
        style="--enter-delay: 200ms"
      >
        {{ text.successText }}
      </p>
    </div>

    <div
      v-else-if="paymentState === 'error'"
      class="flex flex-col items-center gap-4 py-10 text-center"
    >
      <span
        class="grid size-14 place-items-center rounded-full bg-red-50 text-red-700"
      >
        <IconClose class="size-6" />
      </span>
      <h3
        ref="stateHeading"
        tabindex="-1"
        :aria-describedby="fieldId('error-message')"
        class="text-2xl leading-tight font-medium tracking-[-0.02em] text-balance outline-none"
      >
        {{ text.errorTitle }}
      </h3>
      <p
        :id="fieldId('error-message')"
        class="max-w-sm text-pretty text-neutral-600"
      >
        {{ errorMessage }}
      </p>
      <UiButton variant="outline" size="lg" class="mt-2" @click="reset">
        {{ text.retry }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TrainingData } from "~/composables/useTrainingEnrollment";

defineProps<{
  /** Upcoming sessions, loaded by the page on the server. */
  sessions: TrainingData[];
  /** The sessions could not be loaded. */
  unavailable?: boolean;
}>();

const appLocale = useAppLocale();
const localePath = useLocalePath();

const {
  checkRedirectResult,
  confirmPayment,
  errorMessage,
  mountPaymentElement,
  paymentState,
  preloadStripe,
  reset,
  submitEnrollment,
} = useTrainingEnrollment();

const TEXT = {
  en: {
    birthday: "Date of birth",
    code: "Code",
    codeSent: "If this email belongs to a member, we sent a 6-digit code.",
    confirming: "Confirming payment…",
    confirmingHint:
      "If you chose MB WAY, confirm in the app. If you chose Multibanco, you will receive the payment reference.",
    day: "Day",
    email: "Email",
    emailPlaceholder: "Your email",
    empty: "No dates are currently available. Stay tuned on our social media.",
    errorTitle: "Something went wrong",
    errors: {
      birthday: "Please enter your date of birth.",
      birthdayInvalid: "Please enter a valid date.",
      birthdayMinAge: "You must be at least 16 years old.",
      email: "Invalid email.",
      expectations: "Maximum 500 characters.",
      name: "Please enter your full name.",
      nif: "NIF must have 9 digits.",
      session: "Please select a date.",
    },
    expectations: "What do you expect from this course?",
    expectationsPlaceholder: "Share your expectations…",
    memberDiscount: (layer?: number) =>
      `Member verified. Layer ${layer} discount applied.`,
    memberNoDiscount:
      "Member verified. This course has no discount for your layer.",
    memberPrompt: "Are you an IPB member? Verify your email to get a discount.",
    month: "Month",
    name: "Full name",
    namePlaceholder: "Your full name",
    nifHint: "optional — for invoicing",
    no: "No",
    optional: "optional",
    originalPrice: "Original price",
    pay: (price: string) => `Pay ${price}`,
    paymentHint:
      "After submitting, you can choose your payment method: Apple Pay, MB WAY, Multibanco or card.",
    paymentMethods:
      "You can pay with Apple Pay, MB WAY, Multibanco (reference) or credit/debit card.",
    paymentTitle: "Choose your payment method",
    personal: "Personal details",
    phone: "Mobile",
    phonePlaceholder: "E.g. +44 7911 123456",
    processing: "Processing…",
    profile: "Profile",
    profileHint: "These questions help us tailor the course to your profile.",
    questions: {
      bought_bitcoin: "Have you ever bought Bitcoin?",
      has_exposure: "Do you have exposure to Bitcoin?",
      has_self_custody: "Do you have Bitcoin in self-custody?",
      participated_workshop: "Have you ever attended a Bitcoin workshop?",
    },
    retry: "Try again",
    session: "Select date",
    soldOut: "Sold out",
    spots: (count: number) =>
      count === 1 ? "1 spot available" : `${count} spots available`,
    submit: "Register and pay",
    successText:
      "Payment received. You will receive an email with the invoice and all training details.",
    successTitle: "Registration confirmed!",
    total: "Total",
    unavailable: "Unable to load dates. Please try again later.",
    vatIncluded: "VAT included",
    verify: "Verify",
    verifyConfirmError: "Invalid or expired code.",
    verifyRequestError: "Could not send the code. Please try again.",
    year: "Year",
    yearPlaceholder: "YYYY",
    yes: "Yes",
  },
  pt: {
    birthday: "Data de nascimento",
    code: "Código",
    codeSent:
      "Se este email for de um membro, enviámos um código de 6 dígitos.",
    confirming: "A confirmar pagamento…",
    confirmingHint:
      "Se escolheu MB WAY, confirme na app. Se escolheu Multibanco, receberá a referência para pagamento.",
    day: "Dia",
    email: "Email",
    emailPlaceholder: "O seu email",
    empty:
      "Não existem datas disponíveis de momento. Fique atento às nossas redes sociais.",
    errorTitle: "Ocorreu um problema",
    errors: {
      birthday: "Por favor introduza a sua data de nascimento.",
      birthdayInvalid: "Por favor introduza uma data válida.",
      birthdayMinAge: "Deve ter pelo menos 16 anos.",
      email: "Email inválido.",
      expectations: "Máximo 500 caracteres.",
      name: "Por favor introduza o seu nome completo.",
      nif: "NIF deve ter 9 dígitos.",
      session: "Por favor selecione uma data.",
    },
    expectations: "O que espera deste curso?",
    expectationsPlaceholder: "Partilhe as suas expectativas…",
    memberDiscount: (layer?: number) =>
      `Membro verificado. Desconto da Camada ${layer} aplicado.`,
    memberNoDiscount:
      "Membro verificado. Esta formação não tem desconto para a sua camada.",
    memberPrompt: "É membro do IPB? Verifique o seu email para obter desconto.",
    month: "Mês",
    name: "Nome completo",
    namePlaceholder: "O seu nome completo",
    nifHint: "opcional — para faturação",
    no: "Não",
    optional: "opcional",
    originalPrice: "Preço original",
    pay: (price: string) => `Pagar ${price}`,
    paymentHint:
      "Após submeter, poderá escolher o método de pagamento: Apple Pay, MB WAY, Multibanco ou cartão.",
    paymentMethods:
      "Pode pagar com Apple Pay, MB WAY, Multibanco (referência) ou cartão de crédito/débito.",
    paymentTitle: "Escolha o método de pagamento",
    personal: "Dados pessoais",
    phone: "Telemóvel",
    phonePlaceholder: "Ex: +351 912 345 678",
    processing: "A processar…",
    profile: "Perfil",
    profileHint: "Estas perguntas ajudam-nos a adaptar o curso ao seu perfil.",
    questions: {
      bought_bitcoin: "Já alguma vez comprou Bitcoin?",
      has_exposure: "Tem exposição a Bitcoin?",
      has_self_custody: "Tem Bitcoin em auto-custódia?",
      participated_workshop:
        "Já alguma vez participou num workshop de Bitcoin?",
    },
    retry: "Tentar novamente",
    session: "Selecionar data",
    soldOut: "Esgotado",
    spots: (count: number) =>
      count === 1 ? "1 vaga disponível" : `${count} vagas disponíveis`,
    submit: "Inscrever e pagar",
    successText:
      "O pagamento foi recebido. Vai receber um email com a fatura e todos os detalhes da formação.",
    successTitle: "Inscrição confirmada!",
    total: "Total",
    unavailable: "Não foi possível carregar as datas. Tente mais tarde.",
    vatIncluded: "IVA incluído",
    verify: "Verificar",
    verifyConfirmError: "Código inválido ou expirado.",
    verifyRequestError: "Não foi possível enviar o código. Tente novamente.",
    year: "Ano",
    yearPlaceholder: "AAAA",
    yes: "Sim",
  },
};

const text = computed(() => TEXT[appLocale.value]);
const lang = computed(() => (appLocale.value === "pt" ? "pt-PT" : "en-GB"));

/** Optional profile questions, in the order they are asked. */
const QUESTIONS = [
  "participated_workshop",
  "has_exposure",
  "bought_bitcoin",
  "has_self_custody",
] as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_AGE = 16;
const MAX_EXPECTATIONS = 500;

// ── Form ────────────────────────────────────────────────────────────────────
const form = reactive({
  birthday: "",
  bought_bitcoin: null as boolean | null,
  email: "",
  expectations: "",
  has_exposure: null as boolean | null,
  has_self_custody: null as boolean | null,
  name: "",
  nif: "",
  participated_workshop: null as boolean | null,
  phone: "",
  trainingDocumentId: "",
});

const errors = reactive({
  birthday: "",
  email: "",
  expectations: "",
  name: "",
  nif: "",
  trainingDocumentId: "",
});

type Field = keyof typeof errors;

const uid = useId();
const fieldId = (name: string) => `${uid}-${name}`;
const errorId = (field: Field) => `${uid}-${field}-error`;

/** Ties a field to its error message while it has one. */
function fieldAttrs(field: Field) {
  return errors[field]
    ? { "aria-describedby": errorId(field), "aria-invalid": "true" as const }
    : {};
}

// Separate DD / MM / YYYY boxes, combined into the form's yyyy-mm-dd
const birthDay = ref("");
const birthMonth = ref("");
const birthYear = ref("");

// ── Validation ──────────────────────────────────────────────────────────────
const validators: Record<Field, () => string> = {
  birthday: () => {
    const messages = text.value.errors;
    if (!form.birthday) {
      return messages.birthday;
    }
    const year = Number(birthYear.value);
    const month = Number(birthMonth.value) - 1;
    const day = Number(birthDay.value);
    const born = new Date(Date.UTC(year, month, day));
    // Date rolls impossible days over (31/02 becomes 2/03), so compare back
    if (
      year < 1900 ||
      born.getUTCFullYear() !== year ||
      born.getUTCMonth() !== month ||
      born.getUTCDate() !== day
    ) {
      return messages.birthdayInvalid;
    }
    const latest = new Date();
    latest.setFullYear(latest.getFullYear() - MIN_AGE);
    return born > latest ? messages.birthdayMinAge : "";
  },
  email: () => (EMAIL_PATTERN.test(form.email) ? "" : text.value.errors.email),
  expectations: () =>
    form.expectations.length > MAX_EXPECTATIONS
      ? text.value.errors.expectations
      : "",
  name: () => (form.name.trim().length < 2 ? text.value.errors.name : ""),
  nif: () =>
    !form.nif || form.nif.replaceAll(/\D/g, "").length === 9
      ? ""
      : text.value.errors.nif,
  trainingDocumentId: () =>
    form.trainingDocumentId ? "" : text.value.errors.session,
};

function validateField(field: Field) {
  errors[field] = validators[field]();
}

/** Once a field shows an error, re-check it while the reader fixes it. */
function revalidate(field: Field) {
  if (errors[field]) {
    validateField(field);
  }
}

function validateAll(): boolean {
  for (const field of Object.keys(validators) as Field[]) {
    validateField(field);
  }
  return Object.values(errors).every((message) => !message);
}

watch([birthDay, birthMonth, birthYear], () => {
  const day = birthDay.value.padStart(2, "0");
  const month = birthMonth.value.padStart(2, "0");
  form.birthday =
    birthDay.value && birthMonth.value && birthYear.value.length === 4
      ? `${birthYear.value}-${month}-${day}`
      : "";
  revalidate("birthday");
});

function onBirthdayFocusOut(event: FocusEvent) {
  const group = event.currentTarget as HTMLElement;
  if (!group.contains(event.relatedTarget as Node | null)) {
    validateField("birthday");
  }
}

// ── Price (member discounts) ────────────────────────────────────────────────
// The server recomputes the price on enrollment; this is for display only.
const BASE_PRICE_EUR = 200;
const priceEur = ref(BASE_PRICE_EUR);
const memberLayer = ref<1 | 2 | undefined>();
const discounted = computed(
  () => memberLayer.value !== undefined && priceEur.value < BASE_PRICE_EUR
);

// ── Member verification (code sent by email) ───────────────────────────────
// The server only applies the discount with the token this check returns.
const verifyStep = ref<"idle" | "code">("idle");
const verifyCode = ref("");
const verifyLoading = ref(false);
const verifyError = ref("");
const memberToken = ref("");
const codeInput = useTemplateRef<HTMLInputElement>("codeInput");

const emailLooksValid = computed(() => EMAIL_PATTERN.test(form.email));
const memberStatus = computed(() =>
  priceEur.value < BASE_PRICE_EUR
    ? text.value.memberDiscount(memberLayer.value)
    : text.value.memberNoDiscount
);

function resetVerification() {
  verifyStep.value = "idle";
  verifyCode.value = "";
  verifyError.value = "";
  memberToken.value = "";
  priceEur.value = BASE_PRICE_EUR;
  memberLayer.value = undefined;
}

// A different email needs a new verification
watch(() => form.email, resetVerification);

async function requestCode() {
  verifyLoading.value = true;
  verifyError.value = "";
  try {
    const result = await $fetch<{ devCode?: string }>(
      "/api/member-verify/request",
      {
        body: { email: form.email.trim(), locale: appLocale.value },
        method: "POST",
      }
    );
    verifyStep.value = "code";
    if (result.devCode) {
      console.info("[dev] member verification code:", result.devCode);
    }
    // The link that had focus is gone; carry on in the code box
    await nextTick();
    codeInput.value?.focus();
  } catch {
    verifyError.value = text.value.verifyRequestError;
  } finally {
    verifyLoading.value = false;
  }
}

async function confirmCode() {
  if (verifyCode.value.length !== 6 || verifyLoading.value) {
    return;
  }
  verifyLoading.value = true;
  verifyError.value = "";
  try {
    const result = await $fetch<{
      memberLayer?: 1 | 2;
      priceEur: number;
      token: string;
    }>("/api/member-verify/confirm", {
      body: { code: verifyCode.value, email: form.email.trim() },
      method: "POST",
    });
    memberToken.value = result.token;
    priceEur.value = result.priceEur;
    memberLayer.value = result.memberLayer;
  } catch {
    verifyError.value = text.value.verifyConfirmError;
  } finally {
    verifyLoading.value = false;
  }
}

const announcement = computed(() => {
  if (paymentState.value === "submitting") {
    return text.value.processing;
  }
  if (paymentState.value === "confirming") {
    return text.value.confirming;
  }
  return paymentState.value === "idle" && memberToken.value
    ? memberStatus.value
    : "";
});

// ── Submit and pay ──────────────────────────────────────────────────────────
const root = useTemplateRef<HTMLElement>("root");
const stateHeading = useTemplateRef<HTMLElement>("stateHeading");

async function handleSubmit() {
  if (!validateAll()) {
    // Land on the first field to fix; its error is read out with it
    await nextTick();
    root.value
      ?.querySelector<HTMLElement>('[aria-invalid="true"]:not(:disabled)')
      ?.focus();
    return;
  }
  const price = await submitEnrollment({ ...form }, memberToken.value);
  // The payment step shows the amount the server will charge
  if (price) {
    priceEur.value = price.priceEur;
    memberLayer.value = price.memberLayer;
  }
}

async function handleConfirmPayment() {
  // Redirect-based methods (MB WAY, Multibanco) come back to this page
  const returnUrl = new URL(
    `${localePath("formacoes")}?status=success`,
    window.location.origin
  ).href;
  await confirmPayment(returnUrl);
}

/**
 * Each new state replaces the form, which can leave the reader scrolled past
 * it. Bring the state into view and move focus to its heading.
 */
function revealState() {
  const element = root.value;
  if (!element) {
    return;
  }
  // The padding reads like "96px", which Number() turns into NaN.
  const { scrollPaddingTop } = getComputedStyle(document.documentElement);
  // oxlint-disable-next-line unicorn/prefer-number-coercion
  const scrollPadding = Number.parseFloat(scrollPaddingTop) || 0;
  const { top } = element.getBoundingClientRect();
  if (top < scrollPadding || top > window.innerHeight) {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    element.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }
  stateHeading.value?.focus({ preventScroll: true });
}

watch(
  paymentState,
  async (state) => {
    revealState();
    if (state === "awaiting_payment") {
      await mountPaymentElement("stripe-payment-element", appLocale.value);
    }
  },
  { flush: "post" }
);

// Stripe sends MB WAY/Multibanco payments back here with the outcome
onMounted(checkRedirectResult);

// ── Formatting ──────────────────────────────────────────────────────────────
// Sessions run in Lisbon; a fixed zone also keeps server and client in step.
const TIME_ZONE = "Europe/Lisbon";

function formatDate(iso: string): string {
  const value = new Date(iso).toLocaleDateString(lang.value, {
    day: "numeric",
    month: "long",
    timeZone: TIME_ZONE,
    weekday: "long",
    year: "numeric",
  });
  // Portuguese weekdays are lowercase, and this one starts the line
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(lang.value, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

function timeRange(session: TrainingData): string {
  const start = formatTime(session.start_date);
  return session.end_date
    ? `${start} – ${formatTime(session.end_date)}`
    : start;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat(lang.value, {
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    style: "currency",
  }).format(value);
}

function tileClass(session: TrainingData): string {
  if (session.stock_left === 0) {
    return "cursor-not-allowed border-black/10 bg-neutral-50 text-neutral-500";
  }
  return form.trainingDocumentId === session.documentId
    ? "cursor-pointer border-neutral-950 bg-white shadow-[inset_0_0_0_1px_var(--color-neutral-950)]"
    : "cursor-pointer border-black/15 bg-white hover:border-black/30";
}
</script>
