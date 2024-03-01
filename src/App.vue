<!--
 * @LastEditTime: 2024-02-26 17:19:33
 * @Description: 
-->
<script setup>
import threeDemo from "./pages/three_demo.vue";
import mainPage from "./pages/main.vue"
</script>

<template>
  <div class="main_box">
    <mainPage />
    <!-- <threeDemo /> -->
  </div>
</template>

<style lang="scss" scoped>
@import "./src/style/index.scss";
body {
  margin: 0;
}
.boxs {
  width: 100vw;
  height: 100vh;
}

</style>
