<template>
  <q-card bordered class="tech-card q-pa-sm q-gutter-md">
    <!-- 标题 -->
    <div class="text-subtitle1 text-weight-bold tech-text">设备状态</div>

    <!-- 控制状态 -->
    <q-input filled dense label="遥控状态" v-model="controlStatus" readonly class="tech-input" />

    <!-- 设备信息 -->
    <div class="row items-center q-mt-sm">
      <q-avatar size="40px" class="q-mr-sm tech-avatar">
        <q-icon name="airplanemode_active" size="32px" color="blue" class="tech-icon" />
      </q-avatar>
      <div>
        <div class="text-subtitle2 text-weight-medium tech-text">{{ droneName }}</div>
        <div class="text-caption text-grey-6 tech-text-secondary">● {{ mode }}</div>
      </div>
    </div>

    <!-- 控制按钮 -->
    <div class="row q-gutter-sm q-mt-sm">
      <q-btn label="飞行控制" outline color="primary" icon="flight" @click="flightControl" class="tech-btn"/>
      <q-btn label="一键起飞" flat color="primary" class="tech-btn" />
    </div>

    <!-- 起飞参数 -->
    <div class="tech-separator"></div>
    <div class="text-subtitle2 q-mt-sm tech-text">起飞参数</div>

    <div class="row q-col-gutter-sm">
      <q-input filled dense v-model="altitudeSafe" label="安全离场高 (ALT)" type="number" suffix="m" class="col-6 tech-input" />
      <q-input filled dense v-model="altitudeAGL" label="飞行作业高 (AGL)" type="number" suffix="m" class="col-6 tech-input" />
    </div>
    <div class="row q-col-gutter-sm q-mt-xs">
      <q-input filled dense v-model="altitudeReturn" label="返航高 (ALT)" type="number" suffix="m" class="col-6 tech-input" />
      <q-select
        filled dense
        v-model="failsafeAction"
        :options="['返航', '悬停', '降落']"
        label="失联作业"
        class="col-6 tech-input"
      />
    </div>

    <!-- 状态信息 -->
    <div class="tech-separator"></div>
    <div class="row items-center justify-around q-mt-md">
      <div class="column items-center">
        <q-icon name="network_check" color="blue-5" size="24px" class="tech-icon" />
        <div class="text-caption tech-text">{{ gpsQuality }}</div>
        <div class="text-caption text-grey tech-text-secondary">搜星质量</div>
      </div>

      <div class="column items-center">
        <q-icon name="battery_std" color="green-5" size="24px" class="tech-icon" />
        <div class="text-caption tech-text">{{ batteryLevel }}%</div>
        <div class="text-caption text-grey tech-text-secondary">电池电量</div>
      </div>

      <div class="column items-center">
        <q-icon name="trending_flat" color="teal-6" size="24px" class="tech-icon" />
        <div class="text-caption tech-text">{{ horizontalSpeed }} m/s</div>
        <div class="text-caption text-grey tech-text-secondary">水平速度</div>
      </div>

      <div class="column items-center">
        <q-icon name="height" color="purple" size="24px" class="tech-icon" />
        <div class="text-caption tech-text">{{ relativeHeight }} m</div>
        <div class="text-caption text-grey tech-text-secondary">相对高度</div>
      </div>
    </div>
    <div class="tech-separator"></div>

    <CameraView />

  </q-card>
</template>

<script setup>
import { ref } from 'vue'
import CameraView from "components/CameraView.vue";
import {useLayoutStore} from "stores/layout-store.js";

const controlStatus = ref('远程控制中')
const droneName = 'Mavic 3'
const mode = '手动控制中'

const altitudeSafe = ref(50)
const altitudeAGL = ref(100)
const altitudeReturn = ref(100)
const failsafeAction = ref('返航')

const gpsQuality = ref('33')
const batteryLevel = ref(25)
const horizontalSpeed = ref(0.0)
const relativeHeight = ref(10.9)

const $layoutStore = useLayoutStore()

function flightControl(){
  $layoutStore.controlPanelShow = !$layoutStore.controlPanelShow
}
</script>

<style scoped>
.tech-avatar {
  box-shadow: 0 0 15px rgba(74, 144, 226, 0.3);
}

.tech-text {
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-text-secondary {
  color: #4A90E2;
  text-shadow: 0 0 5px rgba(74, 144, 226, 0.2);
}

.tech-icon {
  text-shadow: 0 0 8px rgba(74, 144, 226, 0.3);
}
</style>
