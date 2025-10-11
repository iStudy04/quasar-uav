<template>
  <q-card class="llm-control-card" flat bordered>
    <q-card-section>
      <div class="text-h6">自然语言指令 (AI)</div>
    </q-card-section>

    <q-card-section class="q-pt-none">
      <q-input
        v-model="llmPrompt"
        filled
        type="textarea"
        rows="3"
        placeholder="例如：向前飞10米，或以2m/s的速度向左飞3秒"
        @keydown.enter.prevent="sendLlmCommand"
      />
    </q-card-section>

    <q-card-actions align="between" class="q-px-md q-pb-md">
      <div class="llm-status row items-center">
        <span>解析结果: </span>
        <code class="q-ml-sm">{{ llmOutput }}</code>
      </div>
      <q-btn
        label="发送指令"
        color="primary"
        unelevated
        :loading="isProcessing"
        :disable="isProcessing"
        @click="sendLlmCommand"
      >
        <template v-slot:loading>
          <q-spinner-dots />
        </template>
      </q-btn>
    </q-card-actions>
  </q-card>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useDroneStore } from 'stores/drone';

// --- Quasar and Pinia Setup ---
const $q = useQuasar();
const droneStore = useDroneStore();
// 从 store 中解构出需要的函数
const { sendPosition, sendJoystickData } = droneStore;

// --- Component State ---
const llmPrompt = ref('');
const llmOutput = ref('等待输入...');
const isProcessing = ref(false);

// 用于存储速度指令的定时器ID
// 不需要是 ref，因为它不直接驱动模板更新
let velocityInterval = null;

// --- Core Logic ---

/**
 * 执行从LLM解析出的无人机指令
 * @param {string} commandString - AI返回的指令字符串, e.g., "p 10 0 0 0 0" or "v 0 2 0 0 3"
 */
function executeDroneCommand(commandString) {
  // 停止任何正在进行的速度指令
  if (velocityInterval) {
    clearInterval(velocityInterval);
    velocityInterval = null;
    // 发送零速指令以确保无人机立即停止
    sendJoystickData({ left_stick_x: 0, left_stick_y: 0, right_stick_x: 0, right_stick_y: 0 });
    $q.notify({ type: 'info', message: '已停止之前的速度指令。' });
  }

  const parts = commandString.trim().split(/\s+/);
  if (parts.length !== 6) {
    const errorMsg = `AI返回的指令格式不正确: "${commandString}"`;
    $q.notify({ type: 'negative', message: errorMsg });
    console.error(errorMsg);
    return;
  }

  const [type, xStr, yStr, zStr, yawStr, timeStr] = parts;
  const x = parseFloat(xStr);
  const y = parseFloat(yStr);
  const z = parseFloat(zStr);
  const yaw = parseFloat(yawStr);
  const time = parseFloat(timeStr);

  if (type === 'p') {
    // 执行位置指令
    $q.notify({
      type: 'positive',
      icon: 'flight_takeoff',
      message: `执行位置指令: X=${x}m, Y=${y}m, Z=${z}m, Yaw=${yaw}°`
    });
    // 调用 store 中的 sendPosition 方法
    sendPosition({ x, y, z, yaw });

  } else if (type === 'v') {
    // 执行速度指令
    const duration = time * 1000; // 转换为毫秒
    if (isNaN(duration) || duration <= 0) {
      const errorMsg = `AI返回的速度指令持续时间无效: ${time}s`;
      $q.notify({ type: 'negative', message: errorMsg });
      console.error(errorMsg);
      return;
    }

    $q.notify({
      type: 'positive',
      icon: 'fast_forward',
      message: `执行速度指令: Vx=${x}, Vy=${y}, Vz=${z}, Vw=${yaw}，持续 ${time} 秒`
    });

    // 根据 DroneControl.vue 的摇杆映射:
    // right stick (前进/后退, 左/右) -> left_stick_y, left_stick_x
    // left stick (升/降, 左/右转) -> right_stick_y, right_stick_x
    // 假设 AI 的 x, y, z, yaw 分别对应前进、右移、上升、右转
    // 注意：这里的映射关系需要与你的MSDK后端和AI模型的输出定义完全匹配。
    // 我们将遵循你提供的 JS 示例中的映射关系：
    // x -> left_stick_x
    // y -> left_stick_y
    // z -> right_stick_y
    // yaw -> right_stick_x
    const joystickPayload = {
      left_stick_x: y, // 通常y是左右，映射到left_stick_x
      left_stick_y: x, // 通常x是前后，映射到left_stick_y
      right_stick_x: yaw,
      right_stick_y: z
    };

    // 每 100ms 发送一次速度指令
    velocityInterval = setInterval(() => {
      sendJoystickData(joystickPayload);
    }, 100);

    // 在指定时间后停止
    setTimeout(() => {
      if (velocityInterval) { // 检查定时器是否仍然存在
        clearInterval(velocityInterval);
        velocityInterval = null;
        // 发送零速指令以确保无人机停止
        sendJoystickData({ left_stick_x: 0, left_stick_y: 0, right_stick_x: 0, right_stick_y: 0 });
        $q.notify({
          type: 'info',
          icon: 'check_circle',
          message: `AI速度指令执行完毕 (${time}秒)。`
        });
      }
    }, duration);

  } else {
    const errorMsg = `未知的AI指令类型: "${type}"`;
    $q.notify({ type: 'negative', message: errorMsg });
    console.error(errorMsg);
  }
}


/**
 * 发送自然语言指令到后端API
 */
async function sendLlmCommand() {
  const prompt = llmPrompt.value.trim();
  if (!prompt) {
    $q.notify({ type: 'warning', message: '请输入指令！' });
    return;
  }

  isProcessing.value = true;
  llmOutput.value = '处理中...';

  try {
    const response = await fetch('/api/process-llm-command', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: prompt })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || `HTTP error ${response.status}`);
    }

    const result = await response.json();
    const command = result.command;

    llmOutput.value = command;
    $q.notify({ type: 'info', message: `AI解析成功: ${command}` });

    // 执行解析后的指令
    executeDroneCommand(command);

  } catch (error) {
    console.error('LLM command failed:', error);
    llmOutput.value = '错误！';
    $q.notify({
      type: 'negative',
      message: `AI指令处理失败: ${error.message}`
    });
  } finally {
    isProcessing.value = false;
  }
}

// --- Lifecycle Hook ---

// 当组件被卸载时，确保清除任何正在运行的定时器，防止内存泄漏和意外行为
onUnmounted(() => {
  if (velocityInterval) {
    clearInterval(velocityInterval);
    velocityInterval = null;
    // 也可以在这里发送一个停止指令，以防万一
    sendJoystickData({ left_stick_x: 0, left_stick_y: 0, right_stick_x: 0, right_stick_y: 0 });
    console.log('LLM control component unmounted, velocity interval cleared.');
  }
});
</script>

<style scoped>
.llm-control-card {
  max-width: 500px;
  margin: auto;
}

.llm-status {
  color: #666;
  font-size: 0.9em;
}

.llm-status code {
  background-color: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
  color: #333;
  font-weight: bold;
}
</style>
