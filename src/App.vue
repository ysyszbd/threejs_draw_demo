<!--
 * @LastEditTime: 2024-03-05 14:33:55
 * @Description: 
-->
<script setup>
import mainPage from "./pages/main.vue";
import loading from "./pages/loading.vue";
import { ObserverInstance } from "@/controls/event/observer";
import { ref } from "vue";
let work_init_arr = ref([]),
  work_status = ref(false),
  observerListenerList = [
    {
      eventName: "INIT_OK",
      fn: initAll.bind(this),
    },
  ];
ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
function initAll(data) {
  work_init_arr.value.push(data.id);
  if (work_init_arr.value.length === 6) {
    work_status.value = true;
  }
}
</script>

<template>
  <div class="main_box">
    <!-- <loading /> -->
    <loading v-if="!work_status" class="loading_page"/>
    <mainPage :initStatus="work_status" class="main_page"/>
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
  position: relative;
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
