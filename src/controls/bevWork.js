// 离屏渲染bev
export function drawOffscreen(data) {
  let canvas = new OffscreenCanvas(data.w, data.h);
  let context = canvas.getContext("2d");
  let imageBitmap;
  for (let i = 0; i < data.bev_demo.length; i++) {
    let c = getColor(data.bev_demo[i]);
    let points = getPoints(i, data.w);
    context.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
    context.fillRect(points[0], points[1], 1, 1);
  }
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
