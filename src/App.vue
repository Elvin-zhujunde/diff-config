<script setup lang="ts">
import { ref } from "vue";
import JsonDiffDemo from "./components/JsonDiffDemo.vue";
import menuJson from "./json/menu.json";
import menuDiffJson from "./json/menuDiff.json";

const dialogVisible = ref(false);
function openDialog() {
  dialogVisible.value = true;
}
function closeDialog() {
  dialogVisible.value = false;
}
</script>

<template>
  <router-view />
</template>

<style scoped lang="less"></style>
