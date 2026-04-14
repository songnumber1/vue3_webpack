import { ensureArray } from '@/utils/ensureArray';

export function normalizeResponse(response) {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response && response.data)) return response.data;
  if (Array.isArray(response && response.items)) return response.items;
  if (Array.isArray(response && response.result && response.result.list)) return response.result.list;
  if (response && response.data) return ensureArray(response.data);
  if (response && response.result && response.result.list) return ensureArray(response.result.list);
  return ensureArray(response);
}
