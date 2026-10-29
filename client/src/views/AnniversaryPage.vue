<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture, Edit } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { usePhotoRemovalUndo } from '@/composables/usePhotoRemovalUndo';
import { resolveUploadedImage, handleUploadedImageError } from '@/utils/uploadedImage.mjs';
import { normalizeMealSearch } from '@/utils/mealSearch.mjs';
import { validWeekLink } from '@/utils/weekLink.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const menus = ref([]);
const meals = ref([]);
const selectedMeals = ref([]);
const mealLoading = ref(false);
const mealError = ref('');
const mealTotal = ref(0);
const mealQuery = ref('');
let mealSequence = 0;
let mealTimer = null;
let menuSequence = 0;
let filterTimer = null;
let alive = true;
const boardMode = ref(false);
const boardPage = ref(1);
const boardLimit = 12;
const boardTotal = ref(0);
const boardCounts = ref({ upcoming: 0, past: 0, unknown: 0 });
const boardPages = computed(() => Math.max(1, Math.ceil(boardTotal.value / boardLimit)));
const templates = ref([]);
const templateError = ref('');
const templateLoading = ref(false);
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const deletingId = ref('');
const deleteIssue = ref('');
const deleteTarget = ref('');
const deleteReviewMessage = ref('');
const checkingDelete = ref(false);
const editing = ref(null);
const editIssue = ref('');
const editReviewed = ref(false);
const checkingEdit = ref(false);
const latestError = ref('');
const confirmingSlot = ref('');
const latestEdit = ref(null);
const viewedPhoto = ref(null);
const photoFiles = ref([]);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const today = ref(localToday());
const search = ref('');
const period = ref('all');
const filterGroup = ref(null);
const addMenuButton = ref(null);
let midnightTimer = null;
const form = reactive({ title: '', date: localToday(), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] }, existingPhotos: [] });
const { removedPhotos, existingPhotoGrid, undoPhotoButton, resetPhotoUndo, removeExistingPhoto, undoPhotoRemoval } = usePhotoRemovalUndo(form);
const unavailableMeals = reactive({ breakfast: 0, lunch: 0, dinner: 0 });
const clearedSlots = reactive({ breakfast: false, lunch: false, dinner: false });
const originalSlotMeals = ref({ breakfast: [], lunch: [], dinner: [] });
const mealVisibilityVerified = ref(false);
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value || photoFiles.value.length > 0 || Object.values(clearedSlots).some(Boolean));
const recovery = useUncertainCreate({ reload: () => { resetFilters(); return load(); }, loadError, close: () => { dialogVisible.value = false; }, discard: () => reset(), reopen: () => { dialogVisible.value = true; }, label: '纪念日菜单' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || reviewing.value || deciding.value || checkingEdit.value || checkingDelete.value || !!deletingId.value || !!confirmingSlot.value);
const uncertain = computed(() => saveUncertain.value || !!editIssue.value || !!deleteIssue.value);
useDraftGuard({ dirty, busy, uncertain, label: '纪念日菜单' });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const mealId = meal => String(meal?._id || meal?.id || '');
const validDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
};
const periodOf = item => !validDate(item?.date) ? 'unknown' : item.date >= today.value ? 'upcoming' : 'past';
const periodNames = { upcoming: '即将到来', past: '往日菜单', unknown: '日期待核对' };
const periodOptions = computed(() => [{ key: 'all', label: '全部' }, { key: 'upcoming', label: '即将到来' }, { key: 'past', label: '已过去' }, ...((boardMode.value ? boardCounts.value.unknown > 0 || period.value === 'unknown' : menus.value.some(item => periodOf(item) === 'unknown')) ? [{ key: 'unknown', label: '日期待核对' }] : [])]);
const filtersActive = computed(() => !!search.value.trim() || period.value !== 'all');
const filteredMenus = computed(() => {
  if (boardMode.value) return menus.value;
  const term = search.value.trim().toLocaleLowerCase();
  return menus.value.filter(item => (period.value === 'all' || periodOf(item) === period.value) && (!term || [item.title, item.theme, item.description, ...Object.values(item.meals || {}).flat().map(meal => meal?.name)].some(value => String(value || '').toLocaleLowerCase().includes(term))));
});
const menuGroups = computed(() => ['upcoming', 'past', 'unknown'].map(key => ({ key, title: periodNames[key], items: filteredMenus.value.filter(item => periodOf(item) === key).sort((a, b) => (key === 'past' ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date)) || String(a._id || a.id).localeCompare(String(b._id || b.id))) })).filter(group => group.items.length));
const hiddenEdit = computed(() => !!editing.value && !filteredMenus.value.some(item => String(item._id || item.id) === editing.value.id));
const resetFilters = () => { search.value = ''; period.value = 'all'; };
const refreshAndReview = async () => {
  if (!deleteIssue.value || checkingDelete.value) return;
  checkingDelete.value = true;
  let found;
  try {
    if (boardMode.value) {
      try {
        const item = await api.anniversary.get(deleteTarget.value);
        if (String(item?._id || item?.id || '') !== deleteTarget.value || !validVersion(item)) throw new Error('菜单核对结果不完整');
        found = true;
      } catch (e) { if (e?.code === 'ANNIVERSARY_NOT_FOUND') found = false; else throw e; }
    }
    resetFilters(); boardPage.value = 1;
    await load();
    if (loadError.value) return;
    if (!boardMode.value) found = menus.value.some(item => String(item._id || item.id) === deleteTarget.value);
    deleteReviewMessage.value = found ? '核对时服务器仍有这份菜单；之前的删除请求仍可能稍后完成。' : '核对时未找到这份菜单；之前的删除请求仍可能稍后完成。';
    deleteIssue.value = ''; deleteTarget.value = '';
  } catch (e) { ElMessage.warning(e?.error || e?.message || '无法核对删除结果，请重试'); }
  finally { checkingDelete.value = false; }
};
watch([search, period, today], () => {
  if (!boardMode.value) return;
  boardPage.value = 1; menuSequence++; loading.value = true;
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => { filterTimer = null; load(); }, 180);
}, { flush: 'sync' });
const dayLabel = item => {
  if (!validDate(item?.date)) return '日期待核对';
  const delta = Math.round((Date.parse(`${item.date}T00:00:00Z`) - Date.parse(`${today.value}T00:00:00Z`)) / 86400000);
  return delta === 0 ? '今天' : delta === 1 ? '明天' : delta > 0 ? `还有 ${delta} 天` : `已过去 ${Math.abs(delta)} 天`;
};
const refreshToday = () => { today.value = localToday(); };
const scheduleMidnight = () => {
  refreshToday();
  if (midnightTimer) clearTimeout(midnightTimer);
  const next = new Date(); next.setHours(24, 0, 1, 0);
  midnightTimer = setTimeout(scheduleMidnight, Math.max(1000, next.getTime() - Date.now()));
};
const onVisibility = () => { if (!document.hidden) scheduleMidnight(); };
const validVersion = item => item?.supportsConditionalEdit === true && item.editVersion &&
  (item.editVersion.revision === null || (typeof item.editVersion.revision === 'string' && !!item.editVersion.revision && item.editVersion.revision.length <= 128)) &&
  (item.editVersion.updatedAt === null || (typeof item.editVersion.updatedAt === 'string' && Number.isFinite(Date.parse(item.editVersion.updatedAt))));
