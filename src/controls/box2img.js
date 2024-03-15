/*
 * @LastEditTime: 2024-03-15 17:42:14
 * @Description:
 */
// import { K, D, ext_lidar2cam } from "../assets/demo_data/data";
import { create, all } from "mathjs";
// 创建mathjs实例
const mathjs = create(all, {
  number: "BigNumber",
  precision: 20,
});
const math = create(all, mathjs);

export function construct2DArray(original, m, n) {
  return original.length === m * n
    ? Array.from({ length: m }, (_, i) => original.slice(i * n, (i + 1) * n))
    : [];
}
// 将3d坐标转换为2D坐标
// ext转为4*4，k转为3*3
export function project_lidar2img(pts, ext_lidar2cam, K, scale, crop) {
  const r11 = ext_lidar2cam[0][0];
  const r12 = ext_lidar2cam[0][1];
  const r13 = ext_lidar2cam[0][2];
  const t1 = ext_lidar2cam[0][3];
  const r21 = ext_lidar2cam[1][0];
  const r22 = ext_lidar2cam[1][1];
  const r23 = ext_lidar2cam[1][2];
  const t2 = ext_lidar2cam[1][3];
  const r31 = ext_lidar2cam[2][0];
  const r32 = ext_lidar2cam[2][1];
  const r33 = ext_lidar2cam[2][2];
  const t3 = ext_lidar2cam[2][3];
  // 快速创建一个4维数组
  let ext_lidar2cam_inv = new Array(4).fill(0).map(() => new Array(4).fill(0));
  ext_lidar2cam_inv[0][0] = r11;
  ext_lidar2cam_inv[0][1] = r21;
  ext_lidar2cam_inv[0][2] = r31;
  ext_lidar2cam_inv[0][3] = -r11 * t1 - r21 * t2 - r31 * t3;
  ext_lidar2cam_inv[1][0] = r12;
  ext_lidar2cam_inv[1][1] = r22;
  ext_lidar2cam_inv[1][2] = r32;
  ext_lidar2cam_inv[1][3] = -r12 * t1 - r22 * t2 - r32 * t3;
  ext_lidar2cam_inv[2][0] = r13;
  ext_lidar2cam_inv[2][1] = r23;
  ext_lidar2cam_inv[2][1] = r33;
  ext_lidar2cam_inv[2][2] = -r13 * t1 - r23 * t2 - r33 * t3;

  // 逆转矩阵
  const transposeMatrix = math.inv(ext_lidar2cam);
  ext_lidar2cam = transposeMatrix;
  // console.log(transposeMatrix, "transposeMatrix");
  // console.log(ext_lidar2cam, "ext_lidar2cam===");
  // ext_lidar2cam = ext_lidar2cam_inv;
  // console.log(ext_lidar2cam, "new")

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
  const y_u = pt_cam_y /  Math.abs(pt_cam_z);

  const x = K[0][0] * x_u + K[0][2];
  const y = K[1][1] * y_u + K[1][2];
  const x_scale = scale[0] * x;
  const y_scale = scale[1] * y;

  const x_crop = x_scale + crop[0];
  const y_crop = y_scale + crop[1];
  return [x_crop, y_crop];
}
// export function project_lidar2img(pts, type) {
//   const pt_cam_x =
//     pts[0] * ext_lidar2cam[type][0][0] +
//     pts[1] * ext_lidar2cam[type][0][1] +
//     pts[2] * ext_lidar2cam[type][0][2] +
//     ext_lidar2cam[type][0][3];
//   const pt_cam_y =
//     pts[0] * ext_lidar2cam[type][1][0] +
//     pts[1] * ext_lidar2cam[type][1][1] +
//     pts[2] * ext_lidar2cam[type][1][2] +
//     ext_lidar2cam[type][1][3];
//   const pt_cam_z =
//     pts[0] * ext_lidar2cam[type][2][0] +
//     pts[1] * ext_lidar2cam[type][2][1] +
//     pts[2] * ext_lidar2cam[type][2][2] +
//     ext_lidar2cam[type][2][3];
//   // debugger
//   if (Math.abs(Math.atan(pt_cam_x / pt_cam_z)) > 60) return [-1, -1];

