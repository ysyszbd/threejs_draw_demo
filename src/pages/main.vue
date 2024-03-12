<!--
 * @LastEditTime: 2024-03-12 20:18:56
 * @Description: 
-->
<template>
  <div class="my_page">
    <div class="data_box">
      <div class="top_box">
        <videoYH
          ref="foresight"
          id="foresight"
          :video_id="'foresight'"
          :class="[`v_1`, 'v_box']"
        />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH
          ref="rearview"
          id="rearview"
          :video_id="'rearview'"
          :class="[`v_1`, 'v_box']"
        />
      </div>
      <div class="bottom_box">
        <div class="left_box">
          <videoYH
            ref="right_front"
            id="right_front"
            :video_id="'right_front'"
            :class="[`v_1`, 'v_box']"
          />
          <div class="line_box_h">
            <div class="line"></div>
          </div>
          <videoYH
            ref="right_back"
            id="right_back"
            :video_id="'right_back'"
            :class="[`v_2`, 'v_box']"
          />
        </div>
        <div class="center_box">
          <Bev ref="BEV" :objs_data="demo_data" />
        </div>
        <div class="right_box">
          <videoYH
            ref="left_back"
            id="left_back"
            :video_id="'left_back'"
            :class="[`v_3`, 'v_box']"
          />
          <div class="line_box_h">
            <div class="line"></div>
          </div>
          <videoYH
            ref="left_front"
            id="left_front"
            :video_id="'left_front'"
            :class="[`v_4`, 'v_box']"
          />
        </div>
      </div>
    </div>
    <!-- <div class="echarts_demos" id="e_demos">
      <echartsYH id="echarts_box" />
      <echartAxis />
    </div> -->
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
import demo_data from "../assets/demo_data/demos.json";
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
  objs_data = ref(),
  data = ref({}),
  MemoryPool = inject("$MemoryPool"),
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
provide("data_now", data);
let view_i = {
  0: "foresight",
  1: "rearview",
  2: "right_front",
  3: "right_back",
  4: "left_back",
  5: "left_front",
};
let K = ref({}),
  ext_lidar2cam = ref({});
const props = defineProps(["initStatus"]);
// const ws = new Ws("ws://192.168.30.9:12347", true, async (e) => {
const ws = new Ws("ws://192.168.1.160:1234", true, async (e) => {
  try {
    if (!props.initStatus) return;
    let object;
    if (e.data instanceof ArrayBuffer) {
      // console.log(e.data, "object========");
      if (
        video_status.value["foresight"] &&
        video_status.value["rearview"] &&
        video_status.value["right_front"] &&
        video_status.value["right_back"] &&
        video_status.value["left_back"] &&
        video_status.value["left_front"]
      ) {
        object = decode(e.data);
        object[4] = await handleObjPoints(object[2], object[4]);
        data.value = object;
        // console.log(data.value, "data.value======")
        // if (MemoryPool.pool.length === 0) {
        //   MemoryPool.free(object);
        //   return;
        // } else {
        //   data = MemoryPool.allocate();
        //   MemoryPool.free(object);
        // }

        // const res = Promise.all([
        //   foresight.value.updataCode(
        //     object[1][0],
        //     object[4] // 障碍物数据
        //   ),
        //   rearview.value.updataCode(object[1][1], object[4]),
        //   right_front.value.updataCode(object[1][2], object[4]),
        //   right_back.value.updataCode(object[1][3], object[4]),
        //   left_back.value.updataCode(object[1][4], object[4]),
        //   left_front.value.updataCode(object[1][5], object[4]),
        //   // BEV.value.updataBev(data[3], data[2], data[4]),
        // ]);
        Promise.all([
          foresight.value.updataCode(
            object[1][0],
            object[4] // 障碍物数据
          ),
          rearview.value.updataCode(object[1][1], object[4]),
        ]);
        await Promise.all([
          ]);
          Promise.all([
          right_front.value.updataCode(object[1][2], object[4]),
          right_back.value.updataCode(object[1][3], object[4]),
          left_back.value.updataCode(object[1][4], object[4]),
          left_front.value.updataCode(object[1][5], object[4]),
        ]);
        // foresight.value.updataCode(
        //   object[1][0],
        //   object[4] // 障碍物数据
        // );
        // rearview.value.updataCode(object[1][1], object[4]);
        // right_front.value.updataCode(object[1][2], object[4]);
        // right_back.value.updataCode(object[1][3], object[4]);
        // left_back.value.updataCode(object[1][4], object[4]);
        // left_front.value.updataCode(object[1][5], object[4]);
      }
    }
  } catch (err) {
    console.log(err, "err----WS");
  }
});
function handleVideoStatus(e) {
  video_status.value[e.id] = true;
}
async function handleObjPoints(base, objs) {
  try {
    return new Promise(async (resolve, reject) => {
      for (let i = 0; i < 6; i++) {
        K.value[view_i[i]] = construct2DArray(base[4][i], 3, 3);
        ext_lidar2cam.value[view_i[i]] = construct2DArray(base[3][i], 4, 4);
      }
      for (let j = 0; j < objs.length; j++) {
        if (objs[j].length != 0) {
          for (let e = 0; e < objs[j].length; e++) {
            let data = {
              points_eight: [],
              foresight: [],
              rearview: [],
              right_front: [],
              right_back: [],
              left_back: [],
              left_front: [],
            };
            let a = objs[j][e].slice(0, 6);
            data.points_eight = await GetBoundingBoxPoints(...a, objs[j][e][9]);
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
            objs[j][e].push(data);
          }
        }
      }
      resolve(objs);
    });
  } catch (err) {}
}

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
      // bev 获取障碍物中心点坐标
      let p = [position.x, position.y, position.z];
      // arr[i][`left_back_point`] = project_lidar2img(p, "left_back");
      // arr[i][`left_front_point`] = project_lidar2img(p, "left_front");
      arr[i][`center_point`] = project_lidar2img(p, "foresight");
      // arr[i][`right_back_point`] = project_lidar2img(p, "right_back");
      // arr[i][`right_front_point`] = project_lidar2img(p, "right_front");
      // arr[i][`rearview_point`] = project_lidar2img(p, "rearview");
    }
    objs_data.value = arr;
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
  overflow: hidden;
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
}
.echarts_demos {
  width: 600px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  // color: rgb(0, 255, 0);
}
.data_box {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.top_box {
  height: 38%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
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
    height: 100%;
    width: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
.bottom_box {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  // flex-shrink: 0;
  .left_box,
  .right_box {
    width: 30%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: linear-gradient(#0b364c, #126db3, #0b364c);
    border-right: 2px solid;
    border-image-source: linear-gradient(#154c75, #0c97d2, #154c75);
    border-image-slice: 1;
    box-sizing: border-box;
    flex-shrink: 0;
    .v_box {
      width: 100%;
      height: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
  .center_box {
    height: 100%;
    width: 100%;
  }
}
</style>
