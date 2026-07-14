<template>
  <div class="flex flex-col gap-8">
    <!-- ── SEM TRAININGS DISPONÍVEIS ─────────────────────────────────── -->
    <div v-if="!trainingsLoading && !trainingsError && trainings.length === 0">
      <p class="text-base italic text-black/60">
        {{
          locale === "pt"
            ? "Não existem datas disponíveis de momento. Fique atento às nossas redes sociais."
            : "No dates are currently available. Stay tuned on our social media."
        }}
      </p>
    </div>

    <!-- ── ERRO AO CARREGAR TRAININGS ─────────────────────────────────── -->
    <div v-else-if="trainingsError">
      <p class="text-sm text-black/60">
        {{
          locale === "pt"
            ? "Não foi possível carregar as datas. Tente mais tarde."
            : "Unable to load dates. Please try again later."
        }}
      </p>
    </div>

    <!-- ── LOADING ────────────────────────────────────────────────────── -->
    <div
      v-else-if="trainingsLoading"
      class="flex items-center gap-2 text-sm text-black/50"
    >
      <span
        class="animate-spin inline-block w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
      ></span>
      <span>{{
        locale === "pt" ? "A carregar datas..." : "Loading dates..."
      }}</span>
    </div>

    <!-- ── FORMULÁRIO (passo 1: dados pessoais) ──────────────────────── -->
    <form
      v-else-if="paymentState === 'idle'"
      class="flex flex-col gap-8"
      @submit.prevent="handleSubmit"
      novalidate
    >
      <!-- Seleção de training -->
      <div class="flex flex-col gap-3">
        <label class="text-sm uppercase font-medium tracking-wider">
          {{ locale === "pt" ? "Selecionar data" : "Select date" }}
          <span>*</span>
        </label>
        <div class="flex flex-col gap-2">
          <label
            v-for="training in trainings"
            :key="training.documentId"
            :class="[
              'flex items-start gap-3 border p-4 rounded-[3px] cursor-pointer transition-colors',
              form.trainingDocumentId === training.documentId
                ? 'border-black bg-black/5'
                : 'border-black/25 hover:border-black/50',
              training.stock_left === 0 ? 'opacity-40 cursor-not-allowed' : '',
            ]"
          >
            <input
              type="radio"
              :value="training.documentId"
              v-model="form.trainingDocumentId"
              :disabled="training.stock_left === 0"
              class="mt-1 accent-black"
            />
            <div class="flex flex-col gap-0.5">
              <span class="font-medium text-base">{{
                formatDate(training.start_date)
              }}</span>
              <span class="text-sm text-black/70">
                {{ formatTime(training.start_date)
                }}<template v-if="training.end_date">
                  – {{ formatTime(training.end_date) }}</template
                >
              </span>
              <a
                v-if="training.location_url"
                :href="training.location_url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-sm text-black/60 underline underline-offset-2 hover:text-black transition-colors"
                @click.stop
                >{{ training.location }}</a
              >
              <span v-else class="text-sm text-black/60">{{
                training.location
              }}</span>
              <span class="text-sm">
                <template v-if="training.stock_left === 0">
                  <span class="font-medium text-black/50">{{
                    locale === "pt" ? "Esgotado" : "Sold out"
                  }}</span>
                </template>
                <template v-else>
                  {{ training.stock_left }}
                  {{
                    locale === "pt"
                      ? "vaga(s) disponível(is)"
                      : "spot(s) available"
                  }}
                </template>
              </span>
            </div>
          </label>
        </div>
        <p v-if="errors.trainingDocumentId" class="text-sm text-red-600">
          {{ errors.trainingDocumentId }}
        </p>
      </div>

      <!-- ── DADOS PESSOAIS ─────────────────────────────────────────── -->
      <div class="flex flex-col gap-4">
        <span class="text-sm uppercase font-medium tracking-wider">
          {{ locale === "pt" ? "Dados pessoais" : "Personal details" }}
        </span>

        <!-- Nome -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            {{ locale === "pt" ? "Nome completo" : "Full name" }} <span>*</span>
          </label>
          <UiTextInput
            v-model="form.name"
            :placeholder="
              locale === 'pt' ? 'O seu nome completo' : 'Your full name'
            "
            class="w-full py-2"
            @blur="validateField('name')"
          />
          <p v-if="errors.name" class="text-sm text-red-600">
            {{ errors.name }}
          </p>
        </div>

        <!-- Email -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">Email <span>*</span></label>
          <UiTextInput
            v-model="form.email"
            type="email"
            :placeholder="locale === 'pt' ? 'O seu email' : 'Your email'"
            class="w-full py-2"
            @blur="validateField('email')"
          />
          <p v-if="errors.email" class="text-sm text-red-600">
            {{ errors.email }}
          </p>
        </div>

        <!-- Telefone -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            {{ locale === "pt" ? "Telemóvel" : "Mobile" }}
            <span class="text-xs font-normal text-black/50"
              >({{ locale === "pt" ? "opcional" : "optional" }})</span
            >
          </label>
          <UiTextInput
            v-model="form.phone"
            type="tel"
            :placeholder="
              locale === 'pt' ? 'Ex: +351 912 345 678' : 'E.g. +44 7911 123456'
            "
            class="w-full py-2"
          />
        </div>

        <!-- Data de nascimento -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            {{ locale === "pt" ? "Data de nascimento" : "Date of birth" }}
            <span>*</span>
          </label>
          <div class="flex items-center gap-2">
            <input
              v-model="birthDay"
              type="text"
              inputmode="numeric"
              maxlength="2"
              placeholder="DD"
              class="font-body placeholder:text-black/30 focus:outline-none text-black border-b px-1 py-2 bg-transparent w-10 text-center"
              @blur="validateField('birthday')"
            />
            <span class="text-black/30">/</span>
            <input
              v-model="birthMonth"
              type="text"
              inputmode="numeric"
              maxlength="2"
              placeholder="MM"
              class="font-body placeholder:text-black/30 focus:outline-none text-black border-b px-1 py-2 bg-transparent w-10 text-center"
              @blur="validateField('birthday')"
            />
            <span class="text-black/30">/</span>
            <input
              v-model="birthYear"
              type="text"
              inputmode="numeric"
              maxlength="4"
              :placeholder="locale === 'pt' ? 'AAAA' : 'YYYY'"
              class="font-body placeholder:text-black/30 focus:outline-none text-black border-b px-1 py-2 bg-transparent w-16 text-center"
              @blur="validateField('birthday')"
            />
          </div>
          <p v-if="errors.birthday" class="text-sm text-red-600">
            {{ errors.birthday }}
          </p>
        </div>

        <!-- NIF (opcional) -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            NIF
            <span class="text-xs font-normal text-black/50"
              >({{
                locale === "pt"
                  ? "opcional — para faturação"
                  : "optional — for invoicing"
              }})</span
            >
          </label>
          <UiTextInput
            v-model="form.nif"
            placeholder="123456789"
            class="w-full py-2"
            @blur="validateField('nif')"
          />
          <p v-if="errors.nif" class="text-sm text-red-600">{{ errors.nif }}</p>
        </div>
      </div>

      <!-- ── PERGUNTAS OPCIONAIS ─────────────────────────────────────── -->
      <div class="flex flex-col gap-5">
        <span class="text-sm uppercase font-medium tracking-wider">
          {{ locale === "pt" ? "Perfil (opcional)" : "Profile (optional)" }}
        </span>
        <p class="text-sm text-black/60 -mt-2">
          {{
            locale === "pt"
              ? "Estas perguntas ajudam-nos a adaptar o curso ao seu perfil."
              : "These questions help us tailor the course to your profile."
          }}
        </p>

        <!-- Pergunta 1 -->
        <UiYesNoField
          :yes-label="locale === 'pt' ? 'Sim' : 'Yes'"
          :no-label="locale === 'pt' ? 'Não' : 'No'"
          v-model="form.participated_workshop"
          :label="
            locale === 'pt'
              ? 'Já alguma vez participou num workshop de Bitcoin?'
              : 'Have you ever attended a Bitcoin workshop?'
          "
        />

        <!-- Pergunta 2 -->
        <UiYesNoField
          :yes-label="locale === 'pt' ? 'Sim' : 'Yes'"
          :no-label="locale === 'pt' ? 'Não' : 'No'"
          v-model="form.has_exposure"
          :label="
            locale === 'pt'
              ? 'Tem exposição a Bitcoin?'
              : 'Do you have exposure to Bitcoin?'
          "
        />

        <!-- Pergunta 3 -->
        <UiYesNoField
          :yes-label="locale === 'pt' ? 'Sim' : 'Yes'"
          :no-label="locale === 'pt' ? 'Não' : 'No'"
          v-model="form.bought_bitcoin"
          :label="
            locale === 'pt'
              ? 'Já alguma vez comprou Bitcoin?'
              : 'Have you ever bought Bitcoin?'
          "
        />

        <!-- Pergunta 4 -->
        <UiYesNoField
          :yes-label="locale === 'pt' ? 'Sim' : 'Yes'"
          :no-label="locale === 'pt' ? 'Não' : 'No'"
          v-model="form.has_self_custody"
          :label="
            locale === 'pt'
              ? 'Tem Bitcoin em auto-custódia?'
              : 'Do you have Bitcoin in self-custody?'
          "
        />

        <!-- Expectativas -->
        <div class="flex flex-col gap-1">
          <label class="text-sm font-medium">
            {{
              locale === "pt"
                ? "O que espera deste curso?"
                : "What do you expect from this course?"
            }}
            <span class="text-xs font-normal text-black/50"
              >({{ locale === "pt" ? "opcional" : "optional" }})</span
            >
          </label>
          <textarea
            v-model="form.expectations"
            :maxlength="500"
            rows="4"
            :placeholder="
              locale === 'pt'
                ? 'Partilhe as suas expectativas...'
                : 'Share your expectations...'
            "
            class="font-body text-base placeholder:text-black/45 focus:outline-none text-black border border-black/25 rounded-[3px] px-3 py-2 resize-none focus:border-black transition-colors w-full"
            @input="validateField('expectations')"
          ></textarea>
          <div class="flex justify-between">
            <p v-if="errors.expectations" class="text-sm text-red-600">
              {{ errors.expectations }}
            </p>
            <p class="text-xs text-black/40 ml-auto">
              {{ form.expectations.length }}/500
            </p>
          </div>
        </div>
      </div>

      <!-- ── PREÇO E SUBMIT ──────────────────────────────────────────── -->
      <div class="flex flex-col gap-4 border-t pt-6">
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">{{
            locale === "pt" ? "Total (IVA incluído)" : "Total (VAT included)"
          }}</span>
          <span class="text-2xl font-bold">200 €</span>
        </div>
        <UiButton type="submit" size="lg" class="w-full sm:w-auto">
          {{ locale === "pt" ? "Inscrever e pagar" : "Register and pay" }}
        </UiButton>
        <p class="text-xs text-black/50">
          {{
            locale === "pt"
              ? "Após submeter, poderá escolher o método de pagamento: Apple Pay, MB WAY, Multibanco ou cartão."
              : "After submitting, you can choose your payment method: Apple Pay, MB WAY, Multibanco or card."
          }}
        </p>
      </div>
    </form>

    <!-- ── A SUBMETER ────────────────────────────────────────────────── -->
    <div
      v-else-if="paymentState === 'submitting'"
      class="flex flex-col gap-4 py-8 items-center text-center"
    >
      <span
        class="animate-spin inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full"
      ></span>
      <p class="text-base font-medium">
        {{ locale === "pt" ? "A processar..." : "Processing..." }}
      </p>
    </div>

    <!-- ── PAGAMENTO (passo 2: Stripe Payment Element) ───────────────── -->
    <div
      v-else-if="paymentState === 'awaiting_payment'"
      class="flex flex-col gap-6 py-4"
    >
      <div class="flex flex-col gap-3">
        <h3 class="text-xl font-semibold">
          {{
            locale === "pt"
              ? "Escolha o método de pagamento"
              : "Choose your payment method"
          }}
        </h3>
        <p class="text-sm text-black/60">
          {{
            locale === "pt"
              ? "Pode pagar com Apple Pay, MB WAY, Multibanco (referência) ou cartão de crédito/débito."
              : "You can pay with Apple Pay, MB WAY, Multibanco (reference) or credit/debit card."
          }}
        </p>
      </div>

      <!-- Container onde o Stripe Payment Element é montado -->
      <div id="stripe-payment-element" class="min-h-[200px]"></div>

      <div class="flex flex-col gap-4 border-t pt-6">
        <div class="flex items-center justify-between">
          <span class="text-base font-medium">{{
            locale === "pt" ? "Total" : "Total"
          }}</span>
          <span class="text-2xl font-bold">200 €</span>
        </div>
        <UiButton
          size="lg"
          class="w-full sm:w-auto"
          :disabled="paymentState !== 'awaiting_payment'"
          @click="handleConfirmPayment"
        >
          {{ locale === "pt" ? "Pagar 200 €" : "Pay €200" }}
        </UiButton>
      </div>
    </div>

    <!-- ── A CONFIRMAR PAGAMENTO ──────────────────────────────────────── -->
    <div
      v-else-if="paymentState === 'confirming'"
      class="flex flex-col gap-4 py-8 items-center text-center"
    >
      <span
        class="animate-spin inline-block w-8 h-8 border-2 border-black/20 border-t-black rounded-full"
      ></span>
      <p class="text-base font-medium">
        {{
          locale === "pt" ? "A confirmar pagamento..." : "Confirming payment..."
        }}
      </p>
      <p class="text-sm text-black/50">
        {{
          locale === "pt"
            ? "Se escolheu MB WAY, confirme na app. Se escolheu Multibanco, receberá a referência para pagamento."
            : "If you chose MB WAY, confirm in the app. If you chose Multibanco, you will receive the payment reference."
        }}
      </p>
    </div>

    <!-- ── SUCESSO ─────────────────────────────────────────────────────── -->
    <div
      v-else-if="paymentState === 'success'"
      class="flex flex-col gap-6 py-4"
    >
      <div class="flex flex-col gap-3 items-center text-center">
        <div
          class="w-16 h-16 rounded-full bg-black flex items-center justify-center"
        >
          <span class="text-2xl text-white font-bold">&#x2713;</span>
        </div>
        <h3 class="text-xl font-semibold">
          {{
            locale === "pt"
              ? "Inscrição confirmada!"
              : "Registration confirmed!"
          }}
        </h3>
        <p class="text-base text-black/70 max-w-sm">
          {{
            locale === "pt"
              ? "O pagamento foi recebido. Vai receber um email com a fatura e todos os detalhes da formação."
              : "Payment received. You will receive an email with the invoice and all training details."
          }}
        </p>
      </div>
    </div>

    <!-- ── ERRO ───────────────────────────────────────────────────────── -->
    <div v-else-if="paymentState === 'error'" class="flex flex-col gap-4 py-4">
      <h3 class="text-lg font-semibold">
        {{ locale === "pt" ? "Ocorreu um problema" : "Something went wrong" }}
      </h3>
      <p class="text-base text-black/70">{{ errorMessage }}</p>
      <UiButton
        variant="outline"
        size="lg"
        class="w-full sm:w-auto"
        @click="reset"
      >
        {{ locale === "pt" ? "Tentar novamente" : "Try again" }}
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const { locale } = useI18n();

