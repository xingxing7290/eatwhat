<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import api from '@/services/api';

const loading = ref(false);
const applying = ref(false);
const weekStart = ref('');
const current = ref(null);
const draft = ref(null);
const mealTypes = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const monday = () => {
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d.toISOString().slice(0, 10);
};
const mealId = meal => meal?._id || meal?.id || '';
const load = async () => {
  loading.value = true;
  try { current.value = await api.weeklyPlan.get(weekStart.value); }
  catch (e) { ElMessage.error(e?.error || '加载周计划失败'); }
  finally { loading.value = false; }
};
const generate = async () => {
  loading.value = true;
  try { draft.value = await api.weeklyPlan.generate(weekStart.value); ElMessage.success('已生成本周菜单草稿'); }
  catch (e) { ElMessage.error(e?.error || '生成失败'); }
  finally { loading.value = false; }
};
const applyDraft = async () => {
  if (!draft.value?.days?.length) return;
  applying.value = true;
  try { await api.weeklyPlan.apply(draft.value.days); ElMessage.success('已应用到日历'); draft.value = null; await load(); }
  catch (e) { ElMessage.error(e?.error || '应用失败'); }
  finally { applying.value = false; }
};
onMounted(() => { weekStart.value = monday(); load(); });
</script>

<template>
  <div class="weekly-page" v-loading="loading">
    <div class="page-header">
      <div><h1>本周饭桌计划</h1><p>先生成草稿，再确认写入日历。</p></div>
      <div class="actions"><el-date-picker v-model="weekStart" type="date" value-format="YYYY-MM-DD" @change="load" /><el-button type="primary" @click="generate">生成草稿</el-button><el-button :disabled="!draft" :loading="applying" @click="applyDraft">应用到日历</el-button></div>
    </div>

    <el-card v-if="draft" class="draft-card"><template #header>规则生成草稿</template><div class="plan-grid"><div v-for="day in draft.preview" :key="day.date" class="day-card"><h3>{{ day.date }}</h3><div v-for="(label,type) in mealTypes" :key="type" class="slot"><strong>{{ label }}</strong><el-tag v-for="meal in day.meals[type]" :key="mealId(meal)">{{ meal.name }}</el-tag><span v-if="!day.meals[type]?.length" class="muted">空</span></div><div class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div></div></div></el-card>

    <el-card><template #header>当前日历安排</template><div class="plan-grid"><div v-for="day in current?.days || []" :key="day.date" class="day-card"><h3>{{ day.date }}</h3><div v-for="(label,type) in mealTypes" :key="type" class="slot"><strong>{{ label }}</strong><el-tag v-for="item in day.meals?.[type] || []" :key="item.meal?._id || item._id" effect="plain">{{ item.meal?.name || item.name || '未命名' }}</el-tag><span v-if="!day.meals?.[type]?.length" class="muted">未安排</span></div><div class="hints"><el-tag v-for="hint in day.hints" :key="hint" type="warning" size="small">{{ hint }}</el-tag></div></div></div></el-card>
  </div>
</template>

<style scoped>
.weekly-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 14px; align-items: center; background: var(--bg-primary); border-radius: 18px; padding: 20px; box-shadow: 0 12px 28px var(--shadow-color); }
h1, h3 { margin: 0; color: var(--text-primary); }.page-header p,.muted{color:var(--text-secondary)}
.actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.day-card { background: var(--bg-secondary); border: 1px solid var(--border-light); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.slot { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.slot strong { min-width: 42px; }.hints { display: flex; gap: 6px; flex-wrap: wrap; min-height: 24px; }
.draft-card { border-color: var(--secondary-color); }
@media (max-width: 720px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>
