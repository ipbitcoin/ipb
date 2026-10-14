<template>
  <!-- Clipped at the horizon only, so a hovered coin can rise above its cell.
       Each layer owns one motion: the body sets with the scroll, the face
       lifts and tilts under the pointer, and the image rises on load. -->
  <div
    class="relative aspect-2/1 w-full max-w-44 [clip-path:inset(-50%_-25%_0_-25%)]"
    @pointermove="tilt"
    @pointerleave="resetTilt"
  >
    <div
      class="sunset absolute inset-x-0 top-0 aspect-square"
      :style="{ '--coin-index': index }"
    >
      <Motion
        as="div"
        class="relative size-full transition-[translate] ease-out"
        :class="
          active ? 'duration-500 motion-safe:translate-y-[-8%]' : 'duration-300'
        "
        :style="{ rotateX, rotateY, transformPerspective: 600 }"
      >
        <img
          v-if="vector"
          :src="src"
          alt=""
          width="176"
          height="176"
          class="rise absolute inset-0 size-full"
          :style="{ '--enter-delay': delay }"
        />
        <NuxtImg
          v-else
          :src="src"
          alt=""
          width="320"
          height="320"
          densities="x1"
          class="rise absolute inset-0 size-full"
          :style="{ '--enter-delay': delay }"
        />

        <!-- A glint crosses the metal as the coin comes up. It only animates
             on the way in; leaving snaps it back out of sight. -->
        <span
          class="absolute inset-0 overflow-hidden rounded-full motion-reduce:hidden"
        >
          <span
            class="absolute inset-y-0 -left-1/2 w-1/2 bg-linear-100 from-transparent from-20% via-white/90 to-transparent to-80% mix-blend-overlay"
            :class="
              active
                ? 'translate-x-[300%] transition-[translate] duration-700 ease-in-out'
                : ''
            "
          />
        </span>
      </Motion>
    </div>
  </div>
</template>

<script setup lang="ts">
import useReducedMotion from "~/composables/useReducedMotion";

defineProps<{
  /** Raised by hovering the coin or its label. */
  active: boolean;
  /** Delay before the coin rises on load, as a CSS time. */
  delay: string;
  /** Position on the timeline; staggers the sunset. */
  index: number;
  src: string;
  /** Vector already: the image optimizer would only rasterize it. */
  vector?: boolean;
}>();

// How far, in degrees, the coin leans at the very edge of its cell.
const MAX_TILT = 14;
// Slightly underdamped: the coin settles with a hint of follow-through.
const SPRING = { damping: 15, stiffness: 150 };

const rotateX = useSpring(0, SPRING);
const rotateY = useSpring(0, SPRING);
const reducedMotion = useReducedMotion();

// The coin gives way under the pointer, as if pressed where it is touched.
// Measured on the cell, which never moves, so the tilt cannot feed back on
// itself.
function tilt(event: PointerEvent) {
  if (
    event.pointerType !== "mouse" ||
    reducedMotion.value ||
    !(event.currentTarget instanceof HTMLElement)
  ) {
    return;
  }
  const rect = event.currentTarget.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width - 0.5;
  const y = (event.clientY - rect.top) / rect.height - 0.5;
  rotateX.set(-y * 2 * MAX_TILT);
  rotateY.set(x * 2 * MAX_TILT);
}

function resetTilt() {
  rotateX.set(0);
  rotateY.set(0);
}
</script>
