<template>
  <svg
    :aria-hidden="$attrs['aria-label'] ? undefined : 'true'"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
    stroke-width="2"
    stroke="currentColor"
  >
    <!-- Sits right of center on purpose: centered on its box, a triangle
         looks pushed back toward its flat side. -->
    <path stroke-linejoin="round" d="M8 5.5v13L19 12z" />
  </svg>
</template>