const {
  paymentState,
  clientSecret,
  errorMessage,
  trainings,
  trainingsLoading,
  trainingsError,
  fetchTrainings,
  submitEnrollment,
  mountPaymentElement,
  confirmPayment,
  checkRedirectResult,
  reset,
} = useTrainingEnrollment();

// ── Formulário ──────────────────────────────────────────────────────────────
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
  phone: "",
  trainingDocumentId: "",
});

// Campos separados para DD / MM / AAAA
const birthDay = ref("");
const birthMonth = ref("");
const birthYear = ref("");

// Combina DD/MM/AAAA → yyyy-mm-dd no form
watch([birthDay, birthMonth, birthYear], () => {
  const d = String(birthDay.value).padStart(2, "0");
  const m = String(birthMonth.value).padStart(2, "0");
  const y = String(birthYear.value);
  if (birthDay.value && birthMonth.value && y.length === 4) {
    form.birthday = `${y}-${m}-${d}`;
  } else {
    form.birthday = "";
  }
});

// Quando o paymentState muda para awaiting_payment, montar o Payment Element
watch(
  () => paymentState.value,
  async (newState) => {
    if (newState === "awaiting_payment") {
      // Aguardar que o DOM atualize antes de montar o elemento
      await nextTick();
      await mountPaymentElement("stripe-payment-element", locale.value);
    }
  }
);

