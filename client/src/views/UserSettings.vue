<template>
  <div class="settings-page">
    <header class="settings-intro"><div><span class="eyebrow">YOUR HOME, YOUR WAY</span><h1>小家设置</h1><p>管理个人资料、家庭成员和餐桌的样子。</p></div><span class="intro-badge">把日常过成喜欢的模样</span></header>
    <el-alert v-if="profileError" :title="profileError" type="error" :closable="false" show-icon><el-button link type="primary" :loading="profileLoading" @click="reload">重新加载</el-button></el-alert>
    <el-alert v-if="profileUncertain" class="name-alert profile-uncertain-alert" title="个人资料更新结果未确认" type="warning" :closable="false" show-icon>请先重新加载并核对昵称或头像；刷新会放弃本页未保存的输入。<el-button link type="primary" :loading="profileLoading" @click="reload">重新核对资料</el-button></el-alert>
    <el-alert v-if="joinUncertain" title="家庭切换结果未确认" type="warning" :closable="false" show-icon>请先重新核对当前家庭，再决定是否重试；如果家庭已切换，请按提示重新登录。在确认前本页的家庭操作暂不可用。 <el-button link type="primary" :loading="profileLoading" @click="reload">重新核对家庭</el-button></el-alert>
    <el-alert v-if="inviteUncertain" title="邀请码刷新结果未确认" type="warning" :closable="false" show-icon>旧邀请码可能已经失效，请重新核对后再复制或分享。 <el-button link type="primary" :loading="profileLoading" @click="reload">重新核对邀请码</el-button></el-alert>
    <el-alert v-if="invalidInviteLink" title="邀请链接中的邀请码过长，请向家人重新确认。" type="warning" :closable="false" show-icon />
    <nav class="settings-jump" aria-label="设置页面分区">
      <span>快速前往</span>
      <button v-for="section in settingsNavigation" :key="section.key" type="button" @click="jumpToSection(section.key)">{{ section.label }}</button>
    </nav>
    <el-card ref="profileSection" class="settings-card" role="region" aria-label="用户设置" tabindex="-1">
      <template #header><div class="card-header"><span>用户设置</span></div></template>
      <el-form label-width="90px" :disabled="profileLoading || !profileReady || !!profileError || profileUncertain || joinUncertain || inviteUncertain || nameChecking || saving || avatarUploading || householdSaving || refreshing || joining">
        <el-form-item label="头像">
          <div class="avatar-row">
            <div class="avatar-preview"><img v-if="profileAvatar && !failedAvatars.has(profileAvatarKey)" :key="profileAvatarKey" :src="profileAvatar" alt="头像预览" @error="onAvatarError($event, profileAvatarKey)" /><div v-else class="avatar-placeholder" :aria-label="avatarFile ? '头像预览不可用' : '头像不可用'">{{ initial }}</div></div>
            <div class="avatar-actions">
              <input ref="fileInputRef" type="file" accept="image/*" class="file-input" @change="onFileChange" />
              <el-button :disabled="saving || avatarUploading" @click="chooseFile">选择图片</el-button>
              <el-button type="primary" :loading="avatarUploading" :disabled="!avatarFile || saving || !!nameIssue" @click="uploadAvatar">上传头像</el-button>
              <span v-if="avatarFile" class="file-name">{{ avatarFile.name }} · 尚未上传</span>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="昵称"><el-input v-model="displayName" placeholder="请输入昵称" maxlength="20" show-word-limit /></el-form-item>
        <el-form-item><el-button type="primary" :loading="saving" :disabled="avatarUploading || !!nameIssue" @click="saveProfile">保存</el-button><el-button :disabled="saving || avatarUploading || !!nameIssue" @click="reload">刷新</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card ref="themeSection" class="settings-card theme-settings-card" role="region" aria-label="主题色" tabindex="-1">
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



    <el-card ref="defaultsSection" class="settings-card" role="region" aria-label="默认菜品管理" tabindex="-1">
      <template #header><div class="card-header"><span>默认菜品管理</span><el-tag v-if="profileReady && !profileError && !joinUncertain && defaultStatus && !defaultError">{{ defaultStatus.imported }}/{{ defaultStatus.total }}</el-tag></div></template>
      <p v-if="!profileReady || profileError || joinUncertain" class="status-note">请先加载并核对当前小家。</p>
      <el-alert v-else-if="defaultUncertain" class="name-alert" title="菜品管理操作结果未确认" type="warning" :closable="false" show-icon>
        <p>请求可能仍在处理。请先核对当前菜品和图片；重新加载只反映当时的状态，不保证请求已经结束。</p>
        <el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新核对状态</el-button>
        <span v-if="defaultReviewReady">当前缺失 {{ defaultStatus.missing }} 道默认菜品。</span>
        <span v-else-if="defaultError">状态加载失败，请重试。</span>
        <el-button v-if="defaultReviewReady" link type="primary" @click="acknowledgeDefault">已核对，继续操作</el-button>
      </el-alert>
      <el-alert v-else-if="defaultError" title="默认菜品状态加载失败，请重试后再操作。" type="error" :closable="false" show-icon><el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新加载</el-button></el-alert>
      <div v-else-if="defaultStatus" class="governance-row">
        <div class="governance-metric"><span>缺失默认菜品</span><strong>{{ defaultStatus.missing }}</strong></div>
        <el-button type="primary" :loading="defaultLoading" :disabled="joining || joinUncertain || governanceLoading" @click="importMissingDefaultMeals">导入缺失默认菜品</el-button>
        <el-button :loading="defaultLoading" :disabled="joining || joinUncertain || governanceLoading" @click="restoreDefaultImages">恢复默认菜品图片</el-button>
      </div>
      <p v-else class="status-note">正在加载菜品状态…</p>
    </el-card>

    <el-card ref="issuesSection" class="settings-card" role="region" aria-label="待修正图片" tabindex="-1">
      <template #header><div class="card-header"><span>待修正图片</span><el-tag v-if="profileReady && !profileError && !joinUncertain && !governanceLoading && imageIssues && !issuesError" type="warning">{{ issuePagination ? `共 ${issuePagination.total}` : imageIssues.length >= 200 ? `已显示 ${imageIssues.length}` : imageIssues.length }}</el-tag></div></template>
      <div v-if="profileReady && !profileError && !joinUncertain && !issueUncertain && !issuesError && imageIssues" class="issue-refresh">
        <p>在新标签页修改菜谱后，可刷新反馈并核对图片；标记状态不会自动修改菜谱。</p>
        <el-button :loading="governanceLoading" :disabled="!!resolvingIssue || defaultLoading || joining || profileLoading" @click="loadGovernance">刷新图片反馈</el-button>
      </div>
      <p v-if="!profileReady || profileError || joinUncertain" class="status-note">请先加载并核对当前小家。</p>
      <el-alert v-else-if="issueUncertain" class="name-alert" title="图片反馈操作结果未确认" type="warning" :closable="false" show-icon>
        <p>请求可能仍在处理。重新加载只反映当时的反馈状态，请核对后再决定是否继续操作。</p>
        <el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新核对反馈</el-button>
        <span v-if="issueReviewReady">{{ issuePagination ? `共 ${issuePagination.total} 条待修正反馈，本次显示第 ${issuePagination.page} / ${issuePagination.totalPages} 页。` : imageIssues.length >= 200 ? `本次显示 ${imageIssues.length} 条待修正反馈，可能还有其他反馈。` : `当前有 ${imageIssues.length} 条待修正反馈。` }}</span>
        <ul v-if="issueReviewReady && imageIssues.length" class="review-issues"><li v-for="issue in imageIssues" :key="issue._id">{{ issue.mealId?.name || '未知菜品' }}：{{ issue.note || '图片与菜名不匹配' }}</li></ul>
        <span v-else-if="issuesError">反馈加载失败，请重试。</span>
        <el-button v-if="issueReviewReady" link type="primary" @click="acknowledgeIssues">已核对，查看反馈</el-button>
      </el-alert>
      <el-alert v-else-if="issuesError" title="图片反馈加载失败，请重试。" type="error" :closable="false" show-icon><el-button link type="primary" :loading="governanceLoading" @click="loadGovernance">重新加载</el-button></el-alert>
      <p v-else-if="governanceLoading || !imageIssues" class="status-note" role="status">正在加载图片反馈…</p>
      <el-empty v-else-if="!imageIssues.length" description="暂无待修正图片" />
      <div v-else class="issue-list">
        <p v-if="!issuePagination && imageIssues.length >= 200" class="issue-limit-note" role="status">旧版服务器最多显示 200 条，可能还有其他反馈；处理后请刷新查看。</p>
        <div v-for="issue in imageIssues" :key="issue._id" class="issue-item">
          <img v-if="issueImageSrc(issue) && !failedIssueImages.has(issueImageKey(issue))" :key="issueImageKey(issue)" :src="issueImageSrc(issue)" :alt="`${issue.mealId?.name || '菜品'}的图片`" @error="onIssueImageError($event, issue)" />
          <div v-else class="issue-placeholder">{{ issue.mealId?.imageUrl ? '图片不可用' : '无图片' }}</div>
          <div class="issue-main">
            <strong>{{ issue.mealId?.name || '未知菜品' }}</strong>
            <span>{{ issue.note || '图片与菜名不匹配' }}</span>
            <router-link v-if="issueMealId(issue)" class="issue-recipe-link" :to="{ name: 'MealDetail', params: { id: issueMealId(issue) } }" target="_blank" rel="noopener noreferrer" :aria-label="`在新标签页核对菜谱：${issue.mealId.name}`">核对菜谱 ↗</router-link>
            <span v-else>菜谱不可用，请核对后处理反馈。</span>
          </div>
          <el-button size="small" type="success" :disabled="!!resolvingIssue || joining || joinUncertain || governanceLoading" :aria-label="`标记已修正：${issue.mealId?.name || '未知菜品'}`" @click="resolveIssue(issue, 'fixed', $event)">标记已修正</el-button>
          <el-button size="small" :disabled="!!resolvingIssue || joining || joinUncertain || governanceLoading" :aria-label="`忽略图片反馈：${issue.mealId?.name || '未知菜品'}`" @click="resolveIssue(issue, 'ignored', $event)">忽略</el-button>
        </div>
      </div>
      <nav v-if="profileReady && !profileError && !joinUncertain && !governanceLoading && issuePagination && issuePagination.totalPages > 1 && !issuesError && (!issueUncertain || issueReviewReady)" class="issue-pagination" aria-label="图片反馈分页">
        <el-button :disabled="governanceLoading || !!resolvingIssue || defaultLoading || issuePagination.page <= 1" @click="changeIssuePage(issuePagination.page - 1)">上一页</el-button>
        <span aria-live="polite" aria-atomic="true">第 {{ issuePagination.page }} / {{ issuePagination.totalPages }} 页 · 共 {{ issuePagination.total }} 条</span>
        <el-button :disabled="governanceLoading || !!resolvingIssue || defaultLoading || issuePagination.page >= issuePagination.totalPages" @click="changeIssuePage(issuePagination.page + 1)">下一页</el-button>
        <form v-if="issuePagination.totalPages > 2" class="issue-page-jump" @submit.prevent="jumpToIssuePage">
          <label for="issue-page-number">跳至</label>
          <input id="issue-page-number" v-model="issueJump" type="text" inputmode="numeric" autocomplete="off" :aria-invalid="issueJumpError ? 'true' : undefined" :aria-describedby="issueJumpError ? 'issue-page-error' : undefined" @input="issueJumpError = ''" />
          <span>页</span><button type="submit" :disabled="!!resolvingIssue || defaultLoading">跳转</button>
          <span v-if="issueJumpError" id="issue-page-error" class="issue-page-error" role="alert">{{ issueJumpError }}</span>
        </form>
      </nav>
    </el-card>

    <el-card ref="householdSection" class="settings-card" role="region" aria-label="小家与成员" tabindex="-1">
      <template #header><div class="card-header"><span>小家与成员</span><el-tag>{{ household.name || '未设置' }}</el-tag></div></template>
      <el-alert v-if="profileReady && !nameVersionAvailable && !nameIssue" class="name-alert" title="服务器未提供安全的小家名称版本，暂时不能保存名称。" type="warning" :closable="false" show-icon />
      <el-alert v-if="nameIssue" class="name-alert" :title="nameIssue === 'conflict' ? '小家名称已被修改，本次没有保存。' : '小家名称保存结果未确认。'" type="warning" :closable="false" show-icon>
        <p>你的输入和其他未保存设置仍在，请先核对最新名称。已发送的请求可能仍在处理。</p>
        <el-button link type="primary" :loading="nameChecking" @click="reviewHouseholdName">核对最新名称</el-button>
        <div v-if="latestName !== null" class="name-review"><span>最新名称：{{ latestName }}</span><el-button link type="primary" @click="useLatestName">采用最新名称</el-button><el-button link type="primary" @click="keepNameDraft">保留我的名称</el-button></div>
      </el-alert>
      <el-form label-width="90px" :disabled="profileLoading || !profileReady || !!profileError || profileUncertain || joinUncertain || inviteUncertain || nameChecking || saving || avatarUploading || householdSaving || refreshing || joining">
        <el-form-item label="小家名称"><el-input v-model="householdName" placeholder="给你们的小家取个名字" maxlength="40" show-word-limit /></el-form-item>
        <el-form-item label="邀请码">
          <div class="invite-row"><el-input :model-value="inviteUncertain ? '' : household.inviteCode" :placeholder="inviteUncertain ? '请先重新核对' : ''" readonly /><el-button :disabled="!household.inviteCode" @click="copyInvite">复制邀请码</el-button><el-button :disabled="!household.inviteCode" @click="copyInviteLink">复制邀请链接</el-button><el-button :disabled="!!nameIssue" :loading="refreshing" @click="refreshInvite">刷新</el-button><small>邀请码和链接用于加入当前小家，请只分享给信任的人。刷新后旧邀请码和链接均失效。</small></div>
        </el-form-item>
        <el-form-item label="加入小家">
          <div class="invite-row"><el-input v-model="joinCode" placeholder="输入家人的邀请码" maxlength="20" @input="invalidInviteLink = false" /><el-button type="primary" :disabled="!!nameIssue || defaultUncertain || issueUncertain" :loading="joining" @click="joinHousehold">加入</el-button><small>加入前无法预览目标小家，请先与家人核对邀请码。切换后，原小家的数据不会自动转移。</small><small v-if="defaultUncertain || issueUncertain">请先核对上方未确认的菜品管理操作，再切换小家。</small></div>
        </el-form-item>
        <el-form-item label="成员">
          <div class="member-list"><div v-for="member in household.members || []" :key="member._id || member.id" class="member-item"><div class="member-avatar"><img v-if="avatarSource(member) && !failedAvatars.has(memberAvatarKey(member))" :key="memberAvatarKey(member)" :src="avatarSource(member)" :alt="`${member.displayName || member.username || '成员'}的头像`" @error="onAvatarError($event, memberAvatarKey(member))" /><span v-else aria-label="头像不可用">{{ memberInitial(member) }}</span></div><span class="member-name">{{ member.displayName || member.username || '家庭成员' }}</span></div></div>
        </el-form-item>
        <el-form-item><el-button type="primary" :disabled="!nameVersionAvailable || !!nameIssue" :loading="householdSaving" @click="saveHousehold">保存小家</el-button></el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/services/api';
