import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "./resourceTracker";
import { numberExcept } from "./util.js";

export default class bevImgContorl {
  resTracker = new ResourceTracker();
  track = this.resTracker.track.bind(this.resTracker);
  rgb_data = {
    dom: null,
    ctx: null,
  };
  bev = {
    dom: null,
    ctx: null,
  };
  scene;
  camera;
  renderer;
  particleSystem;
  geometry;
  scale = numberExcept(51.2, 30);
  observerListenerList = [
    {
      eventName: "DRAW_BEV",
      fn: this.getData.bind(this),
    },
  ];
  objs = {
    main_car: null,
    car: null,
    car_group: new THREE.Object3D(),
    truck: null,
    truck_group: new THREE.Object3D(),
    construction_vehicle: null,
    construction_vehicle_group: new THREE.Object3D(),
    bus: null,
    bus_group: new THREE.Object3D(),
    trailer: null,
    trailer_group: new THREE.Object3D(),
    barrier: null,
    barrier_group: new THREE.Object3D(),
    motorcycle: null,
    motorcycle_group: new THREE.Object3D(),
    bicycle: null,
    bicycle_group: new THREE.Object3D(),
    pedestrian: null,
    pedestrian_group: new THREE.Object3D(),
    street_cone: null,
    street_cone_group: new THREE.Object3D(),
  };
  obj_index = {
    "0-0": "car",
    "1-0": "truck",
    "1-1": "construction_vehicle",
    "2-0": "bus",
    "2-1": "trailer",
    "3-0": "barrier",
    "4-0": "motorcycle",
    "4-1": "bicycle",
    "5-0": "pedestrian",
    "5-1": "street_cone",
  };
  objs_size = {
    car: [3.8, 1.6, 1.5], // 长宽高
  };
  bevW = 0;
  bevH = 0;
  material = null;
  geometry = null;
  mesh = null;
  mapBg = null;
  offscreen;
  offscreen_ctx;
  big_offscreen;
  big_offscreen_ctx;
  imageBitmap;
  canvas;
  ctx;
  constructor() {
    ObserverInstance.selfAddListenerList(this.observerListenerList, "yh_init");
    this.rgb_data.dom = document.getElementById("bev_box");
    // 离屏渲染
    this.offscreen = new OffscreenCanvas(400, 400);
    this.offscreen_ctx = this.offscreen.getContext("2d");
    // 初始化three
    this.init();
    // 初始化canvas，并在three上绘制网格，将canvas贴上去
    this.initBasicCanvas();
    this.animate();
  }
  // 更新bev
  async getData(data) {
    try {
      // 更新canvas图像
      this.drawBev(data.basic_data[1], data.basic_data[2], data.info).then(
        (res) => {
          // 更新障碍物
          this.handleObjs(data.objs);
        }
      );
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  // 更新障碍物
  handleObjs(objs_data) {
    if (objs_data.length <= 0) return;
    this.handle3D("car", objs_data);
  }
  // 操作具体的障碍物
  async handle3D(type, data) {
    try {
      if (!this.objs[type]) return;
      let group = this.objs[`${type}_group`],
        model = this.objs[type];
      if (group.children.length <= 0) {
        group.clear();
        for (let i = 0; i < data.length; i++) {
          let point = data[i];
          if (point[0] !== -1 && point[1] !== -1) {
            let c_model = model.scene.clone();
            c_model.matrixAutoUpdate = true;
            c_model.position.x = -point[1] * this.scale;
            c_model.position.y = point[0] * this.scale;
            c_model.position.z = point[2] * this.scale;
            c_model.rotation.y = -point[9];

            group.add(c_model);
          }
        }
        this.scene.add(group);
      } else {
        if (group.children.length >= data.length) {
          for (let i = 0; i < data.length; i++) {
            group.children[i].position.x = -data[i][1] * this.scale;
            group.children[i].position.y = data[i][0] * this.scale;
            group.children[i].position.z = data[i][2] * this.scale;
            group.children[i].rotation.y = -data[i][9];
          }
          for (let j = data.length; j < group.children.length; j++) {
            this.scene.remove(group.children[j]);
            group.remove(group.children[j]);
            // group.children[j].position.x = 100;
            // group.children[j].position.y = 100;
          }
        } else {
          for (let i = 0; i < group.children.length; i++) {
            group.children[i].position.x = -data[i][1] * this.scale;
            group.children[i].position.y = data[i][0] * this.scale;
            group.children[i].position.z = data[i][2] * this.scale;
            group.children[i].rotation.y = -data[i][9];
          }

          for (let j = group.children.length; j < data.length; j++) {
            let l_c_model = model.scene.clone();
            l_c_model.matrixAutoUpdate = true;
            l_c_model.position.x = -data[j][1] * this.scale;
            l_c_model.position.y = data[j][0] * this.scale;
            l_c_model.position.z = data[j][2] * this.scale;
            l_c_model.rotation.y = -data[j][9];
            group.add(l_c_model);
          }
          this.scene.add(group);
        }
      }
    } catch (err) {
      console.log(err, "err---handle3D");
    }
  }
  // 拿到道路坐标，绘制道路
  drawData(bev_demo, road) {
    // 车的坐标
    // let car_point = [this.bev.dom.width / 2, this.bev.dom.height / 2];
    // // 根据路沿绘制出道路
    // let points = [];
    // let right = [],
    //   left = [];
    // road.forEach((item, index) => {
    //   if (item.length === 0) {
    //     // console.log(`第${index}行无路沿`);
    //     return;
    //   }
    //   let max_p = item[item.length - 1],
    //     min_p = item[0];
    //   if (item.length === 1) {
    //     if (item[0][0] > car_point[0]) {
    //       right.push(item[0]);
    //     } else {
    //       left.unshift(item[0]);
    //     }
    //   } else {
    //     if (max_p[0] <= car_point[0]) {
    //       // console.log(left, "left---x最大时在车左侧");
    //       left.unshift(max_p);
    //       if (left.length > 1) {
    //         let m = (-left[1][1] - -left[0][1]) / (left[1][0] - left[0][0]);
    //         if (m > 0) {
    //           // console.log("说明线走向递增");
    //           left.unshift(max_p);
    //           right.push([this.bev.dom.width, index]);
    //         } else if (m < 0) {
    //           // console.log("说明线走向递减");
    //         }
    //       }
    //     } else if (min_p[0] >= car_point[0]) {
    //       right.push(min_p);
    //     } else {
    //       right.push(max_p);
    //       left.unshift(min_p);
    //     }
    //   }
    // });
    // points = right.concat(left);
    // // 在 Canvas 上绘制轮廓
    // this.bev.ctx.strokeStyle = "#343633";
    // this.bev.ctx.fillStyle = "#343633";
    // this.bev.ctx.lineWidth = 1;
    // this.bev.ctx.beginPath();
    // this.bev.ctx.moveTo(...points[0]);
    // for (let i = 1; i < points.length; i++) {
    //   this.bev.ctx.lineTo(...points[i]);
    // }
    // this.bev.ctx.closePath();
    // this.bev.ctx.stroke();
    // this.bev.ctx.fill();
  }
  // 处理语义分割的数据，拿到所有路沿的位置坐标，按行列存储
  handleDataCanvas(bev_demo) {
    try {
      return new Promise((resolve, reject) => {
        let road = [];
        let now_h = -1;
        let road_empty = [-1, -1];
        for (let i = 0; i < bev_demo.length; i++) {
          // 判断该像素点是否为路沿,如果该像素点为路沿，则将该像素点加入road所在的行列三维数组中
          let arr = new Array(this.bev.dom.width).fill(null);
          road.push(arr);
          let points = [null, null];
          if (bev_demo[i] === 0) {
            points = this.getPoints(i, this.bev.dom.width);
            // 找到当前行
            if (points[0] != now_h) {
              now_h = points[0];
              if (road_empty[0] >= 0 && road_empty[1] < 0) {
                road_empty[1] = now_h;
              }
            }
            road[points[1]][points[0]] = points;
            road[points[1]] = road[points[1]].filter((item) => item !== null);
          }
          road[i] = road[i].filter((item) => item !== null);
          if (road[i].length === 0) {
            if (now_h >= 0 && road_empty[0] < 0 && road_empty[1] < 0) {
              road_empty[0] = this.getPoints(i, this.bev.dom.width)[1];
            }
          }
        }
        console.log(road_empty, "road_empty");
        resolve(road);
      });
    } catch (err) {
      console.log(err, "err---handleDataCanvas");
    }
  }
  // 获取像素的坐标点，即像素点所在的行列值
  getPoints(i, w) {
    let w_i = 0,
      h_i = 0;
    h_i = Math.floor(i / w);
    w_i = i - w * h_i;
    return [w_i, h_i];
  }
  // 获取语义分割类型对应的颜色
  getColor(color) {
    switch (color) {
      case 0:
        color = [52, 54, 51, 1];
        break;
      case 1: // 人行横道
        color = [255, 255, 255, 1];
        break;
      case 2: // 车道线
        color = [0, 255, 0, 1];
        break;
      case -1:
        color = [255, 255, 255, 0];
        break;
      case 3:
        color = [255, 0, 0, 1];
        break;
    }
    return color;
  }
  // 绘制出bev所需的canvas
  drawBev(w, h, bev_demo) {
    try {
      return new Promise(async (resolve, reject) => {
        // this.bev.ctx.clearRect(0, 0, this.bev.dom.width, this.bev.dom.height);
        if (this.img_w != w || this.img_h != h) {
          this.img_w = w;
          this.img_h = h;
          this.bev.dom.width = this.img_w;
          this.bev.dom.height = this.img_h;
          this.offscreen.width = w;
          this.offscreen.height = h;
        }
        requestAnimationFrame(() => {
          this.bev.ctx.clearRect(0, 0, w, h);
          if (this.imageBitmap) {
            this.bev.ctx.drawImage(this.imageBitmap, 0, 0, w, h);
            console.log(Date.now(), "-----------bev2");
            this.mapBg.needsUpdate = true;
            resolve("canvas更新成功");
          }
          for (let i = 0; i < bev_demo.length; i++) {
            let c = this.getColor(bev_demo[i]);
            let points = this.getPoints(i, w);
            this.offscreen_ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
            this.offscreen_ctx.fillRect(points[0], points[1], 1, 1);
          }
          this.imageBitmap = this.offscreen.transferToImageBitmap();
        });
      });
    } catch (err) {
      console.log(err, "err==drawBev");
    }
  }
  applySharpen(context, width, height) {
    // 获取原始图像数据
    let originalImageData = context.getImageData(0, 0, width, height);
    let originalPixels = originalImageData.data;

    // 创建一个用于存放处理后的图像数据的 ImageData 对象
    let outputImageData = context.createImageData(width, height);
    let outputPixels = outputImageData.data;

    const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];

    const kernelSize = Math.sqrt(kernel.length);
    const halfKernelSize = Math.floor(kernelSize / 2);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let r = 0,
          g = 0,
          b = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            // 考虑边缘像素
            let pixelY = y + ky - halfKernelSize;
            let pixelX = x + kx - halfKernelSize;

            if (pixelY < 0 || pixelY >= height || pixelX < 0 || pixelX >= width)
              continue;

            // 卷积计算
            let offset = (pixelY * width + pixelX) * 4;
            let weight = kernel[ky * kernelSize + kx];

            r += originalPixels[offset] * weight;
            g += originalPixels[offset + 1] * weight;
            b += originalPixels[offset + 2] * weight;
          }
        }

