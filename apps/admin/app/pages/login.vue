<template>
  <div class="flex min-h-screen items-center justify-center">
    <form
      class="flex w-80 flex-col gap-4 rounded border bg-white p-8"
      @submit.prevent="handleSubmit"
    >
      <h1 class="text-xl font-bold uppercase tracking-wider">IPB Admin</h1>

      <label class="flex flex-col gap-1 text-sm">
        Email
        <input
          v-model="email"
          type="email"
          required
          class="rounded border px-2 py-1.5"
        />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        {{ needsSetup ? "Nova password (mín. 10 caracteres)" : "Password" }}
        <input
          v-model="password"
          type="password"
          required
          :minlength="needsSetup ? 10 : 1"
          class="rounded border px-2 py-1.5"
        />
      </label>
      <label v-if="needsSetup" class="flex flex-col gap-1 text-sm">
        Confirmar password
        <input
          v-model="passwordConfirm"
          type="password"
          required
          class="rounded border px-2 py-1.5"
        />
      </label>

      <p v-if="needsSetup" class="text-sm text-neutral-600">
        Primeira entrada — define a tua password para ativar a conta.
      </p>
      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <UiButton type="submit" :loading="loading">
        {{ needsSetup ? "Definir password" : "Entrar" }}
      </UiButton>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

const email = ref("");
const password = ref("");
const passwordConfirm = ref("");
const needsSetup = ref(false);
const loading = ref(false);
const error = ref("");

const { fetch: refreshSession } = useUserSession();

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
