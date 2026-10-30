<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Star, Clock, Bowl, Picture, Check, Warning } from '@element-plus/icons-vue';
import api from '@/services/api';
import defaultImage from '@/assets/meal-placeholder.svg';
import { resolveUploadedImage, handleUploadedImageError } from '@/utils/uploadedImage.mjs';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { filterCatalogQuery } from '@/utils/catalogQuery.mjs';
import { validWeekLink } from '@/utils/weekLink.mjs';
import { readReviewOrigin, reviewDestination } from '@/utils/reviewOrigin.mjs';

const route = useRoute();
const router = useRouter();
const shoppingWeek = computed(() => validWeekLink(route.query.shoppingWeek) ? route.query.shoppingWeek : '');
const calendarDate = computed(() => !shoppingWeek.value && validWeekLink(route.query.calendarDate) ? route.query.calendarDate : '');
const dashboardOrigin = computed(() => !shoppingWeek.value && !calendarDate.value && route.query.fromDashboard === '1');
const reviewOrigin = computed(() => !shoppingWeek.value && !calendarDate.value && !dashboardOrigin.value ? readReviewOrigin(route.query) : null);
const detailBack = computed(() => shoppingWeek.value ? { name: 'shoppingList', query: { week: shoppingWeek.value } } : calendarDate.value ? { name: 'calendar', query: { date: calendarDate.value } } : dashboardOrigin.value ? { name: 'dashboard' } : reviewOrigin.value ? reviewDestination(reviewOrigin.value) : { name: 'meals', query: filterCatalogQuery(route.query), state: { catalogReturnMeal: String(route.params.id || '') } });
const editorQuery = computed(() => ({ ...filterCatalogQuery(route.query), ...(shoppingWeek.value ? { shoppingWeek: shoppingWeek.value } : calendarDate.value ? { calendarDate: calendarDate.value } : dashboardOrigin.value ? { fromDashboard: '1' } : reviewOrigin.value || {}) }));
const meal = ref(null);
const memories = ref([]);
const memoryPage = ref(1);
const memoryPageSize = 6;
const memoryTotal = ref(0);
const memoryPagination = ref(false);
const memoryNav = ref(null);
const memoryRetry = ref(null);
const memoryHeading = ref(null);
let memoryFocus = '';
const loading = ref(false);
const memoryLoading = ref(false);
const mealError = ref('');
const memoryError = ref('');
const reporting = ref(false);
const reportAttempted = ref(false);
const reportUncertain = ref(false);
const reportSubmitted = ref(false);
const reportChecked = ref(false);
const reportChecking = ref(false);
const reportMatches = ref(0);
const reportListTruncated = ref(false);
const reportError = ref('');
const viewedPhoto = ref(null);
const scheduleDialog = ref(false);
const scheduleDate = ref('');
const scheduleType = ref('dinner');
const photoGrid = ref(null);
let photoFocus = null;
let loadSequence = 0;
let memorySequence = 0;
let reportSequence = 0;
const reportBusy = computed(() => reporting.value || reportChecking.value);
const noDraft = ref(false);
useDraftGuard({ dirty: noDraft, busy: reportBusy, uncertain: reportUncertain, label: '图片反馈' });

