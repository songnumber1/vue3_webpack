import {ref} from "vue";

export function useChatMobileState({isCompactScreen}) {
  const isMobile = ref(false);

  function updateMobileState() {
    isMobile.value = Boolean(
      isCompactScreen.value || document.querySelector(".app-container--mobile")
    );
  }

  return {
    isMobile,
    updateMobileState,
  };
}
