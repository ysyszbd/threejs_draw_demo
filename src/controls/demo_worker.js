onmessage = async (e) => {
  if (e.data.type === "draw_video_bg") {
    if (e.data.view === "foresight") {
      // console.log(e.data, "e.data===============", Date.now());
    }
    let imageBitmap = drawVideoBg(e.data.info, e.data.objs, e.data.view);
    postMessage({
      type: e.data.type,
      info: imageBitmap,
      view: e.data.view,
      key: e.data.key,
    });
  } else if (e.data.type === "draw_objs") {
    let foresight = drawObjs({ ...e.data, view: "foresight" }),
      rearview = drawObjs({ ...e.data, view: "rearview" }),
      right_front = drawObjs({ ...e.data, view: "right_front" }),
      right_back = drawObjs({ ...e.data, view: "right_back" }),
      left_back = drawObjs({ ...e.data, view: "left_back" }),
      left_front = drawObjs({ ...e.data, view: "left_front" });
    postMessage({
      type: e.data.type,
      data: {
        foresight: foresight,
        rearview: rearview,
        right_front: right_front,
        right_back: right_back,
        left_back: left_back,
        left_front: left_front,
      },
      key: e.data.key,
    });
  } else if (e.data.type === "draw_bev") {
    let imageBitmap = drawOffscreen(e.data);
    postMessage({
      type: e.data.type,
      info: imageBitmap,
      key: e.data.key,
    });
  }
};
function drawVideoBg(info, objs, view) {
  let canvas = new OffscreenCanvas(info.width, info.height);
  let context = canvas.getContext("2d");
  let imageBitmap;
  let imgData = new ImageData(info.rgb, info.width, info.height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    let data0 = imgData.data[i + 0];
    imgData.data[i + 0] = imgData.data[i + 2];
    imgData.data[i + 2] = data0;
  }
  context.putImageData(imgData, 0, 0);
  objs.filter((item) => {
    let obj_data = item[item.length - 1][view];
    let arr = obj_data.filter((item) => {
      return item[0] === -1 && item[1] === -1;
    });
    if (arr.length === 8) return;
    context.beginPath();
    context.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
    context.lineTo(obj_data[1][0], obj_data[1][1]);
    context.lineTo(obj_data[5][0], obj_data[5][1]);
    context.lineTo(obj_data[7][0], obj_data[7][1]);
    context.lineTo(obj_data[6][0], obj_data[6][1]);
    context.lineTo(obj_data[2][0], obj_data[2][1]);
    context.lineTo(obj_data[3][0], obj_data[3][1]);
    context.lineTo(obj_data[1][0], obj_data[1][1]);
    context.moveTo(obj_data[0][0], obj_data[0][1]);
    context.lineTo(obj_data[2][0], obj_data[2][1]);
    context.moveTo(obj_data[0][0], obj_data[0][1]);
    context.lineTo(obj_data[4][0], obj_data[4][1]);
    context.lineTo(obj_data[6][0], obj_data[6][1]);
    context.moveTo(obj_data[4][0], obj_data[4][1]);
    context.lineTo(obj_data[5][0], obj_data[5][1]);
    context.moveTo(obj_data[3][0], obj_data[3][1]);
    context.lineTo(obj_data[7][0], obj_data[7][1]);
    context.lineWidth = "1.4"; //线条 宽度
    context.strokeStyle = "yellow";
    context.stroke(); //描边
  });
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
// 绘制障碍物的离屏canvas
function drawObjs(data) {
  // console.log(data, "data");
  let canvas = new OffscreenCanvas(704, 256);
  let context = canvas.getContext("2d");
  let imageBitmap;
  data.objs.filter((item) => {
    let obj_data = item[item.length - 1][data.view];
    let arr = obj_data.filter((item) => {
      return item[0] === -1 && item[1] === -1;
    });
    if (arr.length === 8) return;
    context.beginPath();
    context.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
    context.lineTo(obj_data[1][0], obj_data[1][1]);
    context.lineTo(obj_data[5][0], obj_data[5][1]);
    context.lineTo(obj_data[7][0], obj_data[7][1]);
    context.lineTo(obj_data[6][0], obj_data[6][1]);
    context.lineTo(obj_data[2][0], obj_data[2][1]);
    context.lineTo(obj_data[3][0], obj_data[3][1]);
    context.lineTo(obj_data[1][0], obj_data[1][1]);
    context.moveTo(obj_data[0][0], obj_data[0][1]);
    context.lineTo(obj_data[2][0], obj_data[2][1]);
    context.moveTo(obj_data[0][0], obj_data[0][1]);
    context.lineTo(obj_data[4][0], obj_data[4][1]);
    context.lineTo(obj_data[6][0], obj_data[6][1]);
    context.moveTo(obj_data[4][0], obj_data[4][1]);
    context.lineTo(obj_data[5][0], obj_data[5][1]);
    context.moveTo(obj_data[3][0], obj_data[3][1]);
    context.lineTo(obj_data[7][0], obj_data[7][1]);
    context.lineWidth = "1.4"; //线条 宽度
    context.strokeStyle = "yellow";
    context.stroke(); //描边
  });
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
let map = new Map()
map.set(0, "rgba(80, 82, 79, 1)");
map.set(1, "rgba(255, 255, 255, 1)");
map.set(2, "rgba(0, 255, 0, 1)");
// 离屏渲染bev
function drawOffscreen(data) {

  let canvas = new OffscreenCanvas(data.w, data.h);
  let context = canvas.getContext("2d");
  let imageBitmap;
  data.bev_demo.filter((item, index) => {
    // let c = getColor(item);
    let points = getPoints(index, data.w);
    context.fillStyle = map.get(item);
    context.fillRect(points[0], points[1], 1, 1);
  });
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
const getColor = (color) => {
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
};
// 获取像素的坐标点，即像素点所在的行列值
const getPoints = (i, w) => {
  let w_i = 0,
    h_i = 0;
  h_i = Math.floor(i / w);
  w_i = i - w * h_i;
  return [w_i, h_i];
};
