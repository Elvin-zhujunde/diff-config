import { createApp } from "vue";
import App from "./App.vue";
import "./style.less";
import router from "./router";
import pinia from "./store";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import VxeUIAll from "vxe-pc-ui";
import "vxe-pc-ui/lib/style.css";
import VxeUITable from "vxe-table";
import "vxe-table/lib/style.css";
const app = createApp(App);

app.use(router).use(VxeUIAll).use(VxeUITable);
app.use(pinia);
app.use(ElementPlus);

import oldData from './json/menu.json'
import newData from './json/menuDiff.json'
import { diffTree } from "./utils/diffJson";

const diff = diffTree(oldData, newData, {
  key: 'id',
  childrenKey: 'children',
  ignoreKeys: [],
});

console.dir(diff, { depth: null, colors: true }); 

app.mount("#app");
