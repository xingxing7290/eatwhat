<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
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
const ingredientHeading = ref(null);
const stepsHeading = ref(null);
const photoHeading = ref(null);
const jumpToDetailSection = element => { element?.scrollIntoView({ block: 'center', behavior: 'auto' }); element?.focus({ preventScroll: true }); };
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
const previewUnavailable = ref(false);
const previewRetrying = ref(false);
const previewAttempt = ref(0);
const previewImage = ref(null);
const previewRetryButton = ref(null);
const imageVersions = ref({});
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
const completedSteps = ref(new Set());
const timerMinutes = ref(5);
const timerCustomMinutes = ref('2');
const timerDuration = computed(() => {
  if (timerMinutes.value !== 'custom') return timerMinutes.value;
  const text = timerCustomMinutes.value.trim();
  const value = /^\d+$/.test(text) ? Number(text) : NaN;
  return Number.isSafeInteger(value) && value >= 1 && value <= 180 ? value : null;
});
const timerSeconds = ref(300);
const timerState = ref('idle');
const timerAnchor = ref(null);
const timerOutsideView = ref(false);
const floatingTimer = ref(null);
let timerObserver = null;
watch(timerAnchor, element => {
  timerObserver?.disconnect(); timerObserver = null; timerOutsideView.value = false;
  if (!element || typeof IntersectionObserver === 'undefined') return;
  timerObserver = new IntersectionObserver(async entries => {
    if (entries[0]?.target !== timerAnchor.value) return;
    const restoreFocus = entries[0].isIntersecting && document.activeElement === floatingTimer.value;
    timerOutsideView.value = !entries[0].isIntersecting;
    if (restoreFocus) { await nextTick(); if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) timerAnchor.value?.focus({ preventScroll: true }); }
  }, { threshold: 0 });
  timerObserver.observe(element);
}, { flush: 'post' });
const revealTimer = () => { timerAnchor.value?.scrollIntoView({ block: 'center', behavior: 'auto' }); timerAnchor.value?.focus({ preventScroll: true }); };
let timerDeadline = 0; let cookingTimer = null;
const timerDisplay = computed(() => timerState.value === 'idle' && timerDuration.value === null ? '--:--' : `${String(Math.floor(timerSeconds.value / 60)).padStart(2, '0')}:${String(timerSeconds.value % 60).padStart(2, '0')}`);
const stopTimerInterval = () => { if (cookingTimer) clearInterval(cookingTimer); cookingTimer = null; };
const resetCookingTimer = () => { stopTimerInterval(); timerDeadline = 0; timerSeconds.value = (timerDuration.value || 0) * 60; timerState.value = 'idle'; };
const updateCookingTimer = () => {
  if (timerState.value !== 'running') return;
  timerSeconds.value = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
  if (!timerSeconds.value) { stopTimerInterval(); timerState.value = 'finished'; }
};
const startCookingTimer = () => {
  if (timerState.value === 'running' || timerDuration.value === null) return;
  if (timerState.value === 'finished') timerSeconds.value = timerDuration.value * 60;
  timerDeadline = Date.now() + timerSeconds.value * 1000; timerState.value = 'running';
  stopTimerInterval(); cookingTimer = setInterval(updateCookingTimer, 250);
};
const pauseCookingTimer = () => {
  if (timerState.value !== 'running') return;
  updateCookingTimer();
  if (timerState.value === 'running') { stopTimerInterval(); timerState.value = 'paused'; }
};
const timerInProgress = () => {
  if (timerState.value === 'running') updateCookingTimer();
  return timerState.value === 'running' || timerState.value === 'paused';
};
const confirmTimerLeave = async () => {
  if (!timerInProgress()) return true;
  try { await ElMessageBox.confirm('离开后计时会停止并重置，也不会在后台提醒。', '结束当前计时？', { type: 'warning', confirmButtonText: '结束并离开', cancelButtonText: '继续计时' }); return true; } catch (_) { return false; }
};
const warnTimerBeforeUnload = event => { if (timerInProgress()) { event.preventDefault(); event.returnValue = ''; } };
onBeforeRouteLeave(confirmTimerLeave);
watch([timerMinutes, timerCustomMinutes], resetCookingTimer);
watch(() => route.params.id, resetCookingTimer);
const cookingSteps = ref(null);
const nextIncompleteStep = computed(() => (meal.value?.steps || []).findIndex((_, index) => !completedSteps.value.has(index)));
const focusNextStep = () => {
  if (nextIncompleteStep.value < 0) return;
  const step = cookingSteps.value?.querySelectorAll('.step-item')[nextIncompleteStep.value];
  step?.scrollIntoView({ block: 'center' });
  step?.querySelector('.step-toggle')?.focus({ preventScroll: true });
};
const resetSteps = async event => {
  const hadFocus = document.activeElement === event.currentTarget;
  completedSteps.value = new Set();
  await nextTick();
  if (hadFocus && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) cookingSteps.value?.querySelector('.next-step')?.focus();
};
const preparedIngredients = ref(new Set());
const showUnpreparedOnly = ref(false);
const unpreparedToggle = ref(null);
const ingredientList = ref(null);
const copyingIngredients = ref(false);
const ingredientCopyOpen = ref(false);
const ingredientCopyReady = ref(false);
const ingredientSnapshot = ref('');
const ingredientSnapshotInput = ref(null);
const ingredientCopyScope = ref('all');
watch(() => JSON.stringify([route.params.id, meal.value?.steps]), () => { completedSteps.value = new Set(); });
watch(() => JSON.stringify([route.params.id, meal.value?.ingredients]), () => { preparedIngredients.value = new Set(); showUnpreparedOnly.value = false; });
const ingredientName = (item, index) => (typeof item === 'string' ? item : typeof item?.name === 'string' ? item.name : '').trim() || `食材 ${index + 1}`;
const toggleIngredient = async (index, event) => {
  const source = event?.target;
  const hadFocus = source && document.activeElement === source;
  const next = new Set(preparedIngredients.value);
  if (next.has(index)) next.delete(index); else next.add(index);
  preparedIngredients.value = next;
  if (showUnpreparedOnly.value && next.has(index) && hadFocus) {
    await nextTick();
    const focused = document.activeElement;
    if (!focused || focused === document.body || focused === source || !focused.isConnected) {
      const remaining = [...(ingredientList.value?.querySelectorAll('input[type="checkbox"]') || [])].filter(input => input.getClientRects().length);
      (remaining.find(input => Number(input.dataset.ingredientIndex) > index) || remaining.at(-1) || unpreparedToggle.value)?.focus({ preventScroll: true });
    }
  }
};
const resetIngredients = async event => {
  const source = event.currentTarget;
  const hadFocus = document.activeElement === source;
  preparedIngredients.value = new Set();
  await nextTick();
  if (hadFocus && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) ingredientList.value?.querySelector('input[type="checkbox"]')?.focus();
};
const copyIngredients = async (onlyUnprepared = false) => {
  if (copyingIngredients.value || !meal.value?.ingredients?.length || loading.value) return;
  const sequence = loadSequence;
  const source = document.activeElement;
  const clean = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
  const lines = meal.value.ingredients.map((item, index) => {
    if (onlyUnprepared && preparedIngredients.value.has(index)) return null;
    const name = clean(ingredientName(item, index));
    const amount = typeof item === 'string' ? '' : clean(item?.amount);
    return `- ${name}${amount ? `：${amount}` : '（用量未填写）'}`;
  }).filter(Boolean);
  if (!lines.length) return;
  const text = [`${clean(meal.value.name)} · ${onlyUnprepared ? '未备食材' : '食材清单'}`, onlyUnprepared ? '点击时未标记备好的食材，不会更新购物清单。' : '当前菜谱快照，不会更新购物清单。', ...lines].join('\n');
  copyingIngredients.value = true; ingredientCopyReady.value = false;
  try { await navigator.clipboard.writeText(text); if (sequence === loadSequence) ElMessage.success(`${onlyUnprepared ? '已复制未备食材' : '已复制菜谱食材'}；购物清单未改变`); }
  catch (_) {
    if (sequence === loadSequence) {
      ingredientCopyScope.value = onlyUnprepared ? 'pending' : 'all'; ingredientSnapshot.value = text;
      const focused = document.activeElement;
      if (!focused || focused === document.body || focused === source || !focused.isConnected) ingredientCopyOpen.value = true;
      else ingredientCopyReady.value = true;
    }
  }
  finally { if (sequence === loadSequence) copyingIngredients.value = false; }
};
const selectIngredientSnapshot = () => { const input = ingredientSnapshotInput.value?.textarea; if (input) { input.focus(); input.select(); } };
const toggleStep = index => {
  const next = new Set(completedSteps.value);
  if (next.has(index)) next.delete(index); else next.add(index);
  completedSteps.value = next;
};
const memoryPages = computed(() => Math.max(1, Math.ceil(memoryTotal.value / memoryPageSize)));
const difficultyText = computed(() => ({ easy: '简单', medium: '适中', hard: '费工夫' }[meal.value?.difficulty] || '未设置'));
const imageFor = value => resolveUploadedImage(value) || defaultImage;
const imageVersion = value => `${imageFor(value)}:${imageVersions.value[imageFor(value)] || 0}`;
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
  copyingIngredients.value = false; ingredientCopyOpen.value = false; ingredientCopyReady.value = false; ingredientSnapshot.value = '';
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
const coverLoaded = event => { if (event.target?.isConnected && event.target.dataset.placeholder !== '1') coverFailed.value = false; };
const resetPreview = image => { previewUnavailable.value = imageFor(image) === defaultImage; previewRetrying.value = false; previewAttempt.value = 0; };
const showPhoto = (images, index, title, event, gallery = false) => { if (images.length && index >= 0 && index < images.length) { resetPreview(images[index]); photoFocus = { origin: event.currentTarget, index: gallery ? index : null }; viewedPhoto.value = { images, index, title }; } };
const previewError = event => {
  const image = event.target;
  if (!image?.isConnected || Number(image.dataset.attempt) !== previewAttempt.value) return;
  fallbackImage(event);
  if (image.dataset.placeholder === '1') { previewUnavailable.value = true; previewRetrying.value = false; }
};
const previewLoaded = async event => {
  const image = event.target;
  if (!image?.isConnected || image.dataset.placeholder === '1' || !viewedPhoto.value || imageFor(viewedPhoto.value.images[viewedPhoto.value.index]) === defaultImage || Number(image.dataset.attempt) !== previewAttempt.value) return;
  const restoreFocus = document.activeElement === previewRetryButton.value?.$el;
  if (previewAttempt.value > 0) {
    const source = imageFor(viewedPhoto.value.images[viewedPhoto.value.index]);
    imageVersions.value = { ...imageVersions.value, [source]: (imageVersions.value[source] || 0) + 1 };
  }
  previewUnavailable.value = false; previewRetrying.value = false;
  if (restoreFocus) { await nextTick(); if (viewedPhoto.value && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) previewImage.value?.focus({ preventScroll: true }); }
};
const retryPreview = () => { if (!viewedPhoto.value || previewRetrying.value || imageFor(viewedPhoto.value.images[viewedPhoto.value.index]) === defaultImage) return; previewRetrying.value = true; previewAttempt.value++; };
const closePhoto = () => { viewedPhoto.value = null; };
const restorePhotoFocus = async () => { const target = photoFocus; photoFocus = null; await new Promise(resolve => setTimeout(resolve, 0)); if (!target || photoFocus || !target.origin?.isConnected) return; const active = document.activeElement; if (active && active !== document.body && active !== target.origin && active.isConnected) return; (target.index === null ? target.origin : photoGrid.value?.querySelectorAll('button')[target.index] || target.origin).focus(); };
const movePhoto = async direction => { if (!viewedPhoto.value) return; const next = viewedPhoto.value.index + direction; if (next >= 0 && next < viewedPhoto.value.images.length) { const viewer = viewedPhoto.value; const restoreFocus = document.activeElement === previewRetryButton.value?.$el; viewer.index = next; resetPreview(viewer.images[next]); if (photoFocus && photoFocus.index !== null) photoFocus.index = next; if (restoreFocus) { await nextTick(); if (viewedPhoto.value === viewer && viewer.index === next && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) previewImage.value?.focus({ preventScroll: true }); } } };
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
  if (reportUncertain.value) {
    try { await ElMessageBox.confirm('图片反馈结果尚未确认，切换菜品后核对提示会丢失。', '确认切换？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续核对' }); } catch (_) { return false; }
  }
  return confirmTimerLeave();
});
watch(() => route.params.id, load, { immediate: true });
window.addEventListener('keydown', onPhotoKey);
window.addEventListener('beforeunload', warnTimerBeforeUnload);
onBeforeUnmount(() => { timerObserver?.disconnect(); stopTimerInterval(); loadSequence++; memorySequence++; reportSequence++; window.removeEventListener('keydown', onPhotoKey); window.removeEventListener('beforeunload', warnTimerBeforeUnload); });
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
        <button class="cover-button" type="button" :disabled="!meal.imageUrl" :aria-label="`查看${meal.name}封面照片`" :aria-describedby="coverNotice ? 'cover-notice' : undefined" @click="showPhoto([meal.imageUrl], 0, `${meal.name}封面`, $event)"><img :key="imageVersion(meal.imageUrl)" :src="coverImage" :alt="meal.imageUrl ? meal.name : '暂无封面图片'" @load="coverLoaded" @error="fallbackCover" /><span v-if="coverNotice" id="cover-notice" class="cover-notice">{{ coverNotice }}</span></button>
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

      <nav class="detail-sections" aria-label="菜谱内容导航"><span>快速查看</span><button type="button" @click="jumpToDetailSection(ingredientHeading)">食材</button><button type="button" @click="jumpToDetailSection(stepsHeading)">做法</button><button type="button" @click="jumpToDetailSection(photoHeading)">照片</button><button type="button" @click="jumpToDetailSection(memoryHeading)">回忆</button></nav>
      <section class="content-grid">
        <el-card>
          <template #header><span ref="ingredientHeading" class="detail-section-heading" tabindex="-1">食材清单</span></template>
          <el-empty v-if="!meal.ingredients?.length" description="暂无食材"><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">补充食材 →</router-link></el-empty>
          <div v-else ref="ingredientList" class="ingredient-list">
            <div class="ingredient-progress"><p aria-live="polite">本次已备好 {{ preparedIngredients.size }} / {{ meal.ingredients.length }} 项</p><button ref="unpreparedToggle" type="button" :aria-pressed="showUnpreparedOnly" @click="showUnpreparedOnly = !showUnpreparedOnly">仅看未备食材{{ showUnpreparedOnly ? ' · 已开启' : '' }}</button><button v-if="preparedIngredients.size" type="button" @click="resetIngredients">重置备菜</button><button type="button" :disabled="copyingIngredients" @click="copyIngredients(false)">复制食材清单</button><button v-if="preparedIngredients.size" type="button" :disabled="copyingIngredients || preparedIngredients.size >= meal.ingredients.length" @click="copyIngredients(true)">复制未备食材</button><small v-if="copyingIngredients" role="status">正在复制…</small><small>备菜标记和筛选仅在当前页面保留，刷新后重置。复制当前菜谱快照，不会修改菜谱或购物清单。</small></div>
            <div v-if="ingredientCopyReady" class="ingredient-copy-recovery" role="status"><span>自动复制未完成，可手动复制点击时的快照。</span><button type="button" @click="ingredientCopyOpen = true">打开手动复制</button></div>
            <p v-if="showUnpreparedOnly && preparedIngredients.size === meal.ingredients.length" class="ingredients-complete" role="status">食材已全部备好。可关闭筛选查看全部，或重置备菜标记。</p>
            <div v-for="(item, index) in meal.ingredients" :key="index" v-show="!showUnpreparedOnly || !preparedIngredients.has(index)" class="ingredient-row" :class="{ prepared: preparedIngredients.has(index) }">
              <label><input type="checkbox" :checked="preparedIngredients.has(index)" :aria-label="`第 ${index + 1} 项${ingredientName(item, index)}已备好`" :data-ingredient-index="index" @change="toggleIngredient(index, $event)" /><span>{{ ingredientName(item, index) }}</span></label><strong>{{ typeof item === 'string' ? '' : item?.amount }}</strong>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header><span ref="stepsHeading" class="detail-section-heading" tabindex="-1">做法步骤</span></template>
          <div ref="timerAnchor" class="timer-anchor" tabindex="-1" aria-label="烹饪计时器位置">
          <div class="cooking-timer" aria-label="烹饪计时器"><div><strong>烹饪计时器</strong><label>时长 <select v-model.number="timerMinutes" :disabled="timerState === 'running' || timerState === 'paused'" aria-label="计时时长"><option v-for="minutes in [1, 3, 5, 10, 15, 30, 60, 90]" :key="minutes" :value="minutes">{{ minutes }} 分钟</option><option value="custom">自定义</option></select></label><label v-if="timerMinutes === 'custom'">分钟 <input v-model="timerCustomMinutes" type="text" inputmode="numeric" pattern="[0-9]*" aria-label="自定义计时分钟数" :aria-invalid="timerDuration === null ? 'true' : undefined" aria-describedby="timer-duration-help" :disabled="timerState === 'running' || timerState === 'paused'" /></label><output class="timer-display" aria-live="off" :aria-label="timerDuration === null ? '时长无效' : `剩余 ${timerDisplay}`">{{ timerDisplay }}</output></div><small v-if="timerMinutes === 'custom'" id="timer-duration-help">请输入 1 至 180 的整数分钟。</small><div class="timer-actions"><button type="button" :aria-disabled="timerDuration === null" @click="timerState === 'running' ? pauseCookingTimer() : startCookingTimer()">{{ timerState === 'running' ? '暂停计时' : timerState === 'paused' ? '继续计时' : timerState === 'finished' ? '再次计时' : '开始计时' }}</button><button type="button" :aria-disabled="timerState === 'idle'" @click="resetCookingTimer">重置计时</button></div><p role="status" aria-live="polite">{{ timerDuration === null ? '请输入有效的计时时长。' : timerState === 'finished' ? '计时结束，请检查食物。' : timerState === 'paused' ? '计时已暂停。' : timerState === 'running' ? '计时进行中。' : '选择时长后开始。' }}</p><small>仅在当前页面显示，不保证后台提醒，没有声音；离开或刷新页面后重置。</small></div>
          </div>
          <el-empty v-if="!meal.steps?.length" description="暂无做法"><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">补充做法 →</router-link></el-empty>
          <div v-else ref="cookingSteps" class="steps-list">
            <div class="cooking-progress"><p aria-live="polite">本次已完成 {{ completedSteps.size }} / {{ meal.steps.length }} 步 · {{ nextIncompleteStep < 0 ? '全部完成' : `下一步：第 ${nextIncompleteStep + 1} 步` }}</p><button class="next-step" type="button" :disabled="nextIncompleteStep < 0" @click="focusNextStep">定位下一步</button><button v-if="completedSteps.size" type="button" @click="resetSteps">重置进度</button><small>仅在当前页面保留，刷新后重置，不会修改菜谱。</small></div>
            <div v-for="(step, index) in meal.steps" :key="index" class="step-item" :class="{ 'no-image': !step?.imageUrl }">
              <div class="step-index">{{ index + 1 }}</div>
              <button v-if="step?.imageUrl" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 步照片`" @click="showPhoto([step.imageUrl], 0, `第 ${index + 1} 步`, $event)" ><img :key="imageVersion(step.imageUrl)" :src="imageFor(step.imageUrl)" :alt="`第 ${index + 1} 步照片`" @error="fallbackImage" /></button>
              <p :id="`recipe-step-description-${index}`">{{ typeof step === 'string' ? step : step?.description }}</p>
              <button type="button" class="step-toggle" :aria-describedby="`recipe-step-description-${index}`" :aria-pressed="completedSteps.has(index)" :aria-label="`${completedSteps.has(index) ? '取消完成' : '标记完成'}第 ${index + 1} 步`" @click="toggleStep(index)">{{ completedSteps.has(index) ? '已完成 ✓' : '标记完成' }}</button>
            </div>
          </div>
        </el-card>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header><span ref="photoHeading" class="detail-section-heading" tabindex="-1">照片墙</span></template>
          <div v-if="photos.length" ref="photoGrid" class="photo-grid">
            <button v-for="(photo, index) in photos" :key="`${index}-${photo}`" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 张菜品照片`" @click="showPhoto(photos, index, meal.name, $event, true)"><img :key="imageVersion(photo)" :src="imageFor(photo)" :alt="`第 ${index + 1} 张菜品照片`" @error="fallbackImage" /></button>
          </div>
          <el-empty v-else description="暂无额外照片"><template #image><el-icon><Picture /></el-icon></template><router-link class="detail-empty-action" :to="{ name: 'MealEditor', params: { id: route.params.id }, query: editorQuery }">添加菜品照片 →</router-link></el-empty>
        </el-card>

        <el-card>
          <template #header><span ref="memoryHeading" class="detail-section-heading" tabindex="-1">饭后回忆</span></template>
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
    <button v-if="timerOutsideView && timerState !== 'idle'" ref="floatingTimer" type="button" class="floating-timer" :aria-label="timerState === 'finished' ? '计时结束，返回计时器' : `${timerState === 'paused' ? '计时已暂停' : '计时中'}，剩余 ${timerDisplay}，返回计时器`" @click="revealTimer"><span>{{ timerState === 'finished' ? '计时结束' : timerState === 'paused' ? '已暂停' : '计时中' }}</span><strong>{{ timerDisplay }}</strong><span aria-hidden="true">↑</span></button>
    <el-dialog v-model="ingredientCopyOpen" :title="ingredientCopyScope === 'pending' ? '手动复制未备食材' : '手动复制食材清单'" width="min(560px, 92vw)" @opened="selectIngredientSnapshot"><p class="copy-hint">浏览器未允许自动复制。以下是点击时的菜谱快照，之后的修改不会自动更新。</p><el-input ref="ingredientSnapshotInput" :model-value="ingredientSnapshot" type="textarea" :rows="8" readonly aria-label="菜谱食材快照" /><template #footer><el-button @click="selectIngredientSnapshot">全选内容</el-button><el-button type="primary" @click="ingredientCopyOpen = false">完成</el-button></template></el-dialog>
    <el-dialog :model-value="!!viewedPhoto" title="菜品照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) closePhoto() }" @close="closePhoto" @close-auto-focus="restorePhotoFocus"><template v-if="viewedPhoto"><img ref="previewImage" :key="`${viewedPhoto.index}-${viewedPhoto.images[viewedPhoto.index]}-${previewAttempt}`" :data-attempt="previewAttempt" class="photo-preview" tabindex="-1" :src="imageFor(viewedPhoto.images[viewedPhoto.index])" :alt="viewedPhoto.title" @load="previewLoaded" @error="previewError" /><el-alert v-if="previewUnavailable" class="photo-load-alert" type="warning" :closable="false" show-icon :title="previewRetrying ? '正在重试这张照片，菜谱内容不会改变。' : '照片暂时无法加载，菜谱内容不会改变。'"><el-button v-if="imageFor(viewedPhoto.images[viewedPhoto.index]) !== defaultImage" ref="previewRetryButton" link type="primary" :aria-disabled="previewRetrying" @click="retryPreview">{{ previewRetrying ? '正在重试…' : '重试这张照片' }}</el-button></el-alert><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张菜品照片" @click="movePhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.images.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.images.length - 1" aria-label="下一张菜品照片" @click="movePhoto(1)">下一张</el-button></div><p v-if="viewedPhoto.images.length > 1" class="photo-key-hint">也可使用键盘 ← → 切换照片</p><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
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
.detail-sections { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; color: var(--text-primary); font-size: 13px; }
.detail-sections button { min-height: 44px; padding: 8px 14px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-primary); color: var(--text-primary); font: inherit; font-weight: 700; cursor: pointer; }
.detail-sections button:focus-visible, .detail-section-heading:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.detail-toolbar { display: flex; justify-content: space-between; gap: 12px; }
.toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.toolbar-actions :deep(.el-button + .el-button) { margin-left: 0; }
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
.ingredient-row { align-items: center; gap: 12px; }
.ingredient-row > label, .ingredient-row > strong { flex: 1; min-width: 0; overflow-wrap: anywhere; }
.ingredient-row label { display: flex; align-items: center; min-height: 44px; gap: 10px; cursor: pointer; }
.ingredient-row input { flex: none; width: 20px; height: 20px; margin: 0; accent-color: var(--secondary-color); }
.ingredient-row input:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.ingredient-row > strong { text-align: right; }
.ingredient-row.prepared { padding-right: 8px; padding-left: 8px; border-radius: 10px; background: var(--bg-secondary); color: var(--text-primary); }
.ingredient-row.prepared label span { text-decoration: line-through; text-decoration-thickness: 1px; }
.ingredient-progress { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; margin-bottom: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; }
.ingredient-progress p { margin: 0; font-weight: 700; }
.ingredients-complete { margin: 12px 0; padding: 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.ingredient-progress small { flex-basis: 100%; font-size: 12px; line-height: 1.5; }
.ingredient-progress button { min-height: 44px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; }
.ingredient-progress button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.ingredient-copy-recovery { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 12px; color: var(--text-primary); font-size: 13px; }
.ingredient-copy-recovery button { min-height: 44px; padding: 4px 0; border: 0; background: transparent; color: var(--text-primary); font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
.ingredient-copy-recovery button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.copy-hint { color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.steps-list, .memory-list { display: flex; flex-direction: column; gap: 12px; }
.cooking-progress { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 12px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; }
.cooking-progress p { margin: 0; font-weight: 700; }
.cooking-progress small { flex-basis: 100%; font-size: 12px; line-height: 1.5; }
.cooking-progress button, .step-toggle { min-height: 44px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-primary); color: var(--text-primary); cursor: pointer; }
.cooking-progress button:disabled { opacity: .55; cursor: not-allowed; }
.cooking-timer { display: grid; gap: 8px; margin-bottom: 14px; padding: 12px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; }
.cooking-timer > div { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.cooking-timer label { display: flex; align-items: center; gap: 6px; }
.cooking-timer select, .cooking-timer input, .cooking-timer button { min-height: 44px; padding: 6px 10px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-primary); color: var(--text-primary); font: inherit; }
.cooking-timer input { width: 70px; box-sizing: border-box; }
.cooking-timer button { cursor: pointer; }
.cooking-timer button[aria-disabled="true"] { opacity: .55; cursor: not-allowed; }
.cooking-timer :is(button, select, input):focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.timer-display { font-variant-numeric: tabular-nums; font-size: 20px; font-weight: 700; }
.cooking-timer p, .cooking-timer small { margin: 0; line-height: 1.5; }
.timer-anchor:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 3px; }
.floating-timer { position: fixed; z-index: 20; right: max(12px, env(safe-area-inset-right)); bottom: max(16px, env(safe-area-inset-bottom)); display: flex; align-items: center; gap: 7px; min-height: 44px; padding: 8px 12px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-primary); color: var(--text-primary); box-shadow: 0 8px 24px var(--shadow-color); font: inherit; font-size: 13px; cursor: pointer; }
.floating-timer strong { font-variant-numeric: tabular-nums; }
.floating-timer:focus-visible { outline: 3px solid var(--text-primary); outline-offset: 2px; }
.step-toggle { grid-column: 1 / -1; justify-self: start; }
.step-toggle[aria-pressed="true"] { font-weight: 700; background: var(--bg-tertiary); }
.cooking-progress button:focus-visible, .step-toggle:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
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
.photo-load-alert { margin-top: 12px; }
.photo-key-hint { margin: 0 0 12px; color: var(--text-secondary); text-align: center; font-size: 13px; }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.tips-card p { white-space: pre-wrap; }
.step-item p, .tips-card p { min-width: 0; overflow-wrap: anywhere; }
@media (max-width: 768px) { .hero, .content-grid { grid-template-columns: 1fr; } .meta-grid { grid-template-columns: repeat(2, 1fr); } .step-item, .step-item.no-image { grid-template-columns: 28px 1fr; } .step-item img { grid-column: 2; } }
@media (max-width: 600px) {
  .detail-toolbar { flex-direction: column; align-items: stretch; }
  .detail-toolbar > :deep(.el-button) { align-self: flex-start; min-height: 44px; }
  .toolbar-actions { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .toolbar-actions :deep(.el-button) { width: 100%; min-width: 0; min-height: 44px; margin: 0; }
}
</style>
