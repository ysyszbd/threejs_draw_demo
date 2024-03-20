<!--
 * @LastEditTime: 2024-03-20 16:47:01
 * @Description: 
-->
<template>
  <div class="video_box">
    <iframe ref="iframeDom" :id="props.video_id + '_iframe_yh'" :name="props.video_id + '_iframe'" class="iframe_css" src="/public/static/video_iframe.html" ></iframe>
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

const props = defineProps(["video_id"]);
const emits = defineEmits(["updataVideoStatus"]);
let yh_video = null;
let iframeDom = ref();
let dom = ref(null);
let video_265 = ref();
let dom_box = ref();
let objs = ref();
let key = ref();
let ifm = ref();
onMounted(() => {
  ifm.value = window.frames[`${props.video_id}_iframe`];
  yh_video = new VIDEO(props.video_id);
  dom.value = document.getElementById(`${props.video_id}_helper_box`);
  dom_box.value = document.getElementById(`${props.video_id}_box`);
  video_265.value = new libde265.Decoder(dom.value);
});
function update(data) {
  return new Promise((resolve, reject) => {
    emits("updataVideoStatus", {
      data: data.params,
      key: data.key,
      width: 704,
      height: 256,
      view: props.video_id
    });
  });
}
window.addEventListener("message", getIframe)
function getIframe(e) {
  if (e.data.view !== props.video_id) return;
  update(e.data);
}
async function getData(e) {
  try {
    return new Promise((resolve, reject) => {
      if (props.video_id === "foresight") {
        console.log(Date.now(), "-----------开始解码", e);
      }

      objs.value = e.objs;
      key.value = e.key;
      ifm.value.postMessage({
        cmd: "video",
        view: props.video_id,
        params: e,
        key: e.key,
        objs: e.objs
      })
      resolve("开始解码");
    })
  } catch (err) {
    console.log(err, "err====getData");
  }
}
defineExpose({
  getData,
});
onUnmounted(() => {
});
</script>

<style lang="scss" scoped>
.handle_box {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .handle_box_canvas {
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
.iframe_css {
  width: 0;
  height: 0;
  position: absolute;
  top: -1; 
  left: -1;
  opacity: 0;
}
</style>
