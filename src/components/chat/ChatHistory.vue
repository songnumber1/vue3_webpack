<template>
  <div id="chat-panel-body" class="chat-panel-body message-list-shell">
    <section
      ref="scrollRef"
      class="chat-dialog-wrap message-list body-contents"
      aria-live="polite"
      :aria-busy="isWait ? 'true' : 'false'"
    >
      <div class="chat-dialog">
        <div
          v-for="(chatCompletion, index) in chatCompletions.filter((item) => item.role === 'user')"
          :id="'qna_' + index"
          :key="chatCompletion.id || index"
          class="qna_section"
        >
          <ChatUser
            :data-message-id="chatCompletion.id"
            :msg-id="chatCompletion.id"
            :require-info="{
              isMyChat,
              isCopyable: isAssist && isModel,
              isDebugMode,
              chatCompletion,
              chatImageList,
              refFileList: regFileList,
              selectd: selectedModel,
              selectedPromptTmplate,
              changeSelectedMessageId: chageSelectedMessageId,
              setNewIntionInfo,
              createSearchPoint,
              imageToggleInfo,
            }"
          />

          <ChatResponse
            v-if="lastChatIdx >= index * 2 + 1"
            :data-message-id="chatCompletions[index * 2 + 1].id"
            :msg-id="chatCompletions[index * 2 + 1].id"
            :require-info="{
              isReasoingModel,
              isSharedChat: isReadOnlyChat,
              userObject: chatCompletion,
              chatCompletions,
              respIndex: index * 2 + 1,
              lastIdx: lastChatIdx,
              isActivetedRequest,
              isActivetedReGen: isActivatedReGen,
              isActivatedContinue: isActivetedContinue,
              reGeneration,
              continueGeneration,
              registerFeedback,
              copy,
              openTooltiop: openTooltip,
              closeTooltip,
              openConfirmDialog,
              openImagePopup,
              moveImageDisplay,
              createSearchPoint,
            }"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import {computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, triggerRef, watch} from "vue";
import ChatUser from "@/components/chat/ChatUser.vue";
import ChatResponse from "@/components/chat/ChatResponse.vue";
import {SSE} from "@/api/sse/vendor/sse";
import {SERVER_API_BASE_URL, shouldUseFrontendMockApi} from "@/constants/apiMode";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";
import {resolveChatApis} from "@/api/runtime/chatApis";
import {streamText} from "@/api/mock/fakeStream";
import {createId} from "@/utils/id";
import {i18n} from "@/i18n/appI18n";
import {useChatStore} from "@/stores/chatStore";
import {useFileStore} from "@/stores/fileStore";
import {adaptChatHistoryList} from "@/adapters/chatResponseAdapter";

const chatStore = useChatStore();
const fileStore = useFileStore();
const {chatHistoryApi, generationErrorApi} = resolveChatApis();

const chatCompletions = shallowRef([]);
const chatOwnerName = ref(null);
const messageFileList = ref([]);
const chatImageList = ref([]);
const regFileList = ref([]);
const eventSource = ref(null);
const completionTimer = ref(null);
const respMsgId = ref(null);
const isHndleScroll = ref(false);
const isGeneration = ref(false);
const isChangeChatId = ref(true);
const abortInfo = reactive({});
const respondingInfo = reactive({curIdex: 0, endIdx: 0});
const imageToggleInfo = reactive({});
const scrollRef = ref(null);
const currentChatInfo = ref(null);
let scrollResizeObserver = null;
let scrollSyncTimerIds = [];
let searchScrollTimerIds = [];
let autoScrollBottomTimerIds = [];
let scrollListenerElements = [];
let lastScrollElement = null;

const selectedChatId = computed(() => chatStore.selectedChatId);
const selectedChatInfo = computed(() => chatStore.selectedChatInfo);
const selectedAssist = computed(() => chatStore.selectedAssist);
const selectedAssistInfo = computed(() => chatStore.selectedAssistInfo);
const selectedModel = computed(() => chatStore.selectedModel);
const selectedModelInfo = computed(() => chatStore.selectedModelInfo);
const selectedChatSearchInfo = computed(() => chatStore.selectedChatSearchInfo);
const generateMsgId = computed(() => chatStore.generateMsgId);
const inpuChat = computed(() => chatStore.inpuChat);
const selectedIntention = computed(() => chatStore.selectedIntention);
const selectedPromptTmplate = computed(() => chatStore.selectedPromptTmplate);
const selectedRagOptions = computed(() => chatStore.selectedRagOptions);
const tmpSelectedRagOptions = computed(() => chatStore.tmpSelectedRagOptions);
const externalOptions = computed(() => chatStore.externalOptions);
const tempImgFile = computed(() => fileStore.tempImgFile);
const tempFileList = computed(() => fileStore.tempFileList);
const isActivedStop = computed(() => chatStore.isActivedStop);
const isStopGeneration = computed(() => chatStore.isStopGeneration);
const isActivedReGen = computed(() => chatStore.isActivedReGen);
const isActivatedContinue = computed(() => chatStore.isActivatedContinue);
const isWait = computed(() => chatStore.isWait);
const isEmptyChat = computed(() => chatCompletions.value.length === 0);
const lastChatIdx = computed(() => chatCompletions.value.length - 1);
const isReadOnlyChat = computed(
  () =>
    chatStore.isSharedChat ||
    chatStore.isActiveSharedRoom ||
    selectedChatInfo.value?.roomType === ACTIVE_ROOM_TYPES.shared ||
    selectedChatInfo.value?.sharedId ||
    selectedChatInfo.value?.ShardId
);
const isMyChat = computed(() => {
  const info = selectedChatInfo.value;
  if (!info) return undefined;
  return chatStore.userInfo?.userId === info.userId;
});
const isAssist = computed(() => {
  const info = selectedAssistInfo.value;
  if (!info) return undefined;
  return !info.delYN;
});
const isModel = computed(() => {
  const info = selectedModelInfo.value;
  if (!info) return undefined;
  return !info.delYN;
});
const isActivetedRequest = computed(() => {
  if (!isMyChat.value) return false;
  if (!isAssist.value) return false;
  if (!isModel.value) return false;
  return !isReadOnlyChat.value;
});
const lastUserChat = computed(() => {
  if (isEmptyChat.value) return null;
  const idx = chatCompletions.value.length > 1 ? chatCompletions.value.length - 2 : 0;
  const item = chatCompletions.value[idx];
  return item?.role === "user" ? item : null;
});
const lastUserChatInfo = computed(() => lastUserChat.value);
const lastChatInfo = computed(() => {
  if (isEmptyChat.value) return null;
  const item = chatCompletions.value[chatCompletions.value.length - 1];
  return item?.role === "user" ? null : item;
});
const isCommonValid = computed(() => {
  if (!isActivetedRequest.value) return false;
  if (selectedAssistInfo.value?.privateYN) return false;
  if (isWait.value) return false;
  if (!lastUserChat.value) return false;
  if (!lastChatInfo.value) return false;
  return true;
});
const isActivatedReGen = computed(() => isCommonValid.value);
const isActivetedContinue = computed(() => Boolean(isCommonValid.value && lastChatInfo.value?.stopReason === "length"));
const isReasoingModel = computed(() => selectedAssistInfo.value?.isReasoingModel);
const isDebugMode = computed(() => false);
const searchContent = computed(() => {
  const info = selectedChatSearchInfo.value;
  if (!info) return false;
  return info.searchContent;
});

