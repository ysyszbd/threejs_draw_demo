<!--
 * @LastEditTime: 2024-03-13 17:05:37
 * @Description: 
-->
<template>
  <div class="video_box">
    <div class="handle_box" :id="props.video_id + '_box'">
      <canvas
        class="handle_box_canvas"
        :id="props.video_id + '_helper_box'"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import {
  defineProps,
  defineEmits,
  onMounted,
  defineExpose,
  onUnmounted,
  ref,
  inject,
} from "vue";
import VIDEO from "../controls/video/video.js";
import { ObserverInstance } from "@/controls/event/observer";

const props = defineProps(["video_id"]);
const emits = defineEmits(["updataVideoStatus"]);
let yh_video = null;
let MemoryPool = inject("$MemoryPool");
let video_start = ref(false);
let video_work = new Worker(
  new URL("../controls/video/ffmpeg_decode.js", import.meta.url).href
);
let objects = ref();
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
  initVideoWork();
});
function postVideo(u8Array, key) {
  video_work.postMessage({
    video_data: u8Array,
    view: props.video_id,
    key: key,
  });
}
function updataCode(u8Array, objs, bev) {
  try {
    return new Promise(async (resolve, reject) => {
      yh_video.setObjs(objs);
      objects.value = objs;
      video_work.postMessage({ video_data: u8Array, sign: "now" });
    });
  } catch (err) {
    console.log(err, "err====updataCode");
  }
}
function initVideoWork() {
  video_work.onmessage = (event) => {
    if (event.data.type === "message") {
      if (event.data.info == "init") {
        ObserverInstance.emit("INIT_OK", {
          id: props.video_id,
        });
        changeCodecId(173);
      }
    } else if (event.data.type === "video_init") {
      if (!video_start.value) {
        ObserverInstance.emit("VIDEO_OK", {
          id: props.video_id,
        });
      }
      video_start.value = true;
    } else {
      let message = event.data,
        info = message.info;
      if (info.width == 0 || info.height == 0) {
        return;
      }
      // console.log(message, "message===========MemoryPool", MemoryPool);
      emits("updataVideoStatus", message);
      // if (props.video_id === "foresight") {
      //   ObserverInstance.emit("DRAW_BEV", {
      //     type: "start",
      //   });
      // }
      // yh_video.drawVideo(info);
    }
  };
}
function changeCodecId(val) {
  let data = {
    type: "updateCodecId",
    info: val,
    id: props.video_id,
  };
  video_work.postMessage(data);
}
defineExpose({
  updataCode,
  postVideo,
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
