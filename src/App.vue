<!--
 * @LastEditTime: 2024-02-04 17:55:14
 * @Description: 
-->
<!--
 * @LastEditTime: 2024-02-04 16:54:13
 * @Description: 
-->
<script setup>
import { onMounted } from "vue";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";

var renderer, scene, camera, light;
var width, height;
threeExcute();

// width = window.innerWidth;
// height = window.innerHeight;
// camera = new THREE.PerspectiveCamera(70, width / height, 0.01, 10);
// camera.position.z = 1;
// scene = new THREE.Scene();
// const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
// const material = new THREE.MeshNormalMaterial();
// const mesh = new THREE.Mesh(geometry, material);
// scene.add(mesh);
// renderer = new THREE.WebGLRenderer({ antialias: true });
// renderer.setSize(width, height);
// renderer.setAnimationLoop(animation);
// document.body.appendChild(renderer.domElement);
// function animation(time) {
//   mesh.rotation.x = time / 2000;
//   mesh.rotation.y = time / 1000;
//   renderer.render(scene, camera);
// }


function initRenderer() {
  width = window.innerWidth;
  height = window.innerHeight;
  renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setSize(width, height);
  document.body.appendChild(renderer.domElement);
  // renderer.setClearColor(0xffffff, 1.0);
}
function initScene() {
  scene = new THREE.Scene();
}
function initCamera() {
  camera = new THREE.OrthographicCamera(-2, 2, 1.5, -1.5, 1, 10);
  camera.position.set(4, -3, 5);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);
}
function initLight() {
  light = new THREE.DirectionalLight(0xff0000, 1.0, 0);
  light.position.set(100, 100, 200);
  scene.add(light);
}
function threeExcute() {
  initRenderer();
  initScene();
  initCamera();
  initLight();
  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  var cube = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial()
  );
  scene.add(cube);
  renderer.render(scene, camera);
}
</script>

<template>
  <div id="box" class="box"></div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
.box {
  width: 100%;
  height: 100vh;
}
</style>
