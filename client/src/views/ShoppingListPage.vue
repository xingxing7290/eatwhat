<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, ShoppingCart } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';

const loading = ref(false);
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
const form = reactive({ name: '', amount: '', category: 'other' });
const search = ref('');
const statusFilter = ref('all');
const groupGrid = ref(null);
const filterGroup = ref(null);
const categoryText = { vegetable: '蔬菜', meat_egg: '肉蛋', staple: '主食', seasoning: '调料', other: '其他' };
const categoryKey = item => Object.prototype.hasOwnProperty.call(categoryText, item.category) ? item.category : 'other';
const monday = value => { const d = value ? new Date(...value.split('-').map((part, index) => index === 1 ? Number(part) - 1 : Number(part))) : new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const thisWeek = ref(monday());
let weekClockTimer = null;
const refreshCurrentWeek = () => { thisWeek.value = monday(); };
const shiftedWeek = (value, offset) => { const [year, month, day] = monday(value).split('-').map(Number); const date = new Date(year, month - 1, day + offset * 7); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; };
const weekRange = computed(() => { if (!weekStart.value) return ''; const [year, month, day] = monday(weekStart.value).split('-').map(Number); const end = new Date(year, month - 1, day + 6); return `${monday(weekStart.value)} — ${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`; });
const purchased = computed(() => (list.value.items || []).filter(item => item.checked).length);
const filtersActive = computed(() => !!search.value.trim() || statusFilter.value !== 'all');
const filteredItems = computed(() => {
  const query = search.value.trim().toLocaleLowerCase();
  return (list.value.items || []).filter(item => {
    if (statusFilter.value === 'pending' && item.checked) return false;
    if (statusFilter.value === 'purchased' && !item.checked) return false;
    return !query || [item.name, item.amount, categoryText[categoryKey(item)]].some(value => String(value || '').toLocaleLowerCase().includes(query));
  });
});
const groups = computed(() => Object.keys(categoryText).map(key => ({ key, label: categoryText[key], items: filteredItems.value.filter(item => categoryKey(item) === key) })).filter(group => group.items.length));
const resetFilters = () => { search.value = ''; statusFilter.value = 'all'; };
const draftDirty = computed(() => !!(form.name.trim() || form.amount.trim() || form.category !== 'other'));
const uncertain = computed(() => !!mutationIssue.value);
const versionAvailable = computed(() => list.value.supportsConditionalUpdates === true && Number.isSafeInteger(list.value.listVersion) && list.value.listVersion >= 0);
const disabled = computed(() => loading.value || working.value || changingWeek.value || !!loadError.value || !!mutationIssue.value || !versionAvailable.value);
useDraftGuard({ dirty: draftDirty, busy: working, uncertain, label: '购物清单' });
const clearForm = () => { form.name = ''; form.amount = ''; form.category = 'other'; };
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
const changeWeek = async () => {
  if (!weekChoice.value || changingWeek.value) return;
  if (monday(weekChoice.value) === monday(weekStart.value)) { weekStart.value = weekChoice.value; return; }
  changingWeek.value = true;
  try {
    if (draftDirty.value || mutationIssue.value) {
      try { await ElMessageBox.confirm('切换周会清除当前输入及未确认操作提示，请先核对。', '切换购物清单？', { type: 'warning', confirmButtonText: '切换并清除', cancelButtonText: '继续编辑' }); }
      catch (_) { weekChoice.value = weekStart.value; return; }
    }
    clearForm(); mutationIssue.value = ''; generationNotice.value = ''; generationDates.value = []; weekStart.value = weekChoice.value; await load();
  } finally { changingWeek.value = false; }
};
const moveWeek = offset => { if (loading.value || working.value || changingWeek.value || !weekStart.value) return; weekChoice.value = shiftedWeek(weekStart.value, offset); changeWeek(); };
const returnToCurrentWeek = () => { if (!loading.value && !working.value && !changingWeek.value) { weekChoice.value = monday(); changeWeek(); } };
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
      try { await ElMessageBox.confirm('重新生成会替换排餐生成的食材，手动添加的食材会保留。', '重新生成购物清单', { type: 'warning', confirmButtonText: '重新生成', cancelButtonText: '取消' }); } catch (_) { return; }
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
  working.value = true;
  try { await mutate((version, week) => api.shoppingList.addItem({ ...payload, weekStart: week, expectedVersion: version }), () => { clearForm(); if (filtersActive.value) ElMessage.success('已添加食材；如未显示，可清除筛选查看'); }, next => next.items.filter(matches).length > priorCount); } finally { working.value = false; }
};
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
const remove = async item => { if (disabled.value) return; working.value = true; try { await mutate((version, week) => api.shoppingList.deleteItem(item._id, week, version), null, next => next.items.every(row => row._id !== item._id)); } finally { working.value = false; } };
const clearPurchased = async () => { if (!purchased.value || disabled.value) return; working.value = true; try { try { await ElMessageBox.confirm(`将删除 ${purchased.value} 项已购食材。${filtersActive.value ? '此操作作用于所选周全部已购食材，包括筛选后未显示的项目。' : ''}`, '清空已购', { type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消' }); } catch (_) { return; } await mutate((version, week) => api.shoppingList.clearPurchased(week, version), () => ElMessage.success('已清空已购'), next => next.items.every(item => !item.checked)); } finally { working.value = false; } };
onMounted(() => { weekStart.value = monday(); weekChoice.value = weekStart.value; load(); window.addEventListener('focus', refreshCurrentWeek); document.addEventListener('visibilitychange', refreshCurrentWeek); weekClockTimer = setInterval(refreshCurrentWeek, 60000); });
onBeforeUnmount(() => { loadSequence++; window.removeEventListener('focus', refreshCurrentWeek); document.removeEventListener('visibilitychange', refreshCurrentWeek); if (weekClockTimer) clearInterval(weekClockTimer); });
</script>

<template>
  <div class="shopping-page" v-loading="loading" element-loading-text="正在加载购物清单" :aria-busy="loading ? 'true' : 'false'">
    <div class="page-header"><div><span class="eyebrow">SHOPPING LIST · 一周采购</span><h1>好好买菜，轻松做饭</h1><p>从排餐汇总食材，也可以补充自己需要的东西。</p><small v-if="list.weekStart">{{ list.weekStart }} 开始的一周 · {{ weekRange }}</small></div><div class="actions"><el-date-picker v-model="weekChoice" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled="loading || working || changingWeek" aria-label="选择购物清单日期" @change="changeWeek" /><div class="week-navigation" role="group" aria-label="切换购物清单日期"><el-button :disabled="loading || working || changingWeek" @click="moveWeek(-1)">上一周</el-button><el-button :disabled="loading || working || changingWeek || monday(weekStart) === thisWeek" @click="returnToCurrentWeek">回到本周</el-button><el-button :disabled="loading || working || changingWeek" @click="moveWeek(1)">下一周</el-button></div><el-button type="primary" :disabled="disabled" @click="generate"><el-icon><ShoppingCart /></el-icon>从排餐生成</el-button><el-button :disabled="!purchased || disabled" @click="clearPurchased">清空已购</el-button></div></div>
    <div v-if="loadError" class="load-error" role="alert">{{ loadError }} <el-button link type="primary" @click="load">重试</el-button></div>
    <template v-else>
    <el-alert v-if="mutationIssue" type="warning" :closable="false" show-icon :title="mutationIssue"><el-button link type="primary" :disabled="loading || working" @click="load">重新加载并核对</el-button></el-alert>
    <el-alert v-else-if="!loading && !versionAvailable" type="warning" :closable="false" show-icon title="服务器未提供安全版本信息，购物清单暂时只能查看。" />
    <el-alert v-if="generationNotice" class="generation-alert" type="warning" :closable="false" show-icon :title="generationNotice"><p v-if="generationDates.length">需核对的日期：{{ generationDates.join('、') }}。</p><p v-else>{{ monday(weekStart) === thisWeek ? '本周' : '所选周' }}可能跨月，请核对整周的安排。</p><router-link class="calendar-link" :to="{ name: 'calendar', query: { date: generationDates[0] || monday(weekStart) } }">前往日历核对</router-link><el-button link @click="generationNotice = ''; generationDates = []">关闭提示</el-button></el-alert>
    <div class="progress-card"><div><span>采购进度</span><strong>{{ purchased }} / {{ list.items?.length || 0 }}</strong><small>项已买好</small></div><el-progress :percentage="list.items?.length ? Math.round(purchased / list.items.length * 100) : 0" :show-text="false" /></div>
    <el-card><div class="add-row"><el-input v-model="form.name" placeholder="食材名称" aria-label="食材名称" :disabled="disabled" @keyup.enter="addItem" /><el-input v-model="form.amount" placeholder="数量/备注" aria-label="数量或备注" :disabled="disabled" @keyup.enter="addItem" /><el-select v-model="form.category" aria-label="食材分类" :disabled="disabled"><el-option v-for="(label,key) in categoryText" :key="key" :label="label" :value="key" /></el-select><el-button type="primary" :disabled="disabled" @click="addItem"><el-icon><Plus /></el-icon>添加食材</el-button></div></el-card>
    <section v-if="!loading && list.items?.length" class="list-tools" aria-label="查找购物食材">
      <div class="list-heading"><div><h2>食材清单</h2><p aria-live="polite">显示 {{ filteredItems.length }} / {{ list.items.length }} 项 · {{ monday(weekStart) === thisWeek ? '本周' : '所选周' }}待买 {{ list.items.length - purchased }} 项</p></div><el-input v-model="search" clearable placeholder="搜索食材、数量或分类" aria-label="搜索购物食材" /></div>
      <div ref="filterGroup" class="filter-buttons" role="group" aria-label="按购买状态筛选"><button v-for="option in [{ value: 'all', label: '全部' }, { value: 'pending', label: '待买' }, { value: 'purchased', label: '已买' }]" :key="option.value" type="button" :class="{ active: statusFilter === option.value }" :aria-pressed="statusFilter === option.value" @click="statusFilter = option.value">{{ option.label }}</button></div>
    </section>
    <el-empty v-if="!loading && !list.items?.length" description="还没有购物项，先从排餐生成或手动添加" />
    <el-empty v-else-if="!loading && !filteredItems.length" description="没有符合条件的食材"><el-button @click="resetFilters">清除筛选</el-button></el-empty>
    <section v-else ref="groupGrid" class="group-grid"><el-card v-for="group in groups" :key="group.key"><template #header><div class="group-heading"><strong>{{ group.label }}</strong><span>{{ group.items.length }} 项</span></div></template><div v-for="item in group.items" :key="item._id" class="item-row" :data-item-id="item._id" :class="{ checked: item.checked }"><el-checkbox :model-value="item.checked" :disabled="disabled" @change="() => toggle(item)"><strong>{{ item.name }}</strong><span>{{ item.amount }}</span></el-checkbox><div class="item-actions"><el-tag size="small" :type="item.manual ? 'warning' : 'info'">{{ item.manual ? '手动' : '排餐' }}</el-tag><el-button type="danger" link :disabled="disabled" :aria-label="`删除${item.name}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div></el-card></section>
    </template>
  </div>
</template>

<style scoped>
.shopping-page { --shopping-accent: color-mix(in srgb, var(--secondary-color) 45%, #33211a); display: flex; flex-direction: column; gap: 18px; }.page-header{display:flex;justify-content:space-between;gap:20px;align-items:center;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:26px;padding:clamp(22px,3vw,36px);box-shadow:0 12px 28px var(--shadow-color)}h1{margin:8px 0;font-family:Georgia,'Songti SC',serif;font-size:clamp(26px,3vw,36px);color:var(--text-primary)}.eyebrow{color:var(--shopping-accent);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.page-header small{color:var(--text-secondary)}.actions,.add-row{display:flex;gap:10px;flex-wrap:wrap}.actions .el-button,.add-row .el-button{margin:0}.add-row .el-input{flex:1;min-width:160px}.progress-card{display:flex;align-items:center;gap:24px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:20px;padding:18px 24px}.progress-card>div:first-child{display:flex;align-items:baseline;gap:8px;white-space:nowrap;color:var(--text-secondary)}.progress-card strong{color:var(--shopping-accent);font-size:26px}.progress-card .el-progress{flex:1}.load-error{padding:18px;border:1px solid var(--border-color);border-radius:18px;background:var(--bg-primary);color:var(--text-secondary)}.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));gap:14px}.item-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)}.item-row :deep(.el-checkbox){height:auto;min-width:0;flex:1}.item-row :deep(.el-checkbox__label){white-space:normal;overflow-wrap:anywhere}.item-row.checked :deep(.el-checkbox__label){color:var(--text-secondary);text-decoration:line-through}.item-row :deep(.el-checkbox__label span){margin-left:8px;color:var(--text-secondary)}.item-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}.item-actions .el-button{min-width:44px;min-height:44px}@media(max-width:720px){.page-header{flex-direction:column;align-items:stretch}.add-row{flex-direction:column}.add-row :deep(.el-input__wrapper),.add-row :deep(.el-select__wrapper),.add-row .el-button,.actions .el-button{min-height:44px}.progress-card{align-items:stretch;flex-direction:column;gap:12px}.group-grid{grid-template-columns:1fr}}
.list-tools { padding: 20px 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 20px; }
.week-navigation { display: flex; flex-wrap: wrap; gap: 6px; }.week-navigation .el-button { min-height: 44px; margin: 0; }
.list-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.list-heading h2 { margin: 0; font-size: 18px; color: var(--text-primary); }
.list-heading p { margin: 5px 0 0; color: var(--text-secondary); font-size: 13px; }
.list-heading :deep(.el-input) { width: min(100%, 320px); }
.filter-buttons { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
.filter-buttons button { min-height: 44px; padding: 8px 18px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); cursor: pointer; }
.filter-buttons button.active { border: 2px solid var(--shopping-accent); background: var(--bg-tertiary); font-weight: 700; }
.filter-buttons button:focus-visible { outline: 2px solid var(--shopping-accent); outline-offset: 3px; }
.group-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--text-primary); }
.group-heading span { color: var(--text-secondary); font-size: 13px; }
.generation-alert { --notice-ink: #623a10; background: #fff1db; color: var(--notice-ink); }
.generation-alert :deep(.el-alert__title), .generation-alert :deep(.el-alert__description), .generation-alert :deep(.el-alert__icon), .generation-alert :deep(.el-button) { color: var(--notice-ink); }
.calendar-link { display: inline-flex; align-items: center; min-height: 44px; margin-right: 12px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
:global(html.dark) .generation-alert { --notice-ink: #ffe4bd; background: #543b29; }
:global(html.dark .shopping-page) { --shopping-accent: var(--secondary-color); }
@media (max-width: 720px) { .list-tools { padding: 18px; } .list-heading { align-items: stretch; flex-direction: column; } .list-heading :deep(.el-input) { width: 100%; } .list-heading :deep(.el-input__wrapper) { min-height: 44px; } }
</style>
