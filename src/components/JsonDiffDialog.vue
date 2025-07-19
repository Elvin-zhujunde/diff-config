<template>
  <el-dialog :model-value="visible" :title="title" :width="width" :before-close="onClose" class="json-diff-dialog" :close-on-click-modal="false">
    <div class="editor-container">
      <div class="editor-side">
        <div class="editor-title">左侧 JSON</div>
        <div ref="leftEditorRef" class="monaco-editor-box" />
      </div>
      <div class="editor-side">
        <div class="editor-title">右侧 JSON</div>
        <div ref="rightEditorRef" class="monaco-editor-box" />
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import * as monaco from 'monaco-editor';

const props = defineProps({
  visible: Boolean,
  leftJson: { type: [Object, Array, String], required: true },
  rightJson: { type: [Object, Array, String], required: true },
  title: { type: String, default: 'JSON 对比' },
  width: { type: String, default: '900px' },
  height: { type: String, default: '600px' },
});
const emit = defineEmits(['close']);

const leftEditorRef = ref<HTMLElement | null>(null);
const rightEditorRef = ref<HTMLElement | null>(null);
let leftEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let rightEditor: monaco.editor.IStandaloneCodeEditor | null = null;

function createEditors() {
  destroyEditors();
  if (leftEditorRef.value) {
    leftEditor = monaco.editor.create(leftEditorRef.value, {
      value: typeof props.leftJson === 'string' ? props.leftJson : JSON.stringify(props.leftJson, null, 2),
      language: 'json',
      readOnly: true,
      fontSize: 15,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
    });
  }
  if (rightEditorRef.value) {
    rightEditor = monaco.editor.create(rightEditorRef.value, {
      value: typeof props.rightJson === 'string' ? props.rightJson : JSON.stringify(props.rightJson, null, 2),
      language: 'json',
      readOnly: true,
      fontSize: 15,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      automaticLayout: true,
    });
  }
}
function destroyEditors() {
  if (leftEditor) {
    leftEditor.dispose();
    leftEditor = null;
  }
  if (rightEditor) {
    rightEditor.dispose();
    rightEditor = null;
  }
}

watch(() => props.visible, (val) => {
  if (val) {
    nextTick(() => {
      createEditors();
    });
  } else {
    destroyEditors();
  }
});

watch(() => props.leftJson, (val) => {
  if (leftEditor) {
    leftEditor.setValue(typeof val === 'string' ? val : JSON.stringify(val, null, 2));
  }
});
watch(() => props.rightJson, (val) => {
  if (rightEditor) {
    rightEditor.setValue(typeof val === 'string' ? val : JSON.stringify(val, null, 2));
  }
});

onMounted(() => {
  if (props.visible) {
    nextTick(() => {
      createEditors();
    });
  }
});
onBeforeUnmount(() => {
  destroyEditors();
});

function onClose() {
  emit('close');
}
</script>

<style scoped>
.json-diff-dialog .editor-container {
  display: flex;
  flex-direction: row;
  gap: 16px;
  width: 100%;
  height: 100%;
  min-height: 400px;
}
.editor-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.editor-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #409eff;
}
.monaco-editor-box {
  height: 500px;
  min-height: 350px;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  width: 100%;
}
</style> 