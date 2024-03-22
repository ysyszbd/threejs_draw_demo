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
  handleObjsPoints,
  handleObjs,
  drawVideoBg,
  drawBev,
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
  video_ok_key = ref(),
  video_start = ref(false),
  video_status = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  video_status_ok = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  num = ref(0),
  now_time = ref(new Map()),
  now_decode_time = ref(new Map()),
  draw_time = ref([]),
  decode_time = ref([]),
  time = ref([]),
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
// drawWorker.onmessage = (e) => {
//   console.log(e.data, "ppppppppppppppp");
//   if (e.data.sign === "draw_bev") {
//     MemoryPool.setData(e.data.key, bev_imageBitmap, "bev");
//   }
//   console.log(Date.now(), "--------拿到worker处理的bev图形");
// }
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    let object;
    if (e.data instanceof ArrayBuffer) {
      object = decode(e.data);
      let key = object[0];
      if (
        video_status_ok.value["foresight"] &&
        video_status_ok.value["rearview"] &&
        video_status_ok.value["right_front"] &&
        video_status_ok.value["right_back"] &&
        video_status_ok.value["left_back"] &&
        video_status_ok.value["left_front"] &&
        object[0] > video_ok_key.value
      ) {
        let key_res = MemoryPool.keyArr.includes(key);
        if (!key_res) MemoryPool.setKey(key);
        if (object[2][1] != 0 && object[2][2] != 0) {
          if (!MemoryPool.objs.has(key)) {
            object[4] = await handleObjsPoints(object[2], object[4]);
            // console.log(Date.now(), "--------发送消息给worker处理bev图形");
            // drawWorker.postMessage({
            //   sign: "draw_bev",
            //   key: key,
            //   w: object[2][1],
            //   h: object[2][2],
            //   bev: object[3]
            // })
            // 处理障碍物信息--给bev用
            let objs = await handleObjs(object[4]);
            MemoryPool.setData(object[0], objs, "obj");
            // 障碍物--给视频使用
            MemoryPool.setData(object[0], object[4], "video_objs_arr");
            // 超参信息
            MemoryPool.setData(object[0], object[2], "basic");
            // bev离屏canvas存放
            console.log(Date.now(), "--------0");
            let bev_imageBitmap = await drawBev({
              basic_data: object[2],
              info: object[3],
            });
            console.log(Date.now(), "--------1");
            MemoryPool.setData(object[0], bev_imageBitmap, "bev");
          }
        }
      }
      if (object[1].length > 0) {
        Promise.all([
          foresight.value.postVideo(object[1][0], object[0], "foresight"),
          rearview.value.postVideo(object[1][3], object[0], "rearview"),
          left_front.value.postVideo(object[1][2], object[0], "left_front"),
          left_back.value.postVideo(object[1][4], object[0], "left_back"),
          right_front.value.postVideo(object[1][1], object[0], "right_front"),
          right_back.value.postVideo(object[1][5], object[0], "right_back"),
        ]);
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});

animate();
// 渲染循环
// if (num.value <= 52) {
function animate() {
  updateVideo();
  requestAnimationFrame(() => animate());
}
// }
// 更新视频--按照视频帧
function updateVideo() {
  let key;
  if (MemoryPool.keyArr.length < 1) return;
  key = MemoryPool.keyArr[0];
  // 判断6路视频是否都已经离屏渲染并存放完毕
  if (
    MemoryPool.objs.has(key) &&
    MemoryPool.bevs.has(key) &&
    MemoryPool.basic_data.has(key) &&
    MemoryPool.video_objs_arr.has(key) &&
    MemoryPool.hasVideo(key, "foresight") &&
    MemoryPool.hasVideo(key, "rearview") &&
    MemoryPool.hasVideo(key, "right_front") &&
    MemoryPool.hasVideo(key, "right_back") &&
    MemoryPool.hasVideo(key, "left_back") &&
    MemoryPool.hasVideo(key, "left_front")
  ) {
    key = MemoryPool.getKey();
    Promise.all([
      noticeBev(key),
      noticeVideo(key, "foresight"),
      noticeVideo(key, "rearview"),
      noticeVideo(key, "right_front"),
      noticeVideo(key, "left_front"),
      noticeVideo(key, "right_back"),
      noticeVideo(key, "left_back"),
    ]).then((res) => {
      MemoryPool.delObjsValue(key);
    });
  }
}
// 接受视频解码的数据，通知去离屏渲染
async function updataVideoStatus(message) {
  let res = 0;
  for (const [key, value] of Object.entries(video_status_ok.value)) {
    if (!value) res++;
  }
  if (!video_status_ok.value[message.view]) {
    video_status_ok.value[message.view] = true;
  }
  if (res > 1) return;
  if (res === 1) {
    video_ok_key.value = message.key;// 最后一个video也准备完毕了
    return;
  }
  MemoryPool.setData(message.key, message.info, "video", message.view);
  await drawVideoBg(
    message.info
  ).then((imageBitmap) => {
    MemoryPool.setData(message.key, imageBitmap, "video_bg", message.view);
  });
}
// 通知视频渲染
function noticeVideo(key, view) {
  return new Promise(async (resolve, reject) => {
    ObserverInstance.emit("VIDEO_DRAW", {
      view: view,
      objs: MemoryPool.allocate(key, "video_objs_arr"),
      info: MemoryPool.allocate(key, "video", view),
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
    ObserverInstance.emit("DRAW_BEV", {
      basic_data: MemoryPool.allocate(key, "basic"),
      objs: MemoryPool.allocate(key, "obj"),
      info: info,
      key: key,
    });
    resolve(`通知 bev 完毕`);
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
  padding: 0 20px 20px;
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
    height: 57px;
    flex-shrink: 0;
    // height: calcHight(113);
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 8px;
    position: relative;
    z-index: 1;
    .logo_box {
      width: 286px;
      height: 100%;
      background: url("@/assets/images/logo_bg.png") no-repeat;
      background-size: 100% 100%;
      box-sizing: border-box;
      display: flex;
      justify-content: center;
      // padding-top: calcHight(18);
      padding-top: 10px;
      .logo_img {
        height: 26px;
        // width: 120px;
        // height: calcHight(32);
      }
    }
  }
  .page_main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex: 1;
    .data_box {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      margin-right: 20px;
      .top_box {
        height: 400px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-shrink: 0;
        box-sizing: border-box;
        position: relative;
        flex-shrink: 0;
        margin-bottom: 20px;
        .v_box {
          height: 100%;
          width: 50%;
        }
        .v_box:first-child {
          margin-right: 12px;
        }
      }
      .bottom_box {
        flex: 1;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        // gap: 22px;
        position: relative;
        z-index: 1;
        .left_box,
        .right_box {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          flex: 1;
          flex-shrink: 0;
          .v_box {
            width: 100%;
            height: 50%;
          }
          .v_box:first-child {
            margin-bottom: 20px;
          }
        }
        .center_box {
          height: 100%;
          width: 100%;
          flex: 1;
          margin: 0 20px;
          border-radius: 8px !important;
        }
      }
    }
  }
}
.echarts_demos {
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  box-sizing: border-box;
  .echarts_box,
  .axis_box {
    width: 100%;
    height: 50%;
    border: 1px solid #278ff0;
    border-radius: 10px;
    background-color: rgba(13, 51, 118, 0.8);
    box-sizing: border-box;
  }
  .echarts_box {
    margin-bottom: 20px;
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
