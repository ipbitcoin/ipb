<template>
  <div class="flex max-w-xl flex-col gap-6">
    <h1 class="text-3xl font-light">Perfil</h1>

    <form
      class="flex flex-col gap-4 rounded border bg-white p-6"
      @submit.prevent="save"
    >
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Email</label>
        <p class="text-sm text-neutral-600">{{ profile?.email }}</p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">
          Username<span class="text-red-600">*</span>
          <span class="ml-2 text-xs font-normal text-neutral-500">
            2-30 caracteres: letras, números, . _ -
          </span>
        </label>
        <input
          v-model="username"
          type="text"
          required
          class="rounded border bg-white px-2 py-1.5"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium">Fotografia</label>
        <AdminMediaUpload v-model="avatarKey" accept="image/*" />
      </div>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div>
        <UiButton type="submit" :loading="saving">Guardar</UiButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

interface Profile {
  avatarKey: string | null;
  email: string;
  username: string | null;
}

const { data: profile } = await useFetch<Profile>("/api/profile");
const { fetch: refreshSession } = useUserSession();

const username = ref(profile.value?.username ?? "");
const avatarKey = ref<string | undefined>(
  profile.value?.avatarKey ?? undefined
);
const saving = ref(false);
const error = ref("");

async function save() {
  saving.value = true;
  error.value = "";
  try {
    await $fetch("/api/profile", {
      body: { avatarKey: avatarKey.value, username: username.value },
      method: "PUT",
    });
    await refreshSession();
    toast.success("Perfil guardado.");
  } catch (saveError: unknown) {
    error.value = fetchErrorMessage(saveError) ?? "Erro ao guardar.";
  } finally {
    saving.value = false;
  }
}
</script>
