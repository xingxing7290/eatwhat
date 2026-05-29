<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
    
    <!-- 主登录卡片 -->
    <div class="login-card">
      <!-- Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
            <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="currentColor"/>
            <path d="M5 6L5.37 7.37L6.74 7.74L5.37 8.11L5 9.48L4.63 8.11L3.26 7.74L4.63 7.37L5 6Z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="app-title">安排吃啥</h1>
        <p class="app-subtitle">记录每一餐，也记录彼此的日常</p>
      </div>

      <!-- 登录表单 -->
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名" 
            clearable 
            size="large"
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码" 
            show-password 
            size="large"
            :prefix-icon="Lock"
            class="custom-input"
          />
        </el-form-item>

        <div class="login-options">
          <el-checkbox v-model="rememberPassword">记住密码</el-checkbox>
        </div>
        
        <el-button 
          type="primary" 
          :loading="loading" 
          class="login-btn" 
          size="large"
          @click="onSubmit"
        >
          <span v-if="!loading">立即登录</span>
          <span v-else>登录中...</span>
        </el-button>
      </el-form>

      <!-- 底部提示 -->
      <div class="footer-tips">
        <p>还没有账号？<RouterLink to="/apply-account">申请账号</RouterLink></p>
      </div>
    </div>

  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '@/services/api'

const REMEMBER_LOGIN_KEY = 'eatwhat_remember_login'

const route = useRoute()
const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = ref({ username: '', password: '' })
const rememberPassword = ref(false)

const loadRememberedLogin = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(REMEMBER_LOGIN_KEY) || '{}')
    if (saved?.remember) {
      rememberPassword.value = true
      form.value.username = saved.username || ''
      form.value.password = saved.password || ''
    }
  } catch (_) {
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
  }

  const usernameFromApply = typeof route.query.username === 'string' ? route.query.username : ''
  if (usernameFromApply) {
    form.value.username = usernameFromApply
  }
}

const persistRememberedLogin = () => {
  if (!rememberPassword.value) {
    localStorage.removeItem(REMEMBER_LOGIN_KEY)
    return
  }

  localStorage.setItem(REMEMBER_LOGIN_KEY, JSON.stringify({
    remember: true,
    username: form.value.username,
    password: form.value.password
  }))
}

const onSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      loading.value = true
      const res = await api.auth.login(form.value)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      persistRememberedLogin()
      ElMessage.success('登录成功')
      const redirect = typeof route.query.redirect === 'string' && route.query.redirect ? route.query.redirect : '/'
      router.replace(redirect)
    } catch (e) {
      ElMessage.error(e?.error || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(loadRememberedLogin)
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff0df 0%, #ffd1bd 45%, #eaa0aa 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(141, 90, 80, 0.13) 1px, transparent 1px),
    linear-gradient(0deg, rgba(141, 90, 80, 0.1) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.22;
}

.circle {
  display: none;
}

.circle-1 {
  width: 200px;
  height: 200px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.circle-2 {
  width: 150px;
  height: 150px;
  top: 60%;
  right: 15%;
  animation-delay: 2s;
}

.circle-3 {
  width: 100px;
  height: 100px;
  bottom: 20%;
  left: 20%;
  animation-delay: 4s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(180deg); }
}

/* 主登录卡片 */
.login-card {
  width: 420px;
  padding: 40px;
  background: rgba(255, 250, 243, 0.94);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 22px 50px rgba(121, 76, 47, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.45);
  position: relative;
  z-index: 10;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 32px;
}

.logo-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background: var(--gradient-primary);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: 0 10px 26px rgba(216, 95, 101, 0.28);
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.app-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 400;
}

/* 登录表单 */
.login-form {
  margin-bottom: 20px;
}

.login-options {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin: -4px 0 18px;
  color: var(--text-secondary);
}

.login-options :deep(.el-checkbox__label) {
  color: var(--text-secondary);
  font-weight: 500;
}

.login-options :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background-color: var(--primary-color);
  border-color: var(--primary-color);
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  background: var(--bg-secondary);
}

.custom-input :deep(.el-input__wrapper:hover) {
  border-color: var(--primary-color);
  background: var(--bg-primary);
}

.custom-input :deep(.el-input__wrapper.is-focus) {
  border-color: var(--primary-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(216, 95, 101, 0.14);
}

.custom-input :deep(.el-input__inner) {
  height: 48px;
  font-size: 16px;
}

.custom-input :deep(.el-input__prefix-inner) {
  font-size: 18px;
  color: var(--primary-color);
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  background: var(--gradient-primary);
  border: none;
  transition: all 0.3s ease;
  margin-top: 8px;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(216, 95, 101, 0.32);
}

.login-btn:active {
  transform: translateY(0);
}

/* 底部提示 */
.footer-tips {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-tips a {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
}

.footer-tips a:hover {
  color: var(--secondary-color);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .login-card {
    width: 90%;
    padding: 32px 24px;
    margin: 20px;
  }
  
  .app-title {
    font-size: 24px;
  }
  
  .logo-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }
}

/* 弹窗样式优化 */
:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: var(--gradient-primary);
  color: white;
  padding: 20px 24px;
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 24px;
}

:deep(.el-dialog__footer) {
  padding: 16px 24px 24px;
  border-top: 1px solid var(--border-color);
}

/* 表单验证样式 */
:deep(.el-form-item.is-error .el-input__wrapper) {
  border-color: #f56c6c;
  box-shadow: 0 0 0 3px rgba(245, 108, 108, 0.1);
}

:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}
</style> 