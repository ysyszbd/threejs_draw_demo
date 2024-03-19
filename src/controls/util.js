import { create, all } from "mathjs";
const config = {
  number: "BigNumber",
  precision: 20,
};
const math = create(all, config);
//开方
export function numberSqrt (arg1) {
  return math.sqrt(arg1);
}
//除
export function numberExcept(arg1, arg2) {
  return math.divide(arg1, arg2);
}
// //乘
// numberRide: function (arg1, arg2) {
//   return math.multiply(arg1, arg2);
// },
// //加
// numberAdd: function (arg1, arg2) {
//   return math.add(arg1, arg2);
// },
// //减
// numberSub: function (arg1, arg2) {
//   return math.add(arg1, -arg2);
// },
// export default {
// };
