<!--
 * @LastEditTime: 2024-02-18 18:02:09
 * @Description: 
-->
<script setup>
import { onMounted, reactive, ref, toRefs } from "vue";
import * as THREE from "three";
import Base from "@/contorls/base.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";

let loadingWidth = ref(0);
let isLoading = ref(true);
// 渲染道路
function setRoad() {
  const element = document.createElement("div");
  element.style.width = "1000px";
  element.style.height = "2000px";
  element.style.opacity = 1;
  element.style.background = "#8c8a75";
  const object = new CSS3DObject(element);
  object.position.copy(pos);
  object.rotation.copy(rot);
  scene2.add(object);

  const geometry = new THREE.PlaneGeometry(300, 300);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(object.position);
  mesh.rotation.copy(object.rotation);
  scene.add(mesh);
}
// 渲染道路上的线条
function setLine() {}
let mapDOM = ref(null),
  base = null;

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
</script>

<template>
  <div class="boxs">
    <div class="sky"></div>
    <div class="map" ref="mapDOM"></div>
    <!-- <div class="maskLoading" v-if="isLoading">
      <div class="loading">
        <div :style="{ width: loadingWidth + '%' }"></div>
      </div>
      <div style="padding-left: 10px">{{ parseInt(loadingWidth) }}%</div>
    </div> -->
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
  position: fixed;
  display: flex;
  justify-content: center;
  align-items: center;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 1111111;
  color: #fff;
}

.maskLoading .loading {
  width: 400px;
  height: 20px;
  border: 1px solid #fff;
  background: #000;
  overflow: hidden;
  border-radius: 10px;
}

.maskLoading .loading div {
  background: #fff;
  height: 20px;
  width: 0;
  transition-duration: 500ms;
  transition-timing-function: ease-in;
}

canvas {
  width: 100%;
  height: 100%;
  margin: auto;
}


</style>
