<template>
  <div class="row">
    <span ref="textEl" class="text">
      {{ displayText }}
    </span>
  </div>
</template>

<script>
export default {
  name: "SearchSnippet",

  props: {
    text: { type: String, default: "" },
    keyword: { type: String, default: "" },
  },

  data() {
    return {
      displayText: "",
    };
  },

  mounted() {
    this.updateSnippet();
  },

  watch: {
    text: "updateSnippet",
    keyword: "updateSnippet",
  },

  methods: {
    isOverflow(el) {
      return el.scrollHeight > el.clientHeight;
    },

    async updateSnippet() {
      const el = this.$refs.textEl;
      if (!el) return;

      const fullText = this.text || "";
      const keyword = this.keyword || "";

      // 1️⃣ 검색어 없으면 기본 clamp
      if (!keyword) {
        this.displayText = fullText;
        return;
      }

      const lower = fullText.toLowerCase();
      const idx = lower.lastIndexOf(keyword.toLowerCase());

      // 검색어 없으면 뒤 기준
      if (idx === -1) {
        this.displayText = fullText;
        return;
      }

      const keywordEnd = idx + keyword.length;

      // 검색어가 거의 끝쪽에 있으면 → 앞쪽만 자름
      const isNearEnd = keywordEnd > fullText.length - 10;

      let start = 0;
      let end = fullText.length;

      if (isNearEnd) {
        start = Math.max(0, idx - 80);
        end = fullText.length;
      } else {
        start = Math.max(0, idx - 60);
        end = Math.min(fullText.length, keywordEnd + 60);
      }

      let snippet = fullText.slice(start, end);

      if (start > 0) snippet = "..." + snippet;
      if (end < fullText.length) snippet += "...";

      this.displayText = snippet;

      await this.$nextTick();

      // 2️⃣ overflow 발생 시 실제 width 기준으로 줄이기
      let left = start;
      let right = end;

      let safety = 0;

      while (this.isOverflow(el) && safety < 100) {
        safety++;

        // 검색어 위치 유지
        if (isNearEnd) {
          left++;
        } else {
          if (left < idx) left++;
          if (right > keywordEnd) right--;
        }

        snippet = fullText.slice(left, right);

        if (left > 0) snippet = "..." + snippet;
        if (right < fullText.length) snippet += "...";

        this.displayText = snippet;
        await this.$nextTick();

        // 검색어가 잘릴 경우 중단
        if (!snippet.toLowerCase().includes(keyword.toLowerCase())) {
          break;
        }
      }
    },
  },
};
</script>

<style scoped>
.row {
  width: 300px;
}

.text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
  word-break: break-word;
}
</style>
