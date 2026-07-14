export default defineNuxtRouteMiddleware((to) => {
  if (to.path === "/login") {
    return;
  }
  const { loggedIn } = useUserSession();
  if (!loggedIn.value) {
    return navigateTo("/login");
  }
});
