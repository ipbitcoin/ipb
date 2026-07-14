<template>
  <div class="flex flex-col gap-8">
    <h1 class="text-3xl font-light">Dashboard</h1>

    <div v-if="stats" class="grid grid-cols-2 gap-4 md:grid-cols-5">
      <div
        v-for="(count, key) in stats.counts"
        :key="key"
        class="rounded border bg-white p-4"
      >
        <div class="text-3xl font-light">{{ count }}</div>
        <div class="text-sm uppercase tracking-wider text-neutral-500">
          {{ labels[key] ?? key }}
        </div>
      </div>
    </div>

    <section
      v-if="stats?.recentEnrollments?.length"
      class="flex flex-col gap-2"
    >
      <h2 class="text-xl font-light">Inscrições recentes</h2>
      <div class="overflow-x-auto rounded border bg-white">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b bg-neutral-50 uppercase tracking-wider text-neutral-500"
          >
            <tr>
              <th class="px-3 py-2">Nome</th>
              <th class="px-3 py-2">Email</th>
              <th class="px-3 py-2">Pagamento</th>
              <th class="px-3 py-2">Valor</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="e in stats.recentEnrollments"
              :key="e._id"
              class="border-b last:border-0"
            >
              <td class="px-3 py-2">{{ e.name }}</td>
              <td class="px-3 py-2">{{ e.email }}</td>
              <td class="px-3 py-2">{{ e.paymentStatus }}</td>
              <td class="px-3 py-2">{{ e.value }}€</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="stats?.recentMembers?.length" class="flex flex-col gap-2">
      <h2 class="text-xl font-light">Membros recentes</h2>
      <div class="overflow-x-auto rounded border bg-white">
        <table class="w-full text-left text-sm">
          <thead
            class="border-b bg-neutral-50 uppercase tracking-wider text-neutral-500"
          >
            <tr>
              <th class="px-3 py-2">Nome</th>
              <th class="px-3 py-2">Email</th>
              <th class="px-3 py-2">Plano</th>
              <th class="px-3 py-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="m in stats.recentMembers"
              :key="m._id"
              class="border-b last:border-0"
            >
              <td class="px-3 py-2">{{ m.name }}</td>
              <td class="px-3 py-2">{{ m.email }}</td>
              <td class="px-3 py-2">{{ m.paymentPlan }}</td>
              <td class="px-3 py-2">{{ m.paymentStatus }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
const labels: Record<string, string> = {
  articles: "Artigos",
  enrollments: "Inscrições",
  members: "Membros",
  newsletters: "Newsletter",
  trainings: "Formações",
};

const { data: stats } = useFetch("/api/stats");
</script>
