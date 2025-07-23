<template>
  <div class="task-detail">
    <!-- 操作栏 -->
    <div class="action-bar">
      <el-button type="primary" @click="handleAcceptAll">全部接受</el-button>
      <el-button type="warning" @click="handleIgnoreAll">全部忽略</el-button>
      <el-button type="danger" @click="handleUndo">撤回操作</el-button>
    </div>

    <!-- 表头统计 -->
    <div class="status-bar">
      <span>未操作: {{ statusCount.unhandled }}</span>
      <span>已接受: {{ statusCount.accepted }}</span>
      <span>已忽略: {{ statusCount.ignored }}</span>
      <el-button type="success" @click="handleExport">导出数据</el-button>
    </div>

    <!-- vxe-table 差异展示 -->
    <vxe-table
      ref="xTable"
      :data="diffData"
      :tree-config="{ children: 'children', expandAll: true }"
      border
      stripe
    >
      <vxe-column field="id" title="序号" width="60" :formatter="formatId"></vxe-column>
      <vxe-column field="label" title="名称" :formatter="formatLabel"></vxe-column>
      <vxe-column
        field="type"
        title="变更类型"
        :formatter="formatType"
      ></vxe-column>
      <vxe-column
        field="changes"
        title="变更内容"
        :formatter="formatChanges"
      ></vxe-column>
      <vxe-column
        title="操作"
        width="200"
        :formatter="renderAction"
      ></vxe-column>
    </vxe-table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from "vue";
import { DiffResult, ChangeDetail } from "@/utils/diffJson";
import diffResultData from "@/json/res.json";
import { ElButton } from "element-plus";
import XEUtils from "xe-utils";
import { VxeTable, VxeColumn } from "vxe-table";
import "vxe-table/lib/style.css";

// 已从@/utils/diffJson导入ChangeDetail接口

// 差异数据和操作状态
const diffData = ref<DiffResult[]>([]);
const actionStatus = ref<Map<string, "accepted" | "ignored">>(new Map());
const history = ref<
  Array<{ id: string; action: "accepted" | "ignored" | null }>
>([]);

// 状态计数
const statusCount = computed(() => {
  const count = {
    unhandled: 0,
    accepted: 0,
    ignored: 0,
  };
  // 递归统计状态
  const countStatus = (list: DiffResult[]) => {
    list.forEach((item) => {
      const status = actionStatus.value.get(item.id.toString()) || null;
      if (status === "accepted") {
        count.accepted++;
      } else if (status === "ignored") {
        count.ignored++;
      } else {
        count.unhandled++;
      }
      if (item.children && item.children.length) {
        countStatus(item.children);
      }
    });
  };
  countStatus(diffData.value);
  return count;
});

// 初始化差异数据
onMounted(() => {
  diffData.value = diffResultData;
});

// 格式化变更类型
const formatType = (row: any) => {
  const typeMap: Record<string, string> = {
    added: "新增",
    deleted: "删除",
    modified: "修改",
    moved: "移动",
    unchanged: "未变更",
  };
  return typeMap[row.type] || row.type;
};

// 格式化名称
const formatLabel = (row: any) => {
  return row.label || `节点 ${row.id}`;
};

// 格式化ID显示
const formatId = (row: any) => {
  return row.id;
};

// 格式化变更内容
const formatChanges = (row: DiffResult) => {
  if (!row.changes) {
    // 对于移动的节点，显示移动信息
    if (row.type === 'moved' && row.oldIndex !== undefined && row.newIndex !== undefined) {
      return `从位置 ${row.oldIndex} 移动到 ${row.newIndex}`;
    }
    return "";
  }
  return Object.entries(row.changes as Record<string, ChangeDetail>)
    .map(([key, { old: oldVal, new: newVal }]) => {
      return `${key}: ${oldVal} → ${newVal}`;
    })
    .join("<br>");
};

// 渲染操作按钮
const renderAction = (row: DiffResult | undefined) => {
  if (!row) return null;
  const id = row.id;
  if (id == null) return null; // Check for both null and undefined
  const status = actionStatus.value.get(id.toString());
  return h('div', { class: 'action-buttons' }, [
    h(ElButton, {
      size: 'small',
      type: 'primary',
      disabled: status === 'accepted',
      onClick: () => handleAccept(id)
    }, '接受'),
    h(ElButton, {
      size: 'small',
      type: 'warning',
      disabled: status === 'ignored',
      onClick: () => handleIgnore(id)
    }, '忽略')
  ]);
};

// 接受变更
const handleAccept = (id: string | number) => {
  const key = id.toString();
  const prevStatus = actionStatus.value.get(key);
  history.value.push({
    id: key,
    action: prevStatus || null,
  });
  actionStatus.value.set(key, "accepted");
};

// 忽略变更
const handleIgnore = (id: string | number) => {
  const key = id.toString();
  const prevStatus = actionStatus.value.get(key);
  history.value.push({
    id: key,
    action: prevStatus || null,
  });
  actionStatus.value.set(key, "ignored");
};

// 全部接受
const handleAcceptAll = () => {
  const acceptAll = (list: any[]) => {
    list.forEach((item) => {
      if (item.id != null) {
        handleAccept(item.id);
      }
      if (item.children && item.children.length) {
        acceptAll(item.children);
      }
    });
  };
  acceptAll(diffData.value);
};

// 全部忽略
const handleIgnoreAll = () => {
  const ignoreAll = (list: any[]) => {
    list.forEach((item) => {
      if (item.id != null) {
        handleIgnore(item.id);
      }
      if (item.children && item.children.length) {
        ignoreAll(item.children);
      }
    });
  };
  ignoreAll(diffData.value);
};

// 撤回操作
const handleUndo = () => {
  if (history.value.length === 0) return;
  const lastAction = history.value.pop();
  if (lastAction) {
    const { id, action } = lastAction;
    if (action === null) {
      actionStatus.value.delete(id);
    } else {
      actionStatus.value.set(id, action);
    }
  }
};

// 导出数据
const handleExport = () => {
  // 递归应用变更
  const applyChanges = (
    changes: any[],
    actionMap: Map<string, string>
  ) => {
    return changes
      .map((item) => {
        const newItem = { ...item };
        const action = actionMap.get(item.id.toString());
        
        // 如果是修改且被接受，则应用变更
        if (
          item.type === "modified" &&
          action === "accepted" &&
          item.changes
        ) {
          Object.entries(
            item.changes as Record<string, ChangeDetail>
          ).forEach(([key, { new: newValue }]) => {
            newItem[key] = newValue;
          });
        }
        
        // 如果是删除且被接受，则标记为删除
        if (item.type === "deleted" && action === "accepted") {
          newItem._deleted = true;
        }
        
        // 处理子节点
        if (item.children) {
          newItem.children = applyChanges(item.children, actionMap);
        }
        
        return newItem;
      })
      .filter(item => !item._deleted);
  };

  // 应用变更到差异数据
  const resultData = applyChanges(diffResultData, actionStatus.value);
  // 导出为JSON文件
  const dataStr = JSON.stringify(resultData, null, 2);
  const dataUri =
    "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
  const exportFileDefaultName = "diff-result.json";
  const linkElement = document.createElement("a");
  linkElement.setAttribute("href", dataUri);
  linkElement.setAttribute("download", exportFileDefaultName);
  linkElement.click();
};
</script>

<style scoped>
.task-detail {
  padding: 20px;
}
.action-bar {
  margin-bottom: 10px;
  display: flex;
  gap: 10px;
}
.status-bar {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
}
.status-bar span {
  margin-right: 20px;
}
.action-buttons {
  display: flex;
  gap: 5px;
}
</style>
