<template>
  <div class="settings-page">
    <header class="settings-intro"><div><span class="eyebrow">YOUR HOME, YOUR WAY</span><h1>小家设置</h1><p>管理个人资料、家庭成员和餐桌的样子。</p></div><span class="intro-badge">把日常过成喜欢的模样</span></header>
    <el-alert v-if="profileError" :title="profileError" type="error" :closable="false" show-icon><el-button link type="primary" :loading="profileLoading" @click="reload">重新加载</el-button></el-alert>
    <el-alert v-if="joinUncertain" title="家庭切换结果未确认" type="warning" :closable="false" show-icon>请先重新核对当前家庭，再决定是否重试；在确认前本页的家庭操作暂不可用。 <el-button link type="primary" :loading="profileLoading" @click="reload">重新核对家庭</el-button></el-alert>
    <el-alert v-if="inviteUncertain" title="邀请码刷新结果未确认" type="warning" :closable="false" show-icon>旧邀请码可能已经失效，请重新核对后再复制或分享。 <el-button link type="primary" :loading="profileLoading" @click="reload">重新核对邀请码</el-button></el-alert>
    <el-alert v-if="invalidInviteLink" title="邀请链接中的邀请码过长，请向家人重新确认。" type="warning" :closable="false" show-icon />
    <el-card class="settings-card">
      <template #header><div class="card-header"><span>用户设置</span></div></template>
      <el-form label-width="90px" :disabled="profileLoading || !profileReady || !!profileError || joinUncertain || inviteUncertain || saving || avatarUploading || householdSaving || refreshing || joining">
        <el-form-item label="头像">
          <div class="avatar-row">
            <div class="avatar-preview"><img v-if="avatarPreview || user.avatarUrl" :src="avatarPreview || resolveUploadedImage(user.avatarUrl)" alt="头像预览" /><div v-else class="avatar-placeholder">{{ initial }}</div></div>
            <div class="avatar-actions">
              <input ref="fileInputRef" type="file" accept="image/*" class="file-input" @change="onFileChange" />
              <el-button :disabled="saving || avatarUploading" @click="chooseFile">选择图片</el-button>
              <el-button type="primary" :loading="avatarUploading" :disabled="!avatarFile || saving" @click="uploadAvatar">上传头像</el-button>
              <span v-if="avatarFile" class="file-name">{{ avatarFile.name }} · 尚未上传</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="昵称"><el-input v-model="displayName" placeholder="请输入昵称" maxlength="20" show-word-limit /></el-form-item>
        <el-form-item><el-button type="primary" :loading="saving" :disabled="avatarUploading" @click="saveProfile">保存</el-button><el-button :disabled="saving || avatarUploading" @click="reload">刷新</el-button></el-form-item>
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
          :aria-pressed="selectedTheme === theme.value"
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
      <template #header><div class="card-header"><span>默认菜品管理</span><el-tag v-if="defaultStatus && !defaultError">{{ defaultStatus.imported }}/{{ defaultStatus.total }}</el-tag></div></template>
      <p v-if="joinUncertain" class="status-note">请先核对当前小家。</p>
      <el-alert v-else-if="defaultError" title="默认菜品状态加载失败，请重试后再操作。" type="error" :closable="false" show-icon><el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新加载</el-button></el-alert>
      <div v-else-if="defaultStatus" class="governance-row">
        <div class="governance-metric"><span>缺失默认菜品</span><strong>{{ defaultStatus.missing }}</strong></div>
        <el-button type="primary" :loading="defaultLoading" :disabled="joining || joinUncertain || governanceLoading" @click="importMissingDefaultMeals">导入缺失默认菜品</el-button>
        <el-button :loading="defaultLoading" :disabled="joining || joinUncertain || governanceLoading" @click="restoreDefaultImages">恢复默认菜品图片</el-button>
      </div>
      <p v-else class="status-note">正在加载菜品状态…</p>
    </el-card>

    <el-card class="settings-card">
      <template #header><div class="card-header"><span>待修正图片</span><el-tag v-if="imageIssues && !issuesError" type="warning">{{ imageIssues.length }}</el-tag></div></template>
      <p v-if="joinUncertain" class="status-note">请先核对当前小家。</p>
      <el-alert v-else-if="issuesError" title="图片反馈加载失败，请重试。" type="error" :closable="false" show-icon><el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新加载</el-button></el-alert>
      <p v-else-if="!imageIssues" class="status-note">正在加载图片反馈…</p>
      <el-empty v-else-if="!imageIssues.length" description="暂无待修正图片" />
      <div v-else class="issue-list">
        <div v-for="issue in imageIssues" :key="issue._id" class="issue-item">
          <img v-if="issue.mealId?.imageUrl" :src="issue.mealId.imageUrl" :alt="`${issue.mealId?.name || '菜品'}的图片`" />
          <div v-else class="issue-placeholder">无图片</div>
          <div class="issue-main">
            <strong>{{ issue.mealId?.name || '未知菜品' }}</strong>
            <span>{{ issue.note || '图片与菜名不匹配' }}</span>
          </div>
          <el-button size="small" type="success" :disabled="!!resolvingIssue || joining || joinUncertain" @click="resolveIssue(issue, 'fixed')">标记已修正</el-button>
          <el-button size="small" :disabled="!!resolvingIssue || joining || joinUncertain" @click="resolveIssue(issue, 'ignored')">忽略</el-button>
        </div>
      </div>
    </el-card>

    <el-card class="settings-card">
      <template #header><div class="card-header"><span>情侣小家</span><el-tag>{{ household.name || '未设置' }}</el-tag></div></template>
      <el-form label-width="90px" :disabled="profileLoading || !profileReady || !!profileError || joinUncertain || inviteUncertain || saving || avatarUploading || householdSaving || refreshing || joining">
        <el-form-item label="小家名称"><el-input v-model="householdName" placeholder="给你们的小家取个名字" /></el-form-item>
        <el-form-item label="邀请码">
          <div class="invite-row"><el-input :model-value="inviteUncertain ? '' : household.inviteCode" :placeholder="inviteUncertain ? '请先重新核对' : ''" readonly /><el-button :disabled="!household.inviteCode" @click="copyInvite">复制邀请码</el-button><el-button :disabled="!household.inviteCode" @click="copyInviteLink">复制邀请链接</el-button><el-button :loading="refreshing" @click="refreshInvite">刷新</el-button><small>邀请码和链接用于加入当前小家，请只分享给信任的人。刷新后旧邀请码和链接均失效。</small></div>
        </el-form-item>
        <el-form-item label="加入小家">
          <div class="invite-row"><el-input v-model="joinCode" placeholder="输入伴侣的邀请码" maxlength="20" @input="invalidInviteLink = false" /><el-button type="primary" :loading="joining" @click="joinHousehold">加入</el-button></div>
        </el-form-item>
        <el-form-item label="成员">
          <div class="member-list"><div v-for="member in household.members || []" :key="member._id || member.id" class="member-item"><div class="member-avatar"><img v-if="member.avatarUrl" :src="resolveUploadedImage(member.avatarUrl)" :alt="`${member.displayName || member.username || '成员'}的头像`" /><span v-else>{{ memberInitial(member) }}</span></div><span>{{ member.displayName || member.username }}</span></div></div>
        </el-form-item>
        <el-form-item><el-button type="primary" :loading="householdSaving" @click="saveHousehold">保存小家</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/services/api';
