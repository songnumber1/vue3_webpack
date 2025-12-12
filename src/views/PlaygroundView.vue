<template>
  <div class="playground">
    <h1 class="playground__title">UI Playground</h1>
    <p class="playground__subtitle">
      공통 컴포넌트(Base*)를 테스트하고, 반응형 + 테마 변화를 한 곳에서
      확인하세요.
    </p>

    <BaseTabs v-model="activeTab" :tabs="tabs" class="playground__tabs">
      <template #core>
        <section class="playground__section">
          <h2>Core / Inputs</h2>
          <div class="playground__grid">
            <div>
              <h3>Buttons</h3>
              <div class="playground__row">
                <BaseButton>Primary</BaseButton>
                <BaseButton variant="ghost">Ghost</BaseButton>
                <BaseButton variant="outline">Outline</BaseButton>
                <BaseButton variant="danger">Danger</BaseButton>
                <BaseButton :disabled="true">Disabled</BaseButton>
              </div>
            </div>
            <div>
              <h3>Form Fields</h3>
              <BaseField
                label="이메일"
                v-model="email"
                placeholder="email@example.com"
              />
              <BaseField label="비밀번호" v-model="password" type="password" />
              <BaseField
                label="자기소개"
                :component="'BaseTextarea'"
                v-model="about"
                rows="3"
              />
            </div>
            <div>
              <h3>Select & Radios</h3>
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
                <BaseRadio v-model="themeChoice" value="system"
                  >시스템</BaseRadio
                >
                <BaseRadio v-model="themeChoice" value="light"
                  >라이트</BaseRadio
                >
                <BaseRadio v-model="themeChoice" value="dark">다크</BaseRadio>
              </div>
            </div>
            <div>
              <h3>Checkbox & Switch</h3>
              <div class="playground__row">
                <BaseCheckbox v-model="agree">
                  이용약관에 동의합니다.
                </BaseCheckbox>
              </div>
              <div class="playground__row">
                <BaseSwitch v-model="notifications"> 알림 허용 </BaseSwitch>
              </div>
            </div>
          </div>
        </section>
      </template>

      <template #navigation>
        <section class="playground__section">
          <h2>Navigation</h2>
          <div class="playground__grid">
            <div>
              <h3>Breadcrumb</h3>
              <BaseBreadcrumb :items="breadcrumbItems" />
            </div>
            <div>
              <h3>Pagination</h3>
              <BasePagination
                v-model:page="paginationPage"
                :page-size="5"
                :total="57"
              />
            </div>
            <div>
              <h3>Stepper</h3>
              <BaseStepper v-model="stepperStep" :steps="stepperSteps" />
            </div>
            <div>
              <h3>Accordion</h3>
              <BaseAccordion :items="accordionItems" />
            </div>
          </div>
        </section>
      </template>

      <template #data>
        <section class="playground__section">
          <h2>Data Display</h2>
          <div class="playground__grid">
            <div>
              <h3>Avatar & Chip</h3>
              <div class="playground__row">
                <BaseAvatar name="Radar Studio" :size="32" />
                <BaseAvatar name="민우 송" :size="40" />
                <BaseAvatar name="DS" :size="48" />
              </div>
              <div class="playground__row">
                <BaseChip>기본</BaseChip>
                <BaseChip :selected="true">선택됨</BaseChip>
                <BaseChip closable @close="chipClosed = true">
                  닫기 가능
                </BaseChip>
              </div>
            </div>

            <div>
              <h3>List</h3>
              <BaseList
                :items="['서울 서버', '부산 서버', '테스트 서버']"
                @item-click="lastListClick = $event"
              />
              <p class="playground__hint">
                마지막 클릭: {{ lastListClick || "-" }}
              </p>
            </div>

            <div class="playground__fullwidth">
              <h3>Table</h3>
              <BaseTable
                :columns="tableColumns"
                :rows="tableRows"
                row-key="id"
                selectable
                sticky-header
                v-model:selectedRowKeys="selectedRowKeys"
              />
              <p class="playground__hint">
                선택된 ID: {{ selectedRowKeys.join(", ") || "-" }}
              </p>
            </div>
          </div>
        </section>
      </template>

      <template #overlay>
        <section class="playground__section">
          <h2>Overlay / Feedback</h2>
          <div class="playground__grid">
            <div>
              <h3>Modal</h3>
              <BaseButton @click="showModal = true">모달 열기</BaseButton>
              <BaseModal v-model:visible="showModal" title="Demo Modal">
                <p>ChatGPT 스타일의 플랫 모달입니다.</p>
                <template #footer>
                  <BaseButton variant="ghost" @click="showModal = false">
                    닫기
                  </BaseButton>
                  <BaseButton @click="showModal = false"> 확인 </BaseButton>
                </template>
              </BaseModal>
            </div>
            <div>
              <h3>Toast</h3>
              <BaseButton @click="triggerToast"> 토스트 표시 </BaseButton>
              <BaseToast :show="showToast" type="success">
                저장이 완료되었습니다.
              </BaseToast>
            </div>
            <div>
              <h3>Tooltip / Popover</h3>
              <div class="playground__row">
                <BaseTooltip text="툴팁입니다.">
                  <BaseButton variant="ghost">툴팁 Hover</BaseButton>
                </BaseTooltip>
                <BasePopover>
                  <template #trigger>
                    <BaseButton variant="ghost">팝오버 클릭</BaseButton>
                  </template>
                  <p style="margin: 0; font-size: var(--font-size-xs)">
                    간단한 설정/액션 메뉴를 여기에 둘 수 있습니다.
                  </p>
                </BasePopover>
              </div>
            </div>
            <div>
              <h3>Context Menu</h3>
              <BaseContextMenu
                :items="contextMenuItems"
                @select="lastContextSelect = $event"
              >
                <div class="playground__context-target">
                  이 영역을 우클릭하세요.
                </div>
              </BaseContextMenu>
              <p class="playground__hint">
                선택된 메뉴: {{ lastContextSelect?.label || "-" }}
              </p>
            </div>
          </div>
        </section>
      </template>

      <template #layout>
        <section class="playground__section">
          <h2>Layout</h2>
          <BaseContainer>
            <BaseSection title="레이아웃 데모">
              <BaseGrid :cols="3">
                <div class="playground__box">Item 1</div>
                <div class="playground__box">Item 2</div>
                <div class="playground__box">Item 3</div>
                <div class="playground__box">Item 4</div>
                <div class="playground__box">Item 5</div>
                <div class="playground__box">Item 6</div>
              </BaseGrid>
              <template #footer>
                <small class="playground__hint">
                  BaseContainer + BaseSection + BaseGrid 조합 예시
                </small>
              </template>
            </BaseSection>
          </BaseContainer>
        </section>
      </template>
    </BaseTabs>
  </div>
