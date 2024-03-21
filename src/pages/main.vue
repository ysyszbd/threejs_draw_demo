<template>
  <div class="my_page">
    <!-- <div class="key_css">{{ key_time }}</div> -->
    <!-- <canvas id="key_canvas" width="704" height="256"></canvas>
    <canvas id="objs_canvas" width="704" height="256"></canvas> -->
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
import {
  ref,
  inject,
  defineProps,
  onUnmounted,
  onBeforeMount,
  onMounted,
} from "vue";
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
  key_time = ref(),
  MemoryPool = inject("$MemoryPool"),
  drawWorker = new Worker(
    new URL("../controls/demo_worker.js", import.meta.url)
  ),
  video_start = ref(false),
  video_status = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  video_start_sign = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  key_canvas = ref(),
  key_ctx = ref(),
  objs_canvas = ref(),
  objs_ctx = ref(),
  observerListenerList = [
    {
      eventName: "VIDEO_OK",
      fn: handleVideoStatus.bind(this),
    },
  ];
let old_object = ref();
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
let objsMap = new Map(),
  key_arr = ref([]),
  old_key = ref();
const props = defineProps(["initStatus"]);
onMounted(() => {
  // key_canvas.value = document.getElementById("key_canvas");
  // key_ctx.value = key_canvas.value.getContext("2d");
  // objs_canvas.value = document.getElementById("objs_canvas");
  // objs_ctx.value = objs_canvas.value.getContext("2d");
});
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
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
        if (video_start.value) {
          // console.log(
          //   Date.now(),
          //   "----------开始处理bev",
          //   object[0]
          // );
          MemoryPool.setKey(object[0]);
          // console.log(Date.now(), "----------开始处理111", object[4].length);
          object[4] = await handleObjsPoints(object[2], object[4]);
          // 处理障碍物信息--给bev用
          let objs = await handleObjs(object[4]);
          MemoryPool.setData(object[0], objs, "obj");
          // console.log(Date.now(), "----------bev、障碍物信息处理完毕");
          // 障碍物--给视频使用
          MemoryPool.setData(object[0], object[4], "video_objs_arr");
          // 超参信息
          MemoryPool.setData(object[0], object[2], "basic");
          // bev离屏canvas存放
          MemoryPool.setData(object[0], object[3], "bev");
        }
        // console.log(Date.now(), "-----------开始解码视频", object[0]);
        Promise.all([
          foresight.value.postVideo(object[1][0], object[0], "foresight"),
          rearview.value.postVideo(object[1][3], object[0], "rearview"),
          left_front.value.postVideo(object[1][2], object[0], "left_front"),
          left_back.value.postVideo(object[1][4], object[0], "left_back"),
          right_front.value.postVideo(object[1][1], object[0], "right_front"),
          right_back.value.postVideo(object[1][5], object[0], "right_back"),
        ]);
        updateVideo();
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
// animate();
// 渲染循环
function animate() {
  updateVideo();
  requestAnimationFrame(() => animate());
}
// 更新视频--按照视频帧
function updateVideo() {
  let key;
  if (MemoryPool.keyArr.length < 1) return;
  // console.log(MemoryPool.keyArr, "keyArr=============");
  key = MemoryPool.keyArr[0];

  // 判断6路视频是否都已经离屏渲染并存放完毕
  if (
    MemoryPool.hasVideo(key, "foresight") &&
    MemoryPool.hasVideo(key, "rearview") &&
    MemoryPool.hasVideo(key, "right_front") &&
    MemoryPool.hasVideo(key, "right_back") &&
    MemoryPool.hasVideo(key, "left_back") &&
    MemoryPool.hasVideo(key, "left_front")
  ) {
    key = MemoryPool.getKey();
    old_key.value = key;
    key_time.value = key;
    // console.log(Date.now(), "-----------通知视频、bev渲染", key);
    Promise.all([
      noticeBev(key),
      noticeVideo(key, "foresight"),
      noticeVideo(key, "rearview"),
      noticeVideo(key, "right_front"),
      noticeVideo(key, "left_front"),
      noticeVideo(key, "right_back"),
      noticeVideo(key, "left_back"),
    ]).then((res) => {
      // console.log(Date.now(), "通知更新帧--------------------完毕", key);
      MemoryPool.delVideoValue(key, "video_bg", "foresight");
      MemoryPool.delVideoValue(key, "video_bg", "rearview");
      MemoryPool.delVideoValue(key, "video_bg", "right_front");
      MemoryPool.delVideoValue(key, "video_bg", "right_back");
      MemoryPool.delVideoValue(key, "video_bg", "left_back");
      MemoryPool.delVideoValue(key, "video_bg", "left_front");
      MemoryPool.delVideoValue(key, "video", "foresight");
      MemoryPool.delVideoValue(key, "video", "rearview");
      MemoryPool.delVideoValue(key, "video", "right_front");
      MemoryPool.delVideoValue(key, "video", "right_back");
      MemoryPool.delVideoValue(key, "video", "left_back");
      MemoryPool.delVideoValue(key, "video", "left_front");
      MemoryPool.delObjsValue(key);
    });
  }
}
// 接受视频解码的数据，通知去离屏渲染
async function updataVideoStatus(message) {
  // if (video_start_sign.value[message.view])
  if (!video_start.value) {
    video_start.value = true;
    return;
  }
  if (!MemoryPool.allocate(message.key, "video_objs_arr")) return;
  MemoryPool.setData(message.key, message.info, "video", message.view);

  await drawVideoBg(
    message.info,
    MemoryPool.allocate(message.key, "video_objs_arr"),
    message.view,
    message.key
  ).then((imageBitmap) => {
    MemoryPool.setData(message.key, imageBitmap, "video_bg", message.view);
  });
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
function drawVideoBg(info, objs, view, key) {
  // console.log("info, objs, view-------------", key);
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
      // if (view === "foresight") {
      //   console.log(item, "item===============key", key);
      // }
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
    // console.log(Date.now(), "-----------------通知bev分割图渲染");
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
  .key_css {
    width: 3rem;
    height: 1.2rem;
    font-size: 0.3rem;
    color: #000;
    position: relative;
    z-index: 2;
  }
  // color: rgb(53, 54, 48);
  .bg_box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url("@/assets/images/bg_color.png") no-repeat;
    background-size: 100% 100%;
  }
  .page_title {
    width: 100%;
    height: calcHight(113);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
    position: relative;
    z-index: 1;
    .logo_box {
      width: 572px;
      height: 100%;
      background: url("@/assets/images/logo_bg.png") no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      padding-top: calcHight(18);
      .logo_img {
        height: calcHight(32);
      }
    }
  }
  .page_main {
    box-sizing: border-box;
    flex: 1;
    display: flex;
    align-items: center;
    .data_box {
      width: calc(100% - 414px);
      height: 100%;
      display: flex;
      flex-direction: column;
      margin-right: 22px;
      .top_box {
        height: calcHight(310);
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative;
        margin-bottom: calcHight(26);
        .v_box {
          height: 100%;
          width: 50%;
        }
        .v_box:first-child {
          margin-right: 12.5px;
        }
      }
      .bottom_box {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 22px;
        // justify-content: center;
        .left_box,
        .right_box {
          width: 414px;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          .v_box {
            width: 100%;
            height: calc((100% - calcHight(30)) / 2);
          }
          .v_box:first-child {
            margin-bottom: calcHight(30);
          }
        }
        .center_box {
          height: 100%;
          flex: 1;
          flex-shrink: 0;
        }
      }
    }
  }
}
.echarts_demos {
  width: 414px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  .echarts_box,
  .axis_box {
    border: 1px solid #278ff0;
    border-radius: 10px;
    background-color: rgba(13, 51, 118, 0.8);
    box-sizing: border-box;
    width: 100%;
    height: calc((100% - calcHight(27)) / 2);
  }
  .echarts_box {
    margin-bottom: calcHight(27);
  }
}
.v_box {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #278ff0;
  border-radius: 10px;
  background-color: rgba(13, 51, 118, 0.8);
}
</style>
