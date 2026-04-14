import { getRooms } from '@/facades/chatFacade';

export async function loadRooms() {
  const rooms = await getRooms();
  return rooms.sort(function (a, b) {
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}
