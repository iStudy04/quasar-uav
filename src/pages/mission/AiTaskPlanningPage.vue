<template>
  <q-page class="ai-task-planning-page">
    <div class="page-container">
      <!-- 左侧：对话区域 -->
      <div class="chat-section">
        <div class="chat-header">
          <div class="header-title">
            <q-icon name="smart_toy" size="28px" class="q-mr-sm" />
            <div>
              <div class="title-text">AI 任务规划助手</div>
              <div class="subtitle-text">通过对话方式规划无人机任务</div>
            </div>
          </div>
          <q-btn
            flat
            round
            icon="refresh"
            @click="clearChat"
            size="sm"
            class="clear-btn"
          >
            <q-tooltip>清空对话</q-tooltip>
          </q-btn>
        </div>

        <!-- 消息列表 -->
        <div class="messages-container" ref="messagesContainer">
          <div v-if="messages.length === 0" class="empty-state">
            <q-icon name="chat_bubble_outline" size="64px" color="grey-5" />
            <p class="empty-text">开始对话，规划您的无人机任务</p>
            <div class="example-prompts">
              <div class="example-title">示例提示：</div>
              <q-chip
                v-for="(example, idx) in examplePrompts"
                :key="idx"
                clickable
                @click="sendMessage(example)"
                color="primary"
                text-color="white"
                class="example-chip"
              >
                {{ example }}
              </q-chip>
            </div>
          </div>

          <div
            v-for="(msg, index) in messages"
            :key="index"
            :class="['message', msg.role]"
          >
            <div class="message-avatar">
              <q-icon
                :name="msg.role === 'user' ? 'person' : 'smart_toy'"
                size="24px"
              />
            </div>
            <div class="message-content">
              <div class="message-text">{{ msg.content }}</div>
              <div v-if="msg.taskPlan" class="task-plan-card">
                <div class="plan-header">
                  <q-icon name="task_alt" class="q-mr-xs" />
                  任务规划
                </div>
                <div class="plan-content">
                  <div class="plan-item">
                    <span class="plan-label">任务描述：</span>
                    <span class="plan-value">{{ msg.taskPlan.description }}</span>
                  </div>
                  <div class="plan-item">
                    <span class="plan-label">无人机数量：</span>
                    <span class="plan-value">{{ msg.taskPlan.droneCount }} 架</span>
                  </div>
                  <div class="plan-item">
                    <span class="plan-label">起始点：</span>
                    <span class="plan-value">{{ msg.taskPlan.startPoint }}</span>
                  </div>
                  <div
                    v-if="msg.taskPlan.startPointCoordinates"
                    class="plan-item"
                  >
                    <span class="plan-label">起点经纬度：</span>
                    <span class="plan-value">{{ formatCoordinates(msg.taskPlan.startPointCoordinates) }}</span>
                  </div>
                  <div class="plan-item">
                    <span class="plan-label">目标点：</span>
                    <span class="plan-value">{{ msg.taskPlan.targetPoint }}</span>
                  </div>
                  <div
                    v-if="msg.taskPlan.targetPointCoordinates"
                    class="plan-item"
                  >
                    <span class="plan-label">终点经纬度：</span>
                    <span class="plan-value">{{ formatCoordinates(msg.taskPlan.targetPointCoordinates) }}</span>
                  </div>
                  <div v-if="msg.taskPlan.area" class="plan-item">
                    <span class="plan-label">巡逻区域：</span>
                    <span class="plan-value">{{ msg.taskPlan.area }}</span>
                  </div>
                  <div v-if="msg.taskPlan.altitude" class="plan-item">
                    <span class="plan-label">飞行高度：</span>
                    <span class="plan-value">{{ msg.taskPlan.altitude }} 米</span>
                  </div>
                  <div v-if="msg.taskPlan.speed" class="plan-item">
                    <span class="plan-label">飞行速度：</span>
                    <span class="plan-value">{{ msg.taskPlan.speed }} m/s</span>
                  </div>
                </div>
                <div class="plan-actions">
                  <q-btn
                    flat
                    dense
                    icon="check_circle"
                    label="确认执行"
                    color="positive"
                    size="sm"
                    @click="confirmTask(msg.taskPlan)"
                  />
                  <q-btn
                    flat
                    dense
                    icon="edit"
                    label="修改"
                    color="primary"
                    size="sm"
                    @click="modifyTask(msg.taskPlan)"
                  />
                </div>
              </div>
              <div class="message-time">{{ msg.timestamp }}</div>
            </div>
          </div>

          <div v-if="isLoading" class="message assistant">
            <div class="message-avatar">
              <q-icon name="smart_toy" size="24px" />
            </div>
            <div class="message-content">
              <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区域 -->
        <div class="input-section">
          <q-input
            v-model="userInput"
            placeholder="描述您的任务需求，例如：5架无人机从机场起飞，巡逻森林区域..."
            outlined
            dense
            autogrow
            :max-height="100"
            @keyup.enter.exact="handleSend"
            class="message-input"
          >
            <template v-slot:append>
              <q-btn
                round
                dense
                flat
                icon="send"
                @click="handleSend"
                :disable="!userInput.trim() || isLoading"
                color="primary"
              />
            </template>
          </q-input>
          <div class="input-hint">
            按 Enter 发送，Shift + Enter 换行
          </div>
        </div>
      </div>

      <!-- 右侧：任务预览 -->
      <div class="preview-section">
        <div class="preview-header">
          <q-icon name="preview" size="24px" class="q-mr-sm" />
          <span>当前任务预览</span>
        </div>
        <div class="preview-content">
          <div v-if="currentTask" class="current-task">
            <div class="task-summary">
              <div class="summary-item">
                <q-icon name="flight_takeoff" color="primary" />
                <div class="summary-text">
                  <div class="summary-label">任务类型</div>
                  <div class="summary-value">{{ currentTask.description }}</div>
                </div>
              </div>
              <div class="summary-item">
                <q-icon name="precision_manufacturing" color="orange" />
                <div class="summary-text">
                  <div class="summary-label">无人机</div>
                  <div class="summary-value">{{ currentTask.droneCount }} 架</div>
                </div>
              </div>
              <div class="summary-item">
                <q-icon name="location_on" color="red" />
                <div class="summary-text">
                  <div class="summary-label">起点 → 终点</div>
                  <div class="summary-value">{{ currentTask.startPoint }} → {{ currentTask.targetPoint }}</div>
                </div>
              </div>
            </div>

            <q-separator class="q-my-md" />

            <div class="task-details">
              <div class="detail-title">任务详情</div>
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">起点坐标</span>
                  <span class="detail-value">{{ formatCoordinates(currentTask.startPointCoordinates) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">终点坐标</span>
                  <span class="detail-value">{{ formatCoordinates(currentTask.targetPointCoordinates) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">飞行高度</span>
                  <span class="detail-value">{{ currentTask.altitude || '未设置' }} {{ currentTask.altitude ? '米' : '' }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">飞行速度</span>
                  <span class="detail-value">{{ currentTask.speed || '未设置' }} {{ currentTask.speed ? 'm/s' : '' }}</span>
                </div>
                <div v-if="currentTask.area" class="detail-item full-width">
                  <span class="detail-label">巡逻区域</span>
                  <span class="detail-value">{{ currentTask.area }}</span>
                </div>
              </div>
            </div>

            <div class="task-json">
              <div class="json-header">
                <span>JSON 格式</span>
                <q-btn
                  flat
                  dense
                  size="sm"
                  icon="content_copy"
                  @click="copyJson"
                >
                  <q-tooltip>复制 JSON</q-tooltip>
                </q-btn>
              </div>
              <pre class="json-content">{{ JSON.stringify(currentTask, null, 2) }}</pre>
            </div>
          </div>

          <div v-else class="no-task">
            <q-icon name="assignment" size="80px" color="grey-4" />
            <p>暂无任务规划</p>
            <p class="hint-text">通过左侧对话创建任务</p>
          </div>
        </div>
      </div>
    </div>


  </q-page>
</template>

<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMissionStore } from 'src/stores/mission'

const $q = useQuasar()
const router = useRouter()
const missionStore = useMissionStore()

// 消息列表
const messages = ref([])
const userInput = ref('')
const isLoading = ref(false)
const messagesContainer = ref(null)

// 当前任务
const currentTask = ref(null)

// 校园点位数据
const campusPoints = ref([])
const campusPointsLoading = ref(false)
const campusPointsLoaded = ref(false)
const campusPointsError = ref(null)
let campusPointsPromise = null


// 系统提示词 - 严格控制输出格式
// 找到 BASE_SYSTEM_PROMPT 变量，修改输出格式部分

const BASE_SYSTEM_PROMPT = `你是一个专业的无人机任务规划助手... (省略前面部分)
## 任务信息提取规则
... (保留原有规则)
- **途经点**: 如果用户要求经过特定地点（如"去东门，途经西操场"），提取为途经点数组。

## 输出格式（严格遵守）
...
\`\`\`json
{
  "description": "任务类型描述",
  "droneCount": 数字,
  "startPoint": "起始点名称",
  "targetPoint": "目标点名称",
  "waypoints": ["途经点名称1", "途经点名称2"], // 新增：途经点名称数组
  "area": "巡逻区域描述或null",
  "altitude": 数字,
  "speed": 数字,
  "startPointCoordinates": { "latitude": 数字, "longitude": 数字 },
  "targetPointCoordinates": { "latitude": 数字, "longitude": 数字 }
}
## 核心规则
1. 你必须始终以 JSON 格式输出任务规划
2. 在 JSON 之前，你可以用自然语言简短回复用户（1-2句话）
3. JSON 必须包含在 \`\`\`json 和 \`\`\` 代码块中
4. 如果信息不完整，询问用户并给出默认值

## 任务信息提取规则
- **无人机数量**: 从用户输入中提取数字，默认为 1
- **起始点**: 提取地点名称，默认为 "起飞点"
- **目标点**: 提取目标地点，默认为 "目标区域"
- **任务类型**: 识别关键词（巡逻/搜索/运输/侦察），默认为 "飞行任务"
- **巡逻区域**: 提取范围描述，如果没有则为 null
- **飞行高度**: 默认 50 米
- **飞行速度**: 默认 5 m/s
- **经纬度约束**: 你只能使用系统提供的校园点位列表中的经纬度信息。任何 JSON 输出中的坐标都必须完全匹配该列表。


## 示例对话

用户: "5架无人机从普渡大学机场起飞，协同巡逻5公里范围内的所有森林区域"
助手: 好的，我已经为您规划了巡逻任务。5架无人机将从普渡大学机场起飞，在5公里范围内的森林区域进行协同巡逻。

\`\`\`json
{
  "description": "协同巡逻任务",
  "droneCount": 5,
  "startPoint": "普渡大学机场",
  "targetPoint": "森林区域",
  "area": "5公里范围森林区域",
  "altitude": 50,
  "speed": 5,
  "startPointCoordinates": { "latitude": 40.41501, "longitude": -86.9369 },
  "targetPointCoordinates": { "latitude": 40.50123, "longitude": -86.81234 }
}
\`\`\`

用户: "我要巡逻"
助手: 收到巡逻任务需求。请问需要多少架无人机？从哪里起飞？我先为您生成一个默认方案：

\`\`\`json
{
  "description": "巡逻任务",
  "droneCount": 1,
  "startPoint": "起飞点",
  "targetPoint": "巡逻区域",
  "area": null,
  "altitude": 50,
  "speed": 5,
  "startPointCoordinates": { "latitude": 40.0, "longitude": -86.0 },
  "targetPointCoordinates": { "latitude": 40.0, "longitude": -86.0 }
}
\`\`\`

用户: "我有5架飞机"
助手: 明白了，已更新为5架无人机执行巡逻任务。

\`\`\`json
{
  "description": "巡逻任务",
  "droneCount": 5,
  "startPoint": "起飞点",
  "targetPoint": "巡逻区域",
  "area": null,
  "altitude": 50,
  "speed": 5,
  "startPointCoordinates": { "latitude": 40.0, "longitude": -86.0 },
  "targetPointCoordinates": { "latitude": 40.0, "longitude": -86.0 }
}
\`\`\`

## 重要提醒
- 每次回复都必须包含完整的 JSON
- JSON 必须是有效的格式，可以被 JSON.parse() 解析
- 数字字段不要加引号
- null 值不要加引号
- startPoint 和 targetPoint 名称必须与坐标所引用的校园点位一致
- 经纬度必须来自系统提供的校园点位列表，不得自创或猜测
- 如果用户请求的地点不在列表中，先澄清后再生成任务
- 保持对话连贯，记住之前的上下文`

const campusPointSummary = computed(() => {
  if (!campusPoints.value.length) {
    return ''
  }
  return campusPoints.value
    .map((point, index) => `${index + 1}. ${point.name} | latitude: ${point.latitude} | longitude: ${point.longitude}`)
    .join('\n')
})

function buildSystemPrompt() {
  if (!campusPoints.value.length) {
    return BASE_SYSTEM_PROMPT
  }

  return `${BASE_SYSTEM_PROMPT}

## 校园点位信息（仅可使用以下经纬度）
${campusPointSummary.value}

- JSON 中的 startPointCoordinates 和 targetPointCoordinates 必须严格引用上述经纬度。
- 当用户提出未在列表中的地点时，请引导其选择最近的有效点位或声明无法生成任务。`
}

// 示例提示
const examplePrompts = [
  '5架无人机巡逻森林',
  '从机场到目标点',
  '3架无人机协同搜索'
]

async function fetchCampusPoints() {
  campusPointsLoading.value = true
  campusPointsError.value = null
  try {
    const headers = {
      'Content-Type': 'application/json'
    }
    const token = localStorage.getItem('auth_token')
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    const response = await fetch('/api/campus-points', {
      method: 'GET',
      headers
    })
    const rawText = await response.text()
    let payload = {}
    if (rawText) {
      try {
        payload = JSON.parse(rawText)
      } catch (parseError) {
        console.error('校园点位 JSON 解析失败:', parseError)
      }
    }
    if (!response.ok) {
      const detail = payload?.detail || response.statusText || '获取校园点位失败'
      throw new Error(detail)
    }

    const rawPoints = Array.isArray(payload?.points) ? payload.points : []
    const normalizedPoints = rawPoints
      .map((point, index) => normalizeCampusPoint(point, index))
      .filter(Boolean)

    campusPoints.value = normalizedPoints
    campusPointsLoaded.value = true
    return normalizedPoints
  } catch (error) {
    campusPointsError.value = error
    campusPointsLoaded.value = false
    throw error
  } finally {
    campusPointsLoading.value = false
  }
}

function normalizeCampusPoint(point, index) {
  if (!point) {
    return null
  }
  const latCandidate = point.latitude ?? point.lat ?? point.latDeg ?? point.y ?? point.Latitude
  const lngCandidate = point.longitude ?? point.lng ?? point.lon ?? point.long ?? point.x ?? point.Longitude
  const latitude = Number(latCandidate)
  const longitude = Number(lngCandidate)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  const name = point.name || point.label || point.title || `点位${index + 1}`
  const id = point.id || point.uuid || point.code || name || `point-${index + 1}`
  return {
    id,
    name,
    latitude,
    longitude,
    raw: point
  }
}

function normalizeCoordinates(coords) {
  if (!coords) {
    return null
  }
  const latitude = Number(coords.latitude ?? coords.lat ?? coords.Latitude ?? coords.y)
  const longitude = Number(coords.longitude ?? coords.lng ?? coords.lon ?? coords.Longitude ?? coords.x)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  return { latitude, longitude }
}

function coordinatesMatch(point, coords) {
  const EPSILON = 1e-6
  return (
    Math.abs(point.latitude - coords.latitude) <= EPSILON &&
    Math.abs(point.longitude - coords.longitude) <= EPSILON
  )
}

function findCampusPointByCoordinates(coords) {
  if (!coords) {
    return null
  }
  return campusPoints.value.find((point) => coordinatesMatch(point, coords)) || null
}

async function ensureCampusPointsLoaded() {
  if (campusPointsLoaded.value) {
    return
  }
  if (!campusPointsPromise) {
    campusPointsPromise = fetchCampusPoints()
    campusPointsPromise
      .catch(() => {
        // 错误已在 fetchCampusPoints 中处理
      })
      .finally(() => {
        campusPointsPromise = null
      })
  }
  return campusPointsPromise
}

async function ensureCampusPointsAvailability() {
  try {
    await ensureCampusPointsLoaded()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: `获取校园点位失败：${error.message || '未知错误'}`,
      position: 'top'
    })
    return false
  }

  if (!campusPoints.value.length) {
    $q.notify({
      type: 'warning',
      message: '暂无可用的校园点位数据，无法生成任务规划。',
      position: 'top'
    })
    return false
  }

  return true
}

function validateTaskPlan(taskPlan) {
  if (!taskPlan) {
    return null
  }
  const normalizedPlan = { ...taskPlan }
  normalizedPlan.startPointCoordinates = normalizeCoordinates(taskPlan.startPointCoordinates)
  normalizedPlan.targetPointCoordinates = normalizeCoordinates(taskPlan.targetPointCoordinates)

  if (!normalizedPlan.startPointCoordinates || !normalizedPlan.targetPointCoordinates) {
    throw new Error('AI 返回的任务缺少起点或终点坐标信息。')
  }

  const startPointMeta = findCampusPointByCoordinates(normalizedPlan.startPointCoordinates)
  const targetPointMeta = findCampusPointByCoordinates(normalizedPlan.targetPointCoordinates)

  if (!startPointMeta || !targetPointMeta) {
    throw new Error('AI 返回的经纬度不在授权的校园点位列表中。')
  }

  normalizedPlan.startPoint = normalizedPlan.startPoint || startPointMeta.name
  normalizedPlan.targetPoint = normalizedPlan.targetPoint || targetPointMeta.name
  normalizedPlan.startPointId = normalizedPlan.startPointId || startPointMeta.id
  normalizedPlan.targetPointId = normalizedPlan.targetPointId || targetPointMeta.id

  return normalizedPlan
}

function formatCoordinates(coords) {
  if (!coords) {
    return '未设置'
  }
  const normalized = normalizeCoordinates(coords)
  if (!normalized) {
    return '未设置'
  }
  return `${normalized.latitude.toFixed(6)}, ${normalized.longitude.toFixed(6)}`
}

onMounted(() => {
  // 从设置页读取 API 配置
  const savedApiKey = localStorage.getItem('ai_api_key')

  if (!savedApiKey) {
    $q.notify({
      type: 'warning',
      message: '请先在设置页面配置 AI API',
      position: 'top',
      actions: [
        {
          label: '去设置',
          color: 'white',
          handler: () => {
            window.location.href = '/#/settings'
          }
        }
      ]
    })
  }

  ensureCampusPointsLoaded().catch((error) => {
    $q.notify({
      type: 'negative',
      message: `自动获取校园点位失败：${error.message || '未知错误'}`,
      position: 'top'
    })
  })
})

// 发送消息
async function handleSend() {
  if (!userInput.value.trim() || isLoading.value) return

  const message = userInput.value.trim()
  const success = await sendMessage(message)
  if (success) {
    userInput.value = ''
  }
}

async function sendMessage(message) {
  const canProceed = await ensureCampusPointsAvailability()
  if (!canProceed) {
    return false
  }

  // 添加用户消息
  messages.value.push({
    role: 'user',
    content: message,
    timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  })

  scrollToBottom()
  isLoading.value = true

  try {
    // 调用 AI API
    const response = await callAiApi(message)

    // 添加 AI 回复
    messages.value.push({
      role: 'assistant',
      content: response.text,
      taskPlan: response.taskPlan,
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    })

    // 更新当前任务
    if (response.taskPlan) {
      currentTask.value = response.taskPlan
    }

    scrollToBottom()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: '调用 AI API 失败: ' + error.message,
      position: 'top'
    })
  } finally {
    isLoading.value = false
  }

  return true
}

