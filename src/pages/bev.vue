<!--
 * @LastEditTime: 2024-03-08 18:33:51
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box">
    <canvas id="img_canvas" class="img_canvas"></canvas>
  </div>
</template>

<script setup>
import bevControl from "../controls/bevControl.js";
import bevImgControl from "../controls/bevImgContorl.js";
import { onMounted, ref, defineProps, defineExpose } from "vue";
let Bev = ref(null);
// let base = inject("$Base");
let props = defineProps(["objs_data"]);
onMounted(() => {
  Bev.value = new bevImgControl();
  // console.log(Bev.value, "Bev.value");
  // Bev = new bevControl();
});
// 更新bev图片
function updataBev(img_arr, img_data, objs_data) {
  try {
    return new Promise((resolve, reject) => {
      // console.log(Bev.value, "img_arr", img_data);
      Bev.value.getData(img_arr, img_data, objs_data);
      // Bev.drawBev(img_data[1], img_data[2]);
      // Bev.drawObjs(objs_data);
      resolve("绘制bev完毕")
    })
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
