<template>
  <div class="mx-1 focus:border-blue-400 hover:bg-[#f5f5f5] bg-white cursor-pointer" @click="toggleRecording">
    <!-- 加载中 -->
    <el-icon class="is-loading" v-if="isLoading" size="22px">
      <Loading />
    </el-icon>
    <!-- <Loading class="is-loading"  style="width: 1em; height: 1em; font-size: 22px" /> -->
    <!-- 录音结束 -->
    <VideoPause v-else-if="isRecording" style="width: 1em; height: 1em; font-size: 22px" />
    <!-- 开始录音 -->
    <Microphone v-else style="width: 1em; height: 1em; font-size: 22px" />
  </div>
</template>

<script setup>
import {ref, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { base64Str } from "./voiceTestBase64";
// import { Recognition } from "@/api/agent/DeepSeek";
// mock api
const Recognition = () => {
  return new Promise((resolve, reject) => {
    resolve("你好");
  })
}
const emits = defineEmits(["voiceTextChange"]);

const isRecording = ref(false);
const isLoading = ref(false);

let audioContext;
let mediaStream;
let scriptProcessor;
let audioChunks = [];

// WAV文件头参数
const WAV_CONFIG = {
  sampleRate: 16000, // 16kHz采样率
  channelCount: 1, // 单声道
  bitDepth: 16 // 16位深度
};

// 开始录音
async function startRecording() {
  try {
    isLoading.value = true;
    audioChunks = [];

    // 获取麦克风输入流
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: WAV_CONFIG.sampleRate,
        channelCount: WAV_CONFIG.channelCount
      }
    });

    // 创建音频上下文
    audioContext = new AudioContext({
      sampleRate: WAV_CONFIG.sampleRate
    });

    // 创建音频源
    const source = audioContext.createMediaStreamSource(mediaStream);

    // 创建脚本处理器处理音频数据
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    // 收集原始PCM数据
    scriptProcessor.onaudioprocess = event => {
      const channelData = event.inputBuffer.getChannelData(0);
      const pcmData = convertFloat32ToInt16(channelData);
      audioChunks.push(pcmData);
    };

    // 连接处理链
    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);

    isRecording.value = true;
  } catch (err) {
    ElMessage.error(`麦克风访问失败: ${err.message}`);
    // getRecognition(base64Str);
  } finally {
    isLoading.value = false;
  }
}

// 停止录音
function stopRecording() {
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor.onaudioprocess = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
  }
  if (audioContext) {
    audioContext.close();
  }

  // 生成WAV文件
  const wavBlob = encodeWAV(audioChunks);
  wavTransformBase64(wavBlob);
  // downloadWAV(wavBlob);

  isRecording.value = false;
}

// 将Float32转换为Int16
function convertFloat32ToInt16(buffer) {
  const length = buffer.length;
  const int16Array = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

// 生成WAV文件头
function generateWavHeader(dataLength) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF标识
  writeString(view, 0, "RIFF");
  // 文件长度（数据长度 + 36）
  view.setUint32(4, dataLength + 36, true);
  // WAVE格式
  writeString(view, 8, "WAVE");
  // fmt子块
  writeString(view, 12, "fmt ");
  // fmt块长度（16字节）
  view.setUint32(16, 16, true);
  // 格式类型（1=PCM）
  view.setUint16(20, 1, true);
  // 声道数
  view.setUint16(22, WAV_CONFIG.channelCount, true);
  // 采样率
  view.setUint32(24, WAV_CONFIG.sampleRate, true);
  // 字节率
  view.setUint32(28, WAV_CONFIG.sampleRate * WAV_CONFIG.channelCount * (WAV_CONFIG.bitDepth / 8), true);
  // 块对齐
  view.setUint16(32, WAV_CONFIG.channelCount * (WAV_CONFIG.bitDepth / 8), true);
  // 位深度
  view.setUint16(34, WAV_CONFIG.bitDepth, true);
  // data标识
  writeString(view, 36, "data");
  // 数据长度
  view.setUint32(40, dataLength, true);

  return view;
}

function wavTransformBase64(wavBlob) {
  const reader = new FileReader();
  reader.onload = function (e) {
    console.log("wav base64:", e.target.result);
    getRecognition(e.target.result);
  };
  reader.readAsDataURL(wavBlob);
}

// 生成WAV文件
function encodeWAV(chunks) {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const header = generateWavHeader(totalLength);
  const wavBuffer = new Uint8Array(header.byteLength + totalLength);

  // 合并头和数据
  wavBuffer.set(new Uint8Array(header.buffer), 0);
  let offset = header.byteLength;
  chunks.forEach(chunk => {
    wavBuffer.set(new Uint8Array(chunk.buffer), offset);
    offset += chunk.byteLength;
  });

  return new Blob([wavBuffer], { type: "audio/wav" });
}

// 写入字符串到DataView
function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// 下载WAV文件
function downloadWAV(blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `recording_${Date.now()}.wav`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}

// 切换录音状态
const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const getRecognition = base64Str => {
  isLoading.value = true;
  Recognition(base64Str)
    .then(res => {
      emits("voiceTextChange", res.data);
    })
    .finally(() => {
      console.log("voiceTextChange");
      isLoading.value = false;
    });
};

onUnmounted(() => {
  stopRecording();
});
</script>

<style scoped></style>
