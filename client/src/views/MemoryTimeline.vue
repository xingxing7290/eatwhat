<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture } from '@element-plus/icons-vue';
import api from '@/services/api';

const memories = ref([]);
const meals = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const photoFiles = ref([]);
const form = reactive({ date: new Date().toISOString().slice(0, 10), mealType: 'dinner', title: '', mood: '', rating: 5, note: '', mealIds: [] });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };

const grouped = computed(() => memories.value.reduce((acc, item) => {
  const key = item.date;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {}));

const resetForm = () => {
  Object.assign(form, { date: new Date().toISOString().slice(0, 10), mealType: 'dinner', title: '', mood: '', rating: 5, note: '', mealIds: [] });
  photoFiles.value = [];
};
const load = async () => {
  loading.value = true;
  try {
    const [memoryData, mealData] = await Promise.all([api.memory.list(), api.meal.getAllMeals()]);
    memories.value = memoryData || [];
    meals.value = mealData.data || mealData || [];
  } catch (e) { ElMessage.error(e?.error || '加载饭后回忆失败'); }
  finally { loading.value = false; }
};
const save = async () => {
  try {
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, Array.isArray(value) ? JSON.stringify(value) : value));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    await api.memory.create(fd);
    ElMessage.success('回忆已保存');
    dialogVisible.value = false;
    resetForm();
    await load();
  } catch (e) { ElMessage.error(e?.error || '保存失败'); }
};
const remove = async (item) => {
  try {
    await ElMessageBox.confirm('确定删除这条饭后回忆吗？', '删除确认');
    await api.memory.delete(item._id);
    ElMessage.success('已删除');
    await load();
  } catch (e) { if (e !== 'cancel') ElMessage.error(e?.error || '删除失败'); }
};
onMounted(load);
</script>

<template>
  <div class="memory-page">
    <div class="page-header">
      <div><h1>饭后回忆</h1><p>把每一餐后的心情、照片和小故事留下来。</p></div>
      <el-button type="primary" @click="dialogVisible = true"><el-icon><Plus /></el-icon>记录一餐</el-button>
    </div>

    <div v-loading="loading" class="timeline">
      <el-empty v-if="!memories.length" description="还没有饭后回忆" />
      <section v-for="(items, date) in grouped" :key="date" class="day-group">
        <h2>{{ date }}</h2>
        <div class="memory-grid">
          <el-card v-for="item in items" :key="item._id" class="memory-card">
            <div class="memory-top"><el-tag>{{ mealTypeText[item.mealType] || item.mealType }}</el-tag><el-button type="danger" link @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div>
            <h3>{{ item.title || '温馨一餐' }}</h3>
            <p>{{ item.note || '没有文字，也是一段回忆。' }}</p>
            <div class="meta"><span>{{ item.mood || '日常' }}</span><el-rate :model-value="item.rating || 0" disabled size="small" /></div>
            <div v-if="item.photos?.length" class="photos"><img v-for="photo in item.photos" :key="photo" :src="photo" alt="回忆照片" /></div>
            <div class="meal-names"><el-tag v-for="meal in item.mealIds || []" :key="meal._id" effect="plain">{{ meal.name }}</el-tag></div>
          </el-card>
        </div>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" title="记录饭后回忆" width="560px">
      <el-form label-position="top">
        <el-form-item label="日期"><el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="餐次"><el-select v-model="form.mealType"><el-option v-for="(label, key) in mealTypeText" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="相关菜品"><el-select v-model="form.mealIds" multiple filterable><el-option v-for="meal in meals" :key="meal._id || meal.id" :label="meal.name" :value="meal._id || meal.id" /></el-select></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="比如：周五晚上的番茄牛腩" /></el-form-item>
        <el-form-item label="心情"><el-input v-model="form.mood" placeholder="开心、满足、想再吃一次..." /></el-form-item>
        <el-form-item label="评分"><el-rate v-model="form.rating" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="4" /></el-form-item>
        <el-form-item label="照片"><el-upload action="#" :auto-upload="false" multiple list-type="picture-card" v-model:file-list="photoFiles"><el-icon><Picture /></el-icon></el-upload></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.memory-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px var(--shadow-color); }
h1, h2, h3 { margin: 0; color: var(--text-primary); }
.page-header p { color: var(--text-secondary); margin: 6px 0 0; }
.day-group { display: flex; flex-direction: column; gap: 12px; }
.memory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.memory-top, .meta, .meal-names { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.memory-card p { color: var(--text-secondary); white-space: pre-wrap; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.photos img { width: 100%; height: 90px; object-fit: cover; border-radius: 8px; }
.meal-names { justify-content: flex-start; flex-wrap: wrap; margin-top: 10px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>