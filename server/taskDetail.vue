<template>
  <div class="diff-table-wrapper">
    <div class="table-toolbar">
      <el-button
        size="small"
        type="success"
        @click="onBatchAccept"
        :disabled="!hasSelection"
        >批量接受</el-button
      >
      <el-button
        size="small"
        type="warning"
        @click="onBatchIgnore"
        :disabled="!hasSelection"
        >批量忽略</el-button
      >
      <el-button size="small" type="primary" @click="onPrintCurrent"
        >获取当前数据</el-button
      >
      <div class="ignore-fields">
        <span>忽略字段：</span>
        <el-tag
          v-for="field in ignoreFields"
          :key="field"
          closable
          @close="removeIgnoreField(field)"
          style="margin-right: 4px;"
        >{{ field }}</el-tag>
        <el-input
          v-model="ignoreInput"
          size="small"
          placeholder="添加字段"
          style="width: 120px; margin-left: 4px;"
          @keyup.enter="addIgnoreField"
        />
        <el-button size="small" @click="addIgnoreField" style="margin-left: 4px;">添加</el-button>
      </div>
      <div class="business-key">
        <span>业务路径字段：</span>
        <el-input
          v-model="businessKeyInput"
          size="small"
          placeholder="如 label、name"
          style="width: 100px; margin-left: 4px;"
          @keyup.enter="updateBusinessKey"
        />
        <el-button size="small" @click="updateBusinessKey" style="margin-left: 4px;">应用</el-button>
        <span style="margin-left:8px;color:#888;">当前：{{ businessKey }}</span>
      </div>
      <div class="status-count">
        <el-tag type="success">已接受：{{ statusCount.accepted }}</el-tag>
        <el-tag type="info">未处理：{{ statusCount.pending }}</el-tag>
        <el-tag type="warning">已忽略：{{ statusCount.ignored }}</el-tag>
      </div>
    </div>
    <vxe-table
      ref="xTable"
      :data="diffTreeData"
      row-id="id"
      :tree-config="{ children: 'children', expandAll: true, lazy: false, line: false }"
      :checkbox-config="{ range: true, checkField: 'checked' }"
      border
      stripe
      size="medium"
      :scroll-y="{ enabled: true, gt: 100 }"
      :virtual-tree="true"
      height="1200"
      @checkbox-change="onCheckboxChange"
      @checkbox-all="onCheckboxChange"
    >
      <vxe-column type="checkbox" width="50" />
      <vxe-column field="pathBusiness" title="路径" tree-node width="320">
        <template #default="{ row }">
          <span class="path-readable">{{ row.pathBusiness }}</span>
        </template>
      </vxe-column>
      <vxe-column
        field="oldValue"
        title="修改前的值"
        :formatter="formatValue"
      />
      <vxe-column
        field="newValue"
        title="修改后的值"
        :formatter="formatValue"
      />
      <vxe-column field="type" title="变更类型" width="100">
        <template #default="{ row }">
          <span :class="'diff-type-' + row.type">{{ diffTypeText(row.type) }}</span>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="200">
        <template #default="{ row }">
          <template v-if="row.status === 'pending'">
            <el-button size="small" type="success" @click="accept(row, row.__parent)"
              >接受</el-button
            >
            <el-button size="small" type="warning" @click="ignore(row, row.__parent)"
              >忽略</el-button
            >
          </template>
          <template v-else>
            <el-tag v-if="row.status === 'accepted'" type="success">已接受</el-tag>
            <el-tag v-else-if="row.status === 'ignored'" type="warning">已忽略</el-tag>
            <el-button size="small" type="info" @click="revoke(row, row.__parent)"
              >撤回</el-button
            >
          </template>
        </template>
      </vxe-column>
    </vxe-table>
    <el-dialog v-model="batchDialog.visible" title="批量操作确认" width="400px">
      <div>
        <div>确定要对选中的 <b>{{ batchDialog.count }}</b> 条数据执行 <b>{{ batchDialog.actionText }}</b> 操作吗？</div>
        <div v-if="batchDialog.hasProcessed" style="color:#e6a23c;margin-top:10px;">
          勾选项中包含已处理（已接受/已忽略）的数据，是否覆盖这些项的状态？
        </div>
      </div>
      <template #footer>
        <el-button @click="batchDialog.visible = false">取消</el-button>
        <el-button v-if="batchDialog.hasProcessed" type="primary" @click="onBatchConfirm(true)">覆盖</el-button>
        <el-button v-if="batchDialog.hasProcessed" type="success" @click="onBatchConfirm(false)">不覆盖</el-button>
        <el-button v-else type="primary" @click="onBatchConfirm(false)">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { diffJson, DiffResult } from "../utils/diffJson";

import oldJson from "../json/menu.json";
import newJson from "../json/menuDiff.json";

// 递归为每个节点加上 __parent 引用，便于向上联动
function addStatusToDiffTree(tree: DiffResult[], parent: any = null): any[] {
  return tree.map((item) => {
    const node: any = { ...item, status: "pending", __parent: parent };
    if (item.children && item.children.length > 0) {
      node.children = addStatusToDiffTree(item.children, node);
    }
    return node;
  });
}

