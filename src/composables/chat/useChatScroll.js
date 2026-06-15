/**
 * @file composables/chat/useChatScroll.js
 * @description 채팅 스크롤 관련 public 진입점입니다. 내부 스크롤 구현 파일을 직접 import하지 않도록 묶어 제공합니다.
 */

export {useAutoScroll} from "@/composables/chat/useAutoScroll";
export {useChatScrollController} from "@/composables/chat/internal/container/useChatScrollController";
export {useMessageListScroll} from "@/composables/chat/internal/message-list/useMessageListScroll";
export {createMessageScrollTargetController} from "@/composables/chat/internal/message-list/useMessageScrollTarget";
export {useMessageFocusSpacer} from "@/composables/chat/internal/message-list/useMessageFocusSpacer";
export {
  MESSAGE_LAZY_DEVICE_MODES,
  isForcedMobilePlatformOverride,
  resolveInitialMessageLazyRange,
  resolveMessageLazyDeviceMode,
  resolveMessageLazySettings,
  resolvePreviousMessageLazyStart,
} from "@/composables/chat/internal/message-list/useMessageLazyRange";
export {
  HISTORY_RENDER_STRATEGIES,
  MESSAGE_SCROLL_TARGET_TYPES,
  isSharedChat,
  resolveMessageRenderPolicy,
} from "@/composables/chat/internal/message-list/useMessageRenderPolicy";
export {
  createStreamScrollScheduler,
  scrollAfterUserSubmit,
} from "@/composables/chat/submit/chatSubmitScroll";
