/*
 * @LastEditTime: 2024-03-12 20:09:20
 * @Description:./
 */

import foresight_img from "../../assets/demo_data/foresight.jpg";
import rearview_img from "../../assets/demo_data/rearview.jpg";
import right_front_img from "../../assets/demo_data/right_front.jpg";
import right_back_img from "../../assets/demo_data/right_back.jpg";
import left_back_img from "../../assets/demo_data/left_back.jpg";
import left_front_img from "../../assets/demo_data/left_front.jpg";
import { ObserverInstance } from "@/controls/event/observer";

export default class Video {
  img_ibj = {
    foresight: foresight_img,
    rearview: rearview_img,
    right_front: right_front_img,
    right_back: right_back_img,
    left_back: left_back_img,
    left_front: left_front_img,
  };

  work = new Worker(new URL("./ffmpeg_decode.js", import.meta.url).href);
  status = false;
  dom; // 外侧dom，利用该dom计算子元素宽高
  // 用来控制canvas大小的dom
  handle_box;
  // 3D线框 canvas元素--- 实际视频+线框的canvas
  helper_dom;
  helper_ctx;
  offscreen;
  offscreen_ctx;
  imageBitmap;
  id = "";
  video_start = false; // 视频是否开始了，未开始则先离屏渲染
  canvas_work;
  constructor(id) {
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    this.handle_box = document.getElementById(id + "_box");
    // 离屏渲染
    this.offscreen = new OffscreenCanvas(256, 256);
    this.offscreen_ctx = this.offscreen.getContext("2d");

    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
    // this.handleVideo();
  }
  // 获取障碍物元素信息---后续用来绘制线框
  setObjs(data) {
    this.objs_data = data;
    // console.log(data, "data================")
  }
  // 绘制3D线框
  handleHelper(data) {
    try {
      data.forEach((item) => {
        this.drawCircle(item, "yellow");
      });
      this.drawLine([data[0], data[1]]);
      this.drawLine([data[0], data[2]]);
      this.drawLine([data[0], data[4]]);
      this.drawLine([data[3], data[2]]);
      this.drawLine([data[3], data[1]]);
      this.drawLine([data[3], data[7]]);
      this.drawLine([data[6], data[2]]);
      this.drawLine([data[6], data[4]]);
      this.drawLine([data[6], data[7]]);
      this.drawLine([data[5], data[4]]);
      this.drawLine([data[5], data[1]]);
      this.drawLine([data[5], data[7]]);
    } catch (err) {
      console.log(err, "err-----handleHelper");
    }
  }
  // 绘制点
  drawCircle(points, color = "yellow") {
    this.offscreen_ctx.beginPath();
    this.offscreen_ctx.arc(points[0], points[1], 4, 0, 2 * Math.PI, false);
    this.offscreen_ctx.fillStyle = color;
    this.offscreen_ctx.fill();
  }
  // 划线
  drawLine(points, color = "yellow") {
    this.offscreen_ctx.beginPath();
    this.offscreen_ctx.moveTo(points[0][0], points[0][1]); //移动到某个点；
    this.offscreen_ctx.lineTo(points[1][0], points[1][1]); //终点坐标；
    this.offscreen_ctx.lineWidth = "1.4"; //线条 宽度
    this.offscreen_ctx.strokeStyle = color;
    this.offscreen_ctx.stroke(); //描边
  }
  drawVideo(info) {
    let rect = this.dom.getBoundingClientRect();
    // 使用canvas外部的元素来控制canvas的大小
    let wh_obj = this.handleWH(
      info.width,
      info.height,
      rect.width,
      rect.height
    );
    this.handle_box.style.width = wh_obj.w + "px";
    this.handle_box.style.height = wh_obj.h + "px";
    
    if (this.helper_dom.width != info.width || this.helper_dom.height != info.height) {
      this.helper_dom.width = info.width;
      this.helper_dom.height = info.height;
    }

    if (this.offscreen.width != info.width || this.offscreen.height != info.height) {
      this.offscreen.width = info.width;
      this.offscreen.height = info.height;
    }
    requestAnimationFrame(() => {
      this.helper_ctx.clearRect(0, 0, info.width, info.height);
      if (this.imageBitmap) {
        this.helper_ctx.drawImage(
          this.imageBitmap,
          0,
          0,
          info.width,
          info.height
        );
      }

      // // 如果还没有渲染，则先渲染离屏数据
      let imgData = new ImageData(info.rgb, info.width, info.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        let data0 = imgData.data[i + 0];
        imgData.data[i + 0] = imgData.data[i + 2];
        imgData.data[i + 2] = data0;
      }
      this.offscreen_ctx.putImageData(imgData, 0, 0);
      for (let i = 0; i < this.objs_data.length; i++) {
        for (let j = 0; j < this.objs_data[i].length; j++) {
          let item = this.objs_data[i][j];
          this.handleHelper(item[item.length - 1][this.id]);
        }
      }
      this.imageBitmap = this.offscreen.transferToImageBitmap();
    });
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

}
