import demo_jpg from "../assets/demo.jpg";
// import demo_jpg from "../assets/demo0.png";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
  bev = {
    dom: null,
    ctx: null,
  };
  objs = {
    car: null,
  };
  constructor() {
    this.rgb_data.dom = document.getElementById("bev_box");
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
      // console.log(imgData, "imgData");
      let pixelData = imgData.data;
      let rgbData = [];
      let bev_demo = [];
      let road = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        let red = pixelData[i];
        let green = pixelData[i + 1];
        let blue = pixelData[i + 2];
        rgbData.push([red, green, blue]);
        let sign = -1;
        if (red > green && red > blue) {
          sign = 0;
        } else if (green > red && green > blue) {
          sign = 1;
        } else if (blue > red && blue > green) {
          sign = 2;
        }
        // if (red === 0 && green === 0 && blue === 0) {
        //   sign = 0;
        // } else if (red === 127 && green === 127 && blue === 127) {
        //   sign = 1;
        // } else if (red === 237 && green === 28 && blue === 36) {
        //   sign = 2;
        // }
        bev_demo.push(sign);
      }
      _this.initThree(bev_demo, imgData);
    };
  }
  initThree(bev_demo, imgData) {
    this.init();
    this.drawBev();
    let road = [];
    let shapes = new THREE.Shape();
    for (let i = 0; i < bev_demo.length; i++) {
      let c = this.getColor(bev_demo[i]);
      let points = this.getPoints(i, this.bev.dom.width);
      if (bev_demo[i] === 0) {
        road.push(points);
        if (road.length <= 1) {
          console.log(points, "points");
          shapes.moveTo(points[0], points[1]);
        } else {
          shapes.lineTo(points[0], points[1]);
        }
      }
      this.bev.ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
      this.bev.ctx.fillRect(points[0], points[1], 1, 1);
    }

    const geometry = new THREE.ShapeGeometry(shapes);
    const material_ = new THREE.MeshBasicMaterial({
      color: 0xf08000,
    });
    const mesh_ = new THREE.Mesh(geometry, material_);
    // this.scene.add(mesh_);

    let mapBg = new THREE.CanvasTexture(this.bev.dom);
    mapBg.colorSpace = THREE.SRGBColorSpace;
    mapBg.wrapS = mapBg.wrapT = THREE.RepeatWrapping;
    const material = new THREE.MeshPhongMaterial({
      map: mapBg,
      side: THREE.DoubleSide,
      colorWrite: true,
      aoMapIntensity: 0,
      alphaHash: true,
    });
    let plane_w = 11.52 * 6.2;
    let plane_h = (plane_w / this.bev.dom.width) * this.bev.dom.height;
    console.log(plane_w, plane_h, "www");
    const quad = new THREE.PlaneGeometry(plane_w, plane_h);
    const mesh = new THREE.Mesh(quad, material);
    mesh.rotation.z = Math.PI / 2;
    // mesh.position.x -= 1.5;
    this.scene.add(mesh);
    this.animate();
  }
  // 渲染循环
  animate = () => {
    // 清除深度缓存---很重要
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
  getColor(color) {
    switch (color) {
      case 0: // 路沿
        color = [0, 0, 0];
        break;
      case 1: // 人行横道
        color = [127, 127, 127];
        break;
      case 2: // 车道线
        color = [237, 28, 36];
        break;
      case -1:
        color = [255, 255, 255];
        break;
    }
    return color;
  }
  // 获取像素的坐标点
  getPoints(i, w) {
    let w_i = 0,
      h_i = 0;
    h_i = Math.floor(i / w);
    w_i = i - w * h_i;
    return [w_i, h_i];
  }
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    var width = this.rgb_data.dom.clientWidth;
    var height = this.rgb_data.dom.clientHeight;
    var k = width / height;
    var s = 20;
    this.camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, -10, 10);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(
      this.rgb_data.dom.clientWidth,
      this.rgb_data.dom.clientHeight
    );
    this.rgb_data.dom.appendChild(this.renderer.domElement);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    this.setAmbientLight();
    // this.setLight();
    this.setMesh();
    this.load3D();
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
    this.directionalLight.position.set(0, 5, 0);
    this.dhelper = new THREE.DirectionalLightHelper(this.directionalLight, 25);
    this.scene.add(this.directionalLight);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  drawBev() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d");
    this.bev.dom.width = 1152;
    this.bev.dom.height = 648;
  }
  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = ["car_for_games_unity"];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // debugger
      console.log(res, "res");
      // 主车
      const gltf = res[0].scene;
      gltf.rotation.x = Math.PI / 2;
      // 3d辅助框 获取模型的大小
      const box = new THREE.Box3().setFromObject(gltf),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3());
      // gltf.position.y = -(size.y / 2) - center.y;
      this.scene.add(gltf);
      gltf.matrixAutoUpdate = false;
      gltf.updateMatrix();
    } catch (err) {
      console.log(err, "err===load3D");
    }
  }
  // 加载3d模型文件
  loadFile(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        `src/assets/car_model/${url}/scene.gltf`,
        (gltf) => {
          resolve(gltf);
        },
        null,
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 绘制辅助网格、坐标
  setMesh() {
    // 一格5单位
    let gridHelper = new THREE.GridHelper(
      200,
      200,
      "rgb(238, 14, 14)",
      "rgb(158, 156, 153)"
    );
    gridHelper.rotation.x = -(Math.PI / 2);
    let axesHelper = new THREE.AxesHelper(150);
    // axesHelper.setColors('rgb(0, 0, 0)', 'rgb(248, 13, 13)', 'rgb(248, 13, 142)')
    // this.scene.add( axesHelper );
    this.scene.add(gridHelper);
  }
}