import { useMealStore } from '@/stores/meal';
import { useScheduleStore } from '@/stores/schedule';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

const mealStore = useMealStore();
const scheduleStore = useScheduleStore();
const router = useRouter();
const route = useRoute();

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
const hashParams = new URLSearchParams(route.hash.startsWith('#') ? route.hash.slice(1) : '');
const rawInvitedCode = (hashParams.get('invite') || '').trim();
const invalidInviteLink = ref(rawInvitedCode.length > 20);
const invitedCode = invalidInviteLink.value ? '' : rawInvitedCode;
const joinCode = ref(invitedCode);
const saving = ref(false);
const householdSaving = ref(false);
const refreshing = ref(false);
const joining = ref(false);
const joinUncertain = ref(false);
const inviteUncertain = ref(false);
const avatarFile = ref(null);
const avatarUploading = ref(false);
const defaultStatus = ref(null);
const imageIssues = ref(null);
const defaultLoading = ref(false);
const governanceLoading = ref(false);
const defaultError = ref(false);
const issuesError = ref(false);
const resolvingIssue = ref('');
const profileLoading = ref(false);
const profileReady = ref(false);
const profileError = ref('');
const avatarPreview = ref('');
const fileInputRef = ref(null);
const initial = computed(() => memberInitial(user.value));
const memberInitial = (member) => ((member?.displayName || member?.username || '').trim().slice(0, 1).toUpperCase());
const dirty = computed(() => profileReady.value && (displayName.value !== (user.value.displayName || '') || householdName.value !== (household.value.name || '') || !!avatarFile.value));
const mutationPending = computed(() => saving.value || avatarUploading.value || householdSaving.value || refreshing.value || joining.value || defaultLoading.value || !!resolvingIssue.value);
if (rawInvitedCode) {
  hashParams.delete('invite');
  const rest = hashParams.toString();
  router.replace({ path: route.path, query: route.query, hash: rest ? `#${rest}` : '' });
}

