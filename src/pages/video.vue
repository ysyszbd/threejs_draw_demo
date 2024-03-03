<!--
 * @LastEditTime: 2024-03-03 23:27:24
 * @Description: 
-->
<template>
  <div class="video_box">
    <!-- <div class="video_box" :id="props.video_id"> -->
    <div class="handle_box" :id="props.video_id + '_box'">
      <canvas :id="props.video_id + '_img'" class="canvas_img"></canvas>
      <img
        :src="props.img_src"
        alt=""
        class="img_css"
        :id="props.video_id + '_bg'"
      />
      <canvas
        class="handle_box_canvas"
        :id="props.video_id + '_helper_box'"
      ></canvas>
      <!-- :style="`width: 1920px; height: 1080px; transform:scale(${ratio}); transform-origin: 0px 0;`" -->
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, defineExpose, ref } from "vue";
import VIDEO from "../controls/video/video.js";
import demo_data from "../assets/demo_data/demos.json";
import { GetBoundingBoxPoints, project_lidar2img } from "@/controls/box2img.js";

const props = defineProps(["video_id", "img_src"]);
let yh_video = null;
let ratio = ref(1),
  wh_obj = ref({
    w: 0,
    h: 0,
  });
let view_data = ref({
  foresight: {},
  rearview: {},
  right_front: {},
  right_back: {},
  left_back: {},
  left_front: {},
});
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
  handleBox();
});

function handleBox() {
  // if (props.video_id !== "foresight") return;
  let arr = demo_data.lidar;

  yh_video.handleBox();
  arr.forEach((item, index) => {
    if (!demo_data.camera[item.id + "-" + props.video_id]) return;
    
    let position = item.annotation.data.position,
      dimension = item.annotation.data.dimension,
      rotation = item.annotation.data.rotation;

    // 获取障碍物立方体8个点坐标
    item[props.video_id] = GetBoundingBoxPoints(
      position.x,
      position.y,
      position.z,
      dimension.l,
      dimension.w,
      dimension.h,
      0,
      0,
      rotation.z
    );
    // 获取障碍物中心点坐标
    item[`${props.video_id}_point`] = project_lidar2img(
      [position.x, position.y, position.z],
      props.video_id
    );
    // console.log(props.video_id, "======", item);
    yh_video.handleHelper(item[props.video_id], props.video_id);
    // 绘制中心点
    yh_video.drawCircle(item[`${props.video_id}_point`], "red");
  });
  console.log(arr, "arr", props.video_id);
}

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
.handle_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .canvas_img {
    width: 0;
    height: 0;
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
    // width: 100%;
    // height: 100%;
    color: rgb(255, 255, 0);
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
  }
}
</style>
