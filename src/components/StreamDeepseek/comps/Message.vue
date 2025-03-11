<template>
  <div
    class="msg-item"
    :class="{
      'msg-item-system': role === 'system'
    }"
  >
    <div
      class="msg-content"
      :class="{
        'msg-content-user': role === 'user'
      }"
    >
      <span class="msg-pop-container">
        <span
          class="msg-pop-default"
          v-html="mkHtml"
          ref="popRef"
          :class="{
            'msg-pop-primary': role === 'user'
          }"
        >
        </span>
      </span>
    </div>
  </div>
</template>
<script lang="ts" setup>
import MarkdownIt from "markdown-it";
import mk from "markdown-it-katex";
import hljs from "highlight.js";
import "highlight.js/styles/atom-one-dark-reasonable.css";
import { computed, nextTick, ref } from "vue";
interface Props {
  role: string;
  content: string;
  streaming?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  content: "",
  streaming: false
});
const md: MarkdownIt = MarkdownIt({
  highlight: function (str: string, lang: string) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<div class="hl-code"><div class="hl-code-header"><span>${lang}</span></div><div class="hljs"><code>${
          hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        }</code></div></div>`;
      } catch (__) {
        console.log(__, "error");
      }
    }
    return `<div class="hl-code"><div class="hl-code-header"><span>${lang}</span></div><div class="hljs"><code>${md.utils.escapeHtml(
      str
    )}</code></div></div>`;
  }
});
md.use(mk, {
  throwOnError: false,
  errorColor: " #cc0000"
});

// 自定义规则函数，用于解析 <think> 标签
function thinkTagRule(state, startLine, endLine, silent) {
  let pos,
    max,
    nextLine,
    token,
    autoClosed = false;
  let start = state.bMarks[startLine] + state.tShift[startLine];
  let end = state.eMarks[startLine];

  // 检查是否以 <think> 开头
  if (start + 7 > end || state.src.slice(start, start + 7) !== "<think>") {
    return false;
  }

  // 跳过 <think>
  pos = start + 7;

  // 查找 </think> 结束标签
  for (nextLine = startLine; ; nextLine++) {
    if (nextLine >= endLine) {
      // 未找到结束标签
      break;
    }

    max = state.bMarks[nextLine] + state.tShift[nextLine];
    if (max < state.eMarks[nextLine] && state.src.slice(max, max + 8) === "</think>") {
      // 找到结束标签
      autoClosed = true;
      break;
    }
  }

  // 如果处于静默模式，只验证标签，不生成 token
  if (silent) {
    return autoClosed;
  }

  // 创建一个新的 token 表示开始标签
  token = state.push("think_tag_open", "think", 1);
  token.markup = "<think>";
  token.map = [startLine, nextLine];

  // 处理标签内部的内容
  state.md.block.tokenize(state, startLine + 1, nextLine);

  // 创建结束 token
  token = state.push("think_tag_close", "think", -1);
  token.markup = "</think>";

  // 更新状态，跳过已处理的行
  state.line = nextLine + 1;

  return true;
}

// 将自定义规则添加到 MarkdownIt 实例中
md.block.ruler.before("paragraph", "think_tag", thinkTagRule);

// 自定义渲染规则，将 <think> 标签渲染为 <span class="think">
md.renderer.rules.think_tag_open = function () {
  return '<span class="think">';
};

md.renderer.rules.think_tag_close = function () {
  return "</span>";
};

function findLastElement(element: HTMLElement): HTMLElement {
  if (!element.children.length) {
    return element;
  }
  const lastChild = element.children[element.children.length - 1];
  if (lastChild.nodeType === Node.ELEMENT_NODE) {
    return findLastElement(lastChild as HTMLElement);
  }
  return element;
}
const popRef = ref();
const mkHtml = computed(() => {
  if (props.role === "user") {
    return props.content;
  }
  let html = md.render(props.content);
  console.log(html); // 调试信息
  nextTick(() => {
    if (props.streaming) {
      const parent = popRef.value;
      if (!parent) return;
      let lastChild = parent.lastElementChild || parent;
      console.log(lastChild.tagName);
      if (lastChild.tagName === "PRE") {
        lastChild = lastChild.getElementsByClassName("hljs")[0] || lastChild;
      }
      if (lastChild.tagName === "OL") {
        lastChild = findLastElement(lastChild as HTMLElement);
      }
      lastChild?.insertAdjacentHTML("beforeend", '<span class="input-cursor"></span>');
    }
  });
  return html;
});
</script>
<style lang="scss" scoped>
.msg-item {
  width: 100%;
  display: flex;
  margin-bottom: 10px;
  padding: 0 10px;
  border-radius: 4px;

  .msg-content {
    position: relative;
    width: 100%;
    flex: 1 1 auto;

    .msg-pop-container {
      position: relative;
      display: inline-block;
      max-width: 95%;

      .msg-pop-default {
        width: 100%;
        display: inline-block;
        padding: 8px;
        background: #f5f5f5;
        border-radius: 4px;
        color: #252724;

        :deep(p) {
          margin-bottom: 0;
          white-space: pre-line;
        }
      }

      .msg-pop-primary {
        background: #95ec69;
        // white-space: pre-line;
      }
    }
  }
}

.msg-content-user {
  text-align: end;
}
.msg-item-system {
  justify-content: flex-end;
}
</style>
<style lang="scss">
.think {
  color: blue;
  font-style: italic;
}
.hl-code {
  margin-top: 1em;
}

.hl-code-header {
  padding: 0 10px;
  color: #abb2bf;
  background: #1d2635;
  border-radius: 4px 4px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hljs {
  padding: 10px;
  overflow-x: auto;
  border-radius: 0 0 4px 4px;

  .input-cursor {
    background: #fff;
    /* fallback for old browsers */
  }
}

.input-cursor {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 1px;
  height: 1em;
  background: #3b414b;
  /* fallback for old browsers */
  padding-left: 0.05em;
  top: 0.1em;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  0% {
    visibility: visible;
  }

  50% {
    visibility: hidden;
  }

  100% {
    visibility: visible;
  }
}
</style>
