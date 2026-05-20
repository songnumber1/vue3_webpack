<template>
  <form class="system-settings-view" @submit.prevent="apply">
    <div class="system-settings-scroll">
      <section class="system-settings-hero">
        <p class="system-settings-eyebrow">시스템</p>
        <h3>앱 동작 설정</h3>
        <p>
          화면 노출, API 사용 여부, 모바일 기준값을 한 곳에서 조정합니다.
          적용을 누르면 즉시 저장되고 다음 화면 동작부터 반영됩니다.
        </p>
      </section>

      <section
        v-for="group in groups"
        :key="group.title"
        class="system-settings-group"
      >
        <header>
          <span>{{ group.kicker }}</span>
          <h4>{{ group.title }}</h4>
        </header>

        <label
          v-for="item in group.items"
          :key="item.key"
          class="system-settings-row"
          :for="`system-setting-${item.key}`"
        >
          <span class="system-settings-copy">
            <strong>{{ item.label }}</strong>
            <small>{{ item.description }}</small>
          </span>

          <input
            v-if="item.type === 'number'"
            :id="`system-setting-${item.key}`"
            v-model.number="draft[item.key]"
            class="system-settings-number"
            type="number"
            min="320"
            max="1440"
            step="1"
          />
          <span v-else class="system-settings-switch">
            <input
              :id="`system-setting-${item.key}`"
              v-model="draft[item.key]"
              type="checkbox"
            />
            <span aria-hidden="true"></span>
          </span>
        </label>
      </section>
    </div>

    <footer class="system-settings-footer">
      <button
        class="playground-button playground-button--secondary"
        type="button"
        @click="$emit('close')"
      >
        닫기
      </button>
      <button
        class="playground-button playground-button--primary system-settings-apply-button"
        type="submit"
      >
        적용
      </button>
    </footer>
  </form>
</template>

<script setup>
import {computed, reactive, watch} from "vue";
import {storeToRefs} from "pinia";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {DEFAULT_SYSTEM_SETTINGS} from "@/constants/systemSettings";

const emit = defineEmits(["close", "applied"]);
const systemSettingsStore = useSystemSettingsStore();
const {settings} = storeToRefs(systemSettingsStore);

const draft = reactive({...DEFAULT_SYSTEM_SETTINGS});

const groups = computed(() => [
  {
    kicker: "API",
    title: "API",
    items: [
      {
        key: "useRealApi",
        type: "switch",
        label: "실제 api 통신",
        description: "끄면 프론트엔드 mock 데이터를 사용합니다.",
      },
    ],
  },
  {
    kicker: "MOBILE",
    title: "모바일",
    items: [
      {
        key: "mobileBreakpoint",
        type: "number",
        label: "모바일 반응형",
        description: "모바일 모드로 전환할 기준 너비(px)입니다.",
      },
      {
        key: "useVirtualKeyboard",
        type: "switch",
        label: "가상 키보드 사용",
        description: "모바일 키보드 보정 로직 사용 여부입니다.",
      },
      {
        key: "useMicrophone",
        type: "switch",
        label: "마이크 사용",
        description: "프롬프트 입력 영역의 음성 버튼 노출 여부입니다.",
      },
      {
        key: "showMobileApiProgress",
        type: "switch",
        label: "API 진행 표시",
        description: "모바일 API 통신 중 전체 화면 터치를 막는 진행 표시 사용 여부입니다.",
      },
    ],
  },
  {
    kicker: "ACTION",
    title: "사용자 액션",
    items: [
      {
        key: "showGuideButton",
        type: "switch",
        label: "가이드 버튼 화면 출력",
        description: "헤더와 모바일 설정의 가이드 진입 버튼을 제어합니다.",
      },
      {
        key: "showThemeButton",
        type: "switch",
        label: "테마 버튼 출력",
        description: "테마 전환 버튼 노출 여부입니다.",
      },
      {
        key: "showSwaggerButton",
        type: "switch",
        label: "swagger 버튼 출력",
        description: "Swagger 문서 버튼 노출 여부입니다.",
      },
    ],
  },
  {
    kicker: "MENU",
    title: "사용자 메뉴",
    items: [
      {
        key: "showNoticeMenu",
        type: "switch",
        label: "공지 사항 출력",
        description: "사용자 메뉴와 모바일 설정의 공지 사항 노출 여부입니다.",
      },
      {
        key: "showPrivacyMenu",
        type: "switch",
        label: "개인정보 처리 방침 출력",
        description: "개인정보 처리 방침 메뉴 노출 여부입니다.",
      },
      {
        key: "showTermsMenu",
        type: "switch",
        label: "이용 약관 출력",
        description: "이용 약관 메뉴 노출 여부입니다.",
      },
      {
        key: "showPersonalizationMenu",
        type: "switch",
        label: "개인화 출력",
        description: "기존 개인화 메뉴 노출 여부입니다.",
      },
      {
        key: "showPlaygroundMenu",
        type: "switch",
        label: "플레이 그라운드 출력",
        description: "Playground 진입 버튼과 메뉴 노출 여부입니다.",
      },
      {
        key: "showLogoutButton",
        type: "switch",
        label: "로그아웃 버튼 출력",
        description: "로그아웃 버튼 노출 여부입니다.",
      },
    ],
  },
]);

function syncDraft() {
  Object.assign(draft, settings.value);
}

function apply() {
  systemSettingsStore.applySettings(draft);
  emit("applied");
  emit("close");
}

watch(settings, syncDraft, {immediate: true, deep: true});
</script>
