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
  scale = numberExcept(51.2, 30);
  observerListenerList = [
    {
      eventName: "DRAW_BEV",
      fn: this.getData.bind(this),
    },
    {
      eventName: "BEV_CLEAR",
      fn: this.clearFun.bind(this),
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
  offscreen;
  offscreen_ctx;
  imageBitmap;
  map = new Map();

  constructor() {
    this.map.set(0, [80, 82, 79, 1]);
    this.map.set(1, [255, 255, 255, 1]);
    this.map.set(2, [0, 255, 0, 1]);
    this.map.set(3, [255, 0, 0, 1]);
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
      // console.log(data, "data");
      // console.log(Date.now(), "key---------bev2", data.key);
      let w = data.basic_data[1],
        h = data.basic_data[2];
      if (this.img_w != w || this.img_h != h) {
        this.img_w = w;
        this.img_h = h;
        this.bev.dom.width = this.img_w;
        this.bev.dom.height = this.img_h;
      }
      // requestAnimationFrame(async () => {
      if (data.bev && data.bev.length > 0) {

        // 渲染分割图
        let imgData = new ImageData(w, h);
        for (let i = 0; i < imgData.data.length; i += 4) {
          let num = data.bev[i / 4];
          let color = this.map.get(num);
          imgData.data[i + 0] = color[0];
          imgData.data[i + 1] = color[1];
          imgData.data[i + 2] = color[2];
          imgData.data[i + 3] = 255;
        }
        this.bev.ctx.putImageData(imgData, 0, 0);
        this.mapBg.needsUpdate = true;
        this.handleObjs(data.objs).then((res) => {
          console.log(Date.now(), "---------bev渲染完毕");
        });
        // });
      }
    } catch (err) {
      console.log(err, "err---getData");
    }
  }
  readerSegImg(seg, segWidth, segHeight) {
    // 渲染分割图
    const ctx = this.bev.ctx;
    ctx.fillRect(0, 0, segWidth, segHeight);
    let segImageData;
    // ctx.drawImage(segImage, 0, 0, 200, 200);
    if (
      this.rgb_data.dom.width != segWidth ||
      this.rgb_data.dom.height != segHeight
    ) {
      this.rgb_data.dom.widht = segWidth;
      this.rgb_data.dom.height = segHeight;
      segImageData = null;
    }

    if (!segImageData) {
      segImageData = ctx.getImageData(
        0,
        0,
        this.rgb_data.dom.width,
        this.rgb_data.dom.height
      );
    }
    var rotate90 = false;
    for (var i = 0; i < segImageData.data.length; i += 4) {
      var iSeg = i / 4;
      var gray = seg[iSeg];
      if (rotate90) {
        // 计算旋转后的索引位置
        let x = iSeg % segWidth;
        let y = Math.floor(iSeg / segWidth);
        // 逆时针
        let index = segHeight * (x + 1) - y - 1;
        gray = seg[index];
      }
      var r = 0;
      var g = 0;
      var b = 0;
      switch (gray) {
        case 1:
          r = 0xff;
          break;
        case 2:
          g = 0xff;
          break;
        case 3:
          b = 0xff;
          break;
        default:
          r = 0x88;
          g = 0x88;
          b = 0x88;
          break;
      }
      segImageData.data[i] = r;
      segImageData.data[i + 1] = g;
      segImageData.data[i + 2] = b;
      segImageData.data[i + 3] = 255;
    }
    // console.log(segImageData, "segImageData");
    // 绘制图像到画布上
    ctx.putImageData(segImageData, 0, 0);
  }
  // 更新障碍物
  async handleObjs(objs_data) {
    return new Promise((resolve, reject) => {
      // console.log(objs_data, "objs_data=====");
      if (objs_data.length <= 0) return;
      for (let item in objs_data) {
        if (objs_data[item].data.length < 1) break;
        // console.log(objs_data[item].name, objs_data[item].data, "=============================");
        this.handle3D(objs_data[item].name, objs_data[item].data);
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
        color = [80, 82, 79, 1];
        // color = [52, 54, 51, 1];
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
  // opencv获取想要的信息
  cvHandle() {
    try {
      // // 从 Canvas 上获取图像数据
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
      const contours = new cv.MatVector();
      const hierarchy = new cv.Mat(); // 这里应该是一个空的 Mat 对象，用于存储层级信息
      cv.findContours(
        redMask,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_SIMPLE
      );
      // 合并所有轮廓点
      let mergedContourPoints = [];
      for (let i = 0; i < contours.size(); ++i) {
        const contour = contours.get(i);
        const contourPoints = contour.data32S; // 获取轮廓的点坐标数组
        mergedContourPoints.push(...contourPoints);
        // console.log(contourPoints, "contourPoints");
        // // 将轮廓点坐标添加到合并后的数组中
        // for (let j = 0; j < contourPoints.length; j += 2) {
        //   mergedContourPoints.push(
        //     new cv.Point(contourPoints[j], contourPoints[j + 1])
        //   );
        // }
      }
      console.log(mergedContourPoints, "mergedContourPoints");
      // // 将轮廓点坐标数组转换为 Int32Array 类型
      const contourPointsTypedArray = new Int32Array(mergedContourPoints);
      // // console.log(contourPointsTypedArray, "contourPointsTypedArray");
      // // 计算合并后轮廓的凸包
      const mergedContour = new cv.Mat(contourPointsTypedArray, cv.CV_32F);
      console.log(mergedContour, "mergedContour=======");
      // const hull = new cv.Mat();
      // cv.convexHull(mergedContour, hull, false, true);
      // // 绘制凸包到 Canvas 上
      // this.bev.ctx.strokeStyle = "green"; // 设置凸包线颜色
      // this.bev.ctx.beginPath();
      // for (let i = 0; i < hull.rows; ++i) {
      //   const point = new cv.Point(hull.intPtr(i, 0).x, hull.intPtr(i, 0).y);
      //   this.bev.ctx.lineTo(point.x, point.y);
      // }
      // this.bev.ctx.closePath();
      // this.bev.ctx.stroke();

      // 创建一个新的轮廓路径---最小矩形
      const path = new Path2D();

      for (let k = 0; k < mergedContourPoints.length; ++k) {
        const point = mergedContourPoints[k];
        if (k === 0) {
          path.moveTo(point.x, point.y);
        } else {
          path.lineTo(point.x, point.y);
        }
      }

      // 在 canvas 上绘制合并后的轮廓
      this.bev.ctx.strokeStyle = "blue";
      this.bev.ctx.stroke(path);

      // 手动计算最小外包矩形
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (let k = 0; k < mergedContourPoints.length; ++k) {
        const point = mergedContourPoints[k];
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }

      const boundingRect = {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      };

      // 在 Canvas 上绘制最小外包矩形
      this.bev.ctx.strokeStyle = "#353630"; // 设置矩形线颜色
      this.bev.ctx.fillStyle = "rgba(53, 54, 48, 0.3)"; // 设置矩形线颜色

      this.bev.ctx.strokeRect(
        boundingRect.x,
        boundingRect.y,
        boundingRect.width,
        boundingRect.height
      ); // 绘制矩形
      this.bev.ctx.fillRect(
        boundingRect.x,
        boundingRect.y,
        boundingRect.width,
        boundingRect.height
      );

      // for (let i = 0; i < hull_arr.length; i++) {
      //   this.bev.ctx.strokeStyle = "rgb(80, 82, 79)";
      //   this.bev.ctx.beginPath();
      //   this.bev.ctx.fillStyle = "rgba(255, 192, 203, 0.3)";
      //   for (let j = 1; j < hull_arr[i].length; j++) {
      //     this.bev.ctx.lineTo(hull_arr[i][j].x, hull_arr[i][j].y);
      //   }
      //   this.bev.ctx.closePath();
      //   this.bev.ctx.stroke();
      //   this.bev.ctx.fill();
      // }

      contours.delete();
      hierarchy.delete();
      // convexHullPoints.delete();
      // // 在 Canvas 上绘制轮廓
      // // this.bev.ctx.strokeStyle = "green";
      // this.bev.ctx.lineWidth = 2;
      // let color = "blue";
      // let road_points = [];
      // for (let i = 0; i < contours.size(); ++i) {
      //   this.bev.ctx.fillStyle = color;
      //   let contour = contours.get(i);
      //   // 获取区域的宽高
      //   let rect = cv.boundingRect(contour);
      //   // const area = cv.contourArea(contour);
      //   // // // 计算当前轮廓的外接矩形
      //   // // // 绘制出轮廓中心点
      //   // let centerX = rect.x + rect.width / 2;
      //   // let centerY = rect.y + rect.height / 2;
      //   // 进行凸包检测
      //   const hull = new cv.Mat();
      //   cv.convexHull(contour, hull);
      //   // 获取凸包顶点
      //   const points = [];
      //   for (let i = 0; i < hull.rows; i++) {
      //     points.push({
      //       x: hull.data32S[i * 2],
      //       y: hull.data32S[i * 2 + 1],
      //     });
      //   }

      //   let color_arr = ["rgb(80,190,225)", "black", "white"];

      //   // this.bev.ctx.beginPath();
      //   // this.bev.ctx.fillStyle = "rgba(255, 192, 203, 0.3)";
      //   // for (let i = 1; i < points.length; i++) {
      //   //   this.bev.ctx.lineTo(points[i].x, points[i].y);
      //   // }
      //   // this.bev.ctx.closePath();
      //   // this.bev.ctx.stroke();
      //   // 此时的数组是按照逆时针的
      //   this.bev.ctx.strokeStyle = "blue";
      //   this.bev.ctx.beginPath();
      //   this.bev.ctx.moveTo(contour.data32S[0], contour.data32S[1]);
      //   for (let j = 0; j < contour.data32S.length; j += 2) {
      //     let x = contour.data32S[j],
      //       y = contour.data32S[j + 1];
      //     this.bev.ctx.lineTo(x, y);
      //   }
      //   this.bev.ctx.closePath();
      //   this.bev.ctx.stroke();
      // }
      // // 释放内存
      // src.delete();
      // contours.delete();
      // hierarchy.delete();
    } catch (err) {
      console.log(err, "err----cvHandle");
    }
  }
  // 初始化threejs
  init() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);
    var width = this.rgb_data.dom.clientWidth;
    var height = this.rgb_data.dom.clientHeight;
    this.camera = new THREE.PerspectiveCamera(62, width / height, 0.1, 1000);
    this.camera.position.set(0, 0, 100);
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
      // console.log(res, "res");
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
    // this.geometry.dispose();
    // this.material.dispose();
    this.resTracker.dispose();
  }
}
