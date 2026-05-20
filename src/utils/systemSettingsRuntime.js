import {
  DEFAULT_SYSTEM_SETTINGS,
  readStoredSystemSettings,
} from "@/constants/systemSettings";

export function getRuntimeSystemSettings() {
  return typeof window === "undefined"
    ? {...DEFAULT_SYSTEM_SETTINGS}
    : readStoredSystemSettings();
}
