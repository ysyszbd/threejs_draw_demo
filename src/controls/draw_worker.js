onmessage = async (e) => {
  if (e.data.sign === "draw_bev&objs") {
    let bev_imageBitmap = await drawBev(e.data.bev, e.data.key);
    let view = {
      foresight: await drawVideoObjs(
        e.data.objs,
        "foresight",
        e.data.key
      ),
      rearview: await drawVideoObjs(
        e.data.objs,
        "rearview",
        e.data.key
      ),
      right_front: await drawVideoObjs(
        e.data.objs,
        "right_front",
        e.data.key
      ),
      right_back: await drawVideoObjs(
        e.data.objs,
        "right_back",
        e.data.key
      ),
      left_back: await drawVideoObjs(
        e.data.objs,
        "left_back",
        e.data.key
      ),
      left_front: await drawVideoObjs(
        e.data.objs,
        "left_front",
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
let bev_canvas = new OffscreenCanvas(400, 400),
  bev_context = bev_canvas.getContext("2d");
// 渲染bev
function drawBev(w, h, bev, key) {
  return new Promise((resolve, reject) => {
    let imgData = new ImageData(w, h);
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
    bev_context.fillText(key, 10, 40);
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
  v_objs_cxt = bev_canvas.getContext("2d");
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
    v_objs_cxt.fillText(key, 10, 40);
    resolve(v_objs_canvas.transferToImageBitmap());
  });
}
