import {readFirstString} from "@/adapters/adapterPrimitives";
import {GENERATION_API_KEYS as G} from "@/constants/api/generationApiKeys";
import {API_RESPONSE_KEYS as R} from "@/constants/api/apiResponseKeys";
import {unwrapApiBody} from "@/utils/apiResponseReader";

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
  return readFirstString(payload?.[G.MODEL_ID], payload?.[G.MODEL_ID_LEGACY]);
}

export function adaptGenerationResultContent(response) {
  const body = unwrapApiBody(response, response) || {};
  return readFirstString(
    body?.[G.CONTENT],
    body?.[G.ANSWER],
    body?.[R.DATA],
    response?.[G.CONTENT],
    response?.[G.ANSWER],
    response?.[R.DATA]
  );
}
