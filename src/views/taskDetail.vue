<template>
  <div>
    <p>
      <vxe-button @click="getTreeExpansionEvent">获取已展开</vxe-button>
      <vxe-button @click="expandAllEvent">展开所有</vxe-button>
      <vxe-button @click="clearExpandEvent">关闭所有</vxe-button>
      <vxe-button status="success" @click="getSelectEvent">获取已选</vxe-button>
    </p>

    <vxe-table
      border="inner"
      ref="tableRef"
      :data="diffTreeData"
      :tree-config="{ children: 'children', rowField: 'rowId', parentField: 'parentId' }"
      :row-config="{ isHover: true }"
    >
      <vxe-column field="key" title="字段/下标" width="180" tree-node></vxe-column>
      <vxe-column field="leftValue" title="左值" width="180">
        <template #default="{ row }">
          <span v-if="row.type !== 'unchanged'" style="color: #f56c6c">{{ formatValue(row.leftValue) }}</span>
          <span v-else>{{ formatValue(row.leftValue) }}</span>
        </template>
      </vxe-column>
      <vxe-column field="rightValue" title="右值" width="180">
        <template #default="{ row }">
          <span v-if="row.type !== 'unchanged'" style="color: #67c23a">{{ formatValue(row.rightValue) }}</span>
          <span v-else>{{ formatValue(row.rightValue) }}</span>
        </template>
      </vxe-column>
      <vxe-column field="type" title="差异类型" width="100">
        <template #default="{ row }">
          <span :style="{ color: diffTypeColor(row.type) }">{{ diffTypeText(row.type) }}</span>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="160">
        <template #default="{ row }">
          <vxe-button v-if="row.type !== 'unchanged'" size="mini" @click="acceptDiff(row)">接受</vxe-button>
          <vxe-button v-if="row.type !== 'unchanged'" size="mini" @click="ignoreDiff(row)">忽略</vxe-button>
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, watch } from "vue";
import {
  VxeUI,
  VxeTableInstance,
  VxeTableEvents,
  VxeTablePropTypes,
} from "vxe-table";
import axios from "axios";
import type { AxiosResponse } from "axios";

interface RowVO {
  id: number;
  parentId: number | null;
  name: string;
  type: string;
  size: number;
  date: string;
}

const tableRef = ref<VxeTableInstance<RowVO>>();

const columnConfig = reactive<VxeTablePropTypes.ColumnConfig>({
  resizable: true,
});

const checkboxConfig = reactive<VxeTablePropTypes.CheckboxConfig<RowVO>>({
  // labelField: "name",
  highlight: true,
});

const treeConfig = reactive<VxeTablePropTypes.TreeConfig>({
  transform: true,
  rowField: "id",
  parentField: "parentId",
});

