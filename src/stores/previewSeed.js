
// Preview seed & bridge handlers.
// This file is imported ONLY by the Preview sub-app.

import { useUiStore } from "@/stores/uiStore";
import { useChatStore } from "@/stores/chatStore";
import { useDataStore } from "@/stores/dataStore";
import { usePromptStore } from "@/stores/promptStore";
import { onPreviewPatch } from "@/stores/previewBridge";

function seedBaseState() {
  const ui = useUiStore();
  // ✅ Only mutate real state keys
  ui.sidebarOpen = true;
  ui.sidebarCollapsed = false;
  ui.assistantsExpanded = true;
  ui.navLocked = false;

  const ds = useDataStore();
  const chat = useChatStore();
  const prompt = usePromptStore();

  // Pick first assistant/model from existing data.json (no touching getters)
  const firstAssistant = (ds.uiAssistants || [])[0];
  if (firstAssistant?.id) {
    chat.assistantId = firstAssistant.id;

    const models = ds.modelsByAssistant(firstAssistant.id) || [];
    const firstModel = models.find((m) => m?.default === true) || models[0];
    if (firstModel) {
      chat.modelId = firstModel.model_id || firstModel.modelId || firstModel.id;
      prompt.setModel(chat.modelId);
    }
  }

  // Seed minimal chats/messages
  const now = Date.now();
  const a1 = chat.assistantId;
  const m1 = chat.modelId;

  // build a few context-specific rooms so changing assistant/model really changes the list & messages
  const chats = [];
  function pushChat(id, title, assistantId, modelId, offsetMin, messages) {
    chats.push({
      id,
      title,
      assistantId,
      modelId,
      createdAt: now - offsetMin * 60_000,
      lastAt: now - (offsetMin - 1) * 60_000,
      messages,
    });
  }

  pushChat(
    "preview-chat-1",
    "DS: Preview Chat",
    a1,
    m1,
    120,
    [
      { role: "user", text: "(DS) DI 없이 store 기반으로 렌더되는지 확인" },
      { role: "assistant", text: "OK. 현재 assistant/model 컨텍스트의 메시지입니다." },
    ]
  );
  pushChat(
    "preview-chat-2",
    "DS: Another Chat",
    a1,
    m1,
    560,
    [
      { role: "user", text: "(DS) 다른 대화" },
      { role: "assistant", text: "이 방도 DS 컨텍스트에 속합니다." },
    ]
  );

  // Spec context (rich input modes)
  const specId = "a3ab57b9-0d19-4347-b0ce-e6bdd896230c";
  const specModels = ds.modelsByAssistant(specId) || [];
  const specModelId = (specModels.find((x) => x?.default === true) || specModels[0])?.model_id || specModels[0]?.["model_id"] || null;
  if (specModelId) {
    pushChat(
      "preview-spec-1",
      "Spec: Mail",
      specId,
      specModelId,
      30,
      [
        { role: "user", text: "(Spec/메일) 아래 내용을 메일로 정리해줘" },
        { role: "assistant", text: "메일 형태로 정리된 응답(샘플)" },
      ]
    );
    pushChat(
      "preview-spec-2",
      "Spec: Translate",
      specId,
      specModelId,
      90,
      [
        { role: "user", text: "(Spec/번역) 한국어를 영어로 번역" },
        { role: "assistant", text: "Translated text (sample)" },
      ]
    );
  }

  chat.chats = chats;

  // ensure active room is in current context
  chat.activeChatId = "preview-chat-1";
  try {
    chat.selectChat(chat.activeChatId);
  } catch {
    // fallback
    chat.messages = chats.find((c) => c.id === chat.activeChatId)?.messages || [];
  }
}

export function seedPreviewStores() {
  seedBaseState();
}

function applyPatch(patch) {
  const ui = useUiStore();
  const chat = useChatStore();
  const prompt = usePromptStore();

  if (patch.ui) {
    // allow only known keys to avoid readonly getter warnings
    const allowed = ["theme","isMobile","sidebarOpen","sidebarCollapsed","assistantsExpanded","navLocked"];
    for (const k of allowed) {
      if (k in patch.ui) ui[k] = patch.ui[k];
    }
    if ("theme" in patch.ui && typeof ui.setTheme === "function") ui.setTheme(ui.theme);
    if ("isMobile" in patch.ui && typeof ui.setMobile === "function") ui.setMobile(ui.isMobile);
  }

  if (patch.chat) {
    // ✅ IMPORTANT: use actions so derived state (messages/prompts) updates.
    if ("assistantId" in patch.chat) {
      chat.selectAssistant(patch.chat.assistantId);
      if (chat.modelId) prompt.setModel(chat.modelId);
    }
    if ("modelId" in patch.chat) {
      chat.setModel(patch.chat.modelId);
      if (chat.modelId) prompt.setModel(chat.modelId);
    }
    if ("inputMode" in patch.chat && typeof chat.setInputMode === "function") {
      chat.setInputMode(patch.chat.inputMode);
    }
    if ("activeChatId" in patch.chat) {
      chat.selectChat(patch.chat.activeChatId);
    }
    if ("selectedPromptId" in patch.chat) {
      chat.selectPrompt(patch.chat.selectedPromptId);
    }
    if ("inputText" in patch.chat) {
      chat.setInputText(patch.chat.inputText);
    }
  }
}

export function enablePreviewBridge() {
  return onPreviewPatch((patch) => applyPatch(patch));
}
