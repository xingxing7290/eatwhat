<template>
  <div class="apply-container">
    <div class="apply-card">
      <RouterLink to="/login" class="back-link">返回登录</RouterLink>

      <div class="logo-section">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.08C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor"/>
          </svg>
        </div>
        <h1 class="page-title">申请账号</h1>
        <p class="page-subtitle">为你们的每一餐，留一个专属小家</p>
      </div>

      <el-form :model="form" :rules="rules" ref="formRef" label-width="0" class="apply-form">
        <el-form-item prop="displayName">
          <el-input
            v-model="form.displayName"
            placeholder="昵称，可选"
            clearable
            size="large"
            :prefix-icon="EditPen"
            class="custom-input"
          />
        </el-form-item>

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

        <el-form-item prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            size="large"
            :prefix-icon="Lock"
            class="custom-input"
          />
        </el-form-item>

        <el-button
          type="primary"
          :loading="loading"
          class="apply-btn"
          size="large"
          @click="onSubmit"
        >
          <span v-if="!loading">提交申请</span>
          <span v-else>提交中...</span>
        </el-button>
      </el-form>

      <div class="footer-tips">
        <p>已有账号？<RouterLink to="/login">直接登录</RouterLink></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, Lock, User } from '@element-plus/icons-vue'
import api from '@/services/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const form = ref({
  displayName: '',
  username: '',
  password: '',
  confirmPassword: ''
})

const onSubmit = async () => {
  await formRef.value?.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      await api.auth.register({
        displayName: form.value.displayName.trim(),
        username: form.value.username.trim(),
        password: form.value.password
      })
      ElMessage.success('账号申请成功，请登录')
      router.replace({
        name: 'login',
        query: { username: form.value.username.trim() }
      })
    } catch (e) {
      ElMessage.error(e?.error || '账号申请失败')
    } finally {
      loading.value = false
    }
  })
}

const rules = {
  displayName: [
    { max: 20, message: '昵称不能超过 20 个字符', trigger: 'blur' }
  ],
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
        if (value !== form.value.password) {
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
.apply-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  background: linear-gradient(135deg, #fff0df 0%, #ffd1bd 45%, #eaa0aa 100%);
  position: relative;
  overflow: hidden;
}

.apply-container::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(90deg, rgba(141, 90, 80, 0.13) 1px, transparent 1px),
    linear-gradient(0deg, rgba(141, 90, 80, 0.1) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.22;
}

.apply-card {
  width: 440px;
  padding: 36px 40px 40px;
  background: rgba(255, 250, 243, 0.94);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow:
    0 22px 50px rgba(121, 76, 47, 0.16),
    0 0 0 1px rgba(255, 255, 255, 0.45);
  position: relative;
  z-index: 1;
}

.back-link {
  display: inline-flex;
  align-items: center;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  margin-bottom: 24px;
  transition: color 0.2s ease;
}

.back-link:hover {
  color: var(--primary-color);
}

.logo-section {
  text-align: center;
  margin-bottom: 30px;
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
  box-shadow: 0 10px 26px rgba(216, 95, 101, 0.28);
}

.logo-icon svg {
  width: 34px;
  height: 34px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-subtitle {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.apply-form {
  margin-bottom: 22px;
}

.custom-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  border: 2px solid var(--border-color);
  transition: all 0.3s ease;
  background: var(--bg-secondary);
}

.custom-input :deep(.el-input__wrapper:hover),
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

.apply-btn {
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

.apply-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(216, 95, 101, 0.32);
}

.footer-tips {
  text-align: center;
  font-size: 14px;
  color: var(--text-secondary);
}

.footer-tips a {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
}

.footer-tips a:hover {
  color: var(--secondary-color);
}

@media (max-width: 480px) {
  .apply-card {
    width: 100%;
    padding: 30px 24px 32px;
  }

  .page-title {
    font-size: 24px;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
  }
}
</style>
