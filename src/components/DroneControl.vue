<template>
  <div class="row q-pa-sm justify-between tech-control-panel">
    <!-- 左侧控制面板 -->
    <!-- <div class="column items-center">
      <div class="text-h6 text-left q-mb-sm self-start tech-text">无人机镜头</div>

      <div class="row q-pa-md items-center q-gutter-lg">

        <CompassControl class="q-mb-md"/>
        <div>
          <div class="row">
            <q-btn label="回正" color="primary" class="q-ma-xs tech-btn"/>
            <q-btn label="向下" color="primary" class="q-ma-xs tech-btn"/>
          </div>
          <div class="row">
            <q-btn label="录像" color="primary" class="q-ma-xs tech-btn"/>
            <q-btn label="拍照" color="primary" class="q-ma-xs tech-btn"/>
          </div>
        </div>

      </div>
    </div> -->

    <!-- 右侧控制面板 -->
    <div class="column items-center">

      <div class="row q-pa-md items-center q-gutter-lg">

        <CompassControl class="q-mb-md"
        @update="updateLeftJoystick" />

        <div class="column q-gutter-sm">
          <q-btn label="返航" color="primary" class="tech-btn"
            @click="sendCommand('go_home')"
            :disable="!droneStatus.isFlying"
          />

          <q-toggle
            v-model="rosControlEnabled"
            label="ROS控制"
            color="primary"
            class="q-mt-sm"
            :disable="joystickEnabled"
            @update:model-value="onRosControlChange"
          />
          <q-toggle
            v-model="joystickEnabled"
            label="启用摇杆"
            color="primary"
            class="q-mt-sm"
            :disable="rosControlEnabled"
            @update:model-value="onJoystickToggle"
          />
        </div>

        <CompassControl class="q-mb-md"
        @update="updateRightJoystick" />

      </div>

    </div>
  </div>

</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue' // 从 Vue 引入响应式和生命周期钩子
import { useDroneStore } from 'stores/drone' // 引入无人机数据存储
import { storeToRefs } from 'pinia'

import CompassControl from "./CompassControl.vue";

const droneStore = useDroneStore()

const { droneStatus } = storeToRefs(droneStore)
const { sendJoystickData, sendCommand } = droneStore

// 使用 ref 来存储摇杆的最新值
const leftJoystickValues = ref({ x: 0, y: 0 })
const rightJoystickValues = ref({ x: 0, y: 0 })

const rosControlEnabled = ref(false)
const joystickEnabled = ref(true)


// 定时器ID，用于周期性发送摇杆数据
let joystickInterval = null;

// 更新左摇杆值的回调函数
const updateLeftJoystick = (values) => {
  leftJoystickValues.value = values
}

// 更新右摇杆值的回调函数
const updateRightJoystick = (values) => {
  rightJoystickValues.value = values
}

// 页面挂载时启动定时器
onMounted(() => {
  joystickInterval = setInterval(() => {
    // left stick (虚拟摇杆的左侧): 高度(y) / 旋转(x) -> MSDK V5 的 right stick
    // right stick (虚拟摇杆的右侧): 前进(y) / 左右(x) -> MSDK V5 的 left stick
    sendJoystickData({
      left_stick_x: leftJoystickValues.value.x,
      left_stick_y: leftJoystickValues.value.y,
      right_stick_x: rightJoystickValues.value.x,
      right_stick_y: rightJoystickValues.value.y,
    })
  }, 100); // 每 100ms 发送一次 (10Hz)，这是实时控制的常用频率
});

// 页面卸载时清除定时器，避免内存泄漏
onUnmounted(() => {
  if (joystickInterval) {
    clearInterval(joystickInterval)
    joystickInterval = null; // 清除引用
  }
});

const onRosControlChange = (value) => {
  if (value) {
    sendCommand('enable_ros_control')
  } else {
    sendCommand('disable_ros_control')
  }
}

const onJoystickToggle = (value) => {
  if (value) {
    sendCommand('enable_vstick')
  } else {
    sendCommand('disable_vstick')
  }
}

</script>

<style scoped>
.tech-control-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border: 1px solid #4A90E2;
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(74, 144, 226, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transform: scale(0.8);
  transform-origin: bottom;
}

.tech-btn {
  background: linear-gradient(145deg, rgba(74, 144, 226, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid #4A90E2;
  color: #2C3E50;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-btn:hover {
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
  transform: translateY(-2px);
  background: linear-gradient(145deg, rgba(74, 144, 226, 0.2) 0%, rgba(255, 255, 255, 1) 100%);
}

.tech-btn:active {
  transform: translateY(0);
}
</style>

