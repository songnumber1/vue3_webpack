<template>
  <div class="landing">
    <div class="hero">
      <h1 class="title">무엇을 도와드릴까요?</h1>

      <!-- 모델 선택 -->
      <ModelSelect
        v-if="models.length"
        :models="models"
        :currentModelId="modelId"
        @update:model="onSelectModel"
      />
    </div>

    <!-- 모델 기준 예제 -->
    <div class="grid">
      <button
        v-for="e in examples"
        :key="e.example_id"
        class="card"
        @click="pick(e)"
      >
        <div class="card-title">
          {{ e.title_ko }}
        </div>
        <div class="card-desc">
          {{ e.desc_ko }}
        </div>
      </button>

      <div v-if="!examples.length" class="empty">
        선택한 모델에 연결된 예제가 없습니다.
      </div>
    </div>
  </div>
</template>

<script>
import ModelSelect from "@/components/common/ModelSelect.vue";
import { useChatStore } from "@/stores/chatStore";
import { useDataStore } from "@/stores/dataStore";

export default {
  name: "NewChatLanding",
  components: { ModelSelect },
  emits: ["pick"],

  computed: {
    chat() {
      return useChatStore();
    },
    data() {
      return useDataStore();
    },

    assistantId() {
      return this.chat.assistantId;
    },

    modelId() {
      return this.chat.modelId;
    },

    models() {
      if (!this.assistantId) return [];

      return this.data.modelsByAssistant(this.assistantId);
    },

    examples() {
      if (!this.modelId) return [];
      return this.data.examplesByModel(this.modelId);
    },
  },

  methods: {
    /** 모델 변경 시 모든 상태 동기화 */
    onSelectModel(modelId) {
      this.chat.setModel(modelId);
    },

    pick(example) {
      this.$emit("pick", example.input || "");
    },
  },
};
</script>

<style scoped>
.landing {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
}

.hero {
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
}

.logo {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  background: var(--bg-surface);
}

.title {
  font-size: 26px;
  margin: 0;
  color: var(--text-primary);
}

.subtitle {
  font-size: 13px;
  margin: 0;
  color: var(--text-muted);
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.card {
  text-align: left;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
}

.card:hover {
  background: var(--bg-soft);
}

.card-title {
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 6px;
}

.card-desc {
  font-size: 12px;
  color: var(--text-muted);
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  font-size: 12px;
  color: var(--text-muted);
  padding: 20px 0;
}
</style>
