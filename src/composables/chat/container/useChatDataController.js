import {computed, nextTick, onMounted, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useRoute, useRouter} from "vue-router";
import {useChatSubmit} from "@/composables/chat/useChatSubmit";
import {loadSharedConversation} from "@/composables/chat/useSharedChat";
import {renderMermaidInElement} from "@/utils/mermaidRenderer";
import {logWarn} from "@/utils/logger";
import {PROMPT_SUGGESTION_LIMIT} from "@/constants/promptSuggestions";

export function useChatDataController({props, ui, runtime, messages}) {
  const {t, locale} = useI18n();
  const router = useRouter();
  const route = useRoute();
  const runtimeReady = ref(false);
  const currentMode = computed(() => props.mode);
  const isMainPage = computed(() => currentMode.value === "main");
  const isChatPage = computed(() => currentMode.value === "chat");
  const isSharedPage = computed(() => currentMode.value === "shared");
  const isConversationPage = computed(() => !isMainPage.value);
  const isReadOnly = computed(() => isSharedPage.value);

  const {
    assistants,
    currentAssistant,
    histories,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    activeSession,
    ensureConversation,
    setMessages,
    createRemoteConversation,
    createLocalConversation,
    clearActiveSession,
    appendUserAndAssistantMessages,
    currentExamplePrompts,
    syncHistoriesInBackground,
  } = runtime;

  const activeHistoryId = computed(() => {
    if (isChatPage.value) return route.params.id;
    if (isSharedPage.value) return route.params.shareId;
    return null;
  });

  function findHistory(id) {
    if (!id) return null;
    return histories.value.find((history) => String(history.id) === String(id)) || null;
  }

  const activeHistory = computed(() => findHistory(activeHistoryId.value));
  const activeConversationTitle = computed(() => {
    if (isSharedPage.value) {
      return t("chat.sharedConversationTitle", {
        id: activeHistoryId.value || "",
      }).trim();
    }
    return activeHistory.value?.title || "";
  });

  const workspaceAssistantLabel = computed(() => {
    if (activeSession.value?.displayAssistantLabel) {
      return activeSession.value.displayAssistantLabel;
    }
    if (
      activeSession.value?.assistantLabel &&
      !activeSession.value?.isModelUnavailable
    ) {
      return activeSession.value.assistantLabel;
    }
    return currentAssistant.value?.label || t("chat.assistant");
  });

  const suggestions = computed(() => {
    const assistantPrompts = currentExamplePrompts.value || [];
    const isEnglish = locale.value === "en";

    return assistantPrompts
      .slice(0, PROMPT_SUGGESTION_LIMIT)
      .map((prompt) => {
        const localizedTitle = isEnglish
          ? prompt.titleEn || prompt.titleKo
          : prompt.titleKo || prompt.titleEn;
        const localizedContent = isEnglish
          ? prompt.contentEn || prompt.contentKo || localizedTitle
          : prompt.contentKo || prompt.contentEn || localizedTitle;
        const text = localizedTitle || localizedContent;
        const content = localizedContent || localizedTitle;

        return {
          id: prompt.id,
          text,
          title: content || text,
          prompt: content || text,
        };
      })
      .filter((item) => item.text && item.prompt);
  });

  async function loadRouteConversation() {
    if (isMainPage.value) {
      messages.value = [];
      clearActiveSession();
      return;
    }

    try {
      if (isSharedPage.value) {
        messages.value = await loadSharedConversation(activeHistoryId.value);
        ui.markForceBottom();
        await nextTick();
        await ui.scrollBottom({behavior: "auto", force: true, stable: true});
        return;
      }

      if (!activeHistoryId.value) {
        messages.value = [];
        clearActiveSession();
        ui.markForceBottom();
        await nextTick();
        await ui.scrollBottom({behavior: "auto", force: true, stable: true});
        return;
      }

      const history = findHistory(activeHistoryId.value);
      if (!history) {
        await router.replace({name: "main"}).catch(() => {});
        return;
      }
      messages.value = await ensureConversation(history.id);
      ui.markForceBottom();
      await nextTick();
      await ui.scrollBottom({behavior: "auto", force: true, stable: true});
    } catch (error) {
      logWarn("[useChatDataController] loadRouteConversation 오류:", error);
    }
  }

  async function renderAfterStream() {
    try {
      ui.markForceBottom(1000);
      await renderMermaidInElement(document.querySelector(".message-list"), {
        force: true,
      });
      if (ui.autoScrollOnAnswer.value) {
        ui.scrollBottom({force: true, stable: true, autoAnswer: true});
      }
    } catch (error) {
      logWarn("[useChatDataController] renderAfterStream 오류:", error);
    }
  }

  const {isGenerating, submit, regenerate} = useChatSubmit({
    router,
    route,
    histories,
    messages,
    createRemoteConversation,
    createLocalConversation,
    appendUserAndAssistantMessages,
    setConversation: setMessages,
    selectedAssistantId,
    selectedModel,
    scrollBottom: async (options = {}) => {
      if (options.autoAnswer && !ui.autoScrollOnAnswer.value) return;
      if (options.autoAnswer) ui.markForceBottom(2500);
      await ui.scrollBottom(options);
    },
    scrollLatestUserMessage: ui.scrollLatestUserMessage,
    autoScrollOnAnswer: ui.autoScrollOnAnswer,
    syncHistories: () => syncHistoriesInBackground({notifyOnError: true}),
    renderAfterStream,
    canWrite: () => !isReadOnly.value && !isActiveModelUnavailable.value,
    isReadOnly,
    isActiveModelUnavailable,
  });

  function bindDataEvents() {
    watch(
      () => [route.params.id, route.params.shareId, currentMode.value],
      () => {
        if (runtimeReady.value) loadRouteConversation();
      }
    );

    watch(
      () => {
        if (!isChatPage.value || !activeHistoryId.value) return null;
        return runtime.conversations.value?.[activeHistoryId.value] || null;
      },
      (nextMessages) => {
        if (!Array.isArray(nextMessages)) return;
        if (messages.value === nextMessages) return;
        messages.value = nextMessages;
      },
      {deep: true}
    );
  }

  function initializeDataController() {
    onMounted(async () => {
      ui.updateMobileState();
      try {
        await runtime.initialize();
      } catch (error) {
        logWarn("[useChatDataController] runtime.initialize 오류:", error);
      }
      await loadRouteConversation();
      runtimeReady.value = true;
    });
  }

  return {
    runtimeReady,
    messages,
    assistants,
    currentAssistant,
    models,
    selectedAssistantId,
    selectedModel,
    isModelLocked,
    isActiveModelUnavailable,
    activeHistoryId,
    isMainPage,
    isChatPage,
    isSharedPage,
    isConversationPage,
    isReadOnly,
    activeConversationTitle,
    workspaceAssistantLabel,
    suggestions,
    isGenerating,
    submit,
    regenerate,
    bindDataEvents,
    initializeDataController,
  };
}