// 白名单字段编辑功能
const ignoreFields = ref<string[]>([]);
const ignoreInput = ref('');
function addIgnoreField() {
  const val = ignoreInput.value.trim();
  if (val && !ignoreFields.value.includes(val)) {
    ignoreFields.value.push(val);
    ignoreInput.value = '';
    reloadDiff();
  }
}
function removeIgnoreField(field: string) {
  ignoreFields.value = ignoreFields.value.filter(f => f !== field);
  reloadDiff();
}
const statusCount = ref({ accepted: 0, pending: 0, ignored: 0 });
function updateStatusCount() {
  const count = { accepted: 0, pending: 0, ignored: 0 };
  function walk(nodes: any[]) {
    nodes.forEach(node => {
      if (node.status === 'accepted') count.accepted++;
      else if (node.status === 'ignored') count.ignored++;
      else count.pending++;
      if (node.children && node.children.length > 0) walk(node.children);
    });
  }
  walk(diffTreeData.value);
  statusCount.value = count;
}
// 在diff数据初始化和每次变更后都调用
nextTick(() => updateStatusCount());

const businessKey = ref('label');
const businessKeyInput = ref('');
function updateBusinessKey() {
  if (businessKeyInput.value.trim()) {
    businessKey.value = businessKeyInput.value.trim();
    reloadDiff();
  }
}

// 修改 reloadDiff，操作后统计
function reloadDiff() {
  // 1. 先保存当前 diffTreeData 的 status 映射（path -> status）
  const statusMap = new Map<string, string>();
  function collectStatus(nodes: any[]) {
    nodes.forEach(node => {
      statusMap.set(node.path, node.status);
      if (node.children && node.children.length > 0) {
        collectStatus(node.children);
      }
    });
  }
  collectStatus(diffTreeData.value);

  // 2. 重新生成 diffTreeData，传入meta: { primaryKey: 'id' }
  const newTree = addStatusToDiffTree(diffJson(
    oldJson,
    newJson,
    '',
    '',
    ignoreFields.value,
    businessKey.value,
    '',
    { primaryKey: 'id' }
  ));

  // 3. 递归同步 status
  function syncStatus(nodes: any[]) {
    nodes.forEach(node => {
      if (statusMap.has(node.path)) {
        node.status = statusMap.get(node.path);
      }
      if (node.children && node.children.length > 0) {
        syncStatus(node.children);
      }
    });
  }
  syncStatus(newTree);
  diffTreeData.value = newTree;
  nextTick(() => updateStatusCount());
}

const diffTreeData = ref<any[]>(addStatusToDiffTree(diffJson(
  oldJson,
  newJson,
  '',
  '',
  ignoreFields.value,
  businessKey.value,
  '',
  { primaryKey: 'id' }
)));
const xTable = ref();
const selection = ref<any[]>([]);
const hasSelection = ref(false);

function formatValue({ cellValue }: { cellValue: any }) {
  if (cellValue === undefined) return "-";
  if (typeof cellValue === "object") return JSON.stringify(cellValue);
  return String(cellValue);
}
function diffTypeText(type: string) {
  switch (type) {
    case "add":
      return "新增";
    case "delete":
      return "删除";
    case "update":
      return "修改";
    default:
      return type;
  }
}
// 联动：所有子节点accepted时，父节点自动accepted
function updateParentStatus(node: any) {
  if (!node || !node.__parent) return;
  const parent = node.__parent;
  if (parent.children && parent.children.length > 0) {
    if (parent.children.every((child: any) => child.status === "accepted")) {
      if (parent.status !== "accepted") {
        parent.status = "accepted";
        updateParentStatus(parent);
      }
    } else if (parent.status === "accepted") {
      // 只要有一个不是accepted，父节点不能是accepted
      parent.status = "pending";
    }
  }
}
function accept(row: any) {
  row.status = "accepted";
  if (row.children && row.children.length > 0) {
    row.children.forEach((child: any) => accept(child));
  }
  updateParentStatus(row);
  nextTick(() => updateStatusCount());
}
function ignore(row: any) {
  row.status = "ignored";
  if (row.children && row.children.length > 0) {
    row.children.forEach((child: any) => ignore(child));
  }
  updateParentStatus(row);
  nextTick(() => updateStatusCount());
}
function revoke(row: any) {
  row.status = "pending";
  if (row.children && row.children.length > 0) {
    row.children.forEach((child: any) => revoke(child));
  }
  updateParentStatus(row);
  nextTick(() => updateStatusCount());
}

// 递归批量操作
function batchSetStatus(rows: any[], status: string, cover = false) {
  rows.forEach((row) => {
    if (cover || row.status === 'pending') {
      row.status = status;
      if (row.children && row.children.length > 0) batchSetStatus(row.children, status, cover);
    }
  });
  nextTick(() => updateStatusCount());
}

