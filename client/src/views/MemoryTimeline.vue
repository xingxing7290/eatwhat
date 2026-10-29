<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture, Edit } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { usePhotoRemovalUndo } from '@/composables/usePhotoRemovalUndo';
import { resolveUploadedImage, handleUploadedImageError } from '@/utils/uploadedImage.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const memories = ref([]);
const route = useRoute();
const router = useRouter();
const validMonth = value => typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
const monthLinkNotice = ref(route.query.month !== undefined && !validMonth(route.query.month) ? '回忆链接中的月份无效，已显示全部月份。' : '');
const timelinePage = ref(1);
const timelineLimit = 12;
const timelineTotal = ref(0);
const timelineCapable = ref(false);
const timelineSearch = ref('');
const timelineMonth = ref(validMonth(route.query.month) ? route.query.month : '');
const timelineMealType = ref('all');
const timelinePhotos = ref('all');
let timelineTimer = null;
let monthUrlTimer = null;
const internalMonths = new Set();
const meals = ref([]);
const selectedMeals = ref([]);
const mealLoading = ref(false);
const mealError = ref('');
const mealTotal = ref(0);
const mealQuery = ref('');
const mealLoaded = ref(false);
let mealSequence = 0;
let mealTimer = null;
let memorySequence = 0;
let alive = true;
const loading = ref(false);
const loadError = ref('');
const deletingId = ref('');
const deleteIssue = ref('');
const deleteTargetId = ref('');
const deleteReviewError = ref('');
const deleteReviewMessage = ref('');
const checkingDelete = ref(false);
const editing = ref(null);
const editIssue = ref('');
const editReviewed = ref(false);
const checkingEdit = ref(false);
const confirmingMeals = ref(false);
const latestEdit = ref(null);
const latestError = ref('');
const linkedId = ref('');
const linkedError = ref('');
const linkedLoading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const photoFiles = ref([]);
const viewedPhoto = ref(null);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const form = reactive({ date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', actualCookTime: 0, nextImprovement: '', mealIds: [], existingPhotos: [] });
const { removedPhotos, existingPhotoGrid, undoPhotoButton, resetPhotoUndo, removeExistingPhoto, undoPhotoRemoval } = usePhotoRemovalUndo(form);
const unavailableMealCount = ref(0);
const clearedUnavailableMeals = ref(false);
const originalAvailableMeals = ref([]);
const mealVisibilityVerified = ref(false);
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value || photoFiles.value.length > 0 || clearedUnavailableMeals.value);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => resetForm(), reopen: () => { dialogVisible.value = true; }, label: '回忆' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || reviewing.value || deciding.value || checkingEdit.value || checkingDelete.value || confirmingMeals.value || linkedLoading.value || !!deletingId.value);
const uncertain = computed(() => saveUncertain.value || !!editIssue.value || !!deleteIssue.value);
useDraftGuard({ dirty, busy, uncertain, label: '饭后回忆' });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };
const supportedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const supportedPhotoExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const maxPhotoSize = 5 * 1024 * 1024;
const photoAccept = 'image/jpeg,image/png,image/gif,image/webp';

const photoValidationError = (file) => {
  if (!file) return 'empty';
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const typeMatched = supportedPhotoTypes.has(type);
  const extMatched = supportedPhotoExts.some(ext => name.endsWith(ext));
  if (!typeMatched || !extMatched) return 'type';
  if (Number(file.size || 0) > maxPhotoSize) return 'size';
  return '';
};

const isSupportedPhoto = (file) => !photoValidationError(file);

const logRejectedPhoto = (file, reason) => {
  const raw = file?.raw || file;
  console.warn('[memory-upload] rejected photo', {
    reason,
    name: raw?.name || file?.name || '',
    type: raw?.type || file?.type || '',
    size: raw?.size || file?.size || 0
  });
};

const handlePhotoChange = async (_uploadFile, uploadFiles) => {
  const invalidIds = new Set();
  let rejectedReason = '';
  uploadFiles.forEach(file => {
    const reason = photoValidationError(file.raw || file);
    if (reason) {
      rejectedReason = rejectedReason || reason;
      logRejectedPhoto(file, reason);
      invalidIds.add(file.uid);
      return;
    }
  });
  if (rejectedReason === 'size') {
    ElMessage.warning('\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 5MB');
  } else if (rejectedReason) {
    ElMessage.warning('\u53ea\u652f\u6301 jpg\u3001png\u3001gif\u3001webp \u56fe\u7247');
  }
  if (invalidIds.size) {
    await nextTick();
    photoFiles.value = photoFiles.value.filter(file => !invalidIds.has(file.uid));
  }
};


