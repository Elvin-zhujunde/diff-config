/**
 * Vue 组合式 API 树形JSON数据对比工具
 * 支持检测增、删、改操作
 * 可配置唯一标识字段、子节点字段及忽略比较的字段
 */

import { ref, computed } from "vue";

/**
 * 差异类型枚举
 */
export type DiffType = "added" | "deleted" | "modified" | "unchanged";

/**
 * 差异比较配置选项
 */
export interface DiffOptions {
  key?: string; // 主键字段名，默认 'id'
  childrenKey?: string; // 子节点字段名，默认 'children'
  ignoreKeys?: string[]; // 忽略对比的字段
}

/**
 * 单个字段的变更信息
 */
export interface ChangeInfo {
  oldValue: any;
  newValue: any;
}

/**
 * 节点差异信息
 */
export interface NodeDiff {
  id: string | number;
  type: DiffType;
  changes?: Record<string, ChangeInfo>;
  children?: NodeDiff[];
}

/**
 * 比较两个值是否相等
 * @param a 第一个值
 * @param b 第二个值
 * @returns 是否相等
 */
function valuesEqual(a: any, b: any): boolean {
  // 如果两个值严格相等，直接返回true
  if (a === b) return true;

  // 如果其中一个是null或undefined，另一个不是，则不相等
  if (a == null || b == null) return false;

  // 如果两者类型不同，则不相等
  if (typeof a !== typeof b) return false;

  // 如果都是对象，递归比较
  if (typeof a === "object" && typeof b === "object") {
    // 处理数组
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((val, index) => valuesEqual(val, b[index]));
    }

    // 处理普通对象
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(
      (key) => keysB.includes(key) && valuesEqual(a[key], b[key])
    );
  }

  // 其他类型，使用严格相等
  return a === b;
}

/**
 * 比较两个对象，返回变更信息
 * @param oldObj 旧对象
 * @param newObj 新对象
 * @param options 配置选项
 * @returns 变更信息对象
 */
function compareObjects(
  oldObj: Record<string, any>,
  newObj: Record<string, any>,
  options: Required<DiffOptions>
): Record<string, ChangeInfo> {
  const { ignoreKeys, key, childrenKey } = options;
  const changes: Record<string, ChangeInfo> = {};

  // 合并两个对象的所有键
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  // 检查每个键的变化
  allKeys.forEach((k) => {
    // 忽略指定的键、主键和子节点键
    if (ignoreKeys.includes(k) || k === key || k === childrenKey) return;

    const oldValue = oldObj[k];
    const newValue = newObj[k];

    // 如果值不相等，记录变更
    if (!valuesEqual(oldValue, newValue)) {
      changes[k] = { oldValue, newValue };
    }
  });

  return changes;
}

/**
 * 树形JSON数据对比
 * @param oldTree 旧树形数据
 * @param newTree 新树形数据
 * @param options 配置选项
 * @returns 差异信息数组
 */
