// JSON Diff 工具，支持对象、数组、基本类型的增删改对比
// 数组索引变化视为删除+新增
// 每个 diff 结果增加唯一 id 字段，便于前端操作
// children 字段仅在有子差异时生成，适合虚拟滚动大数据量

export type DiffType = 'add' | 'delete' | 'update';

export interface DiffResult {
  id: string; // 唯一标识
  type: DiffType;
  path: string; // 例如 a.b[2].c
  oldValue?: any;
  newValue?: any;
  children?: DiffResult[]; // 仅有子差异时生成
  pathReadable?: string; // 更友好的可读路径
  pathBusiness?: string; // 业务路径
}

let diffIdSeed = 1;

function isObject(val: any) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function buildPath(parent: string, key: string | number) {
  if (typeof key === 'number') {
    return `${parent}[${key}]`;
  } else {
    return parent ? `${parent}.${key}` : key;
  }
}

/**
 * 递归比较两个 JSON 数据，输出详细的差异列表
 * @param oldData 原始数据
 * @param newData 新数据
 * @param parentPath 路径前缀
 * @param parentReadablePath 可读路径前缀
 * @param ignoreFields 需要忽略的字段数组
 * @param businessKey 业务路径属性名
 * @param parentBusinessPath 业务路径前缀
 * @param meta 可扩展参数，如 nextParamsName
 * @returns DiffResult[] 差异列表，带唯一 id
 */
export function diffJson(
  oldData: any,
  newData: any,
  parentPath = '',
  parentReadablePath = '',
  ignoreFields: string[] = [],
  businessKey: string = '',
  parentBusinessPath = '',
  meta: { nextParamsName?: string } = {}
): DiffResult[] {
  const diffs: DiffResult[] = [];
  const nextParamsName = meta.nextParamsName || 'children';

  // 业务路径拼接函数
  function getBusinessPath(parent: string, key: string | number, value: any) {
    if (key === nextParamsName) return parent; // 跳过结构字段
    if (!businessKey) return parent ? `${parent} > ${key}` : String(key);
    let label = '';
    if (typeof value === 'object' && value !== null && businessKey in value) {
      label = value[businessKey];
    } else {
      label = String(key);
    }
    return parent ? `${parent} > ${label}` : label;
  }

  // 类型不同，直接 update
  if (typeof oldData !== typeof newData || Array.isArray(oldData) !== Array.isArray(newData)) {
    diffs.push({
      id: `diff_${diffIdSeed++}`,
      type: 'update',
      path: parentPath,
      oldValue: oldData,
      newValue: newData,
      pathReadable: parentReadablePath || parentPath,
      pathBusiness: parentBusinessPath,
    } as any);
    return diffs;
  }

  // 对象
  if (isObject(oldData) && isObject(newData)) {
    const oldKeys = Object.keys(oldData);
    const newKeys = Object.keys(newData);
    // 删除
    for (const key of oldKeys) {
      if (ignoreFields.includes(key)) continue;
      if (!(key in newData)) {
        diffs.push({
          id: `diff_${diffIdSeed++}`,
          type: 'delete',
          path: buildPath(parentPath, key),
          oldValue: oldData[key],
          pathReadable: parentReadablePath ? `${parentReadablePath} > ${key}` : key,
          pathBusiness: getBusinessPath(parentBusinessPath, key, oldData[key]),
        } as any);
      }
    }
    // 新增和递归
    for (const key of newKeys) {
      if (ignoreFields.includes(key)) continue;
      if (!(key in oldData)) {
        diffs.push({
          id: `diff_${diffIdSeed++}`,
          type: 'add',
          path: buildPath(parentPath, key),
          newValue: newData[key],
          pathReadable: parentReadablePath ? `${parentReadablePath} > ${key}` : key,
          pathBusiness: getBusinessPath(parentBusinessPath, key, newData[key]),
        } as any);
      } else {
        // 递归，若有子差异则作为 children
        // 判断是否是子节点字段
        let children: any[] = [];
        if (key === nextParamsName && Array.isArray(oldData[key]) && Array.isArray(newData[key])) {
          // 直接对比数组
          children = diffJson(
            oldData[key],
            newData[key],
            buildPath(parentPath, key),
            parentReadablePath ? `${parentReadablePath} > ${key}` : key,
            ignoreFields,
            businessKey,
            getBusinessPath(parentBusinessPath, key, newData[key]),
            meta
          );
        } else {
          children = diffJson(
            oldData[key],
            newData[key],
            buildPath(parentPath, key),
            parentReadablePath ? `${parentReadablePath} > ${key}` : key,
            ignoreFields,
            businessKey,
            getBusinessPath(parentBusinessPath, key, newData[key]),
            meta
          );
        }
        if (children.length > 0) {
          const node: DiffResult = {
            id: `diff_${diffIdSeed++}`,
            type: 'update',
            path: buildPath(parentPath, key),
            oldValue: oldData[key],
            newValue: newData[key],
            children,
            pathReadable: parentReadablePath ? `${parentReadablePath} > ${key}` : key,
            pathBusiness: getBusinessPath(parentBusinessPath, key, newData[key]),
          } as any;
          diffs.push(node);
        }
      }
    }
    return diffs;
  }

  // 数组
  if (Array.isArray(oldData) && Array.isArray(newData)) {
    const minLen = Math.min(oldData.length, newData.length);
    // 同索引递归对比
    for (let i = 0; i < minLen; i++) {
      const children = diffJson(
        oldData[i],
        newData[i],
        buildPath(parentPath, i),
        parentReadablePath ? `${parentReadablePath} > [${i}]` : `[${i}]`,
        ignoreFields,
        businessKey,
        getBusinessPath(parentBusinessPath, `[${i}]`, newData[i]),
        meta
      );
      if (children.length > 0) {
        const node: DiffResult = {
          id: `diff_${diffIdSeed++}`,
          type: 'update',
          path: buildPath(parentPath, i),
          oldValue: oldData[i],
          newValue: newData[i],
          children,
          pathReadable: parentReadablePath ? `${parentReadablePath} > [${i}]` : `[${i}]`,
          pathBusiness: getBusinessPath(parentBusinessPath, `[${i}]`, newData[i]),
        } as any;
        diffs.push(node);
      }
    }
    // old 多余部分为删除
    for (let i = newData.length; i < oldData.length; i++) {
      diffs.push({
        id: `diff_${diffIdSeed++}`,
        type: 'delete',
        path: buildPath(parentPath, i),
        oldValue: oldData[i],
        pathReadable: parentReadablePath ? `${parentReadablePath} > [${i}]` : `[${i}]`,
        pathBusiness: getBusinessPath(parentBusinessPath, `[${i}]`, oldData[i]),
      } as any);
    }
    // new 多余部分为新增
    for (let i = oldData.length; i < newData.length; i++) {
      diffs.push({
        id: `diff_${diffIdSeed++}`,
        type: 'add',
        path: buildPath(parentPath, i),
        newValue: newData[i],
        pathReadable: parentReadablePath ? `${parentReadablePath} > [${i}]` : `[${i}]`,
        pathBusiness: getBusinessPath(parentBusinessPath, `[${i}]`, newData[i]),
      } as any);
    }
    return diffs;
  }

  // 基本类型不同，update
  if (oldData !== newData) {
    diffs.push({
      id: `diff_${diffIdSeed++}`,
      type: 'update',
      path: parentPath,
      oldValue: oldData,
      newValue: newData,
      pathReadable: parentReadablePath || parentPath,
      pathBusiness: parentBusinessPath,
    } as any);
  }
  return diffs;
} 
