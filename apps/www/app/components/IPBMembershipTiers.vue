<template>
  <section aria-labelledby="tiers-heading" class="flex flex-col gap-10">
    <h2 id="tiers-heading" class="text-2xl font-light">
      {{ t("join.tiers.heading") }}
    </h2>

    <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-3">
      <!-- Tier 0 — free, intentionally quieter than the paid tiers -->
      <article
        class="flex flex-col gap-5 rounded-lg bg-white p-6 shadow-border sm:p-8"
      >
        <header class="flex flex-col gap-1">
          <p class="eyebrow">{{ t("join.tiers.t0.label") }}</p>
          <h3 class="text-xl font-semibold">{{ t("join.tiers.t0.name") }}</h3>
        </header>
        <p class="text-5xl font-light tabular-nums">
          {{ t("join.tiers.free") }}
        </p>
        <p class="text-black/70">{{ t("join.tiers.t0.tagline") }}</p>
        <ul class="flex flex-1 flex-col gap-2 text-sm">
          <li v-for="i in 2" :key="i" class="flex items-start gap-2">
            <IconCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{{ t(`join.tiers.t0.points[${i - 1}]`) }}</span>
          </li>
        </ul>
        <UiButton
          size="lg"
          variant="outline"
          :href="communityUrl || undefined"
          :to="communityUrl ? undefined : localePath('contactos')"
          :target="communityUrl ? '_blank' : undefined"
          class="w-full"
        >
          {{ t("join.tiers.t0.cta") }}
        </UiButton>
      </article>

      <!-- Tier 1 — €21 / year -->
      <article
        class="flex flex-col gap-5 rounded-lg bg-white p-6 shadow-border ring-2 ring-black sm:p-8"
      >
        <header class="flex flex-col gap-1">
          <p class="eyebrow">{{ t("join.tiers.t1.label") }}</p>
          <h3 class="text-xl font-semibold">{{ t("join.tiers.t1.name") }}</h3>
        </header>
        <div class="flex flex-col gap-1">
          <p class="flex items-baseline gap-1 tabular-nums">
            <span class="text-6xl font-semibold">€21</span>
            <span class="text-xl text-black/60">{{
              t("join.tiers.perYear")
            }}</span>
          </p>
          <p class="text-sm font-medium text-brand">
            {{ t("join.tiers.t1.equiv") }}
          </p>
        </div>
        <p class="text-black/70">{{ t("join.tiers.t1.tagline") }}</p>
        <ul class="flex flex-1 flex-col gap-2 text-sm">
          <li v-for="i in 6" :key="i" class="flex items-start gap-2">
            <IconCheck class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{{ t(`join.tiers.t1.points[${i - 1}]`) }}</span>
          </li>
        </ul>
        <UiButton size="lg" class="w-full" @click="emit('select', 'annual')">
          {{ t("join.tiers.t1.cta") }}
        </UiButton>
      </article>

      <!-- Tier 2 — €21 / month, the most complete one -->
      <article
        class="relative flex flex-col gap-5 rounded-lg bg-black p-6 text-white shadow-border sm:p-8"
      >
        <span
          class="absolute -top-3 right-6 rounded-[3px] bg-brand px-3 py-1 text-xs font-semibold tracking-wide text-black uppercase"
        >
          {{ t("join.tiers.popular") }}
        </span>
        <header class="flex flex-col gap-1">
          <p class="eyebrow text-white/60">{{ t("join.tiers.t2.label") }}</p>
          <h3 class="text-xl font-semibold">{{ t("join.tiers.t2.name") }}</h3>
        </header>
        <div class="flex flex-col gap-1">
          <p class="flex items-baseline gap-1 tabular-nums">
            <span class="text-6xl font-semibold">€21</span>
            <span class="text-xl text-white/60">{{
              t("join.tiers.perMonth")
            }}</span>
          </p>
          <p class="text-sm font-medium text-brand">
            {{ t("join.tiers.t2.equiv") }}
          </p>
        </div>
        <p class="text-white/80">{{ t("join.tiers.t2.tagline") }}</p>
        <ul class="flex flex-1 flex-col gap-2 text-sm">
          <li v-for="i in 6" :key="i" class="flex items-start gap-2">
            <IconCheck
              class="mt-0.5 size-4 shrink-0 text-brand"
              aria-hidden="true"
            />
            <span>{{ t(`join.tiers.t2.points[${i - 1}]`) }}</span>
          </li>
        </ul>
        <UiButton
          size="lg"
          variant="inverse"
          class="w-full"
          @click="emit('select', 'monthly')"
        >
          {{ t("join.tiers.t2.cta") }}
        </UiButton>
      </article>
    </div>

    <div class="flex flex-col gap-4">
      <h3 class="text-2xl font-light">{{ t("join.compare.heading") }}</h3>
      <div class="overflow-x-auto rounded-lg shadow-border">
        <table class="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead class="bg-black text-white">
            <tr>
              <th scope="col" class="px-4 py-3 font-semibold">
                {{ t("join.compare.member") }}
              </th>
              <th
                v-for="tier in 3"
                :key="tier"
                scope="col"
                class="px-4 py-3 text-center font-semibold"
              >
                {{ t(`join.tiers.t${tier - 1}.label`) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr class="odd:bg-white even:bg-neutral-100">
              <th scope="row" class="px-4 py-3 font-bold">
                {{ t("join.compare.fee") }}
              </th>
              <td class="px-4 py-3 text-center">
                {{ t("join.compare.feeT0") }}
              </td>
              <td class="px-4 py-3 text-center font-semibold">
                {{ t("join.compare.feeT1") }}
              </td>
              <td class="px-4 py-3 text-center font-semibold">
                {{ t("join.compare.feeT2") }}
              </td>
            </tr>
            <tr
              v-for="row in rows"
              :key="row.key"
              class="odd:bg-neutral-100 even:bg-white"
            >
              <th scope="row" class="px-4 py-3 font-normal">
                <span class="font-bold">{{
                  t(`join.compare.rows.${row.key}.bold`)
                }}</span>
                <span v-if="te(`join.compare.rows.${row.key}.text`)">
                  — {{ t(`join.compare.rows.${row.key}.text`) }}
                </span>
              </th>
              <td
                v-for="(cell, index) in row.cells"
                :key="index"
                class="px-4 py-3 text-center"
              >
                <IconCheck
                  v-if="cell === 'check'"
                  class="mx-auto size-4"
                  role="img"
                  :aria-label="t('join.compare.included')"
                />
                <span
                  v-else-if="cell === 'none'"
                  class="text-black/40"
                  aria-label="–"
                  >—</span
                >
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
