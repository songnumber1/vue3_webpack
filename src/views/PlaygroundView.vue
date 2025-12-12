<template>
  <div class="playground">
    <h1 class="playground__title">UI Playground</h1>
    <p class="playground__subtitle">
      공통 컴포넌트(Base*)를 테스트하고, 반응형 + 테마 변화를 한 곳에서 확인하세요.
    </p>

    <div class="playground__grid">
      <section class="playground__section">
        <h2>Buttons</h2>
        <div class="playground__row">
          <BaseButton>Primary</BaseButton>
          <BaseButton variant="ghost">Ghost</BaseButton>
          <BaseButton variant="outline">Outline</BaseButton>
          <BaseButton variant="danger">Danger</BaseButton>
          <BaseButton :disabled="true">Disabled</BaseButton>
        </div>
      </section>

      <section class="playground__section">
        <h2>Inputs</h2>
        <BaseField
          label="이메일"
          v-model="email"
          placeholder="email@example.com"
        />
        <BaseField
          label="비밀번호"
          v-model="password"
          type="password"
        />
        <BaseField
          label="자기소개"
          :component="'BaseTextarea'"
          v-model="about"
          rows="3"
        />
      </section>

      <section class="playground__section">
        <h2>Select & Radios</h2>
        <BaseField
          label="언어 선택"
          :component="'BaseSelect'"
          v-model="language"
        >
          <option disabled value="">언어 선택</option>
          <option value="ko">한국어</option>
          <option value="en">영어</option>
          <option value="ja">일본어</option>
        </BaseField>

        <div class="playground__row">
          <BaseRadio
            v-model="themeChoice"
            value="system"
          >시스템</BaseRadio>
          <BaseRadio
            v-model="themeChoice"
            value="light"
          >라이트</BaseRadio>
          <BaseRadio
            v-model="themeChoice"
            value="dark"
          >다크</BaseRadio>
        </div>
      </section>

      <section class="playground__section">
        <h2>Checkbox & Switch</h2>
        <div class="playground__row">
          <BaseCheckbox v-model="agree">
            이용약관에 동의합니다.
          </BaseCheckbox>
        </div>
        <div class="playground__row">
          <BaseSwitch v-model="notifications">
            알림 허용
          </BaseSwitch>
        </div>
      </section>

      <section class="playground__section">
        <h2>Badges</h2>
        <div class="playground__row">
          <BaseBadge>Default</BaseBadge>
          <BaseBadge variant="success">Success</BaseBadge>
          <BaseBadge variant="danger">Danger</BaseBadge>
          <BaseBadge variant="info">Info</BaseBadge>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import BaseButton from "@/components/common/BaseButton.vue";
import BaseField from "@/components/common/BaseField.vue";
import BaseCheckbox from "@/components/common/BaseCheckbox.vue";
import BaseSwitch from "@/components/common/BaseSwitch.vue";
import BaseRadio from "@/components/common/BaseRadio.vue";
import BaseBadge from "@/components/common/BaseBadge.vue";

export default {
  name: "PlaygroundView",
  components: {
    BaseButton,
    BaseField,
    BaseCheckbox,
    BaseSwitch,
    BaseRadio,
    BaseBadge
  },
  data() {
    return {
      email: "",
      password: "",
      about: "",
      language: "",
      themeChoice: "system",
      agree: false,
      notifications: true
    };
  }
};
</script>

<style lang="scss" scoped>
.playground {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.playground__title {
  margin: 0;
  font-size: var(--font-size-lg);
}

.playground__subtitle {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.playground__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--space-4);
}

.playground__section {
  padding: var(--space-3);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-subtle);

  h2 {
    margin-top: 0;
    margin-bottom: var(--space-2);
    font-size: var(--font-size-md);
  }
}

.playground__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
</style>
