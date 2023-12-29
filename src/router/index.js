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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
