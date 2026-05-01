export function resolvePlatform() {
  const hasAndroidBridge = typeof window !== 'undefined' && !!window.AndroidBridge
  if (hasAndroidBridge) return 'android'

  const ua = navigator.userAgent || ''
  const isMobileUA = /Android|Mobi|Mobile/i.test(ua)
  const isSmallTouch = window.matchMedia?.('(max-width: 820px)')?.matches && navigator.maxTouchPoints > 0

  if (isMobileUA || isSmallTouch) return 'mobile-web'
  return 'web'
}

export function isMobileLikePlatform(platform) {
  return platform === 'android' || platform === 'mobile-web'
}
