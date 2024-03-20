<!--
 * @LastEditTime: 2024-03-19 20:39:09
 * @Description: 
-->
<!--
 * @LastEditTime: 2024-03-13 17:16:43
 * @Description: 
-->
<template>
  <div class="my_page">
    <div class="bg_box"></div>
    <div class="page_title">
      <div class="logo_box">
        <img src="@/assets/images/logo.png" class="logo_img" />
      </div>
    </div>
    <div class="page_main">
      <div class="data_box">
        <div class="top_box">
          <videoYH
            ref="foresight"
            id="foresight"
            :video_id="'foresight'"
            :class="[`v_1`, 'v_box']"
            @updataVideoStatus="updataVideoStatus"
          />
          <videoYH
            ref="rearview"
            id="rearview"
            :video_id="'rearview'"
            :class="[`v_1`, 'v_box']"
            @updataVideoStatus="updataVideoStatus"
          />
        </div>
        <div class="bottom_box">
          <div class="left_box">
            <videoYH
              ref="left_back"
              id="left_back"
              :video_id="'left_back'"
              :class="[`v_3`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
            <videoYH
              ref="left_front"
              id="left_front"
              :video_id="'left_front'"
              :class="[`v_4`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
          </div>
          <div class="center_box">
            <Bev ref="BEV" />
          </div>
          <div class="right_box">
            <videoYH
              ref="right_front"
              id="right_front"
              :video_id="'right_front'"
              :class="[`v_1`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
            <videoYH
              ref="right_back"
              id="right_back"
              :video_id="'right_back'"
              :class="[`v_2`, 'v_box']"
              @updataVideoStatus="updataVideoStatus"
            />
          </div>
        </div>
      </div>
      <div class="echarts_demos" id="e_demos">
        <echartsYH id="echarts_box" />
        <echartAxis />
      </div>
    </div>
  </div>
</template>

<script setup>
import videoYH from "./view_video.vue";
import Bev from "./bev.vue";
import echartsYH from "./echarts.vue";
import echartAxis from "./echartAxis.vue";
import { ref, inject, defineProps, onUnmounted, onBeforeMount } from "vue";
import { ObserverInstance } from "@/controls/event/observer";
import Ws from "../controls/ws.js";
import { decode } from "@msgpack/msgpack";
import memoryPool from "@/controls/memoryPool.js";
import {
  GetBoundingBoxPoints,
  project_lidar2img,
  construct2DArray,
  math,
} from "@/controls/box2img.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref(),
  BEV = ref(),
  MemoryPool = inject("$MemoryPool"),
  video_start = ref(false),
  video_status = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  observerListenerList = [
    {
      eventName: "VIDEO_OK",
      fn: handleVideoStatus.bind(this),
    },
  ],
  bev_arr = ref([]),
  num = ref(0),
  stop = ref(false);
