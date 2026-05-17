<template>
  <div ref="menuRef" class="user-menu" :class="{'user-menu--open': open}">
    <button
      class="user-menu-trigger"
      type="button"
      :aria-label="t('common.user')"
      @click="toggleOpen"
    >
      <span class="user-avatar user-avatar--header">민</span>
      <span class="user-menu-name">민우 송</span>
      <ChevronDownIcon class="user-menu-chevron-icon" />
    </button>

    <transition name="menu-pop">
      <section v-if="open" class="user-menu-panel" role="menu">
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('notice')"
        >
          <strong>{{ t("common.notice") }}</strong>
          <small>{{ t("menu.noticeSummary") }}</small>
        </button>
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('personalization')"
        >
          <strong>{{ t("common.personalization") }}</strong>
          <small>{{ t("menu.personalizationSummary") }}</small>
        </button>
        <button
          class="user-menu-item"
          type="button"
          role="menuitem"
          @click="select('playground')"
        >
          <strong>{{ t("common.playground") }}</strong>
          <small>{{ t("menu.playgroundSummary") }}</small>
        </button>

        <div
          class="user-menu-language"
          role="group"
          :aria-label="t('common.language')"
        >
          <button
            class="user-menu-item user-menu-item--language"
            type="button"
            :aria-expanded="languageOpen"
            @click="toggleLanguageOpen"
          >
            <span>
              <strong>{{ t("common.language") }}</strong>
              <small>{{ t("menu.languageSummary") }}</small>
            </span>
            <ChevronDownIcon />
          </button>

          <transition name="menu-pop">
            <div v-if="languageOpen" class="user-menu-language-options">
              <button
                v-for="option in languageOptions"
                :key="option.value"
                class="user-menu-language-option"
                :class="{active: currentLocale === option.value}"
                type="button"
                @click="selectLocale(option.value)"
              >
                <span>{{ option.label }}</span>
                <CheckIcon v-if="currentLocale === option.value" />
              </button>
            </div>
          </transition>
        </div>
      </section>
    </transition>
  </div>
</template>

<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import ChevronDownIcon from "@/components/icons/ChevronDownIcon.vue";
import CheckIcon from "@/components/icons/CheckIcon.vue";
import {setAppLocale} from "@/i18n";
import {useOutsideClick} from "@/composables/useOutsideClick";

// 모듈 의존성을 모두 불러온 뒤, 아래에서 화면 상태와 실행 로직을 구성합니다.
const emit = defineEmits(["notice", "personalization", "playground"]);
const {t, locale} = useI18n();
const open = ref(false);
const languageOpen = ref(false);
const menuRef = ref(null);
const currentLocale = computed(() => locale.value);
const languageOptions = computed(() => [
  {value: "ko", label: t("common.korean")},
  {value: "en", label: t("common.english")},
]);

/**
 * @description toggleOpen 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function toggleOpen() {
  open.value = !open.value;
  // 조건을 먼저 검증하여 불필요한 후속 처리를 방지합니다.
  if (!open.value) languageOpen.value = false;
}

/**
 * @description toggleLanguageOpen 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {void} voidParam - 별도 입력값 없이 실행됩니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function toggleLanguageOpen() {
  languageOpen.value = !languageOpen.value;
}

/**
 * @description select 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} action - action 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function select(action) {
  open.value = false;
  languageOpen.value = false;
  emit(action);
}

/**
 * @description selectLocale 함수의 입력값, 상태값, 이벤트 흐름을 처리합니다.
 * @param {*} value - value 입력값입니다.
 * @returns {*} 함수 실행 결과를 반환하며, 반환값이 없는 경우 undefined를 반환합니다.
 */
function selectLocale(value) {
  setAppLocale(value);
  open.value = false;
  languageOpen.value = false;
}

useOutsideClick(
  () => menuRef.value,
  () => {
    open.value = false;
    languageOpen.value = false;
  }
);
</script>
