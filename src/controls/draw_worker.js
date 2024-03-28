importScripts("./gl-matrix-min.js");
const mat4 = glMatrix.mat4;
const mat3 = glMatrix.mat3;
onmessage = async (e) => {
  if (e.data.sign === "draw_bev&objs") {
    // console.log(e.data, "e.data");
    let bev_imageBitmap = await drawBev(e.data.bev, e.data.key);
    let v_obj = await handleObjsPoints(e.data.basic_data, e.data.objs);
    // let bev = await drawBevPoint(e.data.bevs_point, e.data.key);
    let view = {
      foresight: await drawVideoObjs(v_obj, "foresight", e.data.key),
      rearview: await drawVideoObjs(v_obj, "rearview", e.data.key),
      right_front: await drawVideoObjs(v_obj, "right_front", e.data.key),
      right_back: await drawVideoObjs(v_obj, "right_back", e.data.key),
      left_back: await drawVideoObjs(v_obj, "left_back", e.data.key),
      left_front: await drawVideoObjs(v_obj, "left_front", e.data.key),
    };
    postMessage({
      sign: e.data.sign,
      key: e.data.key,
      imageBitmap: bev_imageBitmap,
      objs_imageBitmap: view,
      objs: await handleObjs(e.data.objs),
      bev: e.data?.bevs_point
      // bev: e.data?.bevs_point ? await drawBevPoint(e.data?.bevs_point) : null
    });
  }
};
let map = new Map();
map.set(0, [80, 82, 79, 1]);
map.set(1, [255, 255, 255, 1]);
map.set(2, [0, 255, 0, 1]);
map.set(3, [255, 0, 0, 1]);
let bev_can = new OffscreenCanvas(200, 200),
  bev_ctx = bev_can.getContext("2d");
function drawBevPoint(points) {
  return new Promise((resolve, reject) => {
    points.filter(item => {
      bev_ctx.beginPath();
      bev_ctx.lineWidth = "1"; //线条 宽度
      bev_ctx.strokeStyle = "red";
      bev_ctx.moveTo(item[1][0], item[1][1]);
      for (let i = 1; i < item[1].length; i++) {
        // console.log(item[1][i], "item", i);
        bev_ctx.lineTo(item[1][i][0], item[1][i][1]);
      }
      bev_ctx.stroke();
      // bev_ctx.closePath();
    })
    resolve(bev_can.transferToImageBitmap())
  })
}
let bev_canvas = new OffscreenCanvas(200, 200),
  bev_context = bev_canvas.getContext("2d");
// 渲染bev
function drawBev(bev, key) {
  return new Promise((resolve, reject) => {
    let imgData = new ImageData(200, 200);
    for (let i = 0; i < imgData.data.length; i += 4) {
      let num = bev[i / 4];
      let color = map.get(num);
      imgData.data[i + 0] = color[0];
      imgData.data[i + 1] = color[1];
      imgData.data[i + 2] = color[2];
      imgData.data[i + 3] = 255;
    }
    bev_context.putImageData(imgData, 0, 0);
    bev_context.fillStyle = "white";
    bev_context.fillRect(10, 20, 180, 30);
    bev_context.font = "24px serif";
    bev_context.fillStyle = "blue";
    bev_context.fillText(key.id, 10, 40);
    resolve(bev_canvas.transferToImageBitmap());
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
let v_objs_canvas = new OffscreenCanvas(960, 480),
  v_objs_cxt = v_objs_canvas.getContext("2d");
// 各view渲染障碍物
function drawVideoObjs(objs, view, key) {
  return new Promise((resolve, reject) => {
    objs.filter((item) => {
      let color = box_color[`${item[7]}-${item[8]}`];
      let obj_data = item[item.length - 1][view];
      let arr = obj_data.filter((item) => {
        return item[0] === -1 && item[1] === -1;
      });
      if (arr.length === 8) return;
      v_objs_cxt.beginPath();
      v_objs_cxt.lineWidth = "1.4"; //线条 宽度
      v_objs_cxt.strokeStyle = color;
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]); //移动到某个点；
      v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
      v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
      v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
      v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
      v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
      v_objs_cxt.lineTo(obj_data[3][0], obj_data[3][1]);
      v_objs_cxt.lineTo(obj_data[1][0], obj_data[1][1]);
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
      v_objs_cxt.lineTo(obj_data[2][0], obj_data[2][1]);
      v_objs_cxt.moveTo(obj_data[0][0], obj_data[0][1]);
      v_objs_cxt.lineTo(obj_data[4][0], obj_data[4][1]);
      v_objs_cxt.lineTo(obj_data[6][0], obj_data[6][1]);
      v_objs_cxt.moveTo(obj_data[4][0], obj_data[4][1]);
      v_objs_cxt.lineTo(obj_data[5][0], obj_data[5][1]);
      v_objs_cxt.moveTo(obj_data[3][0], obj_data[3][1]);
      v_objs_cxt.lineTo(obj_data[7][0], obj_data[7][1]);
      v_objs_cxt.stroke(); //描边
    });
    v_objs_cxt.fillStyle = "white";
    v_objs_cxt.fillRect(10, 20, 180, 30);
    v_objs_cxt.font = "24px serif";
    v_objs_cxt.fillStyle = "green";
    v_objs_cxt.fillText(key.id, 10, 40);
    resolve(v_objs_canvas.transferToImageBitmap());
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
async function handleObjsPoints(base, objs) {
  return new Promise(async (resolve, reject) => {
    for (let i = 0; i < 6; i++) {
      K[view_i[i]] = mat3.fromValues(...base[4][i]);
      ext_lidar2cam[view_i[i]] = mat4.fromValues(...base[3][i]);
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
          const inverseMatrix = mat4.create();
          mat4.invert(inverseMatrix, ext_lidar2cam[e]);

          const transposeMatrix = construct2DArray(inverseMatrix, 4, 4);
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
// 将3d坐标转换为2D坐标
// ext转为4*4，k转为3*3
function project_lidar2img(pts, ext_lidar2cam, K, scale, crop) {
  // 逆转矩阵
  const inverseMatrix = mat4.create();
  mat4.invert(inverseMatrix, ext_lidar2cam);
  ext_lidar2cam = construct2DArray(inverseMatrix, 4, 4);
  K = construct2DArray(K, 3, 3);
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
function GetBoundingBoxPoints(x, y, z, w, l, h, r_z) {
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
function construct2DArray(original, m, n) {
  return original.length === m * n
    ? Array.from({ length: m }, (_, i) => original.slice(i * n, (i + 1) * n))
    : [];
}
// 计算障碍物信息
function handleObjs(objs_data) {
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
