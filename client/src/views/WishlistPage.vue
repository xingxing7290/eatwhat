<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { Plus, Delete, Check, Star, Calendar, Edit } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { validWishVersion } from '@/utils/wishlistVersion.mjs';

const items = ref([]);
const router = useRouter();
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const convertingId = ref('');
const actionId = ref('');
const confirmingId = ref('');
const actionIssue = ref('');
const editing = ref(null);
const editIssue = ref('');
const checkingEdit = ref(false);
const editReviewed = ref(false);
const latestEdit = ref(null);
const latestError = ref('');
const pendingLinks = reactive({});
const reviewedLinks = reactive({});
const linkReviewErrors = reactive({});
const uncertainCreates = reactive({});
const linkDialog = ref(false);
const linkItem = ref(null);
const availableMeals = ref([]);
const selectedMealId = ref('');
const selectedMeal = ref(null);
const linkQuery = ref('');
const linkTotal = ref(0);
const linkLoading = ref(false);
const linkError = ref('');
let linkSequence = 0;
let linkTimer = null;
let listSequence = 0;
let alive = true;
const form = reactive({ title: '', note: '', category: '', priority: 'normal' });
const search = ref('');
const selectedStatus = ref('all');
const selectedPriority = ref('all');
const boardMode = ref(false);
const boardPage = ref(1);
const boardLimit = 12;
const boardTotal = ref(0);
const boardMatched = ref({});
const boardTotals = ref({});
const pendingView = ref(false);
let filterTimer = null;
const statusFilterGroup = ref(null);
const addWishButton = ref(null);
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => reset(), reopen: () => { dialogVisible.value = true; }, label: '想吃记录' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || !!convertingId.value || !!actionId.value || !!confirmingId.value || checkingEdit.value || reviewing.value || deciding.value);
const uncertain = computed(() => saveUncertain.value || !!actionIssue.value || !!editIssue.value || Object.keys(pendingLinks).length > 0 || Object.keys(uncertainCreates).length > 0);
const actionLocked = computed(() => !!editIssue.value || (!!editing.value && dirty.value));
useDraftGuard({ dirty, busy, uncertain, label: '想吃记录' });
const statusText = { open: '想吃', planned: '已安排', done: '已完成', unknown: '状态待核对' };
const priorityText = { low: '随缘', normal: '普通', high: '超想吃' };
const priorityRank = { low: 0, normal: 1, high: 2 };
const rankOf = item => Object.prototype.hasOwnProperty.call(priorityRank, item.priority) ? priorityRank[item.priority] : priorityRank.normal;
const priorityBucket = item => Object.prototype.hasOwnProperty.call(priorityText, item.priority) ? item.priority : 'unset';
const canEdit = item => item?.supportsWishEdit === true && validWishVersion(item);
const sameVersion = (left, right) => !!left && !!right && left.revision === right.revision && left.updatedAt === right.updatedAt;
const mealId = meal => String(meal?._id || meal?.id || '');
const linkedMealId = item => {
  const meal = item?.mealId;
  const id = typeof meal === 'string' ? meal : meal?._id || meal?.id;
  return typeof id === 'string' && /^[a-z\d_-]{1,128}$/i.test(id) ? id : '';
};
const linkedMealName = item => typeof item?.mealId?.name === 'string' && item.mealId.name.trim() ? item.mealId.name.trim() : '查看菜谱';
const confirmedLink = (result, wishId, expectedMealId) => result?._id === wishId && String(typeof result.mealId === 'string' ? result.mealId : result.mealId?._id || result.mealId?.id || '') === String(expectedMealId);
const linkOptions = computed(() => {
  const seen = new Set();
  return [selectedMeal.value, ...availableMeals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const statusBucket = item => ['open', 'planned', 'done'].includes(item.status) ? item.status : 'unknown';
const statusOptions = computed(() => [
  { key: 'all', label: '全部' }, { key: 'open', label: '想吃' },
  { key: 'planned', label: '已安排' }, { key: 'done', label: '已完成' },
  ...((boardMode.value ? boardTotals.value.unknown > 0 || selectedStatus.value === 'unknown' : items.value.some(item => statusBucket(item) === 'unknown')) ? [{ key: 'unknown', label: '待核对' }] : [])
]);
const filterActive = computed(() => !!search.value.trim() || selectedStatus.value !== 'all' || selectedPriority.value !== 'all');
const filteredItems = computed(() => {
  if ((boardMode.value && !pendingView.value) || pendingView.value) return items.value;
  const query = search.value.trim().toLocaleLowerCase();
  return items.value.filter(item => {
    if (selectedStatus.value !== 'all' && statusBucket(item) !== selectedStatus.value) return false;
    if (selectedPriority.value !== 'all' && priorityBucket(item) !== selectedPriority.value) return false;
    const linkedName = typeof item.mealId === 'object' ? item.mealId?.name : '';
    return !query || [item.title, item.note, item.category, linkedName].some(value => String(value || '').toLocaleLowerCase().includes(query));
  });
});
const resetFilters = () => { search.value = ''; selectedStatus.value = 'all'; selectedPriority.value = 'all'; };
const hiddenPendingCount = computed(() => {
  if (pendingView.value) return 0;
  const visible = new Set(filteredItems.value.map(item => item._id));
  return new Set([...Object.keys(pendingLinks), ...Object.keys(uncertainCreates)].filter(id => !visible.has(id))).size;
});
const grouped = computed(() => ['open', 'planned', 'done', 'unknown'].filter(status => (status !== 'unknown' || (boardMode.value && !pendingView.value ? boardTotals.value.unknown > 0 : items.value.some(item => statusBucket(item) === 'unknown'))) && (pendingView.value || selectedStatus.value === 'all' || status === selectedStatus.value)).map(status => ({
  status,
  total: boardMode.value && !pendingView.value ? (boardTotals.value[status] || 0) : items.value.filter(item => statusBucket(item) === status).length,
  matched: boardMode.value && !pendingView.value ? (boardMatched.value[status] || 0) : filteredItems.value.filter(item => statusBucket(item) === status).length,
  items: filteredItems.value.filter(item => statusBucket(item) === status).sort((a, b) => rankOf(b) - rankOf(a) || (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
})));
const totalPages = computed(() => Math.max(1, Math.ceil(boardTotal.value / boardLimit)));
const pendingIds = () => [...new Set([...Object.keys(pendingLinks), ...Object.keys(uncertainCreates)])];
const validItems = rows => Array.isArray(rows) && rows.every(item => item && typeof item._id === 'string' && !!item._id && typeof item.title === 'string' && !!item.title.trim()) && new Set(rows.map(item => item._id)).size === rows.length;
const validCounts = counts => counts && ['open', 'planned', 'done', 'unknown'].every(key => Number.isSafeInteger(counts[key]) && counts[key] >= 0);

const load = async () => {
  if (filterTimer) { clearTimeout(filterTimer); filterTimer = null; }
  const sequence = ++listSequence;
  loading.value = true;
  loadError.value = '';
  try {
    if (pendingView.value && !pendingIds().length) pendingView.value = false;
    const query = { view: 'board', page: boardPage.value, limit: boardLimit, search: search.value.trim(), status: selectedStatus.value, priority: selectedPriority.value };
    let result;
    if (pendingView.value) {
      const ids = pendingIds();
      const rows = [];
      for (const id of ids) {
        const item = await api.wishlist.get(id, { suppressErrorToast: true });
        if (!alive || sequence !== listSequence) return;
        if (String(item?._id || '') !== id) throw new Error('待核对记录不完整，请重试或返回全部清单');
        rows.push(item);
      }
      result = rows;
    } else result = await api.wishlist.list(query);
    if (!alive || sequence !== listSequence) return;
    if (!pendingView.value && result?.supportsWishlistBoard === true) {
      const sum = counts => Object.values(counts).reduce((a, b) => a + b, 0);
      if (result.page !== query.page || result.limit !== boardLimit || result.search !== query.search || result.status !== query.status || result.priority !== query.priority || !validCounts(result.matched) || !validCounts(result.totals) || !Number.isSafeInteger(result.total) || result.total !== sum(result.matched) || sum(result.matched) > sum(result.totals) || !validItems(result.items) || result.items.length !== Math.min(boardLimit, Math.max(0, result.total - (query.page - 1) * boardLimit))) throw new Error('分页清单数据不完整');
      boardMode.value = true; boardTotal.value = result.total; boardMatched.value = result.matched; boardTotals.value = result.totals;
      if (boardPage.value > totalPages.value) { boardPage.value = totalPages.value; return load(); }
      items.value = result.items;
    } else {
      if (!validItems(result)) throw new Error('清单数据不完整');
      if (!pendingView.value) boardMode.value = false;
      items.value = result;
    }
    for (const item of items.value) if (item.mealId) { delete pendingLinks[item._id]; delete reviewedLinks[item._id]; delete linkReviewErrors[item._id]; delete uncertainCreates[item._id]; }
    actionIssue.value = '';
  }
  catch (e) { if (alive && sequence === listSequence) loadError.value = e?.error || e?.message || '加载想吃清单失败'; }
  finally { if (alive && sequence === listSequence) loading.value = false; }
};
const showPending = () => { pendingView.value = true; load(); };
const showBoard = () => { pendingView.value = false; load(); };
const changePage = page => { if (!loading.value && page >= 1 && page <= totalPages.value && page !== boardPage.value) { boardPage.value = page; load(); } };
watch([search, selectedStatus, selectedPriority], () => {
  if (!boardMode.value || pendingView.value) return;
  boardPage.value = 1;
  listSequence++;
  loading.value = true;
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(load, 200);
}, { flush: 'sync' });
const reset = () => {
  Object.assign(form, { title: '', note: '', category: '', priority: 'normal' });
  editing.value = null; editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const fillEdit = item => {
  if (!(item?._id || item?.id) || !canEdit(item) || typeof item.title !== 'string' || !item.title.trim() || typeof item.note !== 'string' || typeof item.category !== 'string' || !Object.prototype.hasOwnProperty.call(priorityText, item.priority)) throw new Error('想吃记录或版本不完整，请刷新后重试');
  Object.assign(form, { title: item.title, note: item.note, category: item.category, priority: item.priority });
  editing.value = { id: String(item._id || item.id), version: { ...item.editVersion } };
  editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const confirmReplaceDraft = async () => {
  if (!dirty.value) return true;
  confirmingId.value = 'draft';
  try { await ElMessageBox.confirm('切换记录会丢失当前未保存的内容。', '放弃当前草稿？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续编辑' }); return true; }
  catch (_) { return false; } finally { confirmingId.value = ''; }
};
const startCreate = async () => {
  if (busy.value || loading.value || loadError.value || actionIssue.value || editIssue.value) return;
  if (editing.value) { if (!await confirmReplaceDraft()) return; reset(); }
  dialogVisible.value = true;
};
const startEdit = async item => {
  if (busy.value || loading.value || loadError.value || actionIssue.value || saveUncertain.value) return;
  if (editing.value?.id === String(item._id || item.id)) { dialogVisible.value = true; return; }
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (!canEdit(item)) return ElMessage.warning('服务器未提供安全编辑能力，请稍后重试');
  if (!await confirmReplaceDraft()) return;
  try { fillEdit(item); dialogVisible.value = true; } catch (e) { ElMessage.warning(e.message); }
};
const checkLatest = async () => {
  if (!editing.value || checkingEdit.value) return;
  checkingEdit.value = true; editReviewed.value = false; latestError.value = ''; latestEdit.value = null;
  try {
    const item = await api.wishlist.get(editing.value.id);
    if (!alive) return;
    if (!item || String(item._id || item.id) !== editing.value.id || !canEdit(item)) throw new Error('最新记录或版本不完整');
    latestEdit.value = item; editReviewed.value = true;
  } catch (e) {
    if (!alive) return;
    if (e?.code === 'WISH_NOT_FOUND') editReviewed.value = true;
    else latestError.value = e?.error || e?.message || '无法读取最新记录，请重试';
  } finally { if (alive) checkingEdit.value = false; }
};
const reloadLatest = async () => {
  if (!editReviewed.value || !latestEdit.value || !canEdit(latestEdit.value)) return;
  try { await ElMessageBox.confirm('载入最新记录会放弃当前草稿。', '重新载入最新内容？', { type: 'warning', confirmButtonText: '放弃草稿并载入', cancelButtonText: '继续保留草稿' }); } catch (_) { return; }
  try { fillEdit(latestEdit.value); } catch (e) { ElMessage.warning(e.message); }
};
const retryEdit = async () => {
  if (editIssue.value !== 'unknown' || !editReviewed.value || !latestEdit.value || !sameVersion(editing.value?.version, latestEdit.value.editVersion)) return;
  try { await ElMessageBox.confirm('核对时版本尚未变化；先前请求仍可能稍后完成。重试使用相同版本，只有一个请求可以成功。', '确认重新提交？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); editIssue.value = ''; editReviewed.value = false; } catch (_) {}
};
const discardEditDraft = async () => {
  if (!editing.value || (editIssue.value && !editReviewed.value)) return;
  try { await ElMessageBox.confirm('将放弃本页草稿，不会删除服务器上的想吃记录。', '放弃编辑草稿？', { type: 'warning', confirmButtonText: '确认放弃草稿', cancelButtonText: '继续编辑' }); } catch (_) { return; }
  reset(); dialogVisible.value = false;
};
const save = async () => {
  if (!form.title.trim()) return ElMessage.warning('请填写想吃什么');
  if (saving.value || saveUncertain.value || editIssue.value || reviewing.value || loading.value || loadError.value || actionIssue.value || actionId.value) return;
  saving.value = true;
  try {
    let result;
    if (editing.value) {
      const original = JSON.parse(initialForm.value);
      const changes = Object.fromEntries(Object.keys(form).filter(key => form[key] !== original[key]).map(key => [key, form[key]]));
      if (!Object.keys(changes).length) { dialogVisible.value = false; reset(); return; }
      result = await api.wishlist.updateDetails(editing.value.id, changes, editing.value.version);
      if (String(result?._id || result?.id || '') !== editing.value.id || !canEdit(result)) throw new Error('保存响应不完整');
    } else result = await api.wishlist.create({ ...form, title: form.title.trim() });
    if (!result?._id && !result?.id) throw new Error('保存响应不完整');
    const savedMessage = editing.value ? '想吃记录已更新' : '已加入想吃清单';
    ElMessage.success(`${savedMessage}${boardMode.value && (filterActive.value || boardPage.value > 1 || pendingView.value) ? '；如未显示，请调整筛选或页码' : ''}`);
    dialogVisible.value = false;
    reset();
    await load();
  } catch (e) {
    if (editing.value) { editIssue.value = e?.code === 'WISH_CONFLICT' ? 'conflict' : 'unknown'; editReviewed.value = false; latestEdit.value = null; latestError.value = ''; }
    else markUncertain();
  }
  finally { saving.value = false; }
};
const runAction = async (item, label, action, verify = null) => {
  if (!item?._id || busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  const hadFocus = document.activeElement?.closest('.wish-card')?.dataset.wishId === item._id;
  actionId.value = item._id;
  try { const result = await action(); if (verify && !verify(result)) throw new Error('操作响应不完整'); await load(); }
  catch (e) { actionIssue.value = e?.code === 'WISH_CONFLICT' ? '这条想吃已被其他成员修改或删除，本次未操作；请刷新清单并核对。' : `${label}结果未确认，请刷新清单并核对后再操作；先前请求仍可能稍后完成。`; }
  finally { actionId.value = ''; }
  if (hadFocus && !loadError.value && !filteredItems.value.some(row => row._id === item._id)) {
    await nextTick();
    if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) (statusFilterGroup.value?.querySelector('button[aria-pressed="true"]') || addWishButton.value?.$el)?.focus();
  }
};
const vote = item => {
  if (!item.supportsSetVote || typeof item.votedByMe !== 'boolean') return ElMessage.warning('服务器未提供安全投票能力，请稍后重试');
  const target = !item.votedByMe;
  return runAction(item, '投票', () => api.wishlist.setVote(item._id, target), result => result?._id === item._id && result.votedByMe === target);
};
const setStatus = (item, status) => {
  if (!validWishVersion(item)) return ElMessage.warning('服务器未提供有效的记录版本，暂时不能安全修改状态');
  return runAction(item, '状态更新', () => api.wishlist.updateStatus(item._id, status, item.editVersion), result => result?._id === item._id && result.status === status);
};
const remove = async (item) => {
  if (busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  if (pendingLinks[item._id] || uncertainCreates[item._id]) return ElMessage.warning('请先核对菜谱创建或关联结果，再删除记录');
  if (!validWishVersion(item)) return ElMessage.warning('服务器未提供有效的记录版本，暂时不能安全删除');
  confirmingId.value = item._id;
  try { await ElMessageBox.confirm('确定删除这个想吃项吗？', '删除确认'); } catch (_) { return; }
  finally { confirmingId.value = ''; }
  await runAction(item, '删除', () => api.wishlist.delete(item._id, item.editVersion));
};
const convertToMeal = async (item) => {
  if (item.mealId) return ElMessage.info('这条想吃已经关联菜谱');
  if (!item.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  if (busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  convertingId.value = item._id;
  try {
    const meal = await api.meal.createMeal({ name: item.title, description: item.note || '来自想吃清单', category: item.category || '想吃清单', tags: ['想吃清单'], favorite: true });
    if (!meal?._id && !meal?.id) throw new Error('创建结果缺少菜谱编号');
    pendingLinks[item._id] = meal._id || meal.id;
    delete reviewedLinks[item._id]; delete linkReviewErrors[item._id];
    try {
      const linked = await api.wishlist.attachMeal(item._id, pendingLinks[item._id], { onlyIfUnlinked: true });
      if (!confirmedLink(linked, item._id, pendingLinks[item._id])) throw new Error('关联响应不完整');
      delete pendingLinks[item._id];
    } catch (error) {
      ElMessage.warning('菜谱已创建，但关联结果尚不确定；请刷新清单核对，避免重复创建');
      await load();
      return;
    }
    ElMessage.success('已创建并关联菜谱，可继续安排到日历');
    await load();
  } catch (e) { uncertainCreates[item._id] = true; ElMessage.warning('创建结果不确定，请先在菜谱中检查，也可选择关联已有菜谱'); }
  finally { convertingId.value = ''; }
};
const fetchLinkMeals = async () => {
  const sequence = ++linkSequence;
  const query = linkQuery.value.trim();
  linkLoading.value = true; linkError.value = '';
  try {
    const params = { page: 1, limit: 50 }; if (query) params.search = query;
    const result = await api.meal.getAllMeals(params);
    if (!alive || sequence !== linkSequence || !linkDialog.value) return;
    let rows = result.data; let total = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim())) throw new Error('菜谱列表不完整');
    if (result.page == null && result.limit == null && rows.length === total) {
      const lower = query.toLowerCase();
      rows = rows.filter(meal => [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)));
      total = rows.length; rows = rows.slice(0, 50);
    }
    availableMeals.value = rows; linkTotal.value = total;
  } catch (e) { if (alive && sequence === linkSequence && linkDialog.value) linkError.value = e?.error || e?.message || '加载菜谱失败'; }
  finally { if (alive && sequence === linkSequence) linkLoading.value = false; }
};
const searchLinkMeals = query => {
  linkQuery.value = typeof query === 'string' ? query : ''; linkSequence++;
  linkLoading.value = true; linkError.value = '';
  if (linkTimer) clearTimeout(linkTimer);
  linkTimer = setTimeout(fetchLinkMeals, 180);
};
const rememberLinkMeal = id => { selectedMeal.value = linkOptions.value.find(meal => mealId(meal) === String(id)) || null; };
const openLinkDialog = item => {
  if (!item?.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  if (busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  linkItem.value = item;
  selectedMealId.value = '';
  selectedMeal.value = null;
  availableMeals.value = [];
  linkTotal.value = 0;
  linkDialog.value = true;
  searchLinkMeals('');
};
const attachExisting = async (item, mealId) => {
  if (!item || !item.supportsSafeMealLink || !mealId || busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  convertingId.value = item._id;
  try {
    const result = await api.wishlist.attachMeal(item._id, mealId, { onlyIfUnlinked: true });
    if (!confirmedLink(result, item._id, mealId)) throw new Error('关联响应不完整');
    delete pendingLinks[item._id];
    delete uncertainCreates[item._id];
    linkDialog.value = false;
    ElMessage.success('已关联菜谱');
  } catch (error) {
    pendingLinks[item._id] = mealId;
    delete reviewedLinks[item._id]; delete linkReviewErrors[item._id];
    linkDialog.value = false;
    ElMessage.warning('关联未确认，请先刷新清单后检查');
  } finally { await load(); convertingId.value = ''; }
};
const reviewPendingLink = async item => {
  const expected = pendingLinks[item?._id];
  if (!expected || busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  convertingId.value = item._id;
  delete reviewedLinks[item._id]; delete linkReviewErrors[item._id];
  try {
    const latest = await api.wishlist.get(item._id, { suppressErrorToast: true });
    if (!alive || pendingLinks[item._id] !== expected) return;
    if (latest?._id !== item._id || !Object.prototype.hasOwnProperty.call(latest, 'mealId')) throw new Error('记录信息不完整');
    if (latest.mealId !== null) {
      const linked = typeof latest.mealId === 'string' ? latest.mealId : latest.mealId?._id || latest.mealId?.id;
      if (typeof linked !== 'string' || !linked.trim()) throw new Error('关联菜谱信息不完整');
      delete pendingLinks[item._id];
      ElMessage.info('已读取到关联菜谱，请核对当前记录');
      await load();
    } else reviewedLinks[item._id] = true;
  } catch (error) { if (alive && pendingLinks[item._id] === expected) linkReviewErrors[item._id] = error?.error || error?.message || '无法读取最新记录'; }
  finally { convertingId.value = ''; }
};
const finishLinkReview = async item => {
  const expected = pendingLinks[item?._id];
  if (!expected || !reviewedLinks[item._id] || busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  confirmingId.value = item._id;
  try {
    await ElMessageBox.confirm('当前读取结果尚未关联，但先前请求仍可能稍后完成。结束核对不会取消该请求，也不会删除已经创建的菜谱。', '结束关联核对？', { type: 'warning', confirmButtonText: '了解风险，结束核对', cancelButtonText: '继续核对' });
    if (pendingLinks[item._id] === expected) { delete pendingLinks[item._id]; delete reviewedLinks[item._id]; delete linkReviewErrors[item._id]; }
  } catch (_) {} finally { confirmingId.value = ''; }
};
const arrangeToday = (item) => {
  if (busy.value || loading.value || loadError.value || actionIssue.value || actionLocked.value) return;
  const meal = item.mealId;
  const id = typeof meal === 'string' ? meal : meal?._id || meal?.id;
  if (!id) return ElMessage.warning('请先关联菜谱');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  router.push({ name: 'MealSelection', query: { date, mealType: 'dinner', suggestedMealId: id, wishlistId: item._id } });
};
onMounted(load);
onBeforeUnmount(() => { alive = false; linkSequence++; listSequence++; if (linkTimer) clearTimeout(linkTimer); if (filterTimer) clearTimeout(filterTimer); });
</script>

<template>
  <div class="wishlist-page">
    <div class="page-header">
      <div><span class="eyebrow">LITTLE WISHES · 想吃灵感</span><h1>想吃清单</h1><p>把突然想吃的、对方提到的、周末想试的都先记下来。</p><small>手动标记状态不会自动写入日历；关联菜谱后可安排到今天晚餐。</small></div>
      <el-button ref="addWishButton" type="primary" :disabled="loading || !!loadError || reviewing || !!actionIssue || !!actionId || !!confirmingId || !!editIssue" @click="startCreate"><el-icon><Plus /></el-icon>添加想吃</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="想吃记录" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
    <el-alert v-if="editing && !dialogVisible" type="info" :closable="false" show-icon :title="editIssue ? '编辑结果需要核对，草稿仍保留在本页。' : '编辑草稿仍保留在本页。'"><el-button link type="primary" @click="dialogVisible = true">继续编辑</el-button><el-button v-if="!editIssue" link type="danger" @click="discardEditDraft">放弃草稿</el-button></el-alert>

    <el-alert v-if="actionIssue" type="warning" :closable="false" show-icon :title="actionIssue"><el-button link type="primary" :loading="loading" @click="load">刷新清单并核对</el-button></el-alert>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`想吃清单暂时无法加载：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button><el-button v-if="pendingView" link @click="showBoard">返回全部清单</el-button></el-alert>
    <section v-if="!loadError && !pendingView && (items.length || boardMode || filterActive)" class="wish-filters" aria-label="查找想吃记录">
      <div class="filter-heading"><div><h2>查找心愿</h2><p aria-live="polite"><template v-if="boardMode">{{ loading ? '正在更新结果' : `共 ${boardTotal} 条匹配记录 · 第 ${boardPage} / ${totalPages} 页` }}</template><template v-else>显示 {{ filteredItems.length }} / {{ items.length }} 条记录</template></p></div><el-input v-model="search" clearable maxlength="100" placeholder="搜索想吃、备注、分类或关联菜谱" aria-label="搜索想吃记录" /></div>
      <div class="filter-controls"><div ref="statusFilterGroup" class="status-filters" role="group" aria-label="按状态筛选"><button v-for="option in statusOptions" :key="option.key" type="button" :class="{ active: selectedStatus === option.key }" :aria-pressed="selectedStatus === option.key" @click="selectedStatus = option.key">{{ option.label }}</button></div><label class="priority-filter">优先级 <select v-model="selectedPriority" aria-label="按优先级筛选"><option value="all">全部优先级</option><option value="high">超想吃</option><option value="normal">普通</option><option value="low">随缘</option><option value="unset">未设置</option></select></label></div>
    </section>
    <div v-if="pendingView && !loadError" class="hidden-pending" role="status"><span>正在查看关联或创建结果待核对的记录。</span><el-button link type="primary" @click="showBoard">返回全部清单</el-button></div>
    <div v-if="!loadError && !loading && hiddenPendingCount" class="hidden-pending" role="status"><span>有 {{ hiddenPendingCount }} 条关联或创建结果待核对的记录不在当前结果中。</span><el-button link type="primary" @click="showPending">查看待核对记录</el-button></div>
    <el-empty v-if="!loadError && !loading && !pendingView && filterActive && !filteredItems.length" description="没有符合条件的想吃记录"><el-button @click="resetFilters">清除筛选</el-button></el-empty>
    <div v-else-if="!loadError" v-loading="loading" class="board" :class="{ 'single-column': selectedStatus !== 'all' }" :aria-busy="loading ? 'true' : 'false'">
      <section v-for="group in grouped" :key="group.status" class="status-column">
        <h2>{{ statusText[group.status] }} <span>{{ filterActive && !pendingView ? `${group.matched} / ${group.total}` : group.total }}</span></h2>
        <p v-if="!group.items.length" class="empty-column">{{ boardMode && !pendingView && group.matched ? '本页没有记录，可翻页查看' : filterActive && group.total && !pendingView ? '没有符合条件的记录' : `暂时没有${statusText[group.status]}的记录` }}</p>
        <el-card v-for="item in group.items" :key="item._id" class="wish-card" :data-wish-id="item._id">
          <div class="wish-title"><strong>{{ item.title }}</strong><el-tag>{{ priorityText[priorityBucket(item)] || '未设置' }}</el-tag></div>
          <p>{{ item.note || '还没有备注' }}</p>
          <div v-if="linkedMealId(item)" class="linked-meal"><span>关联菜谱：</span><router-link :to="{ name: 'MealDetail', params: { id: linkedMealId(item) } }" target="_blank" rel="noopener noreferrer" :aria-label="`查看${item.title}的关联菜谱：${linkedMealName(item)}（新标签打开）`">{{ linkedMealName(item) }} <span aria-hidden="true">↗</span></router-link><small>新标签打开</small></div>
          <p v-else-if="item.mealId" class="pending-note">关联菜谱信息不完整，请刷新清单后核对。</p>
          <p v-if="group.status === 'unknown'" class="pending-note">记录状态无法识别，请刷新核对或联系管理员；暂不能操作。</p>
          <template v-else>
          <p v-if="!item.mealId && !item.supportsSafeMealLink" class="pending-note">服务器未提供安全关联能力，暂不能关联菜谱。</p>
          <p v-if="uncertainCreates[item._id] && !item.mealId" class="pending-note">创建结果不确定，请先搜索并关联已有菜谱，避免重复创建。</p>
          <p v-if="pendingLinks[item._id]" class="pending-note">菜谱关联尚未确认，请先刷新清单核对，再决定是否重试。</p>
          <p v-if="reviewedLinks[item._id] && pendingLinks[item._id]" class="pending-note">最新记录尚未关联；先前请求仍可能稍后完成。</p>
          <p v-if="linkReviewErrors[item._id]" class="pending-note">核对失败：{{ linkReviewErrors[item._id] }}</p>
          <div class="vote-row"><el-button link type="warning" :disabled="busy || loading || !!actionIssue || actionLocked || !item.supportsSetVote || typeof item.votedByMe !== 'boolean'" :aria-pressed="item.votedByMe === true" :aria-label="`${item.votedByMe ? '取消想吃' : '我想吃'}${item.title}`" @click="vote(item)"><el-icon><Star /></el-icon>{{ item.votedByMe ? '已想吃' : '我想吃' }} · {{ item.votes?.length || 0 }} 票</el-button><span>{{ item.category }}</span></div>
          <p v-if="!item.supportsSetVote || typeof item.votedByMe !== 'boolean'" class="pending-note">服务器暂不支持安全投票。</p>
          <p v-if="!validWishVersion(item)" class="pending-note">服务器未提供记录版本，暂不能安全修改状态或删除。</p><p v-else-if="!item.supportsWishEdit" class="pending-note">服务器暂不支持安全编辑想吃内容。</p>
          <div class="actions">
            <el-button size="small" :disabled="busy || loading || !!actionIssue || !!saveUncertain || !canEdit(item) || (!!editIssue && editing?.id !== String(item._id || item.id))" :aria-label="`编辑${item.title}`" @click="startEdit(item)"><el-icon><Edit /></el-icon>编辑</el-button>
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || actionLocked || !item.supportsSafeMealLink || !!uncertainCreates[item._id]" @click="convertToMeal(item)">转菜品</el-button>
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || actionLocked || !item.supportsSafeMealLink" @click="openLinkDialog(item)">关联已有菜谱</el-button>
            <el-button v-if="!item.mealId && pendingLinks[item._id]" size="small" :loading="convertingId === item._id" :disabled="busy || loading || !!actionIssue || actionLocked" @click="attachExisting(item, pendingLinks[item._id])">重试关联</el-button>
            <el-button v-if="!item.mealId && pendingLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || actionLocked" @click="reviewPendingLink(item)">核对关联</el-button>
            <el-button v-if="!item.mealId && pendingLinks[item._id] && reviewedLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || actionLocked" @click="finishLinkReview(item)">结束核对</el-button>
            <el-button v-if="item.mealId" size="small" :disabled="busy || loading || !!actionIssue || actionLocked || !linkedMealId(item)" @click="arrangeToday(item)"><el-icon><Calendar /></el-icon>安排今天晚餐</el-button>
            <el-button v-if="item.status === 'open'" size="small" :disabled="busy || loading || !!actionIssue || actionLocked || !validWishVersion(item)" @click="setStatus(item, 'planned')">标记已安排</el-button>
            <el-button v-if="item.status !== 'done'" size="small" type="success" :disabled="busy || loading || !!actionIssue || actionLocked || !validWishVersion(item)" @click="setStatus(item, 'done')"><el-icon><Check /></el-icon>完成</el-button>
            <el-button v-if="item.status !== 'open'" size="small" :disabled="busy || loading || !!actionIssue || actionLocked || !validWishVersion(item)" @click="setStatus(item, 'open')">重新想吃</el-button>
            <el-button size="small" type="danger" :disabled="busy || loading || !!actionIssue || actionLocked || !validWishVersion(item) || !!pendingLinks[item._id] || !!uncertainCreates[item._id]" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button>
          </div>
          </template>
        </el-card>
      </section>
    </div>
    <nav v-if="boardMode && !pendingView && !loadError && boardTotal > boardLimit" class="board-pagination" aria-label="想吃清单分页"><el-button :disabled="loading || boardPage <= 1" @click="changePage(boardPage - 1)">上一页</el-button><span aria-live="polite">第 {{ boardPage }} / {{ totalPages }} 页</span><el-button :disabled="loading || boardPage >= totalPages" @click="changePage(boardPage + 1)">下一页</el-button></nav>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑想吃记录' : '添加想吃'" width="min(520px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <CreateRecoveryNotice v-if="saveUncertain" label="想吃记录" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-alert v-if="editIssue" type="warning" :closable="false" show-icon :title="editIssue === 'conflict' ? '想吃记录已被修改或删除，本次未保存。' : '编辑结果未确认，请先核对最新记录。'">
        <p>你的草稿仍在本页。载入最新内容会放弃当前草稿。</p><el-button link type="primary" :loading="checkingEdit" @click="checkLatest">读取最新记录并核对</el-button><p v-if="latestError">{{ latestError }}</p>
        <div v-if="editReviewed" class="latest-summary"><template v-if="latestEdit"><strong>{{ latestEdit.title }}</strong><p>{{ statusText[latestEdit.status] || latestEdit.status }} · {{ priorityText[latestEdit.priority] || latestEdit.priority }} · {{ latestEdit.category || '未分类' }}</p><p>{{ latestEdit.note || '无备注' }}</p><el-button link type="primary" @click="reloadLatest">放弃草稿并载入最新</el-button><el-button v-if="editIssue === 'unknown' && sameVersion(editing?.version, latestEdit.editVersion)" link type="primary" @click="retryEdit">已核对，允许重试</el-button></template><p v-else>这条记录已不存在或不属于当前家庭。</p><el-button link type="danger" @click="discardEditDraft">放弃编辑草稿</el-button></div>
      </el-alert>
      <p v-if="editing" class="edit-hint">只修改想吃记录，不会改动已关联的菜谱、投票或排餐。</p>
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="想吃什么"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="比如：冬阴功火锅、楼下那家牛肉面" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="外食、家常、甜品、周末计划..." /></el-form-item>
        <el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="随缘" value="low" /><el-option label="普通" value="normal" /><el-option label="超想吃" value="high" /></el-select></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || !!editIssue || loading || !!loadError || !!actionIssue || !!actionId" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="linkDialog" title="关联已有菜谱" width="min(520px, 92vw)" :close-on-click-modal="!convertingId" :close-on-press-escape="!convertingId" :show-close="!convertingId">
      <p>为「{{ linkItem?.title }}」选择已有菜谱，不会创建新菜品。</p>
      <el-alert v-if="linkError" type="error" :closable="false" :title="linkError"><el-button link type="primary" @click="fetchLinkMeals">重试</el-button></el-alert>
      <el-select v-model="selectedMealId" filterable remote reserve-keyword :remote-method="searchLinkMeals" aria-label="搜索并选择菜谱" placeholder="搜索并选择菜谱" :loading="linkLoading" :disabled="!!convertingId" style="width:100%" @change="rememberLinkMeal"><el-option v-for="meal in linkOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select>
      <small v-if="!linkError && linkTotal > 50" class="search-hint">仅显示前 50 道，请输入菜名或食材缩小范围。</small>
      <template #footer><el-button :disabled="!!convertingId" @click="linkDialog = false">取消</el-button><el-button type="primary" :disabled="!selectedMealId || linkLoading || !!linkError || !!actionIssue" :loading="!!convertingId" @click="attachExisting(linkItem, selectedMealId)">确认关联</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.wishlist-page { --wish-accent: color-mix(in srgb, var(--secondary-color) 45%, #33211a); display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--wish-accent);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.page-header small { color: var(--text-secondary); }.page-header p { margin: 6px 0; }.pending-note { color:var(--text-primary) !important; font-size:13px; }
.board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.board.single-column { grid-template-columns: minmax(0, 1fr); }
.wish-filters { padding: 20px 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 20px; }
.filter-heading, .filter-controls { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; }
.filter-heading h2 { font-size: 18px; }
.filter-heading p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.filter-heading :deep(.el-input) { width: min(100%, 360px); }
.filter-controls { margin-top: 16px; }
.status-filters { display: flex; flex-wrap: wrap; gap: 8px; }
.status-filters button, .priority-filter select { min-height: 44px; padding: 8px 15px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); }
.status-filters button { cursor: pointer; }
.status-filters button.active { border: 2px solid var(--wish-accent); background: var(--bg-tertiary); font-weight: 700; }
.status-filters button:focus-visible, .priority-filter select:focus-visible { outline: 2px solid var(--wish-accent); outline-offset: 3px; }
.priority-filter { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-size: 13px; }
.hidden-pending { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; padding: 12px 16px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; }
.hidden-pending :deep(.el-button) { min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; }
.board-pagination { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 16px; color: var(--text-secondary); }
.board-pagination :deep(.el-button) { min-height: 44px; }
.status-column { background: var(--bg-primary); border-radius: 12px; padding: 14px; box-shadow: 0 2px 8px var(--shadow-color); display: flex; flex-direction: column; gap: 12px; }
.status-column h2 { display: flex; justify-content: space-between; font-size: 18px; }
.wish-card p { color: var(--text-secondary); }
.linked-meal { display: flex; flex-wrap: wrap; align-items: center; gap: 0 6px; color: var(--text-primary); font-size: 13px; overflow-wrap: anywhere; }
.linked-meal a { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }
.linked-meal a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.linked-meal small { color: var(--text-primary); font-size: 12px; }
.empty-column { color:var(--text-secondary); font-size:13px; margin:0; padding:12px 0; }
.wish-title, .vote-row, .actions { display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
.wish-title strong { overflow-wrap: anywhere; min-width: 0; }
.wish-title .el-tag { color: var(--text-primary); min-width: max-content; }
.actions { justify-content: flex-start; }
.actions .el-button + .el-button { margin-left: 0; }
.search-hint { display: block; margin-top: 8px; color: var(--text-secondary); line-height: 1.5; }
.edit-hint { color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.latest-summary { margin-top: 8px; padding: 12px; border-radius: 10px; background: var(--bg-primary); overflow-wrap: anywhere; }
.latest-summary p { margin: 6px 0; }
:global(html.dark .wishlist-page) { --wish-accent: var(--secondary-color); }
@media (max-width: 600px) { .wish-filters { padding: 18px; } .filter-heading { align-items: stretch; flex-direction: column; } .filter-heading :deep(.el-input) { width: 100%; } .filter-heading :deep(.el-input__wrapper) { min-height: 44px; } }
@media (max-width: 900px) { .board { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: stretch; } }
</style>
