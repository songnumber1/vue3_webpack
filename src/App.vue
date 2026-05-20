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
  </AppLayout>
</template>

<script setup>
import {useI18n} from "vue-i18n";
import {usePlatformStore} from "@/stores/platformStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

const {t} = useI18n();
const platformStore = usePlatformStore();
const systemSettingsStore = useSystemSettingsStore();
systemSettingsStore.hydrate();
</script>
