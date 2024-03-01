/*
 * @LastEditTime: 2024-03-01 15:12:39
 * @Description:
 */
export default class Video {
  work = new Worker(new URL("./ffmpeg_decode.js", import.meta.url).href);
  status = false;
  maxValue;
  timeMap;
  dom;
  canvas_dom;
  canvas_dom_img;
  ctx;
  ctx_img;
  id = "";
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
    const element = document.createElement("canvas");
    element.id = id + "_canvas";
    element.width = this.dom.clientWidth - 15;
    element.height = this.dom.clientHeight - 15;
    element.background = "#000";
    this.canvas_dom = element;
    this.ctx = element.getContext("2d", {
      willReadFrequently: true,
    });
    this.ctx_img = this.canvas_dom_img.getContext("2d", {
      willReadFrequently: true,
    });
    // this.dom.appendChild(element);

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
        // this.canvas_dom_img.width = info.width;
        // this.canvas_dom_img.height = info.height;
        let w = info.width,
          h = info.height;
        if (
          this.canvas_dom_img.width != info.width ||
          this.canvas_dom_img.height != info.height
          // this.canvas_dom.width != info.width ||
          // this.canvas_dom.height != info.height
        ) {
          let box_w = this.dom.offsetWidth - 15,
            box_h = this.dom.offsetHeight - 15;
          if (info.width != box_w) {
            h = (box_w * info.height) / info.width;
            if (h > box_h) {
              w = (box_h * info.width) / info.height;
              h = box_h;
            } else {
              w = box_w;
            }
          }
          // this.canvas_dom.width = w;
          // this.canvas_dom.height = h;
        }
        // console.log(info, "infoinfoinfo");
        let imgData = new ImageData(info.rgb, info.width, info.height);
        for (let i = 0; i < imgData.data.length; i += 4) {
          let data0 = imgData.data[i + 0];
          imgData.data[i + 0] = imgData.data[i + 2];
          imgData.data[i + 2] = data0;
        }
        // console.log(imgData, "imgDataimgDataimgData");

        this.ctx_img.putImageData(imgData, 0, 0);
        // this.ctx.drawImage(
        //   this.canvas_dom_img,
        //   0,
        //   0,
        //   this.canvas_dom.width,
        //   this.canvas_dom.height
        // );
      }
    };
    this.work.onerror = (event) => {
      console.log(event, "-----------onerror");
    };
  }
  handleWH(imgW, imgH, domW, domH) {
    
  }
  changeCodecId(val) {
    let data = {
      type: "updateCodecId",
      info: val,
    };
    this.work.postMessage(data);
  }
}
