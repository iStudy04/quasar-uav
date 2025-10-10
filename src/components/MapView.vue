<template>
  <div>
    <!-- 自定义图层切换控件 -->
    <div class="custom-maptype">
      <div class="base-type">
        <label :class="{ active: baseType === 'normal' }" @click="setBaseType('normal')">标准图层</label>
        <label :class="{ active: baseType === 'satellite' }" @click="setBaseType('satellite')">卫星图</label>
      </div>
      <div class="overlay-type">
        <label>
          <input type="checkbox" v-model="showRoadNet" @change="toggleRoadNet" />
          路网
        </label>
      </div>
    </div>
    <div id="container" class="tech-map"></div>

    <!-- 清除按钮组 -->
    <div class="clear-buttons">
      <q-btn
        @click="clearDronePath"
        label="清除轨迹"
        icon="timeline"
        size="sm"
        flat
        dense
        no-caps
        class="clear-btn"
      />
      <q-btn
        @click="clearAllDrones"
        label="清除所有"
        icon="clear_all"
        size="sm"
        flat
        dense
        no-caps
        class="clear-btn"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";
import { useDroneStore } from "stores/drone";

let map = null;
let satelliteLayer = null;
let roadNetLayer = null;

const baseType = ref("normal");
const showRoadNet = ref(false);

const droneStore = useDroneStore();
let drones = {}; // 存储所有无人机的标记和轨迹

const SMOOTHING_FACTOR = 0.3;
const lngOffset = 0.0052;
const latOffset = -0.00205;

/**
 * 将真实的GPS坐标转换为地图上显示的坐标
 * @param {number} lat 真实纬度
 * @param {number} lng 真实经度
 * @returns {AMap.LngLat} 用于高德地图API的LngLat对象
 */
function toDisplayCoords(lat, lng) {
    // 确保 AMap.LngLat 已加载
    if (window.AMap && window.AMap.LngLat) {
        return new window.AMap.LngLat(lng + lngOffset, lat + latOffset);
    }
    // 降级处理或抛出错误
    console.error("AMap.LngLat is not available.");
    return null;
}

/**
 * 将地图上点击的显示坐标转换为真实的GPS坐标
 * @param {AMap.LngLat} displayLngLat 从高德地图获取的LngLat对象
 * @returns {{lat: number, lng: number}} 包含真实经纬度的对象
 */
function toRealCoords(displayLngLat) {
    return {
        lat: displayLngLat.getLat() - latOffset,
        lng: displayLngLat.getLng() - lngOffset
    };
}

// 颜色管理：为不同无人机分配稳定颜色
const COLOR_PALETTE = [
  "#e53935", "#8e24aa", "#3949ab", "#1e88e5", "#00897b", "#43a047",
  "#f4511e", "#6d4c41", "#546e7a", "#d81b60", "#00acc1", "#7cb342"
];
const clientIdToColor = {};
function hashToIndex(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0; // 转为32位整数
  }
  return Math.abs(hash) % COLOR_PALETTE.length;
}
function getColorForClient(clientId) {
  if (!clientIdToColor[clientId]) {
    clientIdToColor[clientId] = COLOR_PALETTE[hashToIndex(clientId)];
  }
  return clientIdToColor[clientId];
}

// 将颜色调淡（与白色混合）
function lightenColor(hex, ratio = 0.7) {
  // ratio 取值 0~1，越大越接近白色
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const mix = (c) => Math.round(c + (255 - c) * ratio);
  const rr = mix(r).toString(16).padStart(2, '0');
  const gg = mix(g).toString(16).padStart(2, '0');
  const bb = mix(b).toString(16).padStart(2, '0');
  return `#${rr}${gg}${bb}`;
}

