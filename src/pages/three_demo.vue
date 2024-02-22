<!--
 * @LastEditTime: 2024-02-22 17:26:10
 * @Description: 
-->
<script setup>
import { onMounted, reactive, ref, onUnmounted } from "vue";
import * as THREE from "three";
import Base from "@/contorls/base.js";

let loadingWidth = ref(0);
let isLoading = ref(true);
let mapDOM = ref(null),
  base = null,
  ws = ref(null),
  wsStatus = ref(false);
initWS();
onMounted(() => {
  base = new Base(mapDOM.value);
  update();
  window.addEventListener("resize", resize);
});
onUnmounted(() => {
  base.clear();
  console.log("unmounted");
});
function update() {
  base.update();
}
function resize() {
  base.resize();
}
function initWS() {
  ws.value = new WebSocket("ws://192.168.30.9:12346");

  // 连接成功后的回调
  ws.value.onopen = function (evt) {
    console.log("Connection open ...");
    wsStatus.value = true;
  };
  // 收到服务器数据后的回调---用于接收数据
  ws.value.onmessage = function (evt) {
    // if (base.lineNum > 30) return;
    const data = JSON.parse(evt.data);
    drawLines(data);
  };
  // 连接关闭后的回调
  // ws.onclose = function (evt) {
  //   console.log("Connection closed.");
  //   wsStatus.value = false;
  // };
}
function drawLines(data) {
  try {
    let cmd = {
      egoTrjs: "车头指示线",
      objs: "障碍物",
      lanes: "车道线",
    };
    // console.log(data, `${cmd[data.cmd]} data`);
    if (data.cmd === "egoTrjs") {
      // 车头线是只有一根线，所以直接修改线坐标
      base.drawHeadLine(data.points);
    } else if (data.cmd === "lanes") {
      base.drawLanes(data.info);
    } else if (data.cmd === "objs") {
      base.drawBoxs(data.info);
    }
    base.lineNum++;
  } catch (err) {
    console.log(err, "err---drawLines");
  }
}
</script>

<template>
  <div class="boxs">
    <div class="sky"></div>
    <div class="map maskLoading" ref="mapDOM">
      <!-- <div class="loading_box" v-if="base?.isLoading ? base?.isLoading : true">
        <div class="loading">
          <div :style="{ width: base?.loadingWidth ? base?.loadingWidth : 0 + '%' }"></div>
        </div>
        <div style="padding-left: 10px">{{ parseInt(base?.loadingWidth ? base?.loadingWidth : 0) }}%</div>
      </div> -->
      <div id="little_car" class="obj"></div>
      <div id="my_car" class="obj"></div>
      <div id="bicycle" class="obj"></div>
      <div id="bus" class="obj"></div>
      <div id="cone" class="obj"></div>
      <div id="barrier" class="obj"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
body {
  margin: 0;
}
.boxs {
  width: 100vw;
  height: 100vh;
  .sky {
    width: 100%;
    height: 20%;
    background: linear-gradient(#fff, #adae90);
  }
  .map {
    width: 100%;
    height: 80%;
    background: #9fb2ac;
    position: relative;
    .obj {
      position: absolute;
      background: #000;
      width: 20px;
      height: 20px;
      z-index: 1;
      top: 0;
      left: 0;
      
    }
  }
}

.maskLoading {
  background: #000;
  // position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1111111;
  color: #fff;
  .loading {
    width: 400px;
    height: 20px;
    border: 1px solid #fff;
    background: #000;
    overflow: hidden;
    border-radius: 10px;
    div {
      background: #fff;
      height: 20px;
      width: 0;
      transition-duration: 500ms;
      transition-timing-function: ease-in;
      color: rgb(248, 13, 142);
    }
  }
}
</style>
