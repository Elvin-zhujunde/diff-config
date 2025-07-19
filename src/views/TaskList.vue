<template>
  <div class="mb-4">
    <el-button type="primary" @click="dialogVisible = true"
      >创建发布任务</el-button
    >
    <el-button type="primary">导出JSON数据</el-button>
  </div>
  <el-table
    :data="tableData"
    style="width: 100%"
    row-key="id"
    :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
  >
    <el-table-column fixed prop="date" label="日期" width="150" />
    <el-table-column prop="name" label="任务名称" width="180" />
    <el-table-column prop="No" label="任务编号" width="120" />
    <el-table-column fixed="right" label="操作栏" min-width="180">
      <template #default>
        <el-button link type="primary" size="small" @click="handleClick">
          详情
        </el-button>
        <el-button link type="primary" size="small"> 编辑 </el-button>
        <el-button link type="primary" size="small"> 回滚 </el-button>
        <el-button link type="primary" size="small"> 导出 </el-button>
        <el-button link type="primary" size="small"> JSON对比 </el-button>
      </template>
    </el-table-column>
  </el-table>
  <el-dialog v-model="dialogVisible" title="创建发布任务">
    <p>请填写任务信息</p>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onConfirm">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const handleClick = () => {
  console.log("click");
};

const onConfirm = () => {
  dialogVisible.value = false;
  router.push({ name: "taskDetail", params: { id: "1" } });
};

const dialogVisible = ref(false);

const tableData = [
  {
    id: 1,
    date: "2024-06-01",
    name: "主任务一",
    No: "T-1001",
    children: [
      {
        id: 11,
        date: "2024-06-01",
        name: "子任务1-1",
        No: "T-1001-1",
      },
      {
        id: 12,
        date: "2024-06-01",
        name: "子任务1-2",
        No: "T-1001-2",
      },
    ],
  },
  {
    id: 2,
    date: "2024-06-02",
    name: "主任务二",
    No: "T-1002",
    children: [
      {
        id: 21,
        date: "2024-06-02",
        name: "子任务2-1",
        No: "T-1002-1",
      },
      {
        id: 22,
        date: "2024-06-02",
        name: "子任务2-2",
        No: "T-1002-2",
      },
      {
        id: 23,
        date: "2024-06-02",
        name: "子任务2-3",
        No: "T-1002-3",
      },
    ],
  },
  {
    id: 3,
    date: "2024-06-03",
    name: "主任务三",
    No: "T-1003",
    children: [
      {
        id: 31,
        date: "2024-06-03",
        name: "子任务3-1",
        No: "T-1003-1",
      },
    ],
  },
];
</script>
