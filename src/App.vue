<script setup lang="ts">
import { ref } from 'vue';
import JsonDiffDialog from './components/JsonDiffDialog.vue';
import menuJson from './json/menu.json';
import menuDiffJson from './json/menuDiff.json';

const dialogVisible = ref(false);
function openDialog() {
  dialogVisible.value = true;
}
function closeDialog() {
  dialogVisible.value = false;
}
</script>

<template>
  <div style="padding: 32px;">
    <el-button type="primary" @click="openDialog">打开JSON对比弹窗</el-button>
    <JsonDiffDialog
      :visible="dialogVisible"
      :leftJson="menuJson"
      :rightJson="menuDiffJson"
      title="菜单JSON对比"
      width="1000px"
      height="700px"
      @close="closeDialog"
    />
  </div>
  <router-view />
</template>

<style scoped lang="less"></style>
