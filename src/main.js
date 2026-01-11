import { createApp } from 'vue';
import { createRouter, createWebHashHistory } from 'vue-router';
import store from './store';
import App from './App';
import VueShortkey from 'vue-shortkey';
import { createI18n } from 'vue-i18n';
import en from './i18n/en';
import zh from './i18n/zh';
import pl from './i18n/pl';
import ptBR from './i18n/pt-BR';
import hr from './i18n/hr';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'simplebar-vue/dist/simplebar.min.css';
import BoardContent from './components/board/BoardContent.vue';
import VueTextareaAutosize from 'vue-textarea-autosize';
import mitt from 'mitt';
//import 'autolink-js';

const messages = {
  en: en,
  zh: zh,
  pl: pl,
  ptBR: ptBR,
  hr: hr,
};

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages,
  fallbackLocale: 'en',
});

const routes = [
  {path: '/board/:boardId/:itemId?', component: BoardContent},
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

const app = createApp(App);

// Global event bus for Vue 3
const emitter = mitt();
app.config.globalProperties.$bus = {
  $on: emitter.on,
  $emit: emitter.emit,
  $off: emitter.off
};

app.use(i18n);
app.use(store);
app.use(router);
app.use(VueShortkey);
app.use(VueTextareaAutosize);
app.use(ElementPlus);

app.directive('focus', {
  updated(el) {
    const input = el.getElementsByTagName('input')[0];
    if (input) input.focus();
  },
});

app.config.globalProperties.$filters = {
  metaTextReplacer: (text) => text.replace('META', '⌘'),
  shiftTextReplacer: (text) => text.replace('SHIFT', '⇧'),
};

app.mount('#app');
