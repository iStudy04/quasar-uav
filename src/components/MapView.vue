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
let droneMarker = null;
let dronePath = null;

function updateDroneOnMap(status, shouldRecenter = false) {
  if (!map || !status || !status.isConnected) {
    if (droneMarker) {
      map.remove(droneMarker);
      droneMarker = null;
    }
    if (dronePath) {
      map.remove(dronePath);
      dronePath = null;
    }
    return;
  }

  const position = new window.AMap.LngLat(status.longitude, status.latitude);
  const heading = status.heading || 0;

  // 添加无人机图标
  if (!droneMarker) {
    droneMarker = new window.AMap.Marker({
      position,
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(40, 40),
        image:
          'data:image/svg+xml;utf8,<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M512 0L124 768l388-194 388 194L512 0z" fill="%234A90E2" stroke="%23FFFFFF" stroke-width="40" /></svg>',
        imageSize: new window.AMap.Size(40, 40)
      }),
      offset: new window.AMap.Pixel(-20, -20),
      angle: heading,
      clickable: false
    });
    map.add(droneMarker);
    console.log("无人机标记已创建");
  } else {
    droneMarker.setPosition(position);
    droneMarker.setAngle(heading);
  }

  // 添加或更新轨迹线
  if (!dronePath) {
    dronePath = new window.AMap.Polyline({
      path: [position],
      strokeColor: "#4A90E2",
      strokeWeight: 4,
      strokeOpacity: 0.8,
      lineJoin: "round"
    });
    map.add(dronePath);
  } else {
    const path = dronePath.getPath();
    path.push(position);
    if (path.length > 200) path.shift(); // 限制最大轨迹点数
    dronePath.setPath(path);
  }

  // 是否居中地图
  if (shouldRecenter) {
    map.setZoomAndCenter(17, position, false, 500);
  }
}

watch(
  () => droneStore.droneStatus,
  (newStatus, oldStatus) => {
    const justConnected = !oldStatus?.isConnected && newStatus?.isConnected;
    updateDroneOnMap(newStatus, justConnected);
  },
  { deep: true }
);

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

onMounted(() => {
  window._AMapSecurityConfig = {
    securityJsCode: "0bb2d9d601a8aa958498a59a62125596"
  };
  AMapLoader.load({
    key: "ecc03cb91886825cd841398653f02848",
    version: "2.1Beta",
    plugins: ["AMap.Scale", "AMap.Terrain"]
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
</style>
