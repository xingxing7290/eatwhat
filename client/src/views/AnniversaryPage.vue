<script setup>
import { nextTick, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture } from '@element-plus/icons-vue';
import api from '@/services/api';

const menus = ref([]);
const meals = ref([]);
const templates = ref([]);
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const deletingId = ref('');
const saveUncertain = ref(false);
const photoFiles = ref([]);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const form = reactive({ title: '', date: localToday(), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] } });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const allowedPhotoTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'application/octet-stream']);
const allowedPhotoExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'];
const photoAccept = 'image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif';
const photoError = (file) => {
  const raw = file?.raw || file;
  const name = String(raw?.name || '').toLowerCase();
  const type = String(raw?.type || '').toLowerCase();
  if (!allowedPhotoExtensions.some(ext => name.endsWith(ext)) || (type && !allowedPhotoTypes.has(type))) return '只支持 JPG、PNG、GIF、WebP、HEIC 或 HEIF 图片';
  if (Number(raw?.size || 0) > 30 * 1024 * 1024) return '单张图片不能超过 30MB';
  return '';
};
const handlePhotoChange = async (_file, files) => {
  let message = '';
  const invalidIds = new Set(files.filter(file => { const error = photoError(file); if (error) message ||= error; return !!error; }).map(file => file.uid));
  if (message) {
    ElMessage.warning(message);
    await nextTick();
    photoFiles.value = photoFiles.value.filter(file => !invalidIds.has(file.uid));
  }
};
const applyTemplate = async (tpl) => {
  if (form.title || form.theme || form.description) {
    try { await ElMessageBox.confirm('使用模板会替换当前标题、主题和备注，已选菜品与照片会保留。', '使用菜单模板', { type: 'warning', confirmButtonText: '使用模板', cancelButtonText: '取消' }); } catch (_) { return; }
  }
  form.title = tpl.title;
  form.theme = tpl.theme;
  form.description = `${tpl.description}\n推荐结构：${(tpl.structure || []).join(' / ')}`;
};

const reset = () => {
  Object.assign(form, { title: '', date: localToday(), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] } });
  photoFiles.value = [];
};
const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const [menuData, mealData, templateData] = await Promise.all([api.anniversary.list(), api.meal.getAllMeals(), api.anniversaryTemplate.list()]);
    menus.value = menuData || [];
    meals.value = mealData.data || mealData || [];
    templates.value = templateData || [];
  } catch (e) { loadError.value = e?.error || '加载纪念日菜单失败'; }
  finally { loading.value = false; }
};
const save = async () => {
  if (!form.title.trim() || !form.date) return ElMessage.warning('请填写标题和日期');
  if (saving.value || saveUncertain.value || loading.value || loadError.value) return;
  const invalid = photoFiles.value.map(photoError).find(Boolean);
  if (invalid) return ElMessage.warning(invalid);
  if (photoFiles.value.length > 12) return ElMessage.warning('最多上传 12 张照片');
  saving.value = true;
  try {
    const fd = new FormData();
    fd.append('title', form.title.trim());
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
  } catch (e) { saveUncertain.value = true; ElMessage.warning('保存结果未确认，请先核对菜单，避免重复创建'); }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value) return;
  deletingId.value = item._id;
  try { await ElMessageBox.confirm('确定删除这个纪念日菜单吗？', '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await api.anniversary.delete(item._id); await load(); }
  catch (e) { if (e !== 'cancel' && e !== 'close') ElMessage.error(e?.error || '删除失败'); }
  finally { deletingId.value = ''; }
};
const reviewAfterError = async () => {
  dialogVisible.value = false;
  await load();
  if (!loadError.value) saveUncertain.value = false;
};
onMounted(load);
</script>

<template>
  <div class="anniversary-page">
    <div class="page-header">
      <div><span class="eyebrow">SPECIAL DAYS · 特别的日子</span><h1>纪念日菜单</h1><p>为生日、纪念日、节日和特别的周末，提前保存一份菜单。</p></div>
      <el-button type="primary" :disabled="loading || !!loadError || !!deletingId" @click="dialogVisible = true"><el-icon><Plus /></el-icon>新增菜单</el-button>
    </div>

    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载纪念日菜单：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <div v-else v-loading="loading" class="menu-grid">
      <el-empty v-if="!loading && !menus.length" description="还没有纪念日菜单" />
      <el-card v-for="item in menus" :key="item._id" class="menu-card">
        <div class="card-top"><div><h2>{{ item.title }}</h2><p>{{ item.date }} · {{ item.theme || '温馨菜单' }}</p></div><el-button type="danger" link :disabled="!!deletingId || saving" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div>
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

    <el-dialog v-model="dialogVisible" title="新增纪念日菜单" width="min(620px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <el-alert v-if="saveUncertain" type="warning" :closable="false" show-icon title="保存结果未确认，请先返回菜单核对，避免重复创建。"><el-button link type="primary" @click="reviewAfterError">返回并核对</el-button></el-alert>
      <el-form label-position="top" :disabled="saving">
        <el-form-item label="菜单模板"><div class="template-list"><el-button v-for="tpl in templates" :key="tpl.key" size="small" @click="applyTemplate(tpl)">{{ tpl.title }}</el-button></div></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="比如：三周年晚餐" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" :clearable="false" /></el-form-item>
        <el-form-item label="主题"><el-input v-model="form.theme" placeholder="家常、烛光、火锅、露营..." /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.description" type="textarea" rows="3" /></el-form-item>
        <el-form-item v-for="(label, key) in mealTypeText" :key="key" :label="label">
          <el-select v-model="form.meals[key]" multiple filterable style="width: 100%;"><el-option v-for="meal in meals" :key="meal._id || meal.id" :label="meal.name" :value="meal._id || meal.id" /></el-select>
        </el-form-item>
        <el-form-item label="照片"><el-upload action="#" :accept="photoAccept" :limit="12" :on-exceed="() => ElMessage.warning('最多上传 12 张照片')" :on-change="handlePhotoChange" :auto-upload="false" multiple list-type="picture-card" v-model:file-list="photoFiles"><el-icon><Picture /></el-icon></el-upload><small class="photo-hint">最多 12 张，单张不超过 30MB（实际以上传服务器设置为准）；支持 JPG、PNG、GIF、WebP、HEIC、HEIF。</small></el-form-item>
      </el-form>
      <template #footer><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.anniversary-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.photo-hint{display:block;width:100%;color:var(--text-secondary);line-height:1.5;margin-top:8px}
.page-header p, .card-top p, .desc, .empty { color: var(--text-secondary); }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
.card-top { display: flex; justify-content: space-between; gap: 12px; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
.photos img { width: 100%; height: 88px; object-fit: cover; border-radius: 8px; }
.meal-blocks { display: flex; flex-direction: column; gap: 10px; }
.meal-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary); border-radius: 8px; }
.template-list { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>
