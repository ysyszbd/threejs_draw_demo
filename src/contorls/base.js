import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  CSS3DRenderer,
  CSS3DObject,
} from "three/addons/renderers/CSS3DRenderer.js";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

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
  loadingWidth = 0;
  isLoading = true;
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
    group: null
  }; // 车道线
  objs = {
    obstacles: [],
    num: 0,
    group: new THREE.Group()
  }; // 障碍物
  constructor(mapDOM) {
    this.mapDOM = mapDOM;
    this.setScene();
    this.setCamera();
    this.setAmbientLight();
    this.setLight();
    this.load3D();
    this.setMesh();
    this.setRender();
    this.setControls();
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
    this.directionalLight.position.set(0, 5, -8);
    this.dhelper = new THREE.DirectionalLightHelper(
      this.directionalLight,
      5,
      0xff0000
    );
    this.scene.add(this.directionalLight);
  }
  // 中转车道线数据方法
  drawLanes(info) {
    try {
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
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(cmd, pointsArr, dashed = false, color = "rgb(80,190,225)") {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr);
      // console.log(points, "points");
      const geometry = new LineGeometry();
      geometry.setPositions(points);
      const matLine = new LineMaterial({
        color: color,
        linewidth: this.lineWidth[cmd],
        dashed: dashed,
        vertexColors: false,
      });
      matLine.resolution.set(window.innerWidth, window.innerHeight);
      let line = new Line2(geometry, matLine);
      line.computeLineDistances();
      // this.scene.add(line);
      // console.log(line, "line=======");
      return line;
    } catch (err) {
      console.log(err, "err---setWidthLine");
    }
  }
  // 车道线--绘制线条
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
  // 修改线条坐标
  updateLine(cmd, data) {
    if (cmd === "egoTrjs") {
      const points = this.handlePoints(data);
      this.egoTrjs.headline.geometry.setPositions(points);
    } else if (cmd === "lanes") {
      this.scene.remove(this.lanes.group);
      this.drawLanes(data);
    }
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
  // 加载3D模型
  async load3D() {
    const gltf = await this.loadFile(
      "src/assets/car_model/toyota_fortuner_2021/scene.gltf"
    );
    this.scene.add(gltf.scene);
  }
  // 加载3d模型文件
  loadFile(url) {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        (gltf) => {
          gltf.scene.rotation.y = Math.PI;
          gltf.scene.rotation.x = Math.PI / 2;
          // 获取模型的大小
          const box = new THREE.Box3().setFromObject(gltf.scene);
          // 3d辅助框
          // const boxhlper = new THREE.Box3Helper(box, 0x000000);
          // boxhlper.rotation.x = (Math.PI / 2);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          // console.log(size, "size");
          // console.log(center, 'center');
          // this.scene.add(boxhlper);
          // console.log(gltf.scene, "gltf");
          gltf.scene.position.y = -(size.y / 2) - center.y;
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
          console.log((loaded / total) * 100 + "% loaded");
        },
        (err) => {
          reject(err);
        }
      );
    });
  }
  // 绘制障碍物
  drawObjs() {

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
    requestAnimationFrame(this.update);
    this.renderer.render(this.scene, this.camera);
  };
}
