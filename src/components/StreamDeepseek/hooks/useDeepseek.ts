/*
 * @Author: Wannaer
 * @Date: 2025-03-06 12:12:27
 * @Description:
 */
import { ref } from "vue";
import { StreamGpt, Typewriter, GptMsgs, RequestData } from "./fetchApi";

// useGpt 钩子函数，用于处理 GPT 流式请求
export const useGpt = (key: string) => {
  const streamingText = ref("");
  const streaming = ref(false);
  const msgList = ref<GptMsgs>([]);
  const sessionId = ref("");

  // 初始化 Typewriter 实例
  const typewriter = new Typewriter((str: string) => {
    streamingText.value += str || "";
    // console.log("str", str);
  });

  // 初始化 StreamGpt 实例
  const gpt = new StreamGpt(key, {
    onStart: (prompt: string) => {
      streaming.value = true;
      msgList.value.push({
        role: "user",
        content: prompt
      });
    },
    onPatch: (text: string) => {
      // console.log("onPatch", text);
      typewriter.add(text);
    },
    onCreated: () => {
      typewriter.start();
    },
    onDone: () => {
      typewriter.done();
      streaming.value = false;
      msgList.value.push({
        role: "system",
        content: streamingText.value
      });
      streamingText.value = "";
    }
  });

  // 发送流式请求
  const stream = (requestData: RequestData) => {
    if (sessionId.value === "") {
      sessionId.value = generateUUID();
    }
    gpt.stream({ ...requestData, sessionId: sessionId.value });
  };

  // 新会话
  const newSession = () => {
    msgList.value = [];
    streamingText.value = "";
    sessionId.value = generateUUID();
  };

  // 生成 UUID
  const generateUUID = () => {
    let uuid = "";
    for (let i = 0; i < 32; i++) {
      const random = (Math.random() * 16) | 0;
      if (i === 8 || i === 12 || i === 16 || i === 20) uuid += "-";
      uuid += (i === 12 ? 4 : i === 16 ? (random & 3) | 8 : random).toString(16);
    }
    return uuid;
  };

  return {
    streamingText,
    streaming,
    msgList,
    stream,
    newSession
  };
};
