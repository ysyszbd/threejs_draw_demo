import demo_jpg from "../assets/demo0.png";
import * as THREE from "three";
import Base from "./base";

export default class demo {
  rgb_data = {
    dom: null,
    ctx: null,
  };
  scene;
  camera;
  renderer;
  particleSystem;
  geometry;
  particles = 100000;
  constructor() {
    this.rgb_data.dom = document.getElementById("demo_box");
    let c = document.getElementById("img_canvas");
    c.width = 1152;
    c.height = 648;
    let ctx = c.getContext("2d");
    let img_ele = document.createElement("img");
    img_ele.src = demo_jpg;
    let _this = this;
    img_ele.onload = function (e) {
      ctx.drawImage(img_ele, 0, 0, 1152, 648);
      let imgData = ctx.getImageData(0, 0, c.width, c.height);
      console.log(imgData, "imgData");
      let pixelData = imgData.data;
      let rgbData = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        let red = pixelData[i];
        let green = pixelData[i + 1];
        let blue = pixelData[i + 2];
        rgbData.push([red, green, blue]);
      }
      _this.initThree(rgbData, c.width, c.height);
    };
  }
  initThree(rgbData) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.rgb_data.dom.clientWidth / this.rgb_data.dom.clientHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;
    this.renderer = new THREE.WebGL1Renderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      1152,
      648
    );
    this.rgb_data.dom.appendChild(this.renderer.domElement);
    let w_i = 0,
      h_i = 0;
    let canvas = document.createElement("canvas"),
      ctx = canvas.getContext("2d");
    canvas.width = 1152;
    canvas.height = 648;
    let arr_0 = [], arr_1 = [], arr_2 = [];
    for (let i = 0; i < rgbData.length; i++) {
      let c = rgbData[i];
      h_i = Math.floor(i / canvas.width);
      w_i = i - (canvas.width * h_i);
      ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      ctx.fillRect(w_i * 1, h_i * 1, 1, 1);
      let x = w_i, y = h_i;
      if (c[0] === 0 && c[1] === 0 && c[2] === 0) {
        arr_0.push({x: x, y: y});
      } else if (c[0] === 127 && c[1] === 127 && c[2] === 127) {
        arr_1.push({x: x, y: y});
      } else if (c[0] === 237 && c[1] === 28 && c[2] === 36) {
        arr_2.push({x: x, y: y});
      }
    }
    // console.log(arr_0, "arr_0");
    // console.log(arr_1, "arr_1");
    // console.log(arr_2, "arr_2");
    let mapBg = new THREE.CanvasTexture(canvas);
    mapBg.colorSpace = THREE.SRGBColorSpace;
    mapBg.wrapS = mapBg.wrapT = THREE.RepeatWrapping;
    this.scene.background = mapBg;
    // this.rgb_data.dom.appendChild(canvas);
    this.animate();
  }
  // 渲染循环
  animate = () => {
    requestAnimationFrame(this.animate);
    this.renderer.render(this.scene, this.camera);
  };
  getColor(color) {
    switch (color) {
      case 0: // 路沿
        color = [0, 0, 0];
        break;
      case 1: // 人行横道
        color = [128, 128, 128];
        break;
      case 2: // 车道线
        color = [255, 0, 0];
        break;
    }
    return color;
  }
  render() {
    const time = Date.now() * 0.005;

    this.particleSystem.rotation.z = 0.01 * time;

    const sizes = this.geometry.attributes.size.array;
    for (let i = 0; i < this.particles; i++) {
      sizes[i] = 10 * (1 + Math.sin(0.1 * i + time));
    }

    this.geometry.attributes.size.needsUpdate = true;

    this.renderer.render(this.scene, this.camera);
  }
}
