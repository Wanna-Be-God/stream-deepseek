<template>
  <div class="container">
    <div class="msg" ref="msgDivRef">
      <MessageVue
        v-for="(msg, index) in msgList"
        :role="msg.role"
        :content="msg.content"
        :key="index"
      />
      <MessageVue
        v-if="streaming"
        role="system"
        :content="streamingText"
        :streaming="true"
      />
    </div>
    <InputVue
      ref="inputRef"
      v-model:value="inputValue"
      @submit="handleSubmit"
      @newSession="newSession"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick, watch, onMounted } from "vue";
import MessageVue from "@/components/StreamDeepseek/comps/Message.vue";
import InputVue from "@/components/StreamDeepseek/comps/Input.vue";
import { useScroll } from "@vueuse/core";
import { useGpt } from "@/components/StreamDeepseek/hooks/useDeepseek";

const inputValue = ref("");
const { msgList, streaming, streamingText, stream, newSession } = useGpt("");
const msgDivRef = ref();
const inputRef = ref();
const { y } = useScroll(msgDivRef);

const scrollToBottom = () => {
  nextTick(() => {
    y.value = msgDivRef.value?.scrollHeight || 0;
  });
};

watch(streamingText, (val) => {
  if (val) {
    scrollToBottom();
  }
});

const handleSubmit = (content: string) => {
  if (content === "") return;
  stream({ userMessage: content });
};

const adjustMsgHeight = () => {
  const inputDivHeight = inputRef.value?.offsetHeight || 0;
  msgDivRef.value.style.height = `calc(100% - ${inputDivHeight}px)`;
};

onMounted(() => {
  adjustMsgHeight();
});

watch(
  () => inputRef.value?.offsetHeight,
  () => {
    nextTick(() => {
      adjustMsgHeight();
    });
  }
);

defineExpose({
  stream,
  newSession,
});
</script>

<style lang="scss" scoped>
.container {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.msg {
  overflow-y: auto;
}
</style>
