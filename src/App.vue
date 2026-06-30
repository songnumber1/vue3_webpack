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
    <MobileClipboardToast />
    <ProgressOverlay />
  </AppLayout>
</template>

<script setup>
/**
 * @file App.vue
 * @description 최상위 Vue Shell입니다. 실제 화면 전환은 RouterView와 하위 컨테이너에서 처리됩니다.
 */

import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";
import ProgressOverlay from "@/components/overlay/ProgressOverlay.vue";
import MobileClipboardToast from "@/components/overlay/MobileClipboardToast.vue";

const {t} = useI18n();
const platformStore = usePlatformStore();
</script>
