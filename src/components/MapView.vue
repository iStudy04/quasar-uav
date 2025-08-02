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

// 无人机状态管理
const droneStore = useDroneStore();
let drones = {}; // 存储所有无人机的标记和轨迹

// 平滑因子，值越小，轨迹越平滑，但会有轻微延迟。推荐范围 0.2 - 0.5
const SMOOTHING_FACTOR = 0.3;

// 无人机图标SVG
const droneIconSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
    <path d="M14,2 L26,26 L14,22 L2,26 L14,2" fill="#F57C00" stroke="#FFF" stroke-width="1"/>
  </svg>
`;

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

  // 修复坐标字段匹配问题 - 优先使用正确的字段名
  const longitude = status.longitude || status.longtitude || 0;
  const latitude = status.latitude || 0;

  // 检查坐标是否有效
  if (!longitude || !latitude || longitude === 0 || latitude === 0) {
    console.warn(`无人机 ${clientId} 无效的坐标数据:`, { longitude, latitude, status });
    return;
  }

  const position = new window.AMap.LngLat(longitude, latitude);
  const heading = status.heading || status.head || 0;

  // console.log(`更新无人机 ${clientId} 位置:`, { longitude, latitude, heading, isConnected: status.isConnected });

  if (drones[clientId]) {
    const drone = drones[clientId];

    // 使用指数移动平均(EMA)算法平滑位置
    const lastSmoothedPosition = drone.lastSmoothedPosition;
    const smoothedLat = lastSmoothedPosition.lat * (1 - SMOOTHING_FACTOR) + position.lat * SMOOTHING_FACTOR;
    const smoothedLng = lastSmoothedPosition.lng * (1 - SMOOTHING_FACTOR) + position.lng * SMOOTHING_FACTOR;

    const smoothedPosition = new window.AMap.LngLat(smoothedLng, smoothedLat);

    drone.marker.setPosition(smoothedPosition);
    drone.marker.setAngle(heading);

    const path = drone.polyline.getPath();
    path.push(smoothedPosition);
    drone.polyline.setPath(path);

    drone.lastSmoothedPosition = smoothedPosition;

    // 是否居中地图
    if (shouldRecenter) {
      map.setZoomAndCenter(17, smoothedPosition, false, 500);
    }
  } else {
    console.log(`首次检测到无人机 ${clientId}，正在创建地图对象...`);

    const marker = new window.AMap.Marker({
      position: position,
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(28, 28),
        image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(droneIconSvg),
        imageSize: new window.AMap.Size(28, 28),
      }),
      offset: new window.AMap.Pixel(-14, -14),
      angle: heading,
      clickable: false
    });

    const polyline = new window.AMap.Polyline({
      path: [position],
      strokeColor: "#F57C00",
      strokeWeight: 5,
      strokeOpacity: 0.8,
      lineJoin: 'round',
      clickable: false
    });

    map.add([marker, polyline]);

    drones[clientId] = {
      marker: marker,
      polyline: polyline,
      lastSmoothedPosition: position
    };

    // 如果是第一个无人机，居中地图
    if (Object.keys(drones).length === 1) {
      map.setCenter(position);
    }
  }
}

// 监听无人机状态变化
watch(
  () => droneStore.droneStatus,
  (newStatus, oldStatus) => {
    const clientId = 'drone-1'; // 可以根据实际需要修改无人机ID

    const justConnected = !oldStatus?.isConnected && newStatus?.isConnected;
    const justDisconnected = oldStatus?.isConnected && !newStatus?.isConnected;

    if (justDisconnected) {
      // 无人机断开连接时清除显示
      resetDroneDisplay(clientId);
      console.log(`无人机 ${clientId} 断开连接，已清除显示`);
    } else {
      updateDroneOnMap(newStatus, clientId, justConnected);
    }
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

let customMarker = null; // 单个点标记，重复点击时替换

const {lastCalculatedPosition ,originPosition} = droneStore

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
      map = new AMap.Map("container", {
        viewMode: "2D",
        terrain: true,
        zoom: 11,
        center: [118.78990242801399, 31.93709248681005],
        pitch: 45,
        mapStyle: "amap://styles/light",
        features: ["bg", "road", "building", "point"],
        showBuildingBlock: true,
        buildingAnimation: true,
        skyColor: "#E3F2FD",
        fog: true,
        fogColor: "#4A90E2",
        fogOpacity: 0.1,
        buildingStyle: {
          color: "#FFFFFF",
          opacity: 0.8,
          outlineColor: "#4A90E2",
          outlineOpacity: 0.2
        }
      });

      satelliteLayer = new AMap.TileLayer.Satellite();
      roadNetLayer = new AMap.TileLayer.RoadNet();

      setBaseType("normal");

      map.on("complete", () => {
        console.log("地图加载完成，地形已开启");
      });

      map.on("click", (e) => {
        const lnglat = e.lnglat; // 获取点击点经纬度

        // 清除上一个 marker（可选）
        if (customMarker) {
          map.remove(customMarker);
        }

        // 创建并添加 marker
        customMarker = new window.AMap.Marker({
          position: lnglat,
          icon: new window.AMap.Icon({
            size: new window.AMap.Size(22, 22),
            image: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <circle cx="11" cy="11" r="9" fill="#FF4081" stroke="#fff" stroke-width="2"/>
          </svg>
        `),
            imageSize: new window.AMap.Size(22, 22)
          }),
          offset: new window.AMap.Pixel(-11, -11),
          title: "目标点",
          clickable: false
        });

        map.add(customMarker);

        // 1. 拿到目标经纬度
        lastCalculatedPosition.lng = lnglat.getLng()
        lastCalculatedPosition.lat = lnglat.getLat()

        // 2. 使用【真实GPS坐标】进行距离计算
        const relativePos = calculateDistanceInMeters(
          originPosition.lat,
          originPosition.lng,
          lastCalculatedPosition.lat, // 使用转换后的真实纬度
          lastCalculatedPosition.lng  // 使用转换后的真实经度
        );

        // 3. 保存到lastCalculatedPosition中，用于发送指令
        lastCalculatedPosition.x = relativePos.x;
        lastCalculatedPosition.y = relativePos.y;

        console.log(lastCalculatedPosition)
        console.log("打点坐标：", lnglat.getLng(), lnglat.getLat());
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
  height: 92vh;
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
