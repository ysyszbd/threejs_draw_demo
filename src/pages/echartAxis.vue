<!--
 * @LastEditTime: 2024-03-20 18:34:07
 * @Description: 
-->
<template>
  <div class="axis_box">
    <div id="axis_echart" class="axis"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import * as echarts from "echarts/core";
import { GridComponent } from "echarts/components";
import { LineChart } from "echarts/charts";
import { UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([GridComponent, LineChart, CanvasRenderer, UniversalTransition]);

let chartDom = ref(),
  myChart = ref(),
  option,
  base = +new Date(2014, 9, 3),
  data = ref([Math.random() * 150]),
  now = ref(new Date(base)),
  date = ref([]),
  oneDay = 24 * 3600 * 1000;

onMounted(() => {
  chartDom.value = document.getElementById("axis_echart");
  myChart.value = echarts.init(chartDom.value, "light", {
    width: document.getElementById("e_demos").clientWidth,
    height: (document.getElementById("e_demos").clientHeight - 20) / 2,
  });
  myChart.value.setOption(option);
});
function addData(shift) {
  now.value = [now.value.getFullYear(), now.value.getMonth() + 1, now.value.getDate()].join("/");
  date.value.push(now.value);
  data.value.push((Math.random() - 0.4) * 10 + data.value[data.value.length - 1]);
  if (shift) {
    date.value.shift();
    data.value.shift();
  }
  now.value = new Date(+new Date(now.value) + oneDay);
}
for (var i = 1; i < 100; i++) {
  addData();
}
option = {
  xAxis: {
    type: "category",
    boundaryGap: false,
    data: date.value,
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
      data: data.value,
    },
  ],
};
setInterval(function () {
  addData(true);
  myChart.value.setOption({
    xAxis: {
      data: date.value,
    },
    series: [
      {
        name: "成交",
        data: data.value,
      },
    ],
  });
}, 500);
</script>

<style lang="scss" scoped>
.axis_box {
  width: 100%;
  height: 100%;
  .axis {
    width: 100%;
    height: 50%;
  }
}
</style>
