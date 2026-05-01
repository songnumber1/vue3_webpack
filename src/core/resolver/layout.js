import WebLayout from '@/layouts/WebLayout.vue'
import AndroidLayout from '@/layouts/AndroidLayout.vue'
import { isMobileLikePlatform } from './platform'

export function resolveLayout(platform) {
  return isMobileLikePlatform(platform) ? AndroidLayout : WebLayout
}
