<!--
 * @LastEditTime: 2024-03-05 14:29:22
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box">
    <canvas id="img_canvas" class="img_canvas"></canvas>
  </div>
</template>

<script setup>
import bevControl from "../controls/bevControl.js";
import { onMounted, inject } from "vue";
let Bev = null;
let base = inject("$Base");
onMounted(() => {
  Bev = new bevControl();
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
