// src/stores/drone.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const WS_BASE_URL = 'ws://localhost:8082/ws/control' // WebSocket 地址

export const useDroneStore = defineStore('drone', () => {
  // 当前连接的无人机ID
  const currentDroneId = ref(null)
  // 所有无人机列表
  const clients = ref([])

  // 后端返回的原始遥测数据
  const rawTelemetry = ref(null)

  // 当前无人机状态 (基于 rawTelemetry 从 clients 中派生并映射字段)
  const droneStatus = computed(() => {
    const telemetry = rawTelemetry.value

    // 当没有遥测数据时，返回一个默认的"未连接"状态对象
    if (!telemetry) {
      return {
        isConnected: false,
        isFlying: false,
        battery: 0,
        altitude: 0,
        latitude: 0,
        longitude: 0,
        speed: 0,
        heading: 0,
        address: '未知'
      }
    }

    // 如果后端没有直接提供 isFlying 状态，我们可以根据高度和速度进行推断
    // 例如，高度大于1米且速度大于0.1米/秒，则认为在飞行
    const inferredIsFlying = (telemetry.height > 1) && (telemetry.speed > 0.1)

    return {
      isConnected: true,
      // 优先使用后端提供的 isFlying 标志，如果不存在，则使用我们推断的状态
      isFlying: typeof telemetry.isFlying === 'boolean' ? telemetry.isFlying : inferredIsFlying,
      // 如果后端提供了 battery，则使用它，否则为 0
      battery: telemetry.battery || 0,
      altitude: telemetry.height || 0, // 映射后端 height 到前端 altitude
      latitude: telemetry.latitude || 0,
      longitude: telemetry.longtitude || 0, // 映射后端 longtitude 到前端 longitude
      speed: telemetry.speed || 0,
      heading: telemetry.head || 0, // 映射后端 head 到前端 heading
      // 如果后端提供了 address，则使用它，否则为 '未知'
      address: telemetry.address || '未知'
    }
  })

  // 云台状态 (暂未后端化，保持本地模拟)
  const gimbalStatus = ref({
    pitch: 0,
    yaw: 0,
    roll: 0
  })

  // 计算属性 (保持不变，因为它们现在依赖于 droneStatus.value)
  const isConnected = computed(() => droneStatus.value.isConnected)
  const isFlying = computed(() => droneStatus.value.isFlying)
  const batteryLevel = computed(() => droneStatus.value.battery)


  return {
    currentDroneId,
    clients,
    droneStatus,
    gimbalStatus,
    isConnected,
    isFlying,
    batteryLevel
  }
})
