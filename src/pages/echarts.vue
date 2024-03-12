<!--
 * @LastEditTime: 2024-03-12 17:16:24
 * @Description: 
-->
<template>
  <div class="echarts_box">
    <div id="move_echart" class="echart"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import * as echarts from "echarts/core";
import {
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
} from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  TitleComponent,
  ToolboxComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  CanvasRenderer,
  UniversalTransition,
]);

let chartDom = ref(null),
  myChart = ref(null),
  option = ref(null),
  timeArr = ref([]);
onMounted(() => {
  initEcharts();
});
function initEcharts() {
  chartDom.value = document.getElementById("move_echart");
  myChart.value = echarts.init(chartDom.value, "dark", {
    width: document.getElementById("e_demos").clientWidth,
    height: document.getElementById("e_demos").clientHeight / 2,
  });
  option.value = {
    title: {
      text: "动态",
      textStyle: {
        color: "black",
      },
    },
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
        label: {
          backgroundColor: "#283b56",
        },
      },
    },
    legend: {},
    xAxis: {
      type: "category",
      data: timeArr.value, // 把时间组成的数组接过来，放在x轴上
      boundaryGap: true,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        data: dataOne(),
        type: "line",
        name: "测试一",
        markPoint: {
          data: [
            { type: "max", name: "最大值" },
            { type: "min", name: "最小值" },
          ],
        },
        markLine: {
          data: [{ type: "average", name: "平均值" }],
        },
      },
      {
        data: dataTwo(),
        name: "测试二",
        type: "line",
        markPoint: {
          data: [
            { type: "max", name: "最大值" },
            { type: "min", name: "最小值" },
          ],
        },
        markLine: {
          data: [{ type: "average", name: "平均值" }],
        },
      },
    ],
  };
  myChart.value.setOption(option.value);
}
// 定时器，定时更新数据
function time() {
  let now = new Date();
  let res = [];
  let len = 5;
  while (len--) {
    timeArr.value.unshift(now.toLocaleTimeString().replace(/^\D*/, "")); // 转换时间，大家可以打印出来看一下
    now = new Date(+now - 2000); // 延迟几秒存储一次？
  }
}
function dataOne() {
  let res = [];
  let len = 5;
  while (len--) {
    res.push(Math.round(Math.random() * 1000));
  }
  return res;
}
function dataTwo() {
  let res = [];
  let len = 5;
  while (len--) {
    res.push(Math.round(Math.random() * 1000));
  }
  return res;
}
// 更新图表
function updateEcharts() {
  let nowTime = new Date().toLocaleTimeString().replace(/^\D*/, '');
  
}
</script>

<style lang="scss" scoped>
.echarts_box {
  width: 100%;
  height: 100%;
  .echart {
    width: 100%;
    height: 50%;
  }
}
</style>