watch(selectedChatId, () => {
  chatStore.setCurChatIntention(null);
  chatStore.setGenerateMsgId(null);
  chatStore.setCodeInterpreter(null);

  if (!selectedChatId.value) return;

  isHndleScroll.value = false;
  resetChatCompletions();
  isChangeChatId.value = true;
  abortRequestAll();
  getChatHistInfo();
});

watch(inpuChat, () => {
  if (blockReturn()) return;
  getLLMAnswer();
});

watch(chatCompletions, () => {
  handleChatHistoryLoaded();
});

watch(isActivedStop, (newVal) => {
  chatStore.setGenerationInfo({stop: newVal});
});

watch(isStopGeneration, (newVal) => {
  if (!newVal) return;
  chatStore.setGenerationInfo({stop: newVal, stopAction: newVal});
});

watch(isActivedReGen, (newVal) => {
  chatStore.setGenerationInfo({re: newVal || isActivatedReGen.value});
});

watch(isActivatedContinue, (newVal) => {
  chatStore.setGenerationInfo({con: newVal || isActivetedContinue.value});
});

onMounted(() => {
  addEventListenerScroll();
  initScrollBottomObserver();

  let newChatFlowFunc = null;

  if (!generateMsgId.value) {
    isChangeChatId.value = false;
    newChatFlowFunc = getLLMAnswer;
  } else {
    newChatFlowFunc = getChatHistInfo;
  }

  newChatFlowFunc();
});

onBeforeUnmount(() => {
  removeEventListenerScroll();
  destroyScrollBottomObserver();
  if (eventSource.value) {
    eventSource.value.close?.();
  }
  abortRequestAll();
});

function getUniqueElements(items) {
  return items.filter((item, index, array) => item && array.indexOf(item) === index);
}

function getScrollCandidates() {
  if (typeof document === "undefined") return getUniqueElements([scrollRef.value]);

  const root = scrollRef.value;
  return getUniqueElements([
    root?.querySelector?.("[data-overlayscrollbars-viewport]"),
    root?.querySelector?.(".os-viewport"),
    root,
    document.querySelector?.(".conversation-workspace [data-overlayscrollbars-viewport]"),
    document.querySelector?.(".conversation-workspace .os-viewport"),
    document.querySelector?.(".conversation-workspace .message-list"),
    document.querySelector?.(".body-contents"),
  ]);
}

function getScrollMetrics() {
  const candidates = getScrollCandidates();
  let selected = null;

  for (const element of candidates) {
    if (!element || typeof element.scrollHeight !== "number") continue;

    const overflow = Math.max(0, element.scrollHeight - element.clientHeight);
    const distanceFromBottom = Math.max(0, element.scrollHeight - element.scrollTop - element.clientHeight);
    const metrics = {element, overflow, distanceFromBottom};

    if (!selected) {
      selected = metrics;
      continue;
    }

    if (metrics.overflow > selected.overflow) {
      selected = metrics;
    }
  }

  if (selected?.element) {
    lastScrollElement = selected.element;
  }

  return selected;
}

function getScrollElement() {
  return getScrollMetrics()?.element || lastScrollElement || scrollRef.value;
}

function resetChatCompletions() {
  chatCompletions.value = [];
}

function abortRequestAll() {
  Object.keys(abortInfo).forEach((key) => {
    abortInfo[key]?.abort?.();
    delete abortInfo[key];
  });
}

function getSearchTargetMessageId() {
  const info = selectedChatSearchInfo.value || {};
  return String(
    info.messageId ||
      info.msgId ||
      info.respMsgId ||
      info.searchTargetMessageId ||
      info.targetMessageId ||
      info.raw?.messageId ||
      info.raw?.msgId ||
      info.raw?.respMsgId ||
      ""
  ).trim();
}

