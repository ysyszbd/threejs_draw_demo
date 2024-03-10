import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "./resourceTracker";
import { dispose } from "echarts";

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
  objs = {
    main_car: null,
    car: null,
    car_group: new THREE.Object3D(),
    suv: null,
    suv_group: [],
    motorcycle: null,
    motorcycle_group: [],
  };
  bevW = 0;
  bevH = 0;
  material = null;
  geometry = null;
  mesh = null;
  mapBg = null;
  constructor() {
    this.rgb_data.dom = document.getElementById("bev_box");
    this.init();
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d");
    this.bev.dom.height = 10;
    this.bev.dom.width = 10;
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.bev.ctx.imageSmoothingEnabled = true;
    this.bev.ctx.imageSmoothingQuality = "high";
    // 绘制整体背景颜色
    // this.bev.ctx.fillStyle = "pink";
    // this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);

    // this.mapBg = new THREE.CanvasTexture(this.bev.dom);

    // this.mapBg.colorSpace = THREE.SRGBColorSpace;
    // this.mapBg.wrapS = this.mapBg.wrapT = THREE.RepeatWrapping;
    // this.material = new THREE.MeshPhongMaterial({
    //   map: this.mapBg,
    //   side: THREE.DoubleSide,
    // });
    // let plane_w = this.bev.dom.width;
    // let plane_h = this.bev.dom.height;
    // this.geometry = new THREE.PlaneGeometry(plane_w, plane_h);
    // this.mesh = new THREE.Mesh(this.geometry, this.material);

    // this.scene.add(this.mesh);
    this.animate();
  }
  async getData(bev_demo, bev_data, objs_data) {
    try {
      // console.log(bev_data, "bev_data===");
      this.drawBev(bev_data[1], bev_data[2], bev_demo);
      this.handleObjs(objs_data);
      // this.drawData(bev_demo);
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  handleObjs(objs_data) {
    for (let i = 0; i < objs_data.length; i++) {
      if (objs_data[i].length <= 0) break;
      // console.log(objs_data[i], 'i');
      this.handle3D("car", objs_data[i]);
    }
  }
  async handle3D(type, data) {
    try {
      // console.log(data, "data");
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
            c_model.position.x = point[1];
            c_model.position.y = point[0];
            // c_model.position.x = point[0];
            // c_model.position.y = point[1];
            c_model.position.z = point[2];
            c_model.rotation.y = -point[9];

            group.add(c_model);
          }
        }
        this.scene.add(group);
      } else {
        if (group.children.length >= data.length) {
          for (let i = 0; i < data.length; i++) {
            group.children[i].position.x = data[i][1];
            group.children[i].position.y = data[i][0];
            // group.children[i].position.x = data[i][0];
            // group.children[i].position.y = data[i][1];
            group.children[i].position.z = data[i][2];
            group.children[i].rotation.y = -data[i][9];
          }
          for (let j = data.length; j < group.children.length; j++) {
            group.children[j].position.x = 50;
            group.children[j].position.y = 50;
          }
        } else {
          for (let i = 0; i < group.children.length; i++) {
            group.children[i].position.x = data[i][1];
            group.children[i].position.y = data[i][0];
            // group.children[i].position.x = data[i][0];
            // group.children[i].position.y = data[i][1];
            group.children[i].position.z = data[i][2];
            group.children[i].rotation.y = -data[i][9];
          }

          for (
            let j = group.children.length;
            j < data.length;
            j++
          ) {
            let l_c_model = model.scene.clone();
            l_c_model.matrixAutoUpdate = true;
            l_c_model.position.x = data[j][1];
            l_c_model.position.y = data[j][0];
            // l_c_model.position.x = data[j][0];
            // l_c_model.position.y = data[j][1];
            l_c_model.position.z = data[j][2];
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
    for (let i = 0; i < bev_demo.length; i++) {
      let c = this.getColor(bev_demo[i]);
      let points = this.getPoints(i, this.bev.dom.width);
      this.bev.ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
      this.bev.ctx.fillRect(points[0], points[1], 1, 1);
    }
    // this.scene.background = this.bev.dom;
  }
  // 处理语义分割的数据，拿到所有路沿的位置坐标，按行列存储
  handleDataCanvas(bev_demo) {
    try {
      return new Promise((resolve, reject) => {
        console.log(this, "his");
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
      this.img_w = w;
      this.img_h = h;
      this.bev.dom.width = this.img_w;
      this.bev.dom.height = this.img_h;
      this.drawData(bev_demo);
      // this.bev.ctx.fillStyle = "yellow";
      // this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
      // 更新 CanvasTexture
      // this.mapBg.needsUpdate = true;
      this.scene.remove(this.mapBg);
      this.scene.remove(this.material);
      this.scene.remove(this.geometry);
      this.mapBg?.dispose();
      this.material?.dispose();
      this.geometry?.dispose();
      this.resTracker.dispose();

      this.mapBg = this.track(new THREE.CanvasTexture(this.bev.dom));
      
      this.mapBg.colorSpace = THREE.SRGBColorSpace;
      this.mapBg.wrapS = this.mapBg.wrapT = THREE.RepeatWrapping;
      this.material = this.track(new THREE.MeshPhongMaterial({
        map: this.mapBg,
        side: THREE.DoubleSide,
      }));
      let plane_w = 60;
      let plane_h = 60;
      this.geometry = this.track(new THREE.PlaneGeometry(plane_w, plane_h));
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.rotation.x = Math.PI;
      this.mesh.rotation.z =- Math.PI / 2;
      // this.mesh.

      this.scene.add(this.mesh);
    } catch (err) {
      console.log(err, "err==drawBev");
    }
    // 标记顶点位置已更改，以便 Three.js 更新几何体
    // this.geometry.verticesNeedUpdate = true;
    // console.log(this.geometry, "this.geometry===");
    // this.geometry.set(w, h);
    // 更新顶点坐标
    // this.geometry.vertices[0].set(-w / 2, h / 2, 0); // 左上角顶点
    // this.geometry.vertices[1].set(w / 2, h / 2, 0); // 右上角顶点
    // this.geometry.vertices[2].set(-w / 2, -h / 2, 0); // 左下角顶点
    // this.geometry.vertices[3].set(w / 2, -h / 2, 0); // 右下角顶点
  }
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    var width = this.rgb_data.dom.clientWidth;
    var height = this.rgb_data.dom.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 1000);
    this.camera.position.set(0, -20, 52);
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
    // this.setMesh();
    this.load3D();
    this.setAmbientLight();
    this.setControls();
  }
  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = ["car_for_games_unity", "car_for_games_unity"];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // debugger
      // console.log(res, "res");
      // 主车
      this.objs.main_car = res[0];
      const gltf = this.objs.main_car.scene;
      gltf.rotation.x = Math.PI / 2;
      // 3d辅助框 获取模型的大小
      const box = new THREE.Box3().setFromObject(gltf),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3());
      console.log(center, "center");
      console.log(size, "size");
      // gltf.position.y = -(size.y / 2) - center.y;
      this.scene.add(gltf);
      gltf.matrixAutoUpdate = false;
      gltf.updateMatrix();
      // 小车
      this.objs.car = res[1];
      const car = this.objs.car.scene;
      car.rotation.x = Math.PI / 2;
      car.rotation.y = Math.PI;
      car.position.y = -50;
      car.position.x = -50;
      this.scene.add(car);
      car.matrixAutoUpdate = false;
      car.updateMatrix();
      console.log(this.objs.car, "this.objs.car");
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
          resolve(gltf);
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
    this.scene.add(gridHelper);
  }
}
