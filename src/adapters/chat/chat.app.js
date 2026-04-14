import { getHttpClient } from '@/api/http/createHttpClient';
import { getAppConfig } from '@/config/appConfig';

export default {
  async getRooms() {
    const client = getHttpClient();
    const config = getAppConfig();
    const response = await client.get(config.endpoints.chat.app);
    return response.data;
  }
};
