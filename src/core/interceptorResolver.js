import { getAppConfig } from '@/config/appConfig';
import { applyWebInterceptors } from '@/api/http/interceptors/platform/webInterceptors';
import { applyAppInterceptors } from '@/api/http/interceptors/platform/appInterceptors';
import { applyExtensionInterceptors } from '@/api/http/interceptors/platform/extensionInterceptors';

export function resolvePlatformInterceptor() {
  const config = getAppConfig();
  switch (config.platform) {
    case 'app':
      return applyAppInterceptors;
    case 'extension':
      return applyExtensionInterceptors;
    default:
      return applyWebInterceptors;
  }
}
