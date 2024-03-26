/*
 * @LastEditTime: 2024-03-26 18:02:48
 * @Description:
 */
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "../resourceTracker";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";

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
  scale = 51.2 / 30;
  observerListenerList = [
    {
      eventName: "DRAW_BEV",
      fn: this.getData.bind(this),
    },
  ];
  objs = {
    start: false,
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
  material = null;
  geometry = null;
  mesh = null;
  mapBg = null;
  map = new Map();
  draw_time = [];

  constructor() {
    this.map.set(0, [80, 82, 79, 1]);
    this.map.set(1, [255, 255, 255, 1]);
    this.map.set(2, [0, 255, 0, 1]);
    this.map.set(3, [255, 0, 0, 1]);
    ObserverInstance.selfAddListenerList(this.observerListenerList, "yh_init");
    this.rgb_data.dom = document.getElementById("bev_box");
    // 初始化three
    this.init();
    // 初始化canvas，并在three上绘制网格，将canvas贴上去
    this.initBasicCanvas();
    this.animate();
  }
  // 更新bev
  async getData(data) {
    try {
      if (this.bev.dom.width != data.info.width)
        this.bev.dom.width = data.info.width;

      if (this.bev.dom.height != data.info.height)
        this.bev.dom.height = data.info.height;

      this.bev.ctx.drawImage(data.info, 0, 0);
      this.mapBg.needsUpdate = true;
      await this.handleObjs(data.objs);
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  // 更新障碍物
  async handleObjs(objs_data) {
    return new Promise((resolve, reject) => {
      if (objs_data.length <= 0) return;
      for (let item in objs_data) {
        if (objs_data[item].data.length > 0) {
          this.handle3D(objs_data[item].name, objs_data[item].data);
        } else {
          let group = this.objs[`${objs_data[item].name}_group`];
          group.children.forEach((item) => {
            this.scene.remove(item);
            group.remove(item);
          });
        }
      }
      resolve("---------");
    });
  }
  // 操作具体的障碍物
  async handle3D(type, data) {
    try {
      if (!this.objs.start) return;
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
        // console.log(road_empty, "road_empty");
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
  // 初始化threejs
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    let rect = this.rgb_data.dom.getBoundingClientRect();
    var width = rect.width;
    var height =
      rect.height -
      40 -
      document.getElementById("page_title").getBoundingClientRect().height;
    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    this.camera.position.set(0, -10, 80);
    this.camera.updateMatrix();
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(width, height);
    this.rgb_data.dom.appendChild(this.renderer.domElement);
    this.renderer.toneMapping = THREE.ReinhardToneMapping;
    this.renderer.toneMappingExposure = 2.0;
    // this.setMesh();
    this.setAmbientLight();
    this.setControls();
    this.load3D();
  }
  // 初始化bev的canvas
  initBasicCanvas() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.bev.dom.height = 400;
    this.bev.dom.width = 400;

    const devicePixelRatio = window.devicePixelRatio || 1;
    this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.bev.ctx.imageSmoothingEnabled = true;
    this.bev.ctx.imageSmoothingQuality = "high";
    this.bev.ctx.fillStyle = `pink`;
    this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
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
    this.geometry = this.track(new THREE.PlaneGeometry(60, 60));
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.mesh);
  }

  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = [
        "main_car",
        "car",
        "truck",
        "construction_vehicle",
        "bus",
        "trailer",
        "barrier",
        "motorcycle",
        "bicycle",
        "pedestrian",
        "street_cone",
      ];
      const res = await Promise.all(filesArr.map(this.loadFile));
      this.objs.start = true;
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
  // 加载obj格式的3d模型
  async loadObj3D() {
    try {
      let obj = await this.loadObjFile("A/SM_MercedesBenzCoupeC");
      obj.scale.set(0.01, 0.01, 0.01);
      obj.rotation.x = Math.PI / 2;
      obj.rotation.y = Math.PI / 2;
      obj.position.x = 10;
      obj.position.y = -15;
      this.scene.add(obj);
    } catch (err) {
      console.log(err, "err===loadObj3D");
    }
  }
  // 加载obj格式的3d模型
  loadObjFile(name) {
    return new Promise((resolve, reject) => {
      new OBJLoader().load(`src/assets/objs_model/${name}.obj`, (root) => {
        resolve(root);
      });
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
  // 清除掉所有内存
  clearFun() {
    console.log("clearFun");
    this.objs.car_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.car_group);
    this.objs.truck_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.truck_group);
    this.objs.construction_vehicle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.construction_vehicle_group);
    this.objs.bus_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.bus_group);
    this.objs.trailer_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.trailer_group);
    this.objs.barrier_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.barrier_group);
    this.objs.motorcycle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.motorcycle_group);
    this.objs.bicycle_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.bicycle_group);
    this.objs.pedestrian_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.pedestrian_group);
    this.objs.street_cone_group.children.forEach((item) => {
      this.scene.remove(item);
      item.geometry.dispose();
      item.material.dispose();
    });
    this.scene.remove(this.objs.street_cone_group);
    this.resTracker.dispose();
  }
}
