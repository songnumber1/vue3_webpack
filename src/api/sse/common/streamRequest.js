import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {SERVER_API_BASE_URL, shouldUseServerApi} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";
import {logPlatformDebug} from "@/platform/platformDebug";

export function resolveGenerationUrl() {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";

  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION}`;
}

export function resolveGenerationResultUrl(requestId) {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";

  const query = encodeURIComponent(requestId || "");
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION_RESULT}?requestId=${query}`;
}


export async function fetchGenerationResult(requestId) {
  if (!requestId) return null;

  const response = await fetch(resolveGenerationResultUrl(requestId), {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  if (!response.ok) return null;

  return response.json();
}

export function shouldUseOverlay(policy) {
  const settings = useSystemSettingsStore();

  const mobileLikeViewport = isMobileLikeViewport(settings.mobileBreakpoint);

  const result = Boolean(
    policy.overlay && settings.showMobileApiProgress && mobileLikeViewport
  );

  logPlatformDebug("sse.overlay", {
    result,
    policyOverlay: Boolean(policy.overlay),
    showMobileApiProgress: Boolean(settings.showMobileApiProgress),
    mobileBreakpoint: settings.mobileBreakpoint,
    mobileLikeViewport,
  });

  return result;
}

export function createStreamRequestContext() {
  const policy = resolveApiPolicy(API_KEYS.GENERATION);

  const apiRequestStore = useApiRequestStore();

  const controller =
    policy.abort && typeof AbortController !== "undefined"
      ? new AbortController()
      : null;

  const requestKey = `GENERATION-${Date.now()}-${Math.random()}`;

  const overlay = shouldUseOverlay(policy);

  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  const cleanup = () => {
    apiRequestStore.unregisterController(requestKey);

    if (overlay) apiRequestStore.stopOverlay();
  };

  return {policy, controller, requestKey, overlay, cleanup};
}
