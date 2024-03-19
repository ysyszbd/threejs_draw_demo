<!--
 * @LastEditTime: 2024-03-19 20:47:13
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
  handleObjs,
  handleObjsPoints,
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
  num = ref(0);
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
const props = defineProps(["initStatus"]);
// animate();
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    let object;
    if (e.data instanceof ArrayBuffer) {
      object = decode(e.data);
      console.log(Date.now(), "-----------获取数据");
      object[4] = await handleObjsPoints(object[2], object[4]);
      // 处理障碍物信息--给bev用
      let objs = await handleObjs(object[4]);
      foresight.value.getData({
        video: object[1][0],
        objs: object[4],
        basic: object[2],
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
  } catch (err) {
    console.log(err, "err----WS");
  }
});
function animate() {
  num.value++;
  updateVideo();
  requestAnimationFrame(() => animate());
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