function diffTree(
  oldTree: any[],
  newTree: any[],
  options: DiffOptions = {}
): NodeDiff[] {
  // 设置默认配置
  const defaultOptions: Required<DiffOptions> = {
    key: "id",
    childrenKey: "children",
    ignoreKeys: [],
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const { key, childrenKey } = mergedOptions;

  // 将数组转换为以id为键的对象，便于查找
  const oldMap = new Map<string | number, any>();
  const newMap = new Map<string | number, any>();

  // 递归构建映射
  function buildMap(tree: any[], map: Map<string | number, any>) {
    tree.forEach((item) => {
      const itemId = item[key];
      map.set(itemId, item);

      // 如果有子节点，递归处理
      if (item[childrenKey] && Array.isArray(item[childrenKey])) {
        buildMap(item[childrenKey], map);
      }
    });
  }

  buildMap(oldTree, oldMap);
  buildMap(newTree, newMap);

  const result: NodeDiff[] = [];

  // 检查删除的节点
  oldMap.forEach((oldItem, itemId) => {
    if (!newMap.has(itemId)) {
      result.push({
        id: itemId,
        type: "deleted",
        children: [],
      });
    }
  });

  // 检查新增和修改的节点
  newMap.forEach((newItem, itemId) => {
    const oldItem = oldMap.get(itemId);

    // 新增节点
    if (!oldItem) {
      result.push({
        id: itemId,
        type: "added",
        children: [],
      });
    } else {
      // 检查节点是否修改
      const changes = compareObjects(oldItem, newItem, mergedOptions);

      // 检查子节点变化
      const oldChildren = oldItem[childrenKey] || [];
      const newChildren = newItem[childrenKey] || [];
      const childrenDiffs = diffTree(oldChildren, newChildren, mergedOptions);

      // 如果节点本身有变化或子节点有变化，则记录
      if (Object.keys(changes).length > 0 || childrenDiffs.length > 0) {
        result.push({
          id: itemId,
          type: Object.keys(changes).length > 0 ? "modified" : "unchanged",
          changes: Object.keys(changes).length > 0 ? changes : undefined,
          children: childrenDiffs.length > 0 ? childrenDiffs : undefined,
        });
      }
    }
  });

  // 按照id排序结果，保持一致性
  return result.sort((a, b) => {
    if (typeof a.id === "number" && typeof b.id === "number") {
      return a.id - b.id;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * 树形JSON数据对比
 * @param oldTree 旧树形数据
 * @param newTree 新树形数据
 * @param options 配置选项
 * @returns 差异信息数组
 */
function diffTree1(
  oldTree: any[],
  newTree: any[],
  options: DiffOptions = {}
): NodeDiff[] {
  // 设置默认配置
  const defaultOptions: Required<DiffOptions> = {
    key: "id",
    childrenKey: "children",
    ignoreKeys: [],
  };

  const mergedOptions = { ...defaultOptions, ...options };
  const { key, childrenKey } = mergedOptions;

  // 将数组转换为以id为键的对象，便于查找
  const oldMap = new Map<string | number, any>();
  const newMap = new Map<string | number, any>();

  // 递归构建映射
  function buildMap(tree: any[], map: Map<string | number, any>) {
    tree.forEach((item) => {
      const itemId = item[key];
      map.set(itemId, item);

      // 如果有子节点，递归处理
      if (item[childrenKey] && Array.isArray(item[childrenKey])) {
        buildMap(item[childrenKey], map);
      }
    });
  }

  buildMap(oldTree, oldMap);
  buildMap(newTree, newMap);

  const result: NodeDiff[] = [];

  // 检查删除的节点
  oldMap.forEach((oldItem, itemId) => {
    if (!newMap.has(itemId)) {
      result.push({
        id: itemId,
        type: "deleted",
        children: [],
      });
    }
  });

  // 检查新增和修改的节点
  newMap.forEach((newItem, itemId) => {
    const oldItem = oldMap.get(itemId);

    // 新增节点
    if (!oldItem) {
      result.push({
        id: itemId,
        type: "added",
        children: [],
      });
    } else {
      // 检查节点是否修改
      const changes = compareObjects(oldItem, newItem, mergedOptions);

      // 检查子节点变化
      const oldChildren = oldItem[childrenKey] || [];
      const newChildren = newItem[childrenKey] || [];
      const childrenDiffs = diffTree(oldChildren, newChildren, mergedOptions);

      // 如果节点本身有变化或子节点有变化，则记录
      if (Object.keys(changes).length > 0 || childrenDiffs.length > 0) {
        result.push({
          id: itemId,
          type: Object.keys(changes).length > 0 ? "modified" : "unchanged",
          changes: Object.keys(changes).length > 0 ? changes : undefined,
          children: childrenDiffs.length > 0 ? childrenDiffs : undefined,
        });
      }
    }
  });

  // 按照id排序结果，保持一致性
  return result.sort((a, b) => {
    if (typeof a.id === "number" && typeof b.id === "number") {
      return a.id - b.id;
    }
    return String(a.id).localeCompare(String(b.id));
  });
}

/**
 * 将差异结果转换为vxe-table所需的树形结构
 * @param diffs 差异信息数组
 * @param options 配置选项
 * @returns vxe-table树形数据
 */
function convertToVxeTableData(
  diffs: NodeDiff[],
  options: DiffOptions = {}
): any[] {
  const { key = "id", childrenKey = "children" } = options;

  // 递归转换
  function convert(diffNodes: NodeDiff[]): any[] {
    return diffNodes.map((diff) => {
      const node: any = {
        [key]: diff.id,
        type: diff.type,
        changes: diff.changes,
      };

      // 如果有子节点，递归处理
      if (diff.children && diff.children.length > 0) {
        node[childrenKey] = convert(diff.children);
      }

      return node;
    });
  }

  return convert(diffs);
}

/**
 * Vue 组合式 API 钩子函数，用于比较树形JSON数据
 * @param oldTree 旧树形数据
 * @param newTree 新树形数据
 * @param options 配置选项
 * @returns 包含差异结果和vxe-table数据的对象
 */
export function useJsonDiff(
  oldTree: any[],
  newTree: any[],
  options: DiffOptions = {}
) {
  // 存储差异结果
  const diffResult = ref<NodeDiff[]>([]);

  // 计算vxe-table数据
  const vxeTableData = computed(() => {
    return convertToVxeTableData(diffResult.value, options);
  });

  // 执行对比
  const compare = () => {
    diffResult.value = diffTree(oldTree, newTree, options);
    return diffResult.value;
  };

  // 初始化对比
  compare();

  // 返回结果
  return {
    diffResult,
    vxeTableData,
    compare,
  };
}
