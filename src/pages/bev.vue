<!--
 * @LastEditTime: 2024-03-12 20:04:46
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box"></div>
</template>

<script setup>
import bevControl from "../controls/bevControl.js";
import bevImgControl from "../controls/bevImgContorl.js";
import { onMounted, ref, defineProps, defineExpose, inject } from "vue";
import { ObserverInstance } from "@/controls/event/observer";

let Bev = ref(null);
let dataNow = inject("data_now");
let props = defineProps(["objs_data"]);
let observerListenerList = [
  {
    eventName: "DRAW_BEV",
    fn: updataBev.bind(this),
  },
];

ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");

onMounted(() => {
  Bev.value = new bevImgControl();
  // console.log(Bev.value, "Bev.value");
  // Bev = new bevControl();
});
// 更新bev图片
function updataBev(img_arr, img_data, objs_data) {
  try {
    return new Promise((resolve, reject) => {
      // console.log(dataNow, "dataNow==========");
      Bev.value.getData(dataNow.value[3], dataNow.value[2], dataNow.value[4]);
      // Bev.value.getData(img_arr, img_data, objs_data);
      resolve("绘制bev完毕");
    });
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