function findSearchTargetElement() {
  const scrollElement = getScrollElement();
  const targetMessageId = getSearchTargetMessageId();

  if (targetMessageId) {
    const targetById =
      scrollElement?.querySelector?.(`[msg-id="${targetMessageId}"]`) ||
      scrollElement?.querySelector?.(`[data-message-id="${targetMessageId}"]`) ||
      document.querySelector?.(`[msg-id="${targetMessageId}"]`) ||
      document.querySelector?.(`[data-message-id="${targetMessageId}"]`);

    if (targetById) return targetById;
  }

  const search = searchContent.value;
  if (!search) return null;

  let msgId = null;

  const checkFunc = (content) => {
    if (!content) return false;
    return String(content).indexOf(search) !== -1;
  };

  for (let i = chatCompletions.value.length - 1; i >= 0; i -= 1) {
    const chatCompletion = chatCompletions.value[i];
    const content = chatCompletion?.content;
    const reasoning = chatCompletion?.reasoingContent || chatCompletion?.reasoningContent;

    if (checkFunc(content) || checkFunc(reasoning)) {
      msgId = chatCompletion.id;
      break;
    }
  }

  if (!msgId) return null;

  return (
    scrollElement?.querySelector?.(`[msg-id="${msgId}"]`) ||
    scrollElement?.querySelector?.(`[data-message-id="${msgId}"]`) ||
    document.querySelector?.(`[msg-id="${msgId}"]`) ||
    document.querySelector?.(`[data-message-id="${msgId}"]`)
  );
}

function syncScrollBottomButtonAfterSearch() {
  window.requestAnimationFrame?.(() => {
    syncScrollBottomButton();
  });
  window.setTimeout(() => {
    syncScrollBottomButton();
  }, 80);
}

function scrollToChatId() {
  const target = findSearchTargetElement();

  if (!target) {
    return false;
  }

  target.scrollIntoView({behavior: "instant", block: "start"});
  syncScrollBottomButtonAfterSearch();
  return true;
}

function clearSearchScrollSchedule() {
  searchScrollTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  searchScrollTimerIds = [];
}

function scheduleSearchScrollToChatId() {
  clearSearchScrollSchedule();

  searchScrollTimerIds = [0, 80, 240, 600, 1000].map((delay, index, delays) =>
    window.setTimeout(() => {
      const moved = scrollToChatId();
      if (moved) {
        clearSearchScrollSchedule();
        return;
      }

      const isLastAttempt = index === delays.length - 1;
      if (isLastAttempt) {
        scrollDown({force: true});
      }
    }, delay)
  );
}

function handleChatHistoryLoaded() {
  if (!isGeneration.value) {
    chatStore.setIsWait(false);
    isGeneration.value = false;
  }

  setChatInputFiled();

  nextTick(() => {
    if (selectedChatSearchInfo.value) {
      scheduleSearchScrollToChatId();
    } else if (!isReadOnlyChat.value) {
      scheduleScrollDownToBottom();
    } else {
      scheduleScrollBottomButtonSync();
    }

    createMultipleFeatures();
  });
}

function setChatInputFiled() {
  if (isEmptyChat.value) return;
  if (!isChangeChatId.value) return;
  isChangeChatId.value = false;

  const newSelectedIntention = {};
  setNewIntionInfo(lastUserChat.value, newSelectedIntention);
  chatStore.setCurChatIntention(newSelectedIntention);
}

function setNewIntionInfo(userChatInfo, newIntentionInfo = {}) {
  const isUserChatInfo = userChatInfo === null || userChatInfo === undefined;
  const intentionInfo = !isUserChatInfo
    ? selectedPromptTmplate.value.find((item) => item.promptTemplateName === userChatInfo.intention)
    : null;
  const isIntentionInfo = intentionInfo === null || intentionInfo === undefined;
  const isRAG = isUserChatInfo ? true : userChatInfo.isRAG;

  newIntentionInfo.intention = isIntentionInfo ? 0 : intentionInfo.promptTemplateOrder;
  newIntentionInfo.isRAG = isRAG;

  if (isRAG) {
    if (!isUserChatInfo || userChatInfo.source !== "external" || externalOptions.value.length === 0) {
      newIntentionInfo.source = "internal";
    } else {
      newIntentionInfo.source = "external";
      const web = externalOptions.value.findIndex((item) => item.alias === userChatInfo.external);
      if (web === -1) newIntentionInfo.web = 0;
      else newIntentionInfo.web = web;
    }
  }

  if (isIntentionInfo) {
    return false;
  }

  const tags = JSON.parse(userChatInfo.tags);
  const template = JSON.parse(intentionInfo.promptTemplate);
  const templateKeyList = Object.keys(template);

  for (let i = 0; i < templateKeyList.length; i += 1) {
    const key = templateKeyList[i];
    const templateDetilInfo = template[key];
    const contentList = templateDetilInfo.content;
    const isContent = contentList !== null && contentList !== undefined && contentList !== "";

    if (!isContent) continue;

    let isTag = false;

    for (let c = 0; c < contentList.length; c += 1) {
      const content = contentList[c];
      const contentTag = content.tag;
      const tagIndex = tags.findIndex((item) => item === contentTag);

      if (tagIndex !== -1) {
        newIntentionInfo[key] = c;
        isTag = true;
        break;
      }
    }

    if (!isTag) {
      newIntentionInfo[key] = 0;
    }
  }

  return true;
}

function chageSelectedMessageId() {
  return null;
}

function createMultipleFeatures() {
  return null;
}

function createSearchPoint() {
  return null;
}

function registerFeedback() {
  return null;
}

function copy() {
  return null;
}

function openTooltip() {
  return null;
}

function closeTooltip() {
  return null;
}

function openConfirmDialog() {
  return null;
}

function openImagePopup() {
  return null;
}

function moveImageDisplay() {
  return null;
}

function addEventListenerScroll() {
  removeEventListenerScroll();
  scrollListenerElements = getScrollCandidates();
  scrollListenerElements.forEach((element) => {
    element.addEventListener?.("scroll", setIsHandle, {passive: true});
  });
}

function removeEventListenerScroll() {
  scrollListenerElements.forEach((element) => {
    element.removeEventListener?.("scroll", setIsHandle);
  });
  scrollListenerElements = [];
}

function initScrollBottomObserver() {
  if (typeof ResizeObserver === "undefined") return;

  nextTick(() => {
    scrollResizeObserver = new ResizeObserver(() => {
      addEventListenerScroll();
      scheduleScrollBottomButtonSync();
    });

    getScrollCandidates().forEach((element) => {
      scrollResizeObserver.observe(element);
      const dialog = element.querySelector?.(".chat-dialog");
      if (dialog) scrollResizeObserver.observe(dialog);
    });
  });
}

