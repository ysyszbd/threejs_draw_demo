<template>
  <div class="my_page">
    <div class="l_box">
      <videoYH
        ref="foresight"
        :video_id="'foresight'"
        :class="[`v_1`, 'v_box']"
      />
      <div class="line_box_h">
        <div class="line"></div>
      </div>
      <videoYH
        ref="rearview"
        :video_id="'rearview'"
        :class="[`v_1`, 'v_box']"
      />
    </div>
    <div class="r_box">
      <div class="videos_box">
        <videoYH ref="v_one" :video_id="'v_one'" :class="[`v_1`, 'v_box']" />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH ref="v_two" :video_id="'v_two'" :class="[`v_2`, 'v_box']" />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH
          ref="v_three"
          :video_id="'v_three'"
          :class="[`v_3`, 'v_box']"
        />
        <div class="line_box_v">
          <div class="line"></div>
        </div>
        <videoYH ref="v_four" :video_id="'v_four'" :class="[`v_4`, 'v_box']" />
      </div>
      <div class="bev">
        <!-- <threeDemo /> -->
        <!-- <Demo /> -->
      </div>
    </div>
  </div>
</template>

<script setup>
import threeDemo from "./three_demo.vue";
import videoYH from "./video.vue";
import Demo from "./demo.vue";
import { ref, onMounted } from "vue";
import Ws from "../controls/ws.js";
import { decode } from "@msgpack/msgpack";

let status = ref(""),
  foresight = ref(),
  rearview = ref(),
  v_one = ref(),
  v_two = ref(),
  v_three = ref(),
  v_four = ref();
const ws = new Ws("ws://192.168.30.9:12347", true, (e) => {
  if (e.data instanceof ArrayBuffer) {
    const object = decode(e.data);
    if (12100 == object[0]) {
      foresight.value.updataCode(new Uint8Array(object[2]));
      rearview.value.updataCode(new Uint8Array(object[2]));
      v_one.value.updataCode(new Uint8Array(object[2]));
      v_two.value.updataCode(new Uint8Array(object[2]));
      v_three.value.updataCode(new Uint8Array(object[2]));
      v_four.value.updataCode(new Uint8Array(object[2]));
    }
  }
});
</script>

<style lang="scss" scoped>
.my_page {
  width: 100vw;
  height: 100vh;
  display: flex;
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
    width: 70%;
    height: 100%;
    display: flex;
    flex-direction: column;

    .bev {
      width: 100%;
      height: 100%;
    }
    .videos_box {
      width: 100%;
      height: 30%;
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
</style>
