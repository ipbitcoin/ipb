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
      >
        <!-- Loading: the shape of the card, quietly. -->
        <div
          v-if="view === 'loading'"
          class="flex flex-col gap-4"
          aria-busy="true"
        >
          <div class="size-12 animate-pulse rounded-xl bg-neutral-100" />
          <div class="h-7 w-3/4 animate-pulse rounded bg-neutral-100" />
          <div class="h-4 w-full animate-pulse rounded bg-neutral-100" />
          <span class="sr-only">A carregar…</span>
        </div>

        <!-- Answered, expired, refused or failed: a heading, a line, maybe an action. -->
        <div v-else-if="notice" class="flex flex-col gap-4">
          <div class="flex flex-col gap-2">
            <h1
              ref="heading"
              tabindex="-1"
              class="text-2xl font-light tracking-tight outline-none"
            >
              {{ notice.title }}
            </h1>
            <p class="text-sm text-pretty text-neutral-500">
              {{ notice.body }}
            </p>
          </div>
          <UiButton
            v-if="view === 'failed'"
            variant="outline"
            size="sm"
            class="self-start"
            @click="refresh()"
          >
            Tentar de novo
          </UiButton>
          <NuxtLink
            v-else-if="view === 'expired'"
            to="/profile#connections"
            class="focus-ring self-start rounded text-sm font-medium text-neutral-900 underline underline-offset-4"
          >
            Ver apps ligadas
          </NuxtLink>
        </div>

        <template v-else-if="app">
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

          <!-- Where the code goes is what's checked; the name is the app's
               own claim, so it never shows alone. -->
          <div
            class="flex flex-col gap-0.5 rounded-xl bg-neutral-950/3 px-4 py-3"
          >
            <p class="text-xs text-neutral-700">
              Depois de responder, segue para
            </p>
            <p class="text-base font-medium break-all text-neutral-900">
              {{ siteLabel }}
            </p>
            <p class="mt-1 text-xs text-pretty text-neutral-500">
              O nome “{{ app.name }}” é indicado pela própria app. Confirme que
              este destino é o dela.
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
    description:
      "Ver as tarefas e as ideias das redes sociais, com as suas categorias e etiquetas, e os nomes da equipa.",
    label: "Ler tarefas e ideias",
    write: false,
  },
  {
    description:
      "Também criar, editar e apagar tarefas, criar e editar ideias, e criar categorias e etiquetas.",
    label: "Ler e alterar tarefas e ideias",
    write: true,
  },
];

/** Requests the server turned away before showing them (server/utils/oauth.ts). */
const REFUSED: Record<string, { title: string; body: string }> = {
  bad_redirect: {
    body: "Esta app pediu para voltar a um endereço que não registou, por isso o pedido foi recusado.",
    title: "Endereço de regresso inválido",
  },
  bad_request: {
    body: "A app enviou um pedido de ligação incompleto ou inválido. Volte a tentar a partir da app.",
    title: "Pedido inválido",
  },
  unknown_app: {
    body: "Esta app não está registada no IPB Admin. Volte a ligar a partir da app.",
    title: "App desconhecida",
  },
};

const route = useRoute();
const { user, clear } = useUserSession();

const refused = computed(() =>
  typeof route.query.error === "string" ? REFUSED[route.query.error] : undefined
);
const requestId = computed(() =>
  typeof route.query.request === "string" ? route.query.request : ""
);

const {
  data: app,
  error: loadError,
  refresh,
  status,
} = useFetch<{ name: string; site: string }>("/api/oauth/consent", {
  immediate: !refused.value && requestId.value !== "",
  query: { request: requestId },
});

const write = ref(false);
const answering = ref<"allow" | "deny">();
const leaving = ref<"allow" | "deny">();
/** The request went while the page was open: answered elsewhere or expired. */
const gone = ref(false);
const error = ref("");

type View = "loading" | "ask" | "leaving" | "expired" | "failed" | "refused";

const view = computed((): View => {
  if (refused.value) {
    return "refused";
  }
  if (leaving.value) {
    return "leaving";
  }
  if (gone.value || requestId.value === "") {
    return "expired";
  }
  if (status.value === "pending") {
    return "loading";
  }
  if (loadError.value) {
    return fetchErrorStatus(loadError.value) === 404 ? "expired" : "failed";
  }
  return app.value ? "ask" : "loading";
});

const notice = computed(() => {
  switch (view.value) {
    case "refused": {
      return refused.value;
    }
    case "leaving": {
      return leaving.value === "allow"
        ? {
            body: `${app.value?.name ?? "A app"} já tem acesso. Se a app não abrir sozinha, volte a ela. Pode fechar este separador.`,
            title: "Ligação concluída",
          }
        : {
            body: "A app não ficou com acesso. Pode fechar este separador.",
            title: "Pedido recusado",
          };
    }
    case "expired": {
      return {
        body: "Os pedidos de ligação duram 10 minutos e só se usam uma vez. Volte a ligar a partir da app.",
        title: "Este pedido expirou",
      };
    }
    case "failed": {
      return {
        body: "Verifique a ligação à internet e tente de novo.",
        title: "Não foi possível carregar o pedido",
      };
    }
    default: {
      return null;
    }
  }
});

const initial = computed(
  () => app.value?.name.trim().charAt(0).toUpperCase() || "?"
);

// An app on the admin's own computer goes back over loopback.
const siteLabel = computed(() =>
  app.value?.site === "localhost"
    ? "uma app neste dispositivo"
    : app.value?.site
);

// When the card turns into a notice, the button that was focused is gone:
// focus moves to the notice's heading, which screen readers then read.
const heading = useTemplateRef<HTMLElement>("heading");
watch(view, async (next, previous) => {
  if (previous && notice.value) {
    await nextTick();
    heading.value?.focus();
  }
});

/** The session ended meanwhile: sign in again, then come back here. */
async function signInAgain() {
  await clear();
  await navigateTo({ path: "/login", query: { redirect: route.fullPath } });
}

watch(loadError, (failure) => {
  if (failure && fetchErrorStatus(failure) === 401) {
    signInAgain();
  }
});

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
      gone.value = true;
      return;
    }
    leaving.value = choice;
    globalThis.location.assign(redirect);
  } catch (answerError: unknown) {
    if (fetchErrorStatus(answerError) === 401) {
      await signInAgain();
      return;
    }
    error.value =
      fetchErrorMessage(answerError) ?? "Não foi possível responder à app.";
  } finally {
    answering.value = undefined;
  }
}
</script>