// 动态生成无人机图标SVG，填充为对应颜色
function makeDroneIconSvg(color) {
  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <path d="M14,2 L26,26 L14,22 L2,26 L14,2" fill="${color}" stroke="#FFF" stroke-width="1"/>
  </svg>`;
}

// 清除所有轨迹线的函数
function clearDronePath() {
  if (!map) return;

  // 重置轨迹数据但保留标记
  Object.values(drones).forEach(drone => {
    if (drone.polyline) {
      drone.polyline.setPath([]);
    }
  });

  console.log("所有轨迹线已清除");
}

// 清除所有无人机显示的函数
function clearAllDrones() {
  if (!map) return;

  // 清除所有无人机的标记和轨迹
  Object.keys(drones).forEach(clientId => {
    resetDroneDisplay(clientId);
  });

  console.log("所有无人机显示已清除");
}

// 清除指定无人机的轨迹
function clearSpecificDronePath(clientId) {
  if (!map || !drones[clientId]) return;

  const drone = drones[clientId];
  if (drone.polyline) {
    drone.polyline.setPath([]);
    console.log(`无人机 ${clientId} 的轨迹已清除`);
  }
}

// 重置无人机显示的函数
function resetDroneDisplay(clientId) {
  if (!map || !drones[clientId]) return;

  const drone = drones[clientId];
  if (drone.marker) {
    map.remove(drone.marker);
  }
  if (drone.polyline) {
    map.remove(drone.polyline);
  }

  delete drones[clientId];
  console.log(`无人机 ${clientId} 的显示已重置`);
}

// 更新无人机位置和轨迹
function updateDroneOnMap(status, clientId, shouldRecenter = false) {
  if (!map || !status || !status.isConnected) {
    if (drones[clientId]) {
      resetDroneDisplay(clientId);
    }
    return;
  }

  // 1. 获取无人机发来的【真实GPS坐标】
  const realLongitude = status.longitude || status.longtitude || 0;
  const realLatitude = status.latitude || 0;

  if (!realLongitude || !realLatitude) {
    console.warn(`无人机 ${clientId} 无效的坐标数据:`, { realLongitude, realLatitude });
    return;
  }

  // 2. 【修改】将真实GPS坐标转换为【地图显示坐标】
  const displayPosition = toDisplayCoords(realLatitude, realLongitude);
  if (!displayPosition) return; // 如果转换失败则中止

  const heading = status.heading || status.head || 0;

  if (drones[clientId]) {
    const drone = drones[clientId];
    const lastSmoothedPosition = drone.lastSmoothedPosition;

    // 平滑处理仍然在【显示坐标】上进行
    const smoothedLat = lastSmoothedPosition.lat * (1 - SMOOTHING_FACTOR) + displayPosition.lat * SMOOTHING_FACTOR;
    const smoothedLng = lastSmoothedPosition.lng * (1 - SMOOTHING_FACTOR) + displayPosition.lng * SMOOTHING_FACTOR;
    const smoothedPosition = new window.AMap.LngLat(smoothedLng, smoothedLat);

    drone.marker.setPosition(smoothedPosition);
    drone.marker.setAngle(heading);

    const path = drone.polyline.getPath();
    path.push(smoothedPosition);
    drone.polyline.setPath(path);
    drone.lastSmoothedPosition = smoothedPosition;

    if (shouldRecenter) {
      map.setZoomAndCenter(17, smoothedPosition, false, 500);
    }
  } else {
    console.log(`首次检测到无人机 ${clientId}，正在创建地图对象...`);
    const baseColor = getColorForClient(clientId);
    const color = lightenColor(baseColor, 0.65);

    // 3. 【修改】创建标记和轨迹时，使用转换后的【显示坐标】与专属颜色
    const marker = new window.AMap.Marker({
      position: displayPosition, // 使用显示坐标
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(28, 28),
        image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeDroneIconSvg(color)),
        imageSize: new window.AMap.Size(28, 28),
      }),
      offset: new window.AMap.Pixel(-14, -14),
      angle: heading,
      clickable: false
    });

    const polyline = new window.AMap.Polyline({
      path: [displayPosition], // 轨迹起点使用显示坐标
      strokeColor: color,
      strokeWeight: 5,
      strokeOpacity: 0.65,
      lineJoin: 'round',
      clickable: false
    });

    map.add([marker, polyline]);

    drones[clientId] = {
      marker: marker,
      polyline: polyline,
      lastSmoothedPosition: displayPosition, // 初始化平滑位置也用显示坐标
      color: color
    };

    if (Object.keys(drones).length === 1) {
      map.setCenter(displayPosition); // 地图居中也用显示坐标
    }
  }
}


// 监听所有无人机遥测，批量更新轨迹
watch(
  () => droneStore.rawTelemetry,
  (telemetryMap) => {
    if (!telemetryMap) return;

    // 1) 将 rawTelemetry 映射为 updateDroneOnMap 识别的状态结构
    const mapped = {};
    Object.entries(telemetryMap).forEach(([clientId, t]) => {
      if (!t) return;
      mapped[clientId] = {
        isConnected: true,
        // 兼容两种字段
        latitude: t.latitude || 0,
        longitude: t.longtitude || 0,
        longtitude: t.longtitude || 0,
        head: t.head || 0,
        heading: t.head || 0,
        height: t.height || 0,
        speed: t.speed || 0
      };
    });

    // 2) 更新或创建所有无人机图层
    updateMultipleDrones(mapped);

    // 3) 清理已不在 telemetry 中的无人机
    const activeIds = new Set(Object.keys(mapped));
    Object.keys(drones).forEach((id) => {
      if (!activeIds.has(id)) {
        resetDroneDisplay(id);
      }
    });
  },
  { deep: true }
);

// 更新多个无人机的函数（供外部调用）
function updateMultipleDrones(dronesData) {
  if (!map || !dronesData) return;

  Object.entries(dronesData).forEach(([clientId, droneData]) => {
    updateDroneOnMap(droneData, clientId, false);
  });
}

// 导出函数供外部使用
defineExpose({
  updateMultipleDrones,
  clearDronePath,
  clearAllDrones,
  clearSpecificDronePath
});

function setBaseType(type) {
  if (!map) return;
  baseType.value = type;
  if (type === "normal") {
    map.setLayers([new window.AMap.TileLayer()]);
    if (showRoadNet.value && roadNetLayer) map.add(roadNetLayer);
  } else if (type === "satellite") {
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

let customMarker = null;

const { lastCalculatedPosition, originPosition } = droneStore;

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "0bb2d9d601a8aa958498a59a62125596"
  };
  AMapLoader.load({
    key: "ecc03cb91886825cd841398653f02848",
    version: "2.0",
    plugins: ["AMap.Scale", "AMap.Terrain", "AMap.Polyline"]
  })
    .then((AMap) => {
      // ... (地图初始化代码基本不变) ...
      map = new AMap.Map("container", { /* ... */ });

      // --- 【修改】地图点击事件处理 ---
      map.on("click", (e) => {
        // 1. 获取地图上点击的【显示坐标】
        const displayLngLat = e.lnglat;

        // 2. 将显示坐标转换为【真实GPS坐标】
        const realCoords = toRealCoords(displayLngLat);

        // 3. 将【真实GPS坐标】保存到 store 中，用于发送给无人机
        lastCalculatedPosition.lng = realCoords.lng;
        lastCalculatedPosition.lat = realCoords.lat;

        // 4. 使用【真实GPS坐标】进行距离计算
        // 确保 originPosition 存储的也是真实GPS坐标
        const relativePos = calculateDistanceInMeters(
          originPosition.lat,
          originPosition.lng,
          realCoords.lat, // 使用转换后的真实纬度
          realCoords.lng  // 使用转换后的真实经度
        );

        // 5. 将计算出的相对坐标保存到 store
        lastCalculatedPosition.x = relativePos.x;
        lastCalculatedPosition.y = relativePos.y;

        // --- 以下是显示逻辑，仍然使用【显示坐标】 ---
        if (customMarker) {
          map.remove(customMarker);
        }

        // 创建标记时，位置必须是用户点击的【显示坐标】
        customMarker = new window.AMap.Marker({
          position: displayLngLat, // 使用点击的显示坐标
          icon: new window.AMap.Icon({ /* ... */ }),
          offset: new window.AMap.Pixel(-11, -11),
          title: "目标点",
          clickable: false
        });
        map.add(customMarker);

        console.log('目标点坐标:', {
            relative: { x: relativePos.x.toFixed(2), y: relativePos.y.toFixed(2) },
            absolute_real: { lat: realCoords.lat, lng: realCoords.lng },
            absolute_display: { lat: displayLngLat.getLat(), lng: displayLngLat.getLng() }
        });
      });
    })
    .catch((e) => {
      console.log(e);
    });
});


onUnmounted(() => {
  map?.destroy();
});

// 将经纬度差转换为米
function calculateDistanceInMeters(lat1, lng1, lat2, lng2) {
  const degToRad = Math.PI / 180.0;
  const EARTH_RADIUS = 6378137.0;

  const dLat = (lat2 - lat1) * degToRad;
  const dLng = (lng2 - lng1) * degToRad;

  const meanLat = (lat1 + lat2) / 2.0 * degToRad;

  const x = EARTH_RADIUS * dLng * Math.cos(meanLat); // 经度方向
  const y = EARTH_RADIUS * dLat;                     // 纬度方向

  return { x, y }; // 单位：米
}


</script>

<style scoped>
.custom-maptype {
  position: absolute;
  left: 32px;
  bottom: 48px;
  z-index: 20;
  background: #f5faff;
  border: 2px solid #4a90e2;
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
.custom-maptype label {
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
  background: #4a90e2;
  color: #fff;
}
.custom-maptype input[type="checkbox"] {
  accent-color: #1976d2;
  margin-right: 4px;
}
#container {
  width: 100%;
  height: 92.5vh;
  border: 2px solid #4a90e2;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(74, 144, 226, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}
.tech-map {
  position: relative;
}


.clear-buttons {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.clear-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  border: 1px solid #ddd !important;
  color: #333 !important;
}

.clear-btn:hover {
  background: rgba(255, 255, 255, 1) !important;
  border-color: #4a90e2 !important;
  color: #4a90e2 !important;
}


</style>
