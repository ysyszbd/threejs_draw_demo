import demo_jpg from "../assets/road_0.png";
// import demo_jpg from "../assets/demo_p.png";
// import demo_jpg from "../assets/demo.jpg";
// import demo_jpg from "../assets/demo0.png";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { ObserverInstance } from "@/controls/event/observer";
import ResourceTracker from "./resourceTracker";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";

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
  bev = {
    dom: null,
    ctx: null,
  };
  lines = {
    group: new THREE.Group(),
    line: null,
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
  canvas_p = [564 / 2, 564 / 2];
  constructor() {
    this.rgb_data.dom = document.getElementById("bev_box");
    this.init();
    let c = document.getElementById("img_canvas");
    c.height = this.img_h;
    c.width = this.img_w;
    let ctx = c.getContext("2d");
    let img_ele = document.createElement("img");
    img_ele.src = demo_jpg;
    let _this = this;
    img_ele.onload = function (e) {
      ctx.drawImage(img_ele, 0, 0, _this.img_w, _this.img_h);
      let imgData = ctx.getImageData(0, 0, _this.img_w, _this.img_h);
      let pixelData = imgData.data;
      let rgbData = [];
      let bev_demo = [];
      for (let i = 0; i < pixelData.length; i += 4) {
        let red = pixelData[i];
        let green = pixelData[i + 1];
        let blue = pixelData[i + 2];
        rgbData.push([red, green, blue]);
        let sign = -1;
        if (red === 255 && green === 0 && blue === 0) {
          sign = 0;
        } else if (green === 0 && red === 0 && blue === 0) {
          sign = 1;
        } else if (red === 0 && green === 255 && blue === 0) {
          sign = 2;
        }
        bev_demo.push(sign);
      }
      _this.initThree(bev_demo);
    };
  }
  async initThree(bev_demo) {
    try {
      this.drawBev();
      // 绘制语义分割的canvas
      this.drawCanvas(bev_demo);
      // await this.handleDataCanvas(bev_demo).then((road) => {
      //   // this.drawData(bev_demo, road);
      //   this.cvHandle();
      // });
      let mapBg = new THREE.CanvasTexture(this.bev.dom);
      mapBg.colorSpace = THREE.SRGBColorSpace;
      mapBg.wrapS = mapBg.wrapT = THREE.RepeatWrapping;
      const material = new THREE.MeshPhongMaterial({
        map: mapBg,
        side: THREE.DoubleSide,
      });
      let plane_w = 60;
      let plane_h = 60;
      const quad = new THREE.PlaneGeometry(plane_w, plane_h);
      const mesh = new THREE.Mesh(quad, material);
      this.scene.add(mesh);
      this.animate();
      // opencv获取路沿所需的点坐标
      this.cvHandle();
      mapBg.needsUpdate = true;
    } catch (err) {
      console.log(err, "err---initThree");
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
          let points = [-1, -1];
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
        resolve(road);
      });
    } catch (err) {
      console.log(err, "err---handleDataCanvas");
    }
  }
  // 拿到道路坐标，绘制道路
  drawData(bev_demo, road) {
    // // 车的坐标
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
    //         // console.log(m, ",");
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
    // console.log(right, "right---left", left);
    // 在 Canvas 上绘制轮廓
    this.bev.ctx.strokeStyle = "#343633";
    this.bev.ctx.fillStyle = "#343633";
    this.bev.ctx.lineWidth = 1;
    // this.bev.ctx.beginPath();
    // this.bev.ctx.moveTo(...points[0]);
    // for (let i = 1; i < points.length; i++) {
    //   this.bev.ctx.lineTo(...points[i]);
    // }
    // this.bev.ctx.closePath();
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
  drawBev() {
    this.bev.dom = document.createElement("canvas");
    this.bev.ctx = this.bev.dom.getContext("2d");
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.bev.ctx.scale(devicePixelRatio, devicePixelRatio);
    this.bev.ctx.imageSmoothingEnabled = true;
    this.bev.ctx.imageSmoothingQuality = "high";
    this.bev.dom.width = this.img_w;
    this.bev.dom.height = this.img_h;
    // 绘制整体背景颜色
    this.bev.ctx.fillStyle = "#50524f";
    this.bev.ctx.fillRect(0, 0, this.bev.dom.width, this.bev.dom.height);
  }
  // 绘制canvas
  drawCanvas(bev_demo) {
    this.bev.ctx.strokeStyle = "#343633";
    // this.bev.ctx.fillStyle = "#343633";
    this.bev.ctx.lineWidth = 1;
    // this.bev.ctx.stroke();
    this.bev.ctx.fill();
    for (let i = 0; i < bev_demo.length; i++) {
      let c = this.getColor(bev_demo[i]);
      let points = this.getPoints(i, this.bev.dom.width);
      this.bev.ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
      this.bev.ctx.fillRect(points[0], points[1], 1, 1);
    }
  }
  // opencv获取想要的信息
  cvHandle() {
    try {
      // 从 Canvas 上获取图像数据
      let imageData = this.bev.ctx.getImageData(
        0,
        0,
        this.bev.dom.width,
        this.bev.dom.height
      );
      // 将图像数据转换为 OpenCV 图像格式
      let src = cv.matFromImageData(imageData);

      // 转换为HSV颜色空间
      const hsv = new cv.Mat();
      cv.cvtColor(src, hsv, cv.COLOR_RGBA2RGB);
      cv.cvtColor(hsv, hsv, cv.COLOR_RGB2HSV);

      // 定义红色范围的阈值
      const lowerRed = new cv.Mat(
        hsv.rows,
        hsv.cols,
        hsv.type(),
        [0, 100, 100, 0]
      );
      const upperRed = new cv.Mat(
        hsv.rows,
        hsv.cols,
        hsv.type(),
        [10, 255, 255, 255]
      );

      // 根据阈值分割图像
      const redMask = new cv.Mat();
      cv.inRange(hsv, lowerRed, upperRed, redMask);

      // 寻找轮廓
      let contours = new cv.MatVector();
      let hierarchy = new cv.Mat();
      cv.findContours(
        redMask,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );
      // 在 Canvas 上绘制轮廓
      // this.bev.ctx.strokeStyle = "green";
      this.bev.ctx.lineWidth = 2;
      let color = "blue";
      console.log(contours.size(), "size");
      let road_data = [];
      if (contours.size() > 2) {
        console.log(
          "当前不止2条道路，那么就要处理岔路,先处理车两边的路沿和车当前行驶道路"
        );
      } else {
        console.log("当前道路只有1-2条路沿，则直接处理路沿和道路");
      }
      for (let i = 0; i < contours.size(); ++i) {
        this.bev.ctx.fillStyle = color;
        let contour = contours.get(i);
        // 获取区域的宽高
        let rect = cv.boundingRect(contour);
        const area = cv.contourArea(contour);
        // // 计算当前轮廓的外接矩形
        // // 绘制出轮廓中心点
        let centerX = rect.x + rect.width / 2;
        let centerY = rect.y + rect.height / 2;
        // 进行凸包检测
        const hull = new cv.Mat();
        cv.convexHull(contour, hull);
        // 获取凸包顶点
        const points = [];
        for (let i = 0; i < hull.rows; i++) {
          points.push({
            x: hull.data32S[i * 2],
            y: hull.data32S[i * 2 + 1],
          });
        }

        // 在 Canvas 上绘制凸包边界
        console.log(points, "points===凸包顶点", i);
        let color_arr = ["rgb(80,190,225)", "black", "white"];
        // let line = this.setWidthLine(points, false, color_arr[i]);
        // this.scene.add(line);

        this.bev.ctx.beginPath();
        this.bev.ctx.fillStyle = "pink";
        // for (let i = 1; i < points.length; i++) {
        //   // this.bev.ctx.lineTo(points[i].x, points[i].y);
        //   this.bev.ctx.fillRect(points[i].x, points[i].y, 2, 2);
        // }
        // this.bev.ctx.closePath();
        // this.bev.ctx.stroke();

        // this.bev.ctx.arc(points[0].x, points[0].y, 10, 0, Math.PI * 2);
        // this.bev.ctx.arc(points[1].x, points[1].y, 6, 0, Math.PI * 2);

        // 绘制预取框
        // this.bev.ctx.strokeStyle = "green";
        // this.bev.ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
        // this.bev.ctx.moveTo(contour.data32S[0], contour.data32S[1]);
        // 此时的数组是按照逆时针的
        // 此时起点为轮廓最顶点
        // let y_arr = contour.data32S.filter((item, index) => index % 2 != 0);
        // let x_arr = contour.data32S.filter((item, index) => index % 2 === 0);
        // let y_max = Math.max(...y_arr);
        // let p = [];
        // let first = 0,
        //   last = x_arr.length - 1;
        // let first_s = false,
        //   last_s = false;
        // let side_p = [];
        // while (!first_s || !last_s) {
        //   side_p.unshift([x_arr[first], y_arr[first]]);
        //   side_p.push([x_arr[last], y_arr[last]]);
        //   first++;
        //   last--;
        //   // if ()
        // }
        this.bev.ctx.strokeStyle = "pink";
        let contour_arr = [];
        // this.bev.ctx.moveTo(contour.data32S[0], contour.data32S[1]);
        let a = new Array(rect.height)
          .fill(null)
          .map(() => new Array(rect.width).fill(null));
        // console.log(rect, "rect---", i, a);
        let res = [];
        for (let j = 0; j < contour.data32S.length; j += 2) {
          let x = contour.data32S[j],
            y = contour.data32S[j + 1];
          a[y - rect.y][x - rect.x] = {
            x: x,
            y: y,
          };
          // let p = points.filter((item) => item.x === x && item.y === y);
          // if (p.length) res.push(p[0]);
          // this.bev.ctx.lineTo(x, y);
        }
        // console.log(res, "res");
        // let line0 = this.setWidthLine(res, false, "blue");
        // this.scene.add(line0);

        this.bev.ctx.moveTo(0, 0);
        this.bev.ctx.lineTo(50, 100);

        let line_arr = [...a[0].filter(Boolean)];
        console.log(a[0].filter(Boolean), "a[0].filter(Boolean)");
        for (let i = 1; i < a.length; i++) {
          let arr = a[i].filter(Boolean);
          if (arr.length) {
            console.log(arr, i);
            let point = {};
            let a0 = arr[0],
              a1 = arr[arr.length - 1];
            let l0 = line_arr[0],
              l1 = line_arr[line_arr.length - 1];
            if (arr.length > 2 && arr.length % 2 != 0) {
              arr.forEach(item => {
                this.bev.ctx.fillStyle = "black"
                this.bev.ctx.fillRect(item.x, item.y, 2, 2)
              })
            }
            
            if (arr.length == 1) {
              if (line_arr.length === 1) {
                if (arr[0].x - line_arr[0].x > 0) {
                  line_arr.push(...arr);
                } else {
                  line_arr.unshift(...arr);
                }
              } else {
                let front = Math.abs(l0.x - arr[0].x),
                  after = Math.abs(l1.x - arr[0].x)
                if (front <= after) {
                  line_arr.unshift(arr[0]);
                } else {
                  line_arr.push(arr[0])
                }
              }
            } else if (arr.length === 2) {
              
              if (Math.abs(a0.x - l0.x) <= Math.abs(a0.x - l1.x)) {
                line_arr.unshift(arr[0]);
              } else {
                line_arr.push(arr[0])
              }
            } else {
              line_arr.unshift(a0);
              line_arr.push(a1)
            }
            

            // if (arr[0].x < line_arr[0].x) line_arr.unshift(arr[0]);
            // if (arr[arr.length - 1].x > line_arr[line_arr.length - 1].x) line_arr.push(arr[arr.length - 1]);

            // if (arr.length > 2) {
            //   line_arr.unshift(arr[0]);
            //   line_arr.push(arr[arr.length - 1]);
            // } else {
            //   // console.log(arr, "arr[i");
            //   if (Math.abs(arr[arr.length - 1].x - line_arr[line_arr.length - 1].x) < 10) {
            //     line_arr.push(arr[arr.length - 1]);
            //   }
            //   if (Math.abs(arr[0].x - line_arr[i].x) < 10) {
            //     line_arr.unshift(arr[0]);
            //   }
            // }
          }
        }
        console.log(line_arr, "line_arr");
        let line_ = this.setWidthLine(line_arr, false, "blue");
        this.scene.add(line_);
        // for (let j = 2; j < contour.data32S.length; j += 2) {
        //   this.bev.ctx.lineTo(contour.data32S[j], contour.data32S[j + 1]);
        // }
        this.bev.ctx.closePath();
        // this.bev.ctx.fill();
        this.bev.ctx.stroke();
      }
      // 释放内存
      src.delete();
      contours.delete();
      hierarchy.delete();
    } catch (err) {
      console.log(err, "err----cvHandle");
    }
  }
  // 绘制可以改变宽度的线条   dashed：true虚线、false实线
  setWidthLine(pointsArr, dashed = false, color = "rgb(80,190,225)") {
    try {
      // 处理坐标数据
      let points = this.handlePoints(pointsArr);
      // console.log(points, "ooooooooo");
      const geometry = this.track(new LineGeometry());
      geometry.setPositions(points);
      const matLine = this.track(
        new LineMaterial({
          color: color,
          linewidth: 6,
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
  // 处理带宽度的线条坐标数据
  handlePoints(pointsArr) {
    // 处理坐标数据
    const points = [];
    pointsArr.forEach((item, index) => {
      points.push(
        (item.x - this.canvas_p[0]) * (60 / this.img_w),
        -((item.y - this.canvas_p[1]) * (60 / this.img_h)),
        0
      );
    });
    return points;
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

          for (let j = group.children.length; j < data.length; j++) {
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
      const filesArr = ["car_for_games_unity", "car_for_games_unity"];
      const res = await Promise.all(filesArr.map(this.loadFile));
      // debugger
      // 主车
      this.objs.main_car = res[0];
      const gltf = this.objs.main_car.scene;
      gltf.rotation.x = Math.PI / 2;
      // 3d辅助框 获取模型的大小
      const box = new THREE.Box3().setFromObject(gltf),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3());
      // gltf.position.y = -(size.y / 2) - center.y;
      // this.scene.add(gltf);
      gltf.matrixAutoUpdate = false;
      gltf.updateMatrix();
      // 小车
      this.objs.car = res[1];
      const car = this.objs.car.scene;
      car.rotation.x = Math.PI / 2;
      car.rotation.y = Math.PI;
      car.position.y = -50;
      car.position.x = -50;
      // this.scene.add(car);
      car.matrixAutoUpdate = false;
      car.updateMatrix();
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
