import { getAppConfig } from '@/config/appConfig';
import { postBridgeMessage } from '@/bridge/androidBridge';

export function resolveBridgeSender() {
  const config = getAppConfig();

  if (config.platform === 'app') {
    return postBridgeMessage;
  }

  return function fallbackBridge(type, payload) {
    console.info('[Non-App Bridge Ignored]', type, payload || {});
    return false;
  };
}
