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
        <label>
          <input type="checkbox" v-model="showTraffic" @change="toggleTraffic" />
          路况
        </label>
      </div>
    </div>
    <div id="container" class="tech-map"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import AMapLoader from "@amap/amap-jsapi-loader";

let map = null;
let satelliteLayer = null;
let roadNetLayer = null;
let trafficLayer = null;

const baseType = ref('normal'); // 'normal' or 'satellite'
const showRoadNet = ref(true);
const showTraffic = ref(false);

function setBaseType(type) {
  if (!map) return;
  baseType.value = type;
  if (type === 'normal') {
    map.setLayers([new window.AMap.TileLayer()]);
    if (showRoadNet.value && roadNetLayer) map.add(roadNetLayer);
    if (showTraffic.value && trafficLayer) map.add(trafficLayer);
  } else if (type === 'satellite') {
    map.setLayers([satelliteLayer]);
    if (showRoadNet.value && roadNetLayer) map.add(roadNetLayer);
    if (showTraffic.value && trafficLayer) map.add(trafficLayer);
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
function toggleTraffic() {
  if (!map) return;
  if (showTraffic.value) {
    map.add(trafficLayer);
  } else {
    map.remove(trafficLayer);
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
        viewMode: "3D",
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
      trafficLayer = new AMap.TileLayer.Traffic();

      // 默认显示标准图层和路网
      setBaseType('normal');
      map.add(roadNetLayer);

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
