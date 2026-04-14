import { resolveChatAdapter } from '@/core/adapterResolver';
import { resolveRoomMapper } from '@/core/mapperResolver';
import { normalizeResponse } from '@/utils/normalizeResponse';

export async function getRooms() {
  const adapter = resolveChatAdapter();
  const mapper = resolveRoomMapper();
  const response = await adapter.getRooms();
  const list = normalizeResponse(response);
  return list.map(mapper);
}
