<script setup>
import { onMounted, ref } from 'vue';
import api from '@/services/api';
import { ElMessage } from 'element-plus';

const loading = ref(false);
const month = ref(new Date().toISOString().slice(0, 7));
const data = ref({ photos: [] });
const selected = ref(null);
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };
const load = async () => { loading.value = true; try { data.value = await api.photoAlbum.month(month.value); } catch(e) { ElMessage.error(e?.error || '加载饭桌相册失败'); } finally { loading.value = false; } };
onMounted(load);
</script>

<template>
  <div class="album-page" v-loading="loading">
    <div class="page-header"><div><h1>饭桌相册</h1><p>把饭后回忆里的照片按月份收起来。</p></div><el-date-picker v-model="month" type="month" value-format="YYYY-MM" @change="load" /></div>
    <el-empty v-if="!data.photos?.length" description="这个月还没有饭桌照片" />
    <div v-else class="album-grid"><button v-for="item in data.photos" :key="item.photo + item.memoryId" class="photo-card" type="button" @click="selected = item"><img :src="item.photo" :alt="item.title || item.date" /><span>{{ item.date }} · {{ mealTypeText[item.mealType] || '一餐' }}</span></button></div>
    <el-dialog :model-value="!!selected" title="饭桌回忆" width="680px" @update:model-value="val => { if (!val) selected = null }" @close="selected=null"><template v-if="selected"><img class="preview" :src="selected.photo" /><h3>{{ selected.title || selected.date }}</h3><p>{{ selected.date }} · {{ mealTypeText[selected.mealType] || '一餐' }} · {{ selected.mood || '日常心情' }}</p><div class="meal-tags"><el-tag v-for="meal in selected.meals || []" :key="meal._id || meal.id">{{ meal.name }}</el-tag></div><p class="note">{{ selected.note }}</p><el-rate :model-value="selected.rating || 0" disabled /></template></el-dialog>
  </div>
</template>

<style scoped>
.album-page{display:flex;flex-direction:column;gap:18px}.page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--bg-primary);border-radius:18px;padding:20px;box-shadow:0 12px 28px var(--shadow-color)}h1,h3{margin:0}.page-header p,.note{color:var(--text-secondary)}.album-grid{columns:4 220px;column-gap:14px}.photo-card{break-inside:avoid;width:100%;margin:0 0 14px;padding:10px;border:1px solid var(--border-light);border-radius:18px;background:var(--bg-primary);box-shadow:0 10px 28px var(--shadow-color);cursor:pointer;text-align:left;color:var(--text-primary);transition:all .3s ease}.photo-card:hover{transform:translateY(-2px) scale(1.01)}.photo-card img{width:100%;border-radius:14px;display:block;margin-bottom:8px}.photo-card span{font-size:13px;color:var(--text-secondary)}.preview{width:100%;max-height:420px;object-fit:contain;border-radius:16px;background:var(--bg-secondary)}.meal-tags{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}@media(max-width:700px){.page-header{flex-direction:column;align-items:stretch}.album-grid{columns:2 150px}}
</style>
