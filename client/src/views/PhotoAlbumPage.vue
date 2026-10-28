<script setup>
import { onMounted, ref } from 'vue';
import api from '@/services/api';

const loading = ref(false);
const now = new Date();
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const data = ref({ photos: [] });
const selected = ref(null);
const loadError = ref('');
let loadSequence = 0;
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };
const load = async () => {
  if (!month.value) return;
  const requestedMonth = month.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  selected.value = null;
  data.value = { photos: [] };
  try {
    const result = await api.photoAlbum.month(requestedMonth);
    if (sequence === loadSequence && month.value === requestedMonth) data.value = result;
  } catch(e) {
    if (sequence === loadSequence && month.value === requestedMonth) loadError.value = e?.error || '加载饭桌相册失败';
  } finally { if (sequence === loadSequence) loading.value = false; }
};
onMounted(load);
</script>

<template>
  <div class="album-page" v-loading="loading">
    <div class="page-header"><div><span class="eyebrow">TABLE STORIES · 饭桌故事</span><h1>饭桌相册</h1><p>把饭后回忆里的照片按月份收起来。</p><span v-if="!loading && !loadError" class="photo-count">{{ month }} · {{ data.photos?.length || 0 }} 张照片</span></div><el-date-picker v-model="month" type="month" value-format="YYYY-MM" :clearable="false" :disabled="loading" aria-label="选择相册月份" @change="load" /></div>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`相册暂时无法加载：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <el-empty v-else-if="!loading && !data.photos?.length" description="这个月还没有饭桌照片" />
    <div v-else class="album-grid"><button v-for="item in data.photos" :key="item.photo + item.memoryId" class="photo-card" type="button" @click="selected = item"><img :src="item.photo" :alt="item.title || item.date" /><span>{{ item.date }} · {{ mealTypeText[item.mealType] || '一餐' }}</span></button></div>
    <el-dialog :model-value="!!selected" title="饭桌回忆" width="min(680px, 92vw)" @update:model-value="val => { if (!val) selected = null }" @close="selected=null"><template v-if="selected"><img class="preview" :src="selected.photo" :alt="selected.title || '饭桌照片'" /><h3>{{ selected.title || selected.date }}</h3><p>{{ selected.date }} · {{ mealTypeText[selected.mealType] || '一餐' }} · {{ selected.mood || '日常心情' }}</p><div class="meal-tags"><el-tag v-for="meal in selected.meals || []" :key="meal._id || meal.id">{{ meal.name }}</el-tag></div><p class="note">{{ selected.note }}</p><el-rate :model-value="selected.rating || 0" disabled /></template></el-dialog>
  </div>
</template>

<style scoped>
.album-page{display:flex;flex-direction:column;gap:18px}.page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:26px;padding:clamp(22px,3vw,36px);box-shadow:0 12px 28px var(--shadow-color)}h1,h3{margin:0}h1{margin-top:8px;font-family:Georgia,'Songti SC',serif;font-size:clamp(26px,3vw,36px)}.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.note{color:var(--text-secondary)}.photo-count{display:inline-block;color:var(--text-secondary);font-size:13px;border:1px solid var(--border-light);border-radius:999px;padding:5px 10px}.album-grid{columns:4 220px;column-gap:14px}.photo-card{break-inside:avoid;width:100%;margin:0 0 14px;padding:10px;border:1px solid var(--border-light);border-radius:18px;background:var(--bg-primary);box-shadow:0 10px 28px var(--shadow-color);cursor:pointer;text-align:left;color:var(--text-primary);transition:all .3s ease}.photo-card:hover{transform:translateY(-2px) scale(1.01)}.photo-card img{width:100%;border-radius:14px;display:block;margin-bottom:8px}.photo-card span{font-size:13px;color:var(--text-secondary)}.preview{width:100%;max-height:420px;object-fit:contain;border-radius:16px;background:var(--bg-secondary)}.meal-tags{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}@media(max-width:700px){.page-header{flex-direction:column;align-items:stretch}.album-grid{columns:2 150px}}
</style>
