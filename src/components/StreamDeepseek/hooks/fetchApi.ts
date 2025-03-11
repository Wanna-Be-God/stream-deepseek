/*
 * @Author: Wannaer
 * @Date: 2025-03-06 12:09:02
 * @Description:
 */
/** Typewriter 类用于处理字符串队列，并以动态速度消费队列中的字符 */
export class Typewriter {
  private queue: string[] = [];
  private consuming = false;
  private timer: any;

  constructor(private onConsume: (str: string) => void) {}

  // 根据队列长度动态调整速度
  dynamicSpeed() {
    const speed = 2000 / this.queue.length;
    return speed > 200 ? 200 : speed;
  }

  // 添加字符串到队列
  add(str: string) {
    if (!str) return;
    this.queue.push(...str.split(""));
    if (!this.consuming) {
      this.start();
    }
  }

  // 消费队列中的一个字符
  consume = () => {
    if (this.queue.length > 0) {
      const str = this.queue.shift();
      if (str) {
        this.onConsume(str);
      }
    }
  };

  // 递归调用消费函数，直到队列为空
  next = () => {
    this.consume();
    if (this.consuming && this.queue.length > 0) {
      this.timer = setTimeout(this.next, this.dynamicSpeed());
    }
  };

  // 开始消费队列
  start = () => {
    this.consuming = true;
    this.next();
  };

  // 停止消费队列，并清空队列
  done = () => {
    this.consuming = false;
    clearTimeout(this.timer);
    this.onConsume(this.queue.join(""));
    this.queue = [];
  };
}

// GptMsg 接口定义了 GPT 消息的结构
export interface GptMsg {
  role: string;
  content: string;
}

// GptMsgs 类型是 GptMsg 数组
export type GptMsgs = Array<GptMsg>;

export interface RequestData {
  repId?: string;
  sessionId?: string;
  topic?: string;
  userMessage?: string;
}

// StreamGpt 类用于处理 GPT 流式请求
export class StreamGpt {
  onStart: (prompt: string) => void;
  onCreated: () => void;
  onDone: () => void;
  onPatch: (text: string) => void;

  constructor(
    private key: string,
    options: {
      onStart: (prompt: string) => void;
      onCreated: () => void;
      onDone: () => void;
      onPatch: (text: string) => void;
    }
  ) {
    const { onStart, onCreated, onDone, onPatch } = options;
    this.onStart = onStart;
    this.onCreated = onCreated;
    this.onPatch = onPatch;
    this.onDone = onDone;
  }
  // 处理 GPT 流式请求
  async stream(requestData: RequestData) {
    let finish = false;
    let count = 0;
    const { userMessage } = requestData;
    this.onStart(userMessage);
    const res = await this.fetch(requestData);
    if (!res.body) return;
    const reader = res.body.getReader();
    const decoder: TextDecoder = new TextDecoder();
    let buffer = ""; // 用于存储被截断的数据
    while (!finish) {
      const { done, value } = await reader.read();
      if (done) {
        finish = true;
        this.onDone();
        break;
      }

      buffer += decoder.decode(value, { stream: true }); // 将新数据添加到缓冲区

      // 解析并处理数据
      let lastNewlineIndex = buffer.lastIndexOf("\n");
      if (lastNewlineIndex !== -1) {
        const completeData = buffer.slice(0, lastNewlineIndex + 1);
        buffer = buffer.slice(lastNewlineIndex + 1);

        const pattern = /data:\s*({.*?})\s*\n/g;
        let match;
        while ((match = pattern.exec(completeData)) !== null) {
          const jsonStr = match[1];
          try {
            const json = JSON.parse(jsonStr);
            if (json.content && json.content.length > 0) {
              this.onPatch(json.content);
            }
          } catch (e) {
            console.log(e);
          }
        }
        count++;
        if (count === 1) {
          this.onCreated();
        }
      }
    }
  }

  async fetch(requestData: RequestData) {
    const isDev = import.meta.env.MODE == "dev";
    const _CH_Config = window._CH_Config;
    const baseURL = (isDev ? _CH_Config.Agent_API_DEV : _CH_Config.Agent_API_PROD) + "agent/DeepSeek/chatStream";
    return await fetch(baseURL, {
      method: "POST",
      body: JSON.stringify(requestData),
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
}
