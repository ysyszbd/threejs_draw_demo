<template>
  <div class="my_page">
    <div class="bg_box"></div>
    <div class="page_title" id="page_title">
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
      <!-- <div class="echarts_demos" id="e_demos">
        <echartsYH id="echarts_box" />
        <echartAxis />
      </div> -->
    </div>
  </div>
</template>

<script setup>
import videoYH from "@/components/view_video.vue";
import Bev from "@/components/bev.vue";
import echartsYH from "@/components/echarts.vue";
import echartAxis from "@/components/echartAxis.vue";
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
import { handleObjsPoints, handleObjs } from "@/controls/box2img.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref(),
  BEV = ref(),
  MemoryPool = new memoryPool(),
  drawWorker = new Worker(
    new URL("../controls/draw_worker.js", import.meta.url)
  ),
  stop = ref(false),
  video_ok_key = ref(),
  video_start = ref(false),
  video_status_ok = ref({
    foresight: false,
    rearview: false,
    right_front: false,
    right_back: false,
    left_back: false,
    left_front: false,
  }),
  animationFrameId = ref(null);
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
const props = defineProps(["initStatus"]);
const ws = new Ws("ws://192.168.1.161:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    let object;
    if (e.data instanceof ArrayBuffer) {
      object = decode(e.data);
      let key = object[0];
      // console.log(object, "object", Date.now());
      // if (
      // video_status_ok.value["foresight"] &&
      // video_status_ok.value["rearview"] &&
      // video_status_ok.value["right_front"] &&
      // video_status_ok.value["right_back"] &&
      // video_status_ok.value["left_back"] &&
      // video_status_ok.value["left_front"] &&
      //   video_ok_key.value &&
      //   key > video_ok_key.value
      // ) {
      // let key_res = MemoryPool.keyArr.includes(key);
      // if (!key_res) MemoryPool.setKey(key);
      //   if (object[2][1] != 0 && object[2][2] != 0) {
      //     if (!MemoryPool.objs.has(key)) {
      //       object[4] = await handleObjsPoints(object[2], object[4]);
      //       drawWorker.postMessage({
      //         sign: "draw_bev&objs",
      //         key: key,
      //         bev_w: object[2][1],
      //         bev_h: object[2][2],
      //         bev: object[3],
      //         objs: object[4],
      //       });
      //       // 处理障碍物信息--给bev用
      //       let objs = await handleObjs(object[4]);
      //       MemoryPool.setData(key, objs, "obj");
      //     }
      //   }
      // }
      if (object[1].length > 0) {
        Promise.all([
          foresight.value.postVideo(object[1][0], key, "foresight"),
          right_front.value.postVideo(object[1][1], key, "right_front"),
          left_front.value.postVideo(object[1][2], key, "left_front"),
          rearview.value.postVideo(object[1][3], key, "rearview"),
          left_back.value.postVideo(object[1][4], key, "left_back"),
          right_back.value.postVideo(object[1][5], key, "right_back"),
        ]);
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});

animate();
function animate() {
  updateVideo();
  animationFrameId.value = requestAnimationFrame(() => animate());
}
// 更新视频--按照视频帧
async function updateVideo() {
  // if (MemoryPool.keyArr[0] > video_ok_key.value) {
  if (MemoryPool.weakKeys[0]?.id > video_ok_key.value) {
    // let key = MemoryPool.keyArr[0];
    let key = MemoryPool.weakKeys[0];
    // 判断6路视频是否都已经离屏渲染并存放完毕
    if (
      // MemoryPool.objs.has(key) &&
      // MemoryPool.bevs.has(key) &&
      // MemoryPool.hasVideoObjs(key) &&
      MemoryPool.hasVideo(key)
    ) {
      // key = MemoryPool.getKey();
      key = MemoryPool.getWeakKeys();
      Promise.all([
        // noticeBev(key),
        await foresight.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "foresight"),
          bg: MemoryPool.allocate(key, "v_bgs", "foresight"),
        }),
        await right_front.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "right_front"),
          bg: MemoryPool.allocate(key, "v_bgs", "right_front"),
        }),
        await left_front.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "left_front"),
          bg: MemoryPool.allocate(key, "v_bgs", "left_front"),
        }),
        await rearview.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "rearview"),
          bg: MemoryPool.allocate(key, "v_bgs", "rearview"),
        }),
        await left_back.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "left_back"),
          bg: MemoryPool.allocate(key, "v_bgs", "left_back"),
        }),
        await right_back.value.drawVideo({
          // bg: MemoryPool.allocate(key, "video_bgs", "right_back"),
          bg: MemoryPool.allocate(key, "v_bgs", "right_back"),
        }),
      ]).then((res) => {
        key = null;
      });
    }
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
  // 最后一个video也准备完毕了
  if (res === 1) {
    video_ok_key.value = message.key;
    return;
  }
  // let weak_key_res = MemoryPool.keyArr.find((item) => {
  //   return item === message.key;
  // });
  // // 这里要确保键对象地址一致
  // if (!weak_key_res) {
  //   MemoryPool.setKey(message.key);
  // }
  // MemoryPool.setData(message.key, message.info, "video_bgs", message.view);
  let weak_id = { id: message.key };
  let weak_key_res = MemoryPool.weakKeys.find((item) => {
    return item.id === message.key;
  });
  // 这里要确保键对象地址一致
  if (!weak_key_res) {
    MemoryPool.setWeakKeys(weak_id);
  } else {
    weak_id = weak_key_res;
  }
  MemoryPool.setData(weak_id, message.info, "v_bgs", message.view);
}
// 通知bev分割图渲染
function noticeBev(key) {
  return new Promise(async (resolve, reject) => {
    let info = MemoryPool.allocate(key, "bev");
    ObserverInstance.emit("DRAW_BEV", {
      objs: MemoryPool.allocate(key, "obj"),
      info: info,
      key: key,
    });
    resolve(`通知 bev 完毕`);
  });
}
onUnmounted(() => {
  MemoryPool.clear();
  drawWorker.terminate();
  ObserverInstance.removeAll();
  cancelAnimationFrame(animationFrameId.value);
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
      padding-top: 10px;
      .logo_img {
        height: 26px;
      }
    }
  }
  .page_main {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    flex: 1;
    box-sizing: border-box;
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
        position: relative;
        box-sizing: border-box;
        z-index: 1;
        .left_box,
        .right_box {
          width: 50%;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
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
          width: 480px;
          flex-shrink: 0;
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
