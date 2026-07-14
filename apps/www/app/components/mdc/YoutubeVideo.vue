<template>
  <div>
    <iframe
      width="100%"
      :src="props.link"
      :title="props.title"
      frameborder="0"
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
      class="aspect-video"
    />
  </div>
</template>

<script setup lang="ts">
interface YoutubeVideoProps {
  title: string;
  link: string;
}

const props = defineProps<YoutubeVideoProps>();
</script>
