<template>
  <div class="bridge-panel" :class="{collapsed: !open}">
    <!-- 접기 버튼 -->
    <div class="toggle" @click="toggle">
      <span class="icon">
        {{ open ? "⟨" : "⟩" }}
      </span>
    </div>

    <!-- 본문 -->
    <div class="content">
      <!-- 헤더 -->
      <div class="header">
        <div class="title">Bridge</div>
        <div class="count">
          {{ store.groupList.length }}
        </div>
      </div>

      <!-- 리스트 -->
      <div class="list">
        <div v-for="group in store.groupList" :key="group.id" class="group">
          <!-- 그룹 헤더 -->
          <div class="group-header" @click="group.open = !group.open">
            <div class="left">
              <span class="dot"></span>
              <span class="type">{{ group.type }}</span>
            </div>

            <div class="right">
              <span class="time">{{ format(group.createdAt) }}</span>
              <span class="arrow" :class="{open: group.open}"></span>
            </div>
          </div>

          <!-- 이벤트 -->
          <div v-show="group.open" class="events">
            <div
              v-for="(e, i) in group.events"
              :key="i"
              class="item"
              :class="e.status"
            >
              <div class="top">
                <span class="badge">{{ e.status }}</span>
                <span class="time">{{ format(e.time) }}</span>
              </div>

              <pre v-if="e.payload">{{ pretty(e.payload) }}</pre>
              <pre v-if="e.response">{{ pretty(e.response) }}</pre>
              <pre v-if="e.error" class="error">{{ e.error }}</pre>
            </div>
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

const pretty = (obj) => JSON.stringify(obj, null, 2);

const format = (date) => new Date(date).toLocaleTimeString();
</script>

<style scoped>
.bridge-panel {
  width: 320px;
  background: #f9fafb;
  border-right: 1px solid #e5e7eb;
  position: relative;
  transition: width 0.2s ease;
}

/* 접힘 상태 */
.bridge-panel.collapsed {
  width: 48px;
}

.bridge-panel.collapsed .content {
  display: none;
}

/* 토글 버튼 */
.toggle {
  position: absolute;
  top: 12px;
  right: -14px;
  width: 28px;
  height: 28px;
  background: #ffffff;
  border: 1px solid #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.icon {
  font-size: 12px;
  color: #555;
}

/* 본문 */
.content {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 12px;
}

/* 헤더 */
.header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.title {
  font-size: 12px;
  color: #111;
}

.count {
  font-size: 12px;
  color: #6b7280;
  padding-right: 10px;
}

/* 리스트 */
.list {
  flex: 1;
  overflow-y: auto;
}

/* 그룹 */
.group {
  margin-bottom: 12px;
}

/* 그룹 헤더 */
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #eef2f7;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}

.left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
}

.type {
  font-weight: 600;
  font-size: 12px;
}

.right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.time {
  font-size: 11px;
  color: #6b7280;
}

.arrow {
  font-size: 10px;
}

/* 이벤트 */
.events {
  margin-top: 6px;
}

.item {
  background: white;
  border-radius: 6px;
  padding: 6px;
  margin-top: 6px;
  font-size: 11px;
  border-left: 3px solid transparent;
}

/* 상태 색상 */
.item.REQUEST {
  border-color: #3b82f6;
}
.item.RESPONSE {
  border-color: #10b981;
}
.item.ERROR {
  border-color: #ef4444;
}

/* 상단 */
.top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.badge {
  font-size: 10px;
  font-weight: 600;
}

pre {
  background: #f3f4f6;
  padding: 6px;
  border-radius: 4px;
  overflow-x: auto;
}

.error {
  color: #ef4444;
}

.arrow {
  width: 5px;
  height: 5px;
  border-right: 2px solid #6b7280;
  border-bottom: 2px solid #6b7280;
  transform: rotate(-45deg);
  transition: transform 0.2s ease;
}

/* 펼쳐졌을 때 */
.arrow.open {
  transform: rotate(45deg);
}
</style>