import { useMealStore } from '@/stores/meal';
import { useScheduleStore } from '@/stores/schedule';
import { resolveRecipeImage, retryLocalUpload } from '@/utils/uploadedImage.mjs';
import { currentSessionScope, replaceSessionUser, sessionIsCurrent } from '@/services/sessionScope';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';

const mealStore = useMealStore();
const scheduleStore = useScheduleStore();
const router = useRouter();
const profileSection = ref(null); const themeSection = ref(null); const defaultsSection = ref(null); const issuesSection = ref(null); const householdSection = ref(null);
const settingsNavigation = [
  { key: 'profile', label: '个人资料' }, { key: 'theme', label: '主题色' },
  { key: 'defaults', label: '默认菜品' }, { key: 'issues', label: '图片反馈' }, { key: 'household', label: '小家与成员' }
];
const jumpToSection = key => {
  const target = ({ profile: profileSection, theme: themeSection, defaults: defaultsSection, issues: issuesSection, household: householdSection })[key]?.value?.$el;
  if (!target) return;
  target.focus({ preventScroll: true });
  target.scrollIntoView({ block: 'start', behavior: 'auto' });
};
const jumpFromRoute = async key => {
  if (typeof key !== 'string' || !settingsNavigation.some(section => section.key === key)) return;
  await nextTick();
  if (route.name === 'settings' && route.query.section === key) jumpToSection(key);
};
const route = useRoute();

