const baseApi = {
  getMe: (http) => http.get('/me'),
  sendMessage: (http, payload) => http.post('/chat/messages', payload),
  getNotices: (http) => http.get('/notices')
}

const androidApi = {
  sendMessage: (http, payload) => http.post('/app/chat/messages', payload)
}

export function resolveApi(platform, http) {
  const apiMap = {
    ...baseApi,
    ...(platform === 'android' ? androidApi : {})
  }

  return Object.fromEntries(
    Object.entries(apiMap).map(([name, fn]) => [name, (...args) => fn(http, ...args)])
  )
}
