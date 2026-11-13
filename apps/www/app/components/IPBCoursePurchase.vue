<template>
  <div
    class="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-border sm:p-7"
  >
    <div class="flex items-end justify-between gap-4">
      <div class="flex flex-col gap-1">
        <p class="eyebrow">{{ copy.price }}</p>
        <p class="text-4xl font-normal tracking-[-0.03em]">
          {{ formatEur(priceCents, lang) }}
        </p>
      </div>
      <p
        v-if="memberLayer"
        class="font-mono text-xs text-neutral-500 line-through"
      >
        {{ formatEur(COURSE_PRICE_CENTS, lang) }}
      </p>
    </div>

    <p v-if="owned" class="rounded-lg bg-neutral-50 p-3 text-sm" role="status">
      {{ copy.already }}
      <NuxtLink
        :to="localePath('curso-online-entrar')"
        class="link font-medium"
      >
        {{ copy.alreadySignIn }}
      </NuxtLink>
    </p>

    <form class="flex flex-col gap-4" novalidate @submit.prevent="buy">
      <div class="flex flex-col gap-1.5">
        <label for="course-email" class="text-sm font-medium">{{
          copy.email
        }}</label>
        <input
          id="course-email"
          v-model="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          class="field-box"
          :aria-invalid="Boolean(error) && !emailValid"
        />
        <p class="text-xs text-neutral-500">{{ copy.emailHint }}</p>
      </div>

      <div class="flex flex-col gap-3 rounded-xl bg-neutral-50 p-4">
        <template v-if="step === 'idle'">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <p class="text-sm text-neutral-600">
              {{
                lang === "en" ? "Members pay less:" : "Os membros pagam menos:"
              }}
              <span class="font-medium text-neutral-950">
                −{{ COURSE_DISCOUNT_PCT[1] }}% / −{{ COURSE_DISCOUNT_PCT[2] }}%
              </span>
            </p>
            <UiButton
              type="button"
              variant="outline"
              size="sm"
              :disabled="busy || !emailValid"
              @click="sendCode"
            >
              {{ copy.iAmMember }}
            </UiButton>
          </div>
        </template>

        <template v-else-if="step === 'code'">
          <label for="course-code" class="text-sm font-medium">{{
            copy.code
          }}</label>
          <div class="flex gap-2">
            <input
              id="course-code"
              v-model="code"
              inputmode="numeric"
              autocomplete="one-time-code"
              maxlength="6"
              class="field-box font-mono tracking-widest"
            />
            <UiButton
              type="button"
              variant="outline"
              :disabled="busy || code.length < 6"
              @click="confirmCode"
            >
              {{ copy.confirmCode }}
            </UiButton>
          </div>
        </template>

        <p v-if="info" class="text-sm text-neutral-700" role="status">
          {{ info }}
        </p>
        <p
          v-else-if="step === 'verified'"
          class="text-sm text-neutral-700"
          role="status"
        >
          {{
            lang === "en"
              ? "No active membership found: standard price."
              : "Não encontrámos uma quota ativa: preço normal."
          }}
        </p>
        <NuxtLink
          v-if="step === 'idle'"
          :to="localePath('juntar')"
          class="link w-fit text-xs text-neutral-600"
        >
          {{ copy.notMember }}
        </NuxtLink>
      </div>

      <p v-if="error" class="text-sm text-red-700" role="alert">{{ error }}</p>

      <UiButton type="submit" size="lg" arrow :loading="busy" :disabled="busy">
        {{
          busy ? copy.buying : `${copy.buy} · ${formatEur(priceCents, lang)}`
        }}
      </UiButton>
      <p class="text-center text-xs text-neutral-500">{{ copy.cardOnly }}</p>
    </form>

    <IPBDevUnlock />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ course: string }>();

const lang = useAppLocale();
const localePath = useLocalePath();
const {
  buy,
  busy,
  code,
  confirmCode,
  copy,
  email,
  emailValid,
  error,
  info,
  memberLayer,
  owned,
  priceCents,
  sendCode,
  step,
} = useCourseCheckout(() => props.course);
</script>