function destroyScrollBottomObserver() {
  scrollResizeObserver?.disconnect?.();
  scrollResizeObserver = null;
  scrollSyncTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  scrollSyncTimerIds = [];
  clearAutoScrollBottomSchedule();
  clearSearchScrollSchedule();
  removeEventListenerScroll();
}

function scheduleScrollBottomButtonSync() {
  scrollSyncTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  scrollSyncTimerIds = [0, 80, 240, 600].map((delay) =>
    window.setTimeout(() => {
      syncScrollBottomButton();
    }, delay)
  );
}

function clearAutoScrollBottomSchedule() {
  autoScrollBottomTimerIds.forEach((timerId) => window.clearTimeout(timerId));
  autoScrollBottomTimerIds = [];
}

function scheduleScrollDownToBottom() {
  clearAutoScrollBottomSchedule();

  autoScrollBottomTimerIds = [0, 80, 240, 600, 1000].map((delay) =>
    window.setTimeout(() => {
      scrollDown({force: true});
    }, delay)
  );
}

function setIsHandle() {
  syncScrollBottomButton();
}

function syncScrollBottomButton() {
  const metrics = getScrollMetrics();
  if (!metrics?.element) {
    chatStore.setShowScrollBottom(false);
    return;
  }

  const hasOverflow = metrics.overflow > 8;
  const shouldShow = hasOverflow && metrics.distanceFromBottom > 12;
  isHndleScroll.value = shouldShow;
  chatStore.setShowScrollBottom(shouldShow);
}

async function scrollDown(options = {}) {
  const force = Boolean(options?.force);
  if (!force && !isHndleScroll.value) return;

  await nextTick();
  const elements = getScrollCandidates();
  if (elements.length === 0) return;

  const moveToBottom = () => {
    elements.forEach((element) => {
      if (!element || typeof element.scrollHeight !== "number") return;
      element.scrollTop = element.scrollHeight;
    });
    syncScrollBottomButton();
  };

  if (selectedAssist.value === "bed0f859-5dc4-4785-9e2e-a3cf275ff442") {
    elements.forEach((element) => {
      element.querySelectorAll?.("img")?.forEach((image) => {
        image.addEventListener("load", moveToBottom, {once: true});
      });
    });
  }

  window.setTimeout(moveToBottom, 0);
}


function shouldSkipMockEmptyHistoryResult(result) {
  if (!shouldUseFrontendMockApi()) return false;
  if (Array.isArray(result) && result.length > 0) return false;
  if (isGeneration.value) return true;
  return chatCompletions.value.length > 0;
}

async function getResponse(isResponse) {
  try {
    const result = await chatHistoryApi.getChatHistoryDetail({
      chatId: selectedChatId.value,
      assistId: selectedAssistInfo.value.assistId,
      modelId: selectedModelInfo.value.modelId,
      studio: selectedAssistInfo.value.studioYN,
      auth: false,
      respoding: false,
    });

    if (shouldSkipMockEmptyHistoryResult(result)) return;

    chatCompletions.value = result;

    if (!isLastResponse()) {
      chatStore.setIsWait(true);
      setWaitingResponse(false);
      await getChatHistory(true);
      return;
    }

    chatStore.setIsWait(false);
    await getAssocInfo();
    await getRoomInfo();
  } catch (error) {
    void isResponse;
    if (typeof window !== "undefined") window.alert?.(error?.message || "history.do 조회에 실패했습니다.");
    chatStore.setIsWait(false);
  }
}

async function getChatHistory(respondingCheck) {
  try {
    const result = await chatHistoryApi.getChatHistoryDetail({
      chatId: selectedChatId.value,
      assistId: selectedAssistInfo.value.assistId,
      modelId: selectedModelInfo.value.modelId,
      studio: selectedAssistInfo.value.studioYN,
      auth: false,
      respoding: false,
    });

    if (shouldSkipMockEmptyHistoryResult(result)) return;

    chatCompletions.value = result;

    if (respondingCheck) {
      if (!isLastResponse()) {
        await createErrorChat("응답을 받던 도중 연결이 끊겼거나 에러가 발생하였습니다.");
        return;
      }

      chatStore.setIsWait(false);
      await getRoomInfo();
      return;
    }

    if (!isLastResponse()) {
      chatStore.setIsWait(true);
      setWaitingResponse(false);
      await getChatHistory(true);
      return;
    }

    chatStore.setIsWait(false);
    await getRoomInfo();
  } catch (error) {
    if (typeof window !== "undefined") window.alert?.(error?.message || "history.do 조회에 실패했습니다.");
    chatStore.setIsWait(false);
  }
}

async function getChatOwnerName() {
  if (!selectedChatId.value) return;

  const controller = new AbortController();
  abortInfo.getChatOwnerName = controller;

  try {
    chatOwnerName.value = await chatHistoryApi.getChatOwnerName?.(
      selectedChatInfo.value?.userId,
      {signal: controller.signal}
    );
  } catch (error) {
    if (error?.name !== "AbortError") {
      if (typeof window !== "undefined") window.alert?.(error?.message || "getChatOwnerName 조회에 실패했습니다.");
      chatStore.setIsWait(false);
    }
  }
}

async function getMessageFileHist() {
  if (!selectedChatId.value) return;

  const controller = new AbortController();
  abortInfo.getMessageFileHist = controller;

  try {
    const result = await chatHistoryApi.getMessageFileHist?.(
      String(selectedChatId.value).substring(0, 36),
      {signal: controller.signal}
    );
    messageFileList.value = result;
  } catch (error) {
    if (error?.name !== "AbortError") {
      if (typeof window !== "undefined") window.alert?.(error?.message || "getMessageFileHist 조회에 실패했습니다.");
      chatStore.setIsWait(false);
    }
  }
}

