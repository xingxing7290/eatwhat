<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import WeeklyPlanMealPicker from '@/components/WeeklyPlanMealPicker.vue';
import { validWeekLink } from '@/utils/weekLink.mjs';

const route = useRoute();
const router = useRouter();
const weekLinkNotice = ref('');
const loading = ref(false);
const applying = ref(false);
const weekStart = ref('');
const weekChoice = ref('');
const changingWeek = ref(false);
const generating = ref(false);
const discarding = ref(false);
const rebasing = ref(false);
const current = ref(null);
const draft = ref(null);
const draftNeedsRebase = ref(false);
const draftHadUncertainApply = ref(false);
const slotEditor = ref(null);
const editedDates = ref([]);
const loadError = ref('');
const applyIssue = ref('');
let loadSequence = 0;
const mealTypes = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const draftDirty = computed(() => !!draft.value);
const busy = computed(() => applying.value || generating.value || changingWeek.value || discarding.value || rebasing.value);
const uncertain = computed(() => !!applyIssue.value);
useDraftGuard({ dirty: draftDirty, busy, uncertain, label: '周计划' });
const scheduledSlots = computed(() => (current.value?.days || []).reduce((total, day) => total + Object.keys(mealTypes).filter(type => day.meals?.[type]?.length).length, 0));
const displayedRange = computed(() => {
  const days = current.value?.days || [];
  return days.length ? `${days[0].date} — ${days[days.length - 1].date}` : '';
});
const versionsAvailable = computed(() => current.value?.supportsConditionalApply === true &&
  Array.isArray(current.value.days) && current.value.days.length === 7 &&
  current.value.days.every(day => typeof day.scheduleExists === 'boolean' &&
    (day.scheduleExists ? typeof day.scheduleVersion === 'string' && Number.isFinite(Date.parse(day.scheduleVersion)) : day.scheduleVersion === null)));
const dateKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const monday = value => {
  const d = value ? new Date(...value.split('-').map((part, index) => index === 1 ? Number(part) - 1 : Number(part))) : new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return dateKey(d);
};
const thisWeek = ref(monday());
const localToday = ref(dateKey(new Date()));
let weekClockTimer = null;
const refreshCurrentWeek = () => { const now = new Date(); thisWeek.value = monday(dateKey(now)); localToday.value = dateKey(now); };
const datesFor = value => {
  const [year, month, day] = monday(value).split('-').map(Number);
  return Array.from({ length: 7 }, (_, index) => dateKey(new Date(year, month - 1, day + index)));
};
const weekdayLabel = value => {
  const [year, month, day] = value.split('-').map(Number);
  return `周${['日', '一', '二', '三', '四', '五', '六'][new Date(year, month - 1, day).getDay()]}`;
};
const mealId = meal => meal?._id || meal?.id || '';
const recipeLinkId = item => {
  const meal = item && typeof item === 'object' && 'meal' in item ? item.meal : item;
  const id = mealId(meal);
  return typeof id === 'string' && /^[a-z\d_-]{1,128}$/i.test(id) && typeof meal?.name === 'string' && meal.name.trim() ? id : '';
};
const scheduleMealId = item => {
  const meal = item && typeof item === 'object' && 'meal' in item ? item.meal : item;
  return typeof meal === 'string' ? meal : mealId(meal);
};
const classifySlot = (before, after) => {
  const previous = before.map(item => String(scheduleMealId(item)));
  if (JSON.stringify(previous) === JSON.stringify(after)) return 'same';
  if (!previous.length) return 'added';
  if (!after.length) return 'cleared';
  return 'replaced';
};
const draftImpact = computed(() => {
  if (!draft.value || !current.value) return null;
  const impact = { added: 0, replaced: 0, cleared: 0, same: 0 };
  for (let index = 0; index < 7; index++) {
    const before = current.value.days[index]; const after = draft.value.days[index];
    for (const type of Object.keys(mealTypes)) {
      impact[classifySlot(before.meals[type], after.meals[type])]++;
    }
  }
  return impact;
});
const slotChange = (date, type) => {
  const before = current.value?.days.find(day => day.date === date);
  const after = draft.value?.days.find(day => day.date === date);
  if (!before || !after) return '';
  return { added: '新增', replaced: '将替换', cleared: '将清空', same: '' }[classifySlot(before.meals[type], after.meals[type])];
};
const validMeals = meals => meals && Object.keys(mealTypes).every(type => Array.isArray(meals[type]));
const hasReadableMeal = item => {
  const meal = item && typeof item === 'object' && 'meal' in item ? item.meal : item;
  return !!meal && typeof meal === 'object' && !!mealId(meal) && typeof meal.name === 'string' && !!meal.name.trim();
};
const unavailableMeal = item => !!item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'meal') && item.meal === null;
const unavailableCount = computed(() => (current.value?.days || []).reduce((total, day) => total + Object.keys(mealTypes).reduce((sum, type) => sum + (day.meals?.[type] || []).filter(unavailableMeal).length, 0), 0));
const unavailableDates = computed(() => (current.value?.days || []).filter(day => Object.keys(mealTypes).some(type => (day.meals?.[type] || []).some(unavailableMeal))).map(day => day.date));
const firstUnavailableDate = computed(() => unavailableDates.value[0] || weekStart.value);
const validateCurrent = (result, requestedWeek) => {
  const dates = datesFor(requestedWeek);
  if (!result || result.weekStart !== dates[0] || !Array.isArray(result.days) || result.days.length !== 7 ||
      result.days.some((day, index) => day?.date !== dates[index] || !validMeals(day.meals) ||
        Object.keys(mealTypes).some(type => day.meals[type].some(item => !hasReadableMeal(item) && !unavailableMeal(item)) || (day.scheduleExists === false && day.meals[type].length)))) throw new Error('日历安排不完整或与所选周不一致');
  return result;
};
const validateDraft = (result, requestedWeek) => {
  const dates = datesFor(requestedWeek);
  if (!result || result.weekStart !== dates[0] || !Array.isArray(result.days) || !Array.isArray(result.preview) || result.days.length !== 7 || result.preview.length !== 7) throw new Error('草稿不完整');
  for (let index = 0; index < dates.length; index++) {
    const day = result.days[index]; const preview = result.preview[index];
    if (day?.date !== dates[index] || preview?.date !== dates[index] || !validMeals(day.meals) || !validMeals(preview.meals)) throw new Error('草稿日期或餐次不完整');
    for (const type of Object.keys(mealTypes)) {
      const ids = day.meals[type]; const shown = preview.meals[type];
      if (ids.some(id => typeof id !== 'string' || !id) || shown.length !== ids.length || shown.some((meal, i) => String(mealId(meal)) !== ids[i] || typeof meal?.name !== 'string' || !meal.name.trim())) throw new Error('草稿预览与提交菜品不一致');
    }
  }
  return result;
};
const validateApplied = (result, expectedDays, requestedWeek) => {
  const dates = datesFor(requestedWeek);
  if (!result || result.weekStart !== dates[0] || result.applied !== 7 || !Array.isArray(result.days) || result.days.length !== 7) throw new Error('周计划写入结果不完整');
  for (let index = 0; index < dates.length; index++) {
    const day = result.days[index];
    if (day?.date !== dates[index] || !validMeals(day.meals) || !day.updatedAt || !Number.isFinite(Date.parse(day.updatedAt))) throw new Error('周计划写入结果不完整');
    for (const type of Object.keys(mealTypes)) {
      const actual = day.meals[type].map(scheduleMealId);
      const expected = expectedDays[index].meals[type];
      if (actual.length !== expected.length || actual.some((id, i) => String(id) !== expected[i])) throw new Error('写入结果与草稿不一致');
    }
  }
};
const editSlot = (date, type) => {
  if (!draft.value || draftNeedsRebase.value || busy.value || loading.value) return;
  const preview = draft.value.preview.find(day => day.date === date);
  if (!preview || !Array.isArray(preview.meals[type])) return;
  slotEditor.value = { date, type, meals: preview.meals[type].map(meal => ({ ...meal })) };
};
const saveSlot = meals => {
  const editor = slotEditor.value;
  if (!editor || !draft.value || !Array.isArray(meals)) return;
  const day = draft.value.days.find(item => item.date === editor.date);
  const preview = draft.value.preview.find(item => item.date === editor.date);
  const ids = meals.map(meal => String(mealId(meal)));
  if (!day || !preview || ids.some(id => !id) || new Set(ids).size !== ids.length || meals.some(meal => typeof meal.name !== 'string' || !meal.name.trim())) return ElMessage.error('菜品信息不完整，请重新选择');
  if (JSON.stringify(day.meals[editor.type]) !== JSON.stringify(ids)) {
    day.meals[editor.type] = ids;
    preview.meals[editor.type] = meals.map(meal => ({ ...meal }));
    preview.hints = [];
    if (!editedDates.value.includes(editor.date)) editedDates.value = [...editedDates.value, editor.date];
  }
  slotEditor.value = null;
};
const load = async () => {
  if (!weekStart.value) return;
  const requestedWeek = weekStart.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  current.value = null;
  try {
    const result = await api.weeklyPlan.get(requestedWeek);
    if (sequence === loadSequence && weekStart.value === requestedWeek) current.value = validateCurrent(result, requestedWeek);
  } catch (e) {
    if (sequence === loadSequence && weekStart.value === requestedWeek) loadError.value = e?.error || e?.message || '加载周计划失败';
  } finally { if (sequence === loadSequence) loading.value = false; }
};
const generate = async () => {
  if (!weekStart.value) return ElMessage.warning('请选择要安排的日期');
  if (loading.value || busy.value || loadError.value || applyIssue.value || !current.value) return;
  generating.value = true;
  try {
    if (draft.value) {
      try { await ElMessageBox.confirm('重新生成会替换当前尚未应用的草稿。', '重新生成草稿？', { type: 'warning', confirmButtonText: '重新生成', cancelButtonText: '保留草稿' }); } catch (_) { return; }
    }
    loading.value = true;
    const result = await api.weeklyPlan.generate(weekStart.value);
    draft.value = validateDraft(result, weekStart.value);
    draftNeedsRebase.value = false;
    draftHadUncertainApply.value = false;
    editedDates.value = [];
    ElMessage.success('已生成所选周的菜单草稿');
  } catch (e) { ElMessage.error(e?.error || e?.message || '生成失败'); }
  finally { loading.value = false; generating.value = false; }
};
const discardDraft = async () => {
  if (!draft.value || busy.value || loading.value || slotEditor.value) return;
  discarding.value = true;
  try {
    try { await ElMessageBox.confirm('放弃后，本次草稿和已调整的餐次会丢失；当前日历安排不会改变。', '放弃周计划草稿？', { type: 'warning', confirmButtonText: '放弃草稿', cancelButtonText: '继续编辑' }); } catch (_) { return; }
    draft.value = null; draftNeedsRebase.value = false; draftHadUncertainApply.value = false; editedDates.value = [];
    ElMessage.success('已放弃草稿，日历未改变');
  } finally { discarding.value = false; }
};
const applyDraft = async () => {
  if (!draft.value?.days?.length || draftNeedsRebase.value || loading.value || busy.value || loadError.value || applyIssue.value || !versionsAvailable.value || unavailableCount.value) return;
  const currentDates = current.value.days.map(day => day.date);
  try { validateDraft(draft.value, weekStart.value); } catch (error) { return ElMessage.error(error.message || '草稿不完整，请重新检查'); }
  if (draft.value.days.length !== 7 || draft.value.days.some((day, index) => day.date !== currentDates[index])) return ElMessage.error('草稿与当前周不一致，请重新生成');
  if (!draft.value.days.some(day => Object.values(day.meals || {}).some(items => items?.length))) return ElMessage.warning('草稿中没有菜品，请先添加菜谱');
  applying.value = true;
  try {
    try {
      const impact = draftImpact.value;
      await ElMessageBox.confirm(`应用草稿会替换这一周每天的早餐、午餐和晚餐，包括草稿中的空餐次。按当前读取的数据比较：新增 ${impact.added} 餐，替换 ${impact.replaced} 餐，清空 ${impact.cleared} 餐，菜品相同 ${impact.same} 餐。比较仅包含菜品及顺序；应用仍会写入所有七天，其他排餐信息也可能变化。`, '确认应用周计划', { type: 'warning', confirmButtonText: '确认替换', cancelButtonText: '再检查一下' });
    } catch (_) { return; }
    const expectedVersions = Object.fromEntries(current.value.days.map(day => [day.date, day.scheduleVersion]));
    const result = await api.weeklyPlan.apply(draft.value.days, expectedVersions);
    validateApplied(result, draft.value.days, weekStart.value);
    ElMessage.success('已应用到日历'); draft.value = null; draftNeedsRebase.value = false; draftHadUncertainApply.value = false; editedDates.value = []; applyIssue.value = ''; await load();
  }
  catch (e) {
    if (e?.code === 'WEEKLY_PLAN_INVALID' && Array.isArray(e.appliedDates) && e.appliedDates.length === 0) {
      ElMessage.warning('草稿已保留，请调整无效菜品或重新检查后重试。');
      return;
    }
    const applied = Array.isArray(e?.appliedDates) ? e.appliedDates : null;
    if (e?.code === 'WEEKLY_PLAN_CONFLICT' && applied) {
      applyIssue.value = `${e.conflictDate || '某天'}的安排已变化。${applied.length ? `已写入：${applied.join('、')}；其余日期未写入。` : '本次未写入任何日期。'}请核对最新日历后再处理草稿。`;
    } else {
      applyIssue.value = `${applied?.length ? `已确认写入：${applied.join('、')}。` : ''}${e?.uncertainDate ? `${e.uncertainDate} 的写入结果不确定。` : '可能有部分日期已写入。'}请核对最新日历后再处理草稿。`;
    }
    draftNeedsRebase.value = true;
    draftHadUncertainApply.value = true;
    await load();
  }
  finally { applying.value = false; }
};
const rebaseDraft = async () => {
  if (!draft.value || !draftNeedsRebase.value || applyIssue.value || loading.value || busy.value || loadError.value || !versionsAvailable.value || unavailableCount.value || !current.value || !draftImpact.value) return;
  rebasing.value = true;
  try {
    const oldDraft = draft.value;
    await load();
    if (draft.value !== oldDraft || loadError.value || !versionsAvailable.value || unavailableCount.value || !current.value || !draftImpact.value) return ElMessage.warning('无法安全读取最新日历，请核对后再试');
    const oldCurrent = current.value; const impact = { ...draftImpact.value };
    try { await ElMessageBox.confirm(`对照当前读取的日历：新增 ${impact.added} 餐、替换 ${impact.replaced} 餐、清空 ${impact.cleared} 餐、菜品相同 ${impact.same} 餐。先前请求仍可能稍后完成；本操作不会写入日历。继续后请逐餐核对，正式应用时仍会再次确认并检查版本。`, '基于最新日历继续草稿？', { type: 'warning', confirmButtonText: '继续核对草稿', cancelButtonText: '保持只读' }); } catch (_) { return; }
    if (draft.value !== oldDraft || current.value !== oldCurrent || applyIssue.value || !versionsAvailable.value || unavailableCount.value) return ElMessage.warning('日历或草稿已变化，请重新核对');
    draftNeedsRebase.value = false;
    ElMessage.success('草稿已保留，请逐餐核对后再决定是否应用');
  } finally { rebasing.value = false; }
};
const syncWeekUrl = () => { const week = monday(weekStart.value); if (route.name === 'weeklyPlan' && route.query.week !== week) void router.replace({ name: 'weeklyPlan', query: { week } }); };
const changeWeek = async (updateUrl = true) => {
  if (!weekChoice.value || changingWeek.value) return false;
  if (monday(weekChoice.value) === monday(weekStart.value)) { weekStart.value = weekChoice.value; weekLinkNotice.value = ''; if (updateUrl) syncWeekUrl(); return true; }
  changingWeek.value = true;
  try {
    if (draft.value || applyIssue.value) {
      try { await ElMessageBox.confirm('切换周会放弃当前草稿及未确认提示，请先核对。', '切换周计划？', { type: 'warning', confirmButtonText: '切换并放弃', cancelButtonText: '继续编辑' }); }
      catch (_) { weekChoice.value = weekStart.value; return false; }
    }
    draft.value = null; draftNeedsRebase.value = false; draftHadUncertainApply.value = false; editedDates.value = []; applyIssue.value = ''; weekStart.value = weekChoice.value; weekLinkNotice.value = ''; await load(); if (updateUrl) syncWeekUrl(); return true;
  } finally { changingWeek.value = false; }
};
const moveWeek = offset => {
  if (loading.value || busy.value || !weekStart.value) return;
  const [year, month, day] = monday(weekStart.value).split('-').map(Number);
  weekChoice.value = dateKey(new Date(year, month - 1, day + offset * 7));
  changeWeek();
};
const returnToCurrentWeek = () => { if (!loading.value && !busy.value) { weekChoice.value = monday(); changeWeek(); } };
onBeforeRouteUpdate(async to => {
  if (to.name !== 'weeklyPlan' || to.query.week === route.query.week) return true;
  if (to.query.week !== undefined && !validWeekLink(to.query.week)) { ElMessage.warning('周计划链接中的日期无效'); return false; }
  const next = to.query.week === undefined ? monday() : monday(to.query.week);
  if (next === monday(weekStart.value)) return true;
  if (loading.value || busy.value || slotEditor.value) { ElMessage.warning('请先完成当前操作'); return false; }
  if (draft.value || applyIssue.value) {
    changingWeek.value = true;
    try { await ElMessageBox.confirm('切换周会放弃当前草稿及未确认提示，请先核对。', '切换周计划？', { type: 'warning', confirmButtonText: '切换并放弃', cancelButtonText: '继续编辑' }); }
    catch (_) { return false; } finally { changingWeek.value = false; }
  }
  return true;
});
watch(() => route.query.week, value => {
  if (route.name !== 'weeklyPlan' || (value !== undefined && !validWeekLink(value))) return;
  const next = value === undefined ? monday() : monday(value);
  if (next === monday(weekStart.value)) { weekLinkNotice.value = ''; return; }
  draft.value = null; draftNeedsRebase.value = false; draftHadUncertainApply.value = false; editedDates.value = []; applyIssue.value = ''; weekStart.value = next; weekChoice.value = next; weekLinkNotice.value = ''; load();
}, { flush: 'sync' });
onMounted(() => { const linked = route.query.week; weekStart.value = validWeekLink(linked) ? monday(linked) : monday(); if (linked !== undefined && !validWeekLink(linked)) weekLinkNotice.value = '周计划链接中的日期无效，已打开本周。'; weekChoice.value = weekStart.value; load(); window.addEventListener('focus', refreshCurrentWeek); document.addEventListener('visibilitychange', refreshCurrentWeek); weekClockTimer = setInterval(refreshCurrentWeek, 60000); });
onBeforeUnmount(() => { loadSequence++; window.removeEventListener('focus', refreshCurrentWeek); document.removeEventListener('visibilitychange', refreshCurrentWeek); if (weekClockTimer) clearInterval(weekClockTimer); });
</script>

