<template>
  <q-page class="tech-page">
    <div class="tech-grid" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: -1;"></div>
    <MapView/>
    <!-- 浮动控制面板按钮 -->
    <q-page-sticky position="top-left" :offset="[18, 18]">
      <DroneList style="width: 220px"/>
    </q-page-sticky>
    <q-page-sticky position="right">
      <DroneStatus style="width: 300px"/>
    </q-page-sticky>
    <q-page-sticky position="bottom" :offset="[18, 18]">
      <DroneControl v-show="$layoutStore.controlPanelShow"/>
    </q-page-sticky>
  </q-page>
</template>

<script setup>
import DroneList from "components/DroneList.vue";
import MapView from "components/MapView.vue";
import DroneStatus from "components/DroneStatus.vue";
import DroneControl from "components/DroneControl.vue";
import {useLayoutStore} from "stores/layout-store.js";

const $layoutStore = useLayoutStore()

</script>

<style scoped>
.tech-page {
  background: transparent;
  position: relative;
}
</style>
