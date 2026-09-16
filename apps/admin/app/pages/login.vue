<template>
  <div class="grid min-h-screen w-full lg:grid-cols-2">
    <!-- Brand panel (desktop only) -->
    <aside class="relative hidden overflow-hidden bg-neutral-950 lg:block">
      <div
        class="absolute -top-40 -right-40 size-[36rem] rounded-full bg-brand/20 blur-3xl"
      />
      <div
        class="absolute -bottom-48 -left-32 size-[32rem] rounded-full bg-brand/10 blur-3xl"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]"
      />

      <div class="relative flex h-full flex-col justify-between p-10 xl:p-14">
        <img
          src="/logo.svg"
          alt="Instituto Bitcoin"
          class="h-9 w-auto self-start brightness-0 invert"
        />

        <div class="max-w-md">
          <div class="mb-5 h-1 w-16 bg-brand" />
          <h2
            class="text-4xl font-light leading-[1.05] tracking-tight text-white xl:text-5xl"
          >
            Educação e
            <span class="font-semibold text-brand">soberania</span>
            para todos.
          </h2>
          <p class="mt-5 text-base leading-relaxed text-white/60">
            Painel de administração do Instituto Português de Bitcoin.
          </p>
        </div>

        <p class="text-xs uppercase tracking-[0.2em] text-white/30">
          admin.institutobitcoin.pt
        </p>
      </div>
    </aside>

    <!-- Form panel -->
    <main
      class="flex min-h-screen flex-col justify-center bg-neutral-50 px-6 py-12 sm:px-10"
    >
      <div class="mx-auto w-full max-w-sm animate-fade-up">
        <!-- Mobile brand mark -->
        <img
          src="/logo.svg"
          alt="Instituto Bitcoin"
          class="mb-10 h-8 w-auto lg:hidden"
        />

        <div class="flex flex-col gap-8">
          <div class="flex flex-col gap-2">
            <h1 class="text-4xl font-light leading-none tracking-tight">
              {{ needsSetup ? "Ativar conta" : "Entrar" }}
            </h1>
            <p class="text-sm text-neutral-500">
              <template v-if="needsSetup">
                Primeira entrada — define a tua password para ativar a conta.
              </template>
              <template v-else>
                Acesso reservado à equipa do Instituto.
              </template>
            </p>
          </div>

          <form class="flex flex-col gap-5" @submit.prevent="handleSubmit">
            <label class="flex flex-col gap-2">
              <span
                class="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500"
              >
                Email
              </span>
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                autofocus
                required
                :readonly="needsSetup"
                :class="inputClass"
              />
            </label>

            <label class="flex flex-col gap-2">
              <span
                class="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500"
              >
                {{ needsSetup ? "Nova password" : "Password" }}
              </span>
              <input
                v-model="password"
                type="password"
                :autocomplete="needsSetup ? 'new-password' : 'current-password'"
                required
                :minlength="needsSetup ? 10 : 1"
                :class="inputClass"
              />
              <span v-if="needsSetup" class="text-xs text-neutral-400">
                Mínimo 10 caracteres.
              </span>
            </label>

            <label v-if="needsSetup" class="flex flex-col gap-2">
              <span
                class="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500"
              >
                Confirmar password
              </span>
              <input
                v-model="passwordConfirm"
                type="password"
                autocomplete="new-password"
                required
                :class="inputClass"
              />
            </label>

            <button
              type="submit"
              :disabled="loading"
              class="group flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-neutral-950 px-5 py-3.5 text-sm font-semibold uppercase tracking-[0.15em] text-white transition-[background-color,scale] duration-150 ease-out hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:not-disabled:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>{{ submitLabel }}</span>
              <svg
                v-if="!loading"
                aria-hidden="true"
                class="size-4 transition-transform duration-150 ease-out group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 20 20"
              >
                <path d="M4 10h11M11 5l5 5-5 5" />
              </svg>
            </button>

            <p
              v-if="error"
              class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {{ error }}
            </p>
          </form>

          <button
            v-if="needsSetup"
            type="button"
            class="focus-ring self-start rounded text-sm text-neutral-500 transition-colors duration-100 hover:text-neutral-900"
            @click="resetSetup"
          >
            ← Usar outro email
          </button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

// Larger variant of `.field-input` for the sign-in form.
const inputClass = "field-input rounded-lg px-4 py-3 text-base";

const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const needsSetup = ref(false);
const loading = ref(false);
const error = ref("");

const { fetch: refreshSession } = useUserSession();

const submitLabel = computed(() => {
  if (loading.value) {
    return needsSetup.value ? "A ativar…" : "A entrar…";
  }
  return needsSetup.value ? "Definir password" : "Entrar";
});

function resetSetup() {
  needsSetup.value = false;
  password.value = "";
  passwordConfirm.value = "";
  error.value = "";
}

async function handleSubmit() {
  loading.value = true;
  error.value = "";
  try {
    if (needsSetup.value) {
      if (password.value !== passwordConfirm.value) {
        error.value = "As passwords não coincidem.";
        return;
      }
      await $fetch("/api/claim-account", {
        body: { email: email.value, password: password.value },
        method: "POST",
      });
    } else {
      await $fetch("/api/login", {
        body: { email: email.value, password: password.value },
        method: "POST",
      });
    }
    await refreshSession();
    await navigateTo("/");
  } catch (submitError: unknown) {
    const statusCode = fetchErrorStatus(submitError);
    if (statusCode === 409) {
      needsSetup.value = true;
      password.value = "";
    } else {
      error.value = needsSetup.value
        ? "Não foi possível ativar a conta."
        : "Credenciais inválidas.";
    }
  } finally {
    loading.value = false;
  }
}
</script>
