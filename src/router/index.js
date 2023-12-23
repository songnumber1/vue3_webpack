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
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
