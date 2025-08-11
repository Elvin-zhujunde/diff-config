<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务管理</span>
          <el-button
            type="primary"
            size="small"
            @click="handleAdd"
            icon="Plus"
            class="add-button"
          >
            新增任务
          </el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="输入任务名称搜索"
          prefix-icon="Search"
          size="small"
        />
      </div>

      <!-- 任务表格 -->
      <el-table
        v-loading="loading"
        :data="filteredTasks"
        style="width: 100%"
        border
        size="small"
      >
        <el-table-column prop="name" label="对比任务名称" />
        <el-table-column prop="type" label="任务类型" width="120">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.type === 'json'
                  ? 'primary'
                  : scope.row.type === 'config'
                  ? 'success'
                  : scope.row.type === 'code'
                  ? 'warning'
                  : 'info'
              "
              size="small"
            >
              {{
                scope.row.type === "json"
                  ? "JSON对比"
                  : scope.row.type === "config"
                  ? "配置对比"
                  : scope.row.type === "code"
                  ? "代码对比"
                  : "其他"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag
              :type="
                scope.row.status === 'pending'
                  ? 'warning'
                  : scope.row.status === 'running'
                  ? 'primary'
                  : scope.row.status === 'success'
                  ? 'success'
                  : 'danger'
              "
              size="small"
            >
              {{
                scope.row.status === "pending"
                  ? "待执行"
                  : scope.row.status === "running"
                  ? "执行中"
                  : scope.row.status === "success"
                  ? "成功"
                  : "失败"
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="iteration" label="迭代" width="100" />
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="operateTime" label="操作时间" width="180" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              size="small"
              @click="handleView(scope.row)"
              icon="Eye"
              :disabled="scope.row.status === 'running'"
            >
              查看
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleEdit(scope.row)"
              icon="Edit"
              :disabled="scope.row.status === 'running'"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              size="small"
              @click="handleDelete(scope.row)"
              icon="Delete"
              :disabled="scope.row.status === 'running'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="tasks.length"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑任务对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogType === 'add' ? '新增任务' : '编辑任务'"
      width="500px"
    >
      <el-form
        ref="taskFormRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入任务名称" />
        </el-form-item>
        <el-form-item label="任务类型" prop="type">
          <el-select v-model="formData.type" placeholder="请选择任务类型">
            <el-option label="JSON对比" value="json" />
            <el-option label="配置对比" value="config" />
            <el-option label="代码对比" value="code" />
          </el-select>
        </el-form-item>
        <el-form-item label="迭代" prop="iteration">
          <el-input v-model="formData.iteration" placeholder="请输入迭代号" />
        </el-form-item>
        <el-form-item label="版本号" prop="version">
          <el-input v-model="formData.version" placeholder="请输入版本号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 查看任务对话框 -->
    <el-dialog v-model="viewDialogVisible" title="任务详情" width="600px">
      <el-descriptions title="任务信息" :column="1">
        <el-descriptions-item label="任务名称">{{
          viewData.name
        }}</el-descriptions-item>
        <el-descriptions-item label="任务类型">{{
          viewData.type === "json"
            ? "JSON对比"
            : viewData.type === "config"
            ? "配置对比"
            : viewData.type === "code"
            ? "代码对比"
            : "其他"
        }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{
          viewData.status === "pending"
            ? "待执行"
            : viewData.status === "running"
            ? "执行中"
            : viewData.status === "success"
            ? "成功"
            : "失败"
        }}</el-descriptions-item>
        <el-descriptions-item label="迭代">{{
          viewData.iteration
        }}</el-descriptions-item>
        <el-descriptions-item label="版本号">{{
          viewData.version
        }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{
          viewData.operateTime
        }}</el-descriptions-item>
        <el-descriptions-item label="任务描述">{{
          viewData.description || "无"
        }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
// 保留原有的导入，但暂时不需要使用
import { convertToVxeTableData, diffTree } from "../utils/diffJson";
import menu from "../json/menu.json";
import menuDiff from "../json/menuDiff.json";

// 模拟接口请求函数
const mockApi = {
  getTaskList: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData = [
          {
            id: 1,
            name: "JSON配置对比任务1",
            type: "json",
            status: "success",
            iteration: "V1.0",
            version: "1.0.0",
            operateTime: "2023-10-15 14:30:25",
            description: "对比两个JSON配置文件的差异",
          },
          {
            id: 2,
            name: "系统配置更新任务",
            type: "config",
            status: "pending",
            iteration: "V1.1",
            version: "1.1.0",
            operateTime: "2023-10-16 09:15:42",
            description: "更新系统核心配置",
          },
          {
            id: 3,
            name: "代码差异分析任务",
            type: "code",
            status: "running",
            iteration: "V2.0",
            version: "2.0.0",
            operateTime: "2023-10-17 11:20:33",
            description: "分析两段代码的差异",
          },
          {
            id: 4,
            name: "接口配置对比",
            type: "json",
            status: "failure",
            iteration: "V1.0",
            version: "1.0.1",
            operateTime: "2023-10-18 16:45:12",
            description: "对比接口配置变更",
          },
          {
            id: 5,
            name: "数据库配置更新",
            type: "config",
            status: "success",
            iteration: "V1.2",
            version: "1.2.0",
            operateTime: "2023-10-19 13:10:55",
            description: "更新数据库连接配置",
          },
        ];
        resolve(mockData);
      }, 1000);
    });
  },
};

