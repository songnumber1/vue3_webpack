import {API_ENDPOINTS} from "@/constants/apiEndpoints";
import {SERVER_API_BASE_URL, shouldUseServerApi} from "@/constants/apiMode";
import {API_KEYS, resolveApiPolicy} from "@/constants/apiConfig";
import {pickGenerationSample} from "@/api/mock/data/generationSamples.raw";
import {streamText} from "@/api/mock/fakeStream";
import {parseSseBuffer, readSseData} from "@/api/sse/sseParser";
import {useApiRequestStore} from "@/stores/apiRequestStore";
import {useSystemSettingsStore} from "@/stores/systemSettingsStore";
import {isMobileLikeViewport} from "@/platform/viewport/viewportMode";

function resolveGenerationUrl() {
  const base = shouldUseServerApi() ? SERVER_API_BASE_URL : "/api";
  return `${base.replace(/\/$/, "")}${API_ENDPOINTS.GENERATION}`;
}

function shouldUseOverlay(policy) {
  const settings = useSystemSettingsStore();
  return Boolean(
    policy.overlay &&
    settings.showMobileApiProgress &&
    isMobileLikeViewport(settings.mobileBreakpoint)
  );
}

export async function streamGeneration(payload = {}, handlers = {}) {
  const {onChunk, onComplete} = handlers;

  if (!shouldUseServerApi()) {
    const text = pickGenerationSample(payload.input);
    await streamText(text, (chunk) => onChunk?.(chunk), {delay: 18});
    await onComplete?.();
    return;
  }

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

  try {
    const response = await fetch(resolveGenerationUrl(), {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      body: JSON.stringify(payload),
      signal: controller?.signal,
    });

    if (!response.ok) {
      throw new Error(`generation stream failed: ${response.status}`);
    }
    if (!response.body) {
      throw new Error("generation stream body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulated = "";
    let done = false;

    while (!done) {
      const result = await reader.read();
      done = result.done;
      if (result.value) {
        buffer += decoder.decode(result.value, {stream: true});
      }
      if (done) {
        buffer += decoder.decode();
      }
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.rest;

      for (const event of parsed.events) {
        const data = readSseData(event);
        if (data.done) {
          done = true;
          break;
        }
        accumulated += data.content;
        await onChunk?.(accumulated);
      }
    }

    await onComplete?.();
  } finally {
    apiRequestStore.unregisterController(requestKey);
    if (overlay) apiRequestStore.stopOverlay();
  }
}
