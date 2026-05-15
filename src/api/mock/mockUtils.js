/**
 * @file mockUtils.js
 * @description JavaScript module for mockUtils.
 */

export function cloneMockData(value) {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

export function mockDelay(ms = 120) {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

export async function resolveMock(value, delay = 120) {
  await mockDelay(delay)
  return cloneMockData(value)
}
