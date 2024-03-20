<!--
 * @LastEditTime: 2024-03-20 11:31:06
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
// import MyWorker from '../controls/video/vWorker.js?sharedworker'

const props = defineProps(["video_id"]);
const emits = defineEmits(["updataVideoStatus"]);
let yh_video = null;
let video_start = ref(false);
let video_work = new Worker(
  new URL("../controls/video/ffmpeg_decode.js", import.meta.url).href
);
// let v_work = new MyWorker();
let v_work = new SharedWorker(
  new URL("../controls/video/vShareWorker.js", import.meta.url),
  {
    name: "video",
  }
);
let dom = ref(null);
let video_265 = ref();
let dom_box = ref();
let imagesData = ref();
let objs = ref();
onMounted(() => {
  yh_video = new VIDEO(props.video_id);
  dom.value = document.getElementById(`${props.video_id}_helper_box`);
  dom_box.value = document.getElementById(`${props.video_id}_box`);
  video_265.value = new libde265.Decoder(dom.value);
  initVideoWork();
  video_265.value.set_image_callback(
    ((index) => {
      return async (data) => {
        // console.log(data, "image====================================");
        console.log(Date.now(), "-----------解码完成", props.video_id);
        await renderImage(data);
        data.free();
      };
    })(props.video_id)
  );
});
function renderImage(image) {
  return new Promise((resolve, reject) => {
    let rect = document
      .getElementById(`${props.video_id}`)
      .getBoundingClientRect();
    const ctx = dom.value.getContext("2d");
    // let canvas = new OffscreenCanvas(w, h);
    // let ctx = canvas.getContext("2d");
    // let imageBitmap;
    var w = image.get_width();
    var h = image.get_height();
    let wh_obj = yh_video.handleWH(w, h, rect.width, rect.height);
    dom_box.value.style.width = wh_obj.w + "px";
    dom_box.value.style.height = wh_obj.h + "px";

    if (w != dom.value.width || h != dom.value.height || !imagesData.value) {
      dom.value.width = w;
      dom.value.height = h;
      imagesData.value = ctx.createImageData(w, h);
    }

    image.display(imagesData.value, (data) => {
      ctx.putImageData(data, 0, 0);
      objs.value.filter((item) => {
        let obj_data = item[item.length - 1][props.video_id];
        let arr = obj_data.filter((item) => {
          return item[0] === -1 && item[1] === -1;
        });
        if (arr.length === 8) return;
        ctx.beginPath();
        ctx.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
        ctx.lineTo(obj_data[1][0], obj_data[1][1]);
        ctx.lineTo(obj_data[5][0], obj_data[5][1]);
        ctx.lineTo(obj_data[7][0], obj_data[7][1]);
        ctx.lineTo(obj_data[6][0], obj_data[6][1]);
        ctx.lineTo(obj_data[2][0], obj_data[2][1]);
        ctx.lineTo(obj_data[3][0], obj_data[3][1]);
        ctx.lineTo(obj_data[1][0], obj_data[1][1]);
        ctx.moveTo(obj_data[0][0], obj_data[0][1]);
        ctx.lineTo(obj_data[2][0], obj_data[2][1]);
        ctx.moveTo(obj_data[0][0], obj_data[0][1]);
        ctx.lineTo(obj_data[4][0], obj_data[4][1]);
        ctx.lineTo(obj_data[6][0], obj_data[6][1]);
        ctx.moveTo(obj_data[4][0], obj_data[4][1]);
        ctx.lineTo(obj_data[5][0], obj_data[5][1]);
        ctx.moveTo(obj_data[3][0], obj_data[3][1]);
        ctx.lineTo(obj_data[7][0], obj_data[7][1]);
        ctx.lineWidth = "1.4"; //线条 宽度
        ctx.strokeStyle = "yellow";
        ctx.stroke(); //描边
      });
      // imageBitmap = canvas.transferToImageBitmap();

      console.log(Date.now(), "-----------渲染结束", props.video_id);
    });
  });
}
async function getData(e) {
  try {
    // return new Promise((resolve, reject) => {
    // console.log(e, "=======================getData");
    console.log(Date.now(), "-----------开始解码", props.video_id);
    objs.value = e.objs;
    video_265.value.push_data(e.video);
    video_265.value.decode((err) => {
      switch (err) {
        case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
          console.info("解码：等待数据... ", e.video.length);
          break;
        default:
          if (!libde265.de265_isOK(err)) {
            console.log(libde265.de265_get_error_text(err));
          }
      }
    });
    // })
  } catch (err) {
    console.log(err, "err====getData");
  }
}
function readerSegImg(seg, segWidth, segHeight) {
  // 渲染分割图
  const ctx = dom.value.getContext("2d");
  ctx.fillRect(0, 0, segWidth, segHeight);
  let segImageData;
  // ctx.drawImage(segImage, 0, 0, 200, 200);
  if (dom.value.width != segWidth || dom.value.height != segHeight) {
    dom.value.widht = segWidth;
    dom.value.height = segHeight;
    segImageData = null;
  }

  if (!segImageData) {
    segImageData = ctx.getImageData(0, 0, dom.value.width, dom.value.height);
  }
  var rotate90 = false;
  for (var i = 0; i < segImageData.data.length; i += 4) {
    var iSeg = i / 4;
    var gray = seg[iSeg];
    if (rotate90) {
      // 计算旋转后的索引位置
      let x = iSeg % segWidth;
      let y = Math.floor(iSeg / segWidth);
      // 逆时针
      let index = segHeight * (x + 1) - y - 1;
      gray = seg[index];
    }
    var r = 0;
    var g = 0;
    var b = 0;
    switch (gray) {
      case 1:
        r = 0xff;
        break;
      case 2:
        g = 0xff;
        break;
      case 3:
        b = 0xff;
        break;
      default:
        r = 0x88;
        g = 0x88;
        b = 0x88;
        break;
    }
    segImageData.data[i] = r;
    segImageData.data[i + 1] = g;
    segImageData.data[i + 2] = b;
    segImageData.data[i + 3] = 255;
  }
  // console.log(segImageData, "segImageData");
  // 绘制图像到画布上
  ctx.putImageData(segImageData, 0, 0);
}
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
      emits("updataVideoStatus", message);
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
  getData,
});
onUnmounted(() => {
  video_work.terminate();
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
