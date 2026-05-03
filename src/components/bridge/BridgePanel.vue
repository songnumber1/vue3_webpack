<template>
  <div class="bridge-panel">
    <div class="bridge-toggle" @click="toggle">
      🧪 Bridge Panel {{ open ? "▼" : "▲" }}
    </div>

    <div class="bridge-content" v-show="open">
      <div class="panel-body">
        <div
          v-for="(e, i) in store.events"
          :key="i"
          class="event-card"
          :class="e.status"
        >
          <!-- 헤더 -->
          <div class="event-header">
            <span class="badge">{{ e.status }}</span>
            <span class="type">{{ e.type }}</span>
            <span class="time">{{ e.time }}</span>
          </div>

          <!-- Payload -->
          <div v-if="e.payload" class="block">
            <div class="label">Request</div>
            <pre>{{ pretty(e.payload) }}</pre>
          </div>

          <!-- Response -->
          <div v-if="e.response" class="block">
            <div class="label">Response</div>
            <pre>{{ pretty(e.response) }}</pre>
          </div>

          <!-- Error -->
          <div v-if="e.error" class="block error">
            <div class="label">Error</div>
            <pre>{{ e.error }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {ref} from "vue";
import {bridgeStore as store} from "@/bridge/bridgeStore";

const open = ref(true);

const toggle = () => {
  open.value = !open.value;
};

// JSON pretty 출력
const pretty = (obj) => {
  return JSON.stringify(obj, null, 2);
};
</script>

<style scoped>
.bridge-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 999999;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}

.bridge-toggle {
  background: #1f2937;
  color: #e5e7eb;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  cursor: pointer;
  border-top: 1px solid #374151;
}

/* 본문 */
.bridge-content {
  height: 320px;
  background: #111827;
  color: #e5e7eb;
  display: flex;
  flex-direction: column;
}

/* 스크롤 */
.panel-body {
  overflow-y: auto;
  padding: 10px;
}

/* 카드 */
.event-card {
  background: #1f2937;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
  border-left: 4px solid transparent;
}

/* 상태별 색상 */
.event-card.REQUEST {
  border-color: #60a5fa;
}
.event-card.RESPONSE {
  border-color: #34d399;
}
.event-card.ERROR {
  border-color: #f87171;
}

/* 헤더 */
.event-header {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  gap: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  background: #374151;
}

.type {
  font-weight: 600;
}

.time {
  margin-left: auto;
  font-size: 11px;
  color: #9ca3af;
}

/* 블록 */
.block {
  margin-top: 6px;
}

.label {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 2px;
}

pre {
  background: #030712;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  overflow-x: auto;
}

.error pre {
  color: #f87171;
}
</style>
