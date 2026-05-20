import {getActivePinia} from "pinia";
import {DEFAULT_SYSTEM_SETTINGS} from "@/constants/systemSettings";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";

export function getRuntimeSystemSettings() {
  if (!getActivePinia()) return {...DEFAULT_SYSTEM_SETTINGS};
  return {...useSystemSettingsStore().settings};
}
