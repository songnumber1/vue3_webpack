import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";

function readFirstString(...values) {
  const found = values.find(
    (value) => typeof value === "string" && value !== ""
  );
  return found || "";
}

export function resolveGenerationRequestId(payload = {}) {
  return readFirstString(
    payload?.[G.REQUEST_ID],
    payload?.[G.REQUEST_ID_SNAKE],
    payload?.[G.MESSAGE_ID],
    payload?.[G.RESPONSE_MESSAGE_ID]
  );
}

export function resolveGenerationPromptText(payload = {}) {
  return readFirstString(payload?.[G.BODY], payload?.[G.INPUT]);
}

export function resolveGenerationModelId(payload = {}) {
  return readFirstString(payload?.[G.MODEL_ID], payload?.modeId);
}

export function adaptGenerationResultContent(response) {
  const body = unwrapApiBody(response, response) || {};
  return readFirstString(
    body?.[G.CONTENT],
    body?.answer,
    body?.[R.DATA],
    response?.[G.CONTENT],
    response?.answer,
    response?.[R.DATA]
  );
}
