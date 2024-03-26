/*
 * @LastEditTime: 2024-03-26 14:18:01
 * @Description:./
 */
export default class Video {
  dom; // 外侧dom，利用该dom计算子元素宽高
  dom_w;
  dom_h;
  // 用来控制canvas大小的dom
  handle_box;
  // 3D线框 canvas元素--- 实际视频+线框的canvas
  helper_dom;
  helper_ctx;
  id = "";
  old_wh = {
    w: 0,
    h: 0,
  };
  constructor(id) {
    this.init(id);
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    let rect = this.dom.getBoundingClientRect();
    this.dom_w = rect.width;
    this.dom_h = rect.height;
    this.handle_box = document.getElementById(id + "_box");
    this.helper_dom = document.getElementById(id + "_helper_box");
    this.helper_ctx = this.helper_dom.getContext("2d", {
      willReadFrequently: true,
    });
    this.id = id;
  }
  async drawVideo(data) {
    // 使用canvas外部的元素来控制canvas的大小
    if (
      data.bg.width != this.old_wh.w ||
      data.bg.height != this.old_wh.h
    ) {
      let wh_obj = this.handleWH(
        data.bg.width,
        data.bg.height,
        this.dom_w,
        this.dom_h
      );
      this.old_wh = wh_obj;
      this.handle_box.style.width = wh_obj.w + "px";
      this.handle_box.style.height = wh_obj.h + "px";
    }

    if (
      this.helper_dom.width != data.bg.width ||
      this.helper_dom.height != data.bg.height
    ) {
      this.helper_dom.width = data.bg.width;
      this.helper_dom.height = data.bg.height;
    }
    this.helper_ctx.clearRect(0, 0, data.bg.width, data.bg.height);
    this.helper_ctx.drawImage(
      data.bg,
      0,
      0,
      data.bg.width,
      data.bg.height
    );
    data.bg.close();
    // if (data.video_objs) this.helper_ctx.drawImage(data.video_objs, 0, 0, w, h);
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
  clear() {
    this.dom = null;
    this.handle_box = null;
    this.helper_dom = null;
    this.helper_ctx = null;
  }
}
