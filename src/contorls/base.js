import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";


export default class Base {
  renderer;
  scene;
  scene2;
  camera;
  directionalLight;
  hemisphereLight;
  dhelper;
  hHelper;
  controls;
  material;
  constructor(mapDOM) {
    this.mapDOM = mapDOM;
    this.setScene();
    this.setCamera();
    this.setAmbientLight();
    this.setLight();
    this.setRender();
    this.load3D();
    this.setControls();
  }
  
  // 创建场景
  setScene() {
    this.scene = new THREE.Scene();
  }
  // 创建相机
  setCamera() {
    this.camera = new THREE.PerspectiveCamera(
      120,
      this.mapDOM.clientWidth / this.mapDOM.clientHeight,
      0.1,
      1800
    );
    this.camera.position.set(0, 3, -6);
    this.camera.updateMatrix();
  }
  // 创建环境光
  setAmbientLight(intensity = 1, color = 0xffffff) {
    const light = new THREE.AmbientLight(color, intensity);
    this.scene.add(light);
  }
  // 设置灯光
  setLight() {
    // 添加方向光
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    this.directionalLight.position.set(0, 10, 4);
    this.dhelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      5,
      0xff0000
    );
    this.scene.add(this.directionalLight);
  }
  // 创建渲染器
  setRender() {
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setSize(this.mapDOM.clientWidth, this.mapDOM.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio); // 设置像素比,让场景更加清晰
    // 设置电影级别的色调映射,让场景会更加好看一些，但会更耗费性能
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.setClearColor(0xf0f0f0, 1);
    // 将render里面的dom添加到目标dom中
    this.mapDOM.appendChild(this.renderer.domElement);
  }
  // 加载3D模型
  async load3D() {
    const gltf = await this.loadFile(
      "src/assets/car_model/free_porsche_911_carrera_4s/scene.gltf"
    );
    this.scene.add(gltf.scene);
  }
  // 加载3d模型
  loadFile(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (gltf) => {
          console.log(gltf.scene, "gltf");
          resolve(gltf);
        },
        ({ loaded, total }) => {
          // let load = Math.abs((loaded / total) * 100);
          // loadingWidth.value = load;
          // if (load >= 100) {
          //   setTimeout(() => {
          //     // isLoading.value = false;
          //   }, 1000);
          // }
          console.log((loaded / total) * 100 + "% loaded");
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  // 根据窗口大小对应改变
  resize() {
    this.camera.aspect = this.mapDOM.clientWidth / this.mapDOM.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.mapDOM.clientWidth, this.mapDOM.clientHeight);
  }
  // 更新视图
  update = () => {
    requestAnimationFrame(this.update);
    this.renderer.render(this.scene, this.camera);
  }
}
