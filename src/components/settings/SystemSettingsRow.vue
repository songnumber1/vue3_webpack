<template>
  <label
    class="system-settings-row"
    :class="{'is-disabled': item.disabled}"
    :for="inputId"
    :aria-disabled="item.disabled ? 'true' : undefined"
  >
    <span class="system-settings-copy">
      <strong>{{ item.label }}</strong>
      <small>{{ item.description }}</small>
    </span>

    <input
      v-if="item.type === 'number'"
      :id="inputId"
      class="system-settings-number"
      type="number"
      :value="value"
      :min="item.min || 0"
      :max="item.max || 9999"
      :step="item.step || 1"
      :disabled="item.disabled"
      @input="updateNumber"
    />
    <input
      v-else-if="item.type === 'text'"
      :id="inputId"
      class="system-settings-text"
      type="text"
      :value="value"
      :disabled="item.disabled"
      @input="$emit('update', item.key, $event.target.value)"
    />
    <select
      v-else-if="item.type === 'select'"
      :id="inputId"
      class="system-settings-select"
      :value="value"
      :disabled="item.disabled"
      @change="$emit('update', item.key, $event.target.value)"
    >
      <option
        v-for="option in item.options"
        :key="option.value"
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <span v-else class="system-settings-switch">
      <input
        :id="inputId"
        type="checkbox"
        :checked="Boolean(value)"
        :disabled="item.disabled"
        @change="$emit('update', item.key, $event.target.checked)"
      />
      <span aria-hidden="true"></span>
    </span>
  </label>
</template>

<script setup>
import {computed} from "vue";

const props = defineProps({
  item: {type: Object, required: true},
  value: {type: [String, Number, Boolean], default: ""},
});

const emit = defineEmits(["update"]);

const inputId = computed(() => `system-setting-${props.item.key}`);

function updateNumber(event) {
  const rawValue = event.target.value;
  const numberValue = rawValue === "" ? "" : Number(rawValue);
  emit("update", props.item.key, numberValue);
}
</script>
