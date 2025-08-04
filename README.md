# JSON 树形数据对比工具

这是一个用于对比树形 JSON 数据差异的 Vue 3 组件库，支持检测增、删、改操作，并可将结果转换为 vxe-table 所需的树形数据结构。

## 功能特点

- 支持检测树形结构中的新增、删除和修改节点
- 可配置唯一标识字段、子节点字段及忽略比较的字段
- 提供 Vue 组合式 API 钩子函数，易于集成到 Vue 项目中
- 支持将差异结果转换为 vxe-table 所需的树形数据
- 完整的 TypeScript 类型支持

## 安装

```bash
# 使用 npm
npm install

# 使用 yarn
yarn install
```

## 使用示例

### 基本使用

```vue
<template>
  <div>
    <vxe-table
      :data="vxeTableData"
      :tree-config="{ children: 'children', expandAll: true }"
      border
      stripe
    >
      <vxe-column field="id" title="序号" width="80"></vxe-column>
      <vxe-column field="type" title="变更类型" width="100"></vxe-column>
      <vxe-column field="changes" title="变更内容" width="400"></vxe-column>
    </vxe-table>
  </div>
</template>

<script lang="ts" setup>
import { useJsonDiff } from './utils/useJsonDiff';
import oldData from './json/oldData.json';
import newData from './json/newData.json';

// 使用 JSON 差异对比钩子
const { vxeTableData } = useJsonDiff(
  oldData,
  newData,
  {
    key: 'id',          // 唯一标识字段
    childrenKey: 'children', // 子节点字段
    ignoreKeys: ['url']  // 忽略对比的字段
  }
);
</script>
```

### 高级使用

```vue
<template>
  <div>
    <el-button @click="runComparison">执行对比</el-button>

    <vxe-table
      v-if="diffResult.length > 0"
      :data="vxeTableData"
      :tree-config="{ children: 'children', expandAll: true }"
      border
      stripe
    >
      <vxe-column field="id" title="序号" width="80"></vxe-column>
      <vxe-column field="type" title="变更类型" width="100">
        <template #default="{ row }">
          <span :class="{ 
            'added': row.type === 'added', 
            'deleted': row.type === 'deleted', 
            'modified': row.type === 'modified'
          }">{{ row.type }}</span>
        </template>
      </vxe-column>
      <vxe-column field="changes" title="变更内容" width="400">
        <template #default="{ row }">
          <div v-if="row.changes">
            <div v-for="(change, key) in row.changes" :key="key">
              <div>{{ key }}: 从 {{ change.oldValue }} 变为 {{ change.newValue }}</div>
            </div>
          </div>
        </template>
      </vxe-column>
    </vxe-table>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useJsonDiff } from './utils/useJsonDiff';

// 模拟数据
const oldData = ref([...]);
const newData = ref([...]);

// 使用 JSON 差异对比钩子
const { diffResult, vxeTableData, compare } = useJsonDiff(
  oldData.value,
  newData.value,
  {
    key: 'id',
    childrenKey: 'children'
  }
);

// 手动触发对比
const runComparison = () => {
  compare();
};
</script>

<style>
.added { color: #67c23a; }
.deleted { color: #f56c6c; }
.modified { color: #e6a23c; }
</style>
```

## API 文档

### useJsonDiff 钩子函数

```typescript
function useJsonDiff(
  oldTree: any[],
  newTree: any[],
  options?: DiffOptions
): {
  diffResult: Ref<NodeDiff[]>,
  vxeTableData: ComputedRef<any[]>,
  compare: () => NodeDiff[]
}
```

### DiffOptions 接口

```typescript
interface DiffOptions {
  key?: string;          // 主键字段名，默认 'id'
  childrenKey?: string;  // 子节点字段名，默认 'children'
  ignoreKeys?: string[]; // 忽略对比的字段
}
```

### NodeDiff 接口

```typescript
interface NodeDiff {
  id: string | number;          // 节点ID
  type: 'added' | 'deleted' | 'modified' | 'unchanged'; // 变更类型
  changes?: Record<string, ChangeInfo>; // 字段变更信息
  children?: NodeDiff[];         // 子节点变更信息
}
```

### ChangeInfo 接口

```typescript
interface ChangeInfo {
  oldValue: any; // 旧值
  newValue: any; // 新值
}
```

## 运行示例

```bash
# 开发模式
yarn dev

# 构建生产版本
yarn build
```

在浏览器中打开 http://localhost:5173 查看示例。