<template>
  <div class="weekly-page" v-loading="loading" element-loading-text="正在处理周计划" :aria-busy="loading ? 'true' : 'false'">
    <div class="page-header">
      <div><span class="eyebrow">WEEKLY TABLE · 一周饭桌</span><h1>一周饭桌计划</h1><p>选择一周内的任意日期，先生成草稿，再确认写入日历。</p><div v-if="displayedRange" class="week-summary"><span>{{ displayedRange }}</span><span>已安排 {{ scheduledSlots }} 餐</span></div><router-link v-if="current?.days.some(day => day.date === localToday)" class="today-link" :to="{ name: 'calendar', query: { date: localToday } }">本机今天 {{ localToday }} · 查看日历 →</router-link></div>
      <div class="actions"><el-date-picker v-model="weekChoice" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled="loading || busy" aria-label="选择周计划日期" @change="changeWeek" /><div class="week-navigation" role="group" aria-label="切换周计划日期"><el-button :disabled="loading || busy" @click="moveWeek(-1)">上一周</el-button><el-button :disabled="loading || busy || monday(weekStart) === thisWeek" @click="returnToCurrentWeek">回到本周</el-button><el-button :disabled="loading || busy" @click="moveWeek(1)">下一周</el-button></div><el-button type="primary" :disabled="loading || busy || !!loadError || !!applyIssue || !current" @click="generate">生成草稿</el-button><el-button :disabled="!draft || draftNeedsRebase || loading || busy || !!loadError || !!applyIssue || !versionsAvailable || !!unavailableCount" :loading="applying" @click="applyDraft">应用到日历</el-button></div>
    </div>

    <el-alert v-if="weekLinkNotice" type="warning" :closable="false" show-icon :title="weekLinkNotice" />
    <div v-if="weekStart" class="shopping-context"><router-link class="week-link" :to="{ name: 'shoppingList', query: { week: monday(weekStart) } }">查看所选周购物清单 →</router-link><p>购物清单不会随排餐变动自动更新，请在清单中点击“从排餐生成”。<span v-if="draftHadUncertainApply">先前应用可能已写入部分日期，请核对日历。</span><span v-else-if="draft">草稿尚未写入日历，不会计入生成结果。</span></p></div>

    <el-alert v-if="applyIssue" type="warning" :closable="false" show-icon :title="applyIssue"><el-button link type="primary" :disabled="loading || !!loadError || !current" @click="applyIssue = ''">已核对，继续</el-button></el-alert>
    <el-alert v-if="current && !versionsAvailable" type="warning" :closable="false" show-icon title="服务器未提供完整的安排版本，暂不能安全应用周计划。" />
    <el-alert v-if="unavailableCount" class="unavailable-alert" type="warning" :closable="false" show-icon :title="`当前周有 ${unavailableCount} 条菜品不可用的排餐，暂不能应用草稿，以免覆盖原有安排。`"><span>请先在日历中核对并清除相应餐次，再重新安排。</span><router-link class="calendar-link" :to="{ name: 'calendar', query: { date: firstUnavailableDate } }">前往日历</router-link><nav v-if="unavailableDates.length > 1" class="affected-dates" aria-label="按日期核对周计划"><span>逐日核对：</span><router-link v-for="date in unavailableDates" :key="date" :to="{ name: 'calendar', query: { date } }" :aria-label="`查看 ${date} 的排餐`">{{ date }}</router-link></nav></el-alert>
    <el-card v-if="draft" class="draft-card"><template #header><div class="draft-heading"><div><strong>规则生成草稿</strong><span>{{ draftNeedsRebase ? '保留原草稿供核对，暂不可应用' : '可逐餐调整，应用后才会写入日历' }}</span></div><el-button :disabled="loading || busy" @click="discardDraft">放弃草稿</el-button></div></template>
      <p class="recipe-context">点击菜名可在新标签页查看菜谱，原标签页中的草稿会保留；关闭或刷新原页面会丢失草稿。菜谱的修改会直接保存到菜谱库；调整餐次请使用“调整”。</p>
      <el-alert v-if="draftNeedsRebase" class="unavailable-alert" type="warning" :closable="false" show-icon title="这份草稿保留供参考，不能直接应用。请先核对日历，再基于最新安排继续草稿或重新生成。"><el-button link type="primary" :disabled="!!applyIssue || loading || busy || !!loadError || !versionsAvailable || !!unavailableCount" @click="rebaseDraft">基于最新日历继续草稿</el-button></el-alert>
      <div v-if="draftImpact && !draftNeedsRebase" class="impact-summary" aria-label="草稿对当前安排的影响"><div><span>新增</span><strong>{{ draftImpact.added }}</strong><small>餐</small></div><div><span>替换</span><strong>{{ draftImpact.replaced }}</strong><small>餐</small></div><div :class="{ caution: draftImpact.cleared > 0 }"><span>清空</span><strong>{{ draftImpact.cleared }}</strong><small>餐</small></div><div><span>菜品相同</span><strong>{{ draftImpact.same }}</strong><small>餐</small></div><p>按当前读取的菜品和顺序比较，“菜品相同”包括均为空的餐次；应用仍会写入全部七天，其他排餐信息也可能变化。</p></div>
      <div class="plan-grid"><div v-for="day in draft.preview" :key="day.date" class="day-card"><h3><span>{{ weekdayLabel(day.date) }}</span><small>{{ day.date }}</small></h3><div v-for="(label,type) in mealTypes" :key="type" class="slot draft-slot"><strong>{{ label }}</strong><div class="slot-meals"><el-tag v-for="meal in day.meals[type]" :key="mealId(meal)" class="recipe-tag"><router-link v-if="recipeLinkId(meal)" class="recipe-link" :to="{ name: 'MealDetail', params: { id: recipeLinkId(meal) } }" target="_blank" rel="noopener noreferrer" :aria-label="`在新标签页查看草稿中${day.date}${label}的${meal.name}菜谱`">{{ meal.name }}</router-link><span v-else>{{ meal.name }}</span></el-tag><span v-if="!day.meals[type]?.length && (draftNeedsRebase || !slotChange(day.date, type))" class="muted">空</span><span v-if="!draftNeedsRebase && slotChange(day.date, type)" class="change-note">{{ slotChange(day.date, type) }}</span></div><el-button link type="primary" class="edit-slot" :disabled="draftNeedsRebase" :aria-label="`调整${day.date}${label}`" @click="editSlot(day.date, type)">调整</el-button></div><div v-if="day.hints?.length" class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div><p v-if="editedDates.includes(day.date)" class="edited-note">已调整，请自行核对当天搭配。</p></div></div></el-card>

    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法读取当前日历安排：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <el-card v-else-if="current"><template #header>当前日历安排</template><p class="recipe-context">点击菜名可在新标签页查看菜谱。</p><div class="plan-grid"><div v-for="day in current.days" :key="day.date" class="day-card"><h3><span>{{ weekdayLabel(day.date) }}</span><router-link class="day-calendar-link" :to="{ name: 'calendar', query: { date: day.date } }" :aria-label="`查看 ${day.date} 的日历安排`">{{ day.date }} ↗</router-link></h3><div v-for="(label,type) in mealTypes" :key="type" class="slot"><strong>{{ label }}</strong><el-tag v-for="(item,index) in day.meals?.[type] || []" :key="item.meal?._id || item._id || index" effect="plain" class="recipe-tag"><router-link v-if="recipeLinkId(item)" class="recipe-link" :to="{ name: 'MealDetail', params: { id: recipeLinkId(item) } }" target="_blank" rel="noopener noreferrer" :aria-label="`在新标签页查看${day.date}${label}的${item.meal?.name || item.name}菜谱`">{{ item.meal?.name || item.name }}</router-link><span v-else>{{ item.meal?.name || item.name || '菜品不可用' }}</span></el-tag><span v-if="!day.meals?.[type]?.length" class="muted">未安排</span></div><div v-if="day.hints?.length" class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div></div></div></el-card>
    <div v-else-if="loading" class="calendar-loading" role="status">正在读取所选周的日历安排…</div>
    <WeeklyPlanMealPicker v-if="slotEditor" :date="slotEditor.date" :label="mealTypes[slotEditor.type]" :meals="slotEditor.meals" @cancel="slotEditor = null" @confirm="saveSlot" />
  </div>
