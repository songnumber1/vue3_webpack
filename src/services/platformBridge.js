import {callNative} from '@/bridge/bridgeClient'
import {usePlatformStore} from '@/stores/platformStore'
import {copyText as copyWebText} from '@/utils/clipboard'

function requireAndroidApp() {
  const store = usePlatformStore()
  return store.info.isAndroidApp
}
export async function copyClipboardByPlatform(text) {
  if (requireAndroidApp()) return callNative('COPY_CLIPBOARD', {text})
  const copied = await copyWebText(text)
  return {isSuccess: copied, data: {copied}, message: copied ? '브라우저 클립보드에 복사되었습니다.' : '복사 실패'}
}
export async function openExternalBrowser(url) { return requireAndroidApp() ? callNative('OPEN_EXTERNAL_BROWSER', {url}) : window.open(url, '_blank', 'noopener,noreferrer') }
export async function openNativeFilePicker(options = {}) { return requireAndroidApp() ? callNative('OPEN_FILE_PICKER', {options}) : null }
export async function getPushToken() { const res = await callNative('GET_PUSH_TOKEN', {}); usePlatformStore().setPushToken(res.data?.token); return res }
export async function getAppVersion() { const res = await callNative('GET_APP_VERSION', {}); usePlatformStore().setAppVersionInfo(res.data); return res }
export async function shareByPlatform(data) { return requireAndroidApp() ? callNative('SHARE', {data}) : navigator.share ? navigator.share(data) : Promise.reject(new Error('현재 브라우저에서 공유 기능을 지원하지 않습니다.')) }
export async function checkNetworkByPlatform() { return requireAndroidApp() ? callNative('CHECK_NETWORK', {}) : {isSuccess: true, data: {online: navigator.onLine, type: 'browser'}} }
export async function getNativeStorage(key) { return callNative('GET_STORAGE', {key}) }
export async function setNativeStorage(key, value) { return callNative('SET_STORAGE', {key, value}) }
export async function cancelNativeRequest(id) { return callNative('CANCEL_REQUEST', {id}) }
export async function setBackHandler(enable) { return callNative('SET_BACK_HANDLER', {enable}) }
export async function showNativeToast(message) { return requireAndroidApp() ? callNative('SHOW_TOAST', {message}) : console.info('[toast]', message) }
export async function getDeviceInfo() { return requireAndroidApp() ? callNative('GET_DEVICE_INFO', {}) : {isSuccess: true, data: usePlatformStore().info} }
export async function writeNativeLog(data) { return requireAndroidApp() ? callNative('WRITE_LOG', {data}) : console.log('[native-log]', data) }
export async function closeApp() { return requireAndroidApp() ? callNative('CLOSE_APP', {}) : window.close() }
