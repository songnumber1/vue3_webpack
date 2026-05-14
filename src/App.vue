<!--
@file App.vue * @description Vue component used in the chat web
application runtime. * @author OpenAI
-->

<template>
  <AppLayout>
    <section v-if="!platformStore.isAccess" class="access-denied-page" role="alert">
      <div class="access-denied-card">
        <h1>지원하지 않는 접속 환경입니다.</h1>
        <p>iOS 앱, iOS Chrome, iOS Safari에서는 접속할 수 없습니다.</p>
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
import { usePlatformStore } from "@/stores/platformStore";
const platformStore = usePlatformStore();
</script>
