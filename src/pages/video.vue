<template>
  <div class="video_box" :id="props.video_id">
    <div class="handle_box" :id="props.video_id + '_box'">
      <canvas :id="props.video_id + '_img'" class="canvas_img"></canvas>
    </div>
  </div>
</template>

<script setup>
import { defineProps, onMounted, defineExpose } from "vue";
import VIDEO from "../controls/video/video.js";
import demo_data from "../assets/demo_data/demos.json";
import { GetBoundingBoxPoints, project_lidar2img } from "@/controls/box2img.js";

const props = defineProps(["video_id", "img_src"]);
let yh_video = null;
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
  handleBox();
});
function handleBox() {
  if (props.video_id !== "foresight") return;
  // console.log(demo_data.lidar, "lidar-");
  let arr = demo_data.lidar;
  arr.forEach((item, index) => {
    let position = item.annotation.data.position,
      dimension = item.annotation.data.dimension,
      rotation = item.annotation.data.rotation;

    item.box_points = GetBoundingBoxPoints(
        position.x,
        position.y,
        position.z,
        dimension.l,
        dimension.w,
        dimension.h,
        0,
        0,
        rotation.z
    )
    item.foresight_point = project_lidar2img([position.x, position.y, position.z]);
    // console.log(
    //   item, "item"
    // );
  });
  yh_video.handleBox();
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
  .canvas_img {
    width: 0;
    height: 0;
  }
}
</style>
