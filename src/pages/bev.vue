<!--
 * @LastEditTime: 2024-03-07 15:48:32
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box">
    <canvas id="img_canvas" class="img_canvas"></canvas>
  </div>
</template>

<script setup>
import bevControl from "../controls/bevControl.js";
import { onMounted, inject, defineProps, defineExpose } from "vue";
let Bev = null;
let base = inject("$Base");
let props = defineProps(["objs_data"]);
onMounted(() => {
  Bev = new bevControl();
});
// 更新bev图片和bev上的障碍物
function updataBev(img_data, objs_data) {
  try {
    Bev.drawObjs(objs_data);
  } catch (err) {
    console.log(err, "err---updataBev");
  }
}
defineExpose({
  updataBev,
});
</script>

<style lang="scss" scoped>
.rbg_demo {
  width: 100%;
  height: 100%;
  background: radial-gradient(#0c97d2, #154c75);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  .img_canvas {
    position: absolute;
    top: 100000px;
    left: 100000px;
  }
}
// .rbg_demo:after {
//   content: "";
//   width: 100%;
//   height: 100%;
//   display: block;
//   position: absolute;
//   top: auto;
//   left: auto;
//   background: url("../assets/imgs/logo.png") no-repeat ;
//   opacity: 0.5;
//   z-index: 1;
// }
</style>../controls/bevControl.js