const totalTime = computed(() => Number(meal.value?.prepTime || 0) + Number(meal.value?.cookTime || 0));
const memoryPages = computed(() => Math.max(1, Math.ceil(memoryTotal.value / memoryPageSize)));
const difficultyText = computed(() => ({ easy: '简单', medium: '适中', hard: '费工夫' }[meal.value?.difficulty] || '未设置'));
const imageFor = value => resolveUploadedImage(value) || defaultImage;
const coverImage = computed(() => imageFor(meal.value?.imageUrl));
const coverFailed = ref(false);
const coverNotice = computed(() => coverFailed.value ? '封面图片暂不可用' : !meal.value?.imageUrl ? '暂无封面图片' : '');
watch(() => [route.params.id, coverImage.value], () => { coverFailed.value = false; }, { flush: 'sync' });
const photos = computed(() => Array.isArray(meal.value?.photos) ? meal.value.photos.filter(photo => typeof photo === 'string' && photo) : []);
const schedulableId = computed(() => {
  const id = meal.value?._id || meal.value?.id;
  return typeof id === 'string' && /^[a-z\d_-]{1,128}$/i.test(id) && !meal.value?.archived ? id : '';
});
const openSchedule = () => {
  if (!schedulableId.value || loading.value) return;
  const now = new Date();
  scheduleDate.value = calendarDate.value || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  scheduleType.value = 'dinner';
  scheduleDialog.value = true;
};
const continueSchedule = async () => {
  if (!schedulableId.value || !validWeekLink(scheduleDate.value) || !['breakfast', 'lunch', 'dinner'].includes(scheduleType.value)) return ElMessage.warning('请选择有效日期和餐次');
  const failure = await router.push({ name: 'MealSelection', query: { date: scheduleDate.value, mealType: scheduleType.value, suggestedMealId: schedulableId.value, fromRecipe: '1', ...editorQuery.value } });
  if (!failure) scheduleDialog.value = false;
};
const doneOnce = () => {
  if (!meal.value) return;
  router.push({ name: 'memories', query: { new: '1', mealId: meal.value._id || meal.value.id } });
};
const reportImageIssue = async () => {
  if (!meal.value || reporting.value || reportUncertain.value || reportSubmitted.value || reportChecking.value) return;
  const id = String(meal.value._id || meal.value.id);
  const sequence = ++reportSequence;
  reportAttempted.value = true;
  reporting.value = true;
  try {
    const result = await api.mealImageIssue.create({ mealId: id, issueType: 'wrong_image', note: '这张图片和菜名不匹配' });
    if (sequence !== reportSequence) return;
    const reportedMeal = typeof result?.mealId === 'string' ? result.mealId : result?.mealId?._id || result?.mealId?.id;
    if (!(result?._id || result?.id) || String(reportedMeal || '') !== id) throw new Error('反馈响应不完整');
    reportSubmitted.value = true;
    ElMessage.success('已加入待修正图片列表');
  } catch (_) { if (sequence === reportSequence) { reportUncertain.value = true; reportChecked.value = false; reportError.value = ''; } }
  finally { if (sequence === reportSequence) reporting.value = false; }
};
const checkReports = async () => {
  if (!meal.value || !reportUncertain.value || reportChecking.value) return;
  const id = String(meal.value._id || meal.value.id);
  const sequence = ++reportSequence;
  reportChecking.value = true; reportChecked.value = false; reportError.value = '';
  try {
    const result = await api.mealImageIssue.list({ status: 'open' });
    if (sequence !== reportSequence) return;
    if (!Array.isArray(result)) throw new Error('反馈列表不完整');
    reportMatches.value = result.filter(issue => {
      const issueMeal = typeof issue?.mealId === 'string' ? issue.mealId : issue?.mealId?._id || issue?.mealId?.id;
      return String(issueMeal || '') === id && issue?.issueType === 'wrong_image';
    }).length;
    reportListTruncated.value = result.length >= 200;
    reportChecked.value = true;
  } catch (e) { if (sequence === reportSequence) reportError.value = e?.error || e?.message || '无法读取反馈列表'; }
  finally { if (sequence === reportSequence) reportChecking.value = false; }
};
const allowReportRetry = async () => {
  if (!reportUncertain.value || !reportChecked.value || reportChecking.value) return;
  try { await ElMessageBox.confirm('即使列表暂时没有记录，先前请求仍可能稍后完成。重新提交可能产生重复反馈。', '确认允许重试？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); reportUncertain.value = false; reportChecked.value = false; } catch (_) {}
};
const finishReportReview = async () => {
  if (!reportUncertain.value || !reportChecked.value || reportChecking.value) return;
  try { await ElMessageBox.confirm('确认不再重试这次反馈？这不会删除已有反馈。', '结束核对？', { type: 'warning', confirmButtonText: '结束核对', cancelButtonText: '继续核对' }); reportUncertain.value = false; reportSubmitted.value = true; } catch (_) {}
};
const loadMemories = async (id, sequence) => {
  const request = ++memorySequence;
  const page = memoryPage.value;
  memoryLoading.value = true; memoryError.value = '';
  try {
    const result = await api.memory.list({ view: 'timeline', mealId: id, page, limit: memoryPageSize });
    if (sequence !== loadSequence || request !== memorySequence) return;
    const validRows = rows => Array.isArray(rows) && rows.every(item => item && typeof (item._id || item.id) === 'string' && !!(item._id || item.id) && typeof item.date === 'string') && new Set(rows.map(item => item._id || item.id)).size === rows.length;
    if (result?.supportsMemoryTimeline === true) {
      if (result.mealId !== id || result.page !== page || result.limit !== memoryPageSize || result.search !== '' || result.month !== '' || result.mealType !== 'all' || result.photos !== 'all' || !Number.isSafeInteger(result.total) || result.total < 0 || !validRows(result.items) || result.items.length !== Math.min(memoryPageSize, Math.max(0, result.total - (page - 1) * memoryPageSize))) throw new Error('相关回忆分页数据不完整');
      memoryPagination.value = true; memoryTotal.value = result.total;
      if (page > memoryPages.value) { memoryPage.value = memoryPages.value; return await loadMemories(id, sequence); }
      memories.value = result.items;
    } else {
      if (!validRows(result)) throw new Error('回忆列表数据不完整');
      memoryPagination.value = false; memoryTotal.value = result.length; memories.value = result;
    }
  } catch (e) { if (sequence === loadSequence && request === memorySequence) memoryError.value = e?.error || e?.message || '加载相关回忆失败'; }
  finally {
    if (sequence === loadSequence && request === memorySequence) {
      memoryLoading.value = false;
      const desiredFocus = memoryFocus; memoryFocus = '';
      if (desiredFocus) {
        await nextTick();
        if (sequence === loadSequence && request === memorySequence && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) {
          const buttons = [...(memoryNav.value?.querySelectorAll('button') || [])];
          const target = buttons[desiredFocus === 'next' ? 1 : 0]?.disabled ? buttons.find(button => !button.disabled) : buttons[desiredFocus === 'next' ? 1 : 0];
          (memoryError.value ? memoryRetry.value?.$el : target || memoryHeading.value)?.focus();
        }
      }
    }
  }
};
const reloadMemories = () => { if (typeof route.params.id === 'string') loadMemories(route.params.id, loadSequence); };
const changeMemoryPage = page => { if (!memoryLoading.value && page >= 1 && page <= memoryPages.value && page !== memoryPage.value) { memoryFocus = memoryNav.value?.contains(document.activeElement) ? (page > memoryPage.value ? 'next' : 'previous') : ''; memoryPage.value = page; reloadMemories(); } };
const load = async () => {
  const id = route.params.id;
  const sequence = ++loadSequence;
  if (typeof id !== 'string' || !id) return;
  loading.value = true;
  mealError.value = '';
  memoryError.value = '';
  meal.value = null;
  memories.value = [];
  memoryPage.value = 1; memoryTotal.value = 0; memoryPagination.value = false; memoryFocus = '';
  reportSequence++; reporting.value = false; reportAttempted.value = false; reportUncertain.value = false; reportSubmitted.value = false; reportChecked.value = false; reportChecking.value = false; reportError.value = '';
  viewedPhoto.value = null;
  photoFocus = null;
  loadMemories(id, sequence);
  try {
    const result = await api.meal.getMealById(id);
    if (sequence !== loadSequence) return;
    if (!result || String(result._id || result.id || '') !== id || typeof result.name !== 'string' || !result.name.trim() || (result.imageUrl != null && typeof result.imageUrl !== 'string') || ['ingredients', 'steps', 'photos', 'tags', 'healthTags'].some(key => result[key] != null && !Array.isArray(result[key])) || (Array.isArray(result.photos) && result.photos.some(photo => typeof photo !== 'string'))) throw new Error('菜品数据不完整');
    meal.value = result;
  } catch (e) { if (sequence === loadSequence) mealError.value = e?.error || e?.message || '加载菜品详情失败'; }
  finally { if (sequence === loadSequence) loading.value = false; }
};
const fallbackImage = event => handleUploadedImageError(event, defaultImage);
const fallbackCover = event => { if (!event.target?.isConnected) return; fallbackImage(event); if (event.target.dataset.placeholder === '1') coverFailed.value = true; };
const showPhoto = (images, index, title, event, gallery = false) => { if (images.length && index >= 0 && index < images.length) { photoFocus = { origin: event.currentTarget, index: gallery ? index : null }; viewedPhoto.value = { images, index, title }; } };
const closePhoto = () => { viewedPhoto.value = null; };
const restorePhotoFocus = async () => { const target = photoFocus; photoFocus = null; await new Promise(resolve => setTimeout(resolve, 0)); if (!target || photoFocus || !target.origin?.isConnected) return; const active = document.activeElement; if (active && active !== document.body && active !== target.origin && active.isConnected) return; (target.index === null ? target.origin : photoGrid.value?.querySelectorAll('button')[target.index] || target.origin).focus(); };
const movePhoto = direction => { if (!viewedPhoto.value) return; const next = viewedPhoto.value.index + direction; if (next >= 0 && next < viewedPhoto.value.images.length) { viewedPhoto.value.index = next; if (photoFocus && photoFocus.index !== null) photoFocus.index = next; } };
const onPhotoKey = event => {
  if (!viewedPhoto.value || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  const target = event.target instanceof Element ? event.target : null;
  const dialog = target?.closest('.el-dialog');
  if (!dialog?.querySelector('.photo-preview') || target.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="slider"], [role="spinbutton"]')) return;
  event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1);
};
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id === from.params.id) return true;
  if (reportBusy.value) { ElMessage.warning('图片反馈操作正在进行，请稍候'); return false; }
  if (!reportUncertain.value) return true;
  try { await ElMessageBox.confirm('图片反馈结果尚未确认，切换菜品后核对提示会丢失。', '确认切换？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续核对' }); return true; } catch (_) { return false; }
});
watch(() => route.params.id, load, { immediate: true });
window.addEventListener('keydown', onPhotoKey);
onBeforeUnmount(() => { loadSequence++; memorySequence++; reportSequence++; window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="meal-detail" v-loading="loading">
    <div class="detail-toolbar">
      <el-button @click="router.push(detailBack)"><el-icon><ArrowLeft /></el-icon>{{ shoppingWeek ? '返回购物清单' : calendarDate ? '返回日历' : dashboardOrigin ? '返回首页' : reviewOrigin ? '返回饭桌回顾' : '返回' }}</el-button>
      <div class="toolbar-actions">
        <el-button :disabled="!schedulableId || loading" @click="openSchedule">安排到日历</el-button>
        <el-button type="success" :disabled="!meal || loading" @click="doneOnce"><el-icon><Check /></el-icon>记录做过</el-button>
        <el-button type="warning" :disabled="!meal || loading || reportUncertain || reportSubmitted || reportChecking" :loading="reporting" @click="reportImageIssue"><el-icon><Warning /></el-icon>{{ reportSubmitted ? '已反馈' : '图片不对' }}</el-button>
        <el-button type="primary" :disabled="!meal || loading" @click="router.push({ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery })">
          <el-icon><Edit /></el-icon>编辑菜品
        </el-button>
      </div>
    </div>

    <el-dialog v-model="scheduleDialog" title="安排这道菜" width="min(480px, 92vw)">
      <p class="schedule-help">选择日期和餐次后，将先核对并保留已有菜品。进入下一步不会直接修改日历。</p>
      <div class="schedule-fields">
        <label for="recipe-schedule-date">日期</label>
        <input id="recipe-schedule-date" v-model="scheduleDate" type="date" min="0100-01-01" max="9998-12-31" />
        <fieldset><legend>餐次</legend><label v-for="option in [{ value: 'breakfast', label: '早餐' }, { value: 'lunch', label: '午餐' }, { value: 'dinner', label: '晚餐' }]" :key="option.value"><input v-model="scheduleType" type="radio" name="recipe-schedule-type" :value="option.value" />{{ option.label }}</label></fieldset>
      </div>
      <template #footer><el-button @click="scheduleDialog = false">取消</el-button><el-button type="primary" :disabled="!validWeekLink(scheduleDate) || !schedulableId" @click="continueSchedule">下一步：核对安排</el-button></template>
    </el-dialog>

    <div v-if="route.query.report === '1' && meal && !loading && !reportAttempted" class="report-hint" role="status">进入详情不会自动提交反馈。请先核对菜品图片，确认不匹配后点击上方“图片不对”。</div>
    <el-alert v-if="reportUncertain" type="warning" :closable="false" show-icon title="图片反馈提交结果未确认，请先核对后再决定是否重试。">
      <el-button link type="primary" :loading="reportChecking" @click="checkReports">核对待修正反馈</el-button>
      <p v-if="reportError">{{ reportError }}</p>
      <template v-if="reportChecked"><p>{{ reportMatches ? `当前列表有 ${reportMatches} 条这道菜的图片不匹配反馈。` : '当前列表没有发现这道菜的图片不匹配反馈。' }}{{ reportListTruncated ? ' 列表仅显示最近 200 条，可能不完整。' : '' }}先前请求仍可能稍后完成。</p><el-button link type="primary" @click="allowReportRetry">已核对，允许重试</el-button><el-button link @click="finishReportReview">不再重试</el-button></template>
    </el-alert>
    <el-alert v-if="mealError" type="error" :closable="false" show-icon :title="`无法加载菜品：${mealError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <el-alert v-if="meal?.archived" type="info" :closable="false" show-icon title="这道菜已移入回收站；历史记录仍然保留，可在菜品管理的回收站中恢复。" />
    <template v-if="meal && !mealError">
      <section class="hero">
        <button class="cover-button" type="button" :disabled="!meal.imageUrl" :aria-label="`查看${meal.name}封面照片`" :aria-describedby="coverNotice ? 'cover-notice' : undefined" @click="showPhoto([meal.imageUrl], 0, `${meal.name}封面`, $event)"><img :key="coverImage" :src="coverImage" :alt="meal.imageUrl ? meal.name : '暂无封面图片'" @error="fallbackCover" /><span v-if="coverNotice" id="cover-notice" class="cover-notice">{{ coverNotice }}</span></button>
        <div class="hero-info">
          <div class="title-row">
            <h1>{{ meal.name }}</h1>
            <el-tag v-if="meal.favorite" type="warning"><el-icon><Star /></el-icon> 收藏</el-tag>
          </div>
          <p>{{ meal.description || '还没有写下这道菜的故事。' }}</p>
          <div class="meta-grid">
            <div><el-icon><Clock /></el-icon><span>{{ totalTime || '-' }} 分钟</span></div>
            <div><el-icon><Bowl /></el-icon><span>{{ meal.servingSize || '份量未设' }}</span></div>
            <div><span>难度</span><strong>{{ difficultyText }}</strong></div>
            <div><span>辣度</span><strong>{{ meal.spiceLevel || 0 }}/5</strong></div>
          </div>
          <el-rate :model-value="meal.rating || 0" disabled />
          <div class="tags">
            <el-tag v-for="tag in meal.tags || []" :key="tag" effect="light">{{ tag }}</el-tag>
            <el-tag v-for="tag in meal.healthTags || []" :key="`h-${tag}`" type="success" effect="plain">{{ tag }}</el-tag>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header>食材清单</template>
          <el-empty v-if="!meal.ingredients?.length" description="暂无食材"><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">补充食材 →</router-link></el-empty>
          <div v-else class="ingredient-list">
            <div v-for="(item, index) in meal.ingredients" :key="index" class="ingredient-row">
              <span>{{ typeof item === 'string' ? item : item?.name }}</span><strong>{{ typeof item === 'string' ? '' : item?.amount }}</strong>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>做法步骤</template>
          <el-empty v-if="!meal.steps?.length" description="暂无做法"><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">补充做法 →</router-link></el-empty>
          <div v-else class="steps-list">
            <div v-for="(step, index) in meal.steps" :key="index" class="step-item" :class="{ 'no-image': !step?.imageUrl }">
              <div class="step-index">{{ index + 1 }}</div>
              <button v-if="step?.imageUrl" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 步照片`" @click="showPhoto([step.imageUrl], 0, `第 ${index + 1} 步`, $event)" ><img :key="imageFor(step.imageUrl)" :src="imageFor(step.imageUrl)" :alt="`第 ${index + 1} 步照片`" @error="fallbackImage" /></button>
              <p>{{ typeof step === 'string' ? step : step?.description }}</p>
            </div>
          </div>
        </el-card>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header>照片墙</template>
          <div v-if="photos.length" ref="photoGrid" class="photo-grid">
            <button v-for="(photo, index) in photos" :key="`${index}-${photo}`" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 张菜品照片`" @click="showPhoto(photos, index, meal.name, $event, true)"><img :src="imageFor(photo)" :alt="`第 ${index + 1} 张菜品照片`" @error="fallbackImage" /></button>
          </div>
          <el-empty v-else description="暂无额外照片"><template #image><el-icon><Picture /></el-icon></template><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">添加菜品照片 →</router-link></el-empty>
        </el-card>

        <el-card>
          <template #header><span ref="memoryHeading" tabindex="-1">饭后回忆</span></template>
          <span class="sr-only" role="status" aria-atomic="true">{{ memoryLoading ? '正在加载相关回忆' : memoryError ? '相关回忆加载失败' : memoryPagination ? `共 ${memoryTotal} 条相关回忆，第 ${memoryPage} / ${memoryPages} 页` : `共 ${memoryTotal} 条相关回忆` }}</span>
          <el-alert v-if="memoryError" type="error" :closable="false" show-icon :title="`无法加载相关回忆：${memoryError}`"><el-button ref="memoryRetry" link type="primary" :loading="memoryLoading" @click="reloadMemories">重新加载</el-button></el-alert>
          <p v-else-if="memoryLoading" class="memory-date">正在加载相关回忆…</p>
          <el-empty v-else-if="!memories.length" description="还没有相关回忆"><el-button class="detail-empty-button" type="primary" plain @click="doneOnce">记录做过这道菜</el-button></el-empty>
          <div v-else class="memory-list">
            <p v-if="memoryPagination" class="memory-date">共 {{ memoryTotal }} 条相关回忆 · 第 {{ memoryPage }} / {{ memoryPages }} 页</p>
            <p v-else-if="memories.length >= 200" class="memory-date">旧服务器最多显示最近 200 条相关回忆，请升级服务器以查看全部历史。</p>
            <div v-for="item in memories" :key="item._id || item.id" class="memory-item">
              <div class="memory-date">{{ item.date }} · {{ item.mood || '日常一餐' }}</div>
              <strong>{{ item.title || meal.name }}</strong>
              <p>{{ item.note }}</p>
              <p v-if="item.actualCookTime || item.nextImprovement" class="memory-extra">实际耗时 {{ item.actualCookTime || '-' }} 分钟 · {{ item.nextImprovement || '暂无改进记录' }}</p>
              <el-rate :model-value="item.rating || 0" disabled size="small" />
              <router-link class="memory-link" :to="{ name: 'memories', query: { edit: item._id || item.id } }">查看并编辑回忆 →</router-link>
            </div>
            <nav v-if="memoryPagination && memoryTotal > memoryPageSize" ref="memoryNav" class="memory-pagination" aria-label="相关回忆分页"><el-button :disabled="memoryLoading || memoryPage <= 1" @click="changeMemoryPage(memoryPage - 1)">上一页</el-button><span>第 {{ memoryPage }} / {{ memoryPages }} 页</span><el-button :disabled="memoryLoading || memoryPage >= memoryPages" @click="changeMemoryPage(memoryPage + 1)">下一页</el-button></nav>
          </div>
        </el-card>
      </section>

      <el-card v-if="meal.tips" class="tips-card">
        <template #header>烹饪小贴士</template>
        <p>{{ meal.tips }}</p>
      </el-card>
    </template>
    <el-dialog :model-value="!!viewedPhoto" title="菜品照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) closePhoto() }" @close="closePhoto" @close-auto-focus="restorePhotoFocus"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.images[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.images[viewedPhoto.index])" :alt="viewedPhoto.title" @error="fallbackImage" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张菜品照片" @click="movePhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.images.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.images.length - 1" aria-label="下一张菜品照片" @click="movePhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.schedule-help { margin: 0 0 16px; color: var(--text-secondary); line-height: 1.6; }
.schedule-fields { display: grid; gap: 10px; color: var(--text-primary); }
.schedule-fields input[type='date'] { min-height: 44px; width: 100%; box-sizing: border-box; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 8px; background: var(--bg-primary); color: var(--text-primary); font: inherit; }
.schedule-fields fieldset { display: flex; flex-wrap: wrap; gap: 12px; margin: 0; padding: 10px; border: 1px solid var(--border-color); border-radius: 8px; }
.schedule-fields fieldset label { display: inline-flex; align-items: center; min-height: 44px; gap: 6px; }
.schedule-fields input:focus-visible { outline: 3px solid var(--secondary-color); outline-offset: 2px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.meal-detail { display: flex; flex-direction: column; gap: 18px; }
.detail-toolbar { display: flex; justify-content: space-between; gap: 12px; }
.toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.report-hint { padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-secondary); color: var(--text-primary); font-size: 14px; line-height: 1.6; overflow-wrap: anywhere; }
.hero { display: grid; grid-template-columns: minmax(280px, 460px) 1fr; gap: 24px; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px var(--shadow-color); }
.hero img { width: 100%; height: 320px; object-fit: cover; border-radius: 10px; background: var(--bg-secondary); }
.cover-button, .detail-photo { border: 0; padding: 0; background: var(--bg-secondary); border-radius: 10px; cursor: pointer; }
.cover-button { position: relative; }
.cover-notice { position: absolute; right: 12px; bottom: 12px; padding: 5px 9px; border-radius: 999px; background: #49382f; color: #fffaf3; font-size: 12px; font-weight: 700; line-height: 1.4; }
.cover-button:disabled { cursor: default; }
.cover-button:focus-visible, .detail-photo:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.hero-info { display: flex; flex-direction: column; gap: 14px; }
.title-row { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
h1 { margin: 0; color: var(--text-primary); }
.meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.meta-grid div { background: var(--bg-secondary); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; color: var(--text-secondary); }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.detail-empty-action { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.detail-empty-action:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.detail-empty-button { min-height: 44px; }
.ingredient-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
.ingredient-row { gap: 12px; }
.ingredient-row > span, .ingredient-row > strong { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ingredient-row > strong { text-align: right; }
.steps-list, .memory-list { display: flex; flex-direction: column; gap: 12px; }
.step-item { display: grid; grid-template-columns: 34px 96px 1fr; gap: 12px; align-items: start; }
.step-item.no-image { grid-template-columns: 34px 1fr; }
.step-index { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.step-item img, .photo-grid img { width: 100%; height: 82px; object-fit: cover; border-radius: 8px; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.memory-item { padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 14px; overflow-wrap: anywhere; }
.memory-date, .memory-extra { color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.memory-link { display: inline-flex; align-items: center; min-height: 44px; margin-top: 4px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.memory-link:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.memory-pagination { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 12px; color: var(--text-primary); font-size: 13px; }
.memory-pagination :deep(.el-button) { min-height: 44px; margin: 0; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.tips-card p { white-space: pre-wrap; }
.step-item p, .tips-card p { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 768px) { .hero, .content-grid { grid-template-columns: 1fr; } .meta-grid { grid-template-columns: repeat(2, 1fr); } .step-item, .step-item.no-image { grid-template-columns: 28px 1fr; } .step-item img { grid-column: 2; } }
</style>
