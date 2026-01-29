<template>
  <div class="empty">Theme 탭 (유지) — 테마 토큰/컬러 프리뷰 넣을 수 있음</div>
</template>

<script>
export default {
  name: "PlaygroundTheme",

  props: {
    bpLabel: { type: String, default: "md" },
    width: { type: Number, default: 1200 },
  },
};
</script>
