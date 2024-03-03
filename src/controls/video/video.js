/*
 * @LastEditTime: 2024-03-03 23:31:49
 * @Description:
 */
import base from "../base";

export default class Video extends base {
  work = new Worker(new URL("./ffmpeg_decode.js", import.meta.url).href);
  status = false;
  maxValue;
  timeMap;
  dom;
  canvas_dom_img;
  ctx_img;
  id = "";
  handle_box;
  helper_dom;
  helper_ctx;
  ratio;
  helper_wh;
  bg_dom;
  cv;
  circle = {
    geometry: null,
  }
  constructor(id) {
    super();
    this.init(id);
    this.start(this.helper_dom);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    this.canvas_dom_img = document.getElementById(id + "_img");
    this.handle_box = document.getElementById(id + "_box");
    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.ctx_img = this.canvas_dom_img.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
    this.handleVideo();
  }
  // 设置图片区域的大小
  handleBox() {
    let rect = this.dom.getBoundingClientRect();
    let wh_obj = this.handleWH(1920, 1080, rect.width, rect.height);
    this.ratio = wh_obj.w / 1920;
    this.helper_dom.width = 1920;
    this.helper_dom.height = 1080;
    this.helper_dom.style.scale = this.ratio;
    this.helper_wh = wh_obj;

    this.handle_box.style.width = wh_obj.w + "px";
    this.handle_box.style.height = wh_obj.h + "px";
    // this.handle_box.style.width = 1920 + "px";
    // this.handle_box.style.height = 1080 + "px";
  }
  handleHelper(data, position_type) {
    try {

      // oencv----
      // let src = cv.imread(this.id + "_helper_box");
      // let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);
      // data.forEach((item) => {
      //   let circle = new cv.Mat();
      //   // console.log(item, "item=====", circle);
      //   let color = new cv.Scalar(255, 255, 0);
      //   let center = new cv.Point(item[0], item[1], item[3]);
      //   // console.log(cv.Point3f(item[0], item[1], item[2]), "Point");
      //   // this.drawCircle([item[0], item[1]])
      //   cv.circle(this.helper_dom, center, 4, color, -1);
      // });
      // cv.imshow("canvas", this.helper_dom);
    } catch (err) {
      console.log(err, "err-----handleHelper");
    }
  }
  // 绘制原点
  drawCircle(points, color = "yellow") {
    
    // opencv-----
    // const point3D = new cv.Mat(1, 1, cv.CV_32FC3);
    // point3D.data32F.set([
    //   points[0],
    //   points[1],
    //   points.length > 2 ? points[2] : 0,
    // ]);
    // const projectionMatrix = cv.matFromArray(
    //   4,
    //   4,
    //   cv.CV_32F,
    //   [400, 0, 200, 0, 0, 300, 150, 0, 0, 0, 1, 0, 0, 0, 0, 1]
    // );
    // const point2D = new cv.Mat();
    // cv.perspectiveTransform(point3D, point2D, projectionMatrix);
    // // 绘制 3D 点
    // this.helper_ctx.beginPath();
    // this.helper_ctx.arc(point2D.data32F[0], point2D.data32F[1], 5, 0, Math.PI * 2);
    // this.helper_ctx.fillStyle = "red";
    // this.helper_ctx.fill();
    // this.helper_ctx.closePath();
    // // 释放资源
    // point3D.delete();
    // point2D.delete();
    // projectionMatrix.delete();
    // canvas----
    // console.log(points, "points");
    this.helper_ctx.beginPath();
    this.helper_ctx.arc(points[0], points[1], 10, 0, 2 * Math.PI, false);
    this.helper_ctx.fillStyle = color;
    this.helper_ctx.fill();
  }
  // 绘制视频
  handleVideo() {
    this.work.onmessage = (event) => {
      let message = event.data,
        type = message.type,
        info = message.info;

      if (type === "message") {
        if (info == "init") {
          console.log("状态：已经初始化!");
          this.status = true;
          this.changeCodecId(27);
        }
      } else {
        if (0 == info.width || 0 == info.height) return;
        let rect = this.dom.getBoundingClientRect();
        this.canvas_dom_img.width = info.width;
        this.canvas_dom_img.height = info.height;
        requestAnimationFrame(() => {
          // 使用canvas外部的元素来控制canvas的大小
          let wh_obj = this.handleWH(
            info.width,
            info.height,
            rect.width,
            rect.height
          );
          this.handle_box.style.width = wh_obj.w + "px";
          this.handle_box.style.height = wh_obj.h + "px";

          let imgData = new ImageData(info.rgb, info.width, info.height);
          for (let i = 0; i < imgData.data.length; i += 4) {
            let data0 = imgData.data[i + 0];
            imgData.data[i + 0] = imgData.data[i + 2];
            imgData.data[i + 2] = data0;
          }
          this.ctx_img.putImageData(imgData, 0, 0);
        });
      }
    };
    this.work.onerror = (event) => {
      console.log(event, "-----------onerror");
    };
  }
  // 计算视频要放置在dom元素中的宽高--按照视频帧的比例来
  handleWH(imgW, imgH, domW, domH) {
    let w = imgW,
      h = imgH;
    if (domW != imgW || domH != imgH) {
      let box_w = domW - 15,
        box_h = domH - 15;
      if (imgW != box_w) {
        h = (box_w * imgH) / imgW;
        if (h > box_h) {
          w = (box_h * imgW) / imgH;
          h = box_h;
        } else {
          w = box_w;
        }
      }
    }
    return {
      w: w,
      h: h,
    };
  }
  changeCodecId(val) {
    let data = {
      type: "updateCodecId",
      info: val,
    };
    this.work.postMessage(data);
  }
}
