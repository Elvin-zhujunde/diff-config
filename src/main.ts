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

import menu from './json/menu.json'
import menuDiff from './json/menuDiff.json'
import { diffJson } from "./utils/diffJson";


console.log(diffJson(menu, menuDiff, 'wtf'));

app.mount("#app");
