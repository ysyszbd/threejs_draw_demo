<!--
 * @LastEditTime: 2024-03-11 16:24:18
 * @Description: 
-->
<!--
 * @LastEditTime: 2024-03-11 14:33:48
 * @Description: 
-->
<script setup>
import mainPage from "./pages/main.vue";
import loading from "./pages/loading.vue";
import { ObserverInstance } from "@/controls/event/observer";
import { ref } from "vue";
let work_init_arr = ref([]),
  work_status = ref(false),
  model3D_status = ref(false),
  all_status = ref(false),
  video_start = ref(false),
  observerListenerList = [
    {
      eventName: "INIT_OK",
      fn: initAll.bind(this),
    },
  ];
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
function initAll(data) {
  if (data.id === "objs") {
    model3D_status.value = true;
  } else if (data.id === "video") {
    video_start.value = true;
  } else {
    work_init_arr.value.push(data.id);
    if (work_init_arr.value.length === 1) {
    // if (work_init_arr.value.length === 6) {
      work_status.value = true;
    }
  }
  if (work_status.value && model3D_status.value) {
    all_status.value = true;
  } else {
    all_status.value = false;
  }
}
</script>

<template>
  <div class="main_box">
    <!-- <loading /> -->
    <!-- <loading v-if="!all_status" class="loading_page"/> -->
    <mainPage :initStatus="all_status" class="main_page"/>
  </div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
body {
  margin: 0;
}
.main_box {
  width: 100vw;
  height: 100vh;
  // position: relative;
  box-sizing: border-box;
  // overflow: hidden;
  .loading_page {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }
  .main_page {
    position: absolute;
    top: 0;
    left: 0;
  }
}
</style>
