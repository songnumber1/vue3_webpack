/**
 * @file useMessageLazyRange.js
 * @description PC/모바일별 이력 메시지 lazy 렌더링 개수와 visible range 계산을 담당합니다.
 */

import {PLATFORM_OVERRIDE_MODES} from "@/constants/systemSettings";

const DEFAULT_PC_INITIAL_COUNT = 100;
const DEFAULT_PC_APPEND_COUNT = 50;
const DEFAULT_PC_TOP_THRESHOLD_PX = 300;
const DEFAULT_MOBILE_INITIAL_COUNT = 50;
const DEFAULT_MOBILE_APPEND_COUNT = 25;

export const MESSAGE_LAZY_DEVICE_MODES = Object.freeze({
  pc: "pc",
  mobile: "mobile",
});

function normalizePositiveInteger(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0
    ? Math.max(1, Math.round(numeric))
    : fallback;
}

function normalizeNonNegativeInteger(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric >= 0
    ? Math.round(numeric)
    : fallback;
}

export function isForcedMobilePlatformOverride(platformOverride) {
  return (
    platformOverride === PLATFORM_OVERRIDE_MODES.androidChrome ||
    platformOverride === PLATFORM_OVERRIDE_MODES.androidWebView
  );
}

export function resolveMessageLazyDeviceMode(settings = {}, isMobile = false) {
  if (isForcedMobilePlatformOverride(settings.platformOverride)) {
    return MESSAGE_LAZY_DEVICE_MODES.mobile;
  }

  return isMobile
    ? MESSAGE_LAZY_DEVICE_MODES.mobile
    : MESSAGE_LAZY_DEVICE_MODES.pc;
}

export function resolveMessageLazySettings(settings = {}, isMobile = false) {
  const deviceMode = resolveMessageLazyDeviceMode(settings, isMobile);

  if (deviceMode === MESSAGE_LAZY_DEVICE_MODES.mobile) {
    return {
      deviceMode,
      initialCount: normalizePositiveInteger(
        settings.mobileHistoryLazyInitialCount,
        DEFAULT_MOBILE_INITIAL_COUNT
      ),
      appendCount: normalizePositiveInteger(
        settings.mobileHistoryLazyAppendCount,
        DEFAULT_MOBILE_APPEND_COUNT
      ),
      topThresholdPx: DEFAULT_PC_TOP_THRESHOLD_PX,
    };
  }

  return {
    deviceMode,
    initialCount: normalizePositiveInteger(
      settings.pcHistoryLazyInitialCount ?? settings.historyLazyChunkSize,
      DEFAULT_PC_INITIAL_COUNT
    ),
    appendCount: normalizePositiveInteger(
      settings.pcHistoryLazyAppendCount ?? settings.historyLazyChunkSize,
      DEFAULT_PC_APPEND_COUNT
    ),
    topThresholdPx: normalizeNonNegativeInteger(
      settings.pcHistoryLazyTopThresholdPx ?? settings.historyLazyTopThreshold,
      DEFAULT_PC_TOP_THRESHOLD_PX
    ),
  };
}

export function resolveInitialMessageLazyRange({
  messages = [],
  initialCount = DEFAULT_PC_INITIAL_COUNT,
  useLazyLoading = true,
} = {}) {
  const list = Array.isArray(messages) ? messages : [];

  if (!useLazyLoading) {
    return {
      start: 0,
      end: list.length,
      visibleMessages: list,
    };
  }

  const count = normalizePositiveInteger(
    initialCount,
    DEFAULT_PC_INITIAL_COUNT
  );
  const start = Math.max(list.length - count, 0);
  return {
    start,
    end: list.length,
    visibleMessages: list.slice(start),
  };
}

export function resolvePreviousMessageLazyStart({
  currentStart = 0,
  appendCount = DEFAULT_PC_APPEND_COUNT,
} = {}) {
  const start = normalizeNonNegativeInteger(currentStart, 0);
  const count = normalizePositiveInteger(appendCount, DEFAULT_PC_APPEND_COUNT);
  return Math.max(start - count, 0);
}
