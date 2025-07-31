<template>
  <div class="row q-pa-sm justify-between tech-control-panel">
    <div>
      <q-tabs
        v-model="tab"
        dense
        class="text-grey"
        active-color="primary"
        indicator-color="primary"
        align="justify"
        narrow-indicator
      >
        <q-tab name="joystick" label="摇杆控制"/>
        <q-tab name="position" label="坐标控制"/>
        <q-tab name="point" label="打点控制"/>
      </q-tabs>

      <q-separator/>

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="joystick">
          <div class="column items-center">
            <div class="row q-pa-md items-center q-gutter-lg">
              <CompassControl class="q-mb-md"
                              @update="updateLeftJoystick"/>

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
                  @update:model-value="onRosControlChange"
                />
                <q-toggle
                  v-model="joystickEnabled"
                  label="启用摇杆"
                  color="primary"
                  class="q-mt-sm"
                  @update:model-value="onJoystickToggle"
                />
              </div>

              <CompassControl
                class="q-mb-md"
                @update="updateRightJoystick"
              />

            </div>

          </div>
        </q-tab-panel>

        <q-tab-panel name="position">
          <div class="q-pa-xs" style="max-width: 400px;">
            <!-- 输入框区域 -->
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <q-input v-model.number="pos.x" label="X (m)" filled dense/>
              </div>
              <div class="col-6">
                <q-input v-model.number="pos.y" label="Y (m)" filled/>
              </div>
              <div class="col-6">
                <q-input v-model.number="pos.z" label="Z (m)" filled/>
              </div>
              <div class="col-6">
                <q-input v-model.number="pos.yaw" label="Yaw (°)" filled/>
              </div>
            </div>

            <!-- 按钮区域 -->
            <div class="row justify-between q-mt-sm">
              <q-btn
                class="tech-btn"
                label="发送位置指令"
                color="primary"
                :loading="isSending"
                @click="sendPositionCommand(pos)"
              />
              <q-btn
                class="tech-btn"
                label="重置"
                color="secondary"
                flat
                @click="onReset"/>
            </div>
          </div>
        </q-tab-panel>

        <q-tab-panel name="point">
          <div class="row items-center justify-around q-mt-sm">
            <q-btn
              class="tech-btn"
              label="前往目标点"
              color="primary"
              @click="sendTargetCommand"/>
            <q-btn
              class="tech-btn"
              label="设置原点坐标"
              color="secondary"
              @click="sendOriginCommand"/>
          </div>
        </q-tab-panel>
      </q-tab-panels>
    </div>
  </div>

</template>
<script setup>
import {ref, onMounted, onUnmounted} from 'vue' // 从 Vue 引入响应式和生命周期钩子
import {useDroneStore} from 'stores/drone' // 引入无人机数据存储
import {storeToRefs} from 'pinia'

import CompassControl from "./CompassControl.vue";
import { Notify } from 'quasar'

const droneStore = useDroneStore()

const {droneStatus} = storeToRefs(droneStore)
const {sendJoystickData, sendCommand, sendPosition, sendTarget} = droneStore

const tab = ref("joystick")

// 使用 ref 来存储摇杆的最新值
const leftJoystickValues = ref({x: 0, y: 0})
const rightJoystickValues = ref({x: 0, y: 0})

const rosControlEnabled = ref(false)
const joystickEnabled = ref(false)


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
      left_stick_x: rightJoystickValues.value.x,
      left_stick_y: rightJoystickValues.value.y,
      right_stick_x: leftJoystickValues.value.x,
      right_stick_y: leftJoystickValues.value.y,
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

// 相对坐标控制
const pos = ref({
  x: 0,
  y: 0,
  z: 0,
  yaw: 0
})

const isSending = ref(false)

function sendPositionCommand(pos) {
  sendPosition(pos)
  isSending.value=true
  setTimeout(()=>isSending.value = false, 1000)
}

function onReset(){
  pos.value.x = 0
  pos.value.y = 0
  pos.value.z = 0
  pos.value.yaw = 0
}


// 地图打点控制
const {lastCalculatedPosition, originPosition, sendOrigin} = useDroneStore()

function sendOriginCommand(){
  console.log(lastCalculatedPosition)
  originPosition.lng = lastCalculatedPosition.lng
  originPosition.lat = lastCalculatedPosition.lat
  sendOrigin(originPosition)
}

function sendTargetCommand(){
  if(lastCalculatedPosition.lng == '' || lastCalculatedPosition.lng == ''){
    Notify.create('请先打点!')
  }
  sendTarget(lastCalculatedPosition)
}



</script>

<style scoped>
.tech-control-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border: 1px solid #4A90E2;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(74, 144, 226, 0.15),
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

