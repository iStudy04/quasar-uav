<template>
  <div class="terrain-map-container">
    <!-- 地图容器 -->
    <div id="terrain-map" ref="mapContainer"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <q-card class="control-card">
        <q-card-section>
          <div class="text-h6">3D地形控制</div>
        </q-card-section>

        <q-card-section>
          <!-- 视角控制 -->
          <div class="control-group">
            <div class="text-subtitle2 q-mb-sm">视角控制</div>
            <div class="row q-gutter-sm">
              <q-btn
                icon="3d_rotation"
                label="重置视角"
                color="primary"
                size="sm"
                @click="resetView"
              />
              <q-btn
                icon="terrain"
                label="地形开关"
                :color="terrainEnabled ? 'positive' : 'grey'"
                size="sm"
                @click="toggleTerrain"
              />
            </div>
          </div>

          <!-- 倾斜角度控制 -->
          <div class="control-group q-mt-md">
            <div class="text-subtitle2 q-mb-sm">倾斜角度: {{ pitch }}°</div>
            <q-slider
              v-model="pitch"
              :min="0"
              :max="83"
              :step="1"
              color="primary"
              @change="updatePitch"
            />
          </div>

          <!-- 缩放级别控制 -->
          <div class="control-group q-mt-md">
            <div class="text-subtitle2 q-mb-sm">缩放级别: {{ zoom }}</div>
            <q-slider
              v-model="zoom"
              :min="3"
              :max="20"
              :step="1"
              color="secondary"
              @change="updateZoom"
            />
          </div>

          <!-- 地图样式选择 -->
          <div class="control-group q-mt-md">
            <div class="text-subtitle2 q-mb-sm">地图样式</div>
            <q-select
              v-model="selectedMapStyle"
              :options="mapStyleOptions"
              dense
              outlined
              @update:model-value="changeMapStyle"
            />
          </div>

          <!-- 位置信息 -->
          <div class="control-group q-mt-md">
            <div class="text-subtitle2 q-mb-sm">当前位置</div>
            <div class="text-caption">
              经度: {{ currentPosition.lng.toFixed(6) }}
            </div>
            <div class="text-caption">
              纬度: {{ currentPosition.lat.toFixed(6) }}
            </div>
            <div class="text-caption">
              海拔: {{ currentPosition.altitude }}m
            </div>
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <q-spinner-dots size="50px" color="primary" />
      <div class="text-subtitle1 q-mt-sm">正在加载3D地形...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import AMapLoader from '@amap/amap-jsapi-loader'

// 响应式数据
const mapContainer = ref(null)
const loading = ref(true)
const map = ref(null)
const pitch = ref(45)
const zoom = ref(11)
const terrainEnabled = ref(true)
const selectedMapStyle = ref('normal')

// 当前位置信息
const currentPosition = reactive({
  lng: 118.78990242801399,
  lat: 31.93709248681005,
  altitude: 0
})

// 地图样式选项
const mapStyleOptions = [
  { label: '标准地图', value: 'normal' },
  { label: '卫星地图', value: 'satellite' },
  { label: '夜间地图', value: 'dark' },
  { label: '高德地图', value: 'amap' }
]

// 地图样式映射
const mapStyleMap = {
  normal: 'amap://styles/normal',
  satellite: 'amap://styles/satellite',
  dark: 'amap://styles/dark',
  amap: 'amap://styles/amap'
}