// 定义任务类型接口
interface Task {
  id: number;
  name: string;
  type: string;
  status: string;
  iteration: string;
  version: string;
  operateTime: string;
  description: string;
}

// 表格数据
const tasks = ref<Task[]>([]);
// 筛选条件
const filterType = ref("");
const filterStatus = ref("");

// 初始化加载数据
const loadTaskList = async () => {
  loading.value = true;
  try {
    const data = await mockApi.getTaskList();
    tasks.value = data;
  } finally {
    loading.value = false;
  }
};

// 页面加载时执行
onMounted(() => {
  loadTaskList();
});

// 搜索和分页
const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(10);
const loading = ref(false);

// 筛选处理函数
const handleFilterChange = async () => {
  currentPage.value = 1;
  await loadTaskList();
};

// 刷新列表
const handleRefresh = async () => {
  currentPage.value = 1;
  await loadTaskList();
  ElMessage.success("列表已刷新");
};

// 对话框相关
const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const dialogType = ref("add");
const formData = reactive({
  id: 0,
  name: "",
  type: "json",
  iteration: "",
  version: "",
});
const viewData = reactive<Task>({} as Task);
const taskFormRef = ref(null);

// 表单验证规则
const rules = {
  name: [
    { required: true, message: "请输入任务名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择任务类型", trigger: "change" }],
  iteration: [{ required: true, message: "请输入迭代号", trigger: "blur" }],
  version: [
    { required: true, message: "请输入版本号", trigger: "blur" },
    {
      pattern: /^\d+\.\d+\.\d+$/,
      message: "版本号格式应为 x.x.x",
      trigger: "blur",
    },
  ],
};

// 计算过滤后的任务列表
const filteredTasks = computed(() => {
  let filtered = tasks.value;
  // 类型筛选
  if (filterType.value) {
    filtered = filtered.filter((task) => task.type === filterType.value);
  }
  // 状态筛选
  if (filterStatus.value) {
    filtered = filtered.filter((task) => task.status === filterStatus.value);
  }
  // 名称搜索
  if (searchQuery.value) {
    filtered = filtered.filter((task) =>
      task.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }
  // 分页处理
  return filtered.slice(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
});

// 分页处理
const handleSizeChange = (size) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (current) => {
  currentPage.value = current;
};

// 新增任务
const handleAdd = () => {
  dialogType.value = "add";
  Object.keys(formData).forEach((key) => {
    formData[key] = "";
  });
  formData.type = "json";
  dialogVisible.value = true;
};

// 编辑任务
const handleEdit = (row) => {
  dialogType.value = "edit";
  Object.assign(formData, row);
  dialogVisible.value = true;
};

// 查看任务
const handleView = (row) => {
  Object.assign(viewData, row);
  viewDialogVisible.value = true;
};

// 删除任务
const handleDelete = (row) => {
  ElMessageBox.confirm("确定要删除这个任务吗？", "确认删除", {
    type: "warning",
  })
    .then(() => {
      const index = tasks.value.findIndex((task) => task.id === row.id);
      if (index !== -1) {
        tasks.value.splice(index, 1);
        ElMessage.success("删除成功");
      }
    })
    .catch(() => {
      // 取消删除
    });
};

// 提交表单
const handleSubmit = () => {
  taskFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true;

      // 模拟API请求延迟
      setTimeout(() => {
        if (dialogType.value === "add") {
          // 新增任务
          const newTask = {
            ...formData,
            id: Date.now(),
            status: "pending",
            operateTime: new Date().toLocaleString(),
            description: "新增任务",
          };
          tasks.value.unshift(newTask);
          ElMessage.success("新增成功");
        } else {
          // 编辑任务
          const index = tasks.value.findIndex(
            (task) => task.id === formData.id
          );
          if (index !== -1) {
            tasks.value[index] = {
              ...tasks.value[index],
              ...formData,
              operateTime: new Date().toLocaleString(),
            };
            ElMessage.success("编辑成功");
          }
        }

        dialogVisible.value = false;
        loading.value = false;
      }, 500);
    }
  });
};

// 页面加载时执行
onMounted(() => {
  // 这里可以添加初始化逻辑，比如从API获取数据
  console.log("任务管理页面加载完成");
});
</script>

<style scoped>
.task-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.add-button {
  margin-top: 5px;
}

.search-container {
  margin-bottom: 16px;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
