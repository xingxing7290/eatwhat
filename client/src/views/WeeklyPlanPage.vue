<script setup>
import { computed, onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import api from '@/services/api';

const loading = ref(false);
const applying = ref(false);
const weekStart = ref('');
const current = ref(null);
const draft = ref(null);
const loadError = ref('');
const applyIssue = ref('');
let loadSequence = 0;
const mealTypes = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const scheduledSlots = computed(() => (current.value?.days || []).reduce((total, day) => total + Object.keys(mealTypes).filter(type => day.meals?.[type]?.length).length, 0));
const displayedRange = computed(() => {
  const days = current.value?.days || [];
  return days.length ? `${days[0].date} — ${days[days.length - 1].date}` : '';
});
const versionsAvailable = computed(() => current.value?.supportsConditionalApply === true &&
  Array.isArray(current.value.days) && current.value.days.length === 7 &&
  current.value.days.every(day => typeof day.scheduleExists === 'boolean' &&
    (day.scheduleExists ? typeof day.scheduleVersion === 'string' && Number.isFinite(Date.parse(day.scheduleVersion)) : day.scheduleVersion === null)));
const monday = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const mealId = meal => meal?._id || meal?.id || '';
const load = async () => {
  if (!weekStart.value) return;
  const requestedWeek = weekStart.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  current.value = null;
  try {
    const result = await api.weeklyPlan.get(requestedWeek);
    if (sequence === loadSequence && weekStart.value === requestedWeek) current.value = result;
  } catch (e) {
    if (sequence === loadSequence && weekStart.value === requestedWeek) loadError.value = e?.error || '加载周计划失败';
  } finally { if (sequence === loadSequence) loading.value = false; }
};
const generate = async () => {
  if (!weekStart.value) return ElMessage.warning('请选择要安排的日期');
  if (loading.value || applying.value || loadError.value || !current.value) return;
  loading.value = true;
  draft.value = null;
  applyIssue.value = '';
  try { draft.value = await api.weeklyPlan.generate(weekStart.value); ElMessage.success('已生成本周菜单草稿'); }
  catch (e) { ElMessage.error(e?.error || '生成失败'); }
  finally { loading.value = false; }
};
const applyDraft = async () => {
  if (!draft.value?.days?.length || loading.value || applying.value || loadError.value || !versionsAvailable.value) return;
  const currentDates = current.value.days.map(day => day.date);
  if (draft.value.days.length !== 7 || draft.value.days.some((day, index) => day.date !== currentDates[index])) return ElMessage.error('草稿与当前周不一致，请重新生成');
  if (!draft.value.days.some(day => Object.values(day.meals || {}).some(items => items?.length))) return ElMessage.warning('草稿中没有菜品，请先添加菜谱');
  applying.value = true;
  try {
    try {
      await ElMessageBox.confirm('应用草稿会替换这一周每天的早餐、午餐和晚餐，包括草稿中的空餐次。请确认已检查当前安排。', '确认应用周计划', { type: 'warning', confirmButtonText: '确认替换', cancelButtonText: '再检查一下' });
    } catch (_) { return; }
    const expectedVersions = Object.fromEntries(current.value.days.map(day => [day.date, day.scheduleVersion]));
    await api.weeklyPlan.apply(draft.value.days, expectedVersions); ElMessage.success('已应用到日历'); draft.value = null; applyIssue.value = ''; await load();
  }
  catch (e) {
    const applied = Array.isArray(e?.appliedDates) ? e.appliedDates : null;
    if (e?.code === 'WEEKLY_PLAN_CONFLICT' && applied) {
      applyIssue.value = `${e.conflictDate || '某天'}的安排已变化。${applied.length ? `已写入：${applied.join('、')}；其余日期未写入。` : '本次未写入任何日期。'}请核对最新日历后重新生成草稿。`;
    } else {
      applyIssue.value = `${applied?.length ? `已确认写入：${applied.join('、')}。` : ''}${e?.uncertainDate ? `${e.uncertainDate} 的写入结果不确定。` : '可能有部分日期已写入。'}请核对最新日历后重新生成草稿。`;
    }
    draft.value = null;
    await load();
  }
  finally { applying.value = false; }
};
const changeWeek = () => { draft.value = null; applyIssue.value = ''; if (weekStart.value) load(); else current.value = null; };
onMounted(() => { weekStart.value = monday(); load(); });
</script>

<template>
  <div class="weekly-page" v-loading="loading">
    <div class="page-header">
      <div><span class="eyebrow">WEEKLY TABLE · 一周饭桌</span><h1>本周饭桌计划</h1><p>选择一周内的任意日期，先生成草稿，再确认写入日历。</p><div v-if="displayedRange" class="week-summary"><span>{{ displayedRange }}</span><span>已安排 {{ scheduledSlots }} 餐</span></div></div>
      <div class="actions"><el-date-picker v-model="weekStart" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled="loading || applying" aria-label="选择周计划日期" @change="changeWeek" /><el-button type="primary" :disabled="loading || applying || !!loadError || !current" @click="generate">生成草稿</el-button><el-button :disabled="!draft || loading || applying || !!loadError || !versionsAvailable" :loading="applying" @click="applyDraft">应用到日历</el-button></div>
    </div>

    <el-alert v-if="applyIssue" type="warning" :closable="false" show-icon :title="applyIssue" />
    <el-alert v-if="current && !versionsAvailable" type="warning" :closable="false" show-icon title="服务器未提供完整的安排版本，暂不能安全应用周计划。" />
    <el-card v-if="draft" class="draft-card"><template #header>规则生成草稿</template><div class="plan-grid"><div v-for="day in draft.preview" :key="day.date" class="day-card"><h3>{{ day.date }}</h3><div v-for="(label,type) in mealTypes" :key="type" class="slot"><strong>{{ label }}</strong><el-tag v-for="meal in day.meals[type]" :key="mealId(meal)">{{ meal.name }}</el-tag><span v-if="!day.meals[type]?.length" class="muted">空</span></div><div class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div></div></div></el-card>

    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法读取当前日历安排：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <el-card v-else><template #header>当前日历安排</template><div class="plan-grid"><div v-for="day in current?.days || []" :key="day.date" class="day-card"><h3>{{ day.date }}</h3><div v-for="(label,type) in mealTypes" :key="type" class="slot"><strong>{{ label }}</strong><el-tag v-for="item in day.meals?.[type] || []" :key="item.meal?._id || item._id" effect="plain">{{ item.meal?.name || item.name || '未命名' }}</el-tag><span v-if="!day.meals?.[type]?.length" class="muted">未安排</span></div><div class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div></div></div><el-empty v-if="current && !current.days?.length" description="这一周暂无安排" /></el-card>
  </div>
</template>

<style scoped>
.weekly-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 20px; align-items: center; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 26px; padding: clamp(22px, 3vw, 36px); box-shadow: 0 12px 28px var(--shadow-color); }
h1, h3 { margin: 0; color: var(--text-primary); } h1 { margin-top: 8px; font-family: Georgia, 'Songti SC', serif; font-size: clamp(26px, 3vw, 36px); } .eyebrow { color: var(--secondary-color); font-size: 11px; letter-spacing: .14em; font-weight: 800; } .page-header p,.muted{color:var(--text-secondary)}
.week-summary { display: flex; flex-wrap: wrap; gap: 8px; color: var(--text-secondary); font-size: 13px; } .week-summary span { border: 1px solid var(--border-light); border-radius: 999px; padding: 5px 10px; }
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.day-card { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 18px; padding: 16px; display: flex; flex-direction: column; gap: 12px; } .day-card h3 { font-size: 15px; letter-spacing: .02em; }
.slot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.slot strong { min-width: 42px; }.hints { display: flex; gap: 6px; flex-wrap: wrap; min-height: 24px; }
.draft-card { border-color: var(--secondary-color); }
@media (max-width: 720px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>