// 调用 AI API
async function callAiApi(message) {
  // 从 localStorage 读取 API 配置
  const apiKey = localStorage.getItem('ai_api_key')
  const apiProvider = localStorage.getItem('ai_api_provider') || 'OpenAI'
  const apiEndpoint = localStorage.getItem('ai_api_endpoint')

  if (!apiKey) {
    throw new Error('请先在设置页面配置 AI API Key')
  }

  // 构建对话历史
  const conversationHistory = messages.value.map(msg => ({
    role: msg.role,
    content: msg.content
  }))

  // 添加当前消息
  conversationHistory.push({
    role: 'user',
    content: message
  })

  // 调用 AI API
  try {
    const endpoint = getApiEndpoint(apiProvider, apiEndpoint)
    const requestBody = buildRequestBody(apiProvider, conversationHistory)
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      throw new Error(`API 调用失败: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const aiResponse = extractResponse(apiProvider, data)

    // 解析 AI 响应，提取 JSON
    const { text, taskPlan } = parseAiResponse(aiResponse)

    return { text, taskPlan }
  } catch (error) {
    console.error('AI API 调用错误:', error)
    throw error
  }
}

// 获取 API 端点
function getApiEndpoint(provider, customEndpoint) {
  if (customEndpoint) return customEndpoint

  const endpoints = {
    'OpenAI': 'https://api.openai.com/v1/chat/completions',
    'Azure OpenAI': customEndpoint, // Azure 必须提供自定义端点
    '通义千问': 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    '文心一言': 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/completions',
    '智谱AI': 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
  }

  return endpoints[provider] || endpoints['OpenAI']
}

// 构建请求体
function buildRequestBody(provider, conversationHistory) {
  const baseRequest = {
    messages: [
      { role: 'system', content: buildSystemPrompt() },
      ...conversationHistory
    ],
    temperature: 0.7
  }

  const models = {
    'OpenAI': 'gpt-5.1-codex',
    'Azure OpenAI': 'gpt-5.1-codex',
    '通义千问': 'qwen-turbo',
    '文心一言': 'ERNIE-Bot-turbo',
    '智谱AI': 'glm-3-turbo'
  }

  return {
    ...baseRequest,
    model: models[provider] || 'gpt-3.5-turbo'
  }
}

// 提取响应内容
function extractResponse(provider, data) {
  if (provider === '通义千问') {
    return data.output?.text || ''
  } else if (provider === '文心一言') {
    return data.result || ''
  } else {
    return data.choices?.[0]?.message?.content || ''
  }
}

// 解析 AI 响应，提取文本和 JSON
function parseAiResponse(aiResponse) {
  // 提取 JSON 代码块
  const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/)

  let taskPlan = null
  let text = aiResponse

  if (!jsonMatch) {
    throw new Error('AI 响应中缺少 JSON 任务数据。')
  }

  try {
    const parsedPlan = JSON.parse(jsonMatch[1])
    taskPlan = validateTaskPlan(parsedPlan)
    // 移除 JSON 部分，只保留文本
    text = aiResponse.replace(/```json[\s\S]*?```/, '').trim()
  } catch (error) {
    console.error('任务 JSON 解析失败:', error)
    throw error
  }

  return { text, taskPlan }
}



// 确认任务
function confirmTask(task) {
  $q.dialog({
    title: '确认执行任务',
    message: `确定要执行此任务吗？\n无人机数量：${task.droneCount}架\n任务：${task.description}`,
    cancel: true,
    persistent: true
  }).onOk(() => {
    let normalizedTask = null
    try {
      normalizedTask = validateTaskPlan(task)
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error.message || '任务数据无效',
        position: 'top'
      })
      return
    }

    const missionPayload = buildMissionPayload(normalizedTask)
    missionStore.setCurrentMission(missionPayload)

    $q.notify({
      type: 'positive',
      message: '任务已同步至场景设置，请在地图中查看并执行',
      position: 'top'
    })

    router.push({ path: '/mission/scene', query: { fromPlanning: 'true' } })
  })
}

// 修改任务
function modifyTask(task) {
  userInput.value = `修改任务：${task.description}，`
}

// 清空对话
function clearChat() {
  $q.dialog({
    title: '确认清空',
    message: '确定要清空所有对话记录吗？',
    cancel: true
  }).onOk(() => {
    messages.value = []
    currentTask.value = null
  })
}

// 复制 JSON
function copyJson() {
  if (!currentTask.value) return

  navigator.clipboard.writeText(JSON.stringify(currentTask.value, null, 2))
  $q.notify({
    type: 'positive',
    message: 'JSON 已复制到剪贴板',
    position: 'top'
  })
}



// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function buildMissionPayload(taskPlan) {
  const startCoord = normalizeCoordinates(taskPlan.startPointCoordinates)
  const endCoord = normalizeCoordinates(taskPlan.targetPointCoordinates)

  const waypointScaffold = []

  // 1. 添加起点 (sequence 0)
  if (startCoord) {
    waypointScaffold.push({
      lat: startCoord.latitude,
      lng: startCoord.longitude,
      name: taskPlan.startPoint || '起点',
      sequence: 0
    })
  }

  // 2. --- 新增逻辑：处理中间途经点 ---
  // 优先使用 taskPlan.waypoints，如果没有，则尝试将 taskPlan.area 作为途经点
  let intermediatePoints = []

  if (Array.isArray(taskPlan.waypoints) && taskPlan.waypoints.length > 0) {
    intermediatePoints = taskPlan.waypoints
  } else if (taskPlan.area && taskPlan.area !== 'null') {
    // 如果 AI 把"西操场"放在了 area 字段，我们尝试在校园点位库里找到它
    intermediatePoints = [taskPlan.area]
  }

  intermediatePoints.forEach((pointName) => {
    // 在校园点位列表中查找对应的坐标
    const pointMeta = campusPoints.value.find(p => p.name === pointName) ||
                      campusPoints.value.find(p => p.name.includes(pointName))

    if (pointMeta) {
      waypointScaffold.push({
        lat: pointMeta.latitude,
        lng: pointMeta.longitude,
        name: pointMeta.name,
        sequence: waypointScaffold.length // 自动递增序号
      })
    }
  })
  // ----------------------------------

  // 3. 添加终点
  if (endCoord) {
    waypointScaffold.push({
      lat: endCoord.latitude,
      lng: endCoord.longitude,
      name: taskPlan.targetPoint || '终点',
      sequence: waypointScaffold.length
    })
  }

  return {
    taskName: taskPlan.description || 'AI 任务',
    taskType: taskPlan.description || 'AI 任务',
    droneCount: taskPlan.droneCount || 1,
    description: taskPlan.description,
    startPoint: taskPlan.startPoint,
    targetPoint: taskPlan.targetPoint,
    startPointCoordinates: startCoord,
    targetPointCoordinates: endCoord,
    altitude: taskPlan.altitude,
    speed: taskPlan.speed,
    waypoints: waypointScaffold, // 这里现在包含了：起点 -> 中间点(西操场) -> 终点
    start_point: startCoord
      ? { lat: startCoord.latitude, lng: startCoord.longitude, name: taskPlan.startPoint || '起点' }
      : null,
    end_point: endCoord
      ? { lat: endCoord.latitude, lng: endCoord.longitude, name: taskPlan.targetPoint || '终点' }
      : null,
    // 如果需要保留 area 用于显示或作为禁飞区逻辑，可以保留
    area: taskPlan.area
  }
}
</script>

<style scoped lang="scss">
.ai-task-planning-page {
  height: 100%;
  padding: 0;
}

.page-container {
  display: flex;
  height: 100%;
  gap: 16px;
  padding: 16px;
}

// 左侧对话区域
.chat-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #4a90e2;
  color: white;
}

.header-title {
  display: flex;
  align-items: center;
}

.title-text {
  font-size: 20px;
  font-weight: 600;
}

.subtitle-text {
  font-size: 13px;
  opacity: 0.9;
  margin-top: 2px;
}

.clear-btn {
  color: white;
}

// 消息容器
.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  background: #f8f9fa;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.empty-text {
  margin-top: 16px;
  font-size: 16px;
}

.example-prompts {
  margin-top: 24px;
  text-align: center;
}

.example-title {
  font-size: 14px;
  color: #666;
  margin-bottom: 12px;
}

.example-chip {
  margin: 4px;
}

// 消息样式
.message {
  display: flex;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-right: 12px;
}

.message.user .message-avatar {
  background: #667eea;
  color: white;
}

.message.assistant .message-avatar {
  background: #f0f0f0;
  color: #666;
}

.message-content {
  flex: 1;
  max-width: 70%;
}

.message.user .message-content {
  margin-left: auto;
  margin-right: 0;
}

.message-text {
  background: white;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  white-space: pre-wrap;
  word-wrap: break-word;
}

.message.user .message-text {
  background: #667eea;
  color: white;
}

.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
  padding: 0 4px;
}

// 任务规划卡片
.task-plan-card {
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;
}

.plan-header {
  font-weight: 600;
  font-size: 15px;
  color: #333;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-item {
  display: flex;
  font-size: 14px;
}

.plan-label {
  font-weight: 500;
  color: #666;
  min-width: 100px;
}

.plan-value {
  color: #333;
}

.plan-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e0e0e0;
}

// 输入区域
.input-section {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.message-input {
  :deep(.q-field__control) {
    border-radius: 24px;
  }
}

.input-hint {
  font-size: 12px;
  color: #999;
  margin-top: 8px;
  text-align: center;
}

// 打字指示器
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-10px);
  }
}

// 右侧预览区域
.preview-section {
  width: 400px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.current-task {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.task-summary {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.summary-text {
  flex: 1;
}

.summary-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.summary-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.task-details {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
}

.detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  font-size: 12px;
  color: #999;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.task-json {
  background: #1e1e1e;
  border-radius: 8px;
  overflow: hidden;
}

.json-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2d2d2d;
  color: white;
  font-size: 13px;
  font-weight: 500;
}

.json-content {
  padding: 16px;
  margin: 0;
  color: #d4d4d4;
  font-size: 12px;
  font-family: 'Courier New', monospace;
  overflow-x: auto;
}

.no-task {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.no-task p {
  margin-top: 16px;
  font-size: 16px;
}

.hint-text {
  font-size: 14px;
  color: #bbb;
}
</style>

