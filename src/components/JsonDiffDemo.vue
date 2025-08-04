<template>
  <div class="json-diff-demo">
    <h3>JSON 树形数据对比演示</h3>
    <div class="action-buttons">
      <el-button type="primary" @click="runComparison">执行对比</el-button>
    </div>

    <div v-if="diffResult.length > 0" class="diff-result">
      <h4>对比结果</h4>
      <vxe-table
        ref="xTable"
        :data="vxeTableData"
        :tree-config="{ children: 'children', expandAll: true }"
        border
        stripe
      >
        <vxe-column field="id" title="序号" width="80"></vxe-column>
        <vxe-column field="type" title="变更类型" width="100">
          <template #default="{ row }">
            <span
              :class="{
                added: row.type === 'added',
                deleted: row.type === 'deleted',
                modified: row.type === 'modified',
                unchanged: row.type === 'unchanged',
              }"
              >{{ row.type }}</span
            >
          </template>
        </vxe-column>
        <vxe-column field="changes" title="变更内容" width="400">
          <template #default="{ row }">
            <div v-if="row.changes" class="changes-container">
              <div
                v-for="(change, key) in row.changes"
                :key="key"
                class="change-item"
              >
                <div class="change-field">{{ key }}:</div>
                <div class="change-old">
                  旧值: {{ JSON.stringify(change.oldValue) }}
                </div>
                <div class="change-new">
                  新值: {{ JSON.stringify(change.newValue) }}
                </div>
              </div>
            </div>
            <div v-else>-</div>
          </template>
        </vxe-column>
      </vxe-table>
    </div>

    <div v-else class="no-result">请点击"执行对比"按钮查看结果</div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from "vue";
import { useJsonDiff } from "../utils/useJsonDiff";
import menuJson from "../json/menu.json";
import menuDiffJson from "../json/menuDiff.json";

// 模拟旧数据和新数据
const oldData = ref<any[]>(menuJson);
const newData = ref<any[]>(menuDiffJson);

// 使用 JSON 差异对比钩子
const { diffResult, vxeTableData, compare } = useJsonDiff(
  oldData.value,
  newData.value,
  {
    key: "id",
    childrenKey: "children",
    ignoreKeys: ["url", "path"], // 忽略对比的字段
  }
);

// 执行对比的方法
const runComparison = () => {
  compare();
  console.log("对比结果:", diffResult.value);
};

// 初始加载时执行一次对比
onMounted(() => {
  runComparison();
});
</script>

<style scoped>
.json-diff-demo {
  padding: 20px;
}

.action-buttons {
  margin-bottom: 20px;
}

.diff-result {
  margin-top: 20px;
}

.no-result {
  margin-top: 20px;
  padding: 20px;
  text-align: center;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.changes-container {
  padding: 5px;
}

.change-item {
  margin-bottom: 5px;
  padding-bottom: 5px;
  border-bottom: 1px dashed #eee;
}

.change-field {
  font-weight: bold;
  margin-bottom: 2px;
}

.change-old {
  color: #f56c6c;
  margin-bottom: 2px;
}

.change-new {
  color: #67c23a;
}

.added {
  color: #67c23a;
}

.deleted {
  color: #f56c6c;
}

.modified {
  color: #e6a23c;
}

.unchanged {
  color: #909399;
}
</style>
