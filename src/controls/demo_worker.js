onmessage = async (e) => {
  console.log(e.data, "-----------------");
  if (e.data.sign === "draw_bev") {
    let bev_imageBitmap = await drawBev(e.data.w, e.data.h, e.data.bev);
    postMessage({
      key: e.data.key,
      imageBitmap: bev_imageBitmap,
    })
  }
};
let map = new Map();
map.set(0, [80, 82, 79, 1]);
map.set(1, [255, 255, 255, 1]);
map.set(2, [0, 255, 0, 1]);
map.set(3, [255, 0, 0, 1]);
// 渲染bev
function drawBev(w, h, bev) {
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
    imageBitmap = canvas.transferToImageBitmap();
    resolve(imageBitmap);
  });
}
