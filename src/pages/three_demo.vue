<!--
 * @LastEditTime: 2024-03-03 13:09:23
 * @Description: 
-->
<script setup>
import { onMounted, inject, ref, onUnmounted } from "vue";
// import Base from "@/controls/base.js";

let loadingWidth = ref(0);
let isLoading = ref(true);
let mapDOM = ref(null),
base = inject("$Base"),
  ws = ref(null),
  wsStatus = ref(false);
initWS();
onMounted(() => {
  base.start(mapDOM.value);
  update();
  window.addEventListener("resize", resize);
});
onUnmounted(() => {
  base.clear();
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
    wsStatus.value = true;
  };
  // 收到服务器数据后的回调---用于接收数据
  ws.value.onmessage = function (evt) {
    // if (base.lineNum > 50) return;
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
    // return
    if (data.cmd === "egoTrjs") {
      // 车头线是只有一根线，所以直接修改线坐标
      base.drawHeadLine(data.points);
    } else if (data.cmd === "lanes") {
      // console.log(data, `${cmd[data.cmd]} data`);
      base.drawLanes(data.info);
    } else if (data.cmd === "objs") {
      base.handleObj(data.info);
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
    <div class="map maskLoading" ref="mapDOM">
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
body {
  margin: 0;
}
.boxs {
  width: 100%;
  height: 100%;
  .map {
    width: 100%;
    height: 100%;
    background: #9fb2ac;
  }
}

</style>
