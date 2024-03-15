<!--
 * @LastEditTime: 2024-03-15 18:25:07
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
import threeDemo from "./three_demo.vue";
import videoYH from "./view_video.vue";
import Bev from "./bev.vue";
import echartsYH from "./echarts.vue";
import echartAxis from "./echartAxis.vue";
import { ref, inject, defineProps, provide } from "vue";
import { ObserverInstance } from "@/controls/event/observer";
import Ws from "../controls/ws.js";
import { decode } from "@msgpack/msgpack";
import {
  GetBoundingBoxPoints,
  project_lidar2img,
  construct2DArray,
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
  ];
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
let view_i = {
  0: "foresight",
  3: "rearview",
  1: "right_front",
  5: "right_back",
  4: "left_back",
  2: "left_front",
};
let K = ref({}),
  ext_lidar2cam = ref({});
const props = defineProps(["initStatus"]);
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
        console.log(object, "object");
        // return
        object[4] = await handleObjPoints(object[2], object[4]);
        Promise.all([
          foresight.value.postVideo(object[1][0], object[0]),
          rearview.value.postVideo(object[1][3], object[0]),
          left_front.value.postVideo(object[1][2], object[0]),
          left_back.value.postVideo(object[1][4], object[0]),
          right_front.value.postVideo(object[1][1], object[0]),
          right_back.value.postVideo(object[1][5], object[0]),
        ]);
        if (video_start.value) {
          MemoryPool.free(object[0], object[4], "obj");
          MemoryPool.free(object[0], object[3], "bev");
          MemoryPool.free(object[0], object[2], "basic");
          MemoryPool.setKey(object[0]);
        }
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
// 更新视频解码
function updataVideoStatus(message) {
  if (!video_start.value) video_start.value = true;
  // console.log(message, "message-----------key", MemoryPool.keyArr);
  MemoryPool.free(message.key, message.info, "video", message.view);
  if (
    MemoryPool.hasVideo(message.key, "foresight") &&
    MemoryPool.hasVideo(message.key, "rearview") &&
    MemoryPool.hasVideo(message.key, "right_front") &&
    MemoryPool.hasVideo(message.key, "right_back") &&
    MemoryPool.hasVideo(message.key, "left_back") &&
    MemoryPool.hasVideo(message.key, "left_front") && MemoryPool.keyArr.length > 1
  ) {
    // console.log(MemoryPool.keyArr, "key========");
    // console.log(MemoryPool.video["foresight"], "video========");
    let key = MemoryPool.getKey();
    if (!key) return;
    Promise.all([
      noticeVideo(key, "foresight"),
      noticeVideo(key, "rearview"),
      noticeVideo(key, "right_front"),
      noticeVideo(key, "right_back"),
      noticeVideo(key, "left_back"),
      noticeBev(key),
      noticeVideo(key, "left_front"),
    ]).then((res) => {
      MemoryPool.delObjsValue(key);
    });
  }
}
function noticeVideo(key, view) {
  return new Promise((resolve, reject) => {
    // console.log(key, "key===============");
    let video = MemoryPool.allocate(key, "video", view);
    // console.log(video, "video------------", MemoryPool.video[view]);
    ObserverInstance.emit("VIDEO_DRAW", {
      view: view,
      objs: MemoryPool.allocate(key, "obj"),
      info: video,
    });
    resolve(`通知 ${view} 完毕`);
  });
}
function noticeBev(key) {
  return new Promise((resolve, reject) => {
    console.log(Date.now(), "-----------bev1");
    ObserverInstance.emit("DRAW_BEV", {
      basic_data: MemoryPool.allocate(key, "basic"),
      objs: MemoryPool.allocate(key, "obj"),
      info: MemoryPool.allocate(key, "bev"),
    });
    resolve(`通知 bev 完毕`);
  });
}
function handleVideoStatus(e) {
  video_status.value[e.id] = true;
}
async function handleObjPoints(base, objs) {
  try {
    return new Promise(async (resolve, reject) => {
      // console.log(base, "base");
      for (let i = 0; i < 6; i++) {
        K.value[view_i[i]] = construct2DArray(base[4][i], 3, 3);
        ext_lidar2cam.value[view_i[i]] = construct2DArray(base[3][i], 4, 4);
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
        data.points_eight.forEach((item) => {
          data.foresight.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["foresight"],
              K.value["foresight"],
              base[5],
              base[6]
            )
          );
          data.rearview.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["rearview"],
              K.value["rearview"],
              base[5],
              base[6]
            )
          );
          data.right_front.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["right_front"],
              K.value["right_front"],
              base[5],
              base[6]
            )
          );
          data.right_back.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["right_back"],
              K.value["right_back"],
              base[5],
              base[6]
            )
          );
          data.left_back.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["left_back"],
              K.value["left_back"],
              base[5],
              base[6]
            )
          );
          data.left_front.push(
            project_lidar2img(
              item,
              ext_lidar2cam.value["left_front"],
              K.value["left_front"],
              base[5],
              base[6]
            )
          );
        });
        objs[j].push(data);
      }
      resolve(objs);
    });
  } catch (err) {}
}
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
  .echarts_box, .axis_box {
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