const canDelete = item => item?.supportsConditionalDelete === true && validVersion(item);
const deleteBlocked = computed(() => saveUncertain.value || !!editIssue.value || (!!editing.value && dirty.value));
const legacyDeleteWarning = computed(() => menus.value.some(item => !canDelete(item)));
const sameVersion = (left, right) => !!left && !!right && left.revision === right.revision && left.updatedAt === right.updatedAt;
const mealOptions = computed(() => {
  const seen = new Set();
  return [...selectedMeals.value, ...meals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const rememberMeals = () => {
  const available = new Map(mealOptions.value.map(meal => [mealId(meal), meal]));
  const ids = new Set(Object.values(form.meals).flat().map(String));
  selectedMeals.value = [...ids].map(id => available.get(id)).filter(Boolean);
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
    const { rows, total } = normalizeMealSearch(result, query);
    meals.value = rows;
    mealTotal.value = total;
  } catch (e) { if (alive && sequence === mealSequence) mealError.value = e?.error || e?.message || '菜品加载失败'; }
  finally { if (alive && sequence === mealSequence) mealLoading.value = false; }
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
const openMealOptions = visible => { if (visible) searchMeals(''); };
const imageFor = photo => resolveUploadedImage(photo) || placeholder;
const imageError = event => handleUploadedImageError(event, placeholder);
const openPhoto = (item, index) => { viewedPhoto.value = { title: item.title || '纪念日照片', photos: item.photos, index }; };
const movePhoto = direction => { if (!viewedPhoto.value) return; const next = viewedPhoto.value.index + direction; if (next >= 0 && next < viewedPhoto.value.photos.length) viewedPhoto.value.index = next; };
const onPhotoKey = event => { if (!viewedPhoto.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1); };
const loadTemplates = async () => {
  if (templateLoading.value) return;
  templateLoading.value = true; templateError.value = '';
  try { const data = await api.anniversaryTemplate.list(); if (!Array.isArray(data)) throw new Error('模板列表不完整'); if (alive) templates.value = data; }
  catch (e) { if (alive) templateError.value = e?.error || e?.message || '模板加载失败'; }
  finally { if (alive) templateLoading.value = false; }
};
const allowedPhotoTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream']);
const allowedPhotoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
const photoAccept = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif';
const photoError = (file) => {
  const raw = file?.raw || file;
  const name = String(raw?.name || '').toLowerCase();
  const type = String(raw?.type || '').toLowerCase();
  if (!allowedPhotoExtensions.some(ext => name.endsWith(ext)) || (type && !allowedPhotoTypes.has(type))) return '只支持 JPG、PNG、GIF、WebP、HEIC 或 HEIF 图片';
  if (Number(raw?.size || 0) > 30 * 1024 * 1024) return '单张图片不能超过 30MB';
  return '';
};
const handlePhotoChange = async (_file, files) => {
  let message = '';
  const invalidIds = new Set(files.filter(file => { const error = photoError(file); if (error) message ||= error; return !!error; }).map(file => file.uid));
  if (message) {
    ElMessage.warning(message);
    await nextTick();
    photoFiles.value = photoFiles.value.filter(file => !invalidIds.has(file.uid));
  }
};
const applyTemplate = async (tpl) => {
  if (form.title || form.theme || form.description) {
    try { await ElMessageBox.confirm('使用模板会替换当前标题、主题和备注，已选菜品与照片会保留。', '使用菜单模板', { type: 'warning', confirmButtonText: '使用模板', cancelButtonText: '取消' }); } catch (_) { return; }
  }
  form.title = tpl.title;
  form.theme = tpl.theme;
  form.description = `${tpl.description}\n推荐结构：${(tpl.structure || []).join(' / ')}`;
};

const reset = () => {
  resetPhotoUndo();
  Object.assign(form, { title: '', date: localToday(), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] }, existingPhotos: [] });
  photoFiles.value = [];
  selectedMeals.value = [];
  Object.assign(unavailableMeals, { breakfast: 0, lunch: 0, dinner: 0 });
  Object.assign(clearedSlots, { breakfast: false, lunch: false, dinner: false });
  originalSlotMeals.value = { breakfast: [], lunch: [], dinner: [] }; mealVisibilityVerified.value = false;
  editing.value = null;
  editIssue.value = '';
  editReviewed.value = false;
  latestEdit.value = null;
  initialForm.value = JSON.stringify(form);
};
const fillEdit = item => {
  if (!(item?._id || item?.id) || !validVersion(item) || typeof item.title !== 'string' || typeof item.date !== 'string' || !Array.isArray(item.photos) || item.photos.some(photo => typeof photo !== 'string') || Object.keys(mealTypeText).some(key => !Array.isArray(item.meals?.[key]) || item.meals[key].some(meal => meal !== null && (!mealId(meal) || typeof meal.name !== 'string')))) throw new Error('菜单数据或版本不完整，请刷新后重试');
  resetPhotoUndo();
  originalSlotMeals.value = Object.fromEntries(Object.keys(mealTypeText).map(key => [key, item.meals[key].filter(Boolean)]));
  Object.assign(unavailableMeals, Object.fromEntries(Object.keys(mealTypeText).map(key => [key, item.meals[key].filter(meal => meal === null).length])));
  Object.assign(clearedSlots, { breakfast: false, lunch: false, dinner: false });
  mealVisibilityVerified.value = item.supportsUnavailableMealVisibility === true;
  Object.assign(form, { title: item.title, date: item.date, theme: item.theme || '', description: item.description || '', meals: Object.fromEntries(Object.keys(mealTypeText).map(key => [key, originalSlotMeals.value[key].map(mealId)])), existingPhotos: [...item.photos] });
  selectedMeals.value = Object.values(originalSlotMeals.value).flat();
  photoFiles.value = [];
  editing.value = { id: String(item._id || item.id), version: { ...item.editVersion } };
  editIssue.value = ''; editReviewed.value = false; latestEdit.value = null;
  initialForm.value = JSON.stringify(form);
};
const clearUnavailable = async key => {
  if (!editing.value || !mealVisibilityVerified.value || !unavailableMeals[key] || clearedSlots[key] || busy.value) return;
  confirmingSlot.value = key;
  try { await ElMessageBox.confirm(`保存后会从${mealTypeText[key]}中移除 ${unavailableMeals[key]} 条不可用菜品引用，其他餐次不受影响；不会删除菜谱。`, '清除不可用菜品？', { type: 'warning', confirmButtonText: '确认清除并编辑', cancelButtonText: '保留原记录' }); }
  catch (_) { return; } finally { confirmingSlot.value = ''; }
  clearedSlots[key] = true;
};
const undoClearUnavailable = async key => {
  if (!clearedSlots[key] || busy.value) return;
  const original = JSON.parse(initialForm.value).meals[key];
  if (JSON.stringify(form.meals[key]) !== JSON.stringify(original)) {
    confirmingSlot.value = key;
    try { await ElMessageBox.confirm(`撤销清除会放弃当前${mealTypeText[key]}的菜品调整。`, '撤销清除？', { type: 'warning', confirmButtonText: '放弃调整并撤销', cancelButtonText: '继续编辑' }); } catch (_) { return; } finally { confirmingSlot.value = ''; }
  }
  form.meals[key] = [...original];
  selectedMeals.value = [...selectedMeals.value, ...originalSlotMeals.value[key]];
  rememberMeals();
  clearedSlots[key] = false;
};
const confirmReplaceDraft = async () => {
  if (!dirty.value) return true;
  try { await ElMessageBox.confirm('切换菜单会丢失当前未保存的内容和所选照片。', '放弃当前草稿？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续编辑' }); return true; } catch (_) { return false; }
};
const startCreate = async () => {
  if (busy.value || deleteIssue.value) return;
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (editing.value) { if (!await confirmReplaceDraft()) return; reset(); }
  dialogVisible.value = true;
};
const startEdit = async item => {
  if (busy.value || loading.value || loadError.value || deleteIssue.value || saveUncertain.value) return;
  if (editing.value?.id === String(item._id || item.id)) { dialogVisible.value = true; return; }
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (!validVersion(item)) return ElMessage.warning('服务器未提供有效的菜单版本，暂时无法安全编辑');
  if (!await confirmReplaceDraft()) return;
  try { fillEdit(item); dialogVisible.value = true; } catch (e) { ElMessage.warning(e.message); }
};
const checkLatest = async () => {
  if (!editing.value || checkingEdit.value) return;
  checkingEdit.value = true; editReviewed.value = false; latestError.value = '';
  try {
    if (boardMode.value) {
      try {
        const item = await api.anniversary.get(editing.value.id);
        if (String(item?._id || item?.id || '') !== editing.value.id || !validVersion(item)) throw new Error('菜单核对结果不完整');
        latestEdit.value = item;
      } catch (e) { if (e?.code === 'ANNIVERSARY_NOT_FOUND') latestEdit.value = null; else throw e; }
    } else {
      await load();
      if (loadError.value) return;
      latestEdit.value = menus.value.find(item => String(item._id || item.id) === editing.value.id) || null;
    }
    editReviewed.value = true;
  } catch (e) { latestError.value = e?.error || e?.message || '无法核对最新菜单，请重试'; }
  finally { checkingEdit.value = false; }
};
const reloadLatest = async () => {
  if (!editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value)) return;
  try { await ElMessageBox.confirm('载入最新菜单会放弃当前草稿和所选照片。', '重新载入最新内容？', { type: 'warning', confirmButtonText: '放弃草稿并载入', cancelButtonText: '继续保留草稿' }); } catch (_) { return; }
  try { fillEdit(latestEdit.value); } catch (e) { ElMessage.warning(e.message); }
};
const retryEdit = async () => {
  if (editIssue.value !== 'unknown' || !editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value) || !sameVersion(editing.value?.version, latestEdit.value.editVersion)) return;
  try { await ElMessageBox.confirm('列表核对时版本尚未变化；先前请求仍可能稍后完成。重试使用相同版本，只有一个请求可以成功。', '确认重新提交？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); editIssue.value = ''; editReviewed.value = false; } catch (_) {}
};
const discardEditDraft = async () => {
  if (!editing.value || !editReviewed.value) return;
  try { await ElMessageBox.confirm('将放弃本页编辑草稿与所选照片，不会删除服务器上的菜单。', '放弃编辑草稿？', { type: 'warning', confirmButtonText: '确认放弃草稿', cancelButtonText: '继续核对' }); } catch (_) { return; }
  reset(); dialogVisible.value = false;
};
const load = async () => {
  if (filterTimer) { clearTimeout(filterTimer); filterTimer = null; }
  const sequence = ++menuSequence;
  loading.value = true;
  loadError.value = '';
  try {
    const request = { view: 'board', page: boardPage.value, limit: boardLimit, search: search.value.trim(), period: period.value, today: today.value };
    let menuData = await api.anniversary.list(request);
    if (!alive || sequence !== menuSequence) return;
    let rows;
    if (Array.isArray(menuData)) {
      if (boardMode.value) throw new Error('服务器分页能力已变化，请重新加载页面');
      menuData = await api.anniversary.list({ view: 'editor' });
      if (!alive || sequence !== menuSequence) return;
      rows = menuData;
    } else {
      const counts = menuData?.counts;
      if (menuData?.supportsAnniversaryBoard !== true || menuData.page !== request.page || menuData.limit !== request.limit || menuData.search !== request.search || menuData.period !== request.period || menuData.today !== request.today || !counts || ['upcoming', 'past', 'unknown'].some(key => !Number.isSafeInteger(counts[key]) || counts[key] < 0) || !Number.isSafeInteger(menuData.total) || menuData.total < 0 || menuData.total !== (request.period === 'all' ? counts.upcoming + counts.past + counts.unknown : counts[request.period]) || !Array.isArray(menuData.items) || menuData.items.length !== Math.min(boardLimit, Math.max(0, menuData.total - (request.page - 1) * boardLimit)) || menuData.items.some(item => item?.supportsUnavailableMealVisibility !== true)) throw new Error('菜单分页结果不完整');
      const lastPage = Math.max(1, Math.ceil(menuData.total / boardLimit));
      if (request.page > lastPage) { boardPage.value = lastPage; return await load(); }
      rows = menuData.items;
      boardMode.value = true;
      boardTotal.value = menuData.total;
      boardCounts.value = counts;
    }
    if (!Array.isArray(rows) || rows.some(item => !item || typeof (item._id || item.id) !== 'string' || !(item._id || item.id) || typeof item.title !== 'string' || typeof item.date !== 'string' || (item.photos !== undefined && (!Array.isArray(item.photos) || item.photos.some(photo => typeof photo !== 'string'))) || (item.meals !== undefined && (!item.meals || typeof item.meals !== 'object' || Object.values(item.meals).some(rows => !Array.isArray(rows) || rows.some(meal => meal !== null && (!mealId(meal) || typeof meal.name !== 'string')))))) || new Set(rows.map(item => item._id || item.id)).size !== rows.length) throw new Error('菜单列表不完整');
    menus.value = rows;
  } catch (e) { if (alive && sequence === menuSequence) loadError.value = e?.error || e?.message || '加载纪念日菜单失败'; }
  finally { if (alive && sequence === menuSequence) loading.value = false; }
};
const changePage = page => { if (loading.value || deleteIssue.value || page < 1 || page > boardPages.value || page === boardPage.value) return; boardPage.value = page; load(); };
const save = async () => {
  if (!form.title.trim() || !validDate(form.date)) return ElMessage.warning('请填写标题和有效日期');
  if (saving.value || saveUncertain.value || editIssue.value || reviewing.value || loading.value || loadError.value || deleteIssue.value || confirmingSlot.value) return;
  if (editing.value) {
    const original = JSON.parse(initialForm.value);
    if (Object.keys(mealTypeText).some(key => (!mealVisibilityVerified.value || (unavailableMeals[key] && !clearedSlots[key])) && (clearedSlots[key] || JSON.stringify(form.meals[key]) !== JSON.stringify(original.meals[key])))) return ElMessage.warning('请先核对菜品完整性，再修改对应餐次');
  }
  const invalid = photoFiles.value.map(photoError).find(Boolean);
  if (invalid) return ElMessage.warning(invalid);
  if (photoFiles.value.length > 12) return ElMessage.warning('每次最多上传 12 张照片');
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('title', form.title.trim());
    fd.append('date', form.date);
    fd.append('theme', form.theme);
    fd.append('description', form.description);
    if (editing.value) {
      const original = JSON.parse(initialForm.value);
      const changedMeals = Object.fromEntries(Object.keys(mealTypeText).filter(key => clearedSlots[key] || JSON.stringify(form.meals[key]) !== JSON.stringify(original.meals[key])).map(key => [key, form.meals[key]]));
      if (Object.keys(changedMeals).length) fd.append('meals', JSON.stringify(changedMeals));
      if (JSON.stringify(form.existingPhotos) !== JSON.stringify(original.existingPhotos)) fd.append('existingPhotos', JSON.stringify(form.existingPhotos));
      fd.append('expectedEditVersion', JSON.stringify(editing.value.version));
    } else fd.append('meals', JSON.stringify(form.meals));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    const result = editing.value ? await api.anniversary.update(editing.value.id, fd) : await api.anniversary.create(fd);
    if (!result?._id && !result?.id) throw new Error('保存响应不完整');
    if (editing.value && (String(result._id || result.id) !== editing.value.id || !validVersion(result))) throw new Error('保存响应不完整');
    ElMessage.success(`纪念日菜单已保存${filtersActive.value || boardMode.value ? '；如未显示，请检查筛选条件或其他页' : ''}`);
    dialogVisible.value = false;
    reset();
    await load();
  } catch (e) {
    if (editing.value) { editIssue.value = e?.code === 'ANNIVERSARY_CONFLICT' ? 'conflict' : 'unknown'; editReviewed.value = false; latestEdit.value = null; }
    else markUncertain();
  }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value || deleteIssue.value || loading.value || loadError.value || deleteBlocked.value) return;
  if (!canDelete(item)) return ElMessage.warning('服务器未提供安全删除能力，请稍后重试');
  const hadFocus = document.activeElement?.closest('.menu-card')?.dataset.menuId === String(item._id || item.id);
  deletingId.value = item._id;
  try { await ElMessageBox.confirm('确定删除这个纪念日菜单吗？', '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await api.anniversary.delete(item._id, item.editVersion); if (editing.value?.id === String(item._id)) reset(); await load(); }
  catch (e) { if (e !== 'cancel' && e !== 'close') { deleteTarget.value = String(item._id || item.id); deleteReviewMessage.value = ''; deleteIssue.value = e?.code === 'ANNIVERSARY_CONFLICT' ? '菜单已被修改或删除，本次未删除；请重新加载并核对。' : '删除结果未确认，请重新加载并核对后再操作。'; } }
  finally { deletingId.value = ''; }
  if (hadFocus && !loadError.value && !filteredMenus.value.some(row => String(row._id || row.id) === String(item._id || item.id))) {
    await nextTick();
    const restoreFocus = () => { if (alive && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) (filterGroup.value?.querySelector('button[aria-pressed="true"]') || addMenuButton.value?.$el)?.focus(); };
    restoreFocus();
    setTimeout(restoreFocus, 300);
  }
};
onMounted(() => { window.addEventListener('keydown', onPhotoKey); window.addEventListener('focus', scheduleMidnight); document.addEventListener('visibilitychange', onVisibility); scheduleMidnight(); load(); loadTemplates(); });
onBeforeUnmount(() => { alive = false; menuSequence++; mealSequence++; if (mealTimer) clearTimeout(mealTimer); if (filterTimer) clearTimeout(filterTimer); if (midnightTimer) clearTimeout(midnightTimer); window.removeEventListener('keydown', onPhotoKey); window.removeEventListener('focus', scheduleMidnight); document.removeEventListener('visibilitychange', onVisibility); });
</script>

<template>
  <div class="anniversary-page">
    <div class="page-header">
      <div><span class="eyebrow">SPECIAL DAYS · 特别的日子</span><h1>纪念日菜单</h1><p>为生日、纪念日、节日和特别的周末，提前保存一份菜单。</p><p class="calendar-explanation">菜单不会自动写入日历；可查看当天安排后手动排餐。</p></div>
      <el-button ref="addMenuButton" type="primary" :disabled="loading || !!loadError || !!deletingId || !!deleteIssue || !!editIssue" @click="startCreate"><el-icon><Plus /></el-icon>新增菜单</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="纪念日菜单" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
    <p v-if="saveUncertain && !dialogVisible && (filtersActive || boardMode)" class="filter-note">{{ boardMode ? '刚保存的菜单可能在其他页；请检查所有相关页面后再决定是否重试。' : '筛选可能隐藏刚保存的菜单；刷新核对会清除筛选。' }}</p>
    <el-alert v-if="editing && !dialogVisible" type="info" :closable="false" show-icon :title="editIssue ? '编辑结果需要核对，草稿仍保留在本页。' : '编辑草稿仍保留在本页。'"><span v-if="hiddenEdit">{{ boardMode ? '当前筛选或页面中未显示这份菜单。' : '当前筛选中未显示这份菜单。' }}</span><el-button link type="primary" @click="dialogVisible = true">继续编辑</el-button><el-button v-if="hiddenEdit && filtersActive" link @click="resetFilters">清除筛选</el-button></el-alert>

    <el-alert v-if="deleteIssue" type="warning" :closable="false" show-icon :title="deleteIssue"><el-button link type="primary" :loading="loading || checkingDelete" @click="refreshAndReview">重新加载并核对</el-button></el-alert>
    <el-alert v-if="deleteReviewMessage" type="info" show-icon :title="deleteReviewMessage" @close="deleteReviewMessage = ''" />
    <el-alert v-if="!loading && !loadError && legacyDeleteWarning" type="info" :closable="false" show-icon title="服务器未提供安全删除能力，暂不能删除部分纪念日菜单。" />
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载纪念日菜单：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <section v-if="!loadError && (menus.length || filtersActive || boardMode)" class="menu-filters" aria-label="查找纪念日菜单">
      <div class="filter-heading"><div><span class="filter-kicker">YOUR SPECIAL DAYS</span><h2>寻找特别的一天</h2><p aria-live="polite">{{ boardMode ? (loading ? '正在更新菜单…' : `共 ${boardTotal} 份匹配菜单 · 第 ${boardPage} / ${boardPages} 页`) : `显示 ${filteredMenus.length} / ${menus.length} 份菜单` }}</p></div><el-input v-model="search" clearable maxlength="100" aria-label="搜索纪念日菜单" placeholder="搜索标题、主题、备注或菜品" :disabled="!!deletingId || !!deleteIssue" /></div>
      <div ref="filterGroup" class="period-filters" role="group" aria-label="按日期筛选菜单"><button v-for="option in periodOptions" :key="option.key" type="button" :class="{ active: period === option.key }" :aria-pressed="period === option.key" :disabled="!!deletingId || !!deleteIssue" @click="period = option.key">{{ option.label }}</button><button v-if="filtersActive" type="button" class="reset-filter" :disabled="!!deletingId || !!deleteIssue" @click="resetFilters">清除筛选</button></div>
    </section>
    <div v-if="!loadError" v-loading="loading" class="menu-content" :aria-busy="loading ? 'true' : 'false'">
      <el-empty v-if="!loading && !menus.length && !filtersActive" description="还没有纪念日菜单" />
      <el-empty v-else-if="!loading && !filteredMenus.length" description="没有符合条件的纪念日菜单" />
      <section v-for="group in menuGroups" :key="group.key" class="menu-group"><div class="group-heading"><h2>{{ group.title }}</h2><span>{{ boardMode ? '本页 ' : '' }}{{ group.items.length }} 份</span></div><div class="menu-grid">
      <el-card v-for="item in group.items" :key="item._id || item.id" class="menu-card" :data-menu-id="item._id || item.id">
        <div class="card-top"><div><h2>{{ item.title }}</h2><p>{{ item.date }} · {{ item.theme || '温馨菜单' }}</p></div><div class="card-actions"><el-button link type="primary" :disabled="loading || !!deletingId || saving || !!deleteIssue || !!saveUncertain || (!!editIssue && editing?.id !== String(item._id || item.id))" :aria-label="`编辑${item.title}`" @click="startEdit(item)"><el-icon><Edit /></el-icon>编辑</el-button><el-button type="danger" link :disabled="loading || !!deletingId || saving || !!deleteIssue || deleteBlocked || !canDelete(item)" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div>
        <span class="day-badge">{{ dayLabel(item) }}</span>
        <router-link v-if="validWeekLink(item.date)" class="menu-calendar-link" :to="{ name: 'calendar', query: { date: item.date } }" :aria-label="`查看${item.title || '纪念日菜单'}的${item.date}日历安排`">查看当天日历 →</router-link>
        <p class="desc">{{ item.description || '没有备注，也可以是一份默契。' }}</p>
        <p v-if="item.supportsUnavailableMealVisibility && Object.keys(mealTypeText).some(key => item.meals?.[key]?.some(meal => meal === null))" class="unavailable-note">部分菜品不可用，原有引用仍保留在菜单中。</p>
        <div v-if="item.photos?.length" class="photos"><button v-for="(photo, index) in item.photos" :key="`${index}-${photo}`" type="button" class="photo-button" :aria-label="`查看${item.title || '纪念日'}的第 ${index + 1} 张照片`" @click="openPhoto(item, index)"><img :src="imageFor(photo)" alt="" @error="imageError" /></button></div>
        <div class="meal-blocks">
          <div v-for="(label, key) in mealTypeText" :key="key" class="meal-block">
            <strong>{{ label }}</strong>
            <el-tag v-for="(meal, index) in item.meals?.[key] || []" :key="meal?._id || `unavailable-${index}`" effect="plain">{{ meal?.name || '菜品不可用' }}</el-tag>
            <span v-if="!item.meals?.[key]?.length" class="empty">菜单未选菜</span>
          </div>
        </div>
      </el-card>
      </div></section>
      <nav v-if="boardMode && boardTotal > boardLimit" class="board-pagination" aria-label="纪念日菜单分页"><el-button :disabled="loading || boardPage <= 1 || !!deleteIssue" @click="changePage(boardPage - 1)">上一页</el-button><span aria-live="polite">第 {{ boardPage }} / {{ boardPages }} 页</span><el-button :disabled="loading || boardPage >= boardPages || !!deleteIssue" @click="changePage(boardPage + 1)">下一页</el-button></nav>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑纪念日菜单' : '新增纪念日菜单'" width="min(620px, 92vw)" :close-on-click-modal="!saving && !confirmingSlot" :close-on-press-escape="!saving && !confirmingSlot" :show-close="!saving && !confirmingSlot">
      <CreateRecoveryNotice v-if="saveUncertain" label="纪念日菜单" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-alert v-if="editIssue" type="warning" :closable="false" show-icon :title="editIssue === 'conflict' ? '菜单已被修改或删除，本次未保存。' : '编辑结果未确认，请先核对最新菜单。'">
        <p>你的草稿和所选照片仍在本页。核对后可载入最新内容；载入会放弃当前草稿。</p>
        <el-button link type="primary" :loading="checkingEdit" @click="checkLatest">刷新最新菜单并核对</el-button>
        <p v-if="latestError" role="alert">{{ latestError }}</p>
        <div v-if="editReviewed" class="latest-summary">
          <template v-if="latestEdit"><strong>{{ latestEdit.title }} · {{ latestEdit.date }}</strong><p>{{ latestEdit.theme || '无主题' }} · {{ latestEdit.photos?.length || 0 }} 张照片</p><p>{{ latestEdit.description || '无备注' }}</p><p v-for="(label, key) in mealTypeText" :key="key">{{ label }}：{{ (latestEdit.meals?.[key] || []).map(meal => meal?.name || '菜品不可用').join('、') || '未安排' }}</p><el-button link type="primary" :disabled="!validVersion(latestEdit)" @click="reloadLatest">放弃草稿并载入最新</el-button><el-button v-if="editIssue === 'unknown' && validVersion(latestEdit) && sameVersion(editing?.version, latestEdit.editVersion)" link type="primary" @click="retryEdit">已核对，允许重试</el-button></template>
          <p v-else>最新列表中已没有这份菜单，可能已被删除。</p>
          <el-button link type="danger" @click="discardEditDraft">放弃编辑草稿</el-button>
        </div>
      </el-alert>
      <el-alert v-if="editing && !mealVisibilityVerified" class="meal-integrity-alert" type="warning" :closable="false" show-icon title="当前服务器未提供菜品完整性核验，暂不能修改餐次；标题、日期和照片仍可编辑。" />
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="菜单模板"><div class="template-list"><el-button v-for="tpl in templates" :key="tpl.key" size="small" @click="applyTemplate(tpl)">{{ tpl.title }}</el-button><span v-if="templateLoading" class="photo-hint">正在加载模板…</span><span v-else-if="!templateError && !templates.length" class="photo-hint">暂无模板，可以直接填写菜单。</span><el-alert v-if="templateError" type="warning" :closable="false" :title="`模板暂不可用：${templateError}`"><el-button link type="primary" @click="loadTemplates">重试</el-button></el-alert></div></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="比如：三周年晚餐" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" :clearable="false" /></el-form-item>
        <el-form-item label="主题"><el-input v-model="form.theme" placeholder="家常、烛光、火锅、露营..." /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.description" type="textarea" rows="3" /></el-form-item>
        <el-form-item v-for="(label, key) in mealTypeText" :key="key" :label="label">
          <div v-if="editing && unavailableMeals[key]" class="unavailable-slot" role="status"><span v-if="!clearedSlots[key]">{{ label }}有 {{ unavailableMeals[key] }} 条菜品不可用；原引用将保留。</span><span v-else>保存后将清除此餐次的不可用引用。</span><el-button v-if="mealVisibilityVerified && !clearedSlots[key]" link type="primary" :disabled="busy" @click="clearUnavailable(key)">清除并编辑{{ label }}</el-button><el-button v-else-if="clearedSlots[key]" link :disabled="busy" @click="undoClearUnavailable(key)">撤销清除{{ label }}</el-button></div>
          <el-select v-model="form.meals[key]" multiple filterable remote reserve-keyword :remote-method="searchMeals" :loading="mealLoading" :disabled="!!editing && (!mealVisibilityVerified || (!!unavailableMeals[key] && !clearedSlots[key]))" :aria-label="`搜索${label}菜品`" placeholder="搜索菜名或食材" style="width: 100%;" @visible-change="openMealOptions" @change="rememberMeals"><el-option v-for="meal in mealOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select>
          <small v-if="!mealError && mealTotal > 50" class="photo-hint">仅显示前 50 道，请输入菜名或食材缩小范围。</small><el-alert v-if="mealError" type="warning" :closable="false" :title="`菜品暂时无法加载：${mealError}`"><el-button link type="primary" @click="searchMealCatalog">重试</el-button></el-alert>
        </el-form-item>
        <el-form-item label="照片"><div v-if="editing && form.existingPhotos.length" ref="existingPhotoGrid" class="existing-photos"><div v-for="(photo, index) in form.existingPhotos" :key="`${index}-${photo}`" class="existing-photo"><img :src="imageFor(photo)" :alt="`已有照片 ${index + 1}`" @error="imageError" /><el-button size="small" type="danger" plain :aria-label="`移除已有照片 ${index + 1}`" @click="removeExistingPhoto(index, $event)">移除</el-button></div></div><div v-if="removedPhotos.length" class="photo-undo" role="status"><span>已移除 {{ removedPhotos.length }} 张，保存后生效。</span><el-button ref="undoPhotoButton" link type="primary" @click="undoPhotoRemoval">撤销最近移除</el-button></div><el-upload action="#" :accept="photoAccept" :limit="12" :on-exceed="() => ElMessage.warning('每次最多上传 12 张照片')" :on-change="handlePhotoChange" :auto-upload="false" :disabled="saving || saveUncertain" multiple list-type="picture-card" v-model:file-list="photoFiles"><el-icon><Picture /></el-icon></el-upload><small class="photo-hint" aria-live="polite">已有 {{ form.existingPhotos.length }} 张，本次选择 {{ photoFiles.length }} / 12 张。每次最多上传 12 张，单张不超过 30MB（实际以上传服务器设置为准）；支持 JPG、PNG、GIF、WebP、HEIC、HEIF。移除后需保存才生效。</small></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving || !!confirmingSlot" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || !!editIssue || loading || !!loadError || !!deleteIssue || !!confirmingSlot" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog :model-value="!!viewedPhoto" title="纪念日照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) viewedPhoto = null }"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.photos[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.photos[viewedPhoto.index])" :alt="viewedPhoto.title" @error="imageError" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张纪念日照片" @click="movePhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.photos.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.photos.length - 1" aria-label="下一张纪念日照片" @click="movePhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.calendar-explanation { font-size: 13px; line-height: 1.6; }
.menu-calendar-link { display: inline-flex; align-items: center; min-height: 44px; margin-left: 10px; color: var(--text-primary); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.menu-calendar-link:focus-visible { outline: 3px solid var(--text-primary); outline-offset: 2px; }
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.anniversary-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.photo-hint{display:block;width:100%;color:var(--text-secondary);line-height:1.5;margin-top:8px}
.page-header p, .card-top p, .desc, .empty { color: var(--text-secondary); }
.menu-filters { --menu-accent: color-mix(in srgb,var(--secondary-color) 45%,#33211a); padding: 22px 24px; border: 1px solid var(--border-color); border-radius: 22px; background: var(--bg-primary); box-shadow: 0 8px 24px var(--shadow-color); }
.filter-heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px; }
.filter-heading h2 { margin-top: 6px; font-size: 19px; }
.filter-heading p { margin: 5px 0 0; color: var(--text-primary); font-size: 13px; }
.filter-kicker { color: var(--menu-accent); font-size: 10px; font-weight: 800; letter-spacing: .13em; }
.filter-heading :deep(.el-input) { width: min(100%, 360px); }
.filter-heading :deep(.el-input__wrapper) { min-height: 44px; }
.period-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.period-filters button { min-height: 44px; padding: 8px 15px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; }
.period-filters button.active { border: 2px solid var(--menu-accent); background: var(--bg-tertiary); font-weight: 700; }
.period-filters button:focus-visible { outline: 2px solid var(--menu-accent); outline-offset: 3px; }
.period-filters button:disabled { cursor: not-allowed; opacity: .65; }
.period-filters .reset-filter { text-decoration: underline; text-underline-offset: 3px; }
.filter-note { margin: 0; color: var(--text-primary); font-size: 13px; line-height: 1.5; }
.menu-content { display: flex; flex-direction: column; gap: 22px; }
.board-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px; color: var(--text-primary); }
.board-pagination :deep(.el-button) { min-height: 44px; margin: 0; }
.menu-group { display: flex; flex-direction: column; gap: 12px; }
.group-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; padding: 0 3px; color: var(--text-primary); }
.group-heading h2 { font-size: 19px; }.group-heading span { font-size: 13px; }
.day-badge { display: inline-flex; padding: 5px 10px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); font-size: 12px; font-weight: 700; }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
.card-top { display: flex; justify-content: space-between; gap: 12px; }
.card-actions { display: flex; align-items: flex-start; flex-shrink: 0; }
.card-actions .el-button + .el-button { margin-left: 10px; }
.latest-summary { margin-top: 8px; padding: 12px; border-radius: 10px; background: var(--bg-primary); overflow-wrap: anywhere; }
.latest-summary p { margin: 6px 0; }
.existing-photos { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; margin-bottom: 12px; }
.existing-photo { display: grid; gap: 6px; width: 90px; }
.existing-photo img { width: 90px; height: 72px; border-radius: 8px; object-fit: cover; }
.photo-undo { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; width: 100%; margin-bottom: 10px; color: var(--text-primary); font-size: 13px; }
.photo-undo :deep(.el-button) { min-height: 44px; margin: 0; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
.photo-button { padding: 0; border: 0; border-radius: 8px; background: var(--bg-secondary); cursor: pointer; }
.photo-button:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.photos img { display: block; width: 100%; height: 88px; object-fit: cover; border-radius: 8px; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.meal-blocks { display: flex; flex-direction: column; gap: 10px; }
.meal-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary); border-radius: 8px; }
.unavailable-note { color: var(--text-primary); font-size: 13px; line-height: 1.5; }
.unavailable-slot { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; width: 100%; margin-bottom: 8px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); line-height: 1.5; }
.unavailable-slot :deep(.el-button) { min-height: 44px; margin: 0; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.meal-integrity-alert { --notice-ink: #623a10; margin-bottom: 14px; background: #fff1db; color: var(--notice-ink); }
.meal-integrity-alert :deep(.el-alert__title), .meal-integrity-alert :deep(.el-alert__icon) { color: var(--notice-ink); }
:global(html.dark) .meal-integrity-alert { --notice-ink: #ffe4bd; background: #543b29; }
:global(html.dark .menu-filters) { --menu-accent: var(--secondary-color); }
.template-list { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } .menu-filters { padding: 18px; } .filter-heading { align-items: stretch; flex-direction: column; } .filter-heading :deep(.el-input) { width: 100%; } }
</style>
