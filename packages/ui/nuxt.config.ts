import { join } from "node:path";

const currentDir = import.meta.dirname;

// Nuxt layer: shared UI components + theme for apps/www and apps/admin.
export default defineNuxtConfig({
  components: [{ path: join(currentDir, "./components"), pathPrefix: true }],
});
