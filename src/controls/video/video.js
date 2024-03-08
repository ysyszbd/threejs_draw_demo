/*
 * @LastEditTime: 2024-03-08 16:30:24
 * @Description:./
 */

import foresight_img from "../../assets/demo_data/foresight.jpg";
import rearview_img from "../../assets/demo_data/rearview.jpg";
import right_front_img from "../../assets/demo_data/right_front.jpg";
import right_back_img from "../../assets/demo_data/right_back.jpg";
import left_back_img from "../../assets/demo_data/left_back.jpg";
import left_front_img from "../../assets/demo_data/left_front.jpg";
import memory_pool from "../memoryPool.js";
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
  memoryPool = new memory_pool(10, 2048 * 2048);
  status = false;
  dom; // 外侧dom，利用该dom计算子元素宽高
  // 视频帧 canvas元素
  canvas_dom_video;
  ctx_video;
  // 用来控制canvas大小的dom
  handle_box;
  // 3D线框 canvas元素
  helper_dom;
  helper_ctx;
  id = "";
  constructor(id) {
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    this.canvas_dom_video = document.getElementById(id + "_video");
    this.ctx_video = this.canvas_dom_video.getContext("2d", {
      willReadFrequently: true,
    });
    this.handle_box = document.getElementById(id + "_box");
    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
    this.handleVideo();
  }
  // 设置图片区域的大小
  handleBox() {
    let _this = this;
    return new Promise(function (resolve, reject) {
      let img_ele = document.createElement("img");
      img_ele.src = _this.img_ibj[_this.id];
      img_ele.onload = (e) => {
        _this.helper_dom.width = img_ele.width;
        _this.helper_dom.height = img_ele.height;
        _this.helper_ctx.drawImage(
          img_ele,
          0,
          0,
          img_ele.width,
          img_ele.height
        );
        let rect = _this.dom.getBoundingClientRect();
        let wh_obj = _this.handleWH(
          img_ele.width,
          img_ele.height,
          rect.width,
          rect.height
        );
        _this.handle_box.style.width = wh_obj.w + "px";
        _this.handle_box.style.height = wh_obj.h + "px";
        resolve("背景图片绘制完毕");
      };
    });
  }
  setObjs(data) {
    this.objs_data = data;
    // console.log(this.objs_data, "this.objs_datathis.objs_data");
    // console.log(data);
    // let _this = this;
    // this.handleBox().then(res => {
    //   console.log(res, "res");
    //   _this.objs_data.forEach(item => {
    //     _this.handleHelper(item[_this.id]);
    //   })
    // });
    
  }
  // 绘制3D线框
  handleHelper(data) {
    try {
      // console.log(data, "data");
      
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
      // resolve("objs绘制完毕")
      // return new Promise((resolve, reject) => {
      //   // console.log("------------handleHelper");
      // })
    } catch (err) {
      console.log(err, "err-----handleHelper");
    }
  }
  // 绘制点
  drawCircle(points, color = "yellow") {
    this.helper_ctx.beginPath();
    this.helper_ctx.arc(points[0], points[1], 4, 0, 2 * Math.PI, false);
    this.helper_ctx.fillStyle = color;
    this.helper_ctx.fill();
  }
  // 划线
  drawLine(points, color = "yellow") {
    this.helper_ctx.beginPath();
    this.helper_ctx.moveTo(points[0][0], points[0][1]); //移动到某个点；
    this.helper_ctx.lineTo(points[1][0], points[1][1]); //终点坐标；
    this.helper_ctx.lineWidth = "1.4"; //线条 宽度
    this.helper_ctx.strokeStyle = color;
    this.helper_ctx.stroke(); //描边
  }
  // 绘制视频
  handleVideo() {
    // 注册视频绘制事件
    this.work.onmessage = (event) => {
      if (event.data.type === "message") {
        if (event.data.info == "init") {
          ObserverInstance.emit("INIT_OK", {
            id: this.id
          });
          this.status = true;
          this.changeCodecId(173);
        }
      } else {
        // console.log("----++++handleVideo");
        this.memoryPool.free(event.data);
        let message = this.memoryPool.allocate(),
        //   // let message = event.data,
          info = message.info;
        // console.log(message, "message======================");
        // if (0 == info.width || 0 == info.height) return;
        let rect = this.dom.getBoundingClientRect();
        this.canvas_dom_video.width = info.width;
        this.canvas_dom_video.height = info.height;

        this.helper_ctx.clearRect(0, 0, info.width, info.height);

        if (info.width != this.helper_dom.width || info.height != this.helper_dom.height) {
          this.helper_dom.width = info.width;
          this.helper_dom.height = info.height;
          console.log("==========大小改变了");
        }

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
          // console.log(imgData, "imgData");
          for (let i = 0; i < imgData.data.length; i += 4) {
            let data0 = imgData.data[i + 0];
            imgData.data[i + 0] = imgData.data[i + 2];
            imgData.data[i + 2] = data0;
          }
          this.ctx_video.putImageData(imgData, 0, 0);
          for (let i = 0; i < this.objs_data.length; i++) {
            for (let j = 0; j < this.objs_data[i].length; j++) {
              // this.handleHelper(this.objs_data[i][this.id]);
              let item = this.objs_data[i][j];
              this.handleHelper(item[item.length - 1][this.id]);
              // console.log(item[item.length - 1][this.id], this.id);
            }
          }
          // this.objs_data.forEach(item => {
          //   this.handleHelper(item[this.id]);
          // })
        });
      }
    };
    this.work.onerror = (event) => {
      console.log(event, "-----------onerror");
    };
  }
  async drawObjs(data) {
    // console.log("data==drawObjs", this.id)
    // for (let i = 0; i < data.length; i++) {
    //   if (data[i][this.id]) {
    //     await this.handleHelper(data[i][this.id]);
    //   }
    // }
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
