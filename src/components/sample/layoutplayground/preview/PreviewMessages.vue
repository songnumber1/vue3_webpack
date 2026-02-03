
<template>
  <div class="box" :class="{ focused }">
    <div class="row user">
      <div class="bubble">사용자 질문 예시입니다. (User)</div>
    </div>
    <div class="row ai">
      <div class="bubble">
        Assistant → Model → Answer 흐름을 보여주는 예시 응답입니다. (Assistant)
      </div>
    </div>
    <div class="row ai">
      <div class="bubble small">
        긴 답변이 오면 스크롤이 생깁니다. (max-height)
      </div>
    </div>
  </div>
</template>

<script>
export default { props: { focused: Boolean } };
</script>

<style scoped>
.box {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: var(--pv-list-pad);
  max-height: var(--pv-list-max);
  overflow: auto;
}
.box.focused { outline: 2px solid var(--primary); outline-offset: -2px; }
.row { display:flex; margin-bottom: 10px; }
.row.user { justify-content: flex-end; }
.row.ai { justify-content: flex-start; }
.bubble {
  max-width: 80%;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 12px;
  background: var(--chip);
  color: var(--text);
  border: 1px solid var(--border);
}
.row.user .bubble { background: rgba(59,130,246,0.15); border-color: rgba(59,130,246,0.25); }
.small { opacity: 0.9; }
</style>