const applyProfile = (res, { syncDisplayName = true, syncHouseholdName = true } = {}) => {
  user.value = res.user || user.value;
  household.value = res.household || res.user?.household || household.value;
  if (syncDisplayName) displayName.value = user.value.displayName || '';
  if (syncHouseholdName) householdName.value = household.value.name || '';
  localStorage.setItem('user', JSON.stringify(user.value));
};
const loadGovernance = async () => {
  if (governanceLoading.value) return;
  governanceLoading.value = true;
  try {
    const [status, issues] = await Promise.allSettled([api.defaultMeal.status(), api.mealImageIssue.list({ status: 'open' })]);
    defaultError.value = status.status !== 'fulfilled';
    issuesError.value = issues.status !== 'fulfilled';
    if (!defaultError.value) defaultStatus.value = status.value;
    if (!issuesError.value) imageIssues.value = issues.value;
  } finally { governanceLoading.value = false; }
};
const clearAvatarFile = () => {
  avatarFile.value = null;
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
  avatarPreview.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
};
const reload = async () => {
  if (profileLoading.value || saving.value || avatarUploading.value || householdSaving.value || refreshing.value || joining.value) return;
  if (dirty.value) {
    try { await ElMessageBox.confirm('刷新会放弃未保存的昵称、小家名称和待上传头像。', '确认刷新', { type: 'warning', confirmButtonText: '放弃并刷新', cancelButtonText: '继续编辑' }); } catch (_) { return; }
  }
  try {
    profileLoading.value = true;
    profileError.value = '';
    const profile = await api.auth.me();
    const actualHousehold = profile?.household || profile?.user?.household;
    if (!profile?.user?.id || !actualHousehold?.id || typeof actualHousehold.inviteCode !== 'string' || !actualHousehold.inviteCode ||
        ((joinUncertain.value || inviteUncertain.value) && String(profile.user.householdId || '') !== String(actualHousehold.id))) throw new Error('家庭信息不完整，请重试');
    applyProfile(profile);
    profileReady.value = true;
    clearAvatarFile();
    if (joinUncertain.value) { mealStore.$reset(); scheduleStore.$reset(); defaultStatus.value = null; imageIssues.value = null; }
    joinUncertain.value = false;
    inviteUncertain.value = false;
    await loadGovernance();
  } catch (e) {
    profileError.value = e?.error || e?.message || '用户信息加载失败，请重新加载。';
  } finally { profileLoading.value = false; }
};
const saveProfile = async () => {
  if (saving.value || avatarUploading.value) return;
  try { saving.value = true; applyProfile(await api.auth.updateProfile({ displayName: displayName.value }), { syncHouseholdName: false }); ElMessage.success('保存成功'); }
  catch (e) { ElMessage.error(e?.error || '保存失败'); }
  finally { saving.value = false; }
};
const saveHousehold = async () => {
  try { householdSaving.value = true; const res = await api.household.update({ name: householdName.value }); household.value = res.household; householdName.value = household.value.name || ''; ElMessage.success('小家已更新'); }
  catch (e) { ElMessage.error(e?.error || '保存小家失败'); }
  finally { householdSaving.value = false; }
};
const refreshInvite = async () => {
  if (refreshing.value || joining.value || saving.value || avatarUploading.value || householdSaving.value || inviteUncertain.value || joinUncertain.value || profileLoading.value || !profileReady.value || profileError.value) return;
  refreshing.value = true;
  try {
    try { await ElMessageBox.confirm('刷新后原邀请码将失效，已加入的家庭成员不受影响。', '刷新邀请码', { type: 'warning', confirmButtonText: '刷新邀请码', cancelButtonText: '取消' }); } catch (_) { return; }
    const previousId = String(household.value.id || '');
    const previousCode = household.value.inviteCode;
    const res = await api.household.refreshInvite();
    if (!previousId || String(res?.household?.id || '') !== previousId || typeof res.household.inviteCode !== 'string' || !res.household.inviteCode || res.household.inviteCode.toUpperCase() === String(previousCode || '').toUpperCase() ||
        !Array.isArray(res.household.members) || !res.household.members.some(member => String(member?._id || member?.id || member) === String(user.value.id))) throw new Error('邀请码结果不完整');
    applyProfile({ user: { ...user.value, household: res.household }, household: res.household }, { syncDisplayName: false, syncHouseholdName: false });
    ElMessage.success('邀请码已刷新');
  } catch (_) { inviteUncertain.value = true; }
  finally { refreshing.value = false; }
};
const joinHousehold = async () => {
  if (joining.value || saving.value || avatarUploading.value || householdSaving.value || refreshing.value || inviteUncertain.value || joinUncertain.value || defaultLoading.value || resolvingIssue.value || governanceLoading.value) return;
  if (!joinCode.value.trim()) return ElMessage.warning('请输入邀请码');
  const requestedCode = joinCode.value.trim().toUpperCase();
  if (requestedCode.length > 20) return ElMessage.warning('邀请码过长，请重新确认');
  joining.value = true;
  try {
    try { await ElMessageBox.confirm('加入其他小家会切换当前账号所属家庭，原家庭的菜谱、计划和回忆不会自动转移，未保存的设置也会放弃。', '确认切换小家', { type: 'warning', confirmButtonText: '确认加入', cancelButtonText: '取消' }); } catch (_) { return; }
    const result = await api.household.join(requestedCode);
    if (!result?.user?.id || String(result.user.id) !== String(user.value.id) || !result?.household?.id || String(result.user.householdId || '') !== String(result.household.id) ||
        typeof result.household.inviteCode !== 'string' || result.household.inviteCode.toUpperCase() !== requestedCode ||
        !Array.isArray(result.household.members) || !result.household.members.some(member => String(member?._id || member?.id || member) === String(result.user.id))) throw new Error('家庭切换响应不完整');
    applyProfile(result); clearAvatarFile(); mealStore.$reset(); scheduleStore.$reset(); joinCode.value = ''; defaultStatus.value = null; imageIssues.value = null; await loadGovernance(); ElMessage.success('已加入小家');
  } catch (e) {
    if (e?.error === '邀请码无效' || e?.error === '请输入邀请码') ElMessage.error(e.error);
    else { joinUncertain.value = true; mealStore.$reset(); scheduleStore.$reset(); defaultStatus.value = null; imageIssues.value = null; }
  }
  finally { joining.value = false; }
};
const copyInvite = async () => {
  if (inviteUncertain.value || joinUncertain.value || refreshing.value || !household.value.inviteCode) return;
  try { await navigator.clipboard.writeText(household.value.inviteCode || ''); ElMessage.success('邀请码已复制'); }
  catch (_) { ElMessage.warning(`邀请码：${household.value.inviteCode}`); }
};
const copyInviteLink = async () => {
  if (inviteUncertain.value || joinUncertain.value || refreshing.value || !household.value.inviteCode) return;
  // URL fragments are not sent in the HTTP request or server access logs.
  const href = router.resolve({ name: 'accountApply', hash: `#invite=${encodeURIComponent(household.value.inviteCode)}` }).href;
  const link = new URL(href, window.location.origin).href;
  try { await navigator.clipboard.writeText(link); ElMessage.success('邀请链接已复制'); }
  catch (_) { await ElMessageBox.alert(link, '请手动复制邀请链接', { confirmButtonText: '知道了' }); }
};
const selectTheme = (theme) => {
  selectedTheme.value = theme;
  localStorage.setItem('colorTheme', theme);
  document.documentElement.dataset.theme = theme;
  window.dispatchEvent(new CustomEvent('eatwhat-theme-change', { detail: theme }));
  ElMessage.success('\u4e3b\u9898\u5df2\u5207\u6362');
};
const chooseFile = () => fileInputRef.value?.click();
const onFileChange = (e) => {
  const file = e.target?.files?.[0];
  clearAvatarFile();
  if (!file) return;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream', ''];
  if (!['jpeg', 'jpg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(extension) || !allowedTypes.includes(file.type.toLowerCase())) return ElMessage.warning('请选择 JPG、PNG、GIF、WebP、HEIC 或 HEIF 图片');
  avatarFile.value = file;
  avatarPreview.value = URL.createObjectURL(file);
};
const importMissingDefaultMeals = async () => {
  try { defaultLoading.value = true; const res = await api.defaultMeal.importMissing(); defaultStatus.value = res.after || res.status || defaultStatus.value; ElMessage.success('默认菜品已补齐'); }
  catch (e) { ElMessage.error(e?.error || '导入失败'); }
  finally { defaultLoading.value = false; }
};
const restoreDefaultImages = async () => {
  try { await ElMessageBox.confirm('将默认菜品图片恢复为系统图片，可能替换当前设置的图片。', '恢复默认图片', { type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消' }); } catch (_) { return; }
  try { defaultLoading.value = true; const res = await api.defaultMeal.restoreImages(); defaultStatus.value = res.status || defaultStatus.value; ElMessage.success('默认菜品图片已恢复'); }
  catch (e) { ElMessage.error(e?.error || '恢复失败'); }
  finally { defaultLoading.value = false; }
};
const resolveIssue = async (issue, status) => {
  if (resolvingIssue.value) return;
  try { resolvingIssue.value = issue._id; await api.mealImageIssue.update(issue._id, { status }); await loadGovernance(); ElMessage.success('已更新'); }
  catch (e) { ElMessage.error(e?.error || '更新失败'); }
  finally { resolvingIssue.value = ''; }
};
const uploadAvatar = async () => {
  if (!avatarFile.value) return;
  try {
    avatarUploading.value = true;
    const fd = new FormData();
    fd.append('avatar', avatarFile.value);
    applyProfile(await api.auth.uploadAvatar(fd), { syncDisplayName: false, syncHouseholdName: false });
    clearAvatarFile();
    ElMessage.success('头像已更新');
  } catch (e) { ElMessage.error(e?.error || '上传失败'); }
  finally { avatarUploading.value = false; }
};
const warnBeforeUnload = event => {
  if (!dirty.value && !mutationPending.value) return;
  event.preventDefault();
  event.returnValue = '';
};
onBeforeRouteLeave(async () => {
  if (mutationPending.value) { ElMessage.warning('操作正在进行，请稍候'); return false; }
  if (!dirty.value) return true;
  try { await ElMessageBox.confirm('昵称、小家名称或头像尚未保存，离开后会丢失。', '放弃未保存的设置？', { type: 'warning', confirmButtonText: '放弃并离开', cancelButtonText: '继续编辑' }); return true; } catch (_) { return false; }
});
onMounted(() => { window.addEventListener('beforeunload', warnBeforeUnload); reload(); });
onBeforeUnmount(() => { window.removeEventListener('beforeunload', warnBeforeUnload); clearAvatarFile(); });
</script>

<style scoped>
.settings-page { max-width: 920px; margin: 0 auto; display: flex; flex-direction: column; gap: 18px; }
.settings-intro { display: flex; align-items: end; justify-content: space-between; gap: 20px; padding: clamp(22px, 4vw, 36px); background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 26px; box-shadow: 0 12px 28px var(--shadow-color); }
.settings-intro h1 { margin: 8px 0; font: 700 clamp(26px, 3vw, 36px) Georgia, 'Songti SC', serif; }
.settings-intro p, .status-note, .invite-row small, .file-name { margin: 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
.eyebrow { color: var(--secondary-color); font-size: 11px; letter-spacing: .14em; font-weight: 800; }
.intro-badge { flex-shrink: 0; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 999px; color: var(--text-secondary); font-size: 12px; }
.settings-card { border-radius: 20px; border-color: var(--border-color); background: var(--bg-primary); }
.card-header { display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 700; }
.avatar-row { display: flex; align-items: center; gap: 16px; }
.avatar-preview, .member-avatar { border-radius: 999px; overflow: hidden; background: rgba(216, 95, 101, 0.14); display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.avatar-preview { width: 56px; height: 56px; }
.member-avatar { width: 36px; height: 36px; color: rgba(141, 90, 80, 0.95); font-weight: 700; }
.avatar-preview img, .member-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-placeholder { font-weight: 700; color: rgba(141, 90, 80, 0.95); }
.avatar-actions, .invite-row, .member-list { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.invite-row .el-input { flex: 1; min-width: 220px; }
.invite-row small { width: 100%; }
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
.issue-placeholder { width: 64px; height: 52px; display: grid; place-items: center; border-radius: 10px; background: var(--bg-primary); color: var(--text-secondary); font-size: 12px; }
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
  background: var(--bg-primary);
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
.theme-card.active { background: var(--bg-secondary); }
.theme-name { font-size: 16px; font-weight: 700; }
.theme-desc { color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.theme-swatches { display: flex; gap: 7px; margin-top: auto; }
.theme-swatch { width: 24px; height: 24px; border-radius: 999px; border: 2px solid rgba(255, 255, 255, 0.78); box-shadow: 0 4px 10px rgba(74, 62, 61, 0.14); }
@media (max-width: 640px) { .settings-intro { align-items: flex-start; flex-direction: column; } .avatar-row, .avatar-actions, .invite-row { align-items: stretch; flex-direction: column; } .issue-item { grid-template-columns: 1fr; } .invite-row .el-input { min-width: 0; width: 100%; } .theme-grid { grid-template-columns: 1fr; } }
</style>