let map = new Map();
map.set(0, "rgba(80, 82, 79, 1)");
map.set(1, "rgba(255, 255, 255, 1)");
map.set(2, "rgba(0, 255, 0, 1)");
map.set(3, "rgba(255, 0, 0, 1)");
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
const props = defineProps(["initStatus"]);
// animate();
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    // console.log(e, "eee");
    // if (!props.initStatus) return;
    let object;
    if (e.data instanceof ArrayBuffer) {
      if (
        video_status.value["foresight"] &&
        video_status.value["rearview"] &&
        video_status.value["right_front"] &&
        video_status.value["right_back"] &&
        video_status.value["left_back"] &&
        video_status.value["left_front"]
      ) {
        object = decode(e.data);
        console.log(Date.now(), "-----------获取数据");
        object[4] = await handleObjsPoints(object[2], object[4]);
        // 处理障碍物信息--给bev用
        let objs = await handleObjs(object[4]);
        console.log(Date.now(), "-----------传递解码1");
        foresight.value.getData({
          video: object[1][0],
          objs: object[4],
          basic: object[2],
          key: object[0]
        });
        rearview.value.getData({
          video: object[1][3],
          objs: object[4],
          basic: object[2],
        });
        right_front.value.getData({
          video: object[1][1],
          objs: object[4],
          basic: object[2],
        });
        right_back.value.getData({
          video: object[1][5],
          objs: object[4],
          basic: object[2],
        });
        left_back.value.getData({
          video: object[1][4],
          objs: object[4],
          basic: object[2],
        });
        left_front.value.getData({
          video: object[1][2],
          objs: object[4],
          basic: object[2],
        });
        BEV.value.drawBev({
          bev: object[3],
          basic_data: object[2],
          objs: objs
        })
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
function animate() {
  num.value++;
  updateVideo();
  requestAnimationFrame(() => animate());
}
// 更新视频--按照视频帧
function updateVideo() {
  let key;
  if (MemoryPool.keyArr.length > 1) {
    key = MemoryPool.keyArr[0];
    if (!MemoryPool.basic_data.has(key)) return;
    key = MemoryPool.getKey();
  }
  noticeBev(key);
}
// 接受视频解码的数据，通知去离屏渲染
async function updataVideoStatus(message) {
  // console.log(message, "message============");
  if (!video_start.value) {
    video_start.value = true;
    return;
  }
  if (!MemoryPool.basic_data.has(message.key)) return;
  MemoryPool.setData(message.key, message.info, "video", message.view);
  let imageBitmap = await drawVideoBg(
    message.info,
    MemoryPool.allocate(message.key, "video_objs_arr"),
    message.view
  );
  MemoryPool.setData(message.key, imageBitmap, "video_bg", message.view);
  // updateVideo();
}
// 计算障碍物信息
function handleObjs(objs_data) {
  return new Promise((resolve, reject) => {
    let obj_index = {
      "0-0": {
        name: "car",
        data: [],
      },
      "1-0": { name: "truck", data: [] },
      "1-1": { name: "construction_vehicle", data: [] },
      "2-0": { name: "bus", data: [] },
      "2-1": { name: "trailer", data: [] },
      "3-0": { name: "barrier", data: [] },
      "4-0": { name: "motorcycle", data: [] },
      "4-1": { name: "bicycle", data: [] },
      "5-0": { name: "pedestrian", data: [] },
      "5-1": { name: "street_cone", data: [] },
    };
    objs_data.filter((item) => {
      let type = `${item[7]}-${item[8]}`;
      if (obj_index[type]) {
        obj_index[type].data.push(item);
      }
    });
    resolve(obj_index);
  });
}
function drawVideoBg(info, objs, view) {
  return new Promise((resolve, reject) => {
    let canvas = new OffscreenCanvas(info.width, info.height);
    let context = canvas.getContext("2d");
    let imageBitmap;
    let imgData = new ImageData(info.rgb, info.width, info.height);
    for (let i = 0; i < imgData.data.length; i += 4) {
      let data0 = imgData.data[i + 0];
      imgData.data[i + 0] = imgData.data[i + 2];
      imgData.data[i + 2] = data0;
    }
    context.putImageData(imgData, 0, 0);
    objs.filter((item) => {
      let obj_data = item[item.length - 1][view];
      let arr = obj_data.filter((item) => {
        return item[0] === -1 && item[1] === -1;
      });
      if (arr.length === 8) return;
      context.beginPath();
      context.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
      context.lineTo(obj_data[1][0], obj_data[1][1]);
      context.lineTo(obj_data[5][0], obj_data[5][1]);
      context.lineTo(obj_data[7][0], obj_data[7][1]);
      context.lineTo(obj_data[6][0], obj_data[6][1]);
      context.lineTo(obj_data[2][0], obj_data[2][1]);
      context.lineTo(obj_data[3][0], obj_data[3][1]);
      context.lineTo(obj_data[1][0], obj_data[1][1]);
      context.moveTo(obj_data[0][0], obj_data[0][1]);
      context.lineTo(obj_data[2][0], obj_data[2][1]);
      context.moveTo(obj_data[0][0], obj_data[0][1]);
      context.lineTo(obj_data[4][0], obj_data[4][1]);
      context.lineTo(obj_data[6][0], obj_data[6][1]);
      context.moveTo(obj_data[4][0], obj_data[4][1]);
      context.lineTo(obj_data[5][0], obj_data[5][1]);
      context.moveTo(obj_data[3][0], obj_data[3][1]);
      context.lineTo(obj_data[7][0], obj_data[7][1]);
      context.lineWidth = "1.4"; //线条 宽度
      context.strokeStyle = "yellow";
      context.stroke(); //描边
    });
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
  });
}
// 通知视频渲染
function noticeVideo(key, view, objs_canvas) {
  return new Promise(async (resolve, reject) => {
    ObserverInstance.emit("VIDEO_DRAW", {
      view: view,
      objs: MemoryPool.allocate(key, "video_objs_arr"),
      info: MemoryPool.allocate(key, "video", view),
      objs_canvas: objs_canvas,
      video_bg: MemoryPool.allocate(key, "video_bg", view),
      key: key,
      sign: "通知视频渲染--main",
    });
    resolve(`通知 ${view} 完毕`);
  });
}
// 通知bev分割图渲染
function noticeBev(key) {
  return new Promise(async (resolve, reject) => {
    let info = MemoryPool.allocate(key, "bev");
    // console.log(Date.now(), key, "-----------------通知bev分割图渲染", info);
    ObserverInstance.emit("DRAW_BEV", {
      basic_data: MemoryPool.allocate(key, "basic"),
      objs: MemoryPool.allocate(key, "obj"),
      info: info,
      key: key,
    });
    resolve(`通知 bev 完毕`);
  });
}
// 计算点坐标数据
let view_i = {
    0: "foresight",
    3: "rearview",
    1: "right_front",
    5: "right_back",
    4: "left_back",
    2: "left_front",
  },
  K = {},
  ext_lidar2cam = {};
async function handleObjsPoints(base, objs) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 6; i++) {
      K[view_i[i]] = construct2DArray(base[4][i], 3, 3);
      ext_lidar2cam[view_i[i]] = construct2DArray(base[3][i], 4, 4);
    }
    for (let j = 0; j < objs.length; j++) {
      let data = {
        points_eight: [],
        foresight: [],
        rearview: [],
        right_front: [],
        right_back: [],
        left_back: [],
        left_front: [],
      };

      let a = objs[j].slice(0, 6);
      data.points_eight = await GetBoundingBoxPoints(...a, objs[j][9]);
      let view_sign = {
        foresight: 0,
        rearview: 0,
        right_front: 0,
        right_back: 0,
        left_back: 0,
        left_front: 0,
      };
      data.points_eight.filter((item) => {
        let pt_cam_z;
        for (let e in view_sign) {
          const transposeMatrix = math.inv(ext_lidar2cam[e]);
          pt_cam_z =
            item[0] * transposeMatrix[2][0] +
            item[1] * transposeMatrix[2][1] +
            item[2] * transposeMatrix[2][2] +
            transposeMatrix[2][3];
          if (pt_cam_z < 0.2) {
            view_sign[e]++;
          }
        }
      });

      data.points_eight.filter((item) => {
        for (let e in view_sign) {
          if (view_sign[e] === 8) {
            data[e].push([-1, -1]);
          } else {
            data[e].push(
              project_lidar2img(item, ext_lidar2cam[e], K[e], base[5], base[6])
            );
          }
        }
      });
      objs[j].push(data);
    }
    resolve(objs);
  });
}
function handleVideoStatus(e) {
  video_status.value[e.id] = true;
}
onBeforeMount(() => {
  ObserverInstance.emit("BEV_CLEAR");
});
onUnmounted(() => {
  ObserverInstance.emit("BEV_CLEAR");
});
</script>

