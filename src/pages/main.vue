<!--
 * @LastEditTime: 2024-03-05 16:52:23
 * @Description: init
-->
<template>
  <div class="my_page">
    <div class="l_box">
      <videoYH
        ref="foresight"
        id="foresight"
        :video_id="'foresight'"
        :class="[`v_1`, 'v_box']"
      />
      <div class="line_box_h">
        <div class="line"></div>
      </div>
      <videoYH
        ref="rearview"
        id="rearview"
        :video_id="'rearview'"
        :class="[`v_1`, 'v_box']"
      />
    </div>
    <div class="r_box">
      <div class="videos_box">
        <videoYH
          ref="right_front"
          id="right_front"
          :video_id="'right_front'"
          :class="[`v_1`, 'v_box']"
        />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH
          ref="right_back"
          id="right_back"
          :video_id="'right_back'"
          :class="[`v_2`, 'v_box']"
        />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH
          ref="left_back"
          id="left_back"
          :video_id="'left_back'"
          :class="[`v_3`, 'v_box']"
        />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH
          ref="left_front"
          id="left_front"
          :video_id="'left_front'"
          :class="[`v_4`, 'v_box']"
        />
      </div>
      <div class="bev">
        <!-- <threeDemo /> -->
        <Bev />
      </div>
    </div>
    <div class="echarts_demos" id="e_demos">
      <echartsYH id="echarts_box"/>
      <!-- <Echarts /> -->
    </div>
  </div>
</template>

<script setup>
import threeDemo from "./three_demo.vue";
import videoYH from "./view_video.vue";
import Bev from "./bev.vue";
import echartsYH from "./echarts.vue"
import { ref, onMounted, defineProps } from "vue";
import Ws from "../controls/ws.js";
import { decode } from "@msgpack/msgpack";
import demo_data from "../assets/demo_data/demos.json";
import { GetBoundingBoxPoints, project_lidar2img } from "@/controls/box2img.js";

let foresight = ref(),
  rearview = ref(),
  right_front = ref(),
  right_back = ref(),
  left_back = ref(),
  left_front = ref();
const props = defineProps(["work_status"]);
const ws = new Ws("ws://192.168.30.9:12347", true, async (e) => {
  // const ws = new Ws("ws://192.168.30.4:1234", true, async (e) => {
  try {
    if (!props.work_status) return;
    let arr = await handlePoints(demo_data);
    console.log(arr, "arr");
    // foresight.value.updataCode([], arr),
    // rearview.value.updataCode([], arr),
    // right_front.value.updataCode([], arr),
    // right_back.value.updataCode([], arr),
    // left_back.value.updataCode([], arr),
    // left_front.value.updataCode([], arr);
    if (e.data instanceof ArrayBuffer) {
      const object = decode(e.data);
      console.log(object, "object=====");
      const res = Promise.all([
        foresight.value.updataCode(object[2], arr),
        rearview.value.updataCode(object[2], arr),
        right_front.value.updataCode(object[2], arr),
        right_back.value.updataCode(object[2], arr),
        left_back.value.updataCode(object[2], arr),
        left_front.value.updataCode(object[2], arr),
        // foresight.value.updataCode(object[1][0], arr),
        // rearview.value.updataCode(object[1][0], arr),
        // right_front.value.updataCode(object[1][0], arr),
        // right_back.value.updataCode(object[1][0], arr),
        // left_back.value.updataCode(object[1][0], arr),
        // left_front.value.updataCode(object[1][0], arr),
      ]);
      // }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});

async function handlePoints(data) {
  return new Promise(async (resolve, reject) => {
    let arr = data.lidar,
      camera = data.camera;
    for (let i = 0; i < arr.length; i++) {
      // if (!camera[arr[i].id + "-" + type]) return;
      let position = arr[i].annotation.data.position,
        dimension = arr[i].annotation.data.dimension,
        rotation = arr[i].annotation.data.rotation;
      arr[i]["points_eight"] = await GetBoundingBoxPoints(
        position.x,
        position.y,
        position.z,
        dimension.l,
        dimension.w,
        dimension.h,
        0,
        0,
        rotation.z
      );
      arr[i][`left_back`] = [];
      arr[i][`left_front`] = [];
      arr[i][`foresight`] = [];
      arr[i][`right_back`] = [];
      arr[i][`right_front`] = [];
      arr[i][`rearview`] = [];
      arr[i]["points_eight"].forEach((item) => {
        arr[i][`left_back`].push(project_lidar2img(item, "left_back"));
        arr[i][`left_front`].push(project_lidar2img(item, "left_front"));
        arr[i][`foresight`].push(project_lidar2img(item, "foresight"));
        arr[i][`right_back`].push(project_lidar2img(item, "right_back"));
        arr[i][`right_front`].push(project_lidar2img(item, "right_front"));
        arr[i][`rearview`].push(project_lidar2img(item, "rearview"));
      });
      // // 获取障碍物中心点坐标
      // let p = [position.x, position.y, position.z];
      // arr[i][`left_back_point`] = project_lidar2img(p, "left_back");
      // arr[i][`left_front_point`] = project_lidar2img(p, "left_front");
      // arr[i][`foresight_point`] = project_lidar2img(p, "foresight");
      // arr[i][`right_back_point`] = project_lidar2img(p, "right_back");
      // arr[i][`right_front_point`] = project_lidar2img(p, "right_front");
      // arr[i][`rearview_point`] = project_lidar2img(p, "rearview");
    }
    resolve(arr);
  });
}
</script>

<style lang="scss" scoped>
.my_page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  .l_box {
    width: 30%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(#0b364c, #126db3, #0b364c);
    border-right: 2px solid;
    border-image-source: linear-gradient(#154c75, #0c97d2, #154c75);
    border-image-slice: 1;
    box-sizing: border-box;
    .v_box {
      width: 100%;
      height: 49%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .r_box {
    width: 50%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .bev {
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    .videos_box {
      width: 100%;
      height: 40%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(
        to left,
        rgba(11, 54, 76, 0.98),
        #126db3,
        rgba(11, 54, 76, 0.98)
      );
      border-bottom: 2px solid;
      border-image-source: linear-gradient(to right, #154c75, #0c97d2, #154c75);
      border-image-slice: 1;
      box-sizing: border-box;
      position: relative;
      .v_box {
        width: 25%;
        height: 100%;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
  .line_box_h {
    width: 100%;
    height: 6px;
    box-sizing: border-box;
    padding: 0 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #ff0000;
    .line {
      width: 100%;
      height: 1px;
      box-sizing: border-box;
      border-bottom: 2px solid;
      border-image: -webkit-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
      border-image: -moz-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
      border-image: linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
    }
  }
  .line_box_v {
    height: 100%;
    width: 6px;
    box-sizing: border-box;
    padding: 12px 0;
    display: flex;
    justify-content: center;
    align-items: center;
    .line {
      width: 1px;
      height: 100%;
      box-sizing: border-box;
      border-right: 2px solid;
      border-image: -webkit-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
      border-image: -moz-linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
      border-image: linear-gradient(
          0deg,
          rgba(255, 255, 255, 0) -4%,
          #0c97d2 50%,
          rgba(255, 255, 255, 0) 104%
        )
        2 2 2 2;
    }
  }
  .echarts_demos {
    width: 650px;
    height: 100%;
  }
}
</style>
