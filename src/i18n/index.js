/**
 * @file i18n/index.js
 * @description 다국어 메시지와 locale 관리 모듈입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {createI18n} from "vue-i18n";
import {authMessages} from "@/i18n/domains/auth";
import {chatMessages} from "@/i18n/domains/chat";
import {commonMessages} from "@/i18n/domains/common";
import {settingsMessages} from "@/i18n/domains/settings";
import {studioMessages} from "@/i18n/domains/studio";

export const SUPPORT_LOCALES = ["ko", "en"];

export const messages = SUPPORT_LOCALES.reduce((acc, locale) => {
  acc[locale] = {
    ...commonMessages[locale],
    ...settingsMessages[locale],
    ...chatMessages[locale],
    ...authMessages[locale],
    ...studioMessages[locale],
  };
  return acc;
}, {});

const savedLocale =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("app-locale")
    : null;
const browserLocale =
  typeof navigator !== "undefined" ? navigator.language?.slice(0, 2) : "ko";
const initialLocale = SUPPORT_LOCALES.includes(savedLocale)
  ? savedLocale
  : SUPPORT_LOCALES.includes(browserLocale)
    ? browserLocale
    : "ko";

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: "ko",
  messages,
});
export function setAppLocale(locale) {
  if (!SUPPORT_LOCALES.includes(locale)) return;
  i18n.global.locale.value = locale;
  if (typeof document !== "undefined") document.documentElement.lang = locale;
  if (typeof localStorage !== "undefined")
    localStorage.setItem("app-locale", locale);
}

setAppLocale(initialLocale);
