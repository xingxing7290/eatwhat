<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const menus = ref([]);
const meals = ref([]);
const selectedMeals = ref([]);
const mealLoading = ref(false);
const mealError = ref('');
const mealTotal = ref(0);
const mealQuery = ref('');
let mealSequence = 0;
let mealTimer = null;
let menuSequence = 0;
let alive = true;
const templates = ref([]);
const templateError = ref('');
const templateLoading = ref(false);
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const deletingId = ref('');
const deleteIssue = ref('');
const viewedPhoto = ref(null);
const photoFiles = ref([]);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const form = reactive({ title: '', date: localToday(), theme: '', description: '', meals: { breakfast: [], lunch: [], dinner: [] } });
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value || photoFiles.value.length > 0);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => reset(), reopen: () => { dialogVisible.value = true; }, label: '纪念日菜单' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || reviewing.value || deciding.value || !!deletingId.value);
useDraftGuard({ dirty, busy, uncertain: saveUncertain, label: '纪念日菜单' });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const mealId = meal => String(meal?._id || meal?.id || '');
const mealOptions = computed(() => {
  const seen = new Set();
  return [...selectedMeals.value, ...meals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const rememberMeals = () => {
  const available = new Map(mealOptions.value.map(meal => [mealId(meal), meal]));
  const ids = new Set(Object.values(form.meals).flat().map(String));
  selectedMeals.value = [...ids].map(id => available.get(id)).filter(Boolean);
};
const searchMealCatalog = async () => {
  const sequence = ++mealSequence;
  const query = mealQuery.value.trim();
  mealLoading.value = true;
  mealError.value = '';
  try {
    const params = { page: 1, limit: 50 };
    if (query) params.search = query;
    const result = await api.meal.getAllMeals(params);
    if (!alive || sequence !== mealSequence) return;
    let rows = result.data;
    let total = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim())) throw new Error('菜品列表不完整');
    if (result.page == null && result.limit == null && rows.length === total) {
      const lower = query.toLowerCase();
      rows = rows.filter(meal => [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)));
      total = rows.length;
      rows = rows.slice(0, 50);
    }
    meals.value = rows;
    mealTotal.value = total;
  } catch (e) { if (alive && sequence === mealSequence) mealError.value = e?.error || e?.message || '菜品加载失败'; }
  finally { if (alive && sequence === mealSequence) mealLoading.value = false; }
};
const searchMeals = query => {
  mealQuery.value = typeof query === 'string' ? query : '';
  mealSequence++;
  mealLoading.value = true;
  mealError.value = '';
  if (mealTimer) clearTimeout(mealTimer);
  mealTimer = setTimeout(searchMealCatalog, 180);
};
const openMealOptions = visible => { if (visible) searchMeals(''); };
const imageFor = photo => resolveUploadedImage(photo) || placeholder;
const imageError = event => { if (event.target.dataset.fallback !== '1') { event.target.dataset.fallback = '1'; event.target.src = placeholder; event.target.alt = '图片暂不可用'; } };
const openPhoto = (item, index) => { viewedPhoto.value = { title: item.title || '纪念日照片', photos: item.photos, index }; };
const movePhoto = direction => { if (!viewedPhoto.value) return; const next = viewedPhoto.value.index + direction; if (next >= 0 && next < viewedPhoto.value.photos.length) viewedPhoto.value.index = next; };
const onPhotoKey = event => { if (!viewedPhoto.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1); };
const loadTemplates = async () => {
  if (templateLoading.value) return;
  templateLoading.value = true; templateError.value = '';
  try { const data = await api.anniversaryTemplate.list(); if (!Array.isArray(data)) throw new Error('模板列表不完整'); if (alive) templates.value = data; }
  catch (e) { if (alive) templateError.value = e?.error || e?.message || '模板加载失败'; }
  finally { if (alive) templateLoading.value = false; }
};
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
  selectedMeals.value = [];
  initialForm.value = JSON.stringify(form);
};
const load = async () => {
  const sequence = ++menuSequence;
  loading.value = true;
  loadError.value = '';
  try {
    const menuData = await api.anniversary.list();
    if (!alive || sequence !== menuSequence) return;
    if (!Array.isArray(menuData)) throw new Error('菜单列表不完整');
    menus.value = menuData;
    deleteIssue.value = '';
  } catch (e) { if (alive && sequence === menuSequence) loadError.value = e?.error || e?.message || '加载纪念日菜单失败'; }
  finally { if (alive && sequence === menuSequence) loading.value = false; }
};
const save = async () => {
  if (!form.title.trim() || !form.date) return ElMessage.warning('请填写标题和日期');
  if (saving.value || saveUncertain.value || reviewing.value || loading.value || loadError.value || deleteIssue.value) return;
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
    const created = await api.anniversary.create(fd);
    if (!created?._id && !created?.id) throw new Error('保存响应不完整');
    ElMessage.success('纪念日菜单已保存');
    dialogVisible.value = false;
    reset();
    await load();
  } catch (_) { markUncertain(); }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value || deleteIssue.value || loading.value || loadError.value) return;
  deletingId.value = item._id;
  try { await ElMessageBox.confirm('确定删除这个纪念日菜单吗？', '删除确认', { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' }); await api.anniversary.delete(item._id); await load(); }
  catch (e) { if (e !== 'cancel' && e !== 'close') deleteIssue.value = '删除结果未确认，请重新加载并核对后再操作。'; }
  finally { deletingId.value = ''; }
};
onMounted(() => { window.addEventListener('keydown', onPhotoKey); load(); loadTemplates(); });
onBeforeUnmount(() => { alive = false; menuSequence++; mealSequence++; if (mealTimer) clearTimeout(mealTimer); window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="anniversary-page">
    <div class="page-header">
      <div><span class="eyebrow">SPECIAL DAYS · 特别的日子</span><h1>纪念日菜单</h1><p>为生日、纪念日、节日和特别的周末，提前保存一份菜单。</p></div>
      <el-button type="primary" :disabled="loading || !!loadError || !!deletingId || !!deleteIssue" @click="dialogVisible = true"><el-icon><Plus /></el-icon>新增菜单</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="纪念日菜单" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />

    <el-alert v-if="deleteIssue" type="warning" :closable="false" show-icon :title="deleteIssue"><el-button link type="primary" :loading="loading" @click="load">重新加载并核对</el-button></el-alert>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载纪念日菜单：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <div v-else v-loading="loading" class="menu-grid">
      <el-empty v-if="!loading && !menus.length" description="还没有纪念日菜单" />
      <el-card v-for="item in menus" :key="item._id" class="menu-card">
        <div class="card-top"><div><h2>{{ item.title }}</h2><p>{{ item.date }} · {{ item.theme || '温馨菜单' }}</p></div><el-button type="danger" link :disabled="!!deletingId || saving || !!deleteIssue" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div>
        <p class="desc">{{ item.description || '没有备注，也可以是一份默契。' }}</p>
        <div v-if="item.photos?.length" class="photos"><button v-for="(photo, index) in item.photos" :key="`${index}-${photo}`" type="button" class="photo-button" :aria-label="`查看${item.title || '纪念日'}的第 ${index + 1} 张照片`" @click="openPhoto(item, index)"><img :src="imageFor(photo)" alt="" @error="imageError" /></button></div>
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
      <CreateRecoveryNotice v-if="saveUncertain" label="纪念日菜单" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="菜单模板"><div class="template-list"><el-button v-for="tpl in templates" :key="tpl.key" size="small" @click="applyTemplate(tpl)">{{ tpl.title }}</el-button><span v-if="templateLoading" class="photo-hint">正在加载模板…</span><el-alert v-if="templateError" type="warning" :closable="false" :title="`模板暂不可用：${templateError}`"><el-button link type="primary" @click="loadTemplates">重试</el-button></el-alert></div></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" maxlength="100" show-word-limit placeholder="比如：三周年晚餐" /></el-form-item>
        <el-form-item label="日期"><el-date-picker v-model="form.date" type="date" value-format="YYYY-MM-DD" :clearable="false" /></el-form-item>
        <el-form-item label="主题"><el-input v-model="form.theme" placeholder="家常、烛光、火锅、露营..." /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.description" type="textarea" rows="3" /></el-form-item>
        <el-form-item v-for="(label, key) in mealTypeText" :key="key" :label="label">
          <el-select v-model="form.meals[key]" multiple filterable remote reserve-keyword :remote-method="searchMeals" :loading="mealLoading" :aria-label="`搜索${label}菜品`" placeholder="搜索菜名或食材" style="width: 100%;" @visible-change="openMealOptions" @change="rememberMeals"><el-option v-for="meal in mealOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select>
          <small v-if="!mealError && mealTotal > 50" class="photo-hint">仅显示前 50 道，请输入菜名或食材缩小范围。</small><el-alert v-if="mealError" type="warning" :closable="false" :title="`菜品暂时无法加载：${mealError}`"><el-button link type="primary" @click="searchMealCatalog">重试</el-button></el-alert>
        </el-form-item>
        <el-form-item label="照片"><el-upload action="#" :accept="photoAccept" :limit="12" :on-exceed="() => ElMessage.warning('最多上传 12 张照片')" :on-change="handlePhotoChange" :auto-upload="false" :disabled="saving || saveUncertain" multiple list-type="picture-card" v-model:file-list="photoFiles"><el-icon><Picture /></el-icon></el-upload><small class="photo-hint">最多 12 张，单张不超过 30MB（实际以上传服务器设置为准）；支持 JPG、PNG、GIF、WebP、HEIC、HEIF。</small></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || loading || !!loadError || !!deleteIssue" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog :model-value="!!viewedPhoto" title="纪念日照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) viewedPhoto = null }"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.photos[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.photos[viewedPhoto.index])" :alt="viewedPhoto.title" @error="imageError" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张纪念日照片" @click="movePhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.photos.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.photos.length - 1" aria-label="下一张纪念日照片" @click="movePhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.anniversary-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.photo-hint{display:block;width:100%;color:var(--text-secondary);line-height:1.5;margin-top:8px}
.page-header p, .card-top p, .desc, .empty { color: var(--text-secondary); }
.menu-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 320px), 1fr)); gap: 16px; }
.card-top { display: flex; justify-content: space-between; gap: 12px; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 12px 0; }
.photo-button { padding: 0; border: 0; border-radius: 8px; background: var(--bg-secondary); cursor: pointer; }
.photo-button:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.photos img { display: block; width: 100%; height: 88px; object-fit: cover; border-radius: 8px; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.meal-blocks { display: flex; flex-direction: column; gap: 10px; }
.meal-block { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 10px; background: var(--bg-secondary); border-radius: 8px; }
.template-list { display: flex; flex-wrap: wrap; gap: 8px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>
