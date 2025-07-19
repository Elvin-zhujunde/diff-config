const diff = require('diff-json');

const menu = require('../src/json/menu.json');
const menuDiff = require('../src/json/menuDiff.json');



console.log(diff(menu, menuDiff)); // { added: [ { name: 'Burger', price: 5.99 } ], removed: [ { name: 'Pizza', price: 8.99 } ] }