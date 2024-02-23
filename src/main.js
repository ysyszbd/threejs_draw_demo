/*
 * @LastEditTime: 2024-02-23 13:44:15
 * @Description: 
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import Base from "@/contorls/base.js";

let base = new Base();
const app = createApp(App);
app.provide('$Base', base);
app.mount('#app');
