import {resolveGenerationResultUrl} from "@/api/sse/common/streamRequest";

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
