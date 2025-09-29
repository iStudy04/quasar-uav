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
    <q-drawer v-model="drawer" show-if-above bordered :width="220" class="tech-drawer">
      <q-list padding class="tech-menu">
        <q-item clickable v-ripple to="/" exact class="tech-menu-item">
          <q-item-section avatar><q-icon name="dashboard" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">主控制台</q-item-section>
        </q-item>

        <q-expansion-item icon="hub" label="集群管理" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/cluster/ingress" class="tech-menu-item">
            <q-item-section avatar><q-icon name="login" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人机接入</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/cluster/auth" class="tech-menu-item">
            <q-item-section avatar><q-icon name="verified_user" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人机认证</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/cluster/status" class="tech-menu-item">
            <q-item-section avatar><q-icon name="insights" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人机状态</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="flight_takeoff" label="单机控制" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/single/flight" class="tech-menu-item">
            <q-item-section avatar><q-icon name="flight" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">飞行控制</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/single/avoidance" class="tech-menu-item">
            <q-item-section avatar><q-icon name="radar" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">单机避障</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/single/path-planning" class="tech-menu-item">
            <q-item-section avatar><q-icon name="route" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">航迹规划</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/single/vln" class="tech-menu-item">
            <q-item-section avatar><q-icon name="psychology" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">视觉语言导航</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/single/voice" class="tech-menu-item">
            <q-item-section avatar><q-icon name="keyboard_voice" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">语音控制</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="groups" label="集群控制" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/swarm/control" class="tech-menu-item">
            <q-item-section avatar><q-icon name="tune" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">协同控制</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/swarm/formation" class="tech-menu-item">
            <q-item-section avatar><q-icon name="polyline" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">协同编队</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/swarm/avoidance" class="tech-menu-item">
            <q-item-section avatar><q-icon name="sensors" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">协同避障</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/swarm/vision-voice" class="tech-menu-item">
            <q-item-section avatar><q-icon name="smart_toy" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">视觉语音导航</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/swarm/voice" class="tech-menu-item">
            <q-item-section avatar><q-icon name="record_voice_over" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">语音控制</q-item-section>
          </q-item>
        </q-expansion-item>
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 248, 250, 0.98) 100%);
  border-right: 1px solid rgba(74, 144, 226, 0.2);
  box-shadow: 4px 0 20px rgba(74, 144, 226, 0.1);
}

.tech-menu {
  background: transparent;
}

.tech-menu-item {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
  border: 1px solid rgba(74, 144, 226, 0.1);
}

.tech-menu-item:hover {
  background: rgba(74, 144, 226, 0.08);
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.15);
  transform: translateX(2px);
}

.tech-menu-item.router-link-active {
  background: linear-gradient(135deg, rgba(74, 144, 226, 0.1) 0%, rgba(74, 144, 226, 0.05) 100%);
  border-left: 3px solid #4A90E2;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.2);
}

.tech-icon {
  color: #4A90E2;
  text-shadow: 0 0 8px rgba(74, 144, 226, 0.3);
}

.tech-page-container {
  background: transparent;
}
</style>


