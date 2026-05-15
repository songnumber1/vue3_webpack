import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    isRagAuth: false,
    sourceOptions: [],
    externalOptions: [],
  }),
  getters: {
    userName: (state) => state.user?.userName || '',
    userId: (state) => state.user?.userId || '',
  },
  actions: {
    setAccessInfo(accessInfo = {}) {
      this.user = accessInfo.user || null
      this.isRagAuth = Boolean(accessInfo.isRagAuth)
      this.sourceOptions = accessInfo.sourceOptions || []
      this.externalOptions = accessInfo.externalOptions || []
    },
  },
})
