<!--
 * @LastEditTime: 2024-03-08 13:27:05
 * @Description: 
-->
<template>
  <div class="video_box">
    <div class="handle_box" :id="props.video_id + '_box'">
      <canvas :id="props.video_id + '_video'" class="canvas_video"></canvas>
      <canvas
        class="handle_box_canvas"
        :id="props.video_id + '_helper_box'"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, defineExpose, onUnmounted } from "vue";
import VIDEO from "../controls/video/video.js";
import {
  GetBoundingBoxPoints,
  project_lidar2img,
  construct2DArray,
} from "@/controls/box2img.js";

const props = defineProps(["video_id"]);
let yh_video = null;
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
});


function updataCode(u8Array, base, objs, bev) {
  try {
    // console.log(base, objs, "base, objs-----");
    return new Promise(async (resolve, reject) => {
      yh_video.setObjs(objs);
      // handleObjPoints(base, objs);
      yh_video.work.postMessage(u8Array);
      // if (yh_video.status) {
      //   // console.log(u8Array, "u8Array====");
      //   // console.log("-------计算obj完毕");
      //   // yh_video.drawObjs(arr);
      // } else {
      //   reject("失败");
      // }
    });
  } catch (err) {
    console.log(err, "err====updataCode");
  }
}
async function handleObjPoints(base, objs) {
  try {
    
  } catch (err) {
    console.log(err, "err---handleObjPoints");
  }
}
defineExpose({
  updataCode,
});
onUnmounted(() => {
  yh_video.work.terminate();
});
</script>

<style lang="scss" scoped>
.handle_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .canvas_video {
    width: 100%;
    height: 100%;
  }
  .img_css {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
  }
  .handle_box_canvas {
    // width: 0;
    // height: 0;
    width: 100%;
    height: 100%;
    color: rgb(255, 255, 0);
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    z-index: 1;
  }
}
</style>