// ── Validação ───────────────────────────────────────────────────────────────
function validateField(field: keyof typeof errors) {
  const isPt = locale.value === "pt";

  if (field === "name") {
    errors.name =
      form.name.trim().length < 2
        ? isPt
          ? "Por favor introduza o seu nome completo."
          : "Please enter your full name."
        : "";
  }
  if (field === "email") {
    errors.email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
      ? ""
      : isPt
        ? "Email inválido."
        : "Invalid email.";
  }
  if (field === "phone") {
    errors.phone = "";
  }
  if (field === "birthday") {
    if (form.birthday) {
      const born = new Date(form.birthday);
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 16);
      errors.birthday =
        born > minAge
          ? isPt
            ? "Deve ter pelo menos 16 anos."
            : "You must be at least 16 years old."
          : "";
    } else {
      errors.birthday = isPt
        ? "Por favor introduza a sua data de nascimento."
        : "Please enter your date of birth.";
    }
  }
  if (field === "nif" && form.nif) {
    errors.nif =
      form.nif.replaceAll(/\D/g, "").length === 9
        ? ""
        : isPt
          ? "NIF deve ter 9 dígitos."
          : "NIF must have 9 digits.";
  } else if (field === "nif") {
    errors.nif = "";
  }
  if (field === "trainingDocumentId") {
    errors.trainingDocumentId = form.trainingDocumentId
      ? ""
      : isPt
        ? "Por favor selecione uma data."
        : "Please select a date.";
  }
  if (field === "expectations") {
    errors.expectations =
      form.expectations.length > 500
        ? isPt
          ? "Máximo 500 caracteres."
          : "Maximum 500 characters."
        : "";
  }
}

function validateAll(): boolean {
  (
    [
      "name",
      "email",
      "phone",
      "birthday",
      "nif",
      "trainingDocumentId",
      "expectations",
    ] as const
  ).forEach(validateField);
  return Object.values(errors).every((e) => !e);
}

async function handleSubmit() {
  if (!validateAll()) {
    return;
  }
  await submitEnrollment({ ...form });
}

async function handleConfirmPayment() {
  const baseUrl = window.location.origin;
  const successUrl = `${baseUrl}/${locale.value === "pt" ? "formacoes" : "en/training"}?status=success`;
  await confirmPayment(successUrl);
}

// ── Formatação de data ──────────────────────────────────────────────────────
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(
    locale.value === "pt" ? "pt-PT" : "en-GB",
    {
      day: "numeric",
      month: "long",
      weekday: "long",
      year: "numeric",
    }
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(
    locale.value === "pt" ? "pt-PT" : "en-GB",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

onMounted(async () => {
  // Verificar se é um redirect do Stripe (após MBWay/Multibanco)
  await checkRedirectResult();
  // Só buscar trainings se não estiver a mostrar resultado de pagamento
  if (paymentState.value === "idle") {
    fetchTrainings();
  }
});
</script>