//   if (pt_cam_z < 0.2) return [-1, -1];

//   const x_u = pt_cam_x / pt_cam_z;
//   const y_u = pt_cam_y / pt_cam_z;

//   // const r2 = x_u * x_u + y_u * y_u;
//   // const r4 = r2 * r2;
//   // const r6 = r4 * r2;
//   // const a1 = 2 * x_u * y_u;
//   // const a2 = r2 + 2 * x_u * x_u;
//   // const a3 = r2 + 2 * y_u * y_u;
//   // const cdist = 1 + D[type][0] * r2 + D[type][1] * r4 + D[type][4] * r6;
//   // const icdist2 =
//   //   1 / (1 + D[type][5] * r2 + D[type][6] * r4 + D[type][7] * r6);

//   // const x_d = x_u * cdist * icdist2 + D[type][2] * a1 + D[type][3] * a2;
//   // const y_d = y_u * cdist * icdist2 + D[type][2] * a3 + D[type][3] * a1;

//   const x = K[type][0][0] * x_u + K[type][0][2];
//   const y = K[type][1][1] * y_u + K[type][1][2];
//   // const x = K[type][0][0] * x_d + K[type][0][2];
//   // const y = K[type][1][1] * y_d + K[type][1][2];
//   return [x, y];
//   // return new Promise((resolve, reject) => {
//   //   resolve([x, y]);
//   // });
// }
//
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

// 深拷贝
// 这里重写了用is对象来判断类型
const is = {
  Array: Array.isArray,
  Date: (val) => val instanceof Date,
  Set: (val) => Object.prototype.toString.call(val) === '[object Set]',
  Map: (val) => Object.prototype.toString.call(val) === '[object Map]',
  Object: (val) => Object.prototype.toString.call(val) === '[object Object]',
  Symbol: (val) => Object.prototype.toString.call(val) === '[object Symbol]',
  Function: (val) => Object.prototype.toString.call(val) === '[object Function]',
}

export function deepClone(value) {
  // 2.1 函数浅拷贝
  /* if (is.Function(value)) return value */
    
  // 2.2 函数深拷贝
    if (is.Function(value)) {
    if (/^function/.test(value.toString()) || /^\(\)/.test(value.toString())) 
      return new Function('return ' + value.toString())()

    return new Function('return function ' + value.toString())()
  }
  
  // 3.Date 深拷贝
  if (is.Date(value)) return new Date(value.valueOf())

  // 4.判断如果是Symbol的value, 那么创建一个新的Symbol
  if (is.Symbol(value)) return Symbol(value.description)

  // 5.判断是否是Set类型 进行深拷贝
  if (is.Set(value)) {
    // 5.1 浅拷贝 直接进行解构即可
    // return new Set([...value])

    // 5.2 深拷贝
    const newSet = new Set()
    for (const item of value) newSet.add(deepClone(item))
    return newSet
  }
  
  // 6.判断是否是Map类型 
  if (is.Map(value)) {
    // 6.1 浅拷贝 直接进行解构即可
    // return new Map([...value])

    // 6.2 深拷贝
    const newMap = new Map()
    for (const item of value) newMap.set(deepClone(item[0]), deepClone(item[1]))
    return newMap
  }

  // 1.如果不是对象类型则直接将当前值返回
  if (!(is.Object(value))) return value

  // 7.判断传入的对象是数组, 还是对象
  const newObject = is.Array(value) ? [] : {}

  for (const key in value) {
    // 8 进行递归调用
    newObject[key] = deepClone(value[key])
  }

  // 4.1 对Symbol作为key进行特殊的处理 拿到对象上面的所有Symbol key，以数组形式返回
  const symbolKeys = Object.getOwnPropertySymbols(value)
  for (const sKey of symbolKeys) {

    // 4.2 这里没有必要创建一个新的Symbol
    // const newSKey = Symbol(sKey.description)

    // 4.3 直接将原来的Symbol key 拷贝到新对象上就可以了
    newObject[sKey] = deepClone(value[sKey])
  }

  return newObject
}
