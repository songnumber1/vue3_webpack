import WebLayout from '@/layouts/WebLayout.vue'
import AndroidLayout from '@/layouts/AndroidLayout.vue'
import { isAndroidApp } from '@/core/config'

export function resolveLayout(appInfo) {
  return isAndroidApp(appInfo) ? AndroidLayout : WebLayout
}
