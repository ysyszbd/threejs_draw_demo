<!--
 * @LastEditTime: 2024-03-09 13:19:18
 * @Description: 
-->
<template>
  <div class="echarts_box">
    <div id="move_echart" class="echart"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { init } from "echarts/core";

let chartDom = ref(null),
  myChart = ref(null),
  option;
onMounted(() => {
  initEcharts();
});
function initEcharts() {
  // debugger
  chartDom.value = document.getElementById("move_echart");
  const height = document.getElementById("e_demos").clientHeight / 2;
  myChart.value = init(chartDom.value, "dark", {
    width: 650,
    height,
  });
  myChart.value.setOption(option);
  // debugger
}
var base = +new Date(2014, 9, 3);
var oneDay = 24 * 3600 * 1000;
var date = [];
var data = [Math.random() * 150];
var now = new Date(base);
function addData(shift) {
  now = [now.getFullYear(), now.getMonth() + 1, now.getDate()].join("/");
  date.push(now);
  data.push((Math.random() - 0.4) * 10 + data[data.length - 1]);
  if (shift) {
    date.shift();
    data.shift();
  }
  now = new Date(+new Date(now) + oneDay);
}
for (var i = 1; i < 100; i++) {
  addData();
}
option = {
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: date,
  },
  yAxis: {
    boundaryGap: [0, "50%"],
    type: "value",
  },
  series: [
    {
      name: "成交",
      type: "line",
      smooth: true,
      symbol: "none",
      stack: "a",
      areaStyle: {
        normal: {},
      },
      data: data,
    },
  ],
};

setInterval(function () {
  addData(true);
  myChart.value.setOption({
    xAxis: {
      data: date,
    },
    series: [
      {
        name: "成交",
        data: data,
      },
    ],
  });
}, 500);
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
