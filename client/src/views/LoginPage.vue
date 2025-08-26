<template>
  <div class="login-container">
    <div class="login-card">
      <h2>登录</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" show-password />
        </el-form-item>
        <el-button type="primary" :loading="loading" class="login-btn" @click="onSubmit">登录</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import api from '@/services/api'

const formRef = ref()
const loading = ref(false)
const form = ref({ username: '', password: '' })

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

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f6f9ff 0%, #eef2f7 100%);
}
.login-card {
  width: 360px;
  padding: 32px 28px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.06);
}
.login-card h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}
.login-btn {
  width: 100%;
}
</style> 