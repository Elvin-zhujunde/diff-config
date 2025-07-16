<template>
  <div>
    <vxe-table
      :data="treeData"
      :tree-config="{ children: 'children', rowField: 'rowId', parentField: 'parentId' }"
      border="full"
      stripe
      highlight-current-row
      class="diff-table"
    >
      <vxe-column
        v-for="col in columns"
        :key="col.field"
        :field="col.field"
        :title="col.title"
        :width="col.width || 120"
        tree-node="col.treeNode"
      >
        <template #default="{ row }">
          <span v-if="col.formatter">{{ col.formatter(row) }}</span>
          <span v-else>{{ getCellValue(row, col.field) }}</span>
        </template>
      </vxe-column>
      <vxe-column title="操作" width="180">
        <template #default="{ row }">
          <vxe-button v-if="row.type !== 'unchanged'" size="mini" type="success" style="margin-right:8px" @click="acceptDiff(row)">接受</vxe-button>
          <vxe-button v-if="row.type !== 'unchanged'" size="mini" type="info" @click="ignoreDiff(row)">忽略</vxe-button>
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// 支持的children字段名
const childrenFieldNames = ['children', 'departments', 'child'];

// 字段label映射表，可根据实际需求扩展
const fieldLabelMap: Record<string, string> = {
  name: '姓名',
  age: '年龄',
  gender: '性别',
  salary: '薪资',
  'meta.title': '职位',
  meta: '元数据',
  children: '下属',
  child: '子菜单',
  departments: '部门列表',
  deptName: '部门名称',
  label: '菜单名',
  path: '路径',
  roleName: '角色名',
};

const props = defineProps<{
  data: any[], // 原始树形数据
  onAccept: (row: any) => void,
  onIgnore: (row: any) => void,
}>();

// 递归收集所有字段（多级字段用 a.b）
function collectFields(data: any[], prefix = '', fields = new Set<string>()) {
  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (childrenFieldNames.includes(key) || key === 'rowId' || key === 'parentId' || key === 'type') return;
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (typeof item[key] === 'object' && item[key] !== null && !Array.isArray(item[key])) {
        collectFields([item[key]], fullKey, fields);
      } else {
        fields.add(fullKey);
      }
    });
    // 递归所有children字段
    for (const childKey of childrenFieldNames) {
      if (Array.isArray(item[childKey])) {
        collectFields(item[childKey], prefix, fields);
      }
    }
  });
  return fields;
}

const columns = computed(() => {
  const fields = Array.from(collectFields(props.data));
  return fields.map(field => ({
    field,
    title: fieldLabelMap[field] || field,
    treeNode: field === 'name' || field === 'label', // name/label为treeNode
    formatter: undefined,
    width: field === 'name' || field === 'label' ? 180 : 120,
  }));
});

// 递归为每个节点生成rowId，并统一children字段
function addRowIdAndChildren(data: any[], parentId = ''): any[] {
  return data.map((item, idx) => {
    const rowId = parentId ? `${parentId}-${idx}` : `${idx}`;
    // 统一children字段
    let children: any[] | undefined = undefined;
    for (const key of childrenFieldNames) {
      if (Array.isArray(item[key])) {
        children = addRowIdAndChildren(item[key], rowId);
        break;
      }
    }
    return { ...item, rowId, parentId: parentId || undefined, children };
  });
}

const treeData = computed(() => addRowIdAndChildren(props.data));

function getCellValue(row: any, field: string) {
  const keys = field.split('.');
  let val = row;
  for (const k of keys) {
    if (val == null) return '';
    val = val[k];
  }
  return val == null ? '' : val;
}

function acceptDiff(row: any) {
  props.onAccept(row);
}
function ignoreDiff(row: any) {
  props.onIgnore(row);
}
</script>

<style scoped>
.diff-table {
  margin: 16px 0 8px 0;
  background: #fcfcfc;
  border-radius: 6px;
  box-shadow: 0 1px 4px #0001;
}
</style> 