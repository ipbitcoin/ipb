<template>
  <div class="flex flex-col gap-8">
    <h1 class="text-3xl font-light">Dashboard</h1>

    <div class="grid grid-cols-2 gap-4 md:grid-cols-5">
      <template v-if="stats">
        <div
          v-for="(count, key) in stats.counts"
          :key="key"
          class="flex flex-col gap-1 rounded-lg bg-white p-4 shadow-border"
        >
          <div class="text-3xl font-light tabular-nums">{{ count }}</div>
          <div class="text-xs tracking-wider text-neutral-500 uppercase">
            {{ labels[key] ?? key }}
          </div>
        </div>
      </template>
      <template v-else>
        <div
          v-for="n in 5"
          :key="n"
          class="flex flex-col gap-2 rounded-lg bg-white p-4 shadow-border"
        >
          <div class="h-8 w-16 animate-pulse rounded bg-neutral-100" />
          <div class="h-3 w-24 animate-pulse rounded bg-neutral-100" />
        </div>
      </template>
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="text-xl font-light">Inscrições recentes</h2>
      <AdminTable
        :columns="enrollmentColumns"
        :rows="stats?.recentEnrollments"
        :pending="status === 'pending'"
        empty-label="Sem inscrições recentes."
      >
        <template #cell="{ column, value }">
          <template v-if="column.key === 'value'">{{ value }}€</template>
          <template v-else>{{ value }}</template>
        </template>
      </AdminTable>
    </section>

    <section class="flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-light">Membros recentes</h2>
        <label
          class="flex cursor-pointer items-center gap-2 text-sm text-neutral-500"
        >
          <input
            v-model="hidePending"
            type="checkbox"
            class="size-4 accent-neutral-900"
          />
          Ocultar pendentes
        </label>
      </div>
      <AdminTable
        :columns="memberColumns"
        :rows="visibleMembers"
        :pending="status === 'pending'"
        empty-label="Sem membros recentes."
      />
    </section>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from "~/utils/table";

const labels: Record<string, string> = {
  articles: "Artigos",
  enrollments: "Inscrições",
  members: "Membros",
  newsletters: "Newsletter",
  trainings: "Formações",
};

const enrollmentColumns: TableColumn[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "paymentStatus", label: "Pagamento" },
  { key: "value", label: "Valor", numeric: true },
];

const memberColumns: TableColumn[] = [
  { key: "name", label: "Nome" },
  { key: "email", label: "Email" },
  { key: "paymentPlan", label: "Plano" },
  { key: "paymentStatus", label: "Estado" },
];

interface RecentEnrollment {
  _id: string;
  email: string;
  name: string;
  paymentStatus: string;
  value: number;
}

interface RecentMember {
  _id: string;
  email: string;
  name: string;
  paymentPlan: string;
  paymentStatus: string;
}

interface DashboardStats {
  counts: Record<string, number>;
  recentEnrollments: RecentEnrollment[];
  recentMembers: RecentMember[];
}

const { data: stats, status } = useFetch<DashboardStats>("/api/stats");

const hidePending = ref(true);

const visibleMembers = computed(() => {
  const members = stats.value?.recentMembers ?? [];
  return (
    hidePending.value
      ? members.filter((m) => m.paymentStatus !== "pending")
      : members
  ).slice(0, 10);
});
</script>