async function getChatImageList() {
  if (!selectedChatId.value) return;

  const controller = new AbortController();
  abortInfo.getChatImageList = controller;

  try {
    const result = await chatHistoryApi.getChatImageList?.(
      String(selectedChatId.value).substring(0, 36),
      {signal: controller.signal}
    );
    chatImageList.value = result;
  } catch (error) {
    if (error?.name !== "AbortError") {
      if (typeof window !== "undefined") window.alert?.(error?.message || "getChatImageList 조회에 실패했습니다.");
      chatStore.setIsWait(false);
    }
  }
}

async function getChatStudioInfo() {
  if (!selectedChatId.value) return;
  if (!selectedAssistInfo.value?.studioYN) return;

  try {
    const result = await chatHistoryApi.getChatStudioInfo?.(selectedAssist.value);
    if (result && typeof result === "object") {
      chatStore.setSelectedAssistInfo({
        ...(selectedAssistInfo.value || {}),
        ...result,
      });
    }
  } catch (error) {
    if (typeof window !== "undefined") window.alert?.(error?.message || "getChatStudioInfo 조회에 실패했습니다.");
    chatStore.setIsWait(false);
  }
}

function blockReturn() {
  if (!inpuChat.value) return true;
  return isWait.value;
}

async function createErrorChat(content) {
  if (isEmptyChat.value) return;

  const errorMessage = content;

  chatStore.setIsWait(true);
  clearCompletionTimer();

  if (eventSource.value !== null) {
    eventSource.value?.removeEventListener?.("readystatechange", evtSrcReadyStateChange);
    eventSource.value?.close?.();
  }

  const chat = {
    chatId: selectedChatId.value,
    msgId: createId(),
    assistId: selectedAssist.value,
    modelId: selectedModel.value,
    studio: selectedAssistInfo.value.studioYN,
    body: errorMessage,
  };

  try {
    const result = await generationErrorApi.createGenerationErrorMessages(chat, {message: errorMessage});
    chatStore.setIsWait(false);
    chatCompletions.value = result;
    await getAssocInfo();
    await getRoomInfo();
    chatStore.setIsWait(false);
  } catch (error) {
    if (typeof window !== "undefined") window.alert?.(error?.message || "error.do 호출에 실패했습니다.");
    chatStore.setIsWait(false);
  }
}

async function getRoomInfo() {
  try {
    const list = await chatHistoryApi.getChatHistoryList();
    const chatRooms = adaptChatHistoryList(list, {
      assistantMap: chatStore.assistantMap,
      modelMap: chatStore.modelMap,
    });
    chatStore.setChatRooms(chatRooms);
    chatStore.setSelectedChatId(selectedChatId.value);
  } catch (error) {
    if (typeof window !== "undefined") window.alert?.(error?.message || "list.do 조회에 실패했습니다.");
    chatStore.setIsWait(false);
  }
}

async function getLastChatInfo() {
  return null;
}

async function getLLMAnswer() {
  if (eventSource.value !== null) {
    eventSource.value.close?.();
  }

  if (shouldUseFrontendMockApi() && !inpuChat.value) {
    chatStore.setIsWait(false);
    if (selectedChatId.value) await getChatHistInfo();
    return;
  }

  if (shouldUseFrontendMockApi() && (!selectedIntention.value || !selectedPromptTmplate.value)) {
    if (!selectedIntention.value) {
      chatStore.setSelectedIntention({intention: 0, isRAG: false, isRagCot: false, source: "internal"});
    }

    if (!selectedPromptTmplate.value) {
      chatStore.setSelectedPromptTmplate(chatStore.promptTemplates || []);
    }
  }

  chatStore.setIsWait(true);
  const prompt = getChatInfo();

  const userPrompt = {
    id: prompt.msgId,
    role: "user",
    content: inpuChat.value,
  };

  const model = selectedModelInfo.value;
  const selectedIntentionInfo = selectedIntention.value;
  const intention = selectedIntentionInfo.intention;
  const chatTemplateInfo = selectedPromptTmplate.value.find((item) => item.promptTemplateOrder === intention);
  const promptTemplate = !chatTemplateInfo ? {} : JSON.parse(chatTemplateInfo.promptTemplate);

  prompt.intention = !chatTemplateInfo ? "직접입력" : chatTemplateInfo.promptTemplateName;
  prompt.rag = selectedAssistInfo.value.ragYN && intention === 0 ? selectedIntentionInfo.isRAG : false;
  prompt.ragCot = model.modelType === "orch_DSLLM" && prompt.rag ? selectedIntentionInfo.isRagCot : false;
  prompt.imgS3Path = null;

  if (prompt.rag) {
    const isSSKS = selectedModelInfo.value.modelType.indexOf("SSKS") !== -1;
    const source = !selectedIntentionInfo.source || isSSKS ? "internal" : selectedIntentionInfo.source;
    let arrayOptions = null;

    if (isSSKS) {
      arrayOptions = selectedAssistInfo.value.selectedRagIndexes;
    } else if (source === "internal") {
      arrayOptions = selectedRagOptions.value;
    } else {
      arrayOptions = [tmpSelectedRagOptions.value.external];
    }

    prompt.sourceType = source;
    prompt.arrayOptions = arrayOptions;
  }

  regFileList.value = [];

  if (tempFileList.value) {
    const tempFileSuccessList = tempFileList.value.filter((item) => !item.delYN && !item.isError);

    if (tempFileSuccessList.length > 0) {
      const onlyOneFile = tempFileSuccessList[0];
      const fileId = onlyOneFile.fileId;
      const filePath = onlyOneFile.filePath;
      const fileName = filePath.substring(filePath.lastIndexOf("/") + 1);
      onlyOneFile.fileName = fileName;
      regFileList.value = tempFileSuccessList;

      prompt.getMessageFileHist = {
        fileId,
      };

      fileStore.deletedTmpFileList?.(-1);
    } else {
      prompt.messageFileHist = null;
    }
  } else {
    prompt.messageFileHist = null;
  }

  prompt.styles = [];

  const promptKeys = Object.keys(promptTemplate);

  if (promptKeys.length !== 0 && !promptKeys.includes("html")) {
    if (intention === 5) {
      const web = promptTemplate.web.content[selectedIntentionInfo.web].tag;
      prompt.styles = [web];
    } else {
      const language = promptTemplate.language.content[selectedIntentionInfo.language].tag;
      const style = promptTemplate.style.content[selectedIntentionInfo.style].tag;

      if (intention === 1) {
        // as-is: 메일은 별도 style 처리 없음
      } else if (intention === 2) {
        prompt.styles = [language, style];
      } else if (intention === 3) {
        const length = promptTemplate.length.content[selectedIntentionInfo.length].tag;
        prompt.styles = [language, style, length];
      }
    }
  }

  prompt.body = userPrompt.content;
  prompt.byteSize = 10000;

  const ragContextMaxBytes = Number(new URLSearchParams(window.location.search).get("rag_context_max_bytes"));
  if (Number.isNaN(ragContextMaxBytes) === false) {
    prompt.byteSize = Math.floor(ragContextMaxBytes);
  }

  userPrompt.intention = prompt.intention;
  userPrompt.isRAG = prompt.rag;
  userPrompt.isRagCot = prompt.ragCot;
  userPrompt.imgS3Path = null;
  userPrompt.tag = JSON.stringify(prompt.styles);

  await nextTick();
  chatStore.setDetailSelectedIntention(["sender", ""]);
  chatStore.setDetailSelectedIntention(["receiver", ""]);
  chatStore.setInpuChat("");

  if (tempImgFile.value) {
    let folderName = getPolishedDate("D");
    folderName += "/" + chatStore.userInfo.userId;
    folderName += "/" + prompt.chatId;
    folderName += "/" + prompt.msgId;

    let path = folderName;
    path += "/" + tempImgFile.value.name;

    userPrompt.imgS3Path = path;
    prompt.imgS3Path = path;

    const reader = new FileReader();

    reader.onload = (event) => {
      userPrompt.tmpImg = event.target.result;
      setTemCompletion(userPrompt);
    };

    reader.readAsDataURL(tempImgFile.value);
    uploadFile("", prompt);
    return;
  }

  setTemCompletion(userPrompt);
  generation("", prompt);
}

