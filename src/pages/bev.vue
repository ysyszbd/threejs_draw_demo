<!--
 * @LastEditTime: 2024-03-13 19:06:01
 * @Description: 
-->
<template>
  <div class="rbg_demo" id="bev_box"></div>
</template>

<script setup>
import bevControl from "../controls/bevControl.js";
import bevImgControl from "../controls/bevImgContorl.js";
import { onMounted, ref, defineExpose } from "vue";

let Bev = ref(null);


onMounted(() => {
  Bev.value = new bevImgControl();
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
</style>
