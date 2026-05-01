export function applyInterceptors(instance, platform, context = {}) {
  const { bridge, errorUI } = context

  instance.interceptors.request.use((config) => {
    const token = platform === 'android'
      ? bridge?.getToken?.()
      : localStorage.getItem('access_token')

    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status
      if (status === 401) errorUI?.notify?.('인증 정보가 만료되었습니다.')
      if (status >= 500) errorUI?.notify?.('서버 오류가 발생했습니다.')
      return Promise.reject(error)
    }
  )
}
