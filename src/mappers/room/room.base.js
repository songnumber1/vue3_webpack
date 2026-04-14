export function mapBaseRoom(room) {
  return {
    id: room.id || room.roomId || room.room_id || '-',
    title: room.title || room.name || room.room_name || '제목 없음',
    updatedAt: room.updatedAt || room.updated_at || room.last_updated || '-',
    description: room.description || '',
    icon: room.icon || ''
  };
}
