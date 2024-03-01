<!--
 * @LastEditTime: 2024-03-01 13:37:39
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="demo_box">
    <canvas id="img_canvas" class="img_canvas"></canvas>
  </div>
</template>

<script setup>
import demo from "../controls/demo.js";
import { onMounted } from "vue";
let Demo = null;
onMounted(() => {
  Demo = new demo();
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
</style>
