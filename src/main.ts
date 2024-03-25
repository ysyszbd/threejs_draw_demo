/*
 * @LastEditTime: 2024-03-25 10:05:17
 * @Description: 
 */
import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { setRem } from '@/utils'

const app = createApp(App);
app.mount('#app');
setRem()
