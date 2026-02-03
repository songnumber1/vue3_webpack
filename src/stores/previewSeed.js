
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
  chat.chats = [
    { id: "preview-chat-1", title: "Preview Chat", createdAt: now - 3600_000, lastAt: now - 120_000 },
    { id: "preview-chat-2", title: "Another Chat", createdAt: now - 8600_000, lastAt: now - 560_000 },
  ];
  chat.activeChatId = "preview-chat-1";
  chat.messages = [
    { id: "m1", role: "user", content: "미리보기: DI 없이 store를 직접 쓰는지 확인" },
    { id: "m2", role: "assistant", content: "확인용 응답입니다. 실제 컴포넌트가 store를 직접 import합니다." },
  ];
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
    const allowed = ["assistantId","modelId","activeChatId","inputText","selectedPromptId"];
    for (const k of allowed) {
      if (k in patch.chat) chat[k] = patch.chat[k];
    }
    if ("modelId" in patch.chat) prompt.setModel(chat.modelId);
  }
}

export function enablePreviewBridge() {
  return onPreviewPatch((patch) => applyPatch(patch));
}
