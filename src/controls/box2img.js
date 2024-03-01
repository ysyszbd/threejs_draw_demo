export default class Camera {
  constructor(name, int_path, ext_path) {
    const fs_int = cv.FileStorage(int_path, cv.FILE_STORAGE_READ)
    const fs_ext = cv.FileStorage(ext_path, cv.FILE_STORAGE_READ)
    this.name = name
    this.K = fs_int.getNode('intrinsic').mat()
    this.D = fs_int.getNode('distCoeffs').mat()
    this.ext_lidar2cam = fs_ext.getNode('Rt').mat()
  }

  project_lidar2img(pts) {
    const pt_cam_x = pts[0] * this.ext_lidar2cam[0][0] + pts[1] * this.ext_lidar2cam[0][1] + pts[2] * this.ext_lidar2cam[0][2] + this.ext_lidar2cam[0][3]
    const pt_cam_y = pts[0] * this.ext_lidar2cam[1][0] + pts[1] * this.ext_lidar2cam[1][1] + pts[2] * this.ext_lidar2cam[1][2] + this.ext_lidar2cam[1][3]
    const pt_cam_z = pts[0] * this.ext_lidar2cam[2][0] + pts[1] * this.ext_lidar2cam[2][1] + pts[2] * this.ext_lidar2cam[2][2] + this.ext_lidar2cam[2][3]

    if (Math.abs(Math.atan(pt_cam_x / pt_cam_z)) > 60)
      return -1, -1

    if (pt_cam_z < 0.2)
      return -1, -1

    const x_u = pt_cam_x / pt_cam_z
    const y_u = pt_cam_y / pt_cam_z

    const r2 = x_u * x_u + y_u * y_u
    const r4 = r2 * r2
    const r6 = r4 * r2
    const a1 = 2 * x_u * y_u
    const a2 = r2 + 2 * x_u * x_u
    const a3 = r2 + 2 * y_u * y_u
    const cdist = 1 + this.D[0] * r2 + this.D[1] * r4 + this.D[4] * r6
    const icdist2 = 1. / (1 + this.D[5] * r2 + this.D[6] * r4 + this.D[7] * r6)

    const x_d = x_u * cdist * icdist2 + this.D[2] * a1 + this.D[3] * a2
    const y_d = y_u * cdist * icdist2 + this.D[2] * a3 + this.D[3] * a1

    const x = this.K[0][0] * x_d + this.K[0][2]
    const y = this.K[1][1] * y_d + this.K[1][2]
    return x[0], y[0]
  }
}
//
//    pt0 -- pt1
//   / |    / |
// pt2 -- pt3 |
//  |  |   |  |
//  | pt4 -- pt5
//  | /    | /
// pt6 -- pt7
//
export function GetBoundingBoxPoints(x, y, z, l, w, h, r_x, r_y, r_z) {
  const cos_a = math.cos(r_z - math.pi / 2)
  const sin_a = math.sin(r_z - math.pi / 2)
  const half_l = l / 2
  const half_w = w / 2
  const half_h = h / 2
  const pt0 = [cos_a * -half_w - sin_a * -half_l + x, sin_a * -half_w + cos_a * -half_l + y, z - half_h]
  const pt1 = [cos_a * half_w - sin_a * -half_l + x, sin_a * half_w + cos_a * -half_l + y, z - half_h]
  const pt2 = [cos_a * -half_w - sin_a * half_l + x, sin_a * -half_w + cos_a * half_l + y, z - half_h]
  const pt3 = [cos_a * half_w - sin_a * half_l + x, sin_a * half_w + cos_a * half_l + y, z - half_h]
  const pt4 = [cos_a * -half_w - sin_a * -half_l + x, sin_a * -half_w + cos_a * -half_l + y, z + half_h]
  const pt5 = [cos_a * half_w - sin_a * -half_l + x, sin_a * half_w + cos_a * -half_l + y, z + half_h]
  const pt6 = [cos_a * -half_w - sin_a * half_l + x, sin_a * -half_w + cos_a * half_l + y, z + half_h]
  const pt7 = [cos_a * half_w - sin_a * half_l + x, sin_a * half_w + cos_a * half_l + y,z + half_h]
  return [pt0, pt1, pt2, pt3, pt4, pt5, pt6, pt7]
}
