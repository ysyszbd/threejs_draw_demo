import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import ResourceTracker from "./resourceTracker";

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
  }; // 线段的宽度
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
  constructor(mapDOM) {
    this.mapDOM = mapDOM;
    this.setScene();
    this.setCamera();
    this.setAmbientLight();
    this.setLight();
    this.setRender();
    this.setControls();
    // 初始化线框所需的几何体、材质、mesh
    this.initBoxMG();
    // this.initSetMesh();
    // this.load3D();
    // this.loadObjs();
    this.setMesh();
  }
  // 获取dom元素--用来放置障碍物
  getDom() {
    // this.objs.little_car = document.getElementById("little_car");
    // this.objs.bus = document.getElementById("bus");
    // this.objs.bicycle = document.getElementById("bicycle");
    // this.objs.cone = document.getElementById("cone");
    const element = document.createElement("div");
    element.style.width = 10 + "px";
    element.style.height = 10 + "px";
    element.style.opacity = 0.75;
    element.style.background = "#000";
    
    console.log(this.objs, "this.objs");
  }
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(cmd, pointsArr, dashed = false, color = "rgb(80,190,225)") {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr);
      const geometry = this.track(new LineGeometry());
      geometry.setPositions(points);
      const matLine = this.track(
        new LineMaterial({
          color: color,
          linewidth: this.lineWidth[cmd],
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
        // console.log(this.lanes.group.children, "this.lanes.group children");
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
    const car = await this.loadFile("car_for_games_unity/scene.gltf", "主车");
    const gltf = car.scene;
    console.log(car, "car");
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
      // 小车
      const little_car = await this.loadFile("car_for_games_unity/scene.gltf");
      little_car.scene.rotation.x = Math.PI / 2;
      little_car.scene.position.y = 6;
      little_car.scene.position.x = 0;
      this.scene.add(little_car.scene);
      // 自行车--无人
      const bicycle = await this.loadFile(
        "bicycle_low-poly_minimalistic/scene.gltf"
      );
      bicycle.scene.rotation.x = Math.PI / 2;
      bicycle.scene.rotation.y = Math.PI;
      bicycle.scene.position.x = -3;
      bicycle.scene.position.y = -4;
      bicycle.scene.scale.set(2, 2, 2);
      this.scene.add(bicycle.scene);
      // bus
      const bus = await this.loadFile("bus/scene.gltf");
      bus.scene.rotation.x = Math.PI / 2;
      bus.scene.rotation.y = Math.PI;
      bus.scene.position.x = -16;
      bus.scene.position.y = -4;
      this.scene.add(bus.scene);
      // cone锥桶
      const cone = await this.loadFile("street_cone/scene.gltf");
      cone.scene.rotation.x = Math.PI / 2;
      cone.scene.position.x = -16;
      cone.scene.position.y = -4;
      this.scene.add(cone.scene);
      // barrier栅栏
      this.objs.barrier = await this.loadFile("barrier/scene.gltf");
      this.objs.barrier.scene.rotation.x = Math.PI / 2;
      this.objs.barrier.scene.position.x = 5;
      this.objs.barrier.scene.position.y = 4;
      this.scene.add(this.objs.barrier.scene);

      // let barrier = THREE.Object3D.prototype.clone.call( this.objs.barrier );
      // barrier.scene.position.x = -5 ;
      // barrier.scene.position.y = 4 ;
    } catch (err) {
      console.log(err, "err---loadObjs");
    }
  }
  // 加载3d模型文件
  loadFile(url, type) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        `src/assets/car_model/${url}`,
        (gltf) => {
          resolve(gltf);
        },
        ({ loaded, total }) => {
          let load = Math.abs((loaded / total) * 100);
          this.loadingWidth = load;
          if (load >= 100) {
            setTimeout(() => {
              this.isLoading = false;
            }, 1000);
          }
          console.log((loaded / total) * 100 + "% loaded", type);
        },
        (err) => {
          reject(err);
        }
      );
    });
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
  // 绘制 n个线框
  initSetMesh() {
    this.initBoxGroup();
    this.box.group = new THREE.Group();
    let data = {
      fX: 0,
      fY: 0,
    };
    for (let i = this.num; i > 0; i--) {
      this.box.group.add(this.setObj(data));
      data.fX += 5;
      data.fY += 5;
    }
    this.scene.add(this.box.group);
  }
  // 释放box线框资源
  initBoxGroup() {
    if (this.box.group) {
      // console.log(this.box.group.children, "this.box.group.children");
      this.box.group.children.forEach((item) => {
        // console.log(item, "item");
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
  // 初始化 线框 几何体geometry+材质material
  initBoxMG() {
    this.box.geometry = this.track(new THREE.BoxGeometry(2, 4, 2, 2, 2, 2));
    this.box.material = this.track(
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
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
  // 创建相机
  setCamera() {
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

    this.renderObj = new CSS3DRenderer();
    this.renderObj.setSize(this.mapDOM.clientWidth, this.mapDOM.clientHeight);
    this.mapDOM.appendChild(this.renderObj.domElement);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
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
    let axesHelper = new THREE.AxesHelper(150);
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
}
