<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { Plus, Delete, ShoppingCart } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { validWeekLink } from '@/utils/weekLink.mjs';

const route = useRoute();
const router = useRouter();
const weekLinkNotice = ref('');
const loading = ref(true);
const working = ref(false);
const loadError = ref('');
const list = ref({ items: [] });
const weekStart = ref('');
const weekChoice = ref('');
const changingWeek = ref(false);
const mutationIssue = ref('');
const generationNotice = ref('');
const generationDates = ref([]);
let loadSequence = 0;
let active = true;
const form = reactive({ name: '', amount: '', category: 'other' });
const editingItem = ref(null);
const editForm = reactive({ name: '', amount: '', category: 'other', markPending: false });
const editInitial = ref('');
const search = ref('');
const statusFilter = ref('all');
const quantityOnly = ref(false);
const groupGrid = ref(null);
const filterGroup = ref(null);
const searchInput = ref(null);
const addNameInput = ref(null);
const focusAddItem = () => addNameInput.value?.focus();
const categoryText = { vegetable: '蔬菜', meat_egg: '肉蛋', staple: '主食', seasoning: '调料', other: '其他' };
const categoryKey = item => Object.prototype.hasOwnProperty.call(categoryText, item.category) ? item.category : 'other';
const monday = value => { const d = value ? new Date(...value.split('-').map((part, index) => index === 1 ? Number(part) - 1 : Number(part))) : new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const thisWeek = ref(monday());
let weekClockTimer = null;
const refreshCurrentWeek = () => { thisWeek.value = monday(); };
const shiftedWeek = (value, offset) => { const [year, month, day] = monday(value).split('-').map(Number); const date = new Date(year, month - 1, day + offset * 7); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const weekRange = computed(() => { if (!weekStart.value) return ''; const [year, month, day] = monday(weekStart.value).split('-').map(Number); const end = new Date(year, month - 1, day + 6); return `${monday(weekStart.value)} — ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`; });
const generationTime = computed(() => {
  if (!weekStart.value || typeof list.value.generatedFrom !== 'string') return '';
  const match = /^week:(\d{4}-\d{2}-\d{2}):(\d+)$/.exec(list.value.generatedFrom);
  if (!match || match[1] !== monday(weekStart.value)) return '';
  const milliseconds = Number(match[2]);
  if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) return '';
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime())) return '';
  const pad = value => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
});
const purchased = computed(() => (list.value.items || []).filter(item => item.checked).length);
const pendingItems = computed(() => (list.value.items || []).filter(item => !item.checked));
const copyingList = ref(false);
const copyDialogVisible = ref(false);
const copiedSnapshot = ref('');
const snapshotInput = ref(null);
const needsQuantityReview = item => !item.manual && item.quantityComplete === false;
const copyPendingList = async () => {
  if (copyingList.value || loading.value || working.value || changingWeek.value || loadError.value || mutationIssue.value || !pendingItems.value.length) return;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
  const items = [...pendingItems.value];
  const sections = Object.keys(categoryText).map(key => {
    const rows = items.filter(item => categoryKey(item) === key);
    if (!rows.length) return '';
    return [`【${categoryText[key]}】`, ...rows.map(item => `- ${clean(item.name)}${clean(item.amount) ? `：${clean(item.amount)}` : ''}${needsQuantityReview(item) ? '（用量待核对）' : ''}`)].join('\n');
  }).filter(Boolean);
  const text = [`购物清单 · ${weekRange.value}`, `全部待买 ${items.length} 项（当前页面快照，不含未保存输入）`, ...sections].join('\n\n');
  copyingList.value = true;
  try { await navigator.clipboard.writeText(text); if (active) ElMessage.success('已复制所选周全部待买项；其他成员的最新修改请重新核对'); }
  catch (_) { if (active) { copiedSnapshot.value = text; copyDialogVisible.value = true; } }
  finally { copyingList.value = false; }
};
const selectSnapshot = () => { const input = snapshotInput.value?.textarea; if (input) { input.focus(); input.select(); } };
const quantityReviewCount = computed(() => (list.value.items || []).filter(needsQuantityReview).length);
const filtersActive = computed(() => !!search.value.trim() || statusFilter.value !== 'all' || quantityOnly.value);
const filteredItems = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return (list.value.items || []).filter(item => {
    if (statusFilter.value === 'pending' && item.checked) return false;
    if (statusFilter.value === 'purchased' && !item.checked) return false;
    if (quantityOnly.value && !needsQuantityReview(item)) return false;
    return !query || [item.name, item.amount, categoryText[categoryKey(item)]].some(value => String(value || '').toLocaleLowerCase().includes(query));
  });
});
const groups = computed(() => Object.keys(categoryText).map(key => ({ key, label: categoryText[key], items: filteredItems.value.filter(item => categoryKey(item) === key) })).filter(group => group.items.length));
const resetFilters = async () => { search.value = ''; statusFilter.value = 'all'; quantityOnly.value = false; await nextTick(); searchInput.value?.focus(); };
const editDirty = computed(() => !!editingItem.value && JSON.stringify(editForm) !== editInitial.value);
const editLatest = computed(() => editingItem.value ? (list.value.items || []).find(item => item._id === editingItem.value.id) : null);
const editSourceMeals = computed(() => {
  const ids = Array.isArray(editLatest.value?.sourceMealIds) ? editLatest.value.sourceMealIds : [];
  return [...new Set(ids.map(value => typeof value === 'string' ? value.toLowerCase() : '').filter(value => /^[a-f\d]{24}$/.test(value)))];
});
const sourceNames = ref({});
const sourceLoading = ref(false);
const sourceError = ref(false);
const sourceRetryButton = ref(null);
let sourceSequence = 0;
const loadSourceNames = async () => {
  const sequence = ++sourceSequence;
  const ids = [...editSourceMeals.value];
  const restoreFocus = document.activeElement === sourceRetryButton.value;
  sourceNames.value = {};
  if (!restoreFocus) sourceError.value = false;
  if (!editingItem.value || !ids.length) { sourceLoading.value = false; sourceError.value = false; return; }
  sourceLoading.value = true;
  let failed = false;
  try {
    for (let offset = 0; offset < ids.length; offset += 6) {
      const batch = ids.slice(offset, offset + 6);
      const results = await Promise.allSettled(batch.map(id => api.meal.getMealById(id, { suppressErrorToast: true })));
      if (sequence !== sourceSequence) return;
      const names = { ...sourceNames.value };
      results.forEach((result, index) => {
        const meal = result.status === 'fulfilled' ? result.value : null;
        if (!meal || String(meal._id || meal.id || '').toLowerCase() !== batch[index] || typeof meal.name !== 'string' || !meal.name.trim()) { failed = true; return; }
        names[batch[index]] = { name: meal.name.trim(), archived: meal.archived === true };
      });
      sourceNames.value = names;
    }
    sourceError.value = failed;
  } finally {
    if (sequence === sourceSequence) {
      sourceLoading.value = false;
      if (restoreFocus) {
        await nextTick();
        if (sequence === sourceSequence && (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected)) (sourceError.value ? sourceRetryButton.value : document.querySelector('.source-recipes a'))?.focus();
      }
    }
  }
};
watch(() => JSON.stringify([editingItem.value?.id || '', editSourceMeals.value]), loadSourceNames);
const draftDirty = computed(() => !!(form.name.trim() || form.amount.trim() || form.category !== 'other') || editDirty.value);
const uncertain = computed(() => !!mutationIssue.value);
const versionAvailable = computed(() => list.value.supportsConditionalUpdates === true && Number.isSafeInteger(list.value.listVersion) && list.value.listVersion >= 0);
const disabled = computed(() => loading.value || working.value || changingWeek.value || !!loadError.value || !!mutationIssue.value || !versionAvailable.value);
useDraftGuard({ dirty: draftDirty, busy: working, uncertain, label: '购物清单' });
const clearForm = () => { form.name = ''; form.amount = ''; form.category = 'other'; editingItem.value = null; editInitial.value = ''; };
const acceptList = (result, requestedWeek, previousVersion = null) => {
  if (!result || !Array.isArray(result.items) || result.weekStart !== monday(requestedWeek)) throw new Error('购物清单响应不完整');
  const ids = result.items.map(item => item?._id);
  if (result.items.some(item => typeof item?._id !== 'string' || !item._id || typeof item.name !== 'string' || typeof item.checked !== 'boolean') || new Set(ids).size !== ids.length) throw new Error('购物清单内容不完整');
  if (previousVersion !== null && (result.supportsConditionalUpdates !== true || !Number.isSafeInteger(result.listVersion) || result.listVersion <= previousVersion)) throw new Error('购物清单保存结果未确认');
  return result;
};
const load = async () => {
  if (!weekStart.value) return;
  const requestedWeek = weekStart.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  list.value = { items: [] };
  try {
    const result = await api.shoppingList.get(requestedWeek);
    if (sequence === loadSequence && weekStart.value === requestedWeek) { list.value = acceptList(result, requestedWeek); mutationIssue.value = ''; }
  } catch(e) {
    if (sequence === loadSequence && weekStart.value === requestedWeek) loadError.value = e?.error || e?.message || '加载购物清单失败';
  } finally {
    if (sequence === loadSequence) loading.value = false;
  }
};
const syncWeekUrl = () => { const week = monday(weekStart.value); if (route.name === 'shoppingList' && route.query.week !== week) void router.replace({ name: 'shoppingList', query: { week } }); };
const changeWeek = async (updateUrl = true) => {
  if (!weekChoice.value || changingWeek.value) return false;
  if (monday(weekChoice.value) === monday(weekStart.value)) { weekStart.value = weekChoice.value; weekLinkNotice.value = ''; if (updateUrl) syncWeekUrl(); return true; }
  changingWeek.value = true;
  try {
    if (draftDirty.value || mutationIssue.value) {
      try { await ElMessageBox.confirm('切换周会清除当前输入及未确认操作提示，请先核对。', '切换购物清单？', { type: 'warning', confirmButtonText: '切换并清除', cancelButtonText: '继续编辑' }); }
      catch (_) { weekChoice.value = weekStart.value; return false; }
    }
    clearForm(); mutationIssue.value = ''; generationNotice.value = ''; generationDates.value = []; weekStart.value = weekChoice.value; weekLinkNotice.value = ''; await load(); if (updateUrl) syncWeekUrl(); return true;
  } finally { changingWeek.value = false; }
};
const moveWeek = offset => { if (loading.value || working.value || changingWeek.value || !weekStart.value) return; weekChoice.value = shiftedWeek(weekStart.value, offset); changeWeek(); };
const returnToCurrentWeek = () => { if (!loading.value && !working.value && !changingWeek.value) { weekChoice.value = monday(); changeWeek(); } };
onBeforeRouteUpdate(async to => {
  if (to.name !== 'shoppingList' || to.query.week === route.query.week) return true;
  if (to.query.week !== undefined && !validWeekLink(to.query.week)) { ElMessage.warning('购物清单链接中的日期无效'); return false; }
  const next = to.query.week === undefined ? monday() : monday(to.query.week);
  if (next === monday(weekStart.value)) return true;
  if (loading.value || working.value || changingWeek.value) { ElMessage.warning('请先完成当前操作'); return false; }
  if (draftDirty.value || mutationIssue.value) {
    changingWeek.value = true;
    try { await ElMessageBox.confirm('切换周会清除当前输入及未确认操作提示，请先核对。', '切换购物清单？', { type: 'warning', confirmButtonText: '切换并清除', cancelButtonText: '继续编辑' }); }
    catch (_) { return false; } finally { changingWeek.value = false; }
  }
  return true;
});
watch(() => route.query.week, value => {
  if (route.name !== 'shoppingList' || (value !== undefined && !validWeekLink(value))) return;
  const next = value === undefined ? monday() : monday(value);
  if (next === monday(weekStart.value)) { weekLinkNotice.value = ''; return; }
  clearForm(); mutationIssue.value = ''; generationNotice.value = ''; generationDates.value = []; weekStart.value = next; weekChoice.value = next; weekLinkNotice.value = ''; load();
}, { flush: 'sync' });
const mutate = async (action, onSuccess, verify) => {
  const version = list.value.listVersion;
  const requestedWeek = weekStart.value;
  try {
    const result = await action(version, requestedWeek);
    const next = acceptList(result, requestedWeek, version);
    if (verify && !verify(next, requestedWeek)) throw new Error('购物清单保存结果未确认');
    list.value = next;
    if (onSuccess) onSuccess();
  } catch (e) {
    if (e?.code === 'SCHEDULE_MEAL_UNAVAILABLE') {
      generationDates.value = [...new Set((Array.isArray(e.unavailableDates) ? e.unavailableDates : []).filter(date => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date && monday(date) === monday(requestedWeek)))].sort();
      generationNotice.value = `${monday(requestedWeek) === thisWeek.value ? '本周' : '所选周'}排餐包含不可用的菜品，本次未生成购物清单，现有清单保持不变。请先在日历中核对相应餐次。`; return;
    }
    mutationIssue.value = e?.code === 'SHOPPING_LIST_CONFLICT'
      ? '其他成员更新了购物清单。请重新加载并核对，未提交的输入会保留。'
      : '操作结果未确认，请重新加载并核对后再操作；未提交的输入会保留。';
  }
};
const generate = async () => {
  if (!weekStart.value || disabled.value) return;
  generationNotice.value = '';
  generationDates.value = [];
  working.value = true;
  try {
    if ((list.value.items || []).some(item => !item.manual)) {
      try { await ElMessageBox.confirm('重新生成会替换排餐生成的食材，手动添加的食材会保留。食材用量和已购状态可能变化，请逐项核对实际需求。未填写用量或较早生成的项目可能重新标为待买。', '重新生成购物清单', { type: 'warning', confirmButtonText: '重新生成', cancelButtonText: '取消' }); } catch (_) { return; }
    }
    await mutate((version, week) => api.shoppingList.generate(week, version), () => ElMessage.success('已按所选周排餐生成购物清单'), (next, week) => typeof next.generatedFrom === 'string' && next.generatedFrom.startsWith(`week:${monday(week)}:`));
  } finally { working.value = false; }
};
const addItem = async () => {
  if (!form.name.trim()) return ElMessage.warning('请输入食材名称');
  if (!weekStart.value || disabled.value) return;
  const payload = { ...form, name: form.name.trim(), amount: form.amount.trim() };
  const matches = item => item.manual && item.name === payload.name && (item.amount || '') === payload.amount && item.category === payload.category;
  const priorCount = list.value.items.filter(matches).length;
  const origin = document.activeElement;
  const fromAddRow = !!origin?.closest?.('.add-row');
  let added = false;
  working.value = true;
  try {
    await mutate((version, week) => api.shoppingList.addItem({ ...payload, weekStart: week, expectedVersion: version }), () => {
      clearForm(); added = true;
      ElMessage.success(filtersActive.value ? '已添加食材；如未显示，可清除筛选查看' : '食材已添加');
    }, next => next.items.filter(matches).length > priorCount);
  } finally {
    working.value = false;
    if (added && fromAddRow) {
      await nextTick();
      const focused = document.activeElement;
      if (active && (!focused || focused === document.body || focused === origin || !focused.isConnected)) addNameInput.value?.focus();
    }
  }
};
const addItemOnEnter = event => {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  addItem();
};
const beginEdit = item => {
  if (disabled.value) return;
  editingItem.value = { id: item._id, manual: !!item.manual };
  Object.assign(editForm, { name: item.name, amount: item.amount || '', category: categoryKey(item), markPending: false });
  editInitial.value = JSON.stringify(editForm);
};
const closeEdit = async () => {
  if (working.value || loading.value) return;
  if (editDirty.value) {
    try { await ElMessageBox.confirm('修改尚未保存，关闭后会丢失。', '放弃食材修改？', { type: 'warning', confirmButtonText: '放弃修改', cancelButtonText: '继续编辑' }); } catch (_) { return; }
  }
  editingItem.value = null; editInitial.value = '';
};
const saveEdit = async () => {
  if (!editingItem.value || disabled.value) return;
  const name = editForm.name.trim();
  if (!name) return ElMessage.warning('请输入食材名称');
  const id = editingItem.value.id;
  if (!list.value.items.some(item => item._id === id)) return ElMessage.warning('该食材已不存在，请关闭编辑并核对清单');
  const fields = { name, amount: editForm.amount.trim(), category: editForm.category };
  const markPending = editLatest.value?.checked && editForm.markPending;
  const expectedChecked = markPending ? false : editLatest.value.checked;
  working.value = true;
  try {
    await mutate((version, week) => api.shoppingList.updateItem(id, { ...fields, ...(markPending ? { checked: false } : {}), weekStart: week, expectedVersion: version }), () => {
      editingItem.value = null; editInitial.value = '';
      ElMessage.success(filtersActive.value ? '食材已更新；如未显示，可清除筛选查看' : '食材已更新');
    }, next => next.items.some(item => item._id === id && item.name === fields.name && (item.amount || '') === fields.amount && item.category === fields.category && item.checked === expectedChecked));
  } finally { working.value = false; }
};
const saveEditOnEnter = event => { if (event.isComposing || event.keyCode === 229) return; event.preventDefault(); saveEdit(); };
const toggle = async item => {
  if (disabled.value) return;
  const hadFocus = document.activeElement?.closest('.item-row')?.dataset.itemId === String(item._id);
  const checked = !item.checked;
  working.value = true;
  try { await mutate((version, week) => api.shoppingList.updateItem(item._id, { weekStart: week, checked, expectedVersion: version }), null, next => next.items.some(row => row._id === item._id && row.checked === checked)); }
  finally { working.value = false; }
  if (hadFocus && !filteredItems.value.some(row => row._id === item._id)) {
    await nextTick();
    if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) (groupGrid.value?.querySelector('input[type="checkbox"]:not(:disabled)') || filterGroup.value?.querySelector('button[aria-pressed="true"]'))?.focus();
  }
};
const remove = async item => {
  if (disabled.value) return;
  const hadFocus = document.activeElement?.closest('.item-row')?.dataset.itemId === String(item._id);
  const requestedWeek = weekStart.value;
  let closingDialog = null;
  working.value = true;
  try {
    try { await ElMessageBox.confirm(`确定从所选周购物清单中删除“${item.name}”吗？${item.manual ? '' : '若排餐仍包含此食材，重新生成时可能再次出现。'}`, '删除食材', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); } catch (_) { return; }
    closingDialog = document.activeElement?.closest('.el-message-box');
    await mutate((version, week) => api.shoppingList.deleteItem(item._id, week, version), null, next => next.items.every(row => row._id !== item._id));
  } finally { working.value = false; }
  if (hadFocus && !list.value.items.some(row => row._id === item._id)) {
    setTimeout(() => {
      if (weekStart.value !== requestedWeek || disabled.value) return;
      const active = document.activeElement;
      if (!active || active === document.body || !active.isConnected || closingDialog?.contains(active)) (groupGrid.value?.querySelector('input[type="checkbox"]:not(:disabled)') || searchInput.value?.input || addNameInput.value?.input)?.focus();
    }, 350);
  }
};
const clearPurchased = async () => { if (!purchased.value || disabled.value) return; working.value = true; try { try { await ElMessageBox.confirm(`将删除 ${purchased.value} 项已购食材。${filtersActive.value ? '此操作作用于所选周全部已购食材，包括筛选后未显示的项目。' : ''}`, '清空已购', { type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消' }); } catch (_) { return; } await mutate((version, week) => api.shoppingList.clearPurchased(week, version), () => ElMessage.success('已清空已购'), next => next.items.every(item => !item.checked)); } finally { working.value = false; } };
onMounted(() => { const linked = route.query.week; weekStart.value = validWeekLink(linked) ? monday(linked) : monday(); if (linked !== undefined && !validWeekLink(linked)) weekLinkNotice.value = '购物清单链接中的日期无效，已打开本周。'; weekChoice.value = weekStart.value; load(); window.addEventListener('focus', refreshCurrentWeek); document.addEventListener('visibilitychange', refreshCurrentWeek); weekClockTimer = setInterval(refreshCurrentWeek, 60000); });
onBeforeUnmount(() => { active = false; loadSequence++; sourceSequence++; window.removeEventListener('focus', refreshCurrentWeek); document.removeEventListener('visibilitychange', refreshCurrentWeek); if (weekClockTimer) clearInterval(weekClockTimer); });
</script>

<template>
  <div class="shopping-page" v-loading="loading" element-loading-text="正在加载购物清单" :aria-busy="loading ? 'true' : 'false'">
    <div class="page-header"><div><span class="eyebrow">SHOPPING LIST · 一周采购</span><h1>好好买菜，轻松做饭</h1><p>从排餐汇总食材，也可以补充自己需要的东西。</p><small v-if="list.weekStart">{{ list.weekStart }} 开始的一周 · {{ weekRange }}</small></div><div class="actions"><el-date-picker v-model="weekChoice" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled="loading || working || changingWeek" aria-label="选择购物清单日期" @change="changeWeek" /><div class="week-navigation" role="group" aria-label="切换购物清单日期"><el-button :disabled="loading || working || changingWeek" @click="moveWeek(-1)">上一周</el-button><el-button :disabled="loading || working || changingWeek || monday(weekStart) === thisWeek" @click="returnToCurrentWeek">回到本周</el-button><el-button :disabled="loading || working || changingWeek" @click="moveWeek(1)">下一周</el-button></div><el-button type="primary" :disabled="disabled" @click="generate"><el-icon><ShoppingCart /></el-icon>从排餐生成</el-button><el-button :disabled="!purchased || disabled" @click="clearPurchased">清空已购</el-button></div></div>
    <el-alert v-if="weekLinkNotice" type="warning" :closable="false" show-icon :title="weekLinkNotice" />
    <router-link v-if="weekStart" class="week-link" :to="{ name: 'weeklyPlan', query: { week: monday(weekStart) } }">查看所选周计划 →</router-link>
    <div v-if="!loading && !loadError" class="generation-context"><strong>{{ generationTime ? `最近从排餐生成：${generationTime}（本机时间）` : '暂无可识别的排餐生成时间' }}</strong><p>排餐变动不会自动更新清单；请按需重新生成并核对食材。</p></div>
    <div v-if="loadError" class="load-error" role="alert">{{ loadError }} <el-button link type="primary" @click="load">重试</el-button></div>
    <template v-else>
    <el-alert v-if="mutationIssue" type="warning" :closable="false" show-icon :title="mutationIssue"><el-button link type="primary" :disabled="loading || working" @click="load">重新加载并核对</el-button></el-alert>
    <el-alert v-else-if="!loading && !versionAvailable" type="warning" :closable="false" show-icon title="服务器未提供安全版本信息，购物清单暂时只能查看。" />
    <el-alert v-if="generationNotice" class="generation-alert" type="warning" :closable="false" show-icon :title="generationNotice"><p v-if="generationDates.length">需核对的日期：{{ generationDates.join('、') }}。</p><p v-else>{{ monday(weekStart) === thisWeek ? '本周' : '所选周' }}可能跨月，请核对整周的安排。</p><router-link class="calendar-link" :to="{ name: 'calendar', query: { date: generationDates[0] || monday(weekStart) } }">前往日历核对</router-link><el-button link @click="generationNotice = ''; generationDates = []">关闭提示</el-button><nav v-if="generationDates.length > 1" class="affected-dates" aria-label="按日期核对购物清单"><span>逐日核对：</span><router-link v-for="date in generationDates" :key="date" :to="{ name: 'calendar', query: { date } }" :aria-label="`查看 ${date} 的排餐`">{{ date }}</router-link></nav></el-alert>
    <div v-if="loading" class="progress-loading" role="status">正在读取所选周采购进度…</div>
    <div v-else class="progress-card"><div><span>采购进度</span><strong>{{ purchased }} / {{ list.items?.length || 0 }}</strong><small>项已买好</small></div><el-progress :percentage="list.items?.length ? Math.round(purchased / list.items.length * 100) : 0" :show-text="false" /></div>
    <section v-if="!loading && list.items?.length" class="list-tools" aria-label="查找购物食材">
      <div class="list-heading"><div><h2>食材清单</h2><p aria-live="polite">显示 {{ filteredItems.length }} / {{ list.items.length }} 项 · {{ monday(weekStart) === thisWeek ? '本周' : '所选周' }}待买 {{ list.items.length - purchased }} 项</p><el-button link type="primary" :disabled="disabled" @click="focusAddItem">添加新食材 ↓</el-button></div><el-input ref="searchInput" v-model="search" clearable placeholder="搜索食材、数量或分类" aria-label="搜索购物食材" /></div>
      <div class="copy-tools"><el-button :loading="copyingList" :disabled="loading || working || changingWeek || !!loadError || !!mutationIssue || !pendingItems.length" @click="copyPendingList">复制全部待买项</el-button><p>不受筛选影响；复制当前已加载的清单，不含未保存输入。其他成员的更新请先重新核对。</p></div>
      <div ref="filterGroup" class="filter-buttons" role="group" aria-label="按购买状态筛选"><button v-for="option in [{ value: 'all', label: '全部', count: list.items.length }, { value: 'pending', label: '待买', count: pendingItems.length }, { value: 'purchased', label: '已买', count: purchased }]" :key="option.value" type="button" :class="{ active: statusFilter === option.value }" :aria-label="option.label" :aria-description="`所选周${option.label} ${option.count} 项，不受其他筛选影响`" :aria-pressed="statusFilter === option.value" @click="statusFilter = option.value">{{ option.label }} <span aria-hidden="true">{{ option.count }}</span></button></div>
      <p class="filter-count-note">数量为所选周全部食材，不受搜索或其他筛选影响。</p>
      <div class="filter-buttons"><button type="button" :class="{ active: quantityOnly }" :aria-pressed="quantityOnly" @click="quantityOnly = !quantityOnly">仅看用量待核对（{{ quantityReviewCount }}）</button></div>
      <button v-if="filtersActive && filteredItems.length" type="button" class="filter-reset" @click="resetFilters">清除筛选</button>
    </section>
    <el-empty v-if="!loading && !list.items?.length" description="还没有购物项，先从排餐生成或手动添加" />
    <el-empty v-else-if="!loading && !filteredItems.length" description="没有符合条件的食材"><el-button @click="resetFilters">清除筛选</el-button></el-empty>
    <section v-else ref="groupGrid" class="group-grid"><el-card v-for="group in groups" :key="group.key"><template #header><div class="group-heading"><strong>{{ group.label }}</strong><span>{{ group.items.length }} 项</span></div></template><div v-for="item in group.items" :key="item._id" class="item-row" :data-item-id="item._id" :class="{ checked: item.checked }"><el-checkbox :model-value="item.checked" :disabled="disabled" @change="() => toggle(item)"><strong>{{ item.name }}</strong><span>{{ item.amount }}</span><span v-if="!item.manual && item.quantityComplete === false" class="quantity-notice">用量待核对</span></el-checkbox><div class="item-actions"><el-tag size="small" :type="item.manual ? 'warning' : 'info'">{{ item.manual ? '手动' : '排餐' }}</el-tag><el-button link :disabled="disabled" :aria-label="`编辑${item.name}`" @click="beginEdit(item)">编辑</el-button><el-button type="danger" link :disabled="disabled" :aria-label="`删除${item.name}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div></el-card></section>
    <el-card><template #header><strong>添加食材</strong></template><div class="add-row"><el-input ref="addNameInput" v-model="form.name" placeholder="食材名称" aria-label="食材名称" :disabled="disabled" @keydown.enter="addItemOnEnter" /><el-input v-model="form.amount" placeholder="数量/备注" aria-label="数量或备注" :disabled="disabled" @keydown.enter="addItemOnEnter" /><el-select v-model="form.category" aria-label="食材分类" :disabled="disabled"><el-option v-for="(label,key) in categoryText" :key="key" :label="label" :value="key" /></el-select><el-button type="primary" :disabled="disabled" @click="addItem"><el-icon><Plus /></el-icon>添加食材</el-button></div></el-card>
    </template>
    <el-dialog v-model="copyDialogVisible" title="手动复制待买清单" width="min(560px, 92vw)"><p class="copy-help">浏览器未允许自动复制。以下是点击时的快照；清单之后的变化不会自动更新。</p><el-input ref="snapshotInput" :model-value="copiedSnapshot" type="textarea" :rows="10" readonly aria-label="待买清单快照" /><template #footer><el-button @click="selectSnapshot">全选内容</el-button><el-button type="primary" @click="copyDialogVisible = false">完成</el-button></template></el-dialog>
    <el-dialog :model-value="!!editingItem" title="编辑购物食材" width="min(520px, 92vw)" :close-on-click-modal="false" :before-close="closeEdit">
      <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法核对购物清单：${loadError}`"><el-button link type="primary" :disabled="loading || working" @click="load">重试</el-button></el-alert>
      <el-alert v-if="mutationIssue" type="warning" :closable="false" show-icon :title="mutationIssue"><el-button link type="primary" :disabled="loading || working" @click="load">重新加载并核对</el-button></el-alert>
      <div v-if="!loading && !loadError && editLatest" class="edit-current"><strong>清单当前内容</strong><p>{{ editLatest.name }} · {{ editLatest.amount || '未填写数量' }} · {{ categoryText[categoryKey(editLatest)] }} · {{ editLatest.checked ? '已买' : '待买' }}</p></div>
      <el-alert v-else-if="!loading && !loadError && editingItem" type="warning" :closable="false" show-icon title="该食材已不在当前清单中，请关闭编辑并核对。" />
      <p v-if="editingItem && !editingItem.manual" class="edit-note">这项来自排餐；重新生成清单时，名称和数量可能被排餐数据覆盖，已购状态也可能变化。清单中的修改不会改变菜谱；用量待核对的提示需在菜谱中补全后重新生成才会更新。</p>
      <div v-if="editingItem && !editingItem.manual && !loading && !loadError" class="source-recipes">
        <strong>来源菜谱</strong>
        <p v-if="!editSourceMeals.length">没有可用的来源菜谱信息，请从菜谱列表查找。</p>
        <template v-else><p>来源菜谱可能已修改或不可用，请打开后核对食材。</p><p v-if="sourceLoading" role="status">正在读取来源菜谱名称…</p><p v-if="sourceError" role="status">部分菜谱名称暂不可用，仍可打开核对。 <button ref="sourceRetryButton" type="button" :disabled="sourceLoading" @click="loadSourceNames">{{ sourceLoading ? '正在重试' : '重试名称' }}</button></p><nav aria-label="购物食材的来源菜谱"><router-link v-for="(id, index) in editSourceMeals" :key="id" :to="{ name: 'MealDetail', params: { id }, query: { shoppingWeek: monday(weekStart) } }" :aria-label="sourceNames[id] ? `查看来源菜谱：${sourceNames[id].name}` : `查看来源菜谱 ${index + 1}`">{{ sourceNames[id] ? sourceNames[id].name : `来源菜谱 ${index + 1}` }}{{ sourceNames[id]?.archived ? '（已归档）' : '' }} →</router-link></nav></template>
      </div>
      <el-form label-position="top" :disabled="disabled">
        <el-form-item label="食材名称"><el-input v-model="editForm.name" aria-label="编辑食材名称" maxlength="100" @keydown.enter="saveEditOnEnter" /></el-form-item>
        <el-form-item label="数量或备注"><el-input v-model="editForm.amount" aria-label="编辑数量或备注" maxlength="200" @keydown.enter="saveEditOnEnter" /></el-form-item>
        <el-form-item label="分类"><el-select v-model="editForm.category" aria-label="编辑食材分类"><el-option v-for="(label,key) in categoryText" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item v-if="editLatest?.checked"><el-checkbox v-model="editForm.markPending">保存后将此项改为待买</el-checkbox><small class="edit-note">不勾选则保留已买状态。</small></el-form-item>
      </el-form>
      <template #footer><el-button :disabled="working || loading" @click="closeEdit">取消</el-button><el-button type="primary" :loading="working" :disabled="disabled || !editLatest" @click="saveEdit">保存修改</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.shopping-page { --shopping-accent: color-mix(in srgb, var(--secondary-color) 45%, #33211a); display: flex; flex-direction: column; gap: 18px; }.page-header{display:flex;justify-content:space-between;gap:20px;align-items:center;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:26px;padding:clamp(22px,3vw,36px);box-shadow:0 12px 28px var(--shadow-color)}h1{margin:8px 0;font-family:Georgia,'Songti SC',serif;font-size:clamp(26px,3vw,36px);color:var(--text-primary)}.eyebrow{color:var(--shopping-accent);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.page-header small{color:var(--text-secondary)}.actions,.add-row{display:flex;gap:10px;flex-wrap:wrap}.actions .el-button,.add-row .el-button{margin:0}.add-row .el-input{flex:1;min-width:160px}.progress-card{display:flex;align-items:center;gap:24px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:20px;padding:18px 24px}.progress-card>div:first-child{display:flex;align-items:baseline;gap:8px;white-space:nowrap;color:var(--text-secondary)}.progress-card strong{color:var(--shopping-accent);font-size:26px}.progress-card .el-progress{flex:1}.load-error{padding:18px;border:1px solid var(--border-color);border-radius:18px;background:var(--bg-primary);color:var(--text-secondary)}.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px}.item-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)}.item-row :deep(.el-checkbox){height:auto;min-width:0;flex:1}.item-row :deep(.el-checkbox__label){white-space:normal;overflow-wrap:anywhere}.item-row.checked :deep(.el-checkbox__label){color:var(--text-secondary);text-decoration:line-through}.item-row :deep(.el-checkbox__label span){margin-left:8px;color:var(--text-secondary)}.item-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.item-actions .el-button{min-width:44px;min-height:44px}@media(max-width:720px){.page-header{flex-direction:column;align-items:stretch}.add-row{flex-direction:column}.add-row :deep(.el-input__wrapper),.add-row :deep(.el-select__wrapper),.add-row .el-button,.actions .el-button{min-height:44px}.progress-card{align-items:stretch;flex-direction:column;gap:12px}.group-grid{grid-template-columns:1fr}}
.list-tools { padding: 20px 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 20px; }
.copy-tools { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 14px; margin: 12px 0; }
.copy-tools .el-button { min-height: 44px; margin: 0; }
.copy-tools p, .copy-help { margin: 0; color: var(--text-primary); font-size: 13px; line-height: 1.6; }
.progress-loading { padding: 18px 24px; border: 1px solid var(--border-color); border-radius: 20px; background: var(--bg-secondary); color: var(--text-primary); }
.filter-reset { min-height: 44px; margin-top: 8px; padding: 6px 0; border: 0; background: transparent; color: var(--text-primary); font: inherit; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }
.filter-reset:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.generation-context { padding: 14px 20px; border: 1px solid var(--border-color); border-radius: 16px; background: var(--bg-primary); color: var(--text-primary); font-size: 13px; }
.generation-context p { margin: 5px 0 0; color: var(--text-secondary); line-height: 1.6; }
.edit-note { color: var(--text-primary); line-height: 1.6; font-size: 13px; }
.edit-current { padding: 12px 14px; border: 1px solid var(--border-color); border-radius: 12px; background: var(--bg-secondary); color: var(--text-primary); overflow-wrap: anywhere; font-size: 13px; }
.edit-current p { margin: 6px 0 0; line-height: 1.6; }
.source-recipes { margin: 12px 0; color: var(--text-primary); font-size: 13px; }
.source-recipes p { margin: 6px 0; line-height: 1.6; }
.source-recipes button { min-height: 44px; padding: 4px 6px; border: 0; background: none; color: var(--text-primary); font: inherit; font-weight: 700; text-decoration: underline; cursor: pointer; }
.source-recipes button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.source-recipes nav { display: flex; flex-wrap: wrap; gap: 0 16px; }
.source-recipes a { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.source-recipes a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.item-row :deep(.el-checkbox__label .quantity-notice) { display: inline-block; color: var(--text-primary); font-size: 12px; font-weight: 700; text-decoration: underline; text-underline-offset: 2px; }
.week-navigation { display: flex; flex-wrap: wrap; gap: 6px; }.week-navigation .el-button { min-height: 44px; margin: 0; }
.week-link { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }.week-link:focus-visible { outline: 3px solid var(--secondary-color); outline-offset: 3px; }
.list-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.list-heading h2 { margin: 0; font-size: 18px; color: var(--text-primary); }
.list-heading p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.list-heading :deep(.el-input) { width: min(100%, 320px); }
.filter-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.filter-count-note { margin: 8px 0 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }
.filter-buttons button { min-height: 44px; padding: 8px 18px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; }
.filter-buttons button.active { border: 2px solid var(--shopping-accent); background: var(--bg-tertiary); font-weight: 700; }
.filter-buttons button:focus-visible { outline: 2px solid var(--shopping-accent); outline-offset: 3px; }
.group-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--text-primary); }
.group-heading span { color: var(--text-secondary); font-size: 13px; }
.generation-alert { --notice-ink: #623a10; background: #fff1db; color: var(--notice-ink); }
.generation-alert :deep(.el-alert__title), .generation-alert :deep(.el-alert__description), .generation-alert :deep(.el-alert__icon), .generation-alert :deep(.el-button) { color: var(--notice-ink); }
.calendar-link { display: inline-flex; align-items: center; min-height: 44px; margin-right: 12px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.affected-dates { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; color: var(--notice-ink); }.affected-dates a { display: inline-flex; align-items: center; min-height: 44px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }.affected-dates a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
:global(html.dark) .generation-alert { --notice-ink: #ffe4bd; background: #543b29; }
:global(html.dark .shopping-page) { --shopping-accent: var(--secondary-color); }
@media (max-width: 720px) { .list-tools { padding: 18px; } .list-heading { align-items: stretch; flex-direction: column; } .list-heading :deep(.el-input) { width: 100%; } .list-heading :deep(.el-input__wrapper) { min-height: 44px; } }
</style>
