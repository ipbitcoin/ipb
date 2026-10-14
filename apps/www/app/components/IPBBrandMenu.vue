<template>
  <PopoverRoot v-model:open="isOpen">
    <!-- Right-click opens the menu; a plain click still follows the link. -->
    <div
      ref="anchor"
      class="flex shrink-0"
      @contextmenu="onContextMenu"
      @click="isOpen = false"
    >
      <slot />
    </div>
    <PopoverAnchor as="template" :reference="anchor ?? undefined" />

    <PopoverPortal>
      <PopoverContent
        side="bottom"
        align="start"
        :side-offset="8"
        :align-offset="-10"
        :collision-padding="12"
        :aria-label="t('brand.title')"
        class="z-60 flex w-80 origin-(--reka-popover-content-transform-origin) flex-col rounded-2xl bg-white p-1.5 shadow-popover outline-none data-[state=closed]:animate-scale-out data-[state=open]:animate-scale-in motion-reduce:data-[state=closed]:animate-fade-out motion-reduce:data-[state=open]:animate-fade-in"
        @interact-outside="onInteractOutside"
        @close-auto-focus="onCloseAutoFocus"
      >
        <div class="grid grid-cols-2 gap-1">
          <button
            v-for="asset in COPY_ASSETS"
            :key="asset.key"
            type="button"
            class="group/tile flex cursor-pointer flex-col rounded-[10px] p-1 text-left transition-[background-color,scale] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-black/4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-safe:active:scale-[0.98]"
            @click="copy(asset)"
          >
            <!-- Preview and confirmation share one cell and cross-fade. -->
            <span
              aria-hidden="true"
              class="grid h-20 place-items-center rounded-md bg-neutral-50 ring-1 ring-black/6 ring-inset"
            >
              <span
                class="transition-[opacity,scale,filter] duration-300 ease-swap [grid-area:1/1]"
                :class="copiedKey === asset.key ? SWAP_OUT : SWAP_IN"
              >
                <IPBLogo v-if="asset.key === 'logo'" class="h-9 w-auto" />
                <svg
                  v-else
                  class="h-9 w-auto"
                  viewBox="0 0 80 130"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M35.085 0.535156C54.1499 0.535156 69.605 15.9907 69.605 35.0557C69.605 46.2526 64.2729 56.2026 56.0107 62.5098C69.65 67.121 79.468 80.024 79.468 95.22C79.468 114.285 64.013 129.74 44.9482 129.74H23.249V62.6719H0.535156V0.535156H35.085Z"
                    fill="#F29500"
                  />
                </svg>
              </span>
              <span
                class="flex items-center gap-1.5 text-[13px] font-medium text-neutral-950 transition-[opacity,scale,filter] duration-300 ease-swap [grid-area:1/1]"
                :class="copiedKey === asset.key ? SWAP_IN : SWAP_OUT"
              >
                <span
                  class="grid size-4.5 place-items-center rounded-full bg-neutral-950 text-white"
                >
                  <!-- The tick draws itself in once the badge has landed. -->
                  <svg class="size-3" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3.5 8.5L6.5 11.5L12.5 4.5"
                      pathLength="1"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-dasharray="1 2"
                      class="transition-[stroke-dashoffset] ease-out motion-reduce:transition-none"
                      :class="
                        copiedKey === asset.key
                          ? 'delay-100 duration-300 [stroke-dashoffset:0]'
                          : 'duration-150 [stroke-dashoffset:1.1]'
                      "
                    />
                  </svg>
                </span>
                {{ t("brand.copied") }}
              </span>
            </span>
            <span
              class="px-1.5 pt-2 pb-1 text-[13px] font-medium text-neutral-600 transition-colors duration-150 ease-out group-hover/tile:text-neutral-950"
            >
              {{ t(asset.label) }}
            </span>
          </button>
        </div>

        <div aria-hidden="true" class="-mx-1.5 my-1.5 h-px bg-black/6" />

        <a
          :href="ASSETS_ZIP"
          download
          class="flex h-9 items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] font-medium text-neutral-600 transition-[background-color,color] duration-150 ease-out [-webkit-tap-highlight-color:transparent] hover:bg-black/4 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          @click="isOpen = false"
        >
          <IconDownload class="size-4" />
          {{ t("brand.download") }}
          <span class="ml-auto font-mono text-[11px] text-neutral-400">
            ZIP
          </span>
        </a>

        <span class="sr-only" aria-live="polite">
          {{ copiedKey ? t("brand.copied") : "" }}
        </span>
      </PopoverContent>
    </PopoverPortal>
  </PopoverRoot>
