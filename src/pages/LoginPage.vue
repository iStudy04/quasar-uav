<template>
  <q-page class="login-page">
    <!-- 简洁背景 -->
    <div class="background">
      <div class="grid-pattern"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-container">
      <div class="login-card">
        <!-- 头部 -->
        <div class="login-header">
          <div class="logo-container">
            <q-icon name="flight" size="40px" class="logo-icon" />
          </div>
          <h1 class="login-title">无人机集群操作系统</h1>
          <p class="login-subtitle">UAV Cluster Management System</p>
        </div>

        <!-- 表单 -->
        <q-form @submit.prevent="onSubmit" class="login-form">
          <q-input
            v-model="username"
            placeholder="用户名"
            outlined
            autocomplete="username"
            :disable="loading"
            class="modern-input"
          >
            <template v-slot:prepend>
              <q-icon name="person" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            placeholder="密码"
            :type="showPassword ? 'text' : 'password'"
            outlined
            autocomplete="current-password"
            :disable="loading"
            class="modern-input"
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-btn
            type="submit"
            label="登录"
            class="login-btn"
            unelevated
            :loading="loading"
          >
            <template v-slot:loading>
              <q-spinner-dots />
            </template>
          </q-btn>
        </q-form>

        <!-- 底部 -->
        <div class="login-footer">
          <span class="footer-text">@Originated from NUAA </span>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useAuthStore } from 'stores/auth'

const $q = useQuasar()
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function onSubmit () {
  if (!username.value || !password.value) {
    $q.notify({ type: 'negative', message: '请输入用户名和密码' })
    return
  }

  loading.value = true
  try {
    await auth.login(username.value, password.value)
    const redirect = route.query.redirect || '/'
    router.replace(redirect)
  } catch (e) {
    const msg = e?.response?.data?.detail || e?.message || '登录失败'
    $q.notify({ type: 'negative', message: msg })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

// 简洁背景
.background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0a0e27;
  z-index: 0;
}

.grid-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    linear-gradient(rgba(74, 144, 226, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(74, 144, 226, 0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  opacity: 0.5;
}

// 登录容器
.login-container {
  position: relative;
  z-index: 1;
  width: 420px;
  max-width: 90vw;
}

// 卡片
.login-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 56px 48px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(255, 255, 255, 0.12);
  }
}

// 头部
.login-header {
  text-align: center;
  margin-bottom: 48px;
}

.logo-container {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-bottom: 24px;
}

.logo-icon {
  color: #4a90e2;
}

.login-title {
  font-size: 24px;
  font-weight: 600;
  color: #ffffff;
  margin: 0 0 8px 0;
  letter-spacing: 0.5px;
}

.login-subtitle {
  font-size: 13px;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  letter-spacing: 0.5px;
}

// 表单
.login-form {
  margin-bottom: 32px;
}

.modern-input {
  margin-bottom: 20px;

  :deep(.q-field__control) {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    height: 48px;
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.15);
    }
  }

  :deep(.q-field__control):focus-within {
    background: rgba(255, 255, 255, 0.08);
    border-color: #4a90e2;
  }

  :deep(input) {
    color: #ffffff;
    font-size: 14px;
    font-weight: 400;
  }

  :deep(input::placeholder) {
    color: rgba(255, 255, 255, 0.3);
  }

  :deep(.q-icon) {
    color: rgba(255, 255, 255, 0.4);
  }
}

// 登录按钮
.login-btn {
  width: 100%;
  height: 48px;
  background: #4a90e2;
  color: #ffffff;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  letter-spacing: 0.5px;
  transition: all 0.2s ease;
  margin-top: 8px;

  &:hover {
    background: #5a9ff2;
  }

  &:active {
    background: #3a80d2;
  }

  :deep(.q-spinner-dots) {
    color: white;
  }
}

// 底部
.login-footer {
  text-align: center;
  padding-top: 32px;
}

.footer-text {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 0.5px;
}

// 响应式
@media (max-width: 600px) {
  .login-card {
    padding: 40px 32px;
  }

  .login-title {
    font-size: 22px;
  }

  .login-subtitle {
    font-size: 12px;
  }
}
</style>


