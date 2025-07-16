// 通用diff相关工具方法
export function deepClone(obj: any): any {
  return JSON.parse(JSON.stringify(obj));
}

export function isObject(val: any) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

export function parseRowId(rowId: string): (string|number)[] {
  return rowId.split('-').map(k => isNaN(Number(k)) ? k : Number(k));
}

export function setJsonByPath(obj: any, path: (string|number)[], value: any) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  cur[path[path.length - 1]] = value;
}

export function deleteJsonByPath(obj: any, path: (string|number)[]) {
  let cur = obj;
  for (let i = 0; i < path.length - 1; i++) {
    cur = cur[path[i]];
  }
  if (Array.isArray(cur)) {
    cur.splice(Number(path[path.length - 1]), 1);
  } else {
    delete cur[path[path.length - 1]];
  }
}

// Diff类型定义
type DiffType = 'added' | 'deleted' | 'modified' | 'unchanged';
export interface DiffNode {
  key: string;
  leftValue: any;
  rightValue: any;
  type: DiffType;
  children?: DiffNode[];
}

/**
 * 通用递归对比两个JSON（对象或数组），输出树形差异结构
 */
export function diffJson(left: any, right: any, key = ''): DiffNode[] {
  const result: DiffNode[] = [];
  if (Array.isArray(left) || Array.isArray(right)) {
    const lArr = Array.isArray(left) ? left : [];
    const rArr = Array.isArray(right) ? right : [];
    const maxLen = Math.max(lArr.length, rArr.length);
    for (let i = 0; i < maxLen; i++) {
      const lVal = lArr[i];
      const rVal = rArr[i];
      let type: DiffType;
      if (lVal === undefined) {
        type = 'added';
      } else if (rVal === undefined) {
        type = 'deleted';
      } else if (isObject(lVal) && isObject(rVal) || Array.isArray(lVal) && Array.isArray(rVal)) {
        const children = diffJson(lVal, rVal, String(i));
        type = children.some(child => child.type !== 'unchanged') ? 'modified' : 'unchanged';
        result.push({ key: String(i), leftValue: lVal, rightValue: rVal, type, children });
        continue;
      } else if (lVal !== rVal) {
        type = 'modified';
      } else {
        type = 'unchanged';
      }
      result.push({ key: String(i), leftValue: lVal, rightValue: rVal, type });
    }
    return result;
  }
  // 对象对比
  const allKeys = new Set([
    ...Object.keys(left || {}),
    ...Object.keys(right || {})
  ]);
  for (const k of allKeys) {
    const lVal = left ? left[k] : undefined;
    const rVal = right ? right[k] : undefined;
    let type: DiffType;
    if (lVal === undefined) {
      type = 'added';
    } else if (rVal === undefined) {
      type = 'deleted';
    } else if (isObject(lVal) && isObject(rVal) || Array.isArray(lVal) && Array.isArray(rVal)) {
      const children = diffJson(lVal, rVal, k);
      type = children.some(child => child.type !== 'unchanged') ? 'modified' : 'unchanged';
      result.push({ key: k, leftValue: lVal, rightValue: rVal, type, children });
      continue;
    } else if (lVal !== rVal) {
      type = 'modified';
    } else {
      type = 'unchanged';
    }
    result.push({ key: k, leftValue: lVal, rightValue: rVal, type });
  }
  return result;
} 