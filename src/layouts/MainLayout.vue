<template>
  <q-layout view="hHh lpR fFf" class="tech-layout">
    <!-- 顶部工具栏 -->
    <q-header elevated class="tech-header">
      <q-toolbar class="q-px-auto tech-toolbar">
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="tech-btn" />
        <q-toolbar-title class="text-weight-bold tech-text">无人机控制系统</q-toolbar-title>
        <q-space />
        <q-btn flat icon="settings" class="tech-btn"/>
      </q-toolbar>
    </q-header>

    <!-- 左侧菜单 -->
    <q-drawer v-model="drawer" show-if-above bordered :width="200" class="tech-drawer">
      <q-list padding class="tech-menu">
        <q-item clickable v-ripple to="/" exact class="tech-menu-item">
          <q-item-section avatar><q-icon name="dashboard" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">主控制台</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/terrain" class="tech-menu-item">
          <q-item-section avatar><q-icon name="terrain" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">3D地形图</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="tech-menu-item">
          <q-item-section avatar><q-icon name="flight_takeoff" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">无人机管理</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="tech-menu-item">
          <q-item-section avatar><q-icon name="videocam" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">摄像头画面</q-item-section>
        </q-item>
        <q-item clickable v-ripple class="tech-menu-item">
          <q-item-section avatar><q-icon name="settings_remote" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">控制面板</q-item-section>
        </q-item>
        <q-item clickable v-ripple to="/registration" class="tech-menu-item">
          <q-item-section avatar><q-icon name="person_add" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">用户注册</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <!-- 页面主体 -->
    <q-page-container class="tech-page-container">
      <router-view/>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useDroneStore } from 'stores/drone'

const drawer = ref(true)
const droneStore = useDroneStore() // 获取store实例

onMounted(() => {
  // 当组件挂载后，开始连接WebSocket
  droneStore.connectWebSocket()
})
</script>


<style scoped>
.tech-layout {
  background: linear-gradient(135deg, #F5F8FA 0%, #E3F2FD 50%, #F5F8FA 100%);
}

.tech-header {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border-bottom: 1px solid #4A90E2;
  box-shadow: 0 4px 20px rgba(74, 144, 226, 0.15);
}

.tech-toolbar {
  background: transparent;
}

.tech-btn {
  color: #4A90E2;
  text-shadow: 0 0 5px rgba(74, 144, 226, 0.2);
}

.tech-btn:hover {
  background: rgba(74, 144, 226, 0.1);
  box-shadow: 0 0 10px rgba(74, 144, 226, 0.2);
}

.tech-text {
  color: #2C3E50;
  text-shadow: 0 0 2px rgba(44, 62, 80, 0.1);
}

.tech-drawer {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 248, 250, 0.95) 100%);
  border-right: 1px solid #4A90E2;
  box-shadow: 4px 0 20px rgba(74, 144, 226, 0.15);
}

.tech-menu {
  background: transparent;
}

.tech-menu-item {
  background: rgba(74, 144, 226, 0.05);
  border-radius: 8px;
  margin: 4px 0;
  transition: all 0.3s ease;
}

.tech-menu-item:hover {
  background: rgba(74, 144, 226, 0.1);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.2);
}

.tech-menu-item {
  background: rgba(74, 144, 226, 0.2);
  border-left: 3px solid #4A90E2;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.tech-icon {
  color: #4A90E2;
  text-shadow: 0 0 8px rgba(74, 144, 226, 0.3);
}

.tech-page-container {
  background: transparent;
}
</style>


