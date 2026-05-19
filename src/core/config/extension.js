import {RUN_ENV, PLATFORM} from "./constants";
import {createId} from "@/utils/id";

export function createExtensionConfig(platform = PLATFORM.UNKNOWN) {
  return {
    env: RUN_ENV.EXTENSION,
    platform,
    appVersion: "extension",
    appBuildVersion: "extension",
    bridgeVersion: null,
    token: createId("app"),
    deviceId: null,
  };
}
