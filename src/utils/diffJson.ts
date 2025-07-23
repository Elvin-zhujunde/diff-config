/**
 * 通用树形对象数组差异比较工具
 * 支持多层嵌套结构的对象数组对比，能够检测添加、删除、修改、移动等变更类型
 * 可配置主键字段、子节点字段及忽略比较的字段
 * @module diffTree
 */

export interface DiffOptions {
  key?: string; // 主键字段名，默认 'id'
  childrenKey?: string; // 子节点字段名，默认 'children'
  ignoreKeys?: string[]; // 忽略对比的字段
}

/**
 * 差异比较配置选项
 * @interface DiffOptions
 * @property {string} [key='id'] - 主键字段名，用于标识唯一节点
 * @property {string} [childrenKey='children'] - 子节点字段名
 * @property {string[]} [ignoreKeys=[]] - 比较时忽略的字段数组
 */
export interface DiffOptions {
  key?: string; // 主键字段名，默认 'id'
  childrenKey?: string; // 子节点字段名，默认 'children'
  ignoreKeys?: string[]; // 忽略对比的字段
}

/**
 * 差异类型枚举
 * @typedef {'added' | 'deleted' | 'modified' | 'moved' | 'unchanged'}
 */
export type DiffType = 'added' | 'deleted' | 'modified' | 'moved' | 'unchanged';

export interface DiffResult {
  id: string | number;
  type: DiffType;
  changes?: Record<string, { old: any; new: any }>;
  oldIndex?: number;
  newIndex?: number;
  children?: DiffResult[];
  oldValue?: any;
  newValue?: any;
}

/**
 * 判断值是否为对象类型
 * @param {any} obj - 要检查的值
 * @returns {boolean} 如果是对象且不是数组则返回true
 */
function isObject(obj: any) {
  return obj && typeof obj === 'object' && !Array.isArray(obj);
}

/**
 * 深度比较两个值是否相等
 * @param {any} a - 比较值a
 * @param {any} b - 比较值b
 * @param {string[]} [ignoreKeys=[]] - 忽略比较的字段
 * @returns {boolean} 是否相等
 */
function deepEqual(a: any, b: any, ignoreKeys: string[] = []) {
  if (a === b) return true;
  if (isObject(a) && isObject(b)) {
    const aKeys = Object.keys(a).filter(k => !ignoreKeys.includes(k));
    const bKeys = Object.keys(b).filter(k => !ignoreKeys.includes(k));
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(k => deepEqual(a[k], b[k], ignoreKeys));
  }
  return false;
}

/**
 * 比较两个对象的属性差异
 * @param {any} oldObj - 旧对象
 * @param {any} newObj - 新对象
 * @param {string[]} [ignoreKeys=[]] - 忽略比较的字段
 * @returns {Record<string, { old: any; new: any }>} 属性变更详情
 */
function diffObject(oldObj: any, newObj: any, ignoreKeys: string[] = []) {
  const changes: Record<string, { old: any; new: any }> = {};
  const keys = new Set([
    ...Object.keys(oldObj || {}).filter(k => !ignoreKeys.includes(k)),
    ...Object.keys(newObj || {}).filter(k => !ignoreKeys.includes(k)),
  ]);
  keys.forEach(key => {
    if (ignoreKeys.includes(key)) return;
    if (!deepEqual(oldObj?.[key], newObj?.[key], ignoreKeys)) {
      changes[key] = { old: oldObj?.[key], new: newObj?.[key] };
    }
  });
  return changes;
}

/**
 * 比较两个树形结构数组的差异
 * @param {any[]} oldArr - 旧数组
 * @param {any[]} newArr - 新数组
 * @param {DiffOptions} [options={}] - 比较配置选项
 * @returns {DiffResult[]} 差异结果数组
 */
export function diffTree(
  oldArr: any[],
  newArr: any[],
  options: DiffOptions = {}
): DiffResult[] {
  const key = options.key || 'id';
  const childrenKey = options.childrenKey || 'children';
  const ignoreKeys = options.ignoreKeys || [];

  // 构建 id 到对象的映射
  const oldMap = new Map<any, any>();
  const newMap = new Map<any, any>();
  oldArr?.forEach((item, idx) => oldMap.set(item[key], { ...item, _idx: idx }));
  newArr?.forEach((item, idx) => newMap.set(item[key], { ...item, _idx: idx }));

  const allIds = new Set([
    ...oldArr.map(item => item[key]),
    ...newArr.map(item => item[key]),
  ]);

  const result: DiffResult[] = [];

  allIds.forEach(id => {
    const oldItem = oldMap.get(id);
    const newItem = newMap.get(id);
    if (oldItem && !newItem) {
      // 删除
      result.push({
        id,
        type: 'deleted',
        oldValue: oldItem,
      });
    } else if (!oldItem && newItem) {
      // 新增
      result.push({
        id,
        type: 'added',
        newValue: newItem,
      });
    } else if (oldItem && newItem) {
      // 可能有修改或移动
      const changes = diffObject(oldItem, newItem, [key, childrenKey, '_idx', ...ignoreKeys]);
      const oldIndex = oldItem._idx;
      const newIndex = newItem._idx;
      let type: DiffType = 'unchanged';
      if (Object.keys(changes).length > 0) {
        type = 'modified';
      }
      if (oldIndex !== newIndex) {
        type = type === 'modified' ? 'modified' : 'moved';
      }
      // 递归 children
      let children: DiffResult[] | undefined;
      if (oldItem[childrenKey] || newItem[childrenKey]) {
        children = diffTree(
          oldItem[childrenKey] || [],
          newItem[childrenKey] || [],
          options
        );
      }
      result.push({
        id,
        type,
        changes: Object.keys(changes).length > 0 ? changes : undefined,
        oldIndex: oldIndex !== newIndex ? oldIndex : undefined,
        newIndex: oldIndex !== newIndex ? newIndex : undefined,
        children: children && children.length > 0 ? children : undefined,
      });
    }
  });

  // 保持新数组顺序
  result.sort((a, b) => {
    const aIdx = newMap.get(a.id)?._idx ?? 99999;
    const bIdx = newMap.get(b.id)?._idx ?? 99999;
    return aIdx - bIdx;
  });

  return result;
}