import { isNativeApp } from '@/core/config'

export function resolveUploadStrategy(appInfo, http, bridge) {
  if (isNativeApp(appInfo)) {
    return {
      upload: (fileMeta) => bridge?.uploadFile?.(JSON.stringify(fileMeta))
    }
  }

  return {
    upload: (file) => {
      const formData = new FormData()
      formData.append('file', file)
      return http.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
  }
}
