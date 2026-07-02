<template>
  <div
    class="app-container app-container--mobile app-container--compact app-container--compact-browser"
    :class="containerClasses"
    data-layout="mobile"
  >
    <slot />
  </div>
</template>

<script setup>
/**
 * @file containers/AppContainer.vue
 * @description 모바일 전용 최상위 컨테이너입니다.
 */

import {computed, watch, watchEffect} from "vue";
import {useAppBootstrap} from "@/composables/app/useAppBootstrap";
import {shouldUseServerApi} from "@/constants/apiMode";
import {useAuthStore} from "@/stores/authStore";
import {useRoute} from "vue-router";
import {useOverlayScrollPolicy} from "@/composables/ui/useOverlayScrollPolicy";

const appBootstrap = useAppBootstrap();
const authStore = useAuthStore();
const route = useRoute();


const {isActualAndroidRuntime} = useOverlayScrollPolicy();

function shouldBootstrapAppForRoute(targetRoute) {
  if (!targetRoute) return false;
  if (targetRoute.meta?.skipAuthCheck) return false;
  return targetRoute.matched?.some((record) => record.meta?.requireAuth);
}

function canStartAppBootstrap(targetRoute) {
  if (!shouldBootstrapAppForRoute(targetRoute)) return false;

  if (shouldUseServerApi()) {
    if (authStore.authChecked && !authStore.isAuthenticated) return false;
    if (!authStore.isAuthenticated) return false;
  }

  return true;
}

function startAppBootstrapIfAllowed(targetRoute = route) {
  if (!canStartAppBootstrap(targetRoute)) return;
  appBootstrap.initialize().catch(() => {});
}

watch(
  () => [route.fullPath, authStore.authChecked, authStore.isAuthenticated],
  () => {
    startAppBootstrapIfAllowed(route);
  },
  {immediate: true}
);

function syncMobileRuntimeClasses({isAndroidRuntime, useOverlayScrollbar}) {
  if (typeof document === "undefined") return;

  const roots = [document.documentElement, document.body].filter(Boolean);

  roots.forEach((root) => {
    root.classList.add("mobile-only-runtime");
    root.classList.add("compact-runtime");
    root.classList.toggle("actual-android-runtime", isAndroidRuntime);
    root.classList.toggle("native-scroll-runtime", !useOverlayScrollbar);
    root.classList.toggle("overlay-scroll-runtime", useOverlayScrollbar);
    root.dataset.actualRuntimeScroll = useOverlayScrollbar
      ? "overlay"
      : "native";
  });
}

watchEffect(() => {
  syncMobileRuntimeClasses({
    isAndroidRuntime: isActualAndroidRuntime.value,
    useOverlayScrollbar: true,
  });
});

const containerClasses = computed(() => ({
  "app-container--actual-android-runtime": isActualAndroidRuntime.value,
  "app-container--overlay-scroll-runtime": true,
}));
</script>
