// 测试 diffTree 工具
const fs = require('fs');
const path = require('path');
const { diffTree } = require('./diffJson');

const oldData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/menu.json'), 'utf-8'));
const newData = JSON.parse(fs.readFileSync(path.join(__dirname, '../json/menuDiff.json'), 'utf-8'));

const diff = diffTree(oldData, newData, {
  key: 'id',
  childrenKey: 'children',
  ignoreKeys: [],
});

console.dir(diff, { depth: null, colors: true }); 