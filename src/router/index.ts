import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    redirect: "/taskList", // 根据错误提示添加 redirect 属性，这里使用示例路径，实际请替换为合适路径
  },
  {
    path: "/taskList",
    name: "taskList",
    component: () => import("../views/taskList.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

export default router;