const tableData = ref<RowVO[]>([
  {
    id: 10000,
    parentId: null,
    name: "Test1",
    type: "mp3",
    size: 1024,
    date: "2020-08-01",
  },
  {
    id: 10050,
    parentId: null,
    name: "Test2",
    type: "mp4",
    size: 0,
    date: "2021-04-01",
  },
  {
    id: 24300,
    parentId: 10050,
    name: "Test3",
    type: "avi",
    size: 1024,
    date: "2020-03-01",
  },
  {
    id: 20045,
    parentId: 24300,
    name: "Test4",
    type: "html",
    size: 600,
    date: "2021-04-01",
  },
  {
    id: 10053,
    parentId: 24300,
    name: "Test5",
    type: "avi",
    size: 0,
    date: "2021-04-01",
  },
  {
    id: 24330,
    parentId: 10053,
    name: "Test6",
    type: "txt",
    size: 25,
    date: "2021-10-01",
  },
  {
    id: 21011,
    parentId: 10053,
    name: "Test7",
    type: "pdf",
    size: 512,
    date: "2020-01-01",
  },
  {
    id: 22200,
    parentId: 10053,
    name: "Test8",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23666,
    parentId: null,
    name: "Test9",
    type: "xlsx",
    size: 2048,
    date: "2020-11-01",
  },
  {
    id: 23677,
    parentId: 23666,
    name: "Test10",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23671,
    parentId: 23677,
    name: "Test11",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23672,
    parentId: 23677,
    name: "Test12",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23688,
    parentId: 23666,
    name: "Test13",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23681,
    parentId: 23688,
    name: "Test14",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 23682,
    parentId: 23688,
    name: "Test15",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 24555,
    parentId: null,
    name: "Test16",
    type: "avi",
    size: 224,
    date: "2020-10-01",
  },
  {
    id: 24566,
    parentId: 24555,
    name: "Test17",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
  {
    id: 24577,
    parentId: 24555,
    name: "Test18",
    type: "js",
    size: 1024,
    date: "2021-06-01",
  },
]);

// 新增：左右JSON数据
const leftJson = ref<any>(null);
const rightJson = ref<any>(null);

// 新增：用于保存用户操作后的左侧JSON副本
const leftJsonEdit = ref<any>(null);

// mock接口地址（后续可替换为真实接口）
const leftUrl = "/api/left.json";
const rightUrl = "/api/right.json";

const fetchJsonData = async () => {
  try {
    const [leftRes, rightRes]: [AxiosResponse, AxiosResponse] = await Promise.all([
      axios.get(leftUrl),
      axios.get(rightUrl),
    ]);
    leftJson.value = leftRes.data;
    rightJson.value = rightRes.data;
  } catch (e) {
    console.error("获取JSON数据失败", e);
  }
};

onMounted(() => {
  fetchJsonData();
});

// 每次获取新数据时，重置编辑副本
watch([leftJson, rightJson], () => {
  leftJsonEdit.value = deepClone(leftJson.value);
}, { immediate: true });

function deepClone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

// 递归查找并操作JSON路径
function setJsonByPath(obj: any, path: (string|number)[], value: any) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}
function deleteJsonByPath(obj: any, path: (string|number)[]) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  if (Array.isArray(cur)) {
    cur.splice(Number(path[path.length - 1]), 1);
  } else {
    delete cur[path[path.length - 1]];
  }
}

// 解析rowId为路径
function parseRowId(rowId: string): (string|number)[] {
  return rowId.split('-').map(k => isNaN(Number(k)) ? k : Number(k));
}

const toggleExpandChangeEvent: VxeTableEvents.ToggleTreeExpand = (params) => {
  const $table = tableRef.value;
  if ($table) {
    const { row, expanded } = params;
    console.log(
      "节点展开事件",
      expanded,
      "获取父节点：",
      $table.getParentRow(row)
    );
  }
};

const getTreeExpansionEvent = () => {
  const $table = tableRef.value;
  if ($table) {
    const treeExpandRecords = $table.getTreeExpandRecords();
    VxeUI.modal.alert(treeExpandRecords.length);
  }
};

const expandAllEvent = () => {
  const $table = tableRef.value;
  if ($table) {
    $table.setAllTreeExpand(true);
  }
};

const clearExpandEvent = () => {
  const $table = tableRef.value;
  if ($table) {
    $table.clearTreeExpand();
  }
};

const getSelectEvent = () => {
  const $table = tableRef.value;
  if ($table) {
    const selectRecords = $table.getCheckboxRecords();
    console.log(selectRecords);

    VxeUI.modal.message({
      content: `当前页勾选：${selectRecords.length} 条`,
      status: "success",
    });
  }
};

// 差异类型定义
type DiffType = 'added' | 'deleted' | 'modified' | 'unchanged';

interface DiffNode {
  key: string;
  leftValue: any;
  rightValue: any;
  type: DiffType;
  children?: DiffNode[];
}

/**
 * 通用递归对比两个JSON（对象或数组），输出树形差异结构
 */
