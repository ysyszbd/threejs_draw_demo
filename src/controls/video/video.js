/*
 * @LastEditTime: 2024-03-01 17:55:50
 * @Description:
 */

export default class Video {
  work = new Worker(new URL("./ffmpeg_decode.js", import.meta.url).href);
  status = false;
  maxValue;
  timeMap;
  dom;
  canvas_dom_img;
  ctx_img;
  id = "";
  handle_box;
  constructor(id) {
    this.init(id);
  }
  selectFile(e) {
    console.log(e, "eee");
    const reader = new FileReader();
    reader.readAsArrayBuffer(e.target.files[0]);
    reader.onload = () => {
      let u8Array = new Uint8Array(reader.result);
      console.log("已初始化，数据加载完毕");
      this.work.postMessage(u8Array, [u8Array.buffer]);
    };
  }
  // 获取所需的dom元素
  init(id) {
    this.dom = document.getElementById(id);
    this.canvas_dom_img = document.getElementById(id + "_img");
    this.handle_box = document.getElementById(id + "_box");
    this.ctx_img = this.canvas_dom_img.getContext("2d", {
      willReadFrequently: true,
    });
    this.handleVideo();
  }
  // 绘制图片--并绘制box
  handleBox() {
    let rect = this.dom.getBoundingClientRect();
    let wh_obj = this.handleWH(1920, 1080, rect.width, rect.height);
    this.canvas_dom_img.width = 1920;
    this.canvas_dom_img.height = 1080;
    this.handle_box.style.width = wh_obj.w + "px";
    this.handle_box.style.height = wh_obj.h + "px";
    let myImg = new ImageData("@/assets/demo_data/img1.jpg");
    myImg.onload = (data) => {
      console.log(data, "data====");
    }
    myImg.src = "@/assets/demo_data/img1.jpg";
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
