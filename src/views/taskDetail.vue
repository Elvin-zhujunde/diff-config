<template>
  <div class="diff-page">
    <h2>配置差异对比</h2>
    <p class="desc">
      左侧为原始配置，右侧为变更配置。每个模块可单独对比、接受或忽略变更。
    </p>
    <el-collapse v-model="activeNames" class="module-collapse">
      <el-collapse-item
        v-for="module in moduleNames"
        :key="module"
        :name="module"
      >
        <template #title>
          <el-icon :size="18" style="vertical-align: middle; margin-right: 8px">
            <component :is="moduleIcon(module)" />
          </el-icon>
          {{ moduleTitle(module) }}
          <span class="module-desc">（共{{ getModuleCount(module) }}项）</span>
        </template>
        <!-- <JsonTreeTable
          v-if="Array.isArray(leftJsonEdit[module]) && Array.isArray(rightJson[module])"
          :data="diffJsonTreeData(module)"
          :onAccept="row => handleAcceptTree(module, row)"
          :onIgnore="row => handleIgnoreTree(module, row)"
        /> -->
        <ModuleDiffTable
          :moduleName="module"
          :leftData="leftJsonEdit[module]"
          :rightData="rightJson[module]"
          :onAccept="(row) => handleAccept(module, row)"
          :onIgnore="(row) => handleIgnore(module, row)"
        />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, computed } from "vue";
import axios from "axios";
import ModuleDiffTable from "@/components/ModuleDiffTable.vue";
import JsonTreeTable from "@/components/JsonTreeTable.vue";
import {
  deepClone,
  setJsonByPath,
  deleteJsonByPath,
  parseRowId,
  diffJson,
} from "@/utils/diffUtils";
import { Menu, User, OfficeBuilding } from "@element-plus/icons-vue";

const leftUrl = "/src/json/oriJson.json";
const rightUrl = "/src/json/difJson.json";

const leftJson = ref<any>({});
const rightJson = ref<any>({});
const leftJsonEdit = ref<any>({});

const activeNames = ref<string[]>([]);

const moduleNames = computed(() => {
  const keys = new Set([
    ...Object.keys(leftJson.value || {}),
    ...Object.keys(rightJson.value || {}),
  ]);
  return Array.from(keys);
});

onMounted(async () => {
  const [leftRes, rightRes] = await Promise.all([
    axios.get(leftUrl),
    axios.get(rightUrl),
  ]);
  leftJson.value = leftRes.data;
  rightJson.value = rightRes.data;
  if (moduleNames.value.length > 0) {
    activeNames.value = [moduleNames.value[0]];
  }
});

watch(
  [leftJson, rightJson],
  () => {
    leftJsonEdit.value = deepClone(leftJson.value);
  },
  { immediate: true }
);

function moduleTitle(module: string) {
  switch (module) {
    case "menu":
      return "菜单管理";
    case "role":
      return "角色管理";
    case "department":
      return "部门管理";
    default:
      return module;
  }
}
function moduleIcon(module: string) {
  switch (module) {
    case "menu":
      return Menu;
    case "role":
      return User;
    case "department":
      return OfficeBuilding;
    default:
      return Menu;
  }
}
function getModuleCount(module: string) {
  const data = leftJsonEdit.value[module];
  if (!data) return 0;
  if (Array.isArray(data)) return data.length;
  if (data.items) return data.items.length;
  if (data.roles) return data.roles.length;
  if (data.departments) return data.departments.length;
  return Object.keys(data).length;
}

// 生成树形diff数据
function diffJsonTreeData(module: string) {
  // 只对比数组类型
  return diffJson(
    leftJsonEdit.value[module] || [],
    rightJson.value[module] || []
  );
}

function handleAccept(module: string, row: any) {
  const path = parseRowId(row.rowId);
  if (row.type === "added" || row.type === "modified") {
    setJsonByPath(leftJsonEdit.value[module], path, row.rightValue);
  } else if (row.type === "deleted") {
    deleteJsonByPath(leftJsonEdit.value[module], path);
  }
}
function handleIgnore(module: string, row: any) {
  // 忽略即不做变更
}

// 针对树形表格的操作
function handleAcceptTree(module: string, row: any) {
  const path = parseRowId(row.rowId);
  if (row.type === "added" || row.type === "modified") {
    setJsonByPath(leftJsonEdit.value[module], path, row.rightValue);
  } else if (row.type === "deleted") {
    deleteJsonByPath(leftJsonEdit.value[module], path);
  }
}
function handleIgnoreTree(module: string, row: any) {
  // 忽略即不做变更
}
</script>

<style scoped>
.diff-page {
  max-width: 1200px;
  margin: 30px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px #0001;
  padding: 32px 24px 24px 24px;
}
h2 {
  margin-bottom: 8px;
}
.desc {
  color: #888;
  margin-bottom: 24px;
}
.module-collapse {
  background: #f8f9fa;
  border-radius: 6px;
  box-shadow: 0 1px 4px #0001;
}
.module-desc {
  color: #aaa;
  font-size: 13px;
  margin-left: 8px;
}
</style>
