import axios from 'axios';
import { getAppConfig } from '@/config/appConfig';
import { applyBaseInterceptors } from '@/api/http/interceptors/baseInterceptors';
import { resolvePlatformInterceptor } from '@/core/interceptorResolver';

let httpClient = null;

export function getHttpClient() {
  if (httpClient) return httpClient;

  const config = getAppConfig();
  httpClient = axios.create({
    baseURL: config.apiBaseUrl || '',
    timeout: 10000
  });

  applyBaseInterceptors(httpClient, config);
  const platformInterceptor = resolvePlatformInterceptor();
  platformInterceptor(httpClient, config);

  return httpClient;
}
