/*
 * @LastEditTime: 2024-03-08 18:42:10
 * @Description:
 */
import demo_jpg from "../assets/road_0.png";
// import demo_jpg from "../assets/demo_p.png";
// import demo_jpg from "../assets/demo.jpg";
// import demo_jpg from "../assets/demo0.png";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "./resourceTracker";

export default class demo {
  resTracker = new ResourceTracker();
  track = this.resTracker.track.bind(this.resTracker);
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
    main_car: null,
    car: null,
    car_group: new THREE.Object3D(),
    suv: null,
    suv_group: [],
    motorcycle: null,
    motorcycle_group: [],
  };
  img_w = 564;
  img_h = 564;
  constructor() {
    this.rgb_data.dom = document.getElementById("bev_box");
    this.init();
    // let c = document.getElementById("img_canvas");
    // c.height = this.img_h;
    // c.width = this.img_w;
    // let ctx = c.getContext("2d");
    // let img_ele = document.createElement("img");
    // img_ele.src = demo_jpg;
    // let _this = this;
    // img_ele.onload = function (e) {
    //   ctx.drawImage(img_ele, 0, 0, _this.img_w, _this.img_h);
    //   let imgData = ctx.getImageData(0, 0, _this.img_w, _this.img_h);
    //   ctx.fillStyle = "pink";
    //   ctx.fillRect(0, 0, c.width, c.height);
    //   let pixelData = imgData.data;
    //   let rgbData = [];
    //   let bev_demo = [];
    //   for (let i = 0; i < pixelData.length; i += 4) {
    //     let red = pixelData[i];
    //     let green = pixelData[i + 1];
    //     let blue = pixelData[i + 2];
    //     rgbData.push([red, green, blue]);
    //     let sign = -1;
    //     if (red === 255 && green === 0 && blue === 0) {
    //       sign = 0;
    //     } else if (green === 0 && red === 0 && blue === 0) {
    //       sign = 1;
    //     } else if (red === 0 && green === 255 && blue === 0) {
    //       sign = 2;
    //     }
    //     // if (red === 0 && green === 0 && blue === 0) {
    //     //   sign = 0;
    //     // } else if (red === 127 && green === 127 && blue === 127) {
    //     //   sign = 1;
    //     // } else if (red === 237 && green === 28 && blue === 36) {
    //     //   sign = 2;
    //     // }
    //     bev_demo.push(sign);
    //   }
    //   _this.initThree(bev_demo, imgData);
    // };
  }
  async initThree(bev_demo, bev_data) {
    this.drawBev(bev_data[1], bev_data[2]);
    await this.handleDataCanvas(bev_demo).then((road) => {
      this.drawData(bev_demo, road);
      // 从 Canvas 上获取图像数据
      // let imageData = this.bev.ctx.getImageData(
      //   0,
      //   0,
      //   this.bev.dom.width,
      //   this.bev.dom.height
      // );
      // 将图像数据转换为 OpenCV 图像格式
      // let src = cv.matFromImageData(imageData);
      // // 将图像转换为灰度图像
      // let gray = new cv.Mat();
      // cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      // 使用Canny边缘检测算法找到图像中的边缘
      // let edges = new cv.Mat();
      // cv.Canny(gray, edges, 50, 150, 3, false);

      // 进行图像二值化处理
      // let binary = new cv.Mat();
      // cv.threshold(gray, binary, 100, 255, cv.THRESH_BINARY);
      // 对图像进行形态学操作，填充路沿之间的空白区域
      // let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(5, 5));
      // cv.morphologyEx(binary, binary, cv.MORPH_CLOSE, kernel);

      // 寻找轮廓
      // let contours = new cv.MatVector();
      // let hierarchy = new cv.Mat();
      // cv.findContours(
      //   binary,
      //   contours,
      //   hierarchy,
      //   cv.RETR_CCOMP,
      //   cv.CHAIN_APPROX_NONE
      //   // cv.CHAIN_APPROX_SIMPLE
      // );
      // 在 Canvas 上绘制轮廓
      // this.bev.ctx.strokeStyle = "green";
      // this.bev.ctx.lineWidth = 1;
      // let num = 0;
      // let color = ["red", "pink", "white", "yellow"];
      // console.log(contours.size(), "contours.size()");
      // for (let i = 0; i < contours.size(); ++i) {
      //   this.bev.ctx.fillStyle = color[num];
      //   let contour = contours.get(i);
      //   // 计算轮廓的面积
      //   let area = cv.contourArea(contour);
      //   let rect = cv.boundingRect(contour);

      //   if (area > 5000 && rect.height >= rect.height - 5) {
      //     num++;
      //     // 计算当前轮廓的外接矩形
      //     // 绘制出轮廓中心点
      //     let centerX = rect.x + rect.width / 2;
      //     let centerY = rect.y + rect.height / 2;
      //     this.bev.ctx.beginPath();
      //     this.bev.ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      //     this.bev.ctx.fill();
      //     // this.bev.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
      //     // console.log(contour.data32S, "contour.data32S");
      //     this.bev.ctx.beginPath();
      //     this.bev.ctx.moveTo(contour.data32S[0], contour.data32S[1]);
      //     let y_arr = contour.data32S.filter((item, index) => index % 2 === 0);
      //     let y_max = Math.max(...y_arr);
      //     for (let j = 2; j < contour.data32S.length; j += 2) {
      //       if (contour.data32S[j + 1] >= y_max) return;
      //       let x = contour.data32S[j],
      //         y = contour.data32S[j + 1];
      //       this.bev.ctx.lineTo(x, y);
      //     }
      //     // for (let j = 2; j < contour.data32S.length; j += 2) {
      //     //   this.bev.ctx.lineTo(contour.data32S[j], contour.data32S[j + 1]);
      //     // }
      //     this.bev.ctx.closePath();
      //     this.bev.ctx.fill();
      //     this.bev.ctx.stroke();
      //   }
      // }

      // // 释放内存
      // src.delete();
      // gray.delete();
      // binary.delete();
      // contours.delete();
      // hierarchy.delete();
    });

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
    let plane_w = this.img_w / 8;
    let plane_h = (plane_w / this.bev.dom.width) * this.bev.dom.height;
    const quad = new THREE.PlaneGeometry(plane_w, plane_h);
    const mesh = new THREE.Mesh(quad, material);
    this.scene.add(mesh);
    this.animate();
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
  // 拿到道路坐标，绘制道路
  drawData(bev_demo, road) {
    // 车的坐标
    let car_point = [this.bev.dom.width / 2, this.bev.dom.height / 2];
    // 根据路沿绘制出道路
    let points = [];
    let right = [],
      left = [];
    road.forEach((item, index) => {
      if (item.length === 0) {
        // console.log(`第${index}行无路沿`);
        return;
      }
      let max_p = item[item.length - 1],
        min_p = item[0];
      if (item.length === 1) {
        if (item[0][0] > car_point[0]) {
          right.push(item[0]);
        } else {
          left.unshift(item[0]);
        }
      } else {
        if (max_p[0] <= car_point[0]) {
          // console.log(left, "left---x最大时在车左侧");
          left.unshift(max_p);
          if (left.length > 1) {
            let m = (-left[1][1] - -left[0][1]) / (left[1][0] - left[0][0]);
            if (m > 0) {
              // console.log("说明线走向递增");
              left.unshift(max_p);
              right.push([this.bev.dom.width, index]);
            } else if (m < 0) {
              // console.log("说明线走向递减");
            }
            // console.log(m, ",");
          }
        } else if (min_p[0] >= car_point[0]) {
          right.push(min_p);
        } else {
          right.push(max_p);
          left.unshift(min_p);
        }
      }

      // console.log(car_point, "car_point");
      // if (max_p[0] <= car_point[0]) {
      //   // 说明该行所有路沿点都在车的左侧
      //   let x = Math.floor((max_p[0] - min_p[0]) / 2 + min_p[0]);
      //   left.push([x, max_p[1]]);
      //   // // 此时要计算该路沿的斜率，判断路沿的倾斜方向
      //   // right.push([this.bev.dom.width, 0]);
      // } else if (min_p[0] >= car_point[0]) {
      //   let x = Math.floor((max_p[0] - min_p[0]) / 2 + min_p[0]);
      //   // left[left.length - 1 - index] = [0, index];
      //   right.push([x, min_p[1]]);
      // } else if (max_p[0] >= car_point[0] && min_p[0] <= car_point[0]) {
      //   right.push(max_p);
      //   left[left.length - 1 - index] = min_p;
      // }
      // console.log(right[index], "right", index);
      // console.log(
      //   left[left.length - 1 - index],
      //   "left",
      //   left.length - 1 - index
      // );
      // 如果最左侧的点都在车的右边，说明该车道该行没有左车道线---直接延申到图片边
      //   if (min_p[0] >= car_point[0] && max_p[0] >= min_p[0]) {
      //     right.push(max_p);
      //     left[left.length - 1 - index] = [0, index];
      //   } else if (max_p[0] <= car_point[0] && min_p[0] <= max_p[0]) {
      //     left[left.length - 1 - index] = min_p;
      //     right.push([this.bev.dom.width, index]);
      //   } else {
      //     right.push(max_p);
      //     left[left.length - 1 - index] = item[0];
      //   }
    });
    points = right.concat(left);
    // console.log(right, "right---left", left);
    // 在 Canvas 上绘制轮廓
    this.bev.ctx.strokeStyle = "#343633";
    this.bev.ctx.fillStyle = "#343633";
    this.bev.ctx.lineWidth = 1;
    this.bev.ctx.beginPath();
    this.bev.ctx.moveTo(...points[0]);
    for (let i = 1; i < points.length; i++) {
      this.bev.ctx.lineTo(...points[i]);
    }
    this.bev.ctx.closePath();
    this.bev.ctx.stroke();
    this.bev.ctx.fill();
    for (let i = 0; i < bev_demo.length; i++) {
      let c = this.getColor(bev_demo[i]);
      let points = this.getPoints(i, this.bev.dom.width);
      this.bev.ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
      this.bev.ctx.fillRect(points[0], points[1], 1, 1);
    }
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
        color = [255, 0, 0, 1];
        break;
      case 1: // 人行横道
        color = [255, 255, 0, 1];
        break;
      case 2: // 车道线
        color = [0, 255, 0, 1];
        break;
      case -1:
        color = [255, 255, 255, 0];
        break;
      case 3:
        color = [80, 82, 79, 0];
        break;
    }
    return color;
  }
  // 获取像素的坐标点，即像素点所在的行列值
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
    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1000);
    this.camera.position.set(0, -25, 42);
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
    this.load3D();
    this.setAmbientLight();
    // this.setLight();
    // this.setMesh();
    this.setControls();
  }
  // 创建环境光
  setAmbientLight(intensity = 1, color = 0xffffff) {
    const light = new THREE.AmbientLight(color, intensity);
    this.scene.add(light);
  }
  // 设置灯光
  setLight() {
    // 添加方向光
    this.directionalLight = new THREE.DirectionalLight(0xff0000, 1);
    this.directionalLight.position.set(0, 0, 2);
    this.dhelper = new THREE.DirectionalLightHelper(this.directionalLight, 25);
    this.scene.add(this.directionalLight);
  }
  // 添加控制器
  setControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
  }
  drawBev(w, h) {
    if (!this.bev.dom) {
      this.bev.dom = document.createElement("canvas");
      this.bev.ctx = this.bev.dom.getContext("2d");
      const devicePixelRatio = window.devicePixelRatio || 1;
      this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
      this.bev.ctx.imageSmoothingEnabled = true;
      this.bev.ctx.imageSmoothingQuality = "high";
    }
    this.img_w = w;
    this.img_h = h;
    this.bev.dom.width = this.img_w * devicePixelRatio;
    this.bev.dom.height = this.img_h * devicePixelRatio;
    // 绘制整体背景颜色
    this.bev.ctx.fillStyle = "#50524f";
    this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
  }
  // 操作绘制障碍物
  drawObjs(objs_data) {
    // console.log(objs_data, "objs_data");
    let car = objs_data.filter((item) => item.class === "car");
    let suv = objs_data.filter((item) => item.class === "suv");
    let motorcycle = objs_data.filter((item) => item.class === "motorcycle");
    this.handle3D("car", car);
  }
  async handle3D(type, data) {
    try {
      if (!this.objs[type]) return;
      let group = this.objs[`${type}_group`],
        model = this.objs[type];
      if (group.children.length <= 0) {
        group.clear();
        for (let i = 0; i < data.length; i++) {
          let point = data[i].center_point;
          if (point[0] !== -1 && point[1] !== -1) {
            point[0] = point[0] / 100;
            point[1] = point[1] / 100;
            let c_model = model.scene.clone();
            c_model.matrixAutoUpdate = true;
            c_model.position.x = point[0];
            c_model.position.y = point[1];
            group.add(c_model);
          }
        }
        this.scene.add(group);
      } else {
        if (group.children.length >= data.length) {
          for (let i = 0; i < data.length; i++) {
            group.children[i].position.x = data[i].center_point[0];
            group.children[i].position.y = data[i].center_point[1];
          }
          for (let j = data.length; j < group.children.length; j++) {
            group.children[j].position.x = 50;
            group.children[j].position.y = 50;
          }
        } else {
          for (let i = 0; i < group.children.length; i++) {
            group.children[i].position.x = data[i].center_point[0];
            group.children[i].position.y = data[i].center_point[1];
          }

          for (
            let j = group.children.length;
            j < data.length;
            j++
          ) {
            let l_c_model = model.scene.clone();
            l_c_model.matrixAutoUpdate = true;
            l_c_model.position.x = data[j].center_point[0];
            l_c_model.position.y = data[j].center_point[1];
            group.add(l_c_model);
          }
          this.scene.add(group);
        }
      }
    } catch (err) {
      console.log(err, "err---handle3D");
    }
  }
  // 加载3D车模型
  async load3D() {
    try {
      const filesArr = ["car_for_games_unity", "car", ];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // debugger
      console.log(res, "res");
      // 主车
      this.objs.main_car = res[0];
      const gltf = this.objs.main_car.scene;
      gltf.rotation.x = Math.PI / 2;
      // 3d辅助框 获取模型的大小
      const box = new THREE.Box3().setFromObject(gltf),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3());
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
