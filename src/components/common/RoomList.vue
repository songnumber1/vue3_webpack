<template>
  <div class="room-list">
    <div v-for="room in rooms" :key="room.id" class="room-card card">
      <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
        <div style="min-width:0;">
          <div style="font-size:18px; font-weight:700; margin-bottom:6px; display:flex; gap:8px; align-items:center;">
            <span v-if="room.icon">{{ room.icon }}</span>
            <span>{{ room.title }}</span>
          </div>
          <div style="font-size:13px; color: var(--color-text-soft);">{{ room.updatedAt }}</div>
          <div v-if="room.description" style="margin-top:10px; color: var(--color-text-soft);">
            {{ room.description }}
          </div>
        </div>
        <div class="badge">{{ room.id }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RoomList',
  props: {
    rooms: {
      type: Array,
      default: function () {
        return [];
      }
    }
  }
};
</script>
