import {defineStore} from "pinia";
import {usePromptControlStore} from "@/stores/promptControlStore";
import {useFileStore} from "@/stores/fileStore";
import {ACTIVE_ROOM_TYPES} from "@/constants/chatRoom";

export {ACTIVE_ROOM_TYPES};

export const useChatStore = defineStore("chat", {
  state: () => ({
    assistants: [],
    assistantMap: {},
    models: [],
    allModels: [],
    modelMap: {},
    modelMapByAssistant: {},
    examplePromptMap: {},
    promptTemplates: [],
    chatRooms: [],
    selectedChatId: null,
    selectedChatInfo: null,
    selectedAssist: "",
    selectedAssistInfo: null,
    selectedModel: "",
    selectedModelInfo: null,
    selectedIntention: null,
    selectedPromptTemplate: null,
    selectedPromptTmplate: null,
    selectedRagOptions: [],
    tmpSelectedRagOptions: [],
    externalOptions: [],
    curChatIntention: null,
    detailSelectedIntention: null,
    codeInterpreter: null,
    codeInterpreterInfo: null,
    generateMsgId: null,
    inputChat: null,
    selectedChatSearchInfo: null,
    generationInfo: {stop: false, re: false, con: false},
    isStream: false,
    isActivedStop: false,
    isStopGeneration: false,
    isActivedReGen: false,
    isActivatedContinue: false,
    showScrollBottom: false,
    isSharedChat: false,
    isWait: false,
  }),
  getters: {
    currentAssistant: (state) =>
      state.selectedAssistInfo ||
      state.assistantMap[state.selectedAssist] ||
      state.assistants[0] ||
      null,
    currentModels: (state) =>
      state.modelMapByAssistant[state.selectedAssist] || [],
    currentModel: (state) => state.selectedModelInfo || state.modelMap[state.selectedModel] || null,
    isActiveSharedRoom: (state) =>
      state.isSharedChat ||
      state.selectedChatInfo?.roomType === ACTIVE_ROOM_TYPES.shared ||
      Boolean(state.selectedChatInfo?.sharedId || state.selectedChatInfo?.ShardId),
    isModelLocked: (state) => Boolean(state.selectedChatInfo?.readonlyModel),
    inpuChat: (state) => state.inputChat,
  },
  actions: {
    setBootstrapData(payload = {}) {
      this.assistants = payload.assistants || [];
      this.assistantMap = payload.assistantMap || {};
      this.models = payload.models || [];
      this.allModels = payload.allModels || payload.models || [];
      this.modelMap = payload.modelMap || {};
      this.modelMapByAssistant = payload.modelMapByAssistant || {};
      const initialAssistantId =
        payload.initialAssistantId || this.assistants[0]?.id || "";
      const initialModelId =
        payload.initialModelId || this.modelMapByAssistant[initialAssistantId]?.[0]?.id || "";
      this.setSelectedAssist(initialAssistantId);
      this.setSelectedAssistInfo(this.currentAssistant);
      this.setSelectedModel(initialModelId);
      this.setSelectedModelInfo(this.currentModel);
      this.examplePromptMap = payload.examplePromptMap || {};
      this.promptTemplates = payload.promptTemplates || [];
    },
    selectAssistant(id) {
      if (!this.assistantMap[id]) return;
      this.setSelectedAssist(id);
      this.setSelectedAssistInfo(this.assistantMap[id]);

      const models = this.modelMapByAssistant[id] || [];
      if (!models.some((model) => model.id === this.selectedModel)) {
        this.setSelectedModel(models[0]?.id || "");
      }

      this.setSelectedModel(this.selectedModel);
      this.setSelectedModelInfo(this.currentModel);
    },
    selectModel(id) {
      const model = this.modelMap[id];
      if (!model) return;
      if (model.assistId !== this.selectedAssist) return;
      this.setSelectedModel(id);
      this.setSelectedModelInfo(model);
    },
    setExamplePrompts(assistantId, prompts = []) {
      this.examplePromptMap = {
        ...this.examplePromptMap,
        [assistantId]: prompts,
      };
    },
    setIsWait(value) {
      this.isWait = Boolean(value);
    },
    setIsStream(value) {
      this.isStream = Boolean(value);
    },
    setChatRooms(chatRooms = []) {
      this.chatRooms = Array.isArray(chatRooms) ? chatRooms : [];
      if (this.selectedChatId) this.setSelectedChatId(this.selectedChatId);
    },
    setSelectedChatId(chatId = null) {
      this.selectedChatId = chatId || null;

      if (!this.selectedChatId) {
        this.selectedChatInfo = null;
        return;
      }

      const selectedChatInfo = this.chatRooms.find(
        (room) =>
          String(room.chatId || room.id || room.sharedId || room.ShardId || "") ===
            String(this.selectedChatId) ||
          String(room.sharedId || room.ShardId || "") === String(this.selectedChatId)
      );

      if (selectedChatInfo) {
        this.setSelectedChatInfo(selectedChatInfo);
      } else {
        this.setSelectedChatInfo(null);
      }
    },
    setSelectedChatInfo(chatInfo = null) {
      this.selectedChatInfo = chatInfo;

      if (chatInfo?.assistInfo) {
        this.selectedAssistInfo = chatInfo.assistInfo;
      }

      const assistId = chatInfo?.assistId || chatInfo?.assistantId || chatInfo?.assistInfo?.assistId || chatInfo?.assistInfo?.id;
      if (assistId) {
        this.selectedAssist = assistId;
        if (!this.selectedAssistInfo && this.assistantMap[assistId]) {
          this.selectedAssistInfo = this.assistantMap[assistId];
        }
      }

      if (chatInfo?.modelId) {
        this.selectedModel = chatInfo.modelId;
        this.selectedModelInfo = this.modelMap[chatInfo.modelId] || this.selectedModelInfo;
      }

      if (chatInfo?.chatId) {
        usePromptControlStore().setActivePromptToolSettingsKey(chatInfo.chatId);
      }
    },
    setSelectedAssist(assist = "") {
      this.selectedAssist = assist || "";
    },
    setSelectedAssistInfo(assistInfo = null) {
      this.selectedAssistInfo = assistInfo;
    },
    setSelectedModel(model = "") {
      this.selectedModel = model || "";
    },
    setSelectedModelInfo(modelInfo = null) {
      this.selectedModelInfo = modelInfo;
    },
    setSelectedIntention(intention = null) {
      this.selectedIntention = intention;
    },
    setSelectedPromptTemplate(template = null) {
      this.selectedPromptTemplate = template;
      this.selectedPromptTmplate = template;
    },
    setSelectedPromptTmplate(template = null) {
      this.setSelectedPromptTemplate(template);
    },
    setSelectedRagOptions(options = []) {
      this.selectedRagOptions = Array.isArray(options) ? options : [];
    },
    setTmpSelectedRagOptions(options = []) {
      this.tmpSelectedRagOptions = Array.isArray(options) ? options : [];
    },
    setExternalOptions(options = []) {
      this.externalOptions = Array.isArray(options) ? options : [];
    },
    setCurChatIntention(intention = null) {
      this.curChatIntention = intention;
    },
    setDetailSelectedIntention(intention = null) {
      this.detailSelectedIntention = intention;
    },
    setCodeInterpreter(payload = null) {
      this.codeInterpreter = payload;
    },
    setCodeInterpreterInfo(payload = null) {
      this.codeInterpreterInfo = payload;
    },
    setGenerateMsgId(msgId = null) {
      this.generateMsgId = msgId || null;
    },
    setInputChat(payload = null) {
      this.inputChat = payload;
    },
    setInpuChat(payload = null) {
      this.setInputChat(payload);
    },
    setChatInputFiled(payload = null) {
      this.setInputChat(payload);
    },
    clearInputChat() {
      this.setInputChat(null);
    },
    getSelectedAssistId() {
      return (
        this.selectedAssistInfo?.assistId ||
        this.selectedAssistInfo?.id ||
        this.selectedAssist ||
        ""
      );
    },
    getSelectedModelId() {
      return (
        this.selectedModelInfo?.modelId ||
        this.selectedModelInfo?.id ||
        this.selectedModel ||
        ""
      );
    },
    initSelectChatInfo(inputChat = null, chatId = null, generateMsgId = null) {
      this.setSelectedChatId(chatId);
      this.setGenerateMsgId(generateMsgId);
      this.setInpuChat(inputChat);
    },
    setIsSharedChat(value = false) {
      this.isSharedChat = Boolean(value);
      if (this.selectedChatInfo) {
        this.selectedChatInfo = {
          ...this.selectedChatInfo,
          roomType: this.isSharedChat ? ACTIVE_ROOM_TYPES.shared : this.selectedChatInfo.roomType,
        };
      }
    },

    setSelectedChatSearchInfo(searchInfo = null) {
      this.selectedChatSearchInfo = searchInfo;
    },
    createSelectedChatSearchInfo(result = {}, options = {}) {
      const chatId = String(options.chatId || result.chatId || result.id || "").trim();
      const messageId = String(
        options.messageId ||
          result.searchTargetMessageId ||
          result.messageId ||
          result.targetMessageId ||
          result.msgId ||
          result.respMsgId ||
          result.raw?.messageId ||
          result.raw?.msgId ||
          result.raw?.respMsgId ||
          ""
      ).trim();
      const searchContent = String(
        options.searchContent ||
          options.keyword ||
          result.searchContent ||
          result.keyword ||
          result.searchText ||
          result.snippet ||
          result.preview ||
          result.raw?.searchContent ||
          result.raw?.keyword ||
          ""
      ).trim();

      if (!chatId || (!messageId && !searchContent)) return null;

      return {
        ...result,
        chatId,
        messageId,
        msgId: result.msgId || result.raw?.msgId || messageId || null,
        respMsgId: result.respMsgId || result.raw?.respMsgId || null,
        keyword: options.keyword || result.keyword || result.searchText || searchContent,
        searchContent,
      };
    },
    prepareChatSearchSelection(result = {}, options = {}) {
      const chatId = String(options.chatId || result.chatId || result.id || "").trim();
      if (!chatId) return null;

      this.clearInputChat();
      this.setGenerateMsgId(null);
      this.setSelectedChatId(chatId);
      this.setSelectedChatInfo({
        ...(options.history || result || {}),
        chatId,
        roomType: ACTIVE_ROOM_TYPES.chat,
      });
      this.setSelectedChatSearchInfo(
        options.isSearchMode
          ? this.createSelectedChatSearchInfo(result, {
              chatId,
              messageId: options.messageId,
              keyword: options.keyword,
              searchContent: options.searchContent,
            })
          : null
      );

      return {
        chatId,
        selectedChatInfo: this.selectedChatInfo,
        selectedChatSearchInfo: this.selectedChatSearchInfo,
      };
    },
    setGenerationInfo(payload = {}) {
      this.generationInfo = {
        ...this.generationInfo,
        ...(payload || {}),
      };
    },
    clearSelectedChatState() {
      this.setSelectedChatId(null);
      this.setSelectedChatInfo(null);
      usePromptControlStore().setActivePromptToolSettingsKey(null);
      this.setSelectedChatSearchInfo(null);
      this.clearInputChat();
      this.setIsSharedChat(false);
      this.resetCompanyChatOptions();
      useFileStore().clearTempFiles();
      usePromptControlStore().resetActivePromptToolSettings();
    },
    resetCompanyChatOptions() {
      this.setSelectedIntention(null);
      this.setSelectedPromptTemplate(null);
      this.setSelectedRagOptions([]);
      this.setTmpSelectedRagOptions([]);
      this.setCurChatIntention(null);
      this.setDetailSelectedIntention(null);
      this.setCodeInterpreter(null);
      this.setCodeInterpreterInfo(null);
    },
    setIsActivedStop(value) {
      this.isActivedStop = Boolean(value);
    },
    setIsStopGeneration(value) {
      this.isStopGeneration = Boolean(value);
    },
    setIsActivedReGen(value) {
      this.isActivedReGen = Boolean(value);
    },
    setIsActivatedContinue(value) {
      this.isActivatedContinue = Boolean(value);
    },
    getHistory(chatId) {
      if (!chatId) return null;
      return this.chatRooms.find((item) => item.chatId === chatId) || null;
    },
    setShowScrollBottom(value) {
      this.showScrollBottom = Boolean(value);
    },
    addHistory(history) {
      if (!history?.chatId) return;
      this.chatRooms = [
        history,
        ...this.chatRooms.filter((item) => item.chatId !== history.chatId),
      ];
    },
  },
});
