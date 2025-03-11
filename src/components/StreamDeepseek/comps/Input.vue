<!--
 * @Author: Wannaer
 * @Date: 2025-03-07 09:57:07
 * @Description: 
-->
<template>
  <div class="msg-editor-container">
    <!-- 文本输入框 -->
    <div class="flex items-center">
      <el-input
        class="flex-1"
        ref="inputDiv"
        v-model="inputValue"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
        placeholder="请输入你的问题"
        @keydown.enter.exact="handleKeydown"
      ></el-input>
      <!-- 语音 -->
      <DeepseekVoiceVue @voiceTextChange="voiceTextChange"></DeepseekVoiceVue>
      <!-- 新对话 -->
      <el-tooltip :z-index="100000" effect="dark" content="新对话" placement="top">
        <el-icon class="mr-1 focus:border-blue-400 hover:bg-[#f5f5f5] bg-white cursor-pointer" size="22px" @click="newSessionBtn">
          <Plus />
        </el-icon>
      </el-tooltip>
      <!-- 操作按钮 -->
      <el-tooltip :z-index="100000" effect="dark" content="发送" placement="top">
        <el-button type="primary" icon="Top" circle @click="handleKeydown"></el-button>
      </el-tooltip>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import DeepseekVoiceVue from "./Voice.vue";

const emits = defineEmits(["submit", "newSession"]);
const inputValue = ref("");

const voiceTextChange = (text: string) => {
  console.log(text);
  inputValue.value = inputValue.value + text;
};

const handleKeydown = (e: Event) => {
  e.stopPropagation();
  e.returnValue = false;
  if (inputValue.value === "") return;

  emits("submit", inputValue.value);
  inputValue.value = "";
};

const newSessionBtn = () => {
  emits("newSession");
};
</script>
<style lang="scss" scoped>
.msg-editor-container {
  border: 1px solid #dee0e3;
  border-radius: 4px;
  padding: 5px;
}

.operationBtn {
  display: flex;
}
</style>
