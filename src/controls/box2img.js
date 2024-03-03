/*
 * @LastEditTime: 2024-03-03 18:40:27
 * @Description:
 */
import { K, D, ext_lidar2cam } from "../assets/demo_data/data";
// 计算盒子在不同机位中的坐标
export function project_lidar2img(pts, type) {
  const pt_cam_x =
    pts[0] * ext_lidar2cam[type][0][0] +
    pts[1] * ext_lidar2cam[type][0][1] +
    pts[2] * ext_lidar2cam[type][0][2] +
    ext_lidar2cam[type][0][3];
  const pt_cam_y =
    pts[0] * ext_lidar2cam[type][1][0] +
    pts[1] * ext_lidar2cam[type][1][1] +
    pts[2] * ext_lidar2cam[type][1][2] +
    ext_lidar2cam[type][1][3];
  const pt_cam_z =
    pts[0] * ext_lidar2cam[type][2][0] +
    pts[1] * ext_lidar2cam[type][2][1] +
    pts[2] * ext_lidar2cam[type][2][2] +
    ext_lidar2cam[type][2][3];
  // debugger
  if (Math.abs(Math.atan(pt_cam_x / pt_cam_z)) > 60) return [-1, -1];

  if (pt_cam_z < 0.2) return [-1, -1];

  const x_u = pt_cam_x / pt_cam_z;
  const y_u = pt_cam_y / pt_cam_z;

  const r2 = x_u * x_u + y_u * y_u;
  const r4 = r2 * r2;
  const r6 = r4 * r2;
  const a1 = 2 * x_u * y_u;
  const a2 = r2 + 2 * x_u * x_u;
  const a3 = r2 + 2 * y_u * y_u;
  const cdist = 1 + D[type][0] * r2 + D[type][1] * r4 + D[type][4] * r6;
  const icdist2 = 1 / (1 + D[type][5] * r2 + D[type][6] * r4 + D[type][7] * r6);

  const x_d = x_u * cdist * icdist2 + D[type][2] * a1 + D[type][3] * a2;
  const y_d = y_u * cdist * icdist2 + D[type][2] * a3 + D[type][3] * a1;

  const x = K[type][0][0] * x_d + K[type][0][2];
  const y = K[type][1][1] * y_d + K[type][1][2];
  return [x, y];
}
//
//    pt0 -- pt1
//   / |    / |
// pt2 -- pt3 |
//  |  |   |  |
//  | pt4 -- pt5
//  | /    | /
// pt6 -- pt7
// 计算盒子的8个点坐标
export function GetBoundingBoxPoints(x, y, z, l, w, h, r_x = 0, r_y = 0, r_z) {
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
  return [pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7];
}
