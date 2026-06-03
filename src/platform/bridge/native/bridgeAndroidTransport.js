/**
 * @file platform/bridge/native/bridgeAndroidTransport.js
 * @description Android WebView bridge와 일반 웹 fallback을 연결하는 platform adapter입니다.
 *
 * 프리징 코드 주석 기준:
 * - 이 주석은 코드 추적을 돕기 위한 설명이며 런타임 동작을 변경하지 않습니다.
 * - 함수/상태가 다른 composable, store, component로 전달되는 경우 호출 방향을 먼저 확인하세요.
 */

import {JS_TO_ANDROID_API_REGISTRY} from "../bridgeApi.registry";

const ANDROID_METHOD_MAP = Object.fromEntries(
  Object.entries(JS_TO_ANDROID_API_REGISTRY)
    .filter(([, api]) => Boolean(api.androidMethod))
    .map(([type, api]) => [type, api.androidMethod])
);

export function getAndroidBridgeMethodName(type) {
  return ANDROID_METHOD_MAP[type];
}

export function getAndroidBridge() {
  return window.AndroidBridge || null;
}

export function hasPostMessageBridge() {
  return typeof getAndroidBridge()?.postMessage === "function";
}

export function hasDirectAndroidBridge(type) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  return Boolean(
    bridge && methodName && typeof bridge[methodName] === "function"
  );
}

export function postAndroidBridgeMessage(message) {
  return getAndroidBridge().postMessage(JSON.stringify(message));
}

export function callDirectAndroidBridge(type, payload) {
  const methodName = getAndroidBridgeMethodName(type);
  const bridge = getAndroidBridge();

  if (!bridge || !methodName || typeof bridge[methodName] !== "function") {
    return null;
  }

  const raw = bridge[methodName](JSON.stringify(payload));
  return Promise.resolve(raw);
}
