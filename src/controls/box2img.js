/*
 * @LastEditTime: 2024-03-21 17:44:41
 * @Description:
 */
// import { K, D, ext_lidar2cam } from "../assets/demo_data/data";
import { create, all } from "mathjs";
// 创建mathjs实例
const mathjs = create(all, {
  number: "BigNumber",
  precision: 20,
});
export const math = create(all, mathjs);

export function construct2DArray(original, m, n) {
  return original.length === m * n
    ? Array.from({ length: m }, (_, i) => original.slice(i * n, (i + 1) * n))
    : [];
}
// 将3d坐标转换为2D坐标
// ext转为4*4，k转为3*3
export function project_lidar2img(pts, ext_lidar2cam, K, scale, crop) {
  // 逆转矩阵
  const transposeMatrix = math.inv(ext_lidar2cam);
  ext_lidar2cam = transposeMatrix;

  const pt_cam_x =
    pts[0] * ext_lidar2cam[0][0] +
    pts[1] * ext_lidar2cam[0][1] +
    pts[2] * ext_lidar2cam[0][2] +
    ext_lidar2cam[0][3];
  const pt_cam_y =
    pts[0] * ext_lidar2cam[1][0] +
    pts[1] * ext_lidar2cam[1][1] +
    pts[2] * ext_lidar2cam[1][2] +
    ext_lidar2cam[1][3];
  const pt_cam_z =
    pts[0] * ext_lidar2cam[2][0] +
    pts[1] * ext_lidar2cam[2][1] +
    pts[2] * ext_lidar2cam[2][2] +
    ext_lidar2cam[2][3];
  // if (Math.abs(Math.atan(pt_cam_x / pt_cam_z)) > 70) return [-1, -1];
  // if (pt_cam_z < 0.2) return [-1, -1];
  const x_u = pt_cam_x / Math.abs(pt_cam_z);
  const y_u = pt_cam_y / Math.abs(pt_cam_z);

  const x = K[0][0] * x_u + K[0][2];
  const y = K[1][1] * y_u + K[1][2];
  const x_scale = scale[0] * x;
  const y_scale = scale[1] * y;

  const x_crop = x_scale + crop[0];
  const y_crop = y_scale + crop[1];
  return [x_crop, y_crop];
}
//    pt0 -- pt1
//   / |    / |
// pt2 -- pt3 |
//  |  |   |  |
//  | pt4 -- pt5
//  | /    | /
// pt6 -- pt7
// 计算盒子的8个点坐标
export function GetBoundingBoxPoints(x, y, z, w, l, h, r_z) {
  return new Promise(async (resolve, reject) => {
    const cos_a = Math.cos(r_z - Math.PI / 2);
    const sin_a = Math.sin(r_z - Math.PI / 2);
    const half_l = l / 2;
    const half_w = w / 2;
    const half_h = h / 2;
    const pt0 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    const pt1 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z - half_h,
    ];
    const pt2 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z - half_h,
    ];
    const pt3 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z - half_h,
    ];
    const pt4 = [
      cos_a * -half_w - sin_a * -half_l + x,
      sin_a * -half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    const pt5 = [
      cos_a * half_w - sin_a * -half_l + x,
      sin_a * half_w + cos_a * -half_l + y,
      z + half_h,
    ];
    const pt6 = [
      cos_a * -half_w - sin_a * half_l + x,
      sin_a * -half_w + cos_a * half_l + y,
      z + half_h,
    ];
    const pt7 = [
      cos_a * half_w - sin_a * half_l + x,
      sin_a * half_w + cos_a * half_l + y,
      z + half_h,
    ];
    // const pt8 = [x, y, z];
    // resolve([pt8, pt8, pt8, pt8, pt8, pt8, pt8, pt8]);

    resolve([pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]);
  });
}
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
  return new Promise(async (resolve, reject) => {
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
    resolve(objs);
  });
}

