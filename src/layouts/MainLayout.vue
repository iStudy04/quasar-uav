<template>
  <q-layout view="hHh lpR fFf" class="tech-layout">
    <!-- 顶部工具栏 -->
    <q-header elevated class="tech-header">
      <q-toolbar class="q-px-auto tech-toolbar">
        <q-btn flat dense round icon="menu" @click="drawer = !drawer" class="tech-btn" />
        <q-toolbar-title class="text-weight-bold tech-text">无人机集群操作系统</q-toolbar-title>
        <q-space />
        
        <!-- 设置按钮 -->
        <q-btn flat round icon="settings" class="tech-btn">
          <q-menu>
            <q-list style="min-width: 200px">
              <q-item clickable v-close-popup @click="goToSettings">
                <q-item-section avatar>
                  <q-icon name="tune" color="primary" />
                </q-item-section>
                <q-item-section>系统设置</q-item-section>
              </q-item>
              
              <q-item clickable v-close-popup @click="showUserInfo">
                <q-item-section avatar>
                  <q-icon name="account_circle" color="primary" />
                </q-item-section>
                <q-item-section>用户信息</q-item-section>
              </q-item>
              
              <q-separator />
              
              <q-item clickable v-close-popup @click="handleLogout">
                <q-item-section avatar>
                  <q-icon name="logout" color="negative" />
                </q-item-section>
                <q-item-section>退出登录</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <!-- 左侧菜单 -->
    <q-drawer v-model="drawer" show-if-above bordered :width="220" class="tech-drawer">
      <q-list padding class="tech-menu">
        <q-item clickable v-ripple to="/" exact class="tech-menu-item">
          <q-item-section avatar><q-icon name="dashboard" class="tech-icon" /></q-item-section>
          <q-item-section class="tech-text">主控制台</q-item-section>
        </q-item>

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

        </q-expansion-item>

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

        <q-expansion-item icon="assignment" label="任务指控" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/mission/scene" class="tech-menu-item">
            <q-item-section avatar><q-icon name="category" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">场景设置</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/mission/task" class="tech-menu-item">
            <q-item-section avatar><q-icon name="rule" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">任务设置</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/mission/ai-planning" class="tech-menu-item">
            <q-item-section avatar><q-icon name="smart_toy" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">AI 任务规划</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="cell_tower" label="集群图传" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/stream/video" class="tech-menu-item">
            <q-item-section avatar><q-icon name="videocam" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">视频传输</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/stream/semantic" class="tech-menu-item">
            <q-item-section avatar><q-icon name="image_search" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">语义图传</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="lan" label="网络管理" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/network/topology" class="tech-menu-item">
            <q-item-section avatar><q-icon name="hub" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">网络拓扑</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/network/cellular" class="tech-menu-item">
            <q-item-section avatar><q-icon name="network_cell" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">4G/5G通信</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/network/mesh" class="tech-menu-item">
            <q-item-section avatar><q-icon name="device_hub" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">自组网通信</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/network/select" class="tech-menu-item">
            <q-item-section avatar><q-icon name="swipe" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">网络选择</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="memory" label="算力管理" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/compute/sense" class="tech-menu-item">
            <q-item-section avatar><q-icon name="sensors" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">算力感知</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/compute/schedule" class="tech-menu-item">
            <q-item-section avatar><q-icon name="schedule" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">算力调度</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="psychology" label="无人机大模型" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/models/base" class="tech-menu-item">
            <q-item-section avatar><q-icon name="dataset" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人机基础模型</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/models/domain" class="tech-menu-item">
            <q-item-section avatar><q-icon name="label_important" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人机领域模型</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="security" label="无人机安全" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/security/auth" class="tech-menu-item">
            <q-item-section avatar><q-icon name="verified_user" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">身份认证</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/security/comm" class="tech-menu-item">
            <q-item-section avatar><q-icon name="vpn_lock" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">通信安全</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/security/info" class="tech-menu-item">
            <q-item-section avatar><q-icon name="shield" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">信息安全</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/security/func" class="tech-menu-item">
            <q-item-section avatar><q-icon name="fact_check" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">功能安全</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/security/model" class="tech-menu-item">
            <q-item-section avatar><q-icon name="account_tree" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">模型安全</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="view_in_ar" label="无人孪生平台" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/twin" class="tech-menu-item">
            <q-item-section avatar><q-icon name="view_in_ar" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">无人孪生平台</q-item-section>
          </q-item>
        </q-expansion-item>

        <q-expansion-item icon="storage" label="数据管理" header-class="tech-text" expand-separator>
          <q-item clickable v-ripple to="/data" class="tech-menu-item">
            <q-item-section avatar><q-icon name="storage" class="tech-icon" /></q-item-section>
            <q-item-section class="tech-text">数据管理</q-item-section>
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
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useDroneStore } from 'stores/drone'
import { useAuthStore } from 'stores/auth'

const drawer = ref(true)
const router = useRouter()
const $q = useQuasar()
const droneStore = useDroneStore()
const authStore = useAuthStore()

onMounted(() => {
  if (authStore.isAuthenticated) {
    droneStore.connectWebSocket()
  }
})

// 跳转到设置页面
function goToSettings() {
  router.push('/settings')
}

// 显示用户信息
function showUserInfo() {
  $q.dialog({
    title: '用户信息',
    message: `当前用户: ${authStore.username || '未知'}`,
    ok: {
      label: '确定',
      color: 'primary'
    }
  })
}

// 退出登录
function handleLogout() {
  $q.dialog({
    title: '确认退出',
    message: '确定要退出登录吗？',
    cancel: {
      label: '取消',
      color: 'grey',
      flat: true
    },
    ok: {
      label: '退出',
      color: 'negative'
    },
    persistent: true
  }).onOk(() => {
    authStore.logout()
    router.push('/login')
    $q.notify({
      type: 'positive',
      message: '已成功退出登录',
      position: 'top'
    })
  })
}
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