</template>

<script>
import BaseButton from "@/components/common/BaseButton.vue";
import BaseField from "@/components/common/BaseField.vue";
import BaseCheckbox from "@/components/common/BaseCheckbox.vue";
import BaseSwitch from "@/components/common/BaseSwitch.vue";
import BaseRadio from "@/components/common/BaseRadio.vue";
import BaseBadge from "@/components/common/BaseBadge.vue";
import BaseTabs from "@/components/common/BaseTabs.vue";
import BaseBreadcrumb from "@/components/common/BaseBreadcrumb.vue";
import BasePagination from "@/components/common/BasePagination.vue";
import BaseStepper from "@/components/common/BaseStepper.vue";
import BaseAccordion from "@/components/common/BaseAccordion.vue";
import BaseAvatar from "@/components/common/BaseAvatar.vue";
import BaseChip from "@/components/common/BaseChip.vue";
import BaseList from "@/components/common/BaseList.vue";
import BaseTable from "@/components/common/BaseTable.vue";
import BaseModal from "@/components/common/BaseModal.vue";
import BaseToast from "@/components/common/BaseToast.vue";
import BaseTooltip from "@/components/common/BaseTooltip.vue";
import BasePopover from "@/components/common/BasePopover.vue";
import BaseContextMenu from "@/components/common/BaseContextMenu.vue";
import BaseContainer from "@/components/common/BaseContainer.vue";
import BaseGrid from "@/components/common/BaseGrid.vue";
import BaseSection from "@/components/common/BaseSection.vue";

