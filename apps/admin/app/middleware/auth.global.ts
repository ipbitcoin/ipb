export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/login") {
    return;
  }
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    // Signed in, they land back where they were headed, like an app's
    // consent page.
    return navigateTo(
      to.fullPath === "/"
        ? "/login"
        : { path: "/login", query: { redirect: to.fullPath } }
    );
  }
});
