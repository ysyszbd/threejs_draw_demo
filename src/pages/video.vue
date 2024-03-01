<template>
  <div class="video_box" :id="props.video_id">
    <canvas :id="props.video_id + '_img'" class="canvas_img"></canvas>
  </div>
</template>

<script setup>
import { defineProps, onMounted, defineExpose } from "vue";
import VIDEO from "../controls/video/video.js";
const props = defineProps(["video_id"]);
let yh_video = null;
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
});

function updataCode(u8Array) {
  if (yh_video.status) {
    yh_video.work.postMessage(u8Array, [u8Array.buffer]);
  }
}
defineExpose({
  updataCode,
});
</script>

<style lang="scss" scoped>
.canvas_img {
  width: 100%;
  height: 100%;
  // display: none;
}
</style>
