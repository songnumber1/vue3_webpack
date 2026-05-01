export function resolveUploadStrategy(platform, http, bridge) {
  if (platform === 'android') {
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
