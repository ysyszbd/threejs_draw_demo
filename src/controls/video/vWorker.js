// import * as libde265 from "./libde265.js";
const sharedWorker = new SharedWorker('./vShareWorker.js');
sharedWorker.port.start();
// import('./libde265.js').then(res => {
//   console.log(res, "========");
// })
// 监听共享 Worker 发送的消息
sharedWorker.port.addEventListener('message', event => {
  const { type, script } = event.data;

  if (type === 'libde265-script') {
    // 在其他 Worker 中使用加载成功的 libde265.js 文件内容
    // 注意：此处需要适当处理 libde265.js 文件内容，具体处理方式取决于文件内容的结构
    eval(script);
  }
});
let video_265 = null,
  view = "",
  objs,
  dom,
  imagesData,
  objData = {};

// onmessage = (e) => {
//   console.log(e.data, "=====eee");
//   if (e.data.sign === "libde265") {
//     // eval(e.data.script);
//     const libde265Module = Function(e.data.script)();
//     console.log(libde265Module);
//   }
//   // if (e.data.sign === "init") {
//   //   // 初始化数据
//   //   let canvas = new OffscreenCanvas(10, 10);
//   //   video_265 = new libde265.Decoder(canvas);
//   //   // dom = e.data.dom;
//   //   view = e.data.view;
//   //   video_265.set_image_callback(
//   //     (function (index) {
//   //       return function (data) {
//   //         // console.log(data, "image====================================");
//   //         console.log(Date.now(), "-----------解码完成");
//   //         renderImage(data);
//   //         data.free();
//   //       };
//   //     })(props.video_id)
//   //   );
//   // } else {
//   //   // 拿到数据后存放数据并解码
//   //   objs = e.data.objs;
//   //   objData = e.data;
//   //   video_265.push_data(e.data.video);
//   //   video_265.decode(function (err) {
//   //     switch (err) {
//   //       case libde265.DE265_ERROR_WAITING_FOR_INPUT_DATA:
//   //         console.info("解码：等待数据... ", e.data.video.length);
//   //         break;
//   //       default:
//   //         if (!libde265.de265_isOK(err)) {
//   //           console.log(libde265.de265_get_error_text(err));
//   //         }
//   //     }
//   //   });
//   // }
// };

function renderImage(image) {
  let rect = document.getElementById(`${view}`).getBoundingClientRect();
  let dom_box = document.getElementById(`${view}_box`);
  // const ctx = dom.getContext("2d");
  var w = image.get_width();
  var h = image.get_height();
  let canvas = new OffscreenCanvas(w, h);
  let ctx = canvas.getContext("2d");
  let imageBitmap;
  let wh_obj = yh_video.handleWH(w, h, rect.width, rect.height);
  dom_box.style.width = wh_obj.w + "px";
  dom_box.style.height = wh_obj.h + "px";

  if (w != dom.width || h != dom.height || !imagesData) {
    dom.width = w;
    dom.height = h;
    imagesData = ctx.createImageData(w, h);
  }

  image.display(imagesData, (data) => {
    ctx.putImageData(data, 0, 0);
    objs.filter((item) => {
      let obj_data = item[item.length - 1][view];
      let arr = obj_data.filter((item) => {
        return item[0] === -1 && item[1] === -1;
      });
      if (arr.length === 8) return;
      ctx.beginPath();
      ctx.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
      ctx.lineTo(obj_data[1][0], obj_data[1][1]);
      ctx.lineTo(obj_data[5][0], obj_data[5][1]);
      ctx.lineTo(obj_data[7][0], obj_data[7][1]);
      ctx.lineTo(obj_data[6][0], obj_data[6][1]);
      ctx.lineTo(obj_data[2][0], obj_data[2][1]);
      ctx.lineTo(obj_data[3][0], obj_data[3][1]);
      ctx.lineTo(obj_data[1][0], obj_data[1][1]);
      ctx.moveTo(obj_data[0][0], obj_data[0][1]);
      ctx.lineTo(obj_data[2][0], obj_data[2][1]);
      ctx.moveTo(obj_data[0][0], obj_data[0][1]);
      ctx.lineTo(obj_data[4][0], obj_data[4][1]);
      ctx.lineTo(obj_data[6][0], obj_data[6][1]);
      ctx.moveTo(obj_data[4][0], obj_data[4][1]);
      ctx.lineTo(obj_data[5][0], obj_data[5][1]);
      ctx.moveTo(obj_data[3][0], obj_data[3][1]);
      ctx.lineTo(obj_data[7][0], obj_data[7][1]);
      ctx.lineWidth = "1.4"; //线条 宽度
      ctx.strokeStyle = "yellow";
      ctx.stroke(); //描边
    });
    console.log(Date.now(), "-----------渲染结束");
    imageBitmap = canvas.transferToImageBitmap();
    postMessage({
      imageBitmap: imageBitmap,
      view: view,
      key: key,
      time: Date.now(),
    });
  });
}
// 计算视频要放置在dom元素中的宽高--按照视频帧的比例来
function handleWH(imgW, imgH, domW, domH) {
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

