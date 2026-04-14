<template>
  <ResponsiveLayout
    :platform="appConfig.platform"
    :device="appConfig.device"
    :theme="appConfig.theme"
    :apiVersion="appConfig.apiVersion"
    @refresh="reloadPage"
  >
    <template #sidebar>
      <h3 style="margin-top:0;">사용 가이드</h3>
      <p style="color: var(--color-text-soft); line-height:1.8;">
        query string으로 플랫폼, 디바이스, 테마, apiVersion을 바꾸면 즉시 다른 흐름을 확인할 수 있다.
      </p>
      <div class="badge">예: ?platform=app&theme=dark&device=mobile</div>
    </template>

    <div class="card" style="padding: 20px;">
      <h2 style="margin-top:0;">설정 샘플</h2>
      <div class="settings-grid">
        <div class="form-field">
          <label>Platform</label>
          <input :value="appConfig.platform" readonly />
        </div>
        <div class="form-field">
          <label>Device</label>
          <input :value="appConfig.device" readonly />
        </div>
        <div class="form-field">
          <label>Theme</label>
          <input :value="appConfig.theme" readonly />
        </div>
        <div class="form-field">
          <label>API Version</label>
          <input :value="appConfig.apiVersion" readonly />
        </div>
      </div>
      <div style="margin-top:16px; color: var(--color-text-soft); line-height:1.8;">
        실제 프로젝트에서는 이 페이지를 고객 설정, 토큰 상태, 브리지 연결 상태, 기능 플래그 확인용으로 확장하면 된다.
      </div>
    </div>
  </ResponsiveLayout>
</template>

<script>
import ResponsiveLayout from '@/layouts/ResponsiveLayout.vue';
import { getAppConfig } from '@/config/appConfig';

export default {
  name: 'SettingsPage',
  components: {
    ResponsiveLayout
  },
  data: function () {
    return {
      appConfig: getAppConfig()
    };
  },
  methods: {
    reloadPage: function () {
      window.location.reload();
    }
  }
};
</script>
