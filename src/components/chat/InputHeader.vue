<template>
  <div class="ih" role="region" aria-label="Input header">
    <div class="ih-top">
      <div class="ih-title">
        <strong>{{ header.title }}</strong>
        <span v-if="header.content" class="ih-sub">{{ header.content }}</span>
      </div>

      <div class="ih-actions">
        <!-- 언어 토글 (예시) -->
        <select :value="language" @change="onLang">
          <option value="ko">KO</option>
          <option value="en">EN</option>
        </select>
      </div>
    </div>

    <!-- 멀티 템플릿 모드: 토글 버튼 -->
    <div v-if="hasMultipleModes" class="ih-modes" role="group" aria-label="Template modes">
      <button
        v-for="m in modeButtons"
        :key="m"
        type="button"
        class="mode"
        :class="{ active: currentName === m }"
        @click="toggleMode(m)"
      >
        {{ m }}
      </button>
    </div>

    <!-- 옵션 스키마(라디오) -->
    <div v-if="Object.keys(optionSchema).length" class="ih-opts">
      <div v-for="(schema, key) in optionSchema" :key="key" class="opt">
        <div class="opt-label">{{ labelFor(schema) }}</div>
        <div class="opt-items">
          <label
            v-for="(item, i) in schema.content"
            :key="i"
            class="opt-item"
          >
            <input
              type="radio"
              :name="key"
              :checked="selectedOptions[key] === item.tag"
              @change="setOption(key, item.tag)"
            />
            <span>{{ item[language] || item.ko || item.en || item.tag }}</span>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "InputHeader",

  computed: {
    language() {
      return this.$store.state.model.language;
    },
    header() {
      return this.$store.getters["prompt/headerText"];
    },
    hasMultipleModes() {
      return this.$store.getters["prompt/hasMultipleModes"];
    },
    currentTemplate() {
      return this.$store.getters["prompt/currentTemplate"];
    },
    currentName() {
      return this.currentTemplate?.promptTemplateName || "";
    },
    optionSchema() {
      return this.$store.getters["prompt/optionSchema"];
    },
    selectedOptions() {
      return this.$store.getters["prompt/selectedOptions"];
    },
    modeButtons() {
      // "직접입력"은 자동 복귀가 기본값이므로 버튼에는 포함하되 가장 왼쪽에
      return ["직접입력", "메일", "번역", "요약", "코드"];
    },
  },

  methods: {
    onLang(e) {
      this.$store.dispatch("model/setLanguage", e.target.value);
    },
    toggleMode(name) {
      // spec: mail/번역/요약/코드 중 하나도 선택 안되면 직접입력
      // 구현: 버튼 클릭 토글 (같은 버튼 다시 누르면 직접입력으로 복귀)
      if (name === "직접입력") {
        const list = this.$store.getters["prompt/templatesForModel"](
          this.$store.state.model.modelId
        );
        const direct = list.find((t) => t.promptTemplateName === "직접입력") || list[0];
        if (direct) this.$store.dispatch("prompt/selectTemplate", direct.promptTemplateId);
        return;
      }
      this.$store.dispatch("prompt/toggleMode", name);
    },
    setOption(key, tag) {
      this.$store.dispatch("prompt/setOption", { key, value: tag });
    },
    labelFor(schema) {
      const lang = this.language;
      return schema?.[lang] || schema?.ko || schema?.en || "";
    },
  },
};
</script>

<style scoped>
.ih{
  border: 1px solid var(--border);
  background: var(--bg-surface);
  border-radius: 16px;
  padding: 12px;
  display: grid;
  gap: 12px;
}

.ih-top{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.ih-title{
  display: grid;
  gap: 4px;
}

.ih-title strong{
  font-size: 13px;
  color: var(--text-primary);
}

.ih-sub{
  font-size: 12px;
  color: var(--text-muted);
}

.ih-actions select{
  border: 1px solid var(--border);
  background: var(--bg-surface);
  color: var(--text-primary);
  border-radius: 12px;
  padding: 6px 10px;
}

.ih-modes{
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mode{
  padding: 6px 10px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
}

.mode:hover{ background: var(--bg-soft); }
.mode.active{
  background: var(--accent);
  border-color: transparent;
  color: #fff;
}

.ih-opts{
  display: grid;
  gap: 10px;
}

.opt{
  display: grid;
  gap: 6px;
}

.opt-label{
  font-size: 12px;
  color: var(--text-muted);
}

.opt-items{
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.opt-item{
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-primary);
}
</style>