// vxe-table 勾选变化
function onCheckboxChange({ records }: { records: any[] }) {
  selection.value = records;
  hasSelection.value = records.length > 0;
}

// 批量操作弹窗
const batchDialog = ref({ visible: false, action: '', actionText: '', count: 0, hasProcessed: false });
let batchActionStatus = '';
let batchSelection: any[] = [];
let batchCover = false;

function onBatchAccept() {
  prepareBatchDialog('accept', '接受');
}
function onBatchIgnore() {
  prepareBatchDialog('ignore', '忽略');
}
function prepareBatchDialog(action: string, actionText: string) {
  batchSelection = selection.value.slice();
  batchActionStatus = action === 'accept' ? 'accepted' : 'ignored';
  // 判断是否有已处理项
  const hasProcessed = batchSelection.some(row => row.status !== 'pending');
  batchDialog.value = {
    visible: true,
    action,
    actionText,
    count: batchSelection.length,
    hasProcessed
  };
}
function onBatchConfirm(cover = false) {
  batchCover = cover;
  if (batchCover) {
    batchSetStatus(batchSelection, batchActionStatus, true);
  } else {
    batchSetStatus(batchSelection, batchActionStatus, false);
  }
  batchDialog.value.visible = false;
  // 取消勾选
  nextTick(() => {
    if (xTable.value) xTable.value.clearCheckboxRow();
    selection.value = [];
    hasSelection.value = false;
  });
}

// 递归应用所有 status 为 accepted 的 diff 到 oldJson，生成最终目标数据
function applyDiffsToData(oldData: any, diffs: any[]): any {
  // 深拷贝 oldData，避免污染原始数据
  let result = Array.isArray(oldData) ? [...oldData] : (typeof oldData === 'object' && oldData !== null ? { ...oldData } : oldData);
  for (const diff of diffs) {
    if (diff.status !== 'accepted') continue;
    // 解析 path，支持 a.b[0].c 这种格式
    const pathArr = [];
    let path = diff.path;
    let match;
    const regex = /([^.\[\]]+)|(\[\d+\])/g;
    while ((match = regex.exec(path))) {
      if (match[1]) {
        pathArr.push(match[1]);
      } else if (match[0]) {
        pathArr.push(Number(match[0].replace(/\[|\]/g, '')));
      }
    }
    // 应用变更
    let cur = result;
    let parent = null;
    let parentKey = null;
    for (let i = 0; i < pathArr.length - 1; i++) {
      const key = pathArr[i];
      // 如果当前不是对象/数组，强制替换为对象或数组
      if (typeof cur !== 'object' || cur === null) {
        const newVal = typeof pathArr[i + 1] === 'number' ? [] : {};
        if (parent && parentKey !== null) {
          parent[parentKey] = newVal;
        } else if (i === 0) {
          result = newVal;
        }
        cur = newVal;
      }
      if (cur[key] === undefined || typeof cur[key] !== 'object' || cur[key] === null) {
        cur[key] = typeof pathArr[i + 1] === 'number' ? [] : {};
      }
      parent = cur;
      parentKey = key;
      cur = cur[key];
    }
    const lastKey = pathArr[pathArr.length - 1];
    if (diff.type === 'add' || diff.type === 'update') {
      cur[lastKey] = diff.newValue;
    } else if (diff.type === 'delete') {
      if (Array.isArray(cur)) {
        cur.splice(lastKey, 1);
      } else {
        delete cur[lastKey];
      }
    }
    // 递归 children
    if (diff.children && diff.children.length > 0) {
      applyDiffsToData(cur[lastKey], diff.children);
    }
  }
  return result;
}

function onPrintCurrent() {
  // 只应用 status 为 accepted 的 diff 到 oldJson
  const merged = applyDiffsToData(oldJson, diffTreeData.value);
  // eslint-disable-next-line no-console
  console.log('最终目标数据：', merged);
}
function stripParent(obj: any) {
  if (Array.isArray(obj)) {
    return obj.map(stripParent);
  } else if (obj && typeof obj === "object") {
    const { __parent, ...rest } = obj;
    if (rest.children) {
      rest.children = stripParent(rest.children);
    }
    return rest;
  }
  return obj;
}
</script>

<style scoped>
.diff-table-wrapper {
  padding: 32px 24px;
  height: 100vh;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.table-toolbar {
  margin-bottom: 16px;
  display: flex;
  gap: 12px;
}
.diff-type-add {
  color: #67c23a;
  font-weight: bold;
}
.diff-type-delete {
  color: #f56c6c;
  font-weight: bold;
}
.diff-type-update {
  color: #e6a23c;
  font-weight: bold;
}
.path-readable {
  color: #409eff;
  font-weight: 500;
  font-size: 15px;
  word-break: break-all;
}
.ignore-fields {
  display: inline-flex;
  align-items: center;
  margin-left: 24px;
}
.business-key {
  display: inline-flex;
  align-items: center;
  margin-left: 24px;
}
.status-count {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 32px;
}
</style>
