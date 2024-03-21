<!--
 * @LastEditTime: 2024-03-21 11:58:25
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box"></div>
</template>

<script setup>
import bevImgControl from "../controls/bevImgContorl.js";
import { onMounted, ref } from "vue";
let Bev = ref(null);
onMounted(() => {
  Bev.value = new bevImgControl();
  console.log(document.getElementById("bev_box").getBoundingClientRect());
});
</script>

<style lang="scss" scoped>
.rbg_demo {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px !important;
  canvas {
    width: 100% !important;
    height: 100% !important;
    border-radius: 8px !important;
  }
}
</style>
