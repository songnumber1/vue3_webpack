const baseFeatures = {
  markdown: true,
  fakeStreaming: true,
  sidebar: true,
  attachments: true,
  themeSwitch: true
}

const androidFeatures = {
  sidebar: false,
  attachments: true
}

export function resolveFeatures(platform) {
  return {
    ...baseFeatures,
    ...(platform === 'android' || platform === 'mobile-web' ? androidFeatures : {})
  }
}