        let destOffset = (y * width + x) * 4;
        outputPixels[destOffset] = r;
        outputPixels[destOffset + 1] = g;
        outputPixels[destOffset + 2] = b;
        outputPixels[destOffset + 3] = originalPixels[destOffset + 3]; // 保持相同的 alpha 值
      }
    }

    // 将处理后的图像数据绘制回画布
    context.putImageData(outputImageData, 0, 0);
  }
  // 初始化threejs
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    var width = this.rgb_data.dom.clientWidth;
    var height = this.rgb_data.dom.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 50);
    this.camera.updateMatrix();
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
    this.setMesh();
    this.setAmbientLight();
    this.setControls();
    this.load3D();
  }
  // 初始化bev的canvas
  initBasicCanvas() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d");
    this.bev.dom.height = 400;
    this.bev.dom.width = 400;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.bev.ctx.imageSmoothingEnabled = true;
    this.bev.ctx.imageSmoothingQuality = "high";
    this.bev.ctx.fillStyle = `pink`;
    this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
    this.imageBitmap = this.offscreen.transferToImageBitmap();
    this.mapBg = this.track(new THREE.CanvasTexture(this.bev.dom));
    this.mapBg.colorSpace = THREE.SRGBColorSpace;
    this.mapBg.wrapS = this.mapBg.wrapT = THREE.RepeatWrapping;
    this.mapBg.magFilter = THREE.LinearFilter;
    this.mapBg.minFilter = THREE.LinearFilter;
    this.material = this.track(
      new THREE.MeshPhongMaterial({
        map: this.mapBg,
        side: THREE.DoubleSide,
      })
    );
    let plane_w = 60;
    let plane_h = 60;
    this.geometry = this.track(new THREE.PlaneGeometry(plane_w, plane_h));
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = [
        "main_car",
        "car",
        // "truck",
        // "construction_vehicle",
        // "bus",
        // "trailer",
        // "barrier",
        // "motorcycle",
        // "bicycle",
        // "pedestrian",
        // "street_cone",
      ];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // console.log(res, "res");
      res.forEach((item) => {
        this.objs[item.id] = item.gltf;
        let gltf = this.objs[item.id].scene;
        if (item.id === "main_car") {
          const box = new THREE.Box3().setFromObject(gltf),
            center = box.getCenter(new THREE.Vector3()),
            size = box.getSize(new THREE.Vector3());
          gltf.position.y = -(size.y / 2) - center.y;
          gltf.rotation.x = Math.PI / 2;
        } else if (item.id === "car") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -100;
          gltf.position.x = -100;
        } else if (item.id === "truck") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -105;
          gltf.position.x = -105;
        } else if (item.id === "bus") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -125;
          gltf.position.x = -125;
        } else if (item.id === "trailer") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.y = -135;
          gltf.position.x = -135;
        } else if (item.id === "barrier") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = -145;
          gltf.position.y = -144;
        } else if (item.id === "motorcycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.position.x = 105;
          gltf.position.y = -124;
        } else if (item.id === "bicycle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.x = -123;
          gltf.position.y = -144;
          gltf.scale.set(0.02, 0.02, 0.02);
        } else if (item.id === "pedestrian") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2 + Math.PI / 3;
          gltf.position.x = 120;
          gltf.position.y = -114;
          gltf.scale.set(0.02, 0.02, 0.02);
        } else if (item.id === "street_cone") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI / 2;
          gltf.position.x = 100;
          gltf.position.y = -147;
        } else if (item.id === "construction_vehicle") {
          gltf.rotation.x = Math.PI / 2;
          gltf.rotation.y = Math.PI;
          gltf.position.x = 110;
          gltf.position.y = -105;
          gltf.scale.set(0.02, 0.02, 0.02);
        }
        this.scene.add(gltf);
        gltf.matrixAutoUpdate = false;
        gltf.updateMatrix();
      });
      ObserverInstance.emit("INIT_OK", {
        id: "objs",
      });
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
          resolve({ gltf: gltf, id: url });
        },
        null,
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 创建环境光
  setAmbientLight(intensity = 1, color = 0xffffff) {
    const light = new THREE.AmbientLight(color, intensity);
    this.scene.add(light);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  // 渲染循环
  animate = () => {
    // 清除深度缓存---很重要
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  };
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
    const axesHelper = new THREE.AxesHelper(15);
    this.scene.add(axesHelper);
    // this.scene.add(gridHelper);
  }
}
