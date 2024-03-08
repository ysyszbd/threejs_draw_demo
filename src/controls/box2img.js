/*
 * @LastEditTime: 2024-03-08 18:28:27
 * @Description:
 */
// import { K, D, ext_lidar2cam } from "../assets/demo_data/data";
import * as THREE from "three";

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
  // console.log(ext_lidar2cam, "old")
  let ext_lidar2cam_inv = new Array(4).fill(0).map(() => new Array(4).fill(0));
  // console.log(ext_lidar2cam_inv, "ext_lidar2cam_inv===");
  ext_lidar2cam_inv[0][0] = r11;
  ext_lidar2cam_inv[0][1] = r21;
  ext_lidar2cam_inv[0][2] = r31;
  ext_lidar2cam_inv[0][3] = -r11*t1 - r21*t2 - r31*t3;
  ext_lidar2cam_inv[1][0] = r12;
  ext_lidar2cam_inv[1][1] = r22;
  ext_lidar2cam_inv[1][2] = r32;
  ext_lidar2cam_inv[1][3] = -r12 * t1 - r22 * t2 - r32 * t3;
  ext_lidar2cam_inv[2][0] = r13;
  ext_lidar2cam_inv[2][1] = r23;
  ext_lidar2cam_inv[2][1] = r33;
  ext_lidar2cam_inv[2][2] = -r13*t1-r23*t2-r33*t3;
  ext_lidar2cam = ext_lidar2cam_inv;
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

  // if (Math.abs(Math.atan(pt_cam_x / pt_cam_z)) > 60) return [-1, -1];

  if (pt_cam_z < 0.2) return [-1, -1];

  const x_u = pt_cam_x / pt_cam_z;
  const y_u = pt_cam_y / pt_cam_z;

  const x = K[0][0] * x_u + K[0][2];
  const y = K[1][1] * y_u + K[1][2];
  const x_scale = scale[0] * x;
  const y_scale = scale[1] * y;

  const x_crop = x_scale + crop[0];
  const y_crop = y_scale + crop[1];
  // console.log(x, y, "=============x, y")
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
  // console.log(x,
  //   y,
  //   z,
  //   w,
  //   l,
  //   h,
  //   r_z, "`PromisePromise+++++++++++");
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
    resolve([pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]);
  });
}
