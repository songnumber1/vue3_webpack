import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {
  DEFAULT_API_BASE_PATH,
  SERVER_API_BASE_URL,
  shouldUseServerApi,
} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {usePlatformStore} from "@/stores/platformStore";
import {isProgressAllowedForCurrentPlatform} from "@/constants/chatRuntimePolicy";
import {logPlatformDebug} from "@/platform/platformDebug";
import {resolveSessionAuthConfig} from "@/auth/authPolicy";
import {resetAuthStateSafely} from "@/auth/httpAuthInterceptor";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";

export function resolveSseAuthOptions() {
  const policy = resolveSessionAuthConfig();

  return {
    withCredentials: true,
    credentials: "include",
    headers: {
      "X-Client-Platform": policy.platform,
    },
  };
}

export function resolveGenerationUrl() {
  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;

  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION}`;
}

function resolveGenerationResultUrl(requestId) {
  const base = shouldUseServerApi()
    ? SERVER_API_BASE_URL
    : DEFAULT_API_BASE_PATH;

  const query = encodeURIComponent(requestId || "");
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION_RESULT}?${G.REQUEST_ID}=${query}`;
}

export async function fetchGenerationResult(requestId) {
  if (!requestId) return null;

  const authOptions = await resolveSseAuthOptions();
  const buildOptions = (headers) => ({
    method: "GET",
    credentials: authOptions.credentials,
    headers: {
      ...headers,
      Accept: "application/json",
      "Cache-Control": "no-cache",
    },
  });

  let response = await fetch(
    resolveGenerationResultUrl(requestId),
    buildOptions(authOptions.headers)
  );

  if (response.status === 401 || response.status === 403) {
    resetAuthStateSafely();
    return null;
  }

  if (!response.ok) return null;

  return response.json();
}

function shouldUseOverlay(policy) {
  const platformStore = usePlatformStore();

  const result = Boolean(
    policy.overlay && isProgressAllowedForCurrentPlatform(platformStore.info)
  );

  logPlatformDebug("sse.overlay", {
    result,
    policyOverlay: Boolean(policy.overlay),
    progressPlatform: "mobile",
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

  const requestKey = createId();

  const overlay = shouldUseOverlay(policy);

  if (controller) apiRequestStore.registerController(requestKey, controller);
  if (overlay) apiRequestStore.startOverlay();

  const cleanup = () => {
    apiRequestStore.unregisterController(requestKey);

    if (overlay) apiRequestStore.stopOverlay();
  };

  return {policy, controller, requestKey, overlay, cleanup};
}
