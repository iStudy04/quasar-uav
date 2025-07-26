<template>
  <div>
    <!-- 自定义图层切换控件 -->
    <div class="custom-maptype">
      <div class="base-type">
        <label
          :class="{ active: baseType === 'normal' }"
          @click="setBaseType('normal')"
        >标准图层</label>
        <label
          :class="{ active: baseType === 'satellite' }"
          @click="setBaseType('satellite')"
        >卫星图</label>
      </div>
      <div class="overlay-type">
        <label>
          <input type="checkbox" v-model="showRoadNet" @change="toggleRoadNet" />
          路网
        </label>
      </div>
    </div>
    <div id="container" class="tech-map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useDroneStore } from 'stores/drone';

let map = null;
let satelliteLayer = null;
let roadNetLayer = null;

const baseType = ref('normal'); // 'normal' or 'satellite'
const showRoadNet = ref(false);

// --- Drone State ---
const droneStore = useDroneStore();
let droneMarker = null;


function updateDroneOnMap(status, shouldRecenter = false) {
  // 如果地图未初始化或无人机未连接，则不进行任何操作
  if (!map || !status || !status.isConnected) {
    // 如果无人机标记存在，则从地图上移除
    if (droneMarker) {
      map.remove(droneMarker);
      droneMarker = null;
    }
    return;
  }

  const position = new window.AMap.LngLat(status.longitude, status.latitude);
  const heading = status.heading;

  if (!droneMarker) {
    // 如果标记不存在，则创建新的标记
    droneMarker = new window.AMap.Marker({
      position: position,
      // 使用一个SVG作为图标，可以方便地旋转
      // 这是一个指向正北方的三角形
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(40, 40),
        // 使用一个指向性明确的锐利箭头/飞行器SVG图标
        image: 'data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 0L124 768l388-194 388 194L512 0z" fill="%234A90E2" stroke="%23FFFFFF" stroke-width="40" /></svg>',
        imageSize: new window.AMap.Size(40, 40)
      }),
      offset: new window.AMap.Pixel(-20, -20), // 图标中心点偏移
      angle: heading // 设置初始角度
    });
    map.add(droneMarker);
    console.log("无人机标记已创建");
  } else {
    // 如果标记已存在，则更新位置和角度
    droneMarker.setPosition(position);
    droneMarker.setAngle(heading);
  }

  // 如果需要，将地图视图移动到无人机位置
  if (shouldRecenter) {
    map.setZoomAndCenter(17, position, false, 500); // 动画时长500ms
  }
}

// 4. 使用 watch 监听无人机状态变化
watch(
  () => droneStore.droneStatus,
  (newStatus, oldStatus) => {
    // 判断是否需要重新居中
    // 条件：从“未连接”变为“已连接”
    const justConnected = !oldStatus?.isConnected && newStatus?.isConnected;
    updateDroneOnMap(newStatus, justConnected);
  },
  { deep: true } // 深度监听，因为 droneStatus 是一个对象
);

function setBaseType(type) {
  if (!map) return;
  baseType.value = type;
  if (type === 'normal') {
    map.setLayers([new window.AMap.TileLayer()]);
    if (showRoadNet.value && roadNetLayer) map.add(roadNetLayer);
  } else if (type === 'satellite') {
    map.setLayers([satelliteLayer]);
    if (showRoadNet.value && roadNetLayer) map.add(roadNetLayer);
  }
}

function toggleRoadNet() {
  if (!map) return;
  if (showRoadNet.value) {
    map.add(roadNetLayer);
  } else {
    map.remove(roadNetLayer);
  }
}

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "0bb2d9d601a8aa958498a59a62125596",
  };
  AMapLoader.load({
    key: "ecc03cb91886825cd841398653f02848",
    version: "2.1Beta",
    plugins: [
      "AMap.Scale",
      "AMap.Terrain",
    ],
  })
    .then((AMap) => {
      map = new AMap.Map("container", {
        viewMode: "2D",
        terrain: true,
        zoom: 11,
        center: [118.78990242801399, 31.93709248681005],
        pitch: 45,
        mapStyle: 'amap://styles/light',
        features: ['bg', 'road', 'building', 'point'],
        showBuildingBlock: true,
        buildingAnimation: true,
        skyColor: '#E3F2FD',
        fog: true,
        fogColor: '#4A90E2',
        fogOpacity: 0.1,
        buildingStyle: {
          color: '#FFFFFF',
          opacity: 0.8,
          outlineColor: '#4A90E2',
          outlineOpacity: 0.2
        }
      });

      // 初始化图层
      satelliteLayer = new AMap.TileLayer.Satellite();
      roadNetLayer = new AMap.TileLayer.RoadNet();

      // 默认显示标准图层
      setBaseType('normal');

      map.on('complete', () => {
        console.log('地图加载完成，地形已开启');
      });
    })
    .catch((e) => {
      console.log(e);
    });
});

onUnmounted(() => {
  map?.destroy();
});
</script>

<style>
.custom-maptype {
  position: absolute;
  left: 32px;
  bottom: 48px;
  right: auto;
  top: auto;
  z-index: 20;
  background: #f5faff;
  border: 2px solid #4A90E2;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(74, 144, 226, 0.18);
  padding: 12px 18px;
  font-family: inherit;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 110px;
  font-size: 15px;
  align-items: flex-start;
}
.custom-maptype .base-type,
.custom-maptype .overlay-type {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.custom-maptype .base-type label,
.custom-maptype .overlay-type label {
  margin: 0;
  cursor: pointer;
  font-weight: bold;
  color: #1976d2;
  font-size: 15px;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.2s, color 0.2s;
  width: 100%;
  box-sizing: border-box;
}
.custom-maptype .base-type label.active {
  background: #4A90E2;
  color: #fff;
}
.custom-maptype input[type="checkbox"] {
  accent-color: #1976d2;
  margin-right: 4px;
}
#container {
  width: 100%;
  height: 92vh;
  border: 2px solid #4A90E2;
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(74, 144, 226, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.tech-map {
  position: relative;
}
</style>