function getChatInfo() {
  if (!generateMsgId.value) {
    chatStore.setGenerateMsgId(createId());
  }

  respMsgId.value = createId();

  const chatInfo = {
    chatId: selectedChatId.value,
    msgId: generateMsgId.value,
    respMsgId: respMsgId.value,
    assistId: selectedAssist.value,
    modelId: selectedModel.value,
    studio: selectedAssistInfo.value.studioYN,
  };

  chatStore.setGenerateMsgId(null);
  return chatInfo;
}

function getPolishedDate(scope) {
  const dt = new Date();
  let result = "";
  result += dt.getFullYear();
  result += "-" + (dt.getMonth() >= 9 ? "" : "0") + (dt.getMonth() + 1);
  result += "-" + (dt.getDate() >= 10 ? "" : "0") + dt.getDate();

  if (scope === "D") {
    return result;
  }

  result += "-" + (dt.getHours() >= 10 ? "" : "0") + dt.getHours();
  result += "-" + (dt.getMinutes() >= 10 ? "" : "0") + dt.getMinutes();
  result += "-" + (dt.getSeconds() >= 10 ? "" : "0") + dt.getSeconds();

  return result;
}

async function uploadFile(genType, prompt) {
  const filePath = prompt.messageFileHist === null || prompt.messageFileHist === undefined ? prompt.imgS3Path : prompt.filePath;
  await getPresignedURL(filePath, genType, prompt, "C");
}

async function getPresignedURL(filePath, genType, prompt, crudType) {
  try {
    const result = await chatHistoryApi.getPresignedURL?.(filePath, genType, prompt, crudType);
    await uploadPresignedFile(result, {genType, prompt});
  } catch (error) {
    if (typeof window !== "undefined") window.alert?.(error?.message || "uploadFile 호출에 실패했습니다.");
    chatStore.setIsWait(false);
    await getChatHistInfo();
  }
}

async function uploadPresignedFile(result, param) {
  const genType = param.genType;
  const prompt = param.prompt;
  const file = tempImgFile.value;

  try {
    await chatHistoryApi.uploadPresignedFile?.(result?.presignUrl, file);
    const chatCompletion = lastChatInfo.value;
    if (chatCompletion) chatCompletion.content = prompt.body;
    fileStore.setTempImgFile(null);
    generation(genType, prompt);
  } catch (error) {
    fileStore.setTempImgFile(null);
    chatStore.setIsWait(false);
    await getChatHistInfo();
  }
}

function setTemCompletion(userPrompt) {
  chatCompletions.value = [...chatCompletions.value, userPrompt];
  setWaitingResponse(false);
}

function setWaitingResponse(isReplace) {
  const waitingCompletion = {
    role: "response",
    content: "답변 생성 중...",
  };

  if (!isReplace) {
    chatCompletions.value = [...chatCompletions.value, waitingCompletion];
  } else {
    const nextCompletions = [...chatCompletions.value];
    nextCompletions[nextCompletions.length - 1] = waitingCompletion;
    chatCompletions.value = nextCompletions;
  }

  isHndleScroll.value = false;
  scrollDown();
}

function resolveGenerationUrl(genType = "") {
  const base = SERVER_API_BASE_URL.replace(/\/$/, "");
  return `${base}/chat-message-history/${genType}generation.do`;
}

