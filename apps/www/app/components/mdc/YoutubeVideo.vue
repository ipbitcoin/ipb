<template>
  <!-- Rendered from ::youtube-video{title link} blocks in article Markdown.
       YouTube's player weighs over 4 MB, so a poster stands in for it and
       the player only loads once the reader presses play. The focus ring
       sits on this frame: on the button, the poster would paint over it. -->
  <div
    class="not-prose relative my-10 aspect-video overflow-hidden rounded-2xl bg-neutral-950 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand"
  >
    <iframe
      v-if="playing || !videoId"
      ref="player"
      :src="playerUrl"
      :title="title"
      :loading="playing ? undefined : 'lazy'"
      allow="
        accelerometer;
        autoplay;
        clipboard-write;
        encrypted-media;
        gyroscope;
        picture-in-picture;
        web-share;
      "
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      class="absolute inset-0 size-full"
    />

    <button
      v-else
      type="button"
      class="group/video absolute inset-0 grid cursor-pointer place-items-center outline-hidden [-webkit-tap-highlight-color:transparent]"
      @click="play"
    >
      <!-- The one size every video has; a larger one can be missing, and
           its 404 would land in the console. Cropping to 16:9 trims the
           letterbox bars it comes with. -->
      <img
        :src="`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`"
        alt=""
        loading="lazy"
        decoding="async"
        class="absolute inset-0 size-full object-cover transition-[scale] duration-500 ease-out motion-safe:group-hover/video:scale-[1.03]"
      />
      <span class="sr-only">{{ $t("article.playVideo", { title }) }}</span>
      <span
        aria-hidden="true"
        class="relative grid size-16 place-items-center rounded-full bg-brand text-neutral-950 shadow-button-brand transition-[background-color,scale] duration-150 ease-out group-hover/video:bg-[#ffa31f] motion-safe:group-active/video:scale-[0.96] sm:size-18"
      >
        <IconPlay class="size-6 sm:size-7" />
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
interface YoutubeVideoProps {
  title: string;
  link: string;
}

const props = defineProps<YoutubeVideoProps>();

// The id in an embed, watch, Shorts or youtu.be link.
const VIDEO_ID =
  /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|watch\?v=)|youtu\.be\/)([\w-]{11})/;

const videoId = computed(() => VIDEO_ID.exec(props.link)?.[1] ?? null);

// Same player from YouTube's privacy-enhanced domain, keeping the link's own
// options such as a start time. A link of another shape is embedded as given.
const playerUrl = computed(() => {
  if (!videoId.value) {
    return props.link;
  }
  const options = new URLSearchParams(props.link.split("?")[1]);
  options.delete("v");
  // Pressing play on the poster should not take a second press in the player.
  options.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId.value}?${options}`;
});

const playing = ref(false);
const player = useTemplateRef<HTMLIFrameElement>("player");

async function play() {
  playing.value = true;
  await nextTick();
  // The button had focus and is gone: hand it to the player, so keyboard
  // users can pause or seek straight away.
  player.value?.focus();
}
</script>
