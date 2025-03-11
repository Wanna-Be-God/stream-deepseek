import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
/**
 * element-plus
 */
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 因element-plus默认是英文，我们指定一下默认中文
import locale from "element-plus/es/locale/lang/zh-cn";
// 图标并进行全局注册
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "virtual:windi.css";
const instance = createApp(App)
// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  instance.component(key, component);
}
instance.use(ElementPlus, {
  locale // 语言设置
  // size: Cookies.get('size') || 'medium' // 尺寸设置
})
instance.mount('#app')
