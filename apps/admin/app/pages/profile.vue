<template>
  <div class="flex max-w-xl flex-col gap-6">
    <h1 class="text-3xl font-light">Perfil</h1>

    <form
      class="flex flex-col gap-5 rounded-lg bg-white p-6 shadow-border"
      @submit.prevent="save"
    >
      <AdminField label="Email">
        <p class="py-1 text-sm text-neutral-600">{{ profile?.email }}</p>
      </AdminField>

      <AdminField
        label="Username"
        required
        hint="2-30 caracteres: letras, números, . _ -"
        html-for="profile-username"
      >
        <input
          id="profile-username"
          v-model="username"
          type="text"
          required
          class="field-input"
        />
      </AdminField>

      <AdminField label="Fotografia">
        <AdminMediaUpload v-model="avatarKey" accept="image/*" />
      </AdminField>

      <p
        v-if="error"
        class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <div class="border-t border-neutral-100 pt-5">
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
