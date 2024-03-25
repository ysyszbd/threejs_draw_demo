onmessage = async (e) => {
  // console.log(e.data, "-----------------");
  if (e.data.sign === "draw_bev&objs") {
    let bev_imageBitmap = await drawBev(e.data.bev_w, e.data.bev_h, e.data.bev, e.data.key);
    let view = {
      foresight: await drawVideoObjs(
        e.data.objs,
        "foresight",
        704,
        256,
        e.data.key
      ),
      rearview: await drawVideoObjs(
        e.data.objs,
        "rearview",
        704,
        256,
        e.data.key
      ),
      right_front: await drawVideoObjs(
        e.data.objs,
        "right_front",
        704,
        256,
        e.data.key
      ),
      right_back: await drawVideoObjs(
        e.data.objs,
        "right_back",
        704,
        256,
        e.data.key
      ),
      left_back: await drawVideoObjs(
        e.data.objs,
        "left_back",
        704,
        256,
        e.data.key
      ),
      left_front: await drawVideoObjs(
        e.data.objs,
        "left_front",
        704,
        256,
        e.data.key
      ),
    };
    postMessage({
      sign: e.data.sign,
      key: e.data.key,
      imageBitmap: bev_imageBitmap,
      objs_imageBitmap: view,
    });
  }
};
let map = new Map();
map.set(0, [80, 82, 79, 1]);
map.set(1, [255, 255, 255, 1]);
map.set(2, [0, 255, 0, 1]);
map.set(3, [255, 0, 0, 1]);
// 渲染bev
function drawBev(w, h, bev, key) {
  return new Promise((resolve, reject) => {
    let canvas = new OffscreenCanvas(w, h);
    let context = canvas.getContext("2d");
    let imageBitmap;
    let imgData = new ImageData(w, h);
    for (let i = 0; i < imgData.data.length; i += 4) {
      let num = bev[i / 4];
      let color = map.get(num);
      imgData.data[i + 0] = color[0];
      imgData.data[i + 1] = color[1];
      imgData.data[i + 2] = color[2];
      imgData.data[i + 3] = 255;
    }
    context.putImageData(imgData, 0, 0);
    context.fillStyle = "white";
    context.fillRect(10, 20, 180, 30);
    context.font = "24px serif";
    context.fillStyle = "blue";
    context.fillText(key, 10, 40);
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
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
// 各view渲染障碍物
function drawVideoObjs(objs, view, w, h, key) {
  return new Promise((resolve, reject) => {
    let canvas = new OffscreenCanvas(w, h);
    let context = canvas.getContext("2d");
    let imageBitmap;
    objs.filter((item) => {
      let color = box_color[`${item[7]}-${item[8]}`];
      let obj_data = item[item.length - 1][view];
      let arr = obj_data.filter((item) => {
        return item[0] === -1 && item[1] === -1;
      });
      if (arr.length === 8) return;
      context.beginPath();
      context.lineWidth = "1.4"; //线条 宽度
      context.strokeStyle = color;
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
      context.stroke(); //描边
    });
    context.fillStyle = "white";
    context.fillRect(10, 20, 180, 30);
    context.font = "24px serif";
    context.fillStyle = "green";
    context.fillText(key, 10, 40);
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
  });
}
