<template>
  <section class="card">
    <div class="card-head">
      <div class="card-title">Storage Playground</div>
      <div class="card-sub">local / session / cookie / indexed</div>
    </div>

    <div class="form-grid">
      <div class="field">
        <label>Type</label>
        <select v-model="storageType" class="select">
          <option value="local">localStorage</option>
          <option value="session">sessionStorage</option>
          <option value="cookie">cookie</option>
          <option value="indexed">indexedDB</option>
        </select>
      </div>

      <div class="field">
        <label>Key</label>
        <input v-model="storageKey" class="input" />
      </div>

      <div class="field">
        <label>Value</label>
        <textarea v-model="storageValue" rows="3" class="textarea" />
      </div>
    </div>

    <div class="btn-row btn-container">
      <button class="btn btn-primary" @click="saveStorage">Save</button>
      <button class="btn btn-ghost" @click="loadStorage">Load</button>
      <button class="btn btn-danger" @click="deleteStorage">Delete</button>
    </div>

    <div class="preview">
      <div class="preview-title">Result</div>
      <pre>{{ storageResult }}</pre>
    </div>
  </section>
</template>

<script>
import {
  setStorage,
  getStorage,
  removeStorage,
} from "@/plugins/storageManager";

export default {
  name: "PlaygroundStorage",

  props: {
    bpLabel: { type: String, default: "md" },
    width: { type: Number, default: 1200 },
  },

  data() {
    return {
      storageType: "local",
      storageKey: "pg_demo",
      storageValue: "",
      storageResult: null,
    };
  },

  methods: {
    async saveStorage() {
      const res = await setStorage(
        this.storageType,
        this.storageKey,
        this.parseValue(this.storageValue),
      );

      this.storageResult = res;
    },

    async loadStorage() {
      console.log(this.storageType);
      const res = await getStorage(this.storageType, this.storageKey);

      this.storageResult = res;
    },

    async deleteStorage() {
      const res = await removeStorage(this.storageType, this.storageKey);

      this.storageResult = res;
    },

    parseValue(value) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    },
  },
};
</script>
