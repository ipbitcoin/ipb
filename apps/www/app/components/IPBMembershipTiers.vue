<template>
  <section aria-labelledby="tiers-heading">
    <div class="flex max-w-3xl flex-col gap-4">
      <p class="eyebrow">{{ t("join.tiers.eyebrow") }}</p>
      <h2 id="tiers-heading" class="section-title">
        {{ t("join.tiers.heading") }}
      </h2>
    </div>

    <!-- Three across, every card is a subgrid of the same four rows, so the
         names, prices, buttons and lists line up from card to card. In
         between, each card splits into its offer and its list. -->
    <div class="mt-12 grid gap-4 sm:mt-14 xl:grid-cols-3 xl:gap-x-5 xl:gap-y-0">
      <article
        v-for="(tier, index) in TIERS"
        :key="tier.key"
        class="reveal relative isolate flex flex-col overflow-hidden rounded-3xl border p-7 sm:p-8 md:grid md:grid-cols-2 md:gap-x-12 xl:row-span-4 xl:grid-cols-1 xl:grid-rows-subgrid xl:gap-x-0"
        :class="CARD[tier.key]"
        :style="{ '--reveal-delay': `${index * 100}ms` }"
      >
        <!-- The top tier carries the site's grid motif, fading out from
             its corner. -->
        <div
          v-if="tier.key === 't2'"
          aria-hidden="true"
          class="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,oklch(1_0_0/0.07)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.07)_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_90%_55%_at_100%_0%,black,transparent_70%)]"
        />

        <div class="flex flex-col xl:contents">
          <header>
            <div class="flex h-5 items-center justify-between gap-3">
              <p class="eyebrow" :class="tone(tier.key).eyebrow">
                {{ t(`join.tiers.${tier.key}.label`) }}
              </p>
              <span
                v-if="tier.key === 't2'"
                class="rounded-full bg-brand px-2.5 py-1 font-mono text-[10px] leading-3 font-medium tracking-[0.12em] text-neutral-950 uppercase"
              >
                {{ t("join.tiers.popular") }}
              </span>
            </div>
            <h3 class="mt-5 text-2xl leading-tight tracking-tight">
              {{ t(`join.tiers.${tier.key}.name`) }}
            </h3>
            <p
              class="mt-2 leading-relaxed text-pretty"
              :class="tone(tier.key).muted"
            >
              {{ t(`join.tiers.${tier.key}.tagline`) }}
            </p>
          </header>

          <div class="mt-10">
            <p class="flex items-baseline gap-1.5">
              <span
                class="text-5xl leading-none tracking-[-0.045em] tabular-nums sm:text-6xl"
              >
                {{ tier.key === "t0" ? t("join.tiers.free") : "€21" }}
              </span>
              <span v-if="tier.key !== 't0'" :class="tone(tier.key).subtle">
                {{ t(`join.tiers.${tier.period}`) }}
              </span>
            </p>
            <p
              v-if="tier.key !== 't0'"
              class="mt-3 text-sm"
              :class="tone(tier.key).subtle"
            >
              {{ t(`join.tiers.${tier.key}.equiv`) }}
            </p>
          </div>

          <div class="mt-8 md:mt-auto md:pt-10 xl:mt-8 xl:pt-0">
            <UiButton
              v-if="tier.key === 't0'"
              size="lg"
              variant="outline"
              class="w-full"
              :href="communityUrl || undefined"
              :to="communityUrl ? undefined : localePath('contactos')"
              :target="communityUrl ? '_blank' : undefined"
            >
              {{ t("join.tiers.t0.cta") }}
              <template v-if="communityUrl">
                <IconArrow class="size-4 -rotate-45" />
                <span class="sr-only">({{ t("common.newTab") }})</span>
              </template>
            </UiButton>
            <UiButton
              v-else
              size="lg"
              arrow
              class="w-full"
              :variant="tier.key === 't2' ? 'brand' : 'primary'"
              @click="emit('select', tier.plan)"
            >
              {{ t(`join.tiers.${tier.key}.cta`) }}
            </UiButton>
          </div>
        </div>

        <ul
          class="mt-8 grid content-start gap-3 border-t pt-8 text-[15px] leading-snug sm:grid-cols-2 sm:gap-x-8 md:mt-0 md:grid-cols-1 md:border-t-0 md:border-l md:pt-0 md:pl-12 xl:mt-8 xl:border-t xl:border-l-0 xl:pt-8 xl:pl-0"
          :class="tone(tier.key).rule"
        >
          <li
            v-for="point in tier.points"
            :key="point"
            class="flex gap-3"
            :class="tier.key === 't2' && point === 1 && 'font-medium'"
          >
            <IconCheck
              class="mt-0.5 size-4 shrink-0"
              :class="tone(tier.key).check"
            />
            <span>{{ t(`join.tiers.${tier.key}.points[${point - 1}]`) }}</span>
          </li>
        </ul>
      </article>
    </div>

    <div class="mt-20 sm:mt-28">
      <h3
        id="compare-heading"
        class="text-2xl leading-tight tracking-tight sm:text-3xl"
      >
        {{ t("join.compare.heading") }}
      </h3>

      <!-- Scrolls sideways on phones, with the row labels pinned. Focusable,
           so it scrolls from the keyboard too. -->
      <div
        role="region"
        aria-labelledby="compare-heading"
        tabindex="0"
        class="mt-8 overflow-x-auto overscroll-x-contain rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
      >
        <table
          class="w-full min-w-lg border-separate border-spacing-0 text-left text-sm"
        >
          <thead>
            <tr>
              <th
                scope="col"
                class="sticky left-0 z-10 w-36 border-b border-black/10 bg-white py-4 pr-4 align-bottom font-mono text-[11px] leading-4 font-medium tracking-[0.12em] text-neutral-500 uppercase sm:w-[40%] sm:pr-6"
              >
                {{ t("join.compare.member") }}
              </th>
              <th
                v-for="tier in TIERS"
                :key="tier.key"
                scope="col"
                class="border-b border-black/10 px-3 py-4 text-center align-bottom font-normal"
              >
                <span class="eyebrow text-neutral-950">
                  {{ t(`join.tiers.${tier.key}.label`) }}
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" :class="ROW_HEADER" class="font-medium">
                {{ t("join.compare.fee") }}
              </th>
              <td
                v-for="tier in TIERS"
                :key="tier.key"
                :class="CELL"
                class="font-medium tabular-nums"
              >
                {{ t(`join.compare.fee${tier.key.toUpperCase()}`) }}
              </td>
            </tr>
            <tr v-for="row in rows" :key="row.key">
              <th scope="row" :class="ROW_HEADER" class="font-normal">
                <span class="block font-medium">
                  {{ t(`join.compare.rows.${row.key}.bold`) }}
                </span>
                <span
                  v-if="te(`join.compare.rows.${row.key}.text`)"
                  class="mt-0.5 block text-[13px] leading-snug text-neutral-500"
                >
                  {{ t(`join.compare.rows.${row.key}.text`) }}
                </span>
              </th>
              <td v-for="(cell, index) in row.cells" :key="index" :class="CELL">
                <IconCheck
                  v-if="cell === 'check'"
                  class="mx-auto mt-0.5 size-4"
                  role="img"
                  :aria-label="t('join.compare.included')"
                />
                <template v-else-if="cell === 'none'">
                  <span aria-hidden="true" class="text-neutral-400">—</span>
                  <span class="sr-only">
                    {{ t("join.compare.notIncluded") }}
                  </span>
                </template>
                <span v-else>{{ t(`join.compare.values.${cell}`) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
type Cell =
  | "check"
  | "none"
  | "participate"
  | "create"
  | "organize"
  | "memberPrice"
  | "includedF"
  | "includedM"
  | "discount"
  | "digital"
  | "inPerson";

const emit = defineEmits<{ select: [plan: "annual" | "monthly"] }>();

const { t, te } = useI18n();
const localePath = useLocalePath();
const communityUrl = useRuntimeConfig().public.COMMUNITY_URL;

// Free, yearly, monthly. `points` is how many bullets each card lists.
const TIERS = [
  { key: "t0", points: 2 },
  { key: "t1", period: "perYear", plan: "annual", points: 6 },
  { key: "t2", period: "perMonth", plan: "monthly", points: 6 },
] as const;

type TierKey = (typeof TIERS)[number]["key"];

// Flat, raised, then dark: each layer asks more and carries more weight. The
// transparent borders keep an edge in forced-colors mode.
const CARD: Record<TierKey, string> = {
  t0: "border-black/5 bg-neutral-50",
  t1: "border-transparent bg-white shadow-border",
  t2: "border-transparent bg-neutral-950 text-white",
};

const LIGHT = {
  check: "text-neutral-950",
  eyebrow: "",
  muted: "text-neutral-600",
  rule: "border-black/10",
  subtle: "text-neutral-500",
};
const DARK = {
  check: "text-brand",
  eyebrow: "text-white/50",
  muted: "text-white/60",
  rule: "border-white/10",
  subtle: "text-white/50",
};
const tone = (key: TierKey) => (key === "t2" ? DARK : LIGHT);

const ROW_HEADER =
  "sticky left-0 z-10 border-b border-black/10 bg-white py-4 pr-4 align-top text-neutral-950 sm:pr-6";
const CELL = "border-b border-black/10 px-3 py-4 text-center align-top";

// Columns: tier 0, tier 1, tier 2.
const rows: { key: string; cells: [Cell, Cell, Cell] }[] = [
  { cells: ["check", "check", "check"], key: "announcements" },
  { cells: ["none", "check", "check"], key: "discussion" },
  { cells: ["none", "check", "check"], key: "newsletter" },
  { cells: ["none", "participate", "create"], key: "themedGroups" },
  { cells: ["none", "participate", "create"], key: "districtGroups" },
  { cells: ["none", "participate", "organize"], key: "p2p" },
  { cells: ["none", "memberPrice", "includedF"], key: "conference" },
  { cells: ["none", "memberPrice", "includedM"], key: "dinner" },
  { cells: ["none", "memberPrice", "discount"], key: "workshops" },
  { cells: ["none", "memberPrice", "discount"], key: "support101" },
  { cells: ["none", "digital", "inPerson"], key: "localCommunities" },
];
</script>