export default {
  name: "PlaygroundView",
  components: {
    BaseButton,
    BaseField,
    BaseCheckbox,
    BaseSwitch,
    BaseRadio,
    BaseBadge,
    BaseTabs,
    BaseBreadcrumb,
    BasePagination,
    BaseStepper,
    BaseAccordion,
    BaseAvatar,
    BaseChip,
    BaseList,
    BaseTable,
    BaseModal,
    BaseToast,
    BaseTooltip,
    BasePopover,
    BaseContextMenu,
    BaseContainer,
    BaseGrid,
    BaseSection,
  },
  data() {
    return {
      activeTab: "core",
      tabs: [
        { key: "core", label: "Core / Inputs", slot: "core" },
        { key: "navigation", label: "Navigation", slot: "navigation" },
        { key: "data", label: "Data Display", slot: "data" },
        { key: "overlay", label: "Overlay / Feedback", slot: "overlay" },
        { key: "layout", label: "Layout", slot: "layout" },
      ],
      email: "",
      password: "",
      about: "",
      language: "",
      themeChoice: "system",
      agree: false,
      notifications: true,

      // Navigation data
      breadcrumbItems: [
        { label: "Home" },
        { label: "Studio" },
        { label: "Radar" },
      ],
      paginationPage: 1,
      stepperStep: 1,
      stepperSteps: [
        { label: "기본 정보", description: "이름, 이메일, 연락처" },
        { label: "설정", description: "권한, 알림, 테마" },
        { label: "검토", description: "최종 확인" },
      ],
      accordionItems: [
        {
          title: "무슨 프로젝트인가요?",
          content: "Radar / DS Assistant UI Kit",
        },
        {
          title: "기술 스택은?",
          content: "Vue 3, Webpack, SCSS, Design Tokens",
        },
        { title: "배포 환경은?", content: "Spring Boot + Vue SPA" },
      ],

      // Data display
      chipClosed: false,
      lastListClick: "",
      tableColumns: [
        { key: "id", label: "ID", sortable: true },
        { key: "name", label: "이름", sortable: true },
        { key: "status", label: "상태", sortable: true },
      ],
      tableRows: [
        { id: 1, name: "Studio-Alpha", status: "Active" },
        { id: 2, name: "Studio-Beta", status: "Paused" },
        { id: 3, name: "Studio-Gamma", status: "Active" },
        { id: 4, name: "Studio-Delta", status: "Error" },
        { id: 5, name: "Studio-Epsilon", status: "Active" },
        { id: 6, name: "Studio-Zeta", status: "Active" },
        { id: 7, name: "Studio-Eta", status: "Paused" },
      ],
      selectedRowKeys: [],

      // Overlay
      showModal: false,
      showToast: false,
      contextMenuItems: [
        { label: "새 탭에서 열기", action: "new-tab" },
        { label: "링크 복사", action: "copy" },
        { label: "즐겨찾기에 추가", action: "fav" },
      ],
      lastContextSelect: null,
    };
  },
  methods: {
    triggerToast() {
      this.showToast = true;
      setTimeout(() => {
        this.showToast = false;
      }, 1800);
    },
  },
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

.playground__tabs {
  margin-top: var(--space-2);
}

.playground__section {
  margin-top: var(--space-2);
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

  h3 {
    margin-top: 0;
    margin-bottom: var(--space-2);
    font-size: var(--font-size-sm);
  }
}

.playground__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-4);
}

.playground__row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.playground__hint {
  margin-top: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.playground__context-target {
  padding: var(--space-2);
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  font-size: var(--font-size-xs);
}

.playground__box {
  border-radius: var(--radius-md);
  border: 1px dashed var(--color-border);
  padding: var(--space-3);
  text-align: center;
  font-size: var(--font-size-sm);
}

.playground__fullwidth {
  grid-column: 1 / -1;
}
</style>
