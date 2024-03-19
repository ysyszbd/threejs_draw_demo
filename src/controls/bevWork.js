import {
  GetBoundingBoxPoints,
  project_lidar2img,
  construct2DArray,
  math,
} from "@/controls/box2img.js";
import memoryPool from "./memoryPool.js";
import { ObserverInstance } from "@/controls/event/observer";
// ObserverInstance.selfAddListenerList(observerListenerList, "yh_init");
const MemoryPool = memoryPool.getInstance();
MemoryPool.op = 3

export function drawVideoBg(info) {
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
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
// 绘制障碍物的离屏canvas
export function drawObjs(data) {
  console.log(data, "data");
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
export async function drawObjsAll(data) {
  try {

    console.log(data, "data=============");
    let foresight = await drawObjs({ ...data, view: "foresight" });
    let rearview = await drawObjs({ ...data, view: "rearview" });
    ObserverInstance.emit("SET_DATA",
      data.key, 
      foresight,
      "video_objs",
      "foresight"
    );
    ObserverInstance.emit("SET_DATA",
      data.key, 
      rearview,
      "video_objs",
      "rearview"
    );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "foresight" }),
    //   "video_objs",
    //   "foresight"
    // );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "rearview" }),
    //   "video_objs",
    //   "rearview"
    // );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "right_front" }),
    //   "video_objs",
    //   "right_front"
    // );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "right_back" }),
    //   "video_objs",
    //   "right_back"
    // );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "left_back" }),
    //   "video_objs",
    //   "left_back"
    // );
    // MemoryPool.free(
    //   data.key,
    //   drawObjs({ ...data, view: "left_front" }),
    //   "video_objs",
    //   "left_front"
    // );
    // console.log(MemoryPool, "MemoryPool");
  }catch(err) {
    console.log(err, "err===drawObjsAll")
  }
}
// 离屏渲染bev
export function drawOffscreen(data) {
  let canvas = new OffscreenCanvas(data.w, data.h);
  let context = canvas.getContext("2d");
  let imageBitmap;
  data.bev_demo.filter((item, index) => {
    let c = getColor(item);
    let points = getPoints(index, data.w);
    context.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
    context.fillRect(points[0], points[1], 1, 1);
  });
  // for (let i = 0; i < data.bev_demo.length; i++) {
  //   let c = getColor(data.bev_demo[i]);
  //   let points = getPoints(i, data.w);
  //   context.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
  //   context.fillRect(points[0], points[1], 1, 1);
  // }
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
export const getColor = (color) => {
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
export const getPoints = (i, w) => {
  let w_i = 0,
    h_i = 0;
  h_i = Math.floor(i / w);
  w_i = i - w * h_i;
  return [w_i, h_i];
};
// 计算障碍物信息
export function handleObjs(objs_data) {
  let obj_index = {
    "0-0": {
      name: "car",
      data: [],
    },
    "1-0": { name: "truck", data: [] },
    "1-1": { name: "construction_vehicle", data: [] },
    "2-0": { name: "bus", data: [] },
    "2-1": { name: "trailer", data: [] },
    "3-0": { name: "barrier", data: [] },
    "4-0": { name: "motorcycle", data: [] },
    "4-1": { name: "bicycle", data: [] },
    "5-0": { name: "pedestrian", data: [] },
    "5-1": { name: "street_cone", data: [] },
  };
  objs_data.filter((item) => {
    let type = `${item[7]}-${item[8]}`;
    if (obj_index[type]) {
      obj_index[type].data.push(item);
    }
  });
  return obj_index;
}
// opencv计算
export function cvFun() {}
// 计算点坐标数据
let view_i = {
    0: "foresight",
    3: "rearview",
    1: "right_front",
    5: "right_back",
    4: "left_back",
    2: "left_front",
  },
  K = {},
  ext_lidar2cam = {};
export async function handleObjsPoints(base, objs) {
  for (let i = 0; i < 6; i++) {
    K[view_i[i]] = construct2DArray(base[4][i], 3, 3);
    ext_lidar2cam[view_i[i]] = construct2DArray(base[3][i], 4, 4);
  }
  for (let j = 0; j < objs.length; j++) {
    let data = {
      points_eight: [],
      foresight: [],
      rearview: [],
      right_front: [],
      right_back: [],
      left_back: [],
      left_front: [],
    };

    let a = objs[j].slice(0, 6);
    data.points_eight = await GetBoundingBoxPoints(...a, objs[j][9]);
    // console.log(data.points_eight, "data.points_eight==");
    let view_sign = {
      foresight: 0,
      rearview: 0,
      right_front: 0,
      right_back: 0,
      left_back: 0,
      left_front: 0,
    };
    data.points_eight.filter((item) => {
      let pt_cam_z;
      for (let e in view_sign) {
        const transposeMatrix = math.inv(ext_lidar2cam[e]);
        pt_cam_z =
          item[0] * transposeMatrix[2][0] +
          item[1] * transposeMatrix[2][1] +
          item[2] * transposeMatrix[2][2] +
          transposeMatrix[2][3];
        // console.log(pt_cam_z, "pt_cam_z-------", e, j)
        if (pt_cam_z < 0.2) {
          view_sign[e]++;
        }
      }
    });

    data.points_eight.filter((item) => {
      for (let e in view_sign) {
        if (view_sign[e] === 8) {
          data[e].push([-1, -1]);
        } else {
          data[e].push(
            project_lidar2img(item, ext_lidar2cam[e], K[e], base[5], base[6])
          );
        }
      }
    });
    objs[j].push(data);
  }
  return objs;
}
