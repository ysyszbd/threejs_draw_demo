/*
 * @LastEditTime: 2024-03-25 11:49:09
 * @Description:./
 */
import { ObserverInstance } from "@/controls/event/observer";
import { drawVideoObjs } from "@/controls/box2img.js";
export default class Video {
  observerListenerList = [
    {
      eventName: "VIDEO_DRAW",
      fn: this.drawVideo.bind(this),
    },
  ];
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
  constructor(id) {
    ObserverInstance.selfAddListenerList(
      this.observerListenerList,
      "yh_video_draw"
    );
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    this.handle_box = document.getElementById(id + "_box");

    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
  }
  async drawVideo(data) {
    if (data.view !== this.id) return;
    let w = data.video_bg.width,
      h = data.video_bg.height;
    this.objs_data = data.objs;
    let rect = this.dom.getBoundingClientRect();
    // 使用canvas外部的元素来控制canvas的大小
    let wh_obj = this.handleWH(w, h, rect.width, rect.height);
    this.handle_box.style.width = wh_obj.w + "px";
    this.handle_box.style.height = wh_obj.h + "px";

    if (this.helper_dom.width != w || this.helper_dom.height != h) {
      this.helper_dom.width = w;
      this.helper_dom.height = h;
    }
    this.helper_ctx.clearRect(0, 0, w, h);
    this.helper_ctx.drawImage(data.video_bg, 0, 0, w, h);
    if (data.video_objs) this.helper_ctx.drawImage(data.video_objs, 0, 0, w, h);
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
