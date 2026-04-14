import { mapBaseRoom } from './room.base';

export default function mapRoomWeb(room) {
  const base = mapBaseRoom(room);
  return {
    id: base.id,
    title: base.title,
    updatedAt: base.updatedAt
  };
}
