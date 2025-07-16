<template>
  <div>
    <vxe-table
      border="full"
      stripe
      highlight-current-row
      :data="diffTreeData"
      :tree-config="{ children: 'children', rowField: 'rowId', parentField: 'parentId' }"
      :row-config="{ isHover: true }"
      class="diff-table"
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
      <vxe-column field="type" title="差异类型" width="120">
        <template #default="{ row }">
          <el-icon v-if="row.type === 'added'" color="#67c23a"><plus /></el-icon>
          <el-icon v-else-if="row.type === 'deleted'" color="#f56c6c"><remove /></el-icon>
          <el-icon v-else-if="row.type === 'modified'" color="#e6a23c"><edit /></el-icon>
          <el-icon v-else color="#909399"><circle-check /></el-icon>
          <span :style="{ color: diffTypeColor(row.type), marginLeft: '4px' }">{{ diffTypeText(row.type) }}</span>
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
import { diffJson, parseRowId, setJsonByPath, deleteJsonByPath, deepClone, DiffNode } from '@/utils/diffUtils';
import { Plus, Remove, Edit, CircleCheck } from '@element-plus/icons-vue';

interface DiffNodeWithId extends DiffNode {
  rowId: string;
  parentId?: string;
  children?: DiffNodeWithId[];
}

const props = defineProps<{
  moduleName: string;
  leftData: any;
  rightData: any;
  onAccept: (row: DiffNodeWithId) => void;
  onIgnore: (row: DiffNodeWithId) => void;
}>();

const diffTreeData = computed<DiffNodeWithId[]>(() => {
  function wrap(nodes: DiffNode[], parentId?: string): DiffNodeWithId[] {
    return nodes.map((node) => {
      const rowId = parentId ? `${parentId}-${node.key}` : `${node.key}`;
      const children = node.children ? wrap(node.children, rowId) : undefined;
      return { ...node, rowId, parentId, children };
    });
  }
  return wrap(diffJson(props.leftData, props.rightData));
});

function formatValue(val: any) {
  if (val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}
function diffTypeText(type: string) {
  switch (type) {
    case 'added': return '新增';
    case 'deleted': return '删除';
    case 'modified': return '修改';
    case 'unchanged': return '无变化';
    default: return type;
  }
}
function diffTypeColor(type: string) {
  switch (type) {
    case 'added': return '#67c23a';
    case 'deleted': return '#f56c6c';
    case 'modified': return '#e6a23c';
    case 'unchanged': return '#909399';
    default: return '#606266';
  }
}

function acceptDiff(row: DiffNodeWithId) {
  props.onAccept(row);
}
function ignoreDiff(row: DiffNodeWithId) {
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