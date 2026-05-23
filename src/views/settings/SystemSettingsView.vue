<template>
  <form class="system-settings-view" @submit.prevent="apply">
    <div class="system-settings-scroll">
      <section class="system-settings-hero">
        <p class="system-settings-eyebrow">{{ t("systemSettings.eyebrow") }}</p>
        <h3>{{ t("systemSettings.title") }}</h3>
        <p>{{ t("systemSettings.description") }}</p>
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
            :min="item.min || 0"
            :max="item.max || 9999"
            :step="item.step || 1"
          />
          <select
            v-else-if="item.type === 'select'"
            :id="`system-setting-${item.key}`"
            v-model="draft[item.key]"
            class="system-settings-select"
          >
            <option
              v-for="option in item.options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
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
        {{ t("systemSettings.close") }}
      </button>
      <button
        class="playground-button playground-button--primary system-settings-apply-button"
        type="submit"
      >
        {{ t("systemSettings.apply") }}
      </button>
    </footer>
  </form>
</template>

<script setup>
import {computed, reactive, watch} from "vue";
import {useI18n} from "vue-i18n";
import {storeToRefs} from "pinia";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {syncViewportSettings} from "@/utils/viewportSettingsSync";
import {
  DEFAULT_SYSTEM_SETTINGS,
  KEYBOARD_MODE_OPTIONS,
} from "@/constants/systemSettings";

const emit = defineEmits(["close", "applied"]);
const {t} = useI18n();
const systemSettingsStore = useSystemSettingsStore();
const {settings} = storeToRefs(systemSettingsStore);

const draft = reactive({...DEFAULT_SYSTEM_SETTINGS});

const settingText = (key, field) => t(`systemSettings.items.${key}.${field}`);

function settingItem(key, extra = {}) {
  return {
    key,
    type: "switch",
    label: settingText(key, "label"),
    description: settingText(key, "description"),
    ...extra,
  };
}

const groups = computed(() => [
  {
    kicker: t("common.api"),
    title: t("systemSettings.groups.api"),
    items: [settingItem("useRealApi")],
  },
  {
    kicker: "MOBILE",
    title: t("systemSettings.groups.mobile"),
    items: [
      settingItem("mobileBreakpoint", {type: "number"}),
      settingItem("keyboardMode", {
        type: "select",
        options: KEYBOARD_MODE_OPTIONS,
      }),
      settingItem("useVirtualKeyboard"),
      settingItem("showVirtualKeyboardDebug"),
      settingItem("virtualKeyboardHeight", {
        type: "number",
        min: 180,
        max: 600,
        step: 1,
      }),
      settingItem("useMicrophone"),
      settingItem("showMobileApiProgress"),
      //settingItem("abortChatOnMobileBackground"),
    ],
  },
  {
    kicker: "BOTTOM SHEET",
    title: t("systemSettings.groups.bottomSheet"),
    items: [
      settingItem("bottomSheetMinHeight", {
        type: "number",
        min: 180,
        max: 720,
        step: 1,
      }),
      settingItem("bottomSheetMaxHeight", {
        type: "number",
        min: 320,
        max: 960,
        step: 1,
      }),
    ],
  },
  {
    kicker: "CHAT",
    title: t("systemSettings.groups.chat"),
    items: [settingItem("autoScrollOnAnswer")],
  },
  {
    kicker: "ACTION",
    title: t("systemSettings.groups.action"),
    items: [
      settingItem("showGuideButton"),
      settingItem("showThemeButton"),
      settingItem("showSwaggerButton"),
    ],
  },
  {
    kicker: "MENU",
    title: t("systemSettings.groups.menu"),
    items: [
      settingItem("showNoticeMenu"),
      settingItem("showPrivacyMenu"),
      settingItem("showTermsMenu"),
      settingItem("showPersonalizationMenu"),
      settingItem("showPlaygroundMenu"),
      settingItem("showLogoutButton"),
    ],
  },
]);

function syncDraft() {
  Object.assign(draft, settings.value);
}

function apply() {
  systemSettingsStore.applySettings(draft);
  syncViewportSettings(systemSettingsStore.mobileBreakpoint);
  emit("applied");
  emit("close");
}

watch(settings, syncDraft, {immediate: true, deep: true});
</script>
