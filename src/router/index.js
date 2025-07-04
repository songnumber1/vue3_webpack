import {createRouter, createWebHistory} from "vue-router";
import HomeView from "../views/HomeView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/about",
    name: "about",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/AboutView.vue"),
  },
  {
    path: "/login",
    name: "login",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/Login.vue"),
  },
  {
    path: "/devicelist",
    name: "devicelist",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/DeviceList.vue"),
  },
  {
    path: "/mapmarker",
    name: "mapmarker",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/MapMarker.vue"),
  },
  {
    path: "/maplist",
    name: "maplist",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/MapList.vue"),
  },
  {
    path: "/timeline",
    name: "timeline",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/TimeLine.vue"),
  },
  {
    path: "/jest",
    name: "jest",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/Jest/JestView.vue"),
  },
  {
    path: "/jest-list",
    name: "jest-list",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/Jest/JestListView.vue"),
  },
  {
    path: "/jest-messagetoggle",
    name: "jest-messagetoggle",
    component: () =>
      import(
        /* webpackChunkName: "signup" */ "../views/Jest/JestMessageToggleView.vue"
      ),
  },
  {
    path: "/element",
    name: "element",
    component: () =>
      import(/* webpackChunkName: "signup" */ "../views/Element"),
  },
  {
    path: "/axios",
    name: "Axios",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/AxiosView.vue"),
  },
  {
    path: "/jsonEditor",
    name: "jsonEditor",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/JsonEditorView.vue"),
  },
  {
    path: "/bootstrap-chat",
    name: "bootstrap-chat",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/BootStrapChat.vue"),
  },
  {
    path: "/vuetify-chat",
    name: "vuetify-chat",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/VuetifyChat.vue"),
  },
  {
    path: "/response-chat",
    name: "response-chat",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/ResponseChat.vue"),
  },
  {
    path: "/chart",
    name: "chart",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/ChartView.vue"),
  },
  {
    path: "/stackedChart",
    name: "stackedChart",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/StackedChart.vue"),
  },
  {
    path: "/barChart",
    name: "barChart",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/BarChart.vue"),
  },
  {
    path: "/dashboard",
    name: "dashboard",
    // route level code-splitting
    // this generates a separate chunk (About.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import("../views/Dashboard.vue"),
  },
  {
    path: "/filemanger",
    name: "filemanger",
    component: () => import("../views/FileManager.vue"),
  },
  {
    path: "/timeoutchecker",
    name: "timeoutchecker",
    component: () => import("../views/TimeoutChecker.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
