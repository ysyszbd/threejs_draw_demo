/*
 * @LastEditTime: 2024-03-18 18:37:15
 * @Description: 
 */
// 视频离屏渲染
export async function drawVideo(data) {
  // console.log(data, "data=========");
  let canvas = new OffscreenCanvas(data.info.width, data.info.height);
  let context = canvas.getContext("2d");
  let imageBitmap;
  let imgData = new ImageData(data.info.rgb, data.info.width, data.info.height);
  for (let i = 0; i < imgData.data.length; i += 4) {
    let data0 = imgData.data[i + 0];
    imgData.data[i + 0] = imgData.data[i + 2];
    imgData.data[i + 2] = data0;
  }
  context.putImageData(imgData, 0, 0);
  data.objs.filter((ele) => {
    let obj_data = ele[ele.length - 1][data.view];
    // console.log(ele, "ele-----", obj_data);
    let arr = obj_data.filter((item) => {
      return item[0] === -1 && item[1] === -1;
    });
    if (arr.length === 8) return;
    // console.log(context, "context");
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
    context.strokeStyle = "yellow";
    context.stroke(); //描边
  });
  imageBitmap = canvas.transferToImageBitmap();
  return imageBitmap;
}
// // 绘制3D线框
// export async function handleHelper(data, ctx) {
//   try {
//     let arr = data.filter((item) => {
//       return item[0] === -1 && item[1] === -1;
//     });
//     if (arr.length === 8) return;
//     this.drawLine([data[0], data[1]]);
//     this.drawLine([data[0], data[2]]);
//     this.drawLine([data[0], data[4]]);
//     this.drawLine([data[3], data[2]]);
//     this.drawLine([data[3], data[1]]);
//     this.drawLine([data[3], data[7]]);
//     this.drawLine([data[6], data[2]]);
//     this.drawLine([data[6], data[4]]);
//     this.drawLine([data[6], data[7]]);
//     this.drawLine([data[5], data[4]]);
//     this.drawLine([data[5], data[1]]);
//     this.drawLine([data[5], data[7]]);
//   } catch (err) {
//     console.log(err, "err-----handleHelper");
//   }
// }
// // 划线
// export async function drawLine(points, color = "yellow", ctx) {
//   console.log(ctx, "ctx======");
//   ctx.beginPath();
//   ctx.moveTo(points[0][0], points[0][1]); //移动到某个点；
//   ctx.lineTo(points[1][0], points[1][1]); //终点坐标；
//   ctx.lineWidth = "1.4"; //线条 宽度
//   ctx.strokeStyle = color;
//   ctx.stroke(); //描边
// }