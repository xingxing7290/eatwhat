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
        <h1 class="page-title">创建账号</h1>
        <p class="page-subtitle">创建自己的小家，或用邀请码加入家人</p>
      </div>

      <el-alert v-if="uncertain" class="uncertain-alert" title="注册结果未确认" type="warning" :closable="false" show-icon>
        请先用刚填写的用户名和密码尝试登录，避免重复创建账号。如果无法登录，再返回此页重新填写。
        <div><el-button link type="primary" @click="goToLogin">前往登录</el-button><el-button link @click="uncertain = false">继续填写</el-button></div>
      </el-alert>
      <el-alert v-if="invalidInviteLink" class="uncertain-alert" title="邀请链接中的邀请码过长，请向家人重新确认。" type="warning" :closable="false" show-icon />
      <div v-if="hasExistingSession && hasLinkInvite" class="existing-account">
        <p>已经登录？可以使用当前账号加入邀请的小家，无需重新注册。</p>
        <el-button :disabled="loading || uncertain || !form.inviteCode.trim() || form.inviteCode.trim().length > 20" @click="useCurrentAccount">使用当前账号加入</el-button>
      </div>
      <el-form :model="form" :rules="rules" ref="formRef" label-position="top" class="apply-form" :disabled="loading || uncertain" @submit.prevent="onSubmit">
        <div class="mode-heading">选择小家</div>
        <el-radio-group v-model="mode" class="mode-picker" aria-label="选择小家方式">
          <el-radio-button label="create">创建小家</el-radio-button>
          <el-radio-button label="join">加入已有小家</el-radio-button>
        </el-radio-group>
        <p class="mode-hint">{{ mode === 'join' ? '输入家人分享的邀请码，注册后加入对应小家。' : '注册后会创建一个独立小家，之后可以邀请家人加入。' }}</p>
        <el-form-item v-if="mode === 'create'" label="小家名称（可选）" prop="householdName">
          <el-input v-model="form.householdName" placeholder="小家名称，可选" clearable size="large" :prefix-icon="HomeFilled" class="custom-input" maxlength="40" />
        </el-form-item>
        <el-form-item v-else label="邀请码" prop="inviteCode">
          <el-input v-model="form.inviteCode" placeholder="请输入家人的邀请码" clearable size="large" :prefix-icon="Key" class="custom-input" maxlength="20" autocomplete="off" @input="invalidInviteLink = false" />
        </el-form-item>
        <el-form-item label="昵称（可选）" prop="displayName">
          <el-input
            v-model="form.displayName"
            placeholder="昵称，可选"
            clearable
            size="large"
            :prefix-icon="EditPen"
            class="custom-input"
            maxlength="20"
            autocomplete="nickname"
          />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            clearable
            size="large"
            :prefix-icon="User"
            class="custom-input"
            autocomplete="username"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
            size="large"
            :prefix-icon="Lock"
            class="custom-input"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            show-password
            size="large"
            :prefix-icon="Lock"
            class="custom-input"
            autocomplete="new-password"
          />
        </el-form-item>

        <el-button
          type="primary"
          :loading="loading"
          class="apply-btn"
          size="large"
          native-type="submit"
        >
          <span v-if="!loading">创建账号</span>
          <span v-else>创建中...</span>
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { EditPen, HomeFilled, Key, Lock, User } from '@element-plus/icons-vue'
import api from '@/services/api'

const router = useRouter()
const route = useRoute()
const formRef = ref()
const loading = ref(false)
const uncertain = ref(false)
const hasExistingSession = !!localStorage.getItem('token')
const hashParams = new URLSearchParams(route.hash.startsWith('#') ? route.hash.slice(1) : '')
const linkInvite = hashParams.get('invite') || (typeof route.query.invite === 'string' ? route.query.invite : '')
const hasLinkInvite = !!linkInvite.trim()
const invalidInviteLink = ref(linkInvite.trim().length > 20)
const inviteFromLink = invalidInviteLink.value ? '' : linkInvite.trim()
const mode = ref(hasLinkInvite ? 'join' : 'create')
const form = ref({
  displayName: '',
  householdName: '',
  inviteCode: inviteFromLink,
  username: '',
  password: '',
  confirmPassword: ''
})

// Remove the capability-like invite code from the visible address once read.
if (linkInvite) {
  const { invite, ...query } = route.query
  hashParams.delete('invite')
  const rest = hashParams.toString()
  router.replace({ path: route.path, query, hash: rest ? `#${rest}` : '' })
}

const goToLogin = () => router.push({ name: 'login', query: { username: form.value.username.trim() } })
const useCurrentAccount = () => {
  const code = form.value.inviteCode.trim()
  if (!code || code.length > 20) return ElMessage.warning('请确认邀请码后再加入')
  return router.push({ name: 'settings', hash: `#invite=${encodeURIComponent(code)}` })
}
const onSubmit = async () => {
  if (loading.value || uncertain.value || !formRef.value) return
  loading.value = true
  try {
    let valid = false
    try { valid = await formRef.value.validate() } catch (_) { return }
    if (!valid) return
    try {
      const result = await api.auth.register({
        displayName: form.value.displayName.trim(),
        householdName: mode.value === 'create' ? form.value.householdName.trim() : '',
        inviteCode: mode.value === 'join' ? form.value.inviteCode.trim().toUpperCase() : '',
        username: form.value.username.trim(),
        password: form.value.password
      })
      if (!result?.user?.id) throw new Error('注册响应不完整')
      ElMessage.success('账号已创建，请登录')
      await router.replace({
        name: 'login',
        query: { username: form.value.username.trim() }
      })
    } catch (e) {
      const message = e?.error || ''
      if (message === '邀请码无效' || message === '用户名已存在') ElMessage.error(message)
      else uncertain.value = true
    }
  } finally { loading.value = false }
}

const rules = {
  displayName: [
    { max: 20, message: '昵称不能超过 20 个字符', trigger: 'blur' }
  ],
  householdName: [
    { max: 40, message: '小家名称不能超过 40 个字符', trigger: 'blur' }
  ],
  inviteCode: [
    { validator: (_, value, callback) => mode.value !== 'join' || (typeof value === 'string' && value.trim()) ? callback() : callback(new Error('请输入邀请码')), trigger: 'blur' },
    { max: 20, message: '邀请码不能超过 20 个字符', trigger: 'blur' }
  ],
  username: [
    { validator: (_, value, callback) => typeof value === 'string' && value.trim().length >= 3 && value.trim().length <= 20 ? callback() : callback(new Error('用户名长度在 3 到 20 个字符')), trigger: 'blur' }
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
.mode-heading { font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 10px; }
.mode-picker { display: flex; width: 100%; }
.mode-picker :deep(.el-radio-button) { flex: 1; }
.mode-picker :deep(.el-radio-button__inner) { width: 100%; }
.mode-hint { margin: 10px 0 18px; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.uncertain-alert { margin-bottom: 20px; }
.existing-account { margin-bottom: 20px; padding: 14px; border-radius: 14px; background: var(--bg-secondary); }
.existing-account p { margin: 0 0 10px; font-size: 13px; line-height: 1.5; color: var(--text-secondary); }
.uncertain-alert :deep(.el-alert__description) { line-height: 1.6; }
.apply-form :deep(.el-form-item__label) { line-height: 1.4; padding-bottom: 6px; color: var(--text-primary); font-weight: 600; }

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
