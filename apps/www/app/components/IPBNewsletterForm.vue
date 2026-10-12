<template>
  <!-- Success replaces the field inline: a toast alone is easy to miss -->
  <p
    v-if="success"
    role="status"
    :class="[
      'flex min-h-12 items-center gap-2 text-[15px]',
      tone === 'dark' ? 'text-white/80' : 'text-neutral-950',
    ]"
  >
    <span
      :class="[
        'grid size-6 shrink-0 place-items-center rounded-full',
        tone === 'brand'
          ? 'bg-neutral-950 text-brand'
          : 'bg-brand text-neutral-950',
      ]"
    >
      <IconCheck class="size-3.5" />
    </span>
    {{ $t("newsletter.success") }}
  </p>

  <!-- One pill: the field and its button share an edge, so the radius of the
       button (inset by 4px) stays concentric with the field around it. -->
  <form
    v-else
    :class="[
      'group/form relative flex h-12 w-full max-w-md items-center rounded-full border p-1 pl-5 transition-[border-color,background-color] duration-150 ease-out has-focus-visible:outline-2 has-focus-visible:outline-offset-2',
      TONES[tone].form,
    ]"
    @submit.prevent="handleSubscribe"
  >
    <input
      v-model="email"
      type="email"
      required
      autocomplete="email"
      :placeholder="t('input.email')"
      :aria-label="t('input.email')"
      :disabled="loading"
      :class="[
        'h-full min-w-0 flex-1 bg-transparent pr-3 text-base outline-none disabled:opacity-60',
        TONES[tone].input,
      ]"
    />
    <button
      type="submit"
      :disabled="loading"
      :aria-label="t('newsletter.submit')"
      :class="[
        'relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-full transition-[background-color,color,scale] duration-150 ease-out [-webkit-tap-highlight-color:transparent] focus-visible:outline-none disabled:cursor-not-allowed motion-safe:enabled:active:scale-[0.96]',
        TONES[tone].button,
      ]"
    >
      <!-- Both icons stay mounted so the swap cross-fades both ways -->
      <IconArrow
        :class="[
          'col-start-1 row-start-1 size-4 transition-[opacity,scale,filter] duration-300 ease-swap',
          loading
            ? 'opacity-0 motion-safe:scale-25 motion-safe:blur-xs'
            : 'opacity-100',
        ]"
      />
      <span
        aria-hidden="true"
        :class="[
          'col-start-1 row-start-1 size-4 rounded-full border-2 border-current border-r-transparent transition-[opacity,scale,filter] duration-300 ease-swap',
          loading
            ? 'animate-spin opacity-100 [animation-duration:600ms]'
            : 'opacity-0 motion-safe:scale-25 motion-safe:blur-xs',
        ]"
      />
    </button>
  </form>
</template>

<script setup lang="ts">
type Tone = "light" | "dark" | "brand";

withDefaults(defineProps<{ tone?: Tone }>(), { tone: "light" });

const TONES: Record<Tone, { button: string; form: string; input: string }> = {
  brand: {
    button: "bg-neutral-950 text-brand hover:bg-neutral-800",
    form: "border-transparent bg-white shadow-button-light has-focus-visible:outline-neutral-950",
    input: "text-neutral-950 placeholder:text-neutral-500",
  },
  dark: {
    button: "bg-brand text-neutral-950 hover:bg-white",
    form: "border-white/25 bg-white/5 hover:border-white/40 has-focus-visible:outline-white",
    input: "text-white placeholder:text-white/50",
  },
  light: {
    button: "bg-neutral-950 text-white hover:bg-brand hover:text-neutral-950",
    form: "border-black/45 bg-white hover:border-black/70 has-focus-visible:outline-brand",
    input: "text-neutral-950 placeholder:text-neutral-400",
  },
};

const { t } = useI18n();
const { subscribe, loading, success } = useNewsletter();

const email = ref("");

async function handleSubscribe() {
  await subscribe(email);
}
</script>
