<template>
  <section
    id="connections"
    class="flex scroll-mt-8 flex-col gap-5 rounded-lg bg-white p-6 shadow-border"
    aria-labelledby="connections-heading"
  >
    <div class="flex flex-col gap-1">
      <h2 id="connections-heading" class="text-lg font-medium">Apps de IA</h2>
      <p class="text-sm text-pretty text-neutral-500">
        Ligue o Claude, o ChatGPT ou outra app com MCP para ler e gerir as
        tarefas. Cada app age em seu nome, com o acesso que lhe der.
      </p>
    </div>

    <div
      v-if="loadError"
      class="flex flex-wrap items-center gap-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      Não foi possível carregar as apps ligadas.
      <UiButton variant="outline" size="sm" @click="refresh()">
        Tentar de novo
      </UiButton>
    </div>

    <template v-else>
      <AdminField label="Endereço MCP" html-for="mcp-url">
        <div class="flex gap-2">
          <input
            id="mcp-url"
            :value="data?.url ?? ''"
            type="text"
            readonly
            class="field-input font-mono"
            @focus="(event) => selectAll(event)"
          />
          <UiButton
            variant="outline"
            size="sm"
            class="shrink-0 self-center"
            :disabled="!data"
            @click="copy('url', data?.url ?? '')"
          >
            {{ copied === "url" ? "Copiado" : "Copiar" }}
          </UiButton>
        </div>
      </AdminField>

      <AdminField label="No Claude Code" html-for="mcp-command">
        <div class="flex gap-2">
          <input
            id="mcp-command"
            :value="command"
            type="text"
            readonly
            class="field-input font-mono text-xs"
            @focus="(event) => selectAll(event)"
          />
          <UiButton
            variant="outline"
            size="sm"
            class="shrink-0 self-center"
            :disabled="!data"
            @click="copy('command', command)"
          >
            {{ copied === "command" ? "Copiado" : "Copiar" }}
          </UiButton>
        </div>
      </AdminField>
      <!-- The buttons' label changes silently; this says it out loud. -->
      <span class="sr-only" aria-live="polite">
        {{ copied ? "Copiado" : "" }}
      </span>

      <div class="flex flex-col gap-2">
        <h3 class="field-label">Ligadas</h3>
        <p v-if="!data" class="text-sm text-neutral-500">A carregar…</p>
        <p
          v-else-if="data.connections.length === 0"
          class="text-sm text-neutral-500"
        >
          Ainda nenhuma app ligada.
        </p>
        <ul v-else class="flex flex-col divide-y divide-neutral-100">
          <li
            v-for="connection in data.connections"
            :key="connection._id"
            class="flex items-center gap-3 py-3 first:pt-1 last:pb-0"
          >
            <span
              aria-hidden="true"
              class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-950 text-sm font-medium text-white"
            >
              {{ connection.name.trim().charAt(0).toUpperCase() || "?" }}
            </span>
            <div class="flex min-w-0 flex-1 flex-col gap-0.5">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm font-medium">
                  {{ connection.name }}
                </span>
                <span
                  class="shrink-0 rounded bg-neutral-950/5 px-1.5 py-px text-xs text-neutral-600"
                >
                  {{ connection.write ? "Ler e alterar" : "Ler" }}
                </span>
              </span>
              <span class="truncate text-xs text-neutral-500">
                {{ siteLabel(connection.site) }} · ligada a
                {{ formatDay(connection._creationTime) }} ·
                {{
                  connection.lastUsedAt
                    ? `usada ${timeAgo(connection.lastUsedAt)}`
                    : "ainda não usada"
                }}
              </span>
            </div>
            <UiButton
              variant="outline"
              size="sm"
              :loading="removing === connection._id"
              :disabled="removing !== undefined"
              @click="disconnect(connection)"
            >
              Desligar
            </UiButton>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";

interface Connection {
  _creationTime: number;
  _id: string;
  lastUsedAt?: number;
  name: string;
  site: string;
  write: boolean;
}

const {
  data,
  error: loadError,
  refresh,
} = useFetch<{
  connections: Connection[];
  url: string;
}>("/api/connections");
const { confirm } = useConfirm();

const command = computed(() =>
  data.value ? `claude mcp add --transport http ipb ${data.value.url}` : ""
);

const copied = ref<"url" | "command">();
const removing = ref<string>();
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

function selectAll(event: FocusEvent) {
  if (event.target instanceof HTMLInputElement) {
    event.target.select();
  }
}

async function copy(what: "url" | "command", text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copied.value = what;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = undefined;
    }, 2000);
  } catch {
    toast.error("Não foi possível copiar. Selecione o texto e copie-o.");
  }
}

onBeforeUnmount(() => clearTimeout(copiedTimer));

/** Where an app sends the admin back to; loopback means one on their computer. */
function siteLabel(site: string): string {
  return site === "localhost" ? "app local" : site;
}

const MONTH = new Intl.DateTimeFormat("pt-PT", { month: "short" });

/** "12 nov": when an app was connected, to tell two of the same apart. */
function formatDay(time: number): string {
  const date = new Date(time);
  return `${date.getDate()} ${MONTH.format(date).replace(".", "")}`;
}

const RELATIVE = new Intl.RelativeTimeFormat("pt-PT", { numeric: "auto" });
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
];

/** "há 3 horas", "ontem", "agora". */
function timeAgo(time: number): string {
  const elapsed = Date.now() - time;
  for (const [unit, size] of UNITS) {
    if (elapsed >= size) {
      return RELATIVE.format(-Math.floor(elapsed / size), unit);
    }
  }
  return "agora";
}

async function disconnect(connection: Connection) {
  const confirmed = await confirm({
    confirmLabel: "Desligar",
    danger: true,
    description:
      "Deixa de ter acesso de imediato. Pode voltar a ligá-la a qualquer momento.",
    title: `Desligar ${connection.name}?`,
  });
  if (!confirmed) {
    return;
  }
  removing.value = connection._id;
  try {
    await $fetch(`/api/connections/${connection._id}`, { method: "DELETE" });
    toast.success(`App desligada: ${connection.name}`);
    await refresh();
  } catch (error: unknown) {
    toast.error(fetchErrorMessage(error) ?? "Não foi possível desligar a app.");
  } finally {
    removing.value = undefined;
  }
}
</script>
