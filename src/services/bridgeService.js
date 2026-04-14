import { resolveBridgeSender } from '@/core/bridgeResolver';

export function notifyPageReady() {
  const send = resolveBridgeSender();
  return send('PAGE_READY', { ts: Date.now() });
}

export function requestToken() {
  const send = resolveBridgeSender();
  return send('REQUEST_TOKEN', {});
}
