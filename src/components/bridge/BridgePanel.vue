<template>
  <div class="bridge-panel" :class="{collapsed: !open}">
    <button class="collapse-button" type="button" @click="toggle">
      <span class="collapse-icon" :class="{collapsed: !open}"></span>
    </button>

    <div class="content">
      <div class="header">
        <div>
          <div class="title">Bridge Monitor</div>
          <div class="subtitle">Native request / response</div>
        </div>

        <div class="header-actions">
          <span class="count">{{ store.groupList.length }}</span>
          <button class="clear-button" type="button" @click="store.clear()">
            Clear
          </button>
        </div>
      </div>

      <div class="list">
        <div v-for="group in store.groupList" :key="group.id" class="group">
          <button
            class="group-header"
            type="button"
            @click="group.open = !group.open"
          >
            <div class="group-left">
              <span class="status-dot" :class="getGroupStatus(group)"></span>
              <span class="type">{{ group.type }}</span>
            </div>

            <div class="group-right">
              <span class="time">{{ format(group.createdAt) }}</span>
              <span class="arrow" :class="{open: group.open}"></span>
            </div>
          </button>

          <div v-show="group.open" class="events">
            <div
              v-for="(event, index) in group.events"
              :key="index"
              class="event-card"
              :class="event.status"
            >
              <div class="event-top">
                <span class="badge">{{ event.status }}</span>
                <span class="time">{{ format(event.time) }}</span>
              </div>

              <div v-if="event.payload" class="block">
                <div class="label">Request</div>
                <pre>{{ pretty(event.payload) }}</pre>
              </div>

              <div v-if="event.response" class="block">
                <div class="label">Response</div>
                <pre>{{ pretty(event.response) }}</pre>
              </div>

              <div v-if="event.error" class="block">
                <div class="label error-label">Error</div>
                <pre class="error-text">{{ event.error }}</pre>
              </div>
            </div>
          </div>
        </div>

        <div v-if="store.groupList.length === 0" class="empty">
          No bridge events yet.
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

const pretty = (obj) => JSON.stringify(obj, null, 2);

const format = (date) => {
  return new Date(date).toLocaleString();
};

const getGroupStatus = (group) => {
  const last = group.events[group.events.length - 1];
  return last?.status || "REQUEST";
};
</script>

<style scoped>
.bridge-panel {
  position: relative;
  width: 340px;
  min-width: 340px;
  height: 100dvh;
  background: #f8fafc;
  border-right: 1px solid #e5e7eb;
  transition: width 0.2s ease, min-width 0.2s ease;
}

.bridge-panel.collapsed {
  width: 44px;
  min-width: 44px;
}

.bridge-panel.collapsed .content {
  display: none;
}

.collapse-button {
  position: absolute;
  top: 14px;
  right: -14px;
  z-index: 10;
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 999px;
  background: #ffffff;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-icon {
  width: 9px;
  height: 9px;
  border-left: 2px solid #64748b;
  border-bottom: 2px solid #64748b;
  transform: rotate(45deg);
  transition: transform 0.2s ease;
}

.collapse-icon.collapsed {
  transform: rotate(-135deg);
}

.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 14px;
  box-sizing: border-box;
}

.header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 14px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.subtitle {
  margin-top: 2px;
  font-size: 11px;
  color: #6b7280;
}

.header-actions {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding-right: 10px;
}

.count {
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #374151;
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.clear-button {
  height: 22px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #ffffff;
  color: #6b7280;
  font-size: 11px;
  cursor: pointer;
}

.clear-button:hover {
  color: #111827;
  border-color: #9ca3af;
}

.list {
  flex: 1;
  overflow-y: auto;
  padding-right: 2px;
}

.group {
  margin-bottom: 10px;
}

.group-header {
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 8px 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.group-header:hover {
  background: #f3f4f6;
}

.group-left,
.group-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #3b82f6;
}

.status-dot.RESPONSE {
  background: #10b981;
}

.status-dot.ERROR {
  background: #ef4444;
}

.type {
  font-size: 12px;
  font-weight: 700;
  color: #111827;
}

.time {
  font-size: 10px;
  color: #6b7280;
  white-space: nowrap;
}

.arrow {
  width: 8px;
  height: 8px;
  border-right: 2px solid #9ca3af;
  border-bottom: 2px solid #9ca3af;
  transform: rotate(-45deg);
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.arrow.open {
  transform: rotate(45deg);
  border-color: #374151;
}

.events {
  margin-top: 6px;
  padding-left: 10px;
}

.event-card {
  margin-top: 6px;
  padding: 8px;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-left: 3px solid #3b82f6;
  border-radius: 8px;
}

.event-card.RESPONSE {
  border-left-color: #10b981;
}

.event-card.ERROR {
  border-left-color: #ef4444;
}

.event-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.badge {
  padding: 2px 6px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 10px;
  font-weight: 700;
}

.event-card.RESPONSE .badge {
  background: #ecfdf5;
  color: #059669;
}

.event-card.ERROR .badge {
  background: #fef2f2;
  color: #dc2626;
}

.block {
  margin-top: 6px;
}

.label {
  margin-bottom: 4px;
  font-size: 10px;
  font-weight: 700;
  color: #6b7280;
}

.error-label {
  color: #dc2626;
}

pre {
  margin: 0;
  padding: 8px;
  border-radius: 8px;
  background: #f3f4f6;
  color: #111827;
  font-size: 11px;
  line-height: 1.5;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
}

.error-text {
  color: #dc2626;
  background: #fef2f2;
}

.empty {
  padding: 14px;
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
  background: #ffffff;
}
</style>
