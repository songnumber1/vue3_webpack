<template>
  <section class="system-settings-group">
    <header>
      <span>{{ group.kicker }}</span>
      <h4>{{ group.title }}</h4>
    </header>

    <SystemSettingsRow
      v-for="item in group.items"
      :key="item.key"
      :item="item"
      :value="draft[item.key]"
      @update="(...args) => $emit('update-setting', ...args)"
    />
  </section>
</template>

<script setup>
import SystemSettingsRow from "@/components/settings/SystemSettingsRow.vue";

defineProps({
  group: {type: Object, required: true},
  draft: {type: Object, required: true},
});

defineEmits(["update-setting"]);
</script>
