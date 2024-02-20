<!--
 * @LastEditTime: 2024-02-20 17:52:37
 * @Description: 
-->
<script setup>
import { onMounted, reactive, ref, toRefs } from "vue";
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
    if (base.lineNum > 30) return;
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
    console.log(data, `${cmd[data.cmd]} data`);
    if (data.cmd === "egoTrjs") {
      // 车头线是只有一根线，所以直接修改线坐标
      if (base[data.cmd].num != 0) {
        base.updateLine(data.cmd, data.points);
      } else {
        base.egoTrjs.headline = base.setWidthLine(data.cmd, data.points, false, base.egoTrjs.color);
        base.scene.add(base.egoTrjs.headline);
        base[data.cmd].num++;
      }
    } else if (data.cmd === "lanes") {
      // 车道线是一堆线，把之前的线清除掉后再生成新的线
      if (base[data.cmd].num != 0) {
        base.updateLine(data.cmd, data.info);
      } else {
        base.drawLanes(data.cmd, data.info);
        base[data.cmd].num++;
      }
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

// canvas {
//   width: 100%;
//   height: 100%;
//   margin: auto;
// }
</style>