</template>

<script setup lang="ts">
type BrandAssetKey = "logo" | "symbol";

interface CopyAsset {
  key: BrandAssetKey;
  label: string;
  src: string;
}

const COPY_ASSETS: CopyAsset[] = [
  { key: "logo", label: "brand.copyLogo", src: "/brand/ipb-logo.svg" },
  { key: "symbol", label: "brand.copySymbol", src: "/brand/ipb-symbol.svg" },
];

// The files in public/brand, zipped by hand: rebuild it when they change.
const ASSETS_ZIP = "/brand/ipb-brand-assets.zip";

// Scale and blur only run when the user allows motion; opacity always fades.
const SWAP_IN = "opacity-100 motion-safe:scale-100 motion-safe:blur-[0px]";
const SWAP_OUT = "opacity-0 motion-safe:scale-90 motion-safe:blur-[3px]";

const { t } = useI18n();
const { $toast } = useNuxtApp();

const isOpen = ref(false);
const anchor = useTemplateRef<HTMLDivElement>("anchor");
let dismissedOutside = false;

function onContextMenu(event: MouseEvent) {
  // A second right-click falls through to the browser's own menu, so
  // "Open in new tab" and the like stay within reach.
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }
  event.preventDefault();
  isOpen.value = true;
}

// Presses on the logo are its own: a click closes the menu and a right-click
// toggles it. A press anywhere else closes it and keeps focus where it landed.
function onInteractOutside(event: Event) {
  if (event.target instanceof Node && anchor.value?.contains(event.target)) {
    event.preventDefault();
    return;
  }
  dismissedOutside = true;
}

// With no trigger button, reka has nowhere to return focus to: send it back to
// the logo link after Escape or a download.
function onCloseAutoFocus(event: Event) {
  event.preventDefault();
  if (!dismissedOutside) {
    anchor.value?.querySelector("a")?.focus({ preventScroll: true });
  }
  dismissedOutside = false;
}

// SVG markup by path. Loaded as the menu opens, so a click can write it to the
// clipboard straight away: Safari only allows that within the click itself.
const sources = new Map<string, string>();

async function loadSource(src: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Could not load ${src}: ${response.status}`);
  }
  const text = await response.text();
  sources.set(src, text);
  return text;
}

const copiedKey = ref<BrandAssetKey | null>(null);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

async function copy(asset: CopyAsset) {
  try {
    await navigator.clipboard.writeText(
      sources.get(asset.src) ?? (await loadSource(asset.src))
    );
  } catch {
    $toast.error(t("brand.copyFailed"));
    return;
  }
  copiedKey.value = asset.key;
  clearTimeout(copiedTimer);
  copiedTimer = setTimeout(() => {
    copiedKey.value = null;
  }, 2000);
}

watch(isOpen, (open) => {
  if (!open) {
    return;
  }
  copiedKey.value = null;
  clearTimeout(copiedTimer);
  for (const asset of COPY_ASSETS) {
    if (!sources.has(asset.src)) {
      // A failed load is retried by the click itself.
      loadSource(asset.src).catch(() => {});
    }
  }
});

onBeforeUnmount(() => clearTimeout(copiedTimer));
</script>