// 初始化地图
const initMap = async () => {
  try {
    loading.value = true

    // 设置安全配置
    window._AMapSecurityConfig = {
      securityJsCode: "0bb2d9d601a8aa958498a59a62125596",
    }

    // 加载高德地图API - 使用2.1Beta版本以获得最佳3D地形支持
    const AMap = await AMapLoader.load({
      key: "ecc03cb91886825cd841398653f02848",
      version: "2.1Beta", // 使用2.1Beta版本，支持更好的3D地形功能
      plugins: [
        "AMap.Terrain",      // 地形插件
        "AMap.ControlBar",   // 3D控制条
        "AMap.Scale",        // 比例尺
        "AMap.ToolBar",      // 工具栏
        "AMap.HawkEye",      // 鹰眼
        "AMap.MapType"       // 地图类型切换
      ]
    })

    // 创建地图实例 - 优化3D地形配置
    map.value = new AMap.Map("terrain-map", {
      viewMode: "3D",                    // 3D模式
      terrain: terrainEnabled.value,     // 开启地形
      zoom: zoom.value,                  // 缩放级别
      center: [currentPosition.lng, currentPosition.lat], // 中心点
      pitch: pitch.value,                // 倾斜角度
      mapStyle: mapStyleMap[selectedMapStyle.value], // 地图样式
      features: ['bg', 'road', 'building', 'point'], // 显示要素
      showBuildingBlock: true,           // 显示建筑物
      buildingAnimation: true,           // 建筑物动画
      expandZoomRange: true,             // 扩展缩放范围
      zooms: [3, 20],                   // 缩放范围
      skyColor: '#87CEEB',              // 天空颜色
      fog: true,                        // 开启雾效
      fogColor: '#ffffff',              // 雾效颜色
      fogOpacity: 0.3,                  // 雾效透明度
      light: {                          // 光照设置
        main: {
          intensity: 1.2,
          shadow: true
        },
        ambient: {
          intensity: 0.4
        }
      }
    })

    // 添加3D控制条
    map.value.addControl(new AMap.ControlBar({
      position: {
        top: '10px',
        right: '10px'
      },
      showZoomBar: true,
      showControlButton: true,
      showTilt: true,
      showRotate: true
    }))

    // 添加比例尺
    map.value.addControl(new AMap.Scale({
      position: 'bottom-left'
    }))

    // 添加工具栏
    map.value.addControl(new AMap.ToolBar({
      position: 'top-left'
    }))

    // 添加鹰眼
    map.value.addControl(new AMap.HawkEye({
      position: 'bottom-right'
    }))

    // 添加地图类型切换
    map.value.addControl(new AMap.MapType({
      position: 'top-right'
    }))

    // 监听地图事件
    map.value.on('complete', () => {
      console.log('3D地形地图加载完成')
      loading.value = false

      // 确保地形正确加载
      if (terrainEnabled.value) {
        console.log('地形功能已启用')
        // 可以在这里添加地形相关的初始化代码
      }
    })

    map.value.on('moveend', () => {
      const center = map.value.getCenter()
      currentPosition.lng = center.lng
      currentPosition.lat = center.lat

      // 获取海拔信息（如果支持）
      if (map.value.getTerrain) {
        const terrain = map.value.getTerrain()
        if (terrain && terrain.getAltitude) {
          terrain.getAltitude(center.lng, center.lat, (altitude) => {
            currentPosition.altitude = Math.round(altitude || 0)
          })
        }
      }
    })

    map.value.on('zoomend', () => {
      zoom.value = map.value.getZoom()
    })

    map.value.on('pitchchange', () => {
      pitch.value = Math.round(map.value.getPitch())
    })

    // 监听地形变化
    map.value.on('terrainchange', () => {
      console.log('地形设置已更改')
    })

  } catch (error) {
    console.error('地图初始化失败:', error)
    loading.value = false
  }
}

// 重置视角
const resetView = () => {
  if (map.value) {
    map.value.setView([currentPosition.lng, currentPosition.lat], 11, 0)
  }
}

// 切换地形
const toggleTerrain = () => {
  terrainEnabled.value = !terrainEnabled.value
  if (map.value) {
    map.value.setTerrain(terrainEnabled.value)
  }
}

// 更新倾斜角度
const updatePitch = (value) => {
  if (map.value) {
    map.value.setPitch(value)
  }
}

// 更新缩放级别
const updateZoom = (value) => {
  if (map.value) {
    map.value.setZoom(value)
  }
}

// 切换地图样式
const changeMapStyle = (style) => {
  if (map.value && mapStyleMap[style]) {
    map.value.setMapStyle(mapStyleMap[style])
  }
}

// 组件挂载时初始化地图
onMounted(() => {
  initMap()
})

// 组件卸载时销毁地图
onUnmounted(() => {
  if (map.value) {
    map.value.destroy()
  }
})
</script>

<style scoped>
.terrain-map-container {
  position: relative;
  width: 100%;
  height: 100vh;
}

#terrain-map {
  width: 100%;
  height: 100%;
}

.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 1000;
  max-width: 300px;
}

.control-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.control-group {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 12px;
}

.control-group:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .control-panel {
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .control-card {
    font-size: 0.9em;
  }
}
</style>
