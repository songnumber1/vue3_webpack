import { getAppConfig } from '@/config/appConfig';
import webAdapter from '@/adapters/chat/chat.web';
import appAdapter from '@/adapters/chat/chat.app';
import extensionAdapter from '@/adapters/chat/chat.extension';
import v2Adapter from '@/adapters/chat/chat.v2';

export function resolveChatAdapter() {
  const config = getAppConfig();

  if (config.apiVersion === 'v2') {
    return v2Adapter;
  }

  switch (config.platform) {
    case 'app':
      return appAdapter;
    case 'extension':
      return extensionAdapter;
    default:
      return webAdapter;
  }
}
