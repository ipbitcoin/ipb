<template>
  <!-- Success replaces the field inline: a toast alone is easy to miss -->
  <p
    v-if="success"
    role="status"
    :class="[
      'flex items-center gap-2 py-2 text-sm',
      inverse ? 'text-white/80' : 'text-black/70',
    ]"
  >
    <IconCheck class="size-4 shrink-0" aria-hidden="true" />
    {{ $t("newsletter.success") }}
  </p>

  <form
    v-else
    class="relative w-full max-w-sm"
    @submit.prevent="handleSubscribe"
  >
    <input
      v-model="email"
      type="email"
      required
      :placeholder="t('input.email')"
      :aria-label="t('input.email')"
      :disabled="loading"
      :class="[
        'w-full border-b bg-transparent py-3 pr-14 text-base outline-none transition-colors duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-4',
        inverse
          ? 'border-white/30 text-white placeholder:text-white/40 focus:border-white focus-visible:outline-white'
          : 'border-black/25 text-black placeholder:text-black/35 focus:border-black focus-visible:outline-brand',
      ]"
    />
    <button
      type="submit"
      :disabled="loading"
      :aria-label="t('newsletter.submit')"
      :class="[
        'bg-brand absolute right-0 bottom-2 flex size-10 cursor-pointer items-center justify-center rounded-full text-white transition-[background-color,scale] duration-150 ease-out hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60',
        inverse
          ? 'hover:bg-white hover:text-black focus-visible:outline-white'
          : 'focus-visible:outline-brand',
      ]"
    >
      <IconArrow v-if="!loading" class="size-4" aria-hidden="true" />
      <span
        v-else
        aria-hidden="true"
        class="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
      />
    </button>
  </form>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ inverse?: boolean }>(), { inverse: false });

const { t } = useI18n();
const { subscribe, loading, success } = useNewsletter();

const email = ref("");

async function handleSubscribe() {
  await subscribe(email);
}
</script>
