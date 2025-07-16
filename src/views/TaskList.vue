<template>
  <div class="mb-4">
    <el-button type="primary" @click="dialogVisible = true"
      >创建发布任务</el-button
    >
    <el-button type="primary">导出JSON数据</el-button>
  </div>
  <el-table :data="tableData" style="width: 100%">
    <!-- <el-table-column type="selection" :selectable="selectable" width="55" /> -->

    <el-table-column fixed prop="date" label="日期" width="150" />
    <el-table-column prop="name" label="版本名称" width="120" />
    <el-table-column prop="No" label="版本号" width="120" />
    <el-table-column fixed="right" label="操作栏" min-width="120">
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
    date: "2016-05-03",
    name: "已发布任务一",
    city: "Los Angeles",
    No: "CA 90036",
    tag: "Home",
  },
  {
    date: "2016-05-02",
    name: "已发布任务二",
    No: "CA 90036",
    tag: "Office",
  },
  {
    date: "2016-05-04",
    name: "已发布任务三",

    No: "CA 90036",
    tag: "Home",
  },
  {
    date: "2016-05-01",
    name: "已发布任务四",

    No: "CA 90036",
    tag: "Office",
  },
];
</script>
