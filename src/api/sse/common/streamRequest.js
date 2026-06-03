import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {
  DEFAULT_API_BASE_PATH,
  SERVER_API_BASE_URL,
  shouldUseServerApi,
} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";
import {logPlatformDebug} from "@/platform/platformDebug";
import {resolveAuthPolicy} from "@/auth/authPolicy";
import {getAccessToken} from "@/auth/tokenStore";
import {refreshAccessTokenOnce} from "@/auth/refreshTokenService";
import {resetAuthStateSafely} from "@/auth/httpAuthInterceptor";
import {createId} from "@/utils/id";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";

export async function resolveSseAuthOptions() {
  const policy = resolveAuthPolicy();
  const headers = {
    "X-Client-Platform": policy.platform,
    "X-Auth-Mode": policy.authMode,
  };

  if (policy.isJwt) {
    let token = getAccessToken();
    if (!token) {
      try {
        token = await refreshAccessTokenOnce();
      } catch (_error) {
        token = "";
      }
    }
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  return {
    policy,
    withCredentials: policy.withCredentials,
    credentials: policy.withCredentials ? "include" : "same-origin",
    headers,
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

  if (response.status === 401 && authOptions.policy.isJwt) {
    try {
      const accessToken = await refreshAccessTokenOnce();
      response = await fetch(
        resolveGenerationResultUrl(requestId),
        buildOptions({
          ...authOptions.headers,
          Authorization: `Bearer ${accessToken}`,
        })
      );
      if (response.status === 401) {
        resetAuthStateSafely();
      }
    } catch (_error) {
      return null;
    }
  }

  if (!response.ok) return null;

  return response.json();
}

function shouldUseOverlay(policy) {
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
