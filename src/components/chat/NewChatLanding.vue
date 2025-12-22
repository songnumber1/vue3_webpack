<template>
  <div class="landing" role="region" aria-label="New chat landing">
    <div class="hero">
      <div class="logo" aria-hidden="true">✨</div>
      <h1 class="title">무엇을 도와드릴까요?</h1>
      <p class="subtitle">새 대화를 시작해보세요. 아래 예시를 눌러 바로 입력할 수도 있어요.</p>

      <!-- ✅ 모델 그룹은 이미 선택되어 있으므로, 모델 옵션만 표시 -->
      <ModelSelect
        :models="currentModels"
        :model-id="currentModelId"
        @update:model="setModel"
      />
    </div>

    <div class="grid" role="list" aria-label="Suggestions">
      <button
        v-for="(s, i) in suggestions"
        :key="i"
        type="button"
        class="card"
        role="listitem"
        @click="pickSuggestion(s.text)"
      >
        <div class="card-title">{{ s.title }}</div>
        <div class="card-desc">{{ s.desc }}</div>
      </button>
    </div>
  </div>
</template>

<script>
import ModelSelect from "@/components/common/ModelSelect.vue";
import { MODEL_GROUPS } from "@/constants/models";

export default {
  name: "NewChatLanding",
  components: { ModelSelect },

  computed: {
    currentModels() {
      const g = (MODEL_GROUPS || []).find(
        (x) => x.id === this.$store.state.model.groupId
      );
      return (g && Array.isArray(g.models) ? g.models : []) || [];
    },
    currentModelId() {
      return this.$store.state.model.modelId;
    },
  },

  data() {
    return {
      suggestions: [
        { title: "요약해줘", desc: "긴 내용을 핵심만 요약해볼게요.", text: "다음 내용을 요약해줘: " },
        { title: "메일 초안", desc: "상황에 맞는 메일을 작성해볼게요.", text: "다음 상황으로 메일 초안을 작성해줘: " },
        { title: "기획 아이디어", desc: "아이디어를 여러 개 제안해볼게요.", text: "다음 주제의 기획 아이디어를 제안해줘: " },
        { title: "버그 원인", desc: "에러 원인을 함께 추적해볼게요.", text: "다음 오류 로그 원인을 분석해줘: " },
      ],
    };
  },

  methods: {
    setModel(modelId) {
      this.$store.dispatch("model/setModel", modelId);
      this.$store.dispatch("prompt/onModelChanged");
    },
    pickSuggestion(text) {
      this.$store.dispatch("input/setText", String(text ?? ""));
    },
  },
};
</script>

<style scoped>
.landing{
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  padding: 18px;
}

.hero{
  display: grid;
  gap: 10px;
  justify-items: center;
  text-align: center;
}

.logo{
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  background: var(--bg-surface);
}

.title{
  font-size: 26px;
  margin: 0;
  color: var(--text-primary);
}

.subtitle{
  font-size: 13px;
  margin: 0;
  color: var(--text-muted);
  max-width: 560px;
}

.grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  max-width: 760px;
  margin: 0 auto;
  width: 100%;
}

.card{
  text-align: left;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 14px;
  cursor: pointer;
}

.card:hover{
  background: var(--bg-soft);
}

.card-title{
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  margin-bottom: 6px;
}

.card-desc{
  font-size: 12px;
  color: var(--text-muted);
}

@media (max-width: 720px){
  .grid{ grid-template-columns: 1fr; }
}
</style>
