<template>
  <div>123</div>
</template>

<script setup lang="ts">
import { convertToVxeTableData, diffTree } from "../utils/diffJson";
import menu from "../json/menu.json";
import menuDiff from "../json/menuDiff.json";

console.log(convertToVxeTableData(diffTree(menu, menuDiff)));

console.log(diffTree(menu, menuDiff));
</script>

<style></style>
