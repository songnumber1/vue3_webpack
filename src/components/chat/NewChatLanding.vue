<template>
  <div class="landing" role="region" aria-label="New chat landing">
    <div class="hero">
      <div class="logo" aria-hidden="true">✨</div>
      <h1 class="title">무엇을 도와드릴까요?</h1>
      <p class="subtitle">새 대화를 시작해보세요. 아래 예시를 눌러 바로 입력할 수도 있어요.</p>
    </div>

    <div class="grid">
      <button
        v-for="(s, i) in suggestions"
        :key="i"
        type="button"
        class="card"
        @click="$emit('pick', s.text)"
      >
        <div class="cardTitle">{{ s.title }}</div>
        <div class="cardText">{{ s.text }}</div>
      </button>
    </div>

    <div class="hint">
      <span class="dot" />
      <span>Enter로 전송, Shift+Enter로 줄바꿈</span>
    </div>
  </div>
</template>

<script>
export default {
  name: "NewChatLanding",
  emits: ["pick"],
  props: {
    // 프로젝트 성격(개발/운영/모니터링)에 맞는 기본 프롬프트 세트
    suggestions: {
      type: Array,
      default: () => [
        {
          title: "UI/UX 개선",
          text: "ChatGPT처럼 새 대화 화면(빈 상태) UI/UX를 만들어줘. 반응형 + 테마도 유지해줘.",
        },
        {
          title: "버그 디버깅",
          text: "Uncaught (in promise) TypeError를 원인부터 재현/수정까지 단계별로 정리해줘.",
        },
        {
          title: "리팩토링",
          text: "store를 전역으로 정리해서 컴포넌트 간 상태 공유를 안정적으로 리팩토링해줘.",
        },
        {
          title: "문서/가이드",
          text: "프로젝트 폴더 구조와 주요 컴포넌트 역할을 README 형태로 정리해줘.",
        },
      ],
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
  padding: 24px 16px;
  max-width: 980px;
  margin: 0 auto;
}

.hero{
  text-align: center;
}

.logo{
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  margin: 0 auto 10px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  box-shadow: var(--shadow-sm);
  font-size: 22px;
}

.title{
  margin: 0;
  font-size: 24px;
  letter-spacing: -0.02em;
}

.subtitle{
  margin: 8px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.card{
  text-align: left;
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: var(--radius-lg);
  padding: 14px;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: transform .06s ease, background .06s ease;
}

.card:hover{
  transform: translateY(-1px);
  background: var(--bg-elevated);
}

.cardTitle{
  font-weight: 800;
  font-size: 14px;
  margin-bottom: 6px;
}

.cardText{
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.4;
}

.hint{
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 12px;
}

.dot{
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--primary) 70%, transparent);
}

@media (max-width: 700px){
  .grid{ grid-template-columns: 1fr; }
  .landing{ padding: 18px 12px; }
}
</style>