<style lang="scss" scoped>
.my_page {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0a439a;
  background-image: url("@/assets/images/bg_big.png");
  background-repeat: no-repeat;
  background-size: 100% 100%;
  position: relative;
  box-sizing: border-box;
  padding: 0 0.1rem 0.1rem;
  // color: rgb(53, 54, 48);
  .bg_box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4.14rem;
    background: url("@/assets/images/bg_color.png") no-repeat;
    background-size: 100% 100%;
  }
  .page_title {
    width: 100%;
    height: 0.56rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
    .logo_box {
      width: 2.86rem;
      height: 0.56rem;
      background: url("@/assets/images/logo_bg.png") no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      display: flex;
      // align-items: center;
      justify-content: center;
      padding-top: 0.09rem;
      .logo_img {
        // width: 1rem;
        height: 0.26rem;
      }
    }
  }
  .page_main {
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    flex: 1;
    display: flex;
    align-items: center;
    .data_box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      margin-right: 0.11rem;
      .top_box {
        height: 2rem;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative;
        margin-bottom: 0.14rem;
        .v_box {
          height: 100%;
          width: 50%;
        }
        .v_box:first-child {
          margin-right: 0.12rem;
        }
      }
      .bottom_box {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        .left_box,
        .right_box {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          .v_box {
            width: 100%;
            height: 50%;
          }
          .v_box:first-child {
            margin-bottom: 0.15rem;
          }
        }
        .left_box {
          margin-right: 0.11rem;
        }
        .right_box {
          margin-left: 0.11rem;
        }
        .center_box {
          height: 100%;
          width: 2.59rem;
          flex-shrink: 0;
        }
      }
    }
  }
}
.echarts_demos {
  width: 2.07rem;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  .echarts_box,
  .axis_box {
    border: 0.01rem solid #278ff0;
    border-radius: 0.05rem;
    background-color: rgba(13, 51, 118, 0.8);
    box-sizing: border-box;
    width: 100%;
    height: 50%;
  }
  .echarts_box {
    margin-bottom: 0.13rem;
  }
}
.v_box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0.01rem solid #278ff0;
  border-radius: 0.05rem;
  background-color: rgba(13, 51, 118, 0.8);
}
</style>