// 计算障碍物信息
export function handleObjs(objs_data) {
  return new Promise((resolve, reject) => {
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
    resolve(obj_index);
  });
}
let box_color = {
  "0-0": "rgb(255, 0, 128)",
  "1-0": "rgb(0, 128, 255)",
  "1-1": "rgb(0,  255,  255)",
  "2-0": "rgb(150,  30, 150)",
  "2-1": "rgb(255,  0,  128)",
  "3-0": "rgb(192, 67, 100)",
  "4-0": "rgb(255, 255, 0)",
  "4-1": "rgb(255,  128,   0)",
  "5-0": "rgb(0, 255,  0)",
  "5-1": "rgb(0,  128, 128)",
};
// 渲染视频
export function drawVideoBg(info, objs, view, key) {
  // console.log("info, objs, view-------------", key);
  return new Promise((resolve, reject) => {
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
      let color = box_color[`${item[7]}-${item[8]}`];
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
      context.strokeStyle = color;
      context.stroke(); //描边
    });
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
  });
}
let map = new Map();
map.set(0, [80, 82, 79, 1]);
map.set(1, [255, 255, 255, 1]);
map.set(2, [0, 255, 0, 1]);
map.set(3, [255, 0, 0, 1]);
// 渲染bev
export function drawBev(data) {
  return new Promise((resolve, reject) => {
    let w = data.basic_data[1],
      h = data.basic_data[2];
    let canvas = new OffscreenCanvas(w, h);
    let context = canvas.getContext("2d");
    let imageBitmap;
    let imgData = new ImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      let num = data.info[i / 4];
      let color = map.get(num);
      imgData.data[i + 0] = color[0];
      imgData.data[i + 1] = color[1];
      imgData.data[i + 2] = color[2];
      imgData.data[i + 3] = 255;
    }
    context.putImageData(imgData, 0, 0);
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
  })
}

// 深拷贝
// 这里重写了用is对象来判断类型
const is = {
  Array: Array.isArray,
  Date: (val) => val instanceof Date,
  Set: (val) => Object.prototype.toString.call(val) === "[object Set]",
  Map: (val) => Object.prototype.toString.call(val) === "[object Map]",
  Object: (val) => Object.prototype.toString.call(val) === "[object Object]",
  Symbol: (val) => Object.prototype.toString.call(val) === "[object Symbol]",
  Function: (val) =>
    Object.prototype.toString.call(val) === "[object Function]",
};

export function deepClone(value) {
  // 2.1 函数浅拷贝
  /* if (is.Function(value)) return value */

  // 2.2 函数深拷贝
  if (is.Function(value)) {
    if (/^function/.test(value.toString()) || /^\(\)/.test(value.toString()))
      return new Function("return " + value.toString())();

    return new Function("return function " + value.toString())();
  }

  // 3.Date 深拷贝
  if (is.Date(value)) return new Date(value.valueOf());

  // 4.判断如果是Symbol的value, 那么创建一个新的Symbol
  if (is.Symbol(value)) return Symbol(value.description);

  // 5.判断是否是Set类型 进行深拷贝
  if (is.Set(value)) {
    // 5.1 浅拷贝 直接进行解构即可
    // return new Set([...value])

    // 5.2 深拷贝
    const newSet = new Set();
    for (const item of value) newSet.add(deepClone(item));
    return newSet;
  }

  // 6.判断是否是Map类型
  if (is.Map(value)) {
    // 6.1 浅拷贝 直接进行解构即可
    // return new Map([...value])

    // 6.2 深拷贝
    const newMap = new Map();
    for (const item of value)
      newMap.set(deepClone(item[0]), deepClone(item[1]));
    return newMap;
  }

  // 1.如果不是对象类型则直接将当前值返回
  if (!is.Object(value)) return value;

  // 7.判断传入的对象是数组, 还是对象
  const newObject = is.Array(value) ? [] : {};

  for (const key in value) {
    // 8 进行递归调用
    newObject[key] = deepClone(value[key]);
  }

  // 4.1 对Symbol作为key进行特殊的处理 拿到对象上面的所有Symbol key，以数组形式返回
  const symbolKeys = Object.getOwnPropertySymbols(value);
  for (const sKey of symbolKeys) {
    // 4.2 这里没有必要创建一个新的Symbol
    // const newSKey = Symbol(sKey.description)

    // 4.3 直接将原来的Symbol key 拷贝到新对象上就可以了
    newObject[sKey] = deepClone(value[sKey]);
  }

  return newObject;
}
