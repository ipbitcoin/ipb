<template>
  <main
    class="flex min-h-dvh flex-col items-center justify-center bg-neutral-50 px-4 py-12"
  >
    <div class="flex w-full max-w-md animate-fade-up flex-col gap-6">
      <img
        src="/logo.svg"
        alt="Instituto Bitcoin"
        class="h-8 w-auto self-start"
      />

      <section
        class="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-border sm:p-8"
        aria-live="polite"
      >
        <!-- Loading: the shape of the card, quietly. -->
        <div
          v-if="status === 'pending'"
          class="flex flex-col gap-4"
          aria-busy="true"
        >
          <div class="size-12 animate-pulse rounded-xl bg-neutral-100" />
          <div class="h-7 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div class="h-4 w-full animate-pulse rounded bg-neutral-100" />
          <span class="sr-only">A carregar…</span>
        </div>

        <div v-else-if="leaving" class="flex flex-col gap-2">
          <h1 class="text-2xl font-light tracking-tight">
            {{
              leaving === "allow"
                ? `${app?.name} está ligada`
                : "Pedido recusado"
            }}
          </h1>
          <p class="text-sm text-pretty text-neutral-500">
            {{
              leaving === "allow"
                ? "Se a app não abrir sozinha, volte a ela. Pode fechar este separador."
                : "Pode fechar este separador."
            }}
          </p>
        </div>

        <div v-else-if="!app" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h1 class="text-2xl font-light tracking-tight">
              Este pedido expirou
            </h1>
            <p class="text-sm text-pretty text-neutral-500">
              Os pedidos de ligação duram 10 minutos e só se usam uma vez. Volte
              a ligar a partir da app.
            </p>
          </div>
          <NuxtLink
            to="/profile"
            class="focus-ring self-start rounded text-sm font-medium text-neutral-900 underline underline-offset-4"
          >
            Ver apps ligadas
          </NuxtLink>
        </div>

        <template v-else>
          <div class="flex flex-col gap-5">
            <!-- The app and the admin, side by side. -->
            <div aria-hidden="true" class="flex items-center gap-3">
              <span
                class="flex size-12 items-center justify-center rounded-xl bg-neutral-950 text-lg font-medium text-white"
              >
                {{ initial }}
              </span>
              <span class="flex items-center gap-1 text-neutral-300">
                <span class="size-1 rounded-full bg-current" />
                <span class="size-1 rounded-full bg-current" />
                <span class="size-1 rounded-full bg-current" />
              </span>
              <span
                class="flex size-12 items-center justify-center rounded-xl bg-white shadow-border"
              >
                <img src="/favicon.png" alt="" class="size-7" />
              </span>
            </div>
            <div class="flex flex-col gap-2">
              <h1 class="text-2xl font-light tracking-tight text-balance">
                Ligar <span class="font-medium">{{ app.name }}</span> ao IPB
                Admin
              </h1>
              <p class="text-sm text-pretty text-neutral-500">
                A app vai agir em seu nome
                <template v-if="user">
                  (<span class="text-neutral-700">{{
                    user.username ?? user.email
                  }}</span
                  >)
                </template>
                e só com o acesso que escolher aqui. Pode desligá-la a qualquer
                momento no seu perfil.
              </p>
            </div>
          </div>

          <div
            class="flex flex-col gap-0.5 rounded-xl bg-neutral-950/3 px-4 py-3"
          >
            <p class="text-xs text-neutral-500">
              Depois de responder, volta para
            </p>
            <p class="truncate text-base font-medium text-neutral-900">
              {{ app.site }}
            </p>
          </div>

          <fieldset class="flex flex-col gap-2">
            <legend class="field-label mb-2">Acesso</legend>
            <label
              v-for="option in ACCESS"
              :key="String(option.write)"
              class="flex cursor-pointer items-start gap-3 rounded-xl p-3 shadow-border transition-shadow duration-150 has-checked:shadow-[0_0_0_2px_var(--color-brand)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
            >
              <input
                v-model="write"
                type="radio"
                name="access"
                :value="option.write"
                class="mt-0.5 size-4 shrink-0 accent-brand outline-none"
              />
              <span class="flex flex-col gap-0.5">
                <span class="text-sm font-medium text-neutral-900">
                  {{ option.label }}
                </span>
                <span class="text-sm text-neutral-500">
                  {{ option.description }}
                </span>
              </span>
            </label>
          </fieldset>

          <p
            v-if="error"
            role="alert"
            class="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {{ error }}
          </p>

          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <UiButton
              variant="outline"
              :disabled="answering !== undefined"
              :loading="answering === 'deny'"
              @click="answer('deny')"
            >
              Recusar
            </UiButton>
            <UiButton
              :disabled="answering !== undefined"
              :loading="answering === 'allow'"
              @click="answer('allow')"
            >
              Permitir
            </UiButton>
          </div>
        </template>
      </section>
    </div>
  </main>
</template>

<script setup lang="ts">
definePageMeta({ layout: false });

useHead({ title: "Ligar uma app · IPB Admin" });

const ACCESS = [
  {
    description: "Ver o quadro, as tarefas e as categorias.",
    label: "Ler tarefas",
    write: false,
  },
  {
    description: "Também criar, editar e apagar tarefas, e criar categorias.",
    label: "Ler e alterar tarefas",
    write: true,
  },
];

const route = useRoute();
const { user } = useUserSession();

const requestId = computed(() =>
  typeof route.query.request === "string" ? route.query.request : ""
);

const { data: app, status } = useFetch<{ name: string; site: string }>(
  "/api/oauth/consent",
  { query: { request: requestId } }
);

const initial = computed(
  () => app.value?.name.trim().charAt(0).toUpperCase() || "?"
);

const write = ref(false);
const answering = ref<"allow" | "deny">();
const leaving = ref<"allow" | "deny">();
const error = ref("");

async function answer(choice: "allow" | "deny") {
  answering.value = choice;
  error.value = "";
  try {
    const { redirect } = await $fetch<{ redirect: string | null }>(
      `/api/oauth/${choice === "allow" ? "approve" : "deny"}`,
      {
        body: { request: requestId.value, write: write.value },
        method: "POST",
      }
    );
    if (!redirect) {
      // Already answered or expired: show it as gone.
      app.value = undefined;
      return;
    }
    leaving.value = choice;
    globalThis.location.assign(redirect);
  } catch (answerError: unknown) {
    error.value =
      fetchErrorMessage(answerError) ?? "Não foi possível responder à app.";
  } finally {
    answering.value = undefined;
  }
}
</script>
