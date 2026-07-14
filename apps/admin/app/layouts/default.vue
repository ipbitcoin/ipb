<template>
  <div class="flex min-h-screen">
    <aside
      v-if="loggedIn"
      class="w-56 shrink-0 border-r bg-white p-4 flex flex-col gap-6"
    >
      <NuxtLink to="/" class="font-bold uppercase tracking-wider"
        >IPB Admin</NuxtLink
      >
      <nav class="flex flex-col gap-1 text-sm">
        <NuxtLink
          v-for="(def, key) in COLLECTIONS"
          :key="key"
          :to="`/c/${key}`"
          class="rounded px-2 py-1.5 hover:bg-neutral-100"
          active-class="bg-neutral-100 font-semibold"
        >
          {{ def.label }}
        </NuxtLink>
      </nav>
      <button
        class="mt-auto cursor-pointer rounded border px-2 py-1.5 text-sm hover:bg-neutral-100"
        @click="handleLogout"
      >
        Sair
      </button>
    </aside>
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, clear } = useUserSession();

async function handleLogout() {
  await $fetch("/api/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}
</script>
