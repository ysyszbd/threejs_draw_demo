import { createApp } from 'vue'
import '../style.css'
import App from './App.vue'
import Base from "@/controls/base.js";
import MemoryPool from '@/controls/memoryPool';
import '@/controls/rem.js';

// const instance = MemoryPool.getInstance();
let base = new Base();
let memoryPool = new MemoryPool();
const app = createApp(App);
app.provide('$Base', base);
// app.provide('$MemoryPool', instance);
app.provide('$MemoryPool', memoryPool);
app.mount('#app');
