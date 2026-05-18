import {computed} from "vue";
import {DEFAULT_FALLBACK_MODEL, PROMPT_MENU_TYPE} from "@/constants/promptComposer";

/**
 * @description 모델 목록 관리, 모델 선택 메뉴 열기/닫기, 모델 선택을 처리합니다.
 * @param {object} options - props, modelMenuOpen ref, syncViewportMode 함수, closeMenus 함수, emit 함수
 * @returns {object} 모델 관련 상태 및 핸들러
 */
export function usePromptModel({props, modelMenuOpen, syncViewportMode, toggleMenu, emit}) {
  const fallbackModels = computed(() => [
    {id: props.modelValue, ...DEFAULT_FALLBACK_MODEL},
  ]);

  const currentModels = computed(() =>
    props.models.length ? props.models : fallbackModels.value
  );

  const currentModel = computed(
    () =>
      currentModels.value.find((model) => model.id === props.modelValue) ||
      currentModels.value[0]
  );

  function openModelSelector() {
    if (props.disabled || props.modelReadonly) return;
    syncViewportMode();
    toggleMenu(PROMPT_MENU_TYPE.model);
  }

  function selectModel(id) {
    emit("update:modelValue", id);
    modelMenuOpen.value = false;
  }

  return {
    currentModels,
    currentModel,
    openModelSelector,
    selectModel,
  };
}
