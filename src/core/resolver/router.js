import {createRouter, createWebHistory} from 'vue-router'
import AssistantRoot from '@/views/AssistantRoot.vue'
import MainPage from '@/views/MainPage.vue'
const ChatPage = () => import(/* webpackChunkName: "chat-room" */ '@/views/ChatPage.vue')
const SwaggerPage = () => import(/* webpackChunkName: "swagger" */ '@/views/SwaggerPage.vue')
const GuidePage = () => import(/* webpackChunkName: "guide" */ '@/views/GuidePage.vue')
const SharedPage = () => import(/* webpackChunkName: "shared" */ '@/views/SharedPage.vue')
const PlaygroundPage = () => import(/* webpackChunkName: "playground" */ '@/views/playground/PlaygroundPage.vue')
const NotFoundPage = () => import(/* webpackChunkName: "not-found" */ '@/views/NotFoundPage.vue')
const AndroidUpdate = () => import(/* webpackChunkName: "android-update" */ '@/views/android/AndroidUpdate.vue')
import {isAndroidApp, isIosApp} from '@/core/config'
import {isVersionLowerThan} from '@/core/config/version'
import {usePlatformStore} from '@/stores/platformStore'

const ANDROID_UPDATE_ROUTE_NAME = 'android-update'
const baseRoutes = [{
  path: '/',
  component: AssistantRoot,
  children: [
    {path: '', name: 'main', component: MainPage, meta: {title: 'Assistant'}},
    {path: 'chat/:id', name: 'chat', component: ChatPage, props: true, meta: {title: 'Chat'}},
    {path: 'swagger', name: 'swagger', component: SwaggerPage, meta: {title: 'Swagger'}},
    {path: 'guide', name: 'guide', component: GuidePage, meta: {title: 'Guide'}},
    {path: 'shared/:shareId', name: 'shared', component: SharedPage, props: true, meta: {title: 'Shared Chat'}},
    {path: 'playground', name: 'playground', component: PlaygroundPage, meta: {title: 'Playground'}},
  ],
}]
const androidRoutes = [{path:'/android/update', name:ANDROID_UPDATE_ROUTE_NAME, component:AndroidUpdate, meta:{title:'Android Update', skipVersionCheck:true}}]
const iosRoutes = []
const notFoundRoute = {path:'/:pathMatch(.*)*', name:'not-found', component:NotFoundPage, meta:{title:'Not Found', skipVersionCheck:true}}
function shouldRequireAndroidUpdate(appInfo) {
  if (!isAndroidApp(appInfo)) return false
  const currentVersion = appInfo?.appVersion
  const latestVersion = appInfo?.lastVersionInfo?.version
  if (!currentVersion || !latestVersion) return false
  return isVersionLowerThan(currentVersion, latestVersion)
}
function registerRouteGuard(router, appInfo) {
  router.beforeEach((to) => {
    const platformStore = usePlatformStore()
    platformStore.refresh(appInfo)
    if (!platformStore.isAccess) return true
    if (to.meta?.skipVersionCheck) return true
    if (to.name === ANDROID_UPDATE_ROUTE_NAME) return true
    if (shouldRequireAndroidUpdate(appInfo)) return {name: ANDROID_UPDATE_ROUTE_NAME, replace: true}
    return true
  })
  router.afterEach((to) => { if (to.meta?.title) document.title = to.meta.title })
}
export function resolveRouter(appInfo) {
  const routes = [...baseRoutes, ...(isAndroidApp(appInfo) ? androidRoutes : []), ...(isIosApp(appInfo) ? iosRoutes : []), notFoundRoute]
  const router = createRouter({history:createWebHistory(), routes})
  registerRouteGuard(router, appInfo)
  return router
}
