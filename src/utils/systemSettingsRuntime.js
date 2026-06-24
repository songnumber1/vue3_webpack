/**
 * @file utils/systemSettingsRuntime.js
 * @description 여러 영역에서 공유하는 유틸리티입니다. DOM/Markdown/feedback/viewport 보정 등 공통 처리를 담당합니다.
 */

import {getActivePinia} from "pinia";
import {DEFAULT_SYSTEM_SETTINGS} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

export function getRuntimeSystemSettings() {
  if (!getActivePinia()) return {...DEFAULT_SYSTEM_SETTINGS};
  return {...useSystemSettingsStore().settings};
}
