<template>
  <div class="row q-pa-sm justify-between tech-control-panel">
    <!-- 左侧控制面板 -->
    <div class="column items-center">
      <div class="text-h6 text-left q-mb-sm self-start tech-text">无人机镜头</div>

      <div class="row q-pa-md items-center q-gutter-lg">

        <CompassControl class="q-mb-md"/>
        <div>
          <div class="row">
            <q-btn label="回正" color="primary" class="q-ma-xs tech-btn"/>
            <q-btn label="向下" color="primary" class="q-ma-xs tech-btn"/>
          </div>
          <div class="row">
            <q-btn label="录像" color="primary" class="q-ma-xs tech-btn"/>
            <q-btn label="拍照" color="primary" class="q-ma-xs tech-btn"/>
          </div>
        </div>

      </div>
    </div>

    <!-- 右侧控制面板 -->
    <div class="column items-center">
      <div class="text-h6 text-left q-mb-sm self-start tech-text">无人操控台</div>

      <div class="row q-pa-md items-center q-gutter-lg">
        <div class="column">
          <div class="row">
            <q-btn icon="rotate_left" label="左旋" class="tech-btn" />
            <q-btn icon="rotate_right" label="右旋" class="tech-btn" />
          </div>
          <div class="row">
            <q-btn icon="arrow_upward" label="上升" class="tech-btn" />
            <q-btn icon="arrow_downward" label="下降" class="tech-btn" />
          </div>
        </div>
        <CompassControl class="q-mb-md"/>
        <div class="column q-gutter-sm">
          <div class="row">
            <q-btn label="悬停" color="warning" class="tech-btn"/>
            <q-btn label="继续" color="positive" class="q-ml-sm tech-btn"/>
          </div>
          <q-btn label="返航" color="primary" class="tech-btn"/>
          <q-btn label="切换手飞" color="negative" class="tech-btn"/>
        </div>
      </div>

    </div>
  </div>

</template>
<script setup lang="ts">
import CompassControl from "./CompassControl.vue";
</script>

<style scoped>
.tech-control-panel {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border: 1px solid #4A90E2;
  border-radius: 12px;
  box-shadow:
    0 8px 32px rgba(74, 144, 226, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  transform: scale(0.8);
  transform-origin: bottom;
}

.tech-text {
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
  font-weight: bold;
}

.tech-btn {
  background: linear-gradient(145deg, rgba(74, 144, 226, 0.1) 0%, rgba(255, 255, 255, 0.9) 100%);
  border: 1px solid #4A90E2;
  color: #2C3E50;
  border-radius: 8px;
  transition: all 0.3s ease;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-btn:hover {
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.3);
  transform: translateY(-2px);
  background: linear-gradient(145deg, rgba(74, 144, 226, 0.2) 0%, rgba(255, 255, 255, 1) 100%);
}

.tech-btn:active {
  transform: translateY(0);
}
</style>

