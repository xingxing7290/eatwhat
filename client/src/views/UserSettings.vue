<template>
  <div class="settings-page">
    <el-card class="settings-card">
      <template #header><div class="card-header"><span>用户设置</span></div></template>
      <el-form label-width="90px">
        <el-form-item label="头像">
          <div class="avatar-row">
            <div class="avatar-preview"><img v-if="user.avatarUrl" :src="user.avatarUrl" alt="avatar" /><div v-else class="avatar-placeholder">{{ initial }}</div></div>
            <div class="avatar-actions">
              <input ref="fileInputRef" type="file" accept="image/*" class="file-input" @change="onFileChange" />
              <el-button @click="chooseFile">选择图片</el-button>
              <el-button type="primary" :loading="avatarUploading" :disabled="!avatarFile" @click="uploadAvatar">上传头像</el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="昵称"><el-input v-model="displayName" placeholder="请输入昵称" maxlength="20" show-word-limit /></el-form-item>
        <el-form-item><el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button><el-button @click="reload">刷新</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card class="settings-card">
      <template #header><div class="card-header"><span>情侣小家</span><el-tag>{{ household.name || '未设置' }}</el-tag></div></template>
      <el-form label-width="90px">
        <el-form-item label="小家名称"><el-input v-model="householdName" placeholder="给你们的小家取个名字" /></el-form-item>
        <el-form-item label="邀请码">
          <div class="invite-row"><el-input :model-value="household.inviteCode" readonly /><el-button @click="copyInvite">复制</el-button><el-button :loading="refreshing" @click="refreshInvite">刷新</el-button></div>
        </el-form-item>
        <el-form-item label="加入小家">
          <div class="invite-row"><el-input v-model="joinCode" placeholder="输入伴侣的邀请码" /><el-button type="primary" :loading="joining" @click="joinHousehold">加入</el-button></div>
        </el-form-item>
        <el-form-item label="成员">
          <div class="member-list"><div v-for="member in household.members || []" :key="member._id || member.id" class="member-item"><div class="member-avatar"><img v-if="member.avatarUrl" :src="member.avatarUrl" /><span v-else>{{ memberInitial(member) }}</span></div><span>{{ member.displayName || member.username }}</span></div></div>
        </el-form-item>
        <el-form-item><el-button type="primary" :loading="householdSaving" @click="saveHousehold">保存小家</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

const user = ref({ id: '', username: '', displayName: '', avatarUrl: '' });
const household = ref({ name: '', inviteCode: '', members: [] });
const displayName = ref('');
const householdName = ref('');
const joinCode = ref('');
const saving = ref(false);
const householdSaving = ref(false);
const refreshing = ref(false);
const joining = ref(false);
const avatarFile = ref(null);
const avatarUploading = ref(false);
const fileInputRef = ref(null);
const initial = computed(() => memberInitial(user.value));
const memberInitial = (member) => ((member?.displayName || member?.username || '').trim().slice(0, 1).toUpperCase());

const applyProfile = (res) => {
  user.value = res.user || user.value;
  household.value = res.household || res.user?.household || household.value;
  displayName.value = user.value.displayName || '';
  householdName.value = household.value.name || '';
  localStorage.setItem('user', JSON.stringify(user.value));
};
const reload = async () => applyProfile(await api.auth.me());
const saveProfile = async () => {
  try { saving.value = true; applyProfile(await api.auth.updateProfile({ displayName: displayName.value })); ElMessage.success('保存成功'); }
  catch (e) { ElMessage.error(e?.error || '保存失败'); }
  finally { saving.value = false; }
};
const saveHousehold = async () => {
  try { householdSaving.value = true; const res = await api.household.update({ name: householdName.value }); household.value = res.household; ElMessage.success('小家已更新'); }
  catch (e) { ElMessage.error(e?.error || '保存小家失败'); }
  finally { householdSaving.value = false; }
};
const refreshInvite = async () => {
  try { refreshing.value = true; const res = await api.household.refreshInvite(); household.value = res.household; ElMessage.success('邀请码已刷新'); }
  catch (e) { ElMessage.error(e?.error || '刷新失败'); }
  finally { refreshing.value = false; }
};
const joinHousehold = async () => {
  if (!joinCode.value.trim()) return ElMessage.warning('请输入邀请码');
  try { joining.value = true; applyProfile(await api.household.join(joinCode.value)); joinCode.value = ''; ElMessage.success('已加入小家'); }
  catch (e) { ElMessage.error(e?.error || '加入失败'); }
  finally { joining.value = false; }
};
const copyInvite = async () => {
  try { await navigator.clipboard.writeText(household.value.inviteCode || ''); ElMessage.success('邀请码已复制'); }
  catch (_) { ElMessage.warning(`邀请码：${household.value.inviteCode}`); }
};
const chooseFile = () => fileInputRef.value?.click();
const onFileChange = (e) => { avatarFile.value = e.target?.files?.[0] || null; };
const uploadAvatar = async () => {
  if (!avatarFile.value) return;
  try {
    avatarUploading.value = true;
    const fd = new FormData();
    fd.append('avatar', avatarFile.value);
    applyProfile(await api.auth.uploadAvatar(fd));
    avatarFile.value = null;
    if (fileInputRef.value) fileInputRef.value.value = '';
    ElMessage.success('头像已更新');
  } catch (e) { ElMessage.error(e?.error || '上传失败'); }
  finally { avatarUploading.value = false; }
};
onMounted(async () => { try { await reload(); } catch (e) { ElMessage.error(e?.error || '获取用户信息失败'); } });
</script>

<style scoped>
.settings-page { max-width: 820px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.settings-card { border-radius: 12px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.avatar-row { display: flex; align-items: center; gap: 16px; }
.avatar-preview, .member-avatar { border-radius: 999px; overflow: hidden; background: rgba(216, 95, 101, 0.14); display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.avatar-preview { width: 56px; height: 56px; }
.member-avatar { width: 36px; height: 36px; color: rgba(141, 90, 80, 0.95); font-weight: 700; }
.avatar-preview img, .member-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-placeholder { font-weight: 700; color: rgba(141, 90, 80, 0.95); }
.avatar-actions, .invite-row, .member-list { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.invite-row .el-input { flex: 1; min-width: 220px; }
.member-list { gap: 12px; }
.member-item { display: flex; align-items: center; gap: 8px; background: var(--bg-secondary); border-radius: 999px; padding: 6px 12px 6px 6px; }
.file-input { display: none; }
@media (max-width: 640px) { .avatar-row, .avatar-actions, .invite-row { align-items: stretch; flex-direction: column; } .invite-row .el-input { min-width: 0; width: 100%; } }
</style>