const themeOptions = [
  { value: 'cream', label: '奶油原木', desc: '温柔奶白与焦糖木色', colors: ['#FDFBF7', '#F5EBE6', '#FFB4A2', '#E09F67'] },
  { value: 'peach', label: '蜜桃日常', desc: '适合记录甜一点的家常时光', colors: ['#FFF9F5', '#FFECE7', '#FF9D8F', '#F0786F'] },
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
const nameIssue = ref('');
const nameChecking = ref(false);
const latestName = ref(null);
const refreshing = ref(false);
const joining = ref(false);
const joinUncertain = ref(false);
const inviteUncertain = ref(false);
const avatarFile = ref(null);
const avatarUploading = ref(false);
const defaultStatus = ref(null);
const imageIssues = ref(null);
const issuePage = ref(1);
const issuePagination = ref(null);
const issueJump = ref('1');
const issueJumpError = ref('');
const issuePageSize = 20;
const failedIssueImages = ref(new Set());
const defaultLoading = ref(false);
const governanceLoading = ref(false);
const defaultError = ref(false);
const issuesError = ref(false);
const defaultUncertain = ref(false);
const issueUncertain = ref(false);
const defaultReviewReady = ref(false);
const issueReviewReady = ref(false);
const resolvingIssue = ref('');
const profileLoading = ref(false);
const profileReady = ref(false);
const profileError = ref('');
const profileUncertain = ref(false);
const avatarPreview = ref('');
const failedAvatars = ref(new Set());
const fileInputRef = ref(null);
const initial = computed(() => memberInitial(user.value));
const memberInitial = member => String(member?.displayName || member?.username || '').trim().slice(0, 1).toUpperCase() || '家';
const avatarSource = member => resolveRecipeImage(member?.avatarUrl, '');
const profileAvatar = computed(() => avatarPreview.value || avatarSource(user.value));
const profileAvatarKey = computed(() => `profile:${profileAvatar.value}`);
const memberAvatarKey = member => `member:${member._id || member.id}:${avatarSource(member)}`;
const onAvatarError = (event, key) => {
  if (retryLocalUpload(event)) return;
  failedAvatars.value = new Set([...failedAvatars.value, key]);
};
const reloadDirty = computed(() => profileReady.value && (displayName.value !== (user.value.displayName || '') || householdName.value !== (household.value.name || '') || !!avatarFile.value || !!nameIssue.value || profileUncertain.value || defaultUncertain.value || issueUncertain.value));
const dirty = computed(() => reloadDirty.value || !!joinCode.value.trim() || joinUncertain.value || inviteUncertain.value || profileUncertain.value || defaultUncertain.value || issueUncertain.value);
const validNameVersion = value => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 1 && (value.revision === null || (typeof value.revision === 'string' && value.revision.length > 0 && value.revision.length <= 128));
const nameVersionAvailable = computed(() => household.value.supportsConditionalNameUpdate === true && validNameVersion(household.value.nameVersion));
const mutationPending = computed(() => saving.value || avatarUploading.value || householdSaving.value || nameChecking.value || refreshing.value || joining.value || defaultLoading.value || !!resolvingIssue.value);
if (rawInvitedCode) {
  hashParams.delete('invite');
  const rest = hashParams.toString();
  router.replace({ path: route.path, query: route.query, hash: rest ? `#${rest}` : '' });
}

const validateProfile = (res, { allowHouseholdChange = false } = {}) => {
  const nextUser = res?.user;
  const nextHousehold = res?.household || nextUser?.household;
  const scope = currentSessionScope();
  const id = String(nextUser?.id || '');
  const householdId = String(nextHousehold?.id || '');
  const code = nextHousehold?.inviteCode;
  if (!id || !householdId || (scope.userId && scope.userId !== id) || String(nextUser?.householdId || '') !== householdId ||
      (!allowHouseholdChange && scope.householdId && scope.householdId !== householdId) ||
      (nextUser.household?.id && String(nextUser.household.id) !== householdId) ||
      typeof code !== 'string' || !code || code.length > 20 || code.trim() !== code ||
      !Array.isArray(nextHousehold.members) || !nextHousehold.members.some(member => String(member?._id || member?.id || member) === id)) throw new Error('家庭信息不完整，请重试');
  return { nextUser, nextHousehold };
};
const applyProfile = (res, { syncDisplayName = true, syncHouseholdName = true, allowHouseholdChange = false } = {}) => {
  const { nextUser, nextHousehold } = validateProfile(res, { allowHouseholdChange });
  const previousHousehold = household.value;
  const nameDraftDirty = householdName.value !== (previousHousehold.name || '');
  replaceSessionUser({ ...nextUser, household: nextHousehold });
  user.value = nextUser;
  failedAvatars.value = new Set();
  const sameHousehold = !!previousHousehold.id && String(previousHousehold.id) === String(nextHousehold?.id || '');
  if (!syncHouseholdName && sameHousehold && nameDraftDirty) {
    // Keep the version that the unsaved name was based on, even if an
    // unrelated profile or invitation response contains newer household data.
    household.value = { ...nextHousehold, name: previousHousehold.name, nameVersion: previousHousehold.nameVersion, supportsConditionalNameUpdate: previousHousehold.supportsConditionalNameUpdate };
  } else {
    household.value = nextHousehold;
    if (!syncHouseholdName && sameHousehold && !nameDraftDirty) householdName.value = household.value.name || '';
  }
  if (syncDisplayName) displayName.value = user.value.displayName || '';
  if (syncHouseholdName) householdName.value = household.value.name || '';
};
const validDefaultStatus = value => value && ['total', 'imported', 'missing'].every(key => Number.isSafeInteger(value[key]) && value[key] >= 0) && value.imported + value.missing === value.total;
const loadGovernance = async () => {
  if (governanceLoading.value || !profileReady.value || profileError.value || joinUncertain.value || !sessionIsCurrent()) return;
  const scope = currentSessionScope();
  governanceLoading.value = true;
  if (issueUncertain.value) issueReviewReady.value = false;
  try {
    const readIssues = async page => api.mealImageIssue.list({ status: 'open', page, limit: issuePageSize });
    const [status, issues] = await Promise.allSettled([api.defaultMeal.status(), readIssues(issuePage.value)]);
    if (!sessionIsCurrent(scope)) return false;
    const validIssues = value => Array.isArray(value) && value.every(issue => issue && typeof issue === 'object' && typeof issue._id === 'string' && !!issue._id) && new Set(value.map(issue => issue._id)).size === value.length;
    defaultError.value = status.status !== 'fulfilled' || !validDefaultStatus(status.value);
    if (!defaultError.value) defaultStatus.value = status.value;
    try {
      if (issues.status !== 'fulfilled') throw new Error('图片反馈读取失败');
      let data = issues.value;
      if (Array.isArray(data)) {
        if (!validIssues(data) || data.length > 200) throw new Error('旧版图片反馈数据不完整');
        issuePage.value = 1; issuePagination.value = null; imageIssues.value = data;
      } else {
        const validatePage = (value, page) => value && value.supportsImageIssuePagination === true && String(value.householdId) === String(scope.householdId) && value.page === page && value.limit === issuePageSize && Number.isSafeInteger(value.total) && value.total >= 0 && value.totalPages === Math.max(1, Math.ceil(value.total / issuePageSize)) && validIssues(value.items) && value.items.length === Math.min(issuePageSize, Math.max(0, value.total - (page - 1) * issuePageSize));
        if (!validatePage(data, issuePage.value)) throw new Error('图片反馈分页数据不完整');
        if (issuePage.value > data.totalPages) {
          const lastPage = data.totalPages; data = await readIssues(lastPage);
          if (!sessionIsCurrent(scope)) return false;
          if (!validatePage(data, lastPage)) throw new Error('图片反馈分页数据已变化');
          issuePage.value = lastPage;
        }
        issuePagination.value = { page: data.page, total: data.total, totalPages: data.totalPages };
        imageIssues.value = data.items;
      }
      issuesError.value = false; failedIssueImages.value = new Set();
      issueJump.value = String(issuePage.value); issueJumpError.value = '';
    } catch (_) { issuesError.value = true; issuePagination.value = null; }
    if (defaultUncertain.value) defaultReviewReady.value = !defaultError.value;
    if (issueUncertain.value) issueReviewReady.value = !issuesError.value;
    return true;
  } finally { governanceLoading.value = false; }
};
const changeIssuePage = async page => {
  if (governanceLoading.value || resolvingIssue.value || defaultLoading.value || !issuePagination.value || page < 1 || page > issuePagination.value.totalPages) return;
  const source = document.activeElement; issuePage.value = page;
  await loadGovernance(); await nextTick();
  if ((!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) && source?.closest?.('.issue-pagination')) issuesSection.value?.$el?.focus();
};
const jumpToIssuePage = () => {
  if (!issuePagination.value) return;
  const input = issueJump.value.trim();
  const page = Number(input);
  if (!/^[0-9]+$/.test(input) || !Number.isSafeInteger(page) || page < 1 || page > issuePagination.value.totalPages) {
    issueJumpError.value = `请输入 1 至 ${issuePagination.value.totalPages} 的页码`;
    return;
  }
  issueJumpError.value = '';
  if (page === issuePagination.value.page) { issueJump.value = String(page); return; }
  void changeIssuePage(page);
};
const clearAvatarFile = () => {
  avatarFile.value = null;
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value);
  avatarPreview.value = '';
  if (fileInputRef.value) fileInputRef.value.value = '';
};
const reload = async () => {
  if (profileLoading.value || saving.value || avatarUploading.value || householdSaving.value || nameChecking.value || refreshing.value || joining.value) return;
  if (reloadDirty.value) {
    try { await ElMessageBox.confirm('刷新会放弃未保存的昵称、小家名称和待上传头像。', '确认刷新', { type: 'warning', confirmButtonText: '放弃并刷新', cancelButtonText: '继续编辑' }); } catch (_) { return; }
  }
  try {
    profileLoading.value = true;
    profileError.value = '';
    const profile = await api.auth.me();
    const actualHousehold = profile?.household || profile?.user?.household;
    if (!profile?.user?.id || !actualHousehold?.id || typeof actualHousehold.inviteCode !== 'string' || !actualHousehold.inviteCode ||
        ((joinUncertain.value || inviteUncertain.value) && String(profile.user.householdId || '') !== String(actualHousehold.id))) throw new Error('家庭信息不完整，请重试');
    applyProfile(profile, { allowHouseholdChange: joinUncertain.value });
    profileReady.value = true;
    clearAvatarFile();
    if (joinUncertain.value) { mealStore.$reset(); scheduleStore.$reset(); defaultStatus.value = null; imageIssues.value = null; issuePage.value = 1; issuePagination.value = null; }
    joinUncertain.value = false;
    inviteUncertain.value = false;
    profileUncertain.value = false;
    nameIssue.value = ''; latestName.value = null;
    await loadGovernance();
  } catch (e) {
    profileError.value = e?.error || e?.message || '用户信息加载失败，请重新加载。';
  } finally { profileLoading.value = false; }
};
const saveProfile = async () => {
  if (saving.value || avatarUploading.value || profileUncertain.value || nameIssue.value || nameChecking.value) return;
  try { saving.value = true; applyProfile(await api.auth.updateProfile({ displayName: displayName.value }), { syncHouseholdName: false }); ElMessage.success('保存成功'); }
  catch (_) { profileUncertain.value = true; }
  finally { saving.value = false; }
};
const saveHousehold = async () => {
  if (householdSaving.value || nameChecking.value || nameIssue.value || !nameVersionAvailable.value) return;
  const name = householdName.value.trim();
  if (!name || name.length > 40) return ElMessage.warning('小家名称不能为空，且不能超过 40 字');
  const id = String(household.value.id || '');
  const expected = { revision: household.value.nameVersion.revision };
  try {
    householdSaving.value = true;
    const res = await api.household.update({ name, expectedNameVersion: expected });
    if (!id || String(res?.household?.id || '') !== id || res.household.name !== name || res.household.supportsConditionalNameUpdate !== true || !validNameVersion(res.household.nameVersion) || res.household.nameVersion.revision === expected.revision || typeof res.household.inviteCode !== 'string' || !Array.isArray(res.household.members)) throw new Error('小家名称响应不完整');
    applyProfile({ user: { ...user.value, household: res.household }, household: res.household }, { syncDisplayName: false });
    ElMessage.success('小家已更新');
  } catch (e) {
    if (e?.code === 'HOUSEHOLD_NAME_INVALID') ElMessage.warning(e.error);
    else if (['HOUSEHOLD_SCOPE_UNVERIFIED', 'HOUSEHOLD_SCOPE_CHANGED'].includes(e?.code) || (['SESSION_CHANGED', 'SESSION_EXPIRED'].includes(e?.code) && !e.requestSent)) ElMessage.warning(e.error);
    else { nameIssue.value = ['HOUSEHOLD_NAME_CONFLICT', 'HOUSEHOLD_NAME_INVALID_VERSION'].includes(e?.code) ? 'conflict' : 'uncertain'; latestName.value = null; }
  }
  finally { householdSaving.value = false; }
};
const reviewHouseholdName = async () => {
  if (nameChecking.value || !nameIssue.value) return;
  nameChecking.value = true;
  try {
    const result = await api.household.me();
    const next = result?.household;
    if (!result?.user?.id || String(result.user.id) !== String(user.value.id) || !next?.id || String(next.id) !== String(household.value.id) || String(result.user.householdId || '') !== String(next.id) || typeof next.name !== 'string' || !next.name || next.supportsConditionalNameUpdate !== true || !validNameVersion(next.nameVersion) || typeof next.inviteCode !== 'string' || !Array.isArray(next.members)) throw new Error('最新小家信息不完整');
    validateProfile(result);
    household.value = next;
    failedAvatars.value = new Set();
    latestName.value = next.name;
  } catch (e) { latestName.value = null; ElMessage.error(e?.error || e?.message || '核对失败，请重试'); }
  finally { nameChecking.value = false; }
};
const useLatestName = () => { if (latestName.value !== null) { householdName.value = latestName.value; latestName.value = null; nameIssue.value = ''; } };
const keepNameDraft = async () => {
  if (latestName.value === null) return;
  try { await ElMessageBox.confirm('保留当前输入后仍需再次点击保存；如果其他成员再次修改，保存会再次提示冲突。', '保留我的名称？', { type: 'warning', confirmButtonText: '保留输入', cancelButtonText: '继续核对' }); }
  catch (_) { return; }
  latestName.value = null; nameIssue.value = '';
};
const refreshInvite = async () => {
  if (refreshing.value || joining.value || saving.value || avatarUploading.value || householdSaving.value || profileUncertain.value || nameIssue.value || nameChecking.value || inviteUncertain.value || joinUncertain.value || profileLoading.value || !profileReady.value || profileError.value) return;
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
  if (joining.value || saving.value || avatarUploading.value || householdSaving.value || profileUncertain.value || nameIssue.value || nameChecking.value || refreshing.value || inviteUncertain.value || joinUncertain.value || defaultLoading.value || resolvingIssue.value || governanceLoading.value || defaultUncertain.value || issueUncertain.value) return;
  if (!joinCode.value.trim()) return ElMessage.warning('请输入邀请码');
  const requestedCode = joinCode.value.trim().toUpperCase();
  if (requestedCode.length > 20) return ElMessage.warning('邀请码过长，请重新确认');
  joining.value = true;
  try {
    try { await ElMessageBox.confirm(`当前小家：${household.value.name || '未命名'}。\n使用的邀请码：${requestedCode}。\n暂无法预览目标小家，请先与家人核对邀请码。加入后账号会切换小家，原小家的菜谱、计划和回忆不会自动转移，未保存的设置也会放弃。`, '确认切换小家', { type: 'warning', confirmButtonText: '确认加入', cancelButtonText: '取消' }); } catch (_) { return; }
    const result = await api.household.join(requestedCode);
    if (!result?.user?.id || String(result.user.id) !== String(user.value.id) || !result?.household?.id || String(result.user.householdId || '') !== String(result.household.id) ||
        typeof result.household.inviteCode !== 'string' || result.household.inviteCode.toUpperCase() !== requestedCode ||
        !Array.isArray(result.household.members) || !result.household.members.some(member => String(member?._id || member?.id || member) === String(result.user.id))) throw new Error('家庭切换响应不完整');
    applyProfile(result, { allowHouseholdChange: true }); clearAvatarFile(); mealStore.$reset(); scheduleStore.$reset(); joinCode.value = ''; defaultStatus.value = null; imageIssues.value = null; issuePage.value = 1; issuePagination.value = null; await loadGovernance(); ElMessage.success('已加入小家');
  } catch (e) {
    if (e?.error === '邀请码无效' || e?.error === '请输入邀请码') ElMessage.error(e.error);
    else { joinUncertain.value = true; mealStore.$reset(); scheduleStore.$reset(); defaultStatus.value = null; imageIssues.value = null; issuePage.value = 1; issuePagination.value = null; }
  }
  finally { joining.value = false; }
};
const copyInvite = async () => {
  if (!profileReady.value || profileError.value || profileUncertain.value || inviteUncertain.value || joinUncertain.value || refreshing.value || !household.value.inviteCode || !sessionIsCurrent()) return;
  try { await navigator.clipboard.writeText(household.value.inviteCode || ''); ElMessage.success('邀请码已复制'); }
  catch (_) { ElMessage.warning(`邀请码：${household.value.inviteCode}`); }
};
const copyInviteLink = async () => {
  if (!profileReady.value || profileError.value || profileUncertain.value || inviteUncertain.value || joinUncertain.value || refreshing.value || !household.value.inviteCode || !sessionIsCurrent()) return;
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
const issueImageSrc = issue => resolveRecipeImage(issue?.mealId?.imageUrl, '');
const issueMealId = issue => {
  const meal = issue?.mealId; const id = meal?._id || meal?.id;
  return typeof id === 'string' && /^[a-f\d]{24}$/i.test(id) && typeof meal?.name === 'string' && meal.name.trim() ? id : '';
};
const issueImageKey = issue => `${issue._id}:${issueImageSrc(issue)}`;
const onIssueImageError = (event, issue) => {
  if (retryLocalUpload(event)) return;
  failedIssueImages.value = new Set([...failedIssueImages.value, issueImageKey(issue)]);
};
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
  if (defaultLoading.value || defaultUncertain.value || defaultError.value || !profileReady.value || profileError.value || joinUncertain.value || governanceLoading.value || !sessionIsCurrent()) return;
  try { defaultLoading.value = true; const res = await api.defaultMeal.importMissing(); if (!validDefaultStatus(res?.after)) throw new Error('响应不完整'); defaultStatus.value = res.after; ElMessage.success('导入请求已处理，请核对缺失数量'); }
  catch (_) { defaultUncertain.value = true; defaultReviewReady.value = false; }
  finally { defaultLoading.value = false; }
};
const restoreDefaultImages = async () => {
  if (defaultLoading.value || defaultUncertain.value || defaultError.value || !profileReady.value || profileError.value || joinUncertain.value || governanceLoading.value || !sessionIsCurrent()) return;
  defaultLoading.value = true;
  try { await ElMessageBox.confirm('将默认菜品图片恢复为系统图片，可能替换当前设置的图片。', '恢复默认图片', { type: 'warning', confirmButtonText: '确认恢复', cancelButtonText: '取消' }); } catch (_) { defaultLoading.value = false; return; }
  try { const res = await api.defaultMeal.restoreImages(); if (!validDefaultStatus(res?.status) || !Number.isSafeInteger(res.updated) || res.updated < 0) throw new Error('响应不完整'); defaultStatus.value = res.status; ElMessage.success('默认菜品图片已恢复'); }
  catch (_) { defaultUncertain.value = true; defaultReviewReady.value = false; }
  finally { defaultLoading.value = false; }
};
const resolveIssue = async (issue, status, event) => {
  if (resolvingIssue.value || issueUncertain.value || issuesError.value || !profileReady.value || profileError.value || joinUncertain.value || governanceLoading.value || !sessionIsCurrent()) return;
  const source = event?.currentTarget;
  const restoreFocus = document.activeElement === source;
  const issueIndex = Math.max(0, imageIssues.value?.findIndex(item => item._id === issue._id) ?? 0);
  try { resolvingIssue.value = issue._id; const result = await api.mealImageIssue.update(issue._id, { status }); if (result?._id !== issue._id || result?.status !== status) throw new Error('响应不完整'); if (!await loadGovernance() || issuesError.value) throw new Error('反馈重新加载失败'); ElMessage.success('已更新'); }
  catch (_) { issueUncertain.value = true; issueReviewReady.value = false; }
  finally {
    resolvingIssue.value = '';
    if (restoreFocus) {
      await nextTick();
      const focused = document.activeElement;
      if (!focused || focused === document.body || !focused.isConnected || (focused === source && source?.disabled)) {
        const root = issuesSection.value?.$el;
        const rows = root?.querySelectorAll('.issue-item') || [];
        (rows[Math.min(issueIndex, rows.length - 1)]?.querySelector('button:not(:disabled)') || root)?.focus();
      }
    }
  }
};
const acknowledgeDefault = async () => {
  if (!defaultReviewReady.value || governanceLoading.value) return;
  try { await ElMessageBox.confirm('之前的请求仍可能执行；请确认已检查菜品和图片后再继续。', '确认继续操作？', { type: 'warning', confirmButtonText: '确认继续', cancelButtonText: '再检查' }); } catch (_) { return; }
  defaultUncertain.value = false; defaultReviewReady.value = false;
};
const acknowledgeIssues = async () => {
  if (!issueReviewReady.value || governanceLoading.value) return;
  try { await ElMessageBox.confirm('之前的请求仍可能执行，请核对反馈列表后再决定是否操作。', '确认查看反馈？', { type: 'warning', confirmButtonText: '确认查看', cancelButtonText: '再检查' }); } catch (_) { return; }
  issueUncertain.value = false; issueReviewReady.value = false;
};
const uploadAvatar = async () => {
  if (!avatarFile.value || profileUncertain.value || nameIssue.value || nameChecking.value) return;
  try {
    avatarUploading.value = true;
    const fd = new FormData();
    fd.append('avatar', avatarFile.value);
    applyProfile(await api.auth.uploadAvatar(fd), { syncDisplayName: false, syncHouseholdName: false });
    clearAvatarFile();
    ElMessage.success('头像已更新');
  } catch (_) { profileUncertain.value = true; }
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
  const message = joinUncertain.value || inviteUncertain.value ? '家庭操作结果尚未确认，离开后邀请码和核对提示会丢失，请先核对。' : defaultUncertain.value || issueUncertain.value ? '菜品管理操作结果尚未确认，离开后核对提示会丢失；未保存的设置也会丢失。' : profileUncertain.value ? '个人资料更新结果尚未确认，离开后本页输入与核对提示会丢失。' : joinCode.value.trim() ? '离开后输入的邀请码以及未保存的设置会丢失，请保留原邀请链接或邀请码。' : '昵称、小家名称或头像尚未保存，离开后会丢失。';
  try { await ElMessageBox.confirm(message, '放弃未保存的设置？', { type: 'warning', confirmButtonText: '放弃并离开', cancelButtonText: '继续编辑' }); return true; } catch (_) { return false; }
});
watch(() => route.query.section, jumpFromRoute);
onMounted(() => { window.addEventListener('beforeunload', warnBeforeUnload); void jumpFromRoute(route.query.section); reload(); });
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
.settings-card { scroll-margin-top: 90px; }
.settings-card:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.settings-jump { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; padding: 14px 18px; border: 1px solid var(--border-color); border-radius: 18px; background: var(--bg-primary); }
.settings-jump > span { color: var(--text-primary); font-size: 13px; font-weight: 700; margin-right: 4px; }
.settings-jump button { min-height: 44px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-primary); background: var(--bg-secondary); font: inherit; font-size: 13px; cursor: pointer; }
.settings-jump button:hover { background: var(--bg-tertiary); }
.settings-jump button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.card-header { display: flex; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 700; }
.avatar-row { display: flex; align-items: center; gap: 16px; }
.avatar-preview, .member-avatar { border-radius: 999px; overflow: hidden; background: rgba(216, 95, 101, 0.14); display: flex; align-items: center; justify-content: center; flex: 0 0 auto; }
.avatar-preview { width: 56px; height: 56px; }
.member-avatar { width: 36px; height: 36px; color: var(--text-primary); font-weight: 700; }
.avatar-preview img, .member-avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }
.avatar-placeholder { font-weight: 700; color: var(--text-primary); }
.avatar-actions, .invite-row, .member-list { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.invite-row .el-input { flex: 1; min-width: 220px; }
.invite-row small { width: 100%; }
.name-review { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 12px; margin-top: 8px; overflow-wrap: anywhere; }
.name-alert { background: var(--bg-secondary); border: 1px solid var(--border-color); }
.name-alert :deep(.el-alert__title), .name-alert :deep(.el-alert__description), .name-alert :deep(.el-alert__icon), .name-alert :deep(.el-button) { color: var(--text-primary); }
.name-alert :deep(.el-button) { min-height: 44px; font-weight: 700; text-decoration: underline; }
.name-alert :deep(.el-button:focus-visible) { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.review-issues { max-height: 12rem; overflow: auto; padding-left: 1.25rem; }
.member-list { gap: 12px; }
.member-item { display: flex; align-items: center; gap: 8px; max-width: 100%; background: var(--bg-secondary); border-radius: 18px; padding: 6px 12px 6px 6px; }
.member-name { min-width: 0; overflow-wrap: anywhere; }
.file-input { display: none; }
.governance-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.governance-metric { min-width: 140px; background: var(--bg-secondary); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.governance-metric span, .issue-main span { color: var(--text-secondary); font-size: 13px; }
.governance-metric strong { font-size: 24px; color: var(--primary-color); }
.issue-list { display: flex; flex-direction: column; gap: 10px; }
.issue-refresh { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 14px; margin-bottom: 12px; }
.issue-refresh p { flex: 1 1 240px; margin: 0; color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.issue-limit-note { margin: 0; color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.issue-refresh .el-button { min-height: 44px; margin: 0; }
.issue-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; margin-top: 16px; color: var(--text-primary); font-size: 13px; }
.issue-pagination .el-button { min-height: 44px; margin: 0; }
.issue-page-jump { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; }
.issue-page-jump input { box-sizing: border-box; width: 62px; min-height: 44px; padding: 6px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font: inherit; text-align: center; }
.issue-page-jump button { min-height: 44px; padding: 0 12px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font: inherit; cursor: pointer; }
.issue-page-jump input:focus-visible, .issue-page-jump button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.issue-page-jump button:disabled { opacity: .55; cursor: not-allowed; }
.issue-page-error { flex-basis: 100%; color: var(--el-color-danger); text-align: center; }
.issue-item { display: grid; grid-template-columns: 64px minmax(0, 1fr) auto auto; gap: 10px; align-items: center; padding: 10px; background: var(--bg-secondary); border-radius: 14px; }
.issue-item img { width: 64px; height: 52px; object-fit: cover; border-radius: 10px; }
.issue-placeholder { width: 64px; height: 52px; display: grid; place-items: center; border-radius: 10px; background: var(--bg-primary); color: var(--text-secondary); font-size: 12px; }
.issue-main { display: flex; flex-direction: column; gap: 4px; min-width: 0; overflow-wrap: anywhere; }
.issue-recipe-link { display: inline-flex; align-items: center; align-self: flex-start; min-height: 44px; color: var(--text-primary); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.issue-recipe-link:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
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
@media (max-width: 640px) { .settings-intro { align-items: flex-start; flex-direction: column; } .avatar-row, .avatar-actions, .invite-row { align-items: stretch; flex-direction: column; } .issue-item { grid-template-columns: 64px minmax(0, 1fr); } .issue-item .el-button { grid-column: span 2; min-height: 44px; margin-left: 0; } .invite-row .el-input { min-width: 0; width: 100%; } .theme-grid { grid-template-columns: 1fr; } }
</style>
