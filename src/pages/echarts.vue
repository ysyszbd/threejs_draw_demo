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
import * as echarts from "echarts/core";
import {
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  TransformComponent,
} from "echarts/components";

import { LineChart } from "echarts/charts";
import { LabelLayout, UniversalTransition } from "echarts/features";
import { CanvasRenderer } from "echarts/renderers";
import echartsData from "@/assets/demo_data/echarts_demo.json";
echarts.use([
  DatasetComponent,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  TransformComponent,
  LineChart,
  CanvasRenderer,
  LabelLayout,
  UniversalTransition,
]);
let chartDom = ref(null),
  myChart = ref(null),
  option;
onMounted(() => {
  initEcharts();
});
function initEcharts() {
  // debugger
  chartDom.value = document.getElementById("move_echart");
  myChart.value = echarts.init(chartDom.value, "dark", {
    width: 650,
    height: document.getElementById("e_demos").clientHeight / 2
  });
  // debugger
  run(echartsData);

}
function run(_rawData) {
  const countries = [
    "Finland",
    "France",
    "Germany",
    "Iceland",
    "Norway",
    "Poland",
    "Russia",
    "United Kingdom",
  ];
  const datasetWithFilters = [];
  const seriesList = [];
  echarts.util.each(countries, function (country) {
    var datasetId = "dataset_" + country;
    datasetWithFilters.push({
      id: datasetId,
      fromDatasetId: "dataset_raw",
      transform: {
        type: "filter",
        config: {
          and: [
            { dimension: "Year", gte: 1950 },
            { dimension: "Country", "=": country },
          ],
        },
      },
    });
    seriesList.push({
      type: "line",
      datasetId: datasetId,
      showSymbol: false,
      name: country,
      endLabel: {
        show: true,
        formatter: function (params) {
          return params.value[3] + ": " + params.value[0];
        },
      },
      labelLayout: {
        moveOverlap: "shiftY",
      },
      emphasis: {
        focus: "series",
      },
      encode: {
        x: "Year",
        y: "Income",
        label: ["Country", "Income"],
        itemName: "Year",
        tooltip: ["Income"],
      },
    });
  });
  option = {
    animationDuration: 10000,
    dataset: [
      {
        id: "dataset_raw",
        source: _rawData,
      },
      ...datasetWithFilters,
    ],
    title: {
      text: "Income of Germany and France since 1950",
    },
    tooltip: {
      order: "valueDesc",
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      nameLocation: "middle",
    },
    yAxis: {
      name: "Income",
    },
    grid: {
      right: 140,
    },
    series: seriesList,
  };
  myChart.value.setOption(option);
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