function generation(genType = "", prompt = {}) {
  closeEventSource();
  isGeneration.value = true;

  currentChatInfo.value = prompt;

  if (shouldUseFrontendMockApi()) {
    streamFrontendGeneration(prompt);
    return;
  }

  eventSource.value = new SSE(resolveGenerationUrl(genType), {
    headers: {"Content-Type": "application/json"},
    payload: JSON.stringify(prompt),
    method: "POST",
  });

  const onmessageFunc = getOnMessageFunc();
  let isStart = false;

  eventSource.value.onmessage = (success) => {
    if (!validateBefOnMessaging(success?.data)) return;
    if (!isStart) {
      isStart = true;
      getAssocInfo();
    }
    onmessageFunc(success, prompt);
  };

  const errorMessage = "서비스에 문제로 인하여 잠시 후 시도하세요.";

  eventSource.value.onerror = () => {
    createErrorChat(errorMessage);
  };

  eventSource.value.addEventListener?.("readystatechange", evtSrcReadyStateChange);
  createTimeer();
  eventSource.value.stream();
}

function createFrontendMockAnswer(prompt = {}) {
  const body = prompt.body || "질문";
  return `프론트 단독 테스트 응답입니다.\n\n질문: ${body}\n\n이 응답은 mock stream으로 생성되었습니다.`;
}

function streamFrontendGeneration(prompt = {}) {
  const controller = new AbortController();
  const onmessageFunc = getOnMessageFunc();
  let isStart = false;
  let previousContent = "";
  const useSkillSetParser = onmessageFunc === getSkillSetAnswer;

  eventSource.value = {
    close() {
      controller.abort();
    },
    addEventListener() {},
  };

  createTimeer();

  const dispatchMessage = (data) => {
    if (!validateBefOnMessaging(data)) return;
    if (!isStart) {
      isStart = true;
      getAssocInfo();
      if (!useSkillSetParser) {
        onmessageFunc(
          {data: JSON.stringify({choices: [{finish_reason: null, delta: {role: "assistant"}}]})},
          prompt
        );
      }
    }
    onmessageFunc({data}, prompt);
  };

  streamText(
    createFrontendMockAnswer(prompt),
    (content) => {
      const deltaContent = content.slice(previousContent.length);
      previousContent = content;
      if (!deltaContent) return;

      if (useSkillSetParser) {
        dispatchMessage(JSON.stringify({text: deltaContent}));
        return;
      }

      dispatchMessage(
        JSON.stringify({choices: [{finish_reason: null, delta: {content: deltaContent}}]})
      );
    },
    {delay: 18, signal: controller.signal}
  )
    .then(async () => {
      finalizeFrontendMockAnswer(prompt);
      await chatHistoryApi.saveGeneratedMessages?.({
        chatId: prompt.chatId,
        messages: chatCompletions.value,
      });
      if (prompt.chatId) await getRoomInfo();
      evtSrcReadyStateChange({readyState: 2});
    })
    .catch((error) => {
      if (error?.name !== "AbortError") createErrorChat("서비스에 문제로 인하여 잠시 후 시도하세요.");
    });
}

function finalizeFrontendMockAnswer(prompt = {}) {
  const index = chatCompletions.value.length - 1;
  if (index < 0) return;

  const completion = chatCompletions.value[index];
  if (!completion || completion.role === "user") return;

  const nextCompletions = [...chatCompletions.value];
  const completedId = respMsgId.value || createId();

  if (completion.role === "response") {
    nextCompletions[index] = {
      id: completedId,
      content: createFrontendMockAnswer(prompt),
      feedback: 0,
      role: "assistant",
      intention: prompt.intention,
      isRAG: prompt.rag,
      rag: prompt.rag,
      stopReason: null,
    };
    chatCompletions.value = nextCompletions;
    return;
  }

  if (completion.role === "assistant" && completion.id === 1) {
    nextCompletions[index] = {
      ...completion,
      id: completedId,
      stopReason: completion.stopReason || null,
    };
    chatCompletions.value = nextCompletions;
  }
}

function evtSrcReadyStateChange(event) {
  if (event?.readyState !== 2) return;
  completeAnswer();
}

function getOnMessageFunc() {
  const modelType = selectedModelInfo.value?.modelType;

  switch (modelType) {
    case "Orch_V2":
    case "Orch_V2_SSKS":
    case "Orch_V2_Studio":
      return getAzurAnswer;

    case "HCX_SkillSet":
      return getSkillSetAnswer;

    case "Orch_V2_Reasoning":
    case "Orch_V2_SSKS_Reasoning":
    case "Orch_V2_Studio_Reasoning":
    case "Orch_V2_Studio_Secure":
    case "DeepResearch":
      return getReasoningModelAnswer;

    default:
      return getAzurAnswer;
  }
}

