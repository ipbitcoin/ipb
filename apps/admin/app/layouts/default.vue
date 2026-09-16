<template>
  <div class="flex min-h-screen bg-neutral-50">
    <aside
      v-if="loggedIn"
      class="sticky top-0 flex max-h-screen w-56 shrink-0 flex-col gap-6 border-r border-neutral-200 bg-white p-4"
    >
      <NuxtLink to="/" class="focus-ring flex w-fit items-center rounded px-1">
        <img src="/logo.svg" alt="Instituto Bitcoin" class="h-8 w-auto" />
      </NuxtLink>

      <AccordionRoot
        type="multiple"
        :default-value="defaultOpenSections"
        class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto"
      >
        <AccordionItem
          v-for="section in NAV_SECTIONS"
          :key="section.label"
          :value="section.label"
          class="flex flex-col"
        >
          <AccordionHeader>
            <AccordionTrigger
              class="group focus-ring flex w-full cursor-pointer items-center justify-between rounded px-2 py-1 transition-colors duration-100 hover:bg-neutral-100"
            >
              <span
                class="text-xs font-medium tracking-wider text-neutral-500 uppercase"
              >
                {{ section.label }}
              </span>
              <IconArrowDown
                class="size-4 text-neutral-400 transition-transform duration-200 ease-out group-data-[state=open]:rotate-180"
              />
            </AccordionTrigger>
          </AccordionHeader>
          <AccordionContent
            class="overflow-hidden data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down"
          >
            <div class="flex flex-col gap-0.5 pt-1 text-sm">
              <!-- Same weight on every link: active state must not shift layout -->
              <NuxtLink
                v-for="item in section.items"
                :key="item.to"
                :to="item.to"
                class="focus-ring rounded px-2 py-1.5 font-medium text-neutral-700 transition-colors duration-100 hover:bg-neutral-100"
                active-class="bg-brand-soft text-brand hover:bg-brand-soft"
              >
                {{ item.label }}
              </NuxtLink>
            </div>
          </AccordionContent>
        </AccordionItem>
      </AccordionRoot>

      <PopoverRoot v-model:open="profileOpen">
        <PopoverTrigger as-child>
          <button
            class="focus-ring mt-auto flex w-full cursor-pointer items-center gap-2 rounded px-2 py-1.5 transition-colors duration-100 hover:bg-neutral-100"
          >
            <AdminAvatar
              :avatar-key="user?.avatarKey"
              :name="user?.username ?? user?.email ?? '?'"
              size="sm"
            />
            <span class="flex-1 truncate text-left text-sm">{{
              user?.username ?? user?.email
            }}</span>
            <IconArrowDown
              class="size-4 text-neutral-400 transition-transform duration-200 ease-out"
              :class="profileOpen ? 'rotate-180' : ''"
            />
          </button>
        </PopoverTrigger>
        <PopoverPortal>
          <PopoverContent
            side="top"
            align="start"
            :side-offset="8"
            class="z-50 w-48 origin-(--reka-popover-content-transform-origin) rounded-lg bg-white p-1 shadow-popover data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in"
          >
            <NuxtLink
              to="/profile"
              class="focus-ring block rounded px-2 py-1.5 text-sm text-neutral-700 transition-colors duration-100 hover:bg-neutral-100"
              @click="profileOpen = false"
            >
              Ver perfil
            </NuxtLink>
            <button
              class="focus-ring block w-full cursor-pointer rounded px-2 py-1.5 text-left text-sm text-red-600 transition-colors duration-100 hover:bg-red-50"
              @click="handleLogout"
            >
              Terminar sessão
            </button>
          </PopoverContent>
        </PopoverPortal>
      </PopoverRoot>
    </aside>
    <main class="min-w-0 flex-1 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { loggedIn, user, clear } = useUserSession();

const profileOpen = ref(false);

const defaultOpenSections = NAV_SECTIONS.filter(
  (section) => !section.defaultCollapsed
).map((section) => section.label);

async function handleLogout() {
  profileOpen.value = false;
  await $fetch("/api/logout", { method: "POST" });
  await clear();
  await navigateTo("/login");
}
</script>