function diffJson(left: any, right: any, key = ''): DiffNode[] {
  const result: DiffNode[] = [];
  if (Array.isArray(left) || Array.isArray(right)) {
    const lArr = Array.isArray(left) ? left : [];
    const rArr = Array.isArray(right) ? right : [];
    const maxLen = Math.max(lArr.length, rArr.length);
    for (let i = 0; i < maxLen; i++) {
      const lVal = lArr[i];
      const rVal = rArr[i];
      let type: DiffType;
      if (lVal === undefined) {
        type = 'added';
      } else if (rVal === undefined) {
        type = 'deleted';
      } else if (isObject(lVal) && isObject(rVal) || Array.isArray(lVal) && Array.isArray(rVal)) {
        const children = diffJson(lVal, rVal, String(i));
        type = children.some(child => child.type !== 'unchanged') ? 'modified' : 'unchanged';
        result.push({ key: String(i), leftValue: lVal, rightValue: rVal, type, children });
        continue;
      } else if (lVal !== rVal) {
        type = 'modified';
      } else {
        type = 'unchanged';
      }
      result.push({ key: String(i), leftValue: lVal, rightValue: rVal, type });
    }
    return result;
  }
  // 对象对比
  const allKeys = new Set([
    ...Object.keys(left || {}),
    ...Object.keys(right || {})
  ]);
  for (const k of allKeys) {
    const lVal = left ? left[k] : undefined;
    const rVal = right ? right[k] : undefined;
    let type: DiffType;
    if (lVal === undefined) {
      type = 'added';
    } else if (rVal === undefined) {
      type = 'deleted';
    } else if (isObject(lVal) && isObject(rVal) || Array.isArray(lVal) && Array.isArray(rVal)) {
      const children = diffJson(lVal, rVal, k);
      type = children.some(child => child.type !== 'unchanged') ? 'modified' : 'unchanged';
      result.push({ key: k, leftValue: lVal, rightValue: rVal, type, children });
      continue;
    } else if (lVal !== rVal) {
      type = 'modified';
    } else {
      type = 'unchanged';
    }
    result.push({ key: k, leftValue: lVal, rightValue: rVal, type });
  }
  return result;
}

function isObject(val: any) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

// 生成对比树数据
type DiffNodeWithId = DiffNode & { rowId: string; parentId?: string };

// diffTreeData响应式触发器
const diffTreeDataTrigger = ref(0);
const diffTreeData = computed<DiffNodeWithId[]>(() => {
  diffTreeDataTrigger.value; // 依赖触发
  if (!leftJsonEdit.value || !rightJson.value) return [];
  function wrap(nodes: DiffNode[], parentId?: string): DiffNodeWithId[] {
    return nodes.map((node, idx) => {
      const rowId = parentId ? `${parentId}-${node.key}` : `${node.key}`;
      const children = node.children ? wrap(node.children, rowId) : undefined;
      return { ...node, rowId, parentId, children };
    });
  }
  return wrap(diffJson(leftJsonEdit.value, rightJson.value));
});

function formatValue(val: any) {
  if (val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

function diffTypeText(type: DiffType) {
  switch (type) {
    case 'added': return '新增';
    case 'deleted': return '删除';
    case 'modified': return '修改';
    case 'unchanged': return '无变化';
    default: return type;
  }
}
function diffTypeColor(type: DiffType) {
  switch (type) {
    case 'added': return '#67c23a';
    case 'deleted': return '#f56c6c';
    case 'modified': return '#e6a23c';
    case 'unchanged': return '#909399';
    default: return '#606266';
  }
}

// 占位操作方法
function acceptDiff(row: DiffNodeWithId) {
  const path = parseRowId(row.rowId);
  if (row.type === 'added' || row.type === 'modified') {
    setJsonByPath(leftJsonEdit.value, path, row.rightValue);
  } else if (row.type === 'deleted') {
    deleteJsonByPath(leftJsonEdit.value, path);
  }
  // 重新生成diff树
  refreshDiffTree();
}
function ignoreDiff(row: DiffNodeWithId) {
  // 忽略即保留左值，不做变更，只标记为已处理
  // 这里可扩展为记录已忽略项，UI上做特殊标记
  // 目前仅重新生成diff树即可
  refreshDiffTree();
}

// 刷新diff树
function refreshDiffTree() {
  diffTreeDataTrigger.value++;
}
</script>
