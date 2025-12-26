<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span>用户设置</span>
        </div>
      </template>

      <el-form label-width="90px">
        <el-form-item label="头像">
          <div class="avatar-row">
            <div class="avatar-preview">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" />
              <div v-else class="avatar-placeholder">{{ initial }}</div>
            </div>

            <div class="avatar-actions">
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="file-input"
                @change="onFileChange"
              />
              <el-button @click="chooseFile">选择图片</el-button>
              <el-button type="primary" :loading="avatarUploading" :disabled="!avatarFile" @click="uploadAvatar">
                上传头像
              </el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-model="displayName" placeholder="请输入昵称" maxlength="20" show-word-limit />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
          <el-button @click="reload">刷新</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

const user = ref({ id: '', username: '', displayName: '', avatarUrl: '' });
const displayName = ref('');
const saving = ref(false);

const avatarFile = ref(null);
const avatarUploading = ref(false);
const fileInputRef = ref(null);

const initial = computed(() => {
  const name = (user.value.displayName || user.value.username || '').trim();
  return name ? name.slice(0, 1).toUpperCase() : '';
});

const reload = async () => {
  const res = await api.auth.me();
  user.value = res.user;
  displayName.value = user.value.displayName || '';
  localStorage.setItem('user', JSON.stringify(res.user));
};

const saveProfile = async () => {
  try {
    saving.value = true;
    const res = await api.auth.updateProfile({ displayName: displayName.value });
    user.value = res.user;
    localStorage.setItem('user', JSON.stringify(res.user));
    ElMessage.success('保存成功');
  } catch (e) {
    ElMessage.error(e?.error || '保存失败');
  } finally {
    saving.value = false;
  }
};

const chooseFile = () => {
  fileInputRef.value?.click();
};

const onFileChange = (e) => {
  const file = e.target?.files?.[0];
  if (!file) {
    avatarFile.value = null;
    return;
  }
  avatarFile.value = file;
};

const uploadAvatar = async () => {
  if (!avatarFile.value) return;
  try {
    avatarUploading.value = true;
    const fd = new FormData();
    fd.append('avatar', avatarFile.value);
    const res = await api.auth.uploadAvatar(fd);
    user.value = res.user;
    localStorage.setItem('user', JSON.stringify(res.user));
    avatarFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    ElMessage.success('头像已更新');
  } catch (e) {
    ElMessage.error(e?.error || '上传失败');
  } finally {
    avatarUploading.value = false;
  }
};

onMounted(async () => {
  try {
    await reload();
  } catch (e) {
    ElMessage.error(e?.error || '获取用户信息失败');
  }
});
</script>

<style scoped>
.settings-page {
  max-width: 700px;
  margin: 0 auto;
}

.settings-card {
  border-radius: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-preview {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(102, 126, 234, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 56px;
}

.avatar-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-placeholder {
  font-weight: 700;
  color: rgba(102, 126, 234, 0.95);
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.file-input {
  display: none;
}
</style>