function getAzurAnswer(success, chat = currentChatInfo.value || {}) {
  const data = success.data;

  if (data === "[DONE]") return;

  if (data === "Error") {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const json = JSON.parse(data);
  const choices = json.choices;

  if (choices.length === 0) return;

  const choice = choices[0];
  if (choice.finish_reason !== null && choice.finish_reason !== undefined) return;

  const delta = choice.delta;
  const respCompletion = lastChatInfo.value;
  const responseInfo = {
    role: delta.role,
    intention: chat.intention,
    rag: chat.rag,
  };

  if (addRespCompletion(delta.role === "assistant" && respCompletion?.role === "response", responseInfo)) {
    return;
  }

  nextTick(() => {
    const response = lastChatInfo.value;
    if (!response) return;
    response.content = (response.content || "") + (delta.content || "");
    triggerRef(chatCompletions);
    setIsHandle();
  });

  createTimeer();
}

function getSkillSetAnswer(success, chat = currentChatInfo.value || {}) {
  const json = JSON.parse(success.data);

  if (json.data === "[DONE]") return;

  const status = json.status;
  if (status !== undefined && status !== null && status.code !== undefined) {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const respCompletion = lastChatInfo.value;

  if (respCompletion?.role === "response") {
    if (json.text !== undefined) {
      const response = {
        id: 1,
        content: json.text,
        feedback: 0,
        role: "assistant",
        intention: chat.intention,
        isRAG: chat.rag,
      };

      const nextCompletions = [...chatCompletions.value];
      nextCompletions[nextCompletions.length - 1] = response;
      chatCompletions.value = nextCompletions;
    }

    createTimeer();
    return;
  }

  nextTick(() => {
    const response = lastChatInfo.value;
    if (!response) return;
    response.content = (response.content || "") + json.text;
    triggerRef(chatCompletions);
    setIsHandle();
  });

  createTimeer();
}

function getReasoningModelAnswer(success, chat = currentChatInfo.value || {}) {
  const data = success.data;

  if (data === "[DONE]") return;

  if (data === "Error") {
    createErrorChat("사용자/사용량이 너무 많아서 잠시후 다시 시도해주세요");
    return;
  }

  const json = JSON.parse(data);
  const choices = json.choices;
  if (choices.length === 0) return;

  const choice = choices[0];
  const finishReason = choice.finish_reason;
  if (finishReason !== null && finishReason !== undefined) return;

  const delta = choice.delta;
  const respCompletion = lastChatInfo.value;
  const responseInfo = {
    role: delta.role,
    intention: chat.intention,
    rag: chat.rag,
  };

  if (addRespCompletion(delta.role === "assistant" && respCompletion?.role === "response", responseInfo)) {
    return;
  }

  nextTick(() => {
    const response = lastChatInfo.value;
    if (!response) return;

    const reasoningContent = delta.reasoning_content;
    const content = delta.content;

    if (reasoningContent !== undefined && reasoningContent !== null) {
      response.reasoningContent = (response.reasoningContent || "") + reasoningContent;
    } else if (content !== undefined && content !== null) {
      response.content = (response.content || "") + content;
    }

    triggerRef(chatCompletions);
    setIsHandle();
  });

  createTimeer();
}

function addRespCompletion(isStartResponse, responseInfo = {}) {
  if (!isStartResponse) return false;

  const response = {
    id: 1,
    feedback: 0,
    role: responseInfo.role,
    intention: responseInfo.intention,
    rag: responseInfo.rag,
    content: responseInfo.content || "",
    reasoningContent: responseInfo.reasoningContent || "",
  };

  const nextCompletions = [...chatCompletions.value];
  nextCompletions[nextCompletions.length - 1] = response;
  chatCompletions.value = nextCompletions;
  createTimeer();
  return true;
}

async function completeAnswer() {
  clearCompletionTimer();
  eventSource.value?.close?.();
  eventSource.value = null;
  respondingInfo.curIdx = 0;
  respondingInfo.endIdx = 0;

  if (shouldUseFrontendMockApi()) {
    chatStore.setIsWait(false);
    isGeneration.value = false;
    await nextTick();
    scheduleScrollBottomButtonSync();
    return;
  }

  await getChatHistInfo();
}

async function getAssocInfo() {
  await getChatOwnerName();
  await getMessageFileHist();
  await getChatImageList();
  await getChatStudioInfo();
  await getLastChatInfo();
}

async function getChatHistInfo() {
  await getAssocInfo();
  await getChatHistory(false);
}

function stopGeneration() {
  return;
}

function getFileFlag(userMsgId) {
  if (messageFileList.value.findIndex((item) => userMsgId === item.msgId) !== -1) return true;
  if (chatImageList.value.findIndex((item) => userMsgId === item.msgId) !== -1) return true;
  return false;
}

function reGeneration() {
  if (!isActivatedReGen.value || !lastUserChatInfo.value || !selectedChatId.value) return;

  chatStore.setIsWait(true);
  const newChatInfo = getChatInfo();
  const user = lastUserChatInfo.value;
  const userMsgId = user.id;
  const isFile = getFileFlag(userMsgId);

  newChatInfo.intention = user.intention;
  newChatInfo.rag = user.isRAG;
  newChatInfo.befMsgId = isFile ? userMsgId : null;

  setWaitingResponse(true);
  if (!isFile) chatStore.setIsStream(true);
  generation("re-", newChatInfo);
}

function continueGeneration() {
  if (!isActivetedContinue.value || !lastUserChatInfo.value || !selectedChatId.value) return;

  chatStore.setIsWait(true);
  const newChatInfo = getChatInfo();
  const user = lastUserChatInfo.value;
  const userMsgId = user.id;
  const isFile = getFileFlag(userMsgId);

  newChatInfo.intention = user.intention;
  newChatInfo.befMsgId = isFile ? userMsgId : null;

  if (lastChatInfo.value) lastChatInfo.value.id = 1;
  chatStore.setIsStream(true);
  isHndleScroll.value = false;
  scrollDown();

  generation("continue-", newChatInfo);
}

function clearCompletionTimer() {
  if (!completionTimer.value) return;
  window.clearTimeout(completionTimer.value);
  completionTimer.value = null;
}

function createTimeer() {
  clearCompletionTimer();

  completionTimer.value = window.setTimeout(() => {
    if (isWait.value === false) return;
    getResponse(false);
  }, 90 * 1000);
}

function validateBefOnMessaging(data = "") {
  const validFlag = "[__VALID__]";
  if (String(data).indexOf(validFlag) === 0) {
    const validMsgs = String(data).replace(validFlag, "").split("__");
    const locale = i18n.global.locale?.value || "ko";
    const index = validMsgs.length === 1 || locale === "ko" ? 0 : 1;
    if (typeof window !== "undefined") window.alert?.(validMsgs[index]);
    return false;
  }

  if (!isWait.value) {
    clearCompletionTimer();
    eventSource.value?.close?.();
    return false;
  }

  return true;
}

function closeEventSource() {
  clearCompletionTimer();
  eventSource.value?.close?.();
  eventSource.value = null;
}



function isLastResponse() {
  if (isReadOnlyChat.value) return true;
  return Boolean(lastChatInfo.value);
}



defineExpose({
  scrollDown,
  scrollToChatId,
  reGeneration,
  continueGeneration,
  stopGeneration,
});
</script>
