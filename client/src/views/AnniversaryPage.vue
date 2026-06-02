<script setup>
import { onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture } from '@element-plus/icons-vue';
import api from '@/services/api';

const menus = ref([]);
const meals = ref([]);
const templates = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const photoFiles = ref([]);
const form = reactive({ title: '', date: new Date().toISOString().slice(0, 10), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] } });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const applyTemplate = (tpl) => {
  form.title = tpl.title;
  form.theme = tpl.theme;
  form.description = `${tpl.description}\n推荐结构：${(tpl.structure || []).join(' / ')}`;
};

const reset = () => {
  Object.assign(form, { title: '', date: new Date().toISOString().slice(0, 10), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] } });
  photoFiles.value = [];
};
const load = async () => {
  loading.value = true;
  try {
    const [menuData, mealData, templateData] = await Promise.all([api.anniversary.list(), api.meal.getAllMeals(), api.anniversaryTemplate.list()]);
    menus.value = menuData || [];
    meals.value = mealData.data || mealData || [];
    templates.value = templateData || [];
  } catch (e) { ElMessage.error(e?.error || '加载纪念日菜单失败'); }
  finally { loading.value = false; }
};
const save = async () => {
  try {
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('date', form.date);
    fd.append('theme', form.theme);
    fd.append('description', form.description);
    fd.append('meals', JSON.stringify(form.meals));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    await api.anniversary.create(fd);
    ElMessage.success('纪念日菜单已保存');
    dialogVisible.value = false;
    reset();
    await load();
  } catch (e) { ElMessage.error(e?.error || '保存失败'); }
};
const remove = async (item) => {
  try { await ElMessageBox.confirm('确定删除这个纪念日菜单吗？', '删除确认'); await api.anniversary.delete(item._id); await load(); }
  catch (e) { if (e !== 'cancel') ElMessage.error(e?.error || '删除失败'); }
};
onMounted(load);
</script>

<template>
  <div class="anniversary-page">
    <div class="page-header">
      <div><h1>纪念日菜单</h1><p>为生日、纪念日、节日和特别的周末，提前保存一份菜单。</p></div>
      <el-button type="primary" @click="dialogVisible = true"><el-icon><Plus /></el-icon>新增菜单</el-button>
    </div>

    <div v-loading="loading" class="menu-grid">
      <el-empty v-if="!menus.length" description="还没有纪念日菜单" />
      <el-card v-for="item in menus" :key="item._id" class="menu-card">
        <div class="card-top"><div><h2>{{ item.title }}</h2><p>{{ item.date }} · {{ item.theme || '温馨菜单' }}</p></div><el-button type="danger" link @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div>
        <p class="desc">{{ item.description || '没有备注，也可以是一份默契。' }}</p>
        <div v-if="item.photos?.length" class="photos"><img v-for="photo in item.photos" :key="photo" :src="photo" alt="纪念日照片" /></div>
        <div class="meal-blocks">
          <div v-for="(label, key) in mealTypeText" :key="key" class="meal-block">
            <strong>{{ label }}</strong>
            <el-tag v-for="meal in item.meals?.[key] || []" :key="meal._id" effect="plain">{{ meal.name }}</el-tag>
            <span v-if="!item.meals?.[key]?.length" class="empty">未安排</span>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="dialogVisible" title="新增纪念日菜单" width="620px">
      <el-form label-position="top">
        <el-form-item label="菜单模板"><div class="template-list"><el-button v-for="tpl in templates" :key="tpl.key" size="small" @click="applyTemplate(tpl)">{{ tpl.title }}</el-button></div></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="比如：三周年晚餐" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="主题"><el-input v-model="form.theme" placeholder="家常、烛光、火锅、露营..." /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.description" type="textarea" rows="3" /></el-form-item>
        <el-form-item v-for="(label, key) in mealTypeText" :key="key" :label="label">
          <el-select v-model="form.meals[key]" multiple filterable style="width: 100%;"><el-option v-for="meal in meals" :key="meal._id || meal.id" :label="meal.name" :value="meal._id || meal.id" /></el-select>
        </el-form-item>
        <el-form-item label="照片"><el-upload action="#" :auto-upload="false" multiple list-type="picture-card" v-model:file-list="photoFiles"><el-icon><Picture /></el-icon></el-upload></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.anniversary-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
.page-header p, .card-top p, .desc, .empty { color: var(--text-secondary); }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.card-top { display: flex; justify-content: space-between; gap: 12px; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
.photos img { width: 100%; height: 88px; object-fit: cover; border-radius: 8px; }
.meal-blocks { display: flex; flex-direction: column; gap: 10px; }
.meal-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary); border-radius: 8px; }
.template-list { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>