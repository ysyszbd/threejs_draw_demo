/*
 * @LastEditTime: 2024-03-15 13:58:45
 * @Description: 
 */
module.exports = {
  plugins: {
    autoprefixer: {},
    "@njleonzhang/postcss-px-to-rem": {
      unitToConvert: "px", // (String) 要转换的单位，默认是 px。
      widthOfDesignLayout: 1920, // (Number) 设计布局的宽度。对于pc仪表盘，一般是 1920.
      unitPrecision: 3, // (Number) 允许 rem 单位增长到的十进制数字.
      selectorBlackList: [".ignore", ".hairlines"], // (Array) 要忽略并保留为 px 的选择器.
      minPixelValue: 1, // (Number) 设置要替换的最小像素值.
      mediaQuery: false, // (Boolean) 允许在媒体查询中转换 px.
    },
  },
};
