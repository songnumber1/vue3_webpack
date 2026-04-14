import { getAppConfig } from '@/config/appConfig';
import mapRoomWeb from '@/mappers/room/room.web';
import mapRoomApp from '@/mappers/room/room.app';
import mapRoomExtension from '@/mappers/room/room.extension';

export function resolveRoomMapper() {
  const config = getAppConfig();
  switch (config.platform) {
    case 'app':
      return mapRoomApp;
    case 'extension':
      return mapRoomExtension;
    default:
      return mapRoomWeb;
  }
}
