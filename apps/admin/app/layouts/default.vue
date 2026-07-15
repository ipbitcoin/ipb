<template>
  <div class="flex min-h-screen">
    <aside
      v-if="loggedIn"
      class="flex max-h-screen w-56 shrink-0 flex-col gap-6 sticky top-0 border-r bg-white p-4"
    >
      <NuxtLink to="/" class="font-bold uppercase tracking-wider"
        >IPB Admin</NuxtLink
      >
      <nav class="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto text-sm">
        <div
          v-for="section in NAV_SECTIONS"
          :key="section.label"
          class="flex flex-col gap-1"
        >
          <p class="px-2 text-xs uppercase tracking-wider text-neutral-500">
            {{ section.label }}
          </p>
          <NuxtLink
            v-for="item in section.items"
            :key="item.to"
            :to="item.to"
            class="rounded px-2 py-1.5 hover:bg-neutral-100"
            active-class="bg-neutral-100 font-semibold"
          >
            {{ item.label }}
          </NuxtLink>
        </div>
      </nav>
      <div class="mt-auto flex flex-col gap-2">
        <NuxtLink
          to="/profile"
          class="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-neutral-100"
          active-class="bg-neutral-100 font-semibold"
        >
          <AdminAvatar
            :avatar-key="user?.avatarKey"
            :name="user?.username ?? user?.email ?? '?'"
            size="sm"
          />
          <span class="truncate text-sm">{{
            user?.username ?? user?.email
          }}</span>
        </NuxtLink>
        <button
          class="cursor-pointer rounded border px-2 py-1.5 text-sm hover:bg-neutral-100"
          @click="handleLogout"
        >
          Sair
        </button>
      </div>
    </aside>
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();

async function handleLogout() {
  await $fetch("/api/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}
</script>
