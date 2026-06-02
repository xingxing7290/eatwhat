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

    <el-card class="settings-card theme-settings-card">
      <template #header>
        <div class="card-header">
          <span>主题色</span>
          <el-tag>{{ currentThemeLabel }}</el-tag>
        </div>
      </template>
      <div class="theme-grid">
        <button
          v-for="theme in themeOptions"
          :key="theme.value"
          type="button"
          class="theme-card"
          :class="{ active: selectedTheme === theme.value }"
          @click="selectTheme(theme.value)"
        >
          <span class="theme-name">{{ theme.label }}</span>
          <span class="theme-desc">{{ theme.desc }}</span>
          <span class="theme-swatches">
            <span
              v-for="color in theme.colors"
              :key="color"
              class="theme-swatch"
              :style="{ backgroundColor: color }"
            ></span>
          </span>
        </button>
      </div>
    </el-card>



    <el-card class="settings-card">
      <template #header><div class="card-header"><span>默认菜品管理</span><el-tag>{{ defaultStatus.imported }}/{{ defaultStatus.total }}</el-tag></div></template>
      <div class="governance-row">
        <div class="governance-metric"><span>缺失默认菜品</span><strong>{{ defaultStatus.missing }}</strong></div>
        <el-button type="primary" :loading="defaultLoading" @click="importMissingDefaultMeals">导入缺失默认菜品</el-button>
        <el-button :loading="defaultLoading" @click="restoreDefaultImages">恢复默认菜品图片</el-button>
      </div>
    </el-card>

    <el-card class="settings-card">
      <template #header><div class="card-header"><span>待修正图片</span><el-tag type="warning">{{ imageIssues.length }}</el-tag></div></template>
      <el-empty v-if="!imageIssues.length" description="暂无待修正图片" />
      <div v-else class="issue-list">
        <div v-for="issue in imageIssues" :key="issue._id" class="issue-item">
          <img v-if="issue.mealId?.imageUrl" :src="issue.mealId.imageUrl" />
          <div class="issue-main">
            <strong>{{ issue.mealId?.name || '未知菜品' }}</strong>
            <span>{{ issue.note || '图片与菜名不匹配' }}</span>
          </div>
          <el-button size="small" type="success" @click="resolveIssue(issue, 'fixed')">标记已修正</el-button>
          <el-button size="small" @click="resolveIssue(issue, 'ignored')">忽略</el-button>
        </div>
      </div>
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

const themeOptions = [
  { value: 'cream', label: '奶油原木', desc: '温柔奶白与焦糖木色', colors: ['#FDFBF7', '#F5EBE6', '#FFB4A2', '#E09F67'] },
  { value: 'peach', label: '蜜桃日常', desc: '适合记录甜一点的两人餐', colors: ['#FFF9F5', '#FFECE7', '#FF9D8F', '#F0786F'] },
  { value: 'caramel', label: '焦糖餐桌', desc: '像晚饭后的灯光和木桌', colors: ['#FFFAF0', '#F3E5D2', '#E7BD73', '#B97842'] },
  { value: 'matcha', label: '抹茶和风', desc: '清爽平和的日式小家感', colors: ['#FBFBF4', '#EDF1E3', '#B5C99A', '#6F8F62'] },
  { value: 'azuki', label: '红豆复古', desc: '偏轻复古的温暖手账色', colors: ['#FFF8F4', '#F3E4DF', '#D79A8F', '#8D5654'] },
  { value: 'mist', label: '晨雾蓝', desc: '安静干净的早餐与周末感', colors: ['#FBFCFB', '#E9F0EF', '#A7C4C9', '#6D8F99'] }
];
const selectedTheme = ref(localStorage.getItem('colorTheme') || 'cream');
const currentThemeLabel = computed(() => themeOptions.find(theme => theme.value === selectedTheme.value)?.label || themeOptions[0].label);

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
const defaultStatus = ref({ total: 0, imported: 0, missing: 0 });
const imageIssues = ref([]);
const defaultLoading = ref(false);
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
const loadGovernance = async () => {
  try {
    const [status, issues] = await Promise.all([api.defaultMeal.status(), api.mealImageIssue.list({ status: 'open' })]);
    defaultStatus.value = status || defaultStatus.value;
    imageIssues.value = issues || [];
  } catch (_) {}
};
const reload = async () => { applyProfile(await api.auth.me()); await loadGovernance(); };
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
const selectTheme = (theme) => {
  selectedTheme.value = theme;
  localStorage.setItem('colorTheme', theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent('eatwhat-theme-change', { detail: theme }));
  ElMessage.success('\u4e3b\u9898\u5df2\u5207\u6362');
};
const chooseFile = () => fileInputRef.value?.click();
const onFileChange = (e) => { avatarFile.value = e.target?.files?.[0] || null; };
const importMissingDefaultMeals = async () => {
  try { defaultLoading.value = true; const res = await api.defaultMeal.importMissing(); defaultStatus.value = res.after || res.status || defaultStatus.value; ElMessage.success('默认菜品已补齐'); }
  catch (e) { ElMessage.error(e?.error || '导入失败'); }
  finally { defaultLoading.value = false; }
};
const restoreDefaultImages = async () => {
  try { defaultLoading.value = true; const res = await api.defaultMeal.restoreImages(); defaultStatus.value = res.status || defaultStatus.value; ElMessage.success('默认菜品图片已恢复'); }
  catch (e) { ElMessage.error(e?.error || '恢复失败'); }
  finally { defaultLoading.value = false; }
};
const resolveIssue = async (issue, status) => {
  try { await api.mealImageIssue.update(issue._id, { status }); await loadGovernance(); ElMessage.success('已更新'); }
  catch (e) { ElMessage.error(e?.error || '更新失败'); }
};
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
.governance-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.governance-metric { min-width: 140px; background: var(--bg-secondary); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.governance-metric span, .issue-main span { color: var(--text-secondary); font-size: 13px; }
.governance-metric strong { font-size: 24px; color: var(--primary-color); }
.issue-list { display: flex; flex-direction: column; gap: 10px; }
.issue-item { display: grid; grid-template-columns: 64px 1fr auto auto; gap: 10px; align-items: center; padding: 10px; background: var(--bg-secondary); border-radius: 14px; }
.issue-item img { width: 64px; height: 52px; object-fit: cover; border-radius: 10px; }
.issue-main { display: flex; flex-direction: column; gap: 4px; }
.theme-settings-card { overflow: hidden; }
.theme-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.theme-card {
  appearance: none;
  width: 100%;
  min-height: 118px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 255, 255, 0.38));
  box-shadow: 0 12px 28px rgba(117, 78, 58, 0.08);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  text-align: left;
  transition: all 0.3s ease-in-out;
}
.theme-card:hover, .theme-card.active { transform: translateY(-2px); border-color: var(--secondary-color); box-shadow: 0 18px 36px rgba(117, 78, 58, 0.14); }
.theme-card.active { background: linear-gradient(135deg, rgba(255, 255, 255, 0.86), var(--bg-secondary)); }
.theme-name { font-size: 16px; font-weight: 700; }
.theme-desc { color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.theme-swatches { display: flex; gap: 7px; margin-top: auto; }
.theme-swatch { width: 24px; height: 24px; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.78); box-shadow: 0 4px 10px rgba(74, 62, 61, 0.14); }
@media (max-width: 640px) { .avatar-row, .avatar-actions, .invite-row { align-items: stretch; flex-direction: column; } .issue-item { grid-template-columns: 1fr; } .invite-row .el-input { min-width: 0; width: 100%; } .theme-grid { grid-template-columns: 1fr; } }
</style>