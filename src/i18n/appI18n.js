/**
 * @file i18n/appI18n.js
 * @description 다국어 메시지와 locale 관리 모듈입니다.
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
