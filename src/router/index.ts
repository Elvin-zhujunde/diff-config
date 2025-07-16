import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    redirect: "/taskList", // 根据错误提示添加 redirect 属性，这里使用示例路径，实际请替换为合适路径
  },
  {
    path: "/taskList",
    name: "TaskList",
    component: () => import("../views/TaskList.vue"),
  },
  {
    path: "/task/:id",
    name: "taskDetail",
    component: () => import("../views/taskDetail.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes: routes,
});

export default router;
