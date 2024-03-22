<!--
 * @LastEditTime: 2024-03-22 17:26:27
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
import { handleObjs, handleObjsPoints } from "@/controls/box2img.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref(),
  BEV = ref(),
  MemoryPool = inject("$MemoryPool"),
  drawWorker = new Worker(
    new URL("../controls/demo_worker.js", import.meta.url)
  ),
  video_ok_key = ref(),
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
  observerListenerList = [
    {
      eventName: "VIDEO_OK",
      fn: handleVideoStatus.bind(this),
    },
  ];
drawWorker.onmessage = (e) => {
  if (e.data.sign === "draw_bev&objs") {
    MemoryPool.setData(e.data.key, e.data.imageBitmap, "bev");
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["foresight"],
      "video_objs",
      "foresight"
    );
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["rearview"],
      "video_objs",
      "rearview"
    );
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["right_front"],
      "video_objs",
      "right_front"
    );
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["right_back"],
      "video_objs",
      "right_back"
    );
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["left_back"],
      "video_objs",
      "left_back"
    );
    MemoryPool.setData(
      e.data.key,
      e.data.objs_imageBitmap["left_front"],
      "video_objs",
      "left_front"
    );
  }
};
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    let object;
    if (e.data instanceof ArrayBuffer) {
      object = decode(e.data);
      let key = object[0];
      // console.log(object, "object============");
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
            drawWorker.postMessage({
              sign: "draw_bev&objs",
              key: key,
              bev_w: object[2][1],
              bev_h: object[2][2],
              bev: object[3],
              objs: object[4],
            });
            // 处理障碍物信息--给bev用
            let objs = await handleObjs(object[4]);
            MemoryPool.setData(object[0], objs, "obj");
            // 超参信息
            MemoryPool.setData(object[0], object[2], "basic");
          }
        }
      }
      if (object[1].length > 0) {
        Promise.all([
          foresight.value.getData({
            video: object[1][0],
            key: key,
          }),
          rearview.value.getData({
            video: object[1][3],
            key: key,
          }),
          right_front.value.getData({
            video: object[1][1],
            key: key,
          }),
          right_back.value.getData({
            video: object[1][5],
            key: key,
          }),
          left_back.value.getData({
            video: object[1][4],
            key: key,
          }),
          left_front.value.getData({
            video: object[1][2],
            key: key,
          }),
        ]);
      }
      // updateVideo();
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
animate();
function animate() {
  updateVideo();
  requestAnimationFrame(() => animate());
}
// 更新视频--按照视频帧
function updateVideo() {
  let key;
  if (MemoryPool.keyArr.length < 1) return;
  key = MemoryPool.keyArr[0];
  console.log(key, "=======MemoryPool", MemoryPool);
  if (
    MemoryPool.objs.has(key) &&
    MemoryPool.bevs.has(key) &&
    MemoryPool.basic_data.has(key) &&
    MemoryPool.hasVideoObjs(key) &&
    MemoryPool.hasVideo(key)
  ) {
    key = MemoryPool.getKey();
    // console.log(Date.now(), "-----------", MemoryPool);
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
  // debugger
  console.log(message, "message-------------")
  let res = 0;
  for (const [key, value] of Object.entries(video_status_ok.value)) {
    if (!value) res++;
  }
  if (!video_status_ok.value[message.view]) {
    video_status_ok.value[message.view] = true;
  }
  if (res > 1) return;
  if (res === 1) {
    video_ok_key.value = message.key; // 最后一个video也准备完毕了
    return;
  }
  
  MemoryPool.setData(
    message.key,
    { w: message.width, h: message.height },
    "video",
    message.view
  );
  MemoryPool.setData(message.key, message.data, "video_bg", message.view);
}

// 通知视频渲染
function noticeVideo(key, view) {
  return new Promise(async (resolve, reject) => {
    ObserverInstance.emit("VIDEO_DRAW", {
      view: view,
      info: MemoryPool.allocate(key, "video", view),
      video_bg: MemoryPool.allocate(key, "video_bg", view),
      video_objs: MemoryPool.allocate(key, "video_objs", view),
      key: key,
      sign: "通知视频渲染--main",
    });
    resolve(`通知 ${view} 完毕`);
  });
}
// 通知bev分割图渲染
function noticeBev(key) {
  return new Promise(async (resolve, reject) => {
    let bev = MemoryPool.allocate(key, "bev");
    ObserverInstance.emit("DRAW_BEV", {
      basic_data: MemoryPool.allocate(key, "basic"),
      objs: MemoryPool.allocate(key, "obj"),
      bev: bev,
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
