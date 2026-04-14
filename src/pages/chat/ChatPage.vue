<template>
  <ResponsiveLayout
    :platform="appConfig.platform"
    :device="appConfig.device"
    :theme="appConfig.theme"
    :apiVersion="appConfig.apiVersion"
    @refresh="fetchRooms"
  >
    <template #sidebar>
      <h3 style="margin-top:0;">프로젝트 구조</h3>
      <ul style="padding-left:18px; line-height:1.8; color: var(--color-text-soft);">
        <li>UI / Service / Facade / Resolver / Adapter / Mapper 분리</li>
        <li>axios interceptor base + platform override</li>
        <li>Android WebView bridge 연동 포인트</li>
        <li>CSS 변수 + 미디어쿼리 반응형</li>
      </ul>
      <button class="btn secondary" type="button" @click="sendBridgeReady">Bridge PAGE_READY</button>
    </template>

    <div class="card" style="padding: 20px; margin-bottom: 16px;">
      <div style="display:flex; justify-content:space-between; gap: 12px; flex-wrap:wrap; align-items:center;">
        <div>
          <div style="font-size:20px; font-weight:700; margin-bottom:6px;">채팅 목록</div>
          <div style="color: var(--color-text-soft);">플랫폼 / API 버전에 따라 adapter와 mapper가 자동 선택된다.</div>
        </div>
        <div class="badge">총 {{ rooms.length }}건</div>
      </div>
    </div>

    <div v-if="loading" class="card" style="padding:20px;">불러오는 중...</div>
    <div v-else-if="error" class="card" style="padding:20px; color:#b91c1c;">{{ error }}</div>
    <RoomList v-else :rooms="rooms" />
  </ResponsiveLayout>
</template>

<script>
import ResponsiveLayout from '@/layouts/ResponsiveLayout.vue';
import RoomList from '@/components/common/RoomList.vue';
import { loadRooms } from '@/services/chatService';
import { getAppConfig } from '@/config/appConfig';
import { notifyPageReady } from '@/services/bridgeService';

export default {
  name: 'ChatPage',
  components: {
    ResponsiveLayout,
    RoomList
  },
  data: function () {
    return {
      appConfig: getAppConfig(),
      loading: false,
      error: '',
      rooms: []
    };
  },
  mounted: function () {
    this.fetchRooms();
    notifyPageReady();
  },
  methods: {
    fetchRooms: async function () {
      this.loading = true;
      this.error = '';
      try {
        this.rooms = await loadRooms();
      } catch (error) {
        this.error = error && error.message ? error.message : '채팅 목록 조회 중 오류가 발생했습니다.';
      } finally {
        this.loading = false;
      }
    },
    sendBridgeReady: function () {
      notifyPageReady();
      alert('PAGE_READY 메시지를 bridge로 전송했습니다.');
    }
  }
};
</script>
