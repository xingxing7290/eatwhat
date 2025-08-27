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
        <p class="app-subtitle">让每一餐都充满惊喜</p>
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
        <p>还没有账号？<a href="#" @click.prevent="showRegister = true">立即注册</a></p>
      </div>
    </div>

    <!-- 注册弹窗 -->
    <el-dialog v-model="showRegister" title="用户注册" width="400px" center>
      <el-form :model="registerForm" :rules="registerRules" ref="registerFormRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showRegister = false">取消</el-button>
          <el-button type="primary" @click="onRegister" :loading="registerLoading">注册</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import api from '@/services/api'

const formRef = ref()
const registerFormRef = ref()
const loading = ref(false)
const registerLoading = ref(false)
const showRegister = ref(false)
const form = ref({ username: '', password: '' })
const registerForm = ref({ 
  username: '', 
  password: '', 
  confirmPassword: '' 
})

const onSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      loading.value = true
      const res = await api.auth.login(form.value)
      localStorage.setItem('token', res.token)
      localStorage.setItem('user', JSON.stringify(res.user))
      ElMessage.success('登录成功')
      window.location.href = '/'
    } catch (e) {
      ElMessage.error(e?.error || '登录失败')
    } finally {
      loading.value = false
    }
  })
}

const onRegister = async () => {
  await registerFormRef.value?.validate(async (valid) => {
    if (!valid) return
    try {
      registerLoading.value = true
      await api.auth.register({
        username: registerForm.value.username,
        password: registerForm.value.password
      })
      ElMessage.success('注册成功，请登录')
      showRegister.value = false
      // 自动填充用户名
      form.value.username = registerForm.value.username
      registerForm.value = { username: '', password: '', confirmPassword: '' }
    } catch (e) {
      ElMessage.error(e?.error || '注册失败')
    } finally {
      registerLoading.value = false
    }
  })
}

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于 6 个字符', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== registerForm.value.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 6s ease-in-out infinite;
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
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 0 0 1px rgba(255, 255, 255, 0.2);
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
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 32px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
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
  margin-bottom: 24px;
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
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
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
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
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