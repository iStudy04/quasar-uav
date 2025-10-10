<template>
  <q-card flat class="tech-camera-card">
    <div class="camera-header tech-text">视频图传</div>
    <div class="camera-container">
<!--      <img src="http://192.168.1.121:8080/?action=stream" class="tech-camera-feed">-->
      <img :src="streamUrl" class="tech-camera-feed" />
    </div>
  </q-card>
</template>

<script setup>
import {computed, onMounted} from "vue";

const props = defineProps({
  ip: String
})

const streamUrl = computed(() => `http://${props.ip}:8080/?action=stream`)
// const streamUrl = computed(() => `http://192.168.19.254:8080/?action=stream`)

onMounted(()=>{
  console.log("摄像头ip地址为"+props.ip)
})

</script>

<style scoped>
.tech-camera-card {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border: 1px solid #4A90E2;
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(74, 144, 226, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  position: relative;
}

.camera-header {
  background: rgba(74, 144, 226, 0.1);
  padding: 8px 12px;
  font-size: 14px;
  font-weight: bold;
  border-bottom: 1px solid rgba(74, 144, 226, 0.3);
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.camera-container {
  position: relative;
  padding: 8px;
}

.tech-camera-feed {
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid rgba(74, 144, 226, 0.3);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.2);
}

.tech-text {
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-text-secondary {
  color: #4A90E2;
  text-shadow: 0 0 5px rgba(74, 144, 226, 0.2);
}
</style>

