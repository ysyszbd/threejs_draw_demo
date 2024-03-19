/*
 * @LastEditTime: 2024-03-11 14:03:17
 * @Description: 
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Base from "@/controls/base.js";
import MemoryPool from '@/controls/memoryPool';
// import '@/controls/rem.js';
import { setRem } from '@/utils'


let base = new Base();
let memoryPool = new MemoryPool();
const app = createApp(App);
app.provide('$Base', base);
app.provide('$MemoryPool', memoryPool);
app.mount('#app');
setRem()
