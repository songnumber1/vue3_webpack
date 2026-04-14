import { mapBaseRoom } from './room.base';

export default function mapRoomApp(room) {
  const base = mapBaseRoom(room);
  return {
    id: base.id,
    title: base.title,
    updatedAt: base.updatedAt,
    description: base.description
  };
}
