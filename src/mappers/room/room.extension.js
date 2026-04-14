import { mapBaseRoom } from './room.base';

export default function mapRoomExtension(room) {
  const base = mapBaseRoom(room);
  return {
    id: base.id,
    title: base.title,
    updatedAt: base.updatedAt,
    icon: base.icon
  };
}