const filtersActive = computed(() => !!timelineSearch.value.trim() || !!timelineMonth.value || timelineMealType.value !== 'all' || timelinePhotos.value !== 'all');
const relatedAlbumMonth = computed(() => validMonth(timelineMonth.value) && Number(timelineMonth.value.slice(0, 4)) >= 100 && Number(timelineMonth.value.slice(0, 4)) <= 9998 ? timelineMonth.value : '');
const relatedReviewMonth = computed(() => relatedAlbumMonth.value && Number(relatedAlbumMonth.value.slice(0, 4)) >= 2000 && Number(relatedAlbumMonth.value.slice(0, 4)) <= 2100 ? relatedAlbumMonth.value : '');
const visibleMemories = computed(() => {
  if (timelineCapable.value) return memories.value;
  const query = timelineSearch.value.trim().toLocaleLowerCase();
  return memories.value.filter(item => (!timelineMonth.value || item.date.startsWith(`${timelineMonth.value}-`)) && (timelineMealType.value === 'all' || item.mealType === timelineMealType.value) && (timelinePhotos.value === 'all' || (Array.isArray(item.photos) && item.photos.length > 0) === (timelinePhotos.value === 'yes')) && (!query || [item.title, item.note, item.mood, item.nextImprovement].some(value => String(value || '').toLocaleLowerCase().includes(query))));
});
const grouped = computed(() => visibleMemories.value.reduce((acc, item) => {
  const key = item.date;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {}));
const mealId = meal => String(meal?._id || meal?.id || '');
const validVersion = item => item?.supportsConditionalEdit === true && item.editVersion &&
  (item.editVersion.revision === null || (typeof item.editVersion.revision === 'string' && !!item.editVersion.revision && item.editVersion.revision.length <= 128)) &&
  (item.editVersion.updatedAt === null || (typeof item.editVersion.updatedAt === 'string' && Number.isFinite(Date.parse(item.editVersion.updatedAt))));
const canDelete = item => item?.supportsConditionalDelete === true && validVersion(item);
const deleteBlocked = computed(() => saveUncertain.value || !!editIssue.value || (!!editing.value && dirty.value));
const legacyDeleteWarning = computed(() => visibleMemories.value.some(item => !canDelete(item)));
const timelinePages = computed(() => Math.max(1, Math.ceil(timelineTotal.value / timelineLimit)));
const resetFilters = () => { timelineSearch.value = ''; timelineMonth.value = ''; timelineMealType.value = 'all'; timelinePhotos.value = 'all'; };
const sameVersion = (left, right) => !!left && !!right && left.revision === right.revision && left.updatedAt === right.updatedAt;
const mealOptions = computed(() => {
  const seen = new Set();
  return [...selectedMeals.value, ...meals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const rememberMeals = ids => {
  const available = new Map(mealOptions.value.map(meal => [mealId(meal), meal]));
  selectedMeals.value = ids.map(id => available.get(String(id))).filter(Boolean);
};
const searchMealCatalog = async () => {
  const sequence = ++mealSequence;
  const query = mealQuery.value.trim();
  mealLoading.value = true;
  mealError.value = '';
  meals.value = [];
  mealTotal.value = 0;
  try {
    const params = { page: 1, limit: 50 };
    if (query) params.search = query;
    const result = await api.meal.getAllMeals(params);
    if (!alive || sequence !== mealSequence) return;
    let rows = result.data;
    let total = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim()) || new Set(rows.map(mealId)).size !== rows.length) throw new Error('菜品列表不完整');
    if (result.page == null && result.limit == null) {
      if (rows.length !== total) throw new Error('菜品列表不完整');
      const lower = query.toLowerCase();
      rows = rows.filter(meal => [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)));
      total = rows.length;
      rows = rows.slice(0, 50);
    } else if (result.page !== 1 || result.limit !== 50 || rows.length !== Math.min(50, total)) throw new Error('菜品分页数据不完整，请重试');
    meals.value = rows;
    mealTotal.value = total;
    mealLoaded.value = true;
  } catch (e) {
    if (alive && sequence === mealSequence) mealError.value = e?.error || e?.message || '菜品加载失败';
  } finally { if (alive && sequence === mealSequence) mealLoading.value = false; }
};
const searchMeals = query => {
  mealQuery.value = typeof query === 'string' ? query : '';
  mealSequence++;
  mealLoading.value = true;
  mealError.value = '';
  meals.value = [];
  mealTotal.value = 0;
  if (mealTimer) clearTimeout(mealTimer);
  mealTimer = setTimeout(searchMealCatalog, 180);
};
const openMealOptions = visible => { if (visible && !mealLoaded.value && !mealLoading.value) searchMeals(''); };
const imageFor = photo => resolveUploadedImage(photo) || placeholder;
const imageError = event => handleUploadedImageError(event, placeholder);
const openMemoryPhoto = (item, index) => { viewedPhoto.value = { title: item.title || item.date || '饭后照片', photos: item.photos, index }; };
const moveMemoryPhoto = direction => {
  if (!viewedPhoto.value) return;
  const next = viewedPhoto.value.index + direction;
  if (next >= 0 && next < viewedPhoto.value.photos.length) viewedPhoto.value.index = next;
};
const onPhotoKey = event => {
  if (!viewedPhoto.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveMemoryPhoto(event.key === 'ArrowLeft' ? -1 : 1);
};

const resetForm = () => {
  resetPhotoUndo();
  Object.assign(form, { date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', actualCookTime: 0, nextImprovement: '', mealIds: [], existingPhotos: [] });
  photoFiles.value = [];
  selectedMeals.value = [];
  unavailableMealCount.value = 0; clearedUnavailableMeals.value = false; originalAvailableMeals.value = []; mealVisibilityVerified.value = false;
  editing.value = null; editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const fillEdit = item => {
  if (!(item?._id || item?.id) || !validVersion(item) || typeof item.date !== 'string' || !Object.prototype.hasOwnProperty.call(mealTypeText, item.mealType) || !Array.isArray(item.photos) || item.photos.some(photo => typeof photo !== 'string') || !Array.isArray(item.mealIds) || item.mealIds.some(meal => meal !== null && (!mealId(meal) || typeof meal.name !== 'string'))) throw new Error('回忆数据或版本不完整，请刷新后重试');
  resetPhotoUndo();
  unavailableMealCount.value = item.mealIds.filter(meal => meal === null).length;
  clearedUnavailableMeals.value = false; mealVisibilityVerified.value = item.supportsUnavailableMealVisibility === true;
  originalAvailableMeals.value = item.mealIds.filter(Boolean);
  Object.assign(form, { date: item.date, mealType: item.mealType, title: item.title || '', mood: item.mood || '', rating: item.rating || 0, note: item.note || '', actualCookTime: item.actualCookTime || 0, nextImprovement: item.nextImprovement || '', mealIds: originalAvailableMeals.value.map(mealId), existingPhotos: [...item.photos] });
  selectedMeals.value = [...originalAvailableMeals.value]; photoFiles.value = [];
  editing.value = { id: String(item._id || item.id), version: { ...item.editVersion } };
  editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const clearUnavailableMeals = async () => {
  if (!editing.value || !mealVisibilityVerified.value || !unavailableMealCount.value || clearedUnavailableMeals.value || busy.value) return;
  confirmingMeals.value = true;
  try { await ElMessageBox.confirm(`保存后会从这条回忆中移除 ${unavailableMealCount.value} 条不可用菜品引用，不会删除菜谱。`, '清除不可用菜品？', { type: 'warning', confirmButtonText: '确认清除并编辑', cancelButtonText: '保留原记录' }); }
  catch (_) { return; } finally { confirmingMeals.value = false; }
  clearedUnavailableMeals.value = true;
};
const undoClearUnavailableMeals = async () => {
  if (!clearedUnavailableMeals.value || busy.value) return;
  const original = JSON.parse(initialForm.value).mealIds;
  if (JSON.stringify(form.mealIds) !== JSON.stringify(original)) {
    confirmingMeals.value = true;
    try { await ElMessageBox.confirm('撤销清除会放弃当前相关菜品的调整。', '撤销清除？', { type: 'warning', confirmButtonText: '放弃调整并撤销', cancelButtonText: '继续编辑' }); } catch (_) { return; } finally { confirmingMeals.value = false; }
  }
  form.mealIds = [...original];
  selectedMeals.value = [...selectedMeals.value, ...originalAvailableMeals.value];
  rememberMeals(form.mealIds); clearedUnavailableMeals.value = false;
};
const confirmReplaceDraft = async () => {
  if (!dirty.value) return true;
  try { await ElMessageBox.confirm('切换回忆会丢失当前未保存的内容和所选照片。', '放弃当前草稿？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续编辑' }); return true; } catch (_) { return false; }
};
const startCreate = async () => {
  if (busy.value || deleteIssue.value) return;
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (editing.value) { if (!await confirmReplaceDraft()) return; resetForm(); }
  dialogVisible.value = true;
};
const startEdit = async item => {
  if (busy.value || deleteIssue.value || saveUncertain.value) return;
  if (editing.value?.id === String(item._id || item.id)) { dialogVisible.value = true; return; }
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (!validVersion(item)) return ElMessage.warning('服务器未提供有效的回忆版本，暂时无法安全编辑');
  if (!await confirmReplaceDraft()) return;
  try { fillEdit(item); dialogVisible.value = true; } catch (e) { ElMessage.warning(e.message); }
};
const checkLatest = async () => {
  if (!editing.value || checkingEdit.value) return;
  checkingEdit.value = true; editReviewed.value = false; latestError.value = ''; latestEdit.value = null;
  try {
    const item = await api.memory.get(editing.value.id, { params: { view: 'editor' } });
    if (!item || String(item._id || item.id) !== editing.value.id || !validVersion(item)) throw new Error('最新回忆数据或版本不完整');
    latestEdit.value = item; editReviewed.value = true;
  } catch (e) {
    if (e?.code === 'MEMORY_NOT_FOUND') editReviewed.value = true;
    else latestError.value = e?.error || e?.message || '无法读取最新回忆，请重试';
  } finally { checkingEdit.value = false; }
};
const reloadLatest = async () => {
  if (!editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value)) return;
  try { await ElMessageBox.confirm('载入最新回忆会放弃当前草稿和所选照片。', '重新载入最新内容？', { type: 'warning', confirmButtonText: '放弃草稿并载入', cancelButtonText: '继续保留草稿' }); } catch (_) { return; }
  try { fillEdit(latestEdit.value); } catch (e) { ElMessage.warning(e.message); }
};
const retryEdit = async () => {
  if (editIssue.value !== 'unknown' || !editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value) || !sameVersion(editing.value?.version, latestEdit.value.editVersion)) return;
  try { await ElMessageBox.confirm('核对时版本尚未变化；先前请求仍可能稍后完成。重试使用相同版本，只有一个请求可以成功。', '确认重新提交？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); editIssue.value = ''; editReviewed.value = false; } catch (_) {}
};
const discardEditDraft = async () => {
  if (!editing.value || !editReviewed.value) return;
  try { await ElMessageBox.confirm('将放弃本页编辑草稿与所选照片，不会删除服务器上的回忆。', '放弃编辑草稿？', { type: 'warning', confirmButtonText: '确认放弃草稿', cancelButtonText: '继续核对' }); } catch (_) { return; }
  resetForm(); dialogVisible.value = false;
};
const openLinkedMemory = async id => {
  if (!id || linkedLoading.value || uncertain.value) return;
  if (!await confirmReplaceDraft()) return;
  linkedId.value = id; linkedLoading.value = true; linkedError.value = '';
  try {
    const item = await api.memory.get(id, { params: { view: 'editor' } });
    if (!alive) return;
    if (!item || String(item._id || item.id) !== id) throw new Error('回忆数据不完整');
    fillEdit(item); dialogVisible.value = true; linkedId.value = '';
  } catch (e) { if (alive) linkedError.value = e?.error || e?.message || '无法打开这条回忆'; }
  finally { if (alive) linkedLoading.value = false; }
};
const load = async () => {
  if (timelineTimer) { clearTimeout(timelineTimer); timelineTimer = null; }
  const sequence = ++memorySequence;
  loading.value = true;
  loadError.value = '';
  try {
    const query = { view: 'timeline', mealVisibility: 'preserve', page: timelinePage.value, limit: timelineLimit, search: timelineSearch.value.trim(), mealType: timelineMealType.value, photos: timelinePhotos.value, ...(timelineMonth.value ? { month: timelineMonth.value } : {}) };
    const memoryData = await api.memory.list(query);
    if (!alive || sequence !== memorySequence) return;
    const validItems = rows => Array.isArray(rows) && rows.every(item => item && typeof item._id === 'string' && item._id && typeof item.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(item.date) && (item.mealIds === undefined || (Array.isArray(item.mealIds) && item.mealIds.every(meal => meal === null || (!!mealId(meal) && typeof meal.name === 'string')))) && (item.photos === undefined || (Array.isArray(item.photos) && item.photos.every(photo => typeof photo === 'string')))) && new Set(rows.map(item => item._id)).size === rows.length;
    if (memoryData?.supportsMemoryTimeline === true) {
      if (memoryData.page !== query.page || memoryData.limit !== timelineLimit || memoryData.search !== query.search || memoryData.month !== (query.month || '') || memoryData.mealType !== query.mealType || memoryData.photos !== query.photos || !Number.isSafeInteger(memoryData.total) || memoryData.total < 0 || !validItems(memoryData.items) || memoryData.items.length !== Math.min(timelineLimit, Math.max(0, memoryData.total - (query.page - 1) * timelineLimit))) throw new Error('回忆分页数据不完整');
      timelineCapable.value = true; timelineTotal.value = memoryData.total;
      if (timelinePage.value > timelinePages.value) { timelinePage.value = timelinePages.value; return load(); }
      memories.value = memoryData.items;
    } else {
      if (!validItems(memoryData)) throw new Error('回忆列表数据不完整');
      timelineCapable.value = false; memories.value = memoryData;
    }
    if (typeof route.query.edit === 'string' && route.query.edit) {
      const requestedId = route.query.edit;
      await openLinkedMemory(requestedId);
      if (!alive || sequence !== memorySequence) return;
      await router.replace({ name: 'memories', query: timelineMonth.value ? { month: timelineMonth.value } : {} });
      return;
    }
    if (route.query.new === '1' && typeof route.query.mealId === 'string') {
      const requestedId = route.query.mealId;
      try {
        const meal = await api.meal.getMealById(requestedId);
        if (!alive || sequence !== memorySequence) return;
        if (!meal || mealId(meal) !== requestedId || typeof meal.name !== 'string' || !meal.name.trim()) throw new Error('菜品数据不完整');
        selectedMeals.value = [meal];
        form.mealIds = [requestedId];
        form.title = `做过一次：${meal.name}`;
      } catch (_) {
        if (!alive || sequence !== memorySequence) return;
        ElMessage.warning('未找到这道菜，请手动选择');
      }
      dialogVisible.value = true;
      await router.replace({ name: 'memories', query: timelineMonth.value ? { month: timelineMonth.value } : {} });
    }
  } catch (e) { if (alive && sequence === memorySequence) loadError.value = e?.error || e?.message || '加载饭后回忆失败'; }
  finally { if (alive && sequence === memorySequence) loading.value = false; }
};
const changeTimelinePage = next => {
  if (loading.value || deleteIssue.value || deletingId.value || checkingDelete.value || next < 1 || next > timelinePages.value || next === timelinePage.value) return;
  timelinePage.value = next; load();
};
watch([timelineSearch, timelineMonth, timelineMealType, timelinePhotos], () => {
  timelinePage.value = 1; memorySequence++; loading.value = true;
  if (timelineTimer) clearTimeout(timelineTimer);
  timelineTimer = setTimeout(load, 200);
}, { flush: 'sync' });
watch(timelineMonth, value => {
  monthLinkNotice.value = '';
  if (monthUrlTimer) clearTimeout(monthUrlTimer);
  monthUrlTimer = setTimeout(async () => {
    monthUrlTimer = null;
    if (!alive || route.name !== 'memories' || (route.query.month || '') === value) return;
    internalMonths.add(value);
    try { await router.replace({ name: 'memories', query: { ...route.query, month: value || undefined } }); } finally { internalMonths.delete(value); }
  }, 200);
}, { flush: 'sync' });
watch(() => route.query.month, value => {
  if (route.name !== 'memories' || internalMonths.has(value || '')) return;
  if (monthUrlTimer) { clearTimeout(monthUrlTimer); monthUrlTimer = null; }
  timelineMonth.value = validMonth(value) ? value : '';
  monthLinkNotice.value = value !== undefined && !validMonth(value) ? '回忆链接中的月份无效，已显示全部月份。' : '';
}, { flush: 'sync' });
const save = async () => {
  if (!form.date) return ElMessage.warning('请选择日期');
  if (saving.value || saveUncertain.value || editIssue.value || reviewing.value || loading.value || loadError.value || deleteIssue.value || confirmingMeals.value) return;
  if (editing.value && (!mealVisibilityVerified.value || (unavailableMealCount.value && !clearedUnavailableMeals.value)) && (clearedUnavailableMeals.value || JSON.stringify(form.mealIds) !== JSON.stringify(JSON.parse(initialForm.value).mealIds))) return ElMessage.warning('请先核对菜品完整性，再修改相关菜品');
  try {
    const invalidPhoto = photoFiles.value.find(file => !isSupportedPhoto(file.raw || file));
    if (invalidPhoto) {
      const reason = photoValidationError(invalidPhoto.raw || invalidPhoto);
      logRejectedPhoto(invalidPhoto, reason);
      ElMessage.warning(reason === 'size' ? '\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 5MB' : '\u8bf7\u4e0a\u4f20 jpg\u3001png\u3001gif\u3001webp \u56fe\u7247');
      return;
    }
    if (photoFiles.value.length > 12) return ElMessage.warning('每次最多上传 12 张照片');
    saving.value = true;
    const fd = new FormData();
    const original = editing.value ? JSON.parse(initialForm.value) : null;
    Object.entries(form).forEach(([key, value]) => {
      if (!editing.value && key === 'existingPhotos') return;
      if (editing.value && JSON.stringify(value) === JSON.stringify(original[key]) && !(key === 'mealIds' && clearedUnavailableMeals.value)) return;
      fd.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (editing.value) fd.append('expectedEditVersion', JSON.stringify(editing.value.version));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    const result = editing.value ? await api.memory.update(editing.value.id, fd) : await api.memory.create(fd);
    if (!result?._id && !result?.id) throw new Error('保存响应不完整');
    if (editing.value && (String(result._id || result.id) !== editing.value.id || !validVersion(result))) throw new Error('保存响应不完整');
    ElMessage.success(`回忆已保存${filtersActive.value || timelinePage.value > 1 ? '；如未显示，请调整筛选或页码' : ''}`);
    dialogVisible.value = false;
    resetForm();
    await load();
  } catch (e) {
    if (editing.value) { editIssue.value = e?.code === 'MEMORY_CONFLICT' ? 'conflict' : 'unknown'; editReviewed.value = false; latestEdit.value = null; latestError.value = ''; }
    else markUncertain();
  }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value || deleteIssue.value || loading.value || loadError.value || deleteBlocked.value) return;
  if (!canDelete(item)) return ElMessage.warning('服务器未提供安全删除能力，请稍后重试');
  deletingId.value = item._id;
  deleteReviewMessage.value = '';
  try {
    await ElMessageBox.confirm('确定删除这条饭后回忆吗？', '删除确认');
    await api.memory.delete(item._id, item.editVersion);
    if (editing.value?.id === String(item._id)) resetForm();
    ElMessage.success('已删除');
    await load();
  } catch (e) { if (e !== 'cancel' && e !== 'close') { deleteTargetId.value = String(item._id); deleteReviewError.value = ''; deleteIssue.value = e?.code === 'MEMORY_CONFLICT' ? '回忆已被修改或删除，本次未删除；请重新加载并核对。' : '删除结果未确认，请重新加载并核对后再操作。'; } }
  finally { deletingId.value = ''; }
};
const reviewDelete = async () => {
  if (!deleteTargetId.value || checkingDelete.value) return;
  checkingDelete.value = true; deleteReviewError.value = ''; let message = '';
  try {
    const item = await api.memory.get(deleteTargetId.value, { suppressErrorToast: true });
    if (!alive) return;
    if (!item || String(item._id || item.id) !== deleteTargetId.value || typeof item.date !== 'string') throw new Error('读取的回忆信息不完整');
    message = `服务器当前仍有「${item.title || '温馨一餐'}」（${item.date}）；先前请求仍可能稍后完成，请继续留意。`;
  } catch (e) {
    if (!alive) return;
    if (e?.code === 'MEMORY_NOT_FOUND') message = '服务器当前未找到这条回忆；先前请求仍可能稍后完成。';
    else { deleteReviewError.value = e?.error || e?.message || '无法核对这条回忆，请重试'; checkingDelete.value = false; return; }
  }
  await load();
  if (!alive) return;
  if (loadError.value) deleteReviewError.value = '已读取记录，但列表刷新失败，请重试。';
  else { deleteReviewMessage.value = message; deleteIssue.value = ''; deleteTargetId.value = ''; }
  checkingDelete.value = false;
};
onMounted(() => { window.addEventListener('keydown', onPhotoKey); load(); });
onBeforeUnmount(() => { alive = false; memorySequence++; mealSequence++; if (mealTimer) clearTimeout(mealTimer); if (timelineTimer) clearTimeout(timelineTimer); if (monthUrlTimer) clearTimeout(monthUrlTimer); window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="memory-page">
    <div class="page-header">
      <div><span class="eyebrow">AFTER THE MEAL · 饭后时光</span><h1>饭后回忆</h1><p>把每一餐后的心情、照片和小故事留下来。</p></div>
      <el-button type="primary" :disabled="loading || !!loadError || !!deletingId || !!deleteIssue || !!editIssue" @click="startCreate"><el-icon><Plus /></el-icon>记录一餐</el-button>
    </div>

    <el-alert v-if="monthLinkNotice" type="warning" :closable="false" show-icon :title="monthLinkNotice" />
    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
    <p v-if="saveUncertain && !dialogVisible" class="timeline-note">列表可能跨页或受到筛选影响，请按日期和内容逐页核对；未显示不代表保存失败。</p>
    <el-alert v-if="linkedError" type="warning" :closable="false" show-icon :title="`无法打开相册关联的回忆：${linkedError}`"><el-button link type="primary" :loading="linkedLoading" @click="openLinkedMemory(linkedId)">重新打开</el-button><el-button link @click="linkedError = ''; linkedId = ''">关闭提示</el-button></el-alert>
    <el-alert v-if="editing && !dialogVisible" type="info" :closable="false" show-icon :title="editIssue ? '编辑结果需要核对，草稿仍保留在本页。' : '编辑草稿仍保留在本页。'"><el-button link type="primary" @click="dialogVisible = true">继续编辑</el-button></el-alert>
    <el-alert v-if="deleteIssue" type="warning" :closable="false" show-icon :title="deleteIssue"><p v-if="deleteReviewError">{{ deleteReviewError }}</p><el-button link type="primary" :loading="checkingDelete || loading" @click="reviewDelete">重新加载并核对</el-button></el-alert>
    <el-alert v-if="deleteReviewMessage" type="info" show-icon :title="deleteReviewMessage" @close="deleteReviewMessage = ''" />
    <el-alert v-if="!loading && !loadError && legacyDeleteWarning" type="info" :closable="false" show-icon title="服务器未提供安全删除能力，暂不能删除部分回忆。" />

    <section class="memory-filters" aria-label="查找饭后回忆">
      <div class="filter-heading"><div><span class="filter-kicker">YOUR TABLE JOURNAL</span><h2>寻找一段回忆</h2><p aria-live="polite">{{ loading ? '正在查找回忆…' : loadError ? '暂时无法获取结果' : timelineCapable ? `共 ${timelineTotal} 条回忆 · 第 ${timelinePage} / ${timelinePages} 页` : `显示 ${visibleMemories.length} 条回忆` }}</p></div><label class="search-field"><span class="sr-only">搜索回忆</span><input v-model="timelineSearch" type="search" maxlength="100" placeholder="搜索标题、心情或笔记" :disabled="!!deleteIssue || !!deletingId || checkingDelete" /></label></div>
      <div class="filter-row"><label>月份<input v-model="timelineMonth" type="month" aria-label="按月份筛选回忆" :disabled="!!deleteIssue || !!deletingId || checkingDelete" /></label><label>餐次<select v-model="timelineMealType" aria-label="按餐次筛选回忆" :disabled="!!deleteIssue || !!deletingId || checkingDelete"><option value="all">全部餐次</option><option v-for="(label, key) in mealTypeText" :key="key" :value="key">{{ label }}</option></select></label><label>照片<select v-model="timelinePhotos" aria-label="按照片筛选回忆" :disabled="!!deleteIssue || !!deletingId || checkingDelete"><option value="all">全部回忆</option><option value="yes">有照片</option><option value="no">无照片</option></select></label><button v-if="filtersActive" type="button" class="reset-filter" :disabled="!!deleteIssue || !!deletingId || checkingDelete" @click="resetFilters">清除筛选</button></div>
      <nav v-if="timelineMonth" class="related-period" aria-label="查看所选月份的其他内容"><div><router-link v-if="relatedAlbumMonth" :to="{ name: 'photoAlbum', query: { month: relatedAlbumMonth } }">查看 {{ relatedAlbumMonth }} 相册 →</router-link><router-link v-if="relatedReviewMonth" :to="{ name: 'review', query: { month: relatedReviewMonth } }">查看 {{ relatedReviewMonth }} 饭桌回顾 →</router-link></div><p v-if="relatedAlbumMonth || relatedReviewMonth">仅保留月份；搜索、餐次和照片筛选不会随跳转保留。</p><p v-if="!relatedReviewMonth">饭桌回顾支持 2000 至 2100 年。</p></nav>
    </section>
    <div v-loading="loading" class="timeline">
      <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载回忆：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
      <el-empty v-else-if="!loading && !visibleMemories.length" :description="filtersActive ? '没有符合条件的饭后回忆' : '还没有饭后回忆'" />
      <p v-if="!loading && !loadError && !timelineCapable && memories.length >= 200" class="timeline-note">当前服务器最多返回最近 200 条；筛选只覆盖已返回的记录。请升级服务器以浏览全部历史回忆。</p>
      <section v-for="(items, date) in (loadError ? {} : grouped)" :key="date" class="day-group">
        <h2>{{ date }}</h2>
        <div class="memory-grid">
          <el-card v-for="item in items" :key="item._id" class="memory-card">
            <div class="memory-top"><el-tag>{{ mealTypeText[item.mealType] || item.mealType }}</el-tag><div class="card-actions"><el-button type="primary" link :disabled="!!deletingId || saving || !!deleteIssue || !!saveUncertain || (!!editIssue && editing?.id !== String(item._id || item.id))" :aria-label="`编辑${item.title || '这条回忆'}`" @click="startEdit(item)"><el-icon><Edit /></el-icon>编辑</el-button><el-button type="danger" link :disabled="!!deletingId || saving || !!deleteIssue || deleteBlocked || !canDelete(item)" :aria-label="`删除${item.title || '这条回忆'}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div>
            <h3>{{ item.title || '温馨一餐' }}</h3>
            <p>{{ item.note || '没有文字，也是一段回忆。' }}</p>
            <div class="meta"><span>{{ item.mood || '日常' }}</span><el-rate :model-value="item.rating || 0" disabled size="small" /></div>
            <p v-if="item.actualCookTime || item.nextImprovement" class="cooking-note"><span v-if="item.actualCookTime">用时 {{ item.actualCookTime }} 分钟</span><span v-if="item.nextImprovement">下次改进：{{ item.nextImprovement }}</span></p>
            <div v-if="item.photos?.length" class="photos"><button v-for="(photo, index) in item.photos" :key="`${index}-${photo}`" type="button" class="memory-photo" :aria-label="`查看${item.title || '回忆'}的第 ${index + 1} 张照片`" @click="openMemoryPhoto(item, index)"><img :src="imageFor(photo)" alt="" @error="imageError" /></button></div>
            <p v-if="item.supportsUnavailableMealVisibility && item.mealIds?.some(meal => meal === null)" class="unavailable-note">部分相关菜品不可用，原有引用仍保留在回忆中。</p>
            <div class="meal-names"><el-tag v-for="(meal, index) in item.mealIds || []" :key="meal?._id || `unavailable-${index}`" effect="plain">{{ meal?.name || '菜品不可用' }}</el-tag></div>
          </el-card>
        </div>
      </section>
    </div>
    <nav v-if="timelineCapable && !loadError && timelineTotal > timelineLimit" class="timeline-pagination" aria-label="回忆分页"><el-button :disabled="loading || !!deleteIssue || !!deletingId || checkingDelete || timelinePage <= 1" @click="changeTimelinePage(timelinePage - 1)">上一页</el-button><span aria-live="polite">第 {{ timelinePage }} / {{ timelinePages }} 页</span><el-button :disabled="loading || !!deleteIssue || !!deletingId || checkingDelete || timelinePage >= timelinePages" @click="changeTimelinePage(timelinePage + 1)">下一页</el-button></nav>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑饭后回忆' : '记录饭后回忆'" width="min(560px, 92vw)" :close-on-click-modal="!saving && !confirmingMeals" :close-on-press-escape="!saving && !confirmingMeals" :show-close="!saving && !confirmingMeals">
      <CreateRecoveryNotice v-if="saveUncertain" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-alert v-if="editIssue" type="warning" :closable="false" show-icon :title="editIssue === 'conflict' ? '回忆已被修改或删除，本次未保存。' : '编辑结果未确认，请先核对最新回忆。'">
        <p>你的草稿和所选照片仍在本页。载入最新内容会放弃当前草稿。</p>
        <el-button link type="primary" :loading="checkingEdit" @click="checkLatest">读取最新回忆并核对</el-button>
        <p v-if="latestError">{{ latestError }}</p>
        <div v-if="editReviewed" class="latest-summary">
          <template v-if="latestEdit"><strong>{{ latestEdit.title || '温馨一餐' }} · {{ latestEdit.date }}</strong><p>{{ mealTypeText[latestEdit.mealType] || latestEdit.mealType }} · {{ latestEdit.mood || '日常' }} · {{ latestEdit.rating || 0 }} 分 · {{ latestEdit.photos?.length || 0 }} 张照片</p><p>{{ latestEdit.note || '无备注' }}</p><p>菜品：{{ (latestEdit.mealIds || []).map(meal => meal?.name || '菜品不可用').join('、') || '未关联' }}</p><p v-if="latestEdit.actualCookTime || latestEdit.nextImprovement">用时 {{ latestEdit.actualCookTime || 0 }} 分钟 · {{ latestEdit.nextImprovement || '无改进记录' }}</p><el-button link type="primary" @click="reloadLatest">放弃草稿并载入最新</el-button><el-button v-if="editIssue === 'unknown' && sameVersion(editing?.version, latestEdit.editVersion)" link type="primary" @click="retryEdit">已核对，允许重试</el-button></template>
          <p v-else>这条回忆已不存在或不属于当前家庭。</p>
          <el-button link type="danger" @click="discardEditDraft">放弃编辑草稿</el-button>
        </div>
      </el-alert>
      <el-alert v-if="editing && !mealVisibilityVerified" class="meal-integrity-alert" type="warning" :closable="false" show-icon title="当前服务器未提供菜品完整性核验，暂不能修改相关菜品；文字和照片仍可编辑。" />
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="日期"><el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="餐次"><el-select v-model="form.mealType"><el-option v-for="(label, key) in mealTypeText" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="相关菜品"><div v-if="editing && unavailableMealCount" class="unavailable-meals" role="status"><span v-if="!clearedUnavailableMeals">有 {{ unavailableMealCount }} 条相关菜品不可用；原引用将保留。</span><span v-else>保存后将清除这条回忆中的不可用引用。</span><el-button v-if="mealVisibilityVerified && !clearedUnavailableMeals" link type="primary" :disabled="busy" @click="clearUnavailableMeals">清除并编辑相关菜品</el-button><el-button v-else-if="clearedUnavailableMeals" link :disabled="busy" @click="undoClearUnavailableMeals">撤销清除</el-button></div><el-select v-model="form.mealIds" multiple filterable remote reserve-keyword :remote-method="searchMeals" :loading="mealLoading" :disabled="!!editing && (!mealVisibilityVerified || (!!unavailableMealCount && !clearedUnavailableMeals))" aria-label="搜索相关菜品" placeholder="搜索菜名或食材" @visible-change="openMealOptions" @change="rememberMeals"><el-option v-for="meal in mealOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select><small v-if="!mealError && mealTotal > 50" class="meal-help">仅显示前 50 道，请输入菜名或食材缩小范围。</small><el-alert v-if="mealError" type="warning" :closable="false" show-icon :title="`菜品暂时无法加载：${mealError}`"><el-button link type="primary" @click="searchMealCatalog">重试</el-button></el-alert></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="比如：周五晚上的番茄牛腩" /></el-form-item>
        <el-form-item label="心情"><el-input v-model="form.mood" placeholder="开心、满足、想再吃一次..." /></el-form-item>
        <el-form-item label="评分"><el-rate v-model="form.rating" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="4" /></el-form-item>
        <el-form-item label="实际烹饪时间（分钟）"><el-input-number v-model="form.actualCookTime" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="下次改进"><el-input v-model="form.nextImprovement" type="textarea" rows="2" placeholder="下次想调整什么？" /></el-form-item>
        <el-form-item label="照片"><div v-if="editing && form.existingPhotos.length" ref="existingPhotoGrid" class="existing-photos"><div v-for="(photo, index) in form.existingPhotos" :key="`${index}-${photo}`" class="existing-photo"><img :src="imageFor(photo)" :alt="`已有照片 ${index + 1}`" @error="imageError" /><el-button size="small" type="danger" plain :aria-label="`移除已有照片 ${index + 1}`" @click="removeExistingPhoto(index, $event)">移除</el-button></div></div><div v-if="removedPhotos.length" class="photo-undo" role="status"><span>已移除 {{ removedPhotos.length }} 张，保存后生效。</span><el-button ref="undoPhotoButton" link type="primary" @click="undoPhotoRemoval">撤销最近移除</el-button></div><el-upload action="#" :accept="photoAccept" :limit="12" :on-exceed="() => ElMessage.warning('每次最多上传 12 张照片')" :auto-upload="false" :disabled="saving || saveUncertain" multiple list-type="picture-card" v-model:file-list="photoFiles" :on-change="handlePhotoChange"><el-icon><Picture /></el-icon></el-upload><small class="meal-help">每次最多上传 12 张 JPG、PNG、GIF 或 WebP，单张不超过 5MB。移除已有照片需保存才生效。</small></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving || confirmingMeals" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || !!editIssue || loading || !!loadError || !!deleteIssue || confirmingMeals" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog :model-value="!!viewedPhoto" title="饭后照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) viewedPhoto = null }"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.photos[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.photos[viewedPhoto.index])" :alt="viewedPhoto.title" @error="imageError" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张回忆照片" @click="moveMemoryPhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.photos.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.photos.length - 1" aria-label="下一张回忆照片" @click="moveMemoryPhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.memory-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2, h3 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}
.page-header p { color: var(--text-secondary); margin: 6px 0 0; }
.day-group { display: flex; flex-direction: column; gap: 12px; }
.memory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 14px; }
.memory-top, .meta, .meal-names { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.card-actions { display: flex; align-items: center; flex-shrink: 0; }
.card-actions .el-button + .el-button { margin-left: 10px; }
.cooking-note { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.latest-summary { margin-top: 8px; padding: 12px; border-radius: 10px; background: var(--bg-primary); overflow-wrap: anywhere; }
.latest-summary p { margin: 6px 0; }
.existing-photos { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; margin-bottom: 12px; }
.existing-photo { display: grid; gap: 6px; width: 90px; }
.existing-photo img { width: 90px; height: 72px; border-radius: 8px; object-fit: cover; }
.photo-undo { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; width: 100%; margin-bottom: 10px; color: var(--text-primary); font-size: 13px; }
.photo-undo :deep(.el-button) { min-height: 44px; margin: 0; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.memory-card p { color: var(--text-secondary); white-space: pre-wrap; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.memory-photo { padding: 0; border: 0; border-radius: 8px; background: var(--bg-secondary); cursor: pointer; }
.memory-photo:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.photos img { display: block; width: 100%; height: 90px; object-fit: cover; border-radius: 8px; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.meal-help { color: var(--text-secondary); line-height: 1.5; }
.timeline-note { color: var(--text-secondary); font-size: 13px; }
.memory-filters { --memory-accent: color-mix(in srgb,var(--secondary-color) 45%,#33211a); padding: 22px 24px; border: 1px solid var(--border-color); border-radius: 22px; background: var(--bg-primary); box-shadow: 0 8px 24px var(--shadow-color); }
.filter-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.filter-heading h2 { margin-top: 6px; font-size: 19px; }
.filter-heading p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.filter-kicker { color: var(--memory-accent); font-size: 10px; font-weight: 800; letter-spacing: .13em; }
.search-field { width: min(100%,360px); }
.memory-filters input,.memory-filters select { box-sizing: border-box; min-height: 44px; max-width: 100%; padding: 9px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); font: inherit; }
.search-field input { width: 100%; }
.filter-row { display: flex; align-items: end; flex-wrap: wrap; gap: 12px; margin-top: 18px; }
.filter-row label { display: grid; gap: 6px; color: var(--text-primary); font-size: 13px; }
.related-period { margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border-light); }
.related-period > div { display: flex; flex-wrap: wrap; gap: 4px 18px; }
.related-period a { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.related-period a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.related-period p { margin: 4px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.reset-filter { min-height: 44px; padding: 8px 12px; border: 0; background: transparent; color: var(--memory-accent); font-weight: 700; text-decoration: underline; cursor: pointer; }
.memory-filters input:focus-visible,.memory-filters select:focus-visible,.reset-filter:focus-visible { outline: 2px solid var(--memory-accent); outline-offset: 3px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.timeline { display: flex; flex-direction: column; gap: 18px; }
.timeline-pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 16px; color: var(--text-secondary); }
.timeline-pagination :deep(.el-button) { min-height: 44px; }
:global(html.dark .memory-filters) { --memory-accent: var(--secondary-color); }
.meal-names { justify-content: flex-start; flex-wrap: wrap; margin-top: 10px; }
.unavailable-note { color: var(--text-primary) !important; font-size: 13px; line-height: 1.5; }
.unavailable-meals { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; width: 100%; margin-bottom: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); line-height: 1.5; }
.unavailable-meals :deep(.el-button) { min-height: 44px; margin: 0; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.meal-integrity-alert { --notice-ink: #623a10; margin-bottom: 14px; background: #fff1db; color: var(--notice-ink); }
.meal-integrity-alert :deep(.el-alert__title), .meal-integrity-alert :deep(.el-alert__icon) { color: var(--notice-ink); }
:global(html.dark) .meal-integrity-alert { --notice-ink: #ffe4bd; background: #543b29; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } .memory-filters { padding: 18px; } .filter-heading { align-items: stretch; flex-direction: column; } .search-field { width: 100%; } }
</style>
