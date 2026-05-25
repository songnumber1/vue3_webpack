<template>
  <AppLayout>
    <section
      v-if="!platformStore.isAccess"
      class="access-denied-page"
      role="alert"
    >
      <div class="access-denied-card">
        <h1>{{ t("app.unsupportedTitle") }}</h1>
        <p>{{ t("app.unsupportedMessage") }}</p>
        <dl>
          <div>
            <dt>env</dt>
            <dd>{{ platformStore.info.env }}</dd>
          </div>
          <div>
            <dt>device</dt>
            <dd>{{ platformStore.info.device }}</dd>
          </div>
          <div>
            <dt>browser</dt>
            <dd>
              {{ platformStore.info.browser }}
              {{ platformStore.info.browserVersion }}
            </dd>
          </div>
        </dl>
      </div>
    </section>
    <router-view v-else />
    <DesktopClipboardNote />
    <MobileClipboardToast />
    <MobileApiProgressOverlay />
  </AppLayout>
</template>

<script setup>
/**
 * @file App.vue
 * @description 최상위 Vue Shell입니다. 실제 화면 전환은 RouterView와 하위 컨테이너에서 처리됩니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import MobileApiProgressOverlay from "@/components/overlay/MobileApiProgressOverlay.vue";
import DesktopClipboardNote from "@/components/overlay/DesktopClipboardNote.vue";
import MobileClipboardToast from "@/components/overlay/MobileClipboardToast.vue";

const {t} = useI18n();
const platformStore = usePlatformStore();
const systemSettingsStore = useSystemSettingsStore();
systemSettingsStore.init();
</script>
