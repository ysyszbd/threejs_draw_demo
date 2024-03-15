<!--
 * @LastEditTime: 2024-03-15 11:11:04
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
