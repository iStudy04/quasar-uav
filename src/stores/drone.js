// src/stores/drone.js
import {defineStore} from 'pinia'
import {ref, computed} from 'vue'
import {api} from 'boot/axios' // 引入Quasar的axios实例

// WebSocket 地址 - 与 single.html 保持一致
const WS_URL = `ws://127.0.0.1:8081/ws/control`
export const useDroneStore = defineStore('drone', () => {
  // --- State ---
  // 所有已连接的无人机列表，格式: [{ id, ip, name, ... }, ...]
  const droneList = ref([])
  // 当前用户在UI上选择的无人机ID
  const selectedDroneId = ref(null)
  // 后端通过WebSocket推送的原始遥测数据
  const rawTelemetry = ref({}) // 存储所有无人机的最新遥测数据，以ID为key
  // 系统日志
  const logMessages = ref([])
  // WebSocket实例
  let websocket = null

  // --- Getters (Computed Properties) ---

  // 当前选中的无人机对象
  const selectedDrone = computed(() => {
    if (!selectedDroneId.value || droneList.value.length === 0) {
      return null
    }
    return droneList.value.find(d => d.id === selectedDroneId.value)
  })

  // 当前选中的无人机的状态 (从 rawTelemetry 派生)
  const droneStatus = computed(() => {
    const telemetry = selectedDroneId.value ? rawTelemetry.value[selectedDroneId.value] : null;
    if (!selectedDrone.value || !telemetry) {
      return {
        isConnected: false,
        isFlying: false,
        battery: {percent: 0}, // 保持数据结构一致
        altitude: 0,
        latitude: 0,
        longitude: 0,
        speed: 0,
        heading: 0,
        // 保持与 fast-api 一致的字段名
        longtitude: 0,
        height: 0,
        head: 0,
      }
    }

    // MSDK v5 使用 height, speed, head, longtitude, latitude
    return {
      isConnected: true,
      isFlying: (telemetry.height || 0) > 0.8, // 根据高度判断是否在飞行
      battery: telemetry.battery_info?.batteries?.[0] || {percent: 0},
      altitude: telemetry.height || 0,
      latitude: telemetry.latitude || 0,
      longitude: telemetry.longtitude || 0,
      speed: telemetry.speed || 0,
      heading: telemetry.head || 0,
      // 原始字段也一并提供，方便组件直接使用
      ...telemetry,
    }
  })

  const isConnected = computed(() => !!selectedDrone.value)
  const batteryLevel = computed(() => droneStatus.value.battery?.percent.toFixed(2) || 0)

  // --- Actions (Methods) ---

  // 添加日志的辅助函数
  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    logMessages.value.unshift(`[${timestamp}] ${message}`); // unshift 在数组开头添加
    if (logMessages.value.length > 100) {
      logMessages.value.pop(); // 保持日志数量不超过100条
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  // 连接 WebSocket
  function connectWebSocket() {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      addLog("WebSocket 已连接，无需重复连接。", 'warn');
      return;
    }

    websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      addLog("WebSocket 连接成功。", 'success');
      // 连接成功后，可以主动请求一次无人机列表
      fetchClients();
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const clientId = message.client_id;

        // 根据消息类型处理数据
        if (message.type === "telemetry_update") {
          // 更新特定无人机的遥测数据
          rawTelemetry.value = {
            ...rawTelemetry.value,
            [clientId]: {
              ...rawTelemetry.value[clientId], // 保留旧数据
              ...message.telemetry // 覆盖新数据
            }
          }
        } else if (message.type === "battery_update") {
          // 更新电池信息到遥测数据中
          rawTelemetry.value = {
            ...rawTelemetry.value,
            [clientId]: {
              ...rawTelemetry.value[clientId],
              battery_info: message.battery_info
            }
          }
        } else if (message.type === "client_update") {
          addLog("收到客户端列表更新通知，正在刷新...");
          fetchClients(); // 列表有变动，重新获取
        }
      } catch (error) {
        addLog(`解析 WebSocket 消息失败: ${error}`, 'error');
      }
    };

    websocket.onerror = (event) => {
      addLog("WebSocket 发生错误。", 'error');
    };

    websocket.onclose = (event) => {
      addLog(`WebSocket 连接已关闭。代码: ${event.code}`, 'warn');
      websocket = null;
      // 可以在这里设置一个5秒后重连的逻辑
      setTimeout(connectWebSocket, 5000);
    };
  }

  // 通过 HTTP API 获取无人机列表
  async function fetchClients() {
    try {
      // 在Quasar中，api实例已经配置好了baseURL
      const response = await api.get('/api/clients');
      console.log("获取无人机列表成功:", response.data);
      droneList.value = response.data.clients || [];
      if (droneList.value.length > 0 && !selectedDroneId.value) {
        // 如果列表不为空且当前没有选中的无人机，则默认选中第一个
        selectedDroneId.value = droneList.value[0].id;
      }
      if (droneList.value.length === 0) {
        selectedDroneId.value = null;
      }
      addLog("成功获取无人机列表。");
    } catch (error) {
      addLog(`获取无人机列表失败: ${error.message}`, 'error');
      droneList.value = [];
      selectedDroneId.value = null;
    }
  }

  // 发送控制指令 (与 combined_script.js 的 sendCommand 类似)
  async function sendCommand(command, payload = {}) {
    console.log("发送控制指令", command, payload);
    const droneId = selectedDroneId.value;
    if (!droneId) {
      addLog("错误: 请先选择一个无人机！", 'error');
      return;
    }
    addLog(`向 ${droneId} 发送 '${command}' 指令...`);
    try {
      // 使用 Quasar 的 axios 实例
      const response = await api.post('/api/send-command', {
        client_id: droneId,
        command: command,
        ...payload // 可以传递额外的数据
      });
      addLog(`指令成功: ${response.data.message}`, 'success');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      addLog(`指令失败: ${errorMessage}`, 'error');
      throw error;
    }
  }

  let stopFlag = false;

  // 发送摇杆数据 (通过WebSocket)
  function sendJoystickData(data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    if (!selectedDroneId.value) return;

    const message = {
      client_id: selectedDroneId.value,
      payload: {
        command: "vstick",
        data: data
      }
    };

    if (message.payload.data.left_stick_x != 0 || message.payload.data.left_stick_y != 0 || message.payload.data.right_stick_x != 0 || message.payload.data.right_stick_y != 0) {
      websocket.send(JSON.stringify(message));
      stopFlag = true
    } else {
      if (stopFlag) {
        websocket.send(JSON.stringify(message));
        stopFlag = false
      }
    }

  }

  // 发送位置数据 (通过WebSocket)
  function sendPosition(data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    if (!selectedDroneId.value) return;

    const positionData = {
      client_id: selectedDroneId.value,
      payload: {
        type: 'position_control',
        x: parseFloat(data.x),
        y: parseFloat(data.y),
        z: parseFloat(data.z),
        yaw: parseFloat(data.yaw)
      }
    };
    websocket.send(JSON.stringify(positionData));
  }


  // 设置当前选中的无人机ID
  function selectDrone(droneId) {
    selectedDroneId.value = droneId;
    addLog(`已选择无人机: ${droneId}`);
  }

  const lastCalculatedPosition = ref({
    x: '',    // 相对坐标
    y: '',    // 相对坐标
    lat: '', // 存储真实纬度
    lng: ''  // 存储真实经度
  })

  const originPosition = ref({
    lat: '',
    lng: ''
  })

  function sendOrigin(data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    if (!selectedDroneId.value) return;
    if (data == '' || data.lat == '' || data.lng == '') return;

    const message = {
      client_id: 'all',
      payload: {
        command: 'set_ros_origin',
        lat: parseFloat(data.lat),
        lon: parseFloat(data.lng)
      }
    }
    console.log(message)
    websocket.send(JSON.stringify(message));
  }

  function sendTarget(data) {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
    if (!selectedDroneId.value) return;
    const message = {
      client_id: selectedDroneId.value,
      payload: {
        command: 'set_ros_target',
        x: parseFloat(data.y),
        y: parseFloat(data.x),
        z: 0,
      }
    }
    console.log(message)
    websocket.send(JSON.stringify(message));
  }

  return {
    // State
    droneList,
    selectedDroneId,
    rawTelemetry,
    logMessages,
    lastCalculatedPosition,
    originPosition,

    // Getters
    selectedDrone,
    droneStatus,
    isConnected,
    batteryLevel,

    // Actions
    addLog,
    connectWebSocket,
    fetchClients,
    sendCommand,
    sendJoystickData,
    selectDrone,
    sendPosition,
    sendOrigin,
    sendTarget,
  }
})
