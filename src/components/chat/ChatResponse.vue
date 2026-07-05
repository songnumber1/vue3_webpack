<template>
  <div v-if="respObj.role === 'assistant'" class="chat-bubble-ai">
    <div class="conts" :msg-id="respObjId">
      <div :id="'resp' + respObj.id" class="chat-text-box">
        <div v-if="!isNull(respObj.reasoningContent)" class="think-wrap">
          <div
            class="think-tag-header"
            :class="{'loading-shine': isReasoningLoading && respObj.id !== 1}"
            @click="hideStatus"
          >
            <i class="toggle-arrow" :class="[!isHidden ? '' : 'floded']"></i>
            <span class="text">{{ reasoningStatusTextIInfo }}</span>
          </div>

          <MarkdownViewer
            v-if="!isHidden"
            :id="'md_reason_' + respIndex"
            :content="respObj.reasoningContent || ''"
            :is-reasoning="true"
            :resp-obj-id="respObjId"
          />
        </div>

        <MarkdownViewer
          :id="'md_' + respIndex"
          :content="respObj.content || ''"
          :is-reasoning="false"
          :resp-obj-id="respObjId"
        />
      </div>

      <div v-if="!isNull(respObj.console?.warnType)" class="caution-box">
        <span class="icon-caution">경고가 발생했습니다.</span>
      </div>
    </div>

    <div v-if="respObj.id !== 1" class="chat-feedback">
      <div class="re-action-box">
        <MessageActions
          v-if="!selectedAssistantInfo?.privateYN && !requireInfo.isSharedChat"
          role="assistant"
          :content="respObj.content || ''"
          :show-regenerate="usableGeneration && requireInfo.isActivetedReGen"
          @regenerate="requireInfo.reGeneration?.()"
        />

        <div class="icon-btns">
          <div>
            <button
              class="basic-btn icon-only large"
              type="button"
              @click="requireInfo.copy?.(respObj.content, '답변이 복사되었습니다.')"
            >
              <i class="icon-setChat-copy"></i>
              <span>클립보드 복사</span>
            </button>
          </div>

          <div v-if="usableGeneration && requireInfo.isActivetedReGen">
            <button class="basic-btn icon-only large" type="button" @click="requireInfo.reGeneration?.()">
              <i class="icon-setChat-regen"></i>
              <span>답변 재생성 버튼</span>
            </button>
          </div>

          <div v-if="usableGeneration && requireInfo.isActivatedContinue">
            <button class="basic-btn icon-only large" type="button" @click="requireInfo.continueGeneration?.()">
              <i class="icon-setChat-start"></i>
              <span>계속 작성 버튼</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isActivateChatFooter" class="chat-footer-wrap">
      <div class="chat-footer">
        <div v-if="hasSourceInfo" class="chat-source-wrap">
          <slot name="sources" :message="respObj"></slot>
        </div>
        <AssistantRagImages v-if="hasRagImages" :items="respObj.ragimage" />
        <AssistantDuoLinks v-if="hasDuoLinks" :items="respObj.duo" />
      </div>
    </div>
  </div>

  <div v-else-if="respObj.role === 'response'" id="waitingResponse" class="chat-bubble-ai">
    <div class="conts">
      <div class="chat-text-box">
        <div class="think-tag-header loading-shine" :style="waitingCursorStatus" @click="hideStatus">
          <i v-if="isReasoingModel" class="toggle-arrow" :class="[!isHidden ? '' : 'floded']"></i>
          <span v-if="isReasoingModel" class="text">생각하는 중입니다.</span>
          <span v-else class="text">답변 중입니다.</span>
        </div>
      </div>
    </div>
  </div>

  <template v-else>
    <div class="err-box">
      <p>
        <span class="icon-err">{{ errorContent }}</span>
      </p>
    </div>
    <div v-if="usableGeneration && requireInfo.isActivetedReGen" class="chat-feedback">
      <div class="re-action-box">
        <div class="icon-btns">
          <div>
            <button class="basic-btn icon-only large" type="button" @click="requireInfo.reGeneration?.()">
              <i class="icon-setChat-regen"></i>
              <span>답변 재생성 버튼</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useChatStore} from "@/stores/chatStore";
import MarkdownViewer from "@/components/chat/MarkdownViewer.vue";
import AssistantDuoLinks from "@/components/chat/AssistantDuoLinks.vue";
import AssistantRagImages from "@/components/chat/AssistantRagImages.vue";
import MessageActions from "@/components/chat/MessageActions.vue";

const props = defineProps({
  requireInfo: {type: Object, required: true},
});

const chatStore = useChatStore();
const {locale} = useI18n();
const isHidden = ref(true);

function isNull(value) {
  return value === null || value === undefined || value === "";
}

const selectedAssistantInfo = computed(() => chatStore.selectedAssistInfo || {});
const respIndex = computed(() => props.requireInfo.respIndex);
const lastIdx = computed(() => props.requireInfo.lastIdx);
const respObj = computed(() => props.requireInfo.chatCompletions?.[respIndex.value] || {});
const respObjId = computed(() => respObj.value.id);
const isReasoingModel = computed(() => props.requireInfo.isReasoingModel);

const waitingCursorStatus = computed(() => (isReasoingModel.value ? "" : "cursor:default;"));
const isReasoning = computed(
  () => isReasoingModel.value && !isNull(respObj.value.reasoningContent)
);
const isLast = computed(() => respIndex.value === lastIdx.value);
const isReasoningLoading = computed(
  () => isNull(respObj.value.stopReason) && isNull(respObj.value.content)
);
const reasoningStatusTextIInfo = computed(() => {
  const statusInfo = {};

  if (isReasoning.value) {
    if (isLast.value) {
      statusInfo.ko = "완료되었습니다.";
      statusInfo.en = "Complete";
    } else {
      statusInfo.ko = "생각하는 중입니다.";
      statusInfo.en = "Thinking";
    }
  } else if (!isNull(respObj.value.reasoningContent)) {
    if (isNull(respObj.value.content)) {
      statusInfo.ko = "답변 중입니다.";
      statusInfo.en = "Answering";
    } else {
      statusInfo.ko = "완료되었습니다.";
      statusInfo.en = "Complete";
    }
  }

  const currentLocale = locale.value || "ko";
  return statusInfo[currentLocale] || statusInfo.ko || "";
});

const usableGeneration = computed(() => {
  if (!props.requireInfo.isActivetedRequest) return false;
  if (respIndex.value !== lastIdx.value) return false;
  return true;
});
const hasDuoLinks = computed(() => Array.isArray(respObj.value.duo) && respObj.value.duo.length > 0);
const hasRagImages = computed(
  () => Array.isArray(respObj.value.ragimage) && respObj.value.ragimage.length > 0
);
const hasSourceInfo = computed(
  () => Array.isArray(respObj.value.sources) && respObj.value.sources.length > 0
);
const isActivateChatFooter = computed(
  () => hasSourceInfo.value || hasRagImages.value || hasDuoLinks.value
);
const errorContent = computed(() => String(respObj.value.content || "").split("\n\n")[0]);

watch(
  () => respObj.value,
  () => {
    // feedback 조회는 현재 프로젝트 MessageActions/별도 컴포넌트가 담당하므로 여기서는 수행하지 않습니다.
  },
  {immediate: true}
);

function hideStatus() {
  if (!isReasoingModel.value) return;
  isHidden.value = !isHidden.value;
}
</script>