</template>

<style scoped>
.recipe-context { color: var(--text-secondary); font-size: 13px; line-height: 1.6; margin: 0 0 12px; }
.recipe-tag { height: auto; max-width: 100%; padding: 0 8px; white-space: normal; }
.recipe-link { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; color: inherit; text-decoration: underline; text-underline-offset: 2px; overflow-wrap: anywhere; }
.recipe-link:focus-visible { outline: 3px solid var(--secondary-color); outline-offset: 2px; }
.shopping-context p { margin: 2px 0 0; color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
.weekly-page { --weekly-accent: color-mix(in srgb, var(--secondary-color) 45%, #33211a); display: flex; flex-direction: column; gap: 18px; }
.calendar-loading { padding: 20px 24px; border: 1px solid var(--border-color); border-radius: 18px; background: var(--bg-primary); color: var(--text-primary); }
.page-header { display: flex; justify-content: space-between; gap: 20px; align-items: center; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 26px; padding: clamp(22px, 3vw, 36px); box-shadow: 0 12px 28px var(--shadow-color); }
h1, h3 { margin: 0; color: var(--text-primary); } h1 { margin-top: 8px; font-family: Georgia, 'Songti SC', serif; font-size: clamp(26px, 3vw, 36px); } .eyebrow { color: var(--weekly-accent); font-size: 11px; letter-spacing: .14em; font-weight: 800; } .page-header p,.muted{color:var(--text-secondary)}
.week-summary { display: flex; flex-wrap: wrap; gap: 8px; color: var(--text-secondary); font-size: 13px; } .week-summary span { border: 1px solid var(--border-light); border-radius: 999px; padding: 5px 10px; }
.today-link { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-weight: 700; font-size: 13px; text-decoration: underline; text-underline-offset: 3px; }
.today-link:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.week-navigation { display: flex; flex-wrap: wrap; gap: 6px; }.week-navigation .el-button { min-height: 44px; margin: 0; }
.week-link { align-self: flex-start; display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }.week-link:focus-visible { outline: 3px solid var(--secondary-color); outline-offset: 3px; }
.plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr)); gap: 12px; }
.day-card { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 10px; } .day-card h3 { font-size: 15px; letter-spacing: .02em; display: flex; justify-content: space-between; align-items: baseline; gap: 8px; } .day-card h3 small { color: var(--text-secondary); font-size: 12px; font-weight: 500; }
.day-calendar-link { display: inline-flex; align-items: center; min-height: 44px; color: var(--text-primary); font-size: 12px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.day-calendar-link:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.slot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.slot strong { min-width: 42px; }.hints { display: flex; gap: 6px; flex-wrap: wrap; }
.draft-card { border-color: var(--secondary-color); }
.draft-heading { display: flex; justify-content: space-between; flex-wrap: wrap; align-items: center; gap: 12px; }
.draft-heading > div { display: flex; flex-direction: column; gap: 5px; color: var(--text-primary); }
.draft-heading span,.edited-note { color: var(--text-secondary); font-size: 12px; }
.impact-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 16px; }
.impact-summary > div { display: flex; align-items: baseline; flex-wrap: wrap; gap: 5px; padding: 12px; border: 1px solid var(--border-light); border-radius: 14px; background: var(--bg-secondary); color: var(--text-primary); }
.impact-summary strong { font-size: 22px; color: var(--weekly-accent); }
.impact-summary small, .impact-summary p { color: var(--text-secondary); font-size: 12px; }
.impact-summary .caution { border-color: var(--weekly-accent); }
.impact-summary p { grid-column: 1 / -1; margin: 2px 0 0; line-height: 1.6; }
.change-note { color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.unavailable-alert { --notice-ink: #623a10; background: #fff1db; color: var(--notice-ink); }
.unavailable-alert :deep(.el-alert__title), .unavailable-alert :deep(.el-alert__description), .unavailable-alert :deep(.el-alert__icon) { color: var(--notice-ink); }
.unavailable-alert :deep(.el-button) { min-height: 44px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.unavailable-alert :deep(.el-button:focus-visible) { outline: 2px solid currentColor; outline-offset: 2px; }
.calendar-link { display: inline-flex; align-items: center; min-height: 44px; margin-left: 12px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.affected-dates { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; color: var(--notice-ink); }.affected-dates a { display: inline-flex; align-items: center; min-height: 44px; color: var(--notice-ink); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }.affected-dates a:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
:global(html.dark) .unavailable-alert { --notice-ink: #ffe4bd; background: #543b29; }
.draft-slot { flex-wrap: nowrap; align-items: flex-start; }
.draft-slot strong { padding-top: 7px; }
.slot-meals { display: flex; flex: 1; min-width: 0; flex-wrap: wrap; gap: 5px; padding-top: 4px; overflow-wrap: anywhere; }
.slot-meals :deep(.el-tag) { max-width: 100%; height: auto; min-height: 24px; white-space: normal; }
.edit-slot { min-width: 40px; min-height: 34px; flex-shrink: 0; color: var(--weekly-accent); }
.edited-note { margin: 0; line-height: 1.5; }
@media (max-width: 720px) { .page-header { flex-direction: column; align-items: stretch; } .actions { justify-content: flex-start; } .actions .el-button { min-height: 44px; margin-left: 0; } }
@media (max-width: 720px) { .edit-slot { min-width: 44px; min-height: 44px; } }
:global(html.dark .weekly-page) { --weekly-accent: var(--secondary-color); }
:global(html:not(.dark) .weekly-page .slot .el-tag) { color: #8e4938; background: #fff8f4; border-color: #e8baaa; }
:global(html.dark .weekly-page .slot .el-tag) { color: var(--text-primary); background: var(--bg-tertiary); border-color: var(--border-color); }
@media (max-width: 600px) { .impact-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .draft-heading .el-button { min-height: 44px; } }
</style>
