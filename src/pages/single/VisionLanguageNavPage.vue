<template>
  <q-page padding>
    <div class="q-mb-md text-h5">单机控制 / 视觉语言导航</div>
    <DroneList style="width: 220px"/>
    <!-- 在这里使用新创建的LLM控制组件 -->
    <LlmControl />

    <!-- 这里可以放你的其他组件，例如 DroneControl -->
    <!-- <DroneControl class="q-mt-lg" /> -->

  </q-page>
</template>

<script setup>
// 导入你的新组件
import LlmControl from "components/LLMControl.vue";
import DroneList from "components/DroneList.vue";
</script>

<style scoped>
</style>
