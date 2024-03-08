import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import ResourceTracker from "./resourceTracker";
import demo_jpg from "../assets/demo.jpg";
// import demo_jpg from "../assets/demo0.png";

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
  box = {
    material: null,
    geometry: null,
  };
  line = {
    material: null,
    geometry: null,
  };
  loadingWidth = 0;
  isLoading = true;
  resTracker = new ResourceTracker();
  track = this.resTracker.track.bind(this.resTracker);
  lineNum = 0; // 暂时用来控制接收数据的次数
  lineWidth = {
    egoTrjs: 2,
    lanes: 3,
    road: 20,
  }; // 线段的宽度
  road = {
    left: null,
    right: null,
    group: null,
  };
  egoTrjs = {
    headline: null,
    num: 0, // 用于判断是否第一次绘制
    color: "rgb(80,190,225)",
  }; // 车头线
  lanes = {
    lanelines: [],
    num: 0,
    color: "rgb(255, 255, 255)",
    group: null,
  }; // 车道线
  objs = {
    obstacles: [],
    num: 0,
    group: null,
    little_car_g: new THREE.Object3D(),
    little_car: null,
    bus: null,
    bicycle_p: null,
    bicycle: null,
    cone: null,
    barrier: null,
  }; // 障碍物
  box = {
    group: null,
  }; // 线框
  num = 100;
  renderObj;
  bev = {
    dom: null,
    ctx: null,
  };
  constructor() {
    this.setScene();
    this.initBoxMG();
    // this.loadObjs();
    this.setAmbientLight();
    this.setLight();
    // 初始化线框所需的几何体、材质、mesh
    this.setMesh();
    this.drawBev();
  }
  drawBev() {
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    c.width = 1152;
    c.height = 648;
    let img_ele = document.createElement("img");
    img_ele.src = demo_jpg;
    let _this = this;
    img_ele.onload = function (e) {
      ctx.drawImage(img_ele, 0, 0, 1152, 648);
      let imgData = ctx.getImageData(0, 0, c.width, c.height);
      console.log(imgData, "imgData");
      let pixelData = imgData.data;
      let rgbData = [];
      let bev_demo = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        let red = pixelData[i];
        let green = pixelData[i + 1];
        let blue = pixelData[i + 2];
        rgbData.push([red, green, blue]);
        let sign = -1;
        if (red === 0 && green === 0 && blue === 0) {
          sign = 0;
        } else if (red === 127 && green === 127 && blue === 127) {
          sign = 1;
        } else if (red === 237 && green === 28 && blue === 36) {
          sign = 2;
        }
        bev_demo.push(sign);
      }

      let w_i = 0,
        h_i = 0;
      for (let i = 0; i < bev_demo.length; i++) {
        let c = _this.getColor(bev_demo[i]);
        h_i = Math.floor(i / c.width);
        w_i = i - c.width * h_i;
        ctx.fillStyle = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
        ctx.fillRect(w_i * 1, h_i * 1, 1, 1);
      }
      let mapBg = new THREE.CanvasTexture(c.dom);
      mapBg.colorSpace = THREE.SRGBColorSpace;
      mapBg.wrapS = mapBg.wrapT = THREE.RepeatWrapping;
      // _this.scene.background = mapBg;
      const materialCanvas = new THREE.MeshBasicMaterial({ map: mapBg });
      const geometry = new THREE.PlaneGeometry(100, 100);
      const meshCanvas = new THREE.Mesh(geometry, materialCanvas);
      meshCanvas.rotation.x = -Math.PI / 2;
      meshCanvas.scale.set(1000, 1000, 1000);
      _this.scene.add(meshCanvas);
    };
  }
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
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(
    cmd,
    pointsArr,
    dashed = false,
    color = "rgb(80,190,225)",
    lineW
  ) {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr);
      const geometry = this.track(new LineGeometry());
      geometry.setPositions(points);
      const matLine = this.track(
        new LineMaterial({
          color: color,
          linewidth: this.lineWidth[cmd] || lineW,
          dashed: dashed,
          vertexColors: false,
        })
      );
      matLine.resolution.set(window.innerWidth, window.innerHeight);
      let line = new Line2(geometry, matLine);
      line.computeLineDistances();
      return line;
    } catch (err) {
      console.log(err, "err---setWidthLine");
    }
  }
  // 绘制车头线egoTrjs--车头线逻辑是将
  drawHeadLine(points) {
    if (!this.egoTrjs.headline) {
      this.egoTrjs.headline = this.setWidthLine(
        "egoTrjs",
        points,
        false,
        this.egoTrjs.color
      );
      this.scene.add(this.egoTrjs.headline);
    } else {
      this.egoTrjs.headline.geometry.setPositions(this.handlePoints(points));
    }
  }

  // lanes
  // 释放车道线内存
  initLanesGroup() {
    // 释放资源
    // 车道线是一堆线，把之前的线清除掉后再生成新的线
    if (this.lanes.group) {
      this.lanes.group.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.lanes.group);
    }
    this.resTracker.dispose();
    this.lanes.group = null;
  }
  // 车道线lanes--整理线类型
  drawLanes(info) {
    try {
      let road = info.filter((res) => {
        return res.type === 2;
      });
      this.drawMeshRoad(road);
      // console.log(road, "info==========");
      this.initLanesGroup();
      let line = [],
        color = this.lanes.color;
      this.lanes.group = new THREE.Group();

      for (let i = 0; i < info.length; i++) {
        if (info[i].type < 3) {
          switch (info[i].type) {
            case 0:
              color = "rgb(0, 128, 0)";
              break;
            case 1:
              color = "rgb(255, 255, 0)";
              break;
            case 2:
              color = "rgb(255, 0, 0)";
              break;
          }
          switch (info[i].nMarkType) {
            case 1:
              line = this.setLine(info[i].points, false, color);
              // console.log("实线");
              break;
            case 2:
              line = this.setLine(info[i].points, true, color);
              // console.log("长虚线");
              break;
            case 3:
              switch (info[i].nDlmType) {
                case 0:
                case 5:
                  line = this.setLine(info[i].points, false, color);
                  // console.log("实线");
                  break;
                case 1:
                  line = this.setLine(info[i].points, null, color, "sd");
                  // console.log("左实右虚线");
                  break;
                case 2:
                  line = this.setLine(info[i].points, null, color, "ds");
                  // console.log("左虚右实线");
                  break;
                case 3:
                  // console.log("双实线");
                  line = this.setLine(
                    info[i].points,
                    false,
                    "rgb(255, 192, 203)",
                    "ss"
                  );
                  break;
                case 4:
                  // console.log("双虚线");
                  line = this.setLine(
                    info[i].points,
                    true,
                    "rgb(255, 192, 203)",
                    "dd"
                  );
                  break;
              }
              break;
            case 5:
              switch (info[i].nDecelType) {
                case 0:
                case 1:
                case 3:
                case 4:
                case 5:
                  // console.log("实线");
                  line = this.setLine(info[i].points, false, color);
                  break;
                case 2:
                  // console.log("长虚线");
                  line = this.setLine(info[i].points, true, color);
                  break;
              }
              break;
            case 0:
            case 4:
            case 6:
              // console.log("实线");
              line = this.setLine(info[i].points, false, color);
              break;
          }
        } else {
          switch (info[i].nMarkType) {
            case 22:
              // console.log("实线");
              line = this.setLine(info[i].points, false, "rgb(255, 165, 0)");
              break;
            case 11:
            case 17:
            case 254:
            case 0:
              line = this.setLine(info[i].points, false, "rgb(220, 220, 220)");
              // console.log("实线");
              break;
            case 1:
              line = this.setLine(info[i].points, true, this.lanes.color);
              // console.log("长虚线");
              break;
            case 2:
              line = this.setLine(
                info[i].points,
                false,
                this.lanes.color,
                "ss"
              );
              // console.log("双实线", line);
              break;
            case 3:
              line = this.setLine(info[i].points, false, this.lanes.color);
              // console.log("实线");
              break;
            case 4:
              line = this.setLine(info[i].points, null, this.lanes.color, "ds");
              // console.log("左虚右实线");
              break;
            case 5:
              line = this.setLine(info[i].points, null, this.lanes.color, "sd");
              // console.log("左实右虚线");
              break;
            case 9:
              line = this.setLine(info[i].points, true, this.lanes.color, "dd");
              // console.log("双虚线");
              break;
            case 256:
              line = this.setLine(info[i].points, false, this.lanes.color);
              // console.log("实线");
              break;
          }
        }
        for (let j = 0; j < line.length; j++) {
          this.lanes.group.add(line[j]);
        }
        this.scene.add(this.lanes.group);
      }
    } catch (err) {
      console.log(err, "err---drawLanes");
    }
  }
  // 车道线lanes--绘制线条
  setLine(
    pointsArr,
    dashed = false, // false实线、true虚线
    color = "rgb(255, 255, 255)",
    type = null // type: 双实线ss、双虚线dd、左实右虚线sd、左虚右实线ds
  ) {
    if (!type) {
      return [this.setWidthLine("lanes", pointsArr, dashed, color)];
    }
    // 定义左line、右line
    let lineL, lineR;
    switch (type) {
      case "ss":
      case "dd":
        lineL = this.setWidthLine("lanes", pointsArr, dashed, color);
        lineR = lineL.clone();
        break;
      case "sd":
        lineL = this.setWidthLine("lanes", pointsArr, false, color);
        lineR = this.setWidthLine("lanes", pointsArr, true, color);
        break;
      case "ds":
        lineL = this.setWidthLine("lanes", pointsArr, true, color);
        lineR = this.setWidthLine("lanes", pointsArr, false, color);
        break;
    }

    lineL.position.x -= 0.01;
    lineR.position.x += 0.01;
    return [lineL, lineR];
  }
  // 处理带宽度的线条坐标数据
  handlePoints(pointsArr) {
    // 处理坐标数据
    const points = [];
    pointsArr.forEach((item, index) => {
      points.push(item.x, item.y, 0);
    });
    return points;
  }
  // 加载3D模型
  async load3D() {
    const car = await this.loadFile("car_for_games_unity", "主车");
    const gltf = car.scene;
    // 旋转模型
    // gltf.scene.rotation.y = Math.PI;
    gltf.rotation.x = Math.PI / 2;
    // 3d辅助框 获取模型的大小
    const box = new THREE.Box3().setFromObject(gltf),
      center = box.getCenter(new THREE.Vector3()),
      size = box.getSize(new THREE.Vector3());
    gltf.position.y = -(size.y / 2) - center.y;
    this.scene.add(gltf);
    gltf.matrixAutoUpdate = false;
    gltf.updateMatrix();
  }
  // 加载障碍物模型
  async loadObjs() {
    try {
      const filesArr = [
        "car_for_games_unity",
        "bus",
        "bicycle_low-poly_minimalistic",
        "bicycle_low-poly_minimalistic",
        "street_cone",
        "street_cone",
        "barrier",
        "car_for_games_unity",
      ];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // debugger
      console.log(res, "res");
      // 主车
      const gltf = res[7].scene;
      gltf.rotation.x = Math.PI / 2;
      // 3d辅助框 获取模型的大小
      const box = new THREE.Box3().setFromObject(gltf),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3());
      gltf.position.y = -(size.y / 2) - center.y;
      this.scene.add(gltf);
      gltf.matrixAutoUpdate = false;
      gltf.updateMatrix();
      // 小车
      this.objs.little_car = res[0];
      const little_car = this.objs.little_car.scene;
      little_car.rotation.x = Math.PI / 2;
      little_car.position.y = -10;
      little_car.position.x = -10;
      this.scene.add(little_car);
      little_car.matrixAutoUpdate = false;
      little_car.updateMatrix();
      // 自行车--无人
      this.objs.bicycle = res[3];
      const bicycle = this.objs.bicycle.scene;
      bicycle.rotation.x = Math.PI / 2;
      bicycle.rotation.y = Math.PI;
      bicycle.position.x = -3;
      bicycle.position.y = -4;
      bicycle.scale.set(2, 2, 2);
      this.scene.add(bicycle);
      bicycle.matrixAutoUpdate = false;
      bicycle.updateMatrix();
      // bus
      this.objs.bus = res[1];
      const bus = this.objs.bus.scene;
      bus.rotation.x = Math.PI / 2;
      bus.rotation.y = Math.PI;
      bus.position.x = -16;
      bus.position.y = -4;
      this.scene.add(bus);
      bus.matrixAutoUpdate = false;
      bus.updateMatrix();
      // cone锥桶
      this.objs.cone = res[5];
      const cone = this.objs.cone.scene;
      cone.rotation.x = Math.PI / 2;
      cone.position.x = -16;
      cone.position.y = -4;
      this.scene.add(cone);
      cone.matrixAutoUpdate = false;
      cone.updateMatrix();
      // barrier栅栏
      this.objs.barrier = res[6];
      const barrier = this.objs.barrier.scene;
      barrier.rotation.x = Math.PI / 2;
      barrier.position.x = 5;
      barrier.position.y = 4;
      this.scene.add(barrier);
      barrier.matrixAutoUpdate = false;
      barrier.updateMatrix();
    } catch (err) {
      console.log(err, "err---loadObjs");
    }
  }
  // 加载3d模型文件
  loadFile(url, type) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        `src/assets/car_model/${url}/scene.gltf`,
        (gltf) => {
          resolve(gltf);
        },
        ({ loaded, total }) => {
          // let load = Math.abs((loaded / total) * 100);
          // this.loadingWidth = load;
          // if (load >= 100) {
          //   setTimeout(() => {
          //     this.isLoading = false;
          //   }, 1000);
          // }
          // console.log((loaded / total) * 100 + "% loaded", type);
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 清除障碍物group
  initObjGroup() {
    if (this.objs.group) {
      this.objs.group.children.forEach((item) => {
        // console.log(item, "item");
        this.scene.remove(item);
      });
      this.scene.remove(this.objs.group);
    }
    // 释放资源
    this.resTracker.dispose();
    this.objs.group = null;
  }
  // 操作障碍物
  handleObj(data) {
    // this.initObjGroup();
    let l_c = [];
    data.forEach((item) => {
      if (item.nType === 0) {
        l_c.push(item);
      }
    });
    // console.log(l_c, data);
    if (!this.objs.little_car) return;
    if (this.objs.little_car_g.children.length <= 0) {
      //   debugger;
      this.objs.little_car_g.clear();
      for (let i = 0; i < l_c.length; i++) {
        let l_c_model = this.objs.little_car.scene.clone();
        // this.track(l_c_model);
        l_c_model.matrixAutoUpdate = true;
        l_c_model.position.x = data[i].fX;
        l_c_model.position.y = data[i].fY;
        this.objs.little_car_g.add(l_c_model);
      }
      this.scene.add(this.objs.little_car_g);
    } else {
      if (this.objs.little_car_g.children.length >= l_c.length) {
        for (let i = 0; i < l_c.length; i++) {
          this.objs.little_car_g.children[i].position.x = l_c[i].fX;
          this.objs.little_car_g.children[i].position.y = l_c[i].fY;
        }
        for (
          let j = l_c.length;
          j < this.objs.little_car_g.children.length;
          j++
        ) {
          this.objs.little_car_g.children[j].position.x = 100;
          this.objs.little_car_g.children[j].position.y = 100;
        }
      } else {
        for (let i = 0; i < this.objs.little_car_g.children.length; i++) {
          console.log(
            l_c[i],
            "l_c[i]",
            l_c,
            i,
            this.objs.little_car_g.children.length
          );
          this.objs.little_car_g.children[i].position.x = l_c[i].fX;
          this.objs.little_car_g.children[i].position.y = l_c[i].fY;
        }

        for (
          let j = this.objs.little_car_g.children.length;
          j < l_c.length;
          j++
        ) {
          let l_c_model = this.objs.little_car.scene.clone();
          // this.track(l_c_model);
          l_c_model.matrixAutoUpdate = true;
          l_c_model.position.x = data[j].fX;
          l_c_model.position.y = data[j].fY;
          this.objs.little_car_g.add(l_c_model);
        }
        this.scene.add(this.objs.little_car_g);
      }
    }
  }

  // 绘制线框
  drawBoxs(data) {
    // console.log(data, "data===xiankuang");
    this.initBoxGroup();
    this.box.group = new THREE.Group();
    let box;
    for (let i = 0; i < data.length; i++) {
      box = this.setObj(data[i]);
      this.box.group.add(box);
    }
    this.scene.add(this.box.group);
  }
  // 释放box线框资源
  initBoxGroup() {
    if (this.box.group) {
      this.box.group.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.box.group);
    }
    // 释放资源
    this.resTracker.dispose();
    this.box.group = null;
  }
  // 初始化 几何体geometry、材质material
  initBoxMG() {
    // 初始化 线框 几何体geometry+材质material
    this.box.geometry = this.track(new THREE.BoxGeometry(2, 4, 2, 2, 2, 2));
    this.box.material = this.track(
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    // 初始化 道路 所需的材质material
    // this.road.material = new THREE.MeshBasicMaterial({
    //   color: "rgb(53, 52, 52)",
    // });
  }
  // 绘制 单个线框
  setObj(data) {
    try {
      const object = new THREE.Mesh(this.box.geometry, this.box.material);
      object.position.set(data.fX, data.fY, 1);
      const box = new THREE.BoxHelper(object, 0xff6100);
      return box;
    } catch (err) {
      console.log(err, "err---setObj");
    }
  }

  // 创建场景
  setScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    this.scene2 = new THREE.Scene();
  }
  drawBev() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d");
    this.bev.dom.width = 1152;
    this.bev.dom.height = 648;
  }
  // 创建相机
  setCamera() {
    // this.drawBev();
    // 正投影相机案例
    // const width = 1152; //canvas画布宽度
    // const height = 648; //canvas画布高度
    // const k = 1152 / 648; //canvas画布宽高比
    // const s = 600; //控制left, right, top, bottom范围大小
    // this.camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 8000);
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.mapDOM.clientWidth / this.mapDOM.clientHeight,
      0.1,
      1200
    );
    this.camera.position.set(0, -38, 22);
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
    this.directionalLight.position.set(0, 5, 0);
    this.dhelper = new THREE.DirectionalLightHelper(this.directionalLight, 25);
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
    // this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // 将render里面的dom添加到目标dom中
    this.mapDOM.appendChild(this.renderer.domElement);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  // 初始化道路元素
  setMeshRoad(points, directoin) {
    let x0, x2, x1;
    if (directoin === "left") {
      x0 = points[0].x - 1;
    }
    if (directoin === "right") {
      x0 = points[0].x + 1;
    }

    const shapes = this.track(new THREE.Shape());
    shapes.moveTo(x0, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (directoin === "left") x2 = points[i].x - 1;
      if (directoin === "right") x2 = points[i].x + 1;
      shapes.lineTo(x2, points[i].y);
    }
    for (let i = points.length - 1; i >= 0; i--) {
      if (directoin === "left") x1 = points[i].x + 6;
      if (directoin === "right") x1 = points[i].x - 8;
      shapes.lineTo(x1, points[i].y);
    }
    const geometry = this.track(new THREE.ShapeGeometry(shapes));
    const material = this.track(
      new THREE.MeshBasicMaterial({
        color: "rgb(53, 52, 52)",
      })
    );
    const mesh = new THREE.Mesh(geometry, material);
    return mesh;
  }
  // 释放道路占用的内存
  initRoadGroup() {
    if (this.road.group) {
      this.road.group.children.forEach((item) => {
        this.scene.remove(item);
        item.geometry.dispose();
        item.material.dispose();
      });
      this.scene.remove(this.road.group);
    }
    this.resTracker.dispose();
    this.road.group = null;
  }
  // 线类型是2是指路沿两边
  drawMeshRoad(data) {
    try {
      this.initRoadGroup();
      this.road.group = new THREE.Object3D();
      const l_mesh = this.setMeshRoad(data[0].points, "left");
      this.road.group.add(l_mesh);
      const r_mesh = this.setMeshRoad(data[1].points, "right");
      this.road.group.add(r_mesh);
      this.scene.add(this.road.group);
    } catch (err) {
      console.log(err, "err---drawMeshRoad");
    }
  }
  // 绘制辅助网格、坐标
  setMesh() {
    let gridHelper = new THREE.GridHelper(
      200,
      40
      // "rgb(238, 14, 14)",
      // "rgb(158, 156, 153)"
    );
    gridHelper.rotation.x = -(Math.PI / 2);
    // gridHelper.rotation.x = -(Math.PI / 2);
    // let axesHelper = new THREE.AxesHelper(150);
    // axesHelper.setColors('rgb(0, 0, 0)', 'rgb(248, 13, 13)', 'rgb(248, 13, 142)')
    // this.scene.add( axesHelper );
    this.scene.add(gridHelper);
  }
  // 根据窗口大小对应改变
  resize() {
    this.camera.aspect = this.mapDOM.clientWidth / this.mapDOM.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.mapDOM.clientWidth, this.mapDOM.clientHeight);
  }
  // 更新视图
  update = () => {
    // console.log(this.renderer.info, "统计信息0");
    // 清除深度缓存---很重要
    this.renderer.clearDepth();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.update);
    // console.log(this.renderer.info, "统计信息1");
  };
  waitSeconds(seconds = 0) {
    return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  }
  clear() {
    this.initBoxGroup();
    this.initLanesGroup();
    this.resTracker.dispose();
  }
  start(mapDOM) {
    this.mapDOM = mapDOM;
    this.setCamera();
    this.setRender();
    this.setControls();
  }
}
