<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const memories = ref([]);
const route = useRoute();
const router = useRouter();
const meals = ref([]);
const selectedMeals = ref([]);
const mealLoading = ref(false);
const mealError = ref('');
const mealTotal = ref(0);
const mealQuery = ref('');
const mealLoaded = ref(false);
let mealSequence = 0;
let mealTimer = null;
let memorySequence = 0;
let alive = true;
const loading = ref(false);
const loadError = ref('');
const deletingId = ref('');
const deleteIssue = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const photoFiles = ref([]);
const viewedPhoto = ref(null);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const form = reactive({ date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', mealIds: [] });
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value || photoFiles.value.length > 0);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => resetForm(), reopen: () => { dialogVisible.value = true; }, label: '回忆' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || reviewing.value || deciding.value || !!deletingId.value);
useDraftGuard({ dirty, busy, uncertain: saveUncertain, label: '饭后回忆' });
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };
const supportedPhotoTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const supportedPhotoExts = ['.jpeg', '.jpg', '.png', '.gif', '.webp'];
const maxPhotoSize = 5 * 1024 * 1024;
const photoAccept = 'image/jpeg,image/png,image/gif,image/webp';

const photoValidationError = (file) => {
  if (!file) return 'empty';
  const name = String(file.name || '').toLowerCase();
  const type = String(file.type || '').toLowerCase();
  const typeMatched = supportedPhotoTypes.has(type);
  const extMatched = supportedPhotoExts.some(ext => name.endsWith(ext));
  if (!typeMatched || !extMatched) return 'type';
  if (Number(file.size || 0) > maxPhotoSize) return 'size';
  return '';
};

const isSupportedPhoto = (file) => !photoValidationError(file);

const logRejectedPhoto = (file, reason) => {
  const raw = file?.raw || file;
  console.warn('[memory-upload] rejected photo', {
    reason,
    name: raw?.name || file?.name || '',
    type: raw?.type || file?.type || '',
    size: raw?.size || file?.size || 0
  });
};

const handlePhotoChange = async (_uploadFile, uploadFiles) => {
  const invalidIds = new Set();
  let rejectedReason = '';
  uploadFiles.forEach(file => {
    const reason = photoValidationError(file.raw || file);
    if (reason) {
      rejectedReason = rejectedReason || reason;
      logRejectedPhoto(file, reason);
      invalidIds.add(file.uid);
      return;
    }
  });
  if (rejectedReason === 'size') {
    ElMessage.warning('\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 5MB');
  } else if (rejectedReason) {
    ElMessage.warning('\u53ea\u652f\u6301 jpg\u3001png\u3001gif\u3001webp \u56fe\u7247');
  }
  if (invalidIds.size) {
    await nextTick();
    photoFiles.value = photoFiles.value.filter(file => !invalidIds.has(file.uid));
  }
};


const grouped = computed(() => memories.value.reduce((acc, item) => {
  const key = item.date;
  if (!acc[key]) acc[key] = [];
  acc[key].push(item);
  return acc;
}, {}));
const mealId = meal => String(meal?._id || meal?.id || '');
const mealOptions = computed(() => {
  const seen = new Set();
  return [...selectedMeals.value, ...meals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const rememberMeals = ids => {
  const available = new Map(mealOptions.value.map(meal => [mealId(meal), meal]));
  selectedMeals.value = ids.map(id => available.get(String(id))).filter(Boolean);
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
    mealLoaded.value = true;
  } catch (e) {
    if (alive && sequence === mealSequence) mealError.value = e?.error || e?.message || '菜品加载失败';
  } finally { if (alive && sequence === mealSequence) mealLoading.value = false; }
};
const searchMeals = query => {
  mealQuery.value = typeof query === 'string' ? query : '';
  mealSequence++;
  mealLoading.value = true;
  mealError.value = '';
  if (mealTimer) clearTimeout(mealTimer);
  mealTimer = setTimeout(searchMealCatalog, 180);
};
const openMealOptions = visible => { if (visible && !mealLoaded.value && !mealLoading.value) searchMeals(''); };
const imageFor = photo => resolveUploadedImage(photo) || placeholder;
const imageError = event => { if (event.target.dataset.fallback !== '1') { event.target.dataset.fallback = '1'; event.target.src = placeholder; event.target.alt = '图片暂不可用'; } };
const openMemoryPhoto = (item, index) => { viewedPhoto.value = { title: item.title || item.date || '饭后照片', photos: item.photos, index }; };
const moveMemoryPhoto = direction => {
  if (!viewedPhoto.value) return;
  const next = viewedPhoto.value.index + direction;
  if (next >= 0 && next < viewedPhoto.value.photos.length) viewedPhoto.value.index = next;
};
const onPhotoKey = event => {
  if (!viewedPhoto.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  moveMemoryPhoto(event.key === 'ArrowLeft' ? -1 : 1);
};

const resetForm = () => {
  Object.assign(form, { date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', mealIds: [] });
  photoFiles.value = [];
  selectedMeals.value = [];
  initialForm.value = JSON.stringify(form);
};
const load = async () => {
  const sequence = ++memorySequence;
  loading.value = true;
  loadError.value = '';
  try {
    const memoryData = await api.memory.list();
    if (!alive || sequence !== memorySequence) return;
    if (!Array.isArray(memoryData)) throw new Error('回忆列表数据不完整');
    memories.value = memoryData;
    deleteIssue.value = '';
    if (route.query.new === '1' && typeof route.query.mealId === 'string') {
      const requestedId = route.query.mealId;
      try {
        const meal = await api.meal.getMealById(requestedId);
        if (!alive || sequence !== memorySequence) return;
        if (!meal || mealId(meal) !== requestedId || typeof meal.name !== 'string' || !meal.name.trim()) throw new Error('菜品数据不完整');
        selectedMeals.value = [meal];
        form.mealIds = [requestedId];
        form.title = `做过一次：${meal.name}`;
      } catch (_) {
        if (!alive || sequence !== memorySequence) return;
        ElMessage.warning('未找到这道菜，请手动选择');
      }
      dialogVisible.value = true;
      await router.replace({ name: 'memories' });
    }
  } catch (e) { if (alive && sequence === memorySequence) loadError.value = e?.error || e?.message || '加载饭后回忆失败'; }
  finally { if (alive && sequence === memorySequence) loading.value = false; }
};
const save = async () => {
  if (!form.date) return ElMessage.warning('请选择日期');
  if (saving.value || saveUncertain.value || reviewing.value || loading.value || loadError.value || deleteIssue.value) return;
  try {
    const invalidPhoto = photoFiles.value.find(file => !isSupportedPhoto(file.raw || file));
    if (invalidPhoto) {
      const reason = photoValidationError(invalidPhoto.raw || invalidPhoto);
      logRejectedPhoto(invalidPhoto, reason);
      ElMessage.warning(reason === 'size' ? '\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 5MB' : '\u8bf7\u4e0a\u4f20 jpg\u3001png\u3001gif\u3001webp \u56fe\u7247');
      return;
    }
    saving.value = true;
    const fd = new FormData();
    Object.entries(form).forEach(([key, value]) => fd.append(key, Array.isArray(value) ? JSON.stringify(value) : value));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    const created = await api.memory.create(fd);
    if (!created?._id && !created?.id) throw new Error('保存响应不完整');
    ElMessage.success('回忆已保存');
    dialogVisible.value = false;
    resetForm();
    await load();
  } catch (_) { markUncertain(); }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value || deleteIssue.value || loading.value || loadError.value) return;
  deletingId.value = item._id;
  try {
    await ElMessageBox.confirm('确定删除这条饭后回忆吗？', '删除确认');
    await api.memory.delete(item._id);
    ElMessage.success('已删除');
    await load();
  } catch (e) { if (e !== 'cancel' && e !== 'close') deleteIssue.value = '删除结果未确认，请重新加载并核对后再操作。'; }
  finally { deletingId.value = ''; }
};
onMounted(() => { window.addEventListener('keydown', onPhotoKey); load(); });
onBeforeUnmount(() => { alive = false; memorySequence++; mealSequence++; if (mealTimer) clearTimeout(mealTimer); window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="memory-page">
    <div class="page-header">
      <div><span class="eyebrow">AFTER THE MEAL · 饭后时光</span><h1>饭后回忆</h1><p>把每一餐后的心情、照片和小故事留下来。</p></div>
      <el-button type="primary" :disabled="loading || !!loadError || !!deletingId || !!deleteIssue" @click="dialogVisible = true"><el-icon><Plus /></el-icon>记录一餐</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
    <el-alert v-if="deleteIssue" type="warning" :closable="false" show-icon :title="deleteIssue"><el-button link type="primary" :loading="loading" @click="load">重新加载并核对</el-button></el-alert>

    <div v-loading="loading" class="timeline">
      <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载回忆：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
      <el-empty v-else-if="!loading && !memories.length" description="还没有饭后回忆" />
      <p v-if="!loading && !loadError && memories.length >= 200" class="timeline-note">当前显示最近 200 条回忆，其他照片可在饭桌相册中按月查看。</p>
      <section v-for="(items, date) in (loadError ? {} : grouped)" :key="date" class="day-group">
        <h2>{{ date }}</h2>
        <div class="memory-grid">
          <el-card v-for="item in items" :key="item._id" class="memory-card">
            <div class="memory-top"><el-tag>{{ mealTypeText[item.mealType] || item.mealType }}</el-tag><el-button type="danger" link :disabled="!!deletingId || saving || !!deleteIssue" :aria-label="`删除${item.title || '这条回忆'}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div>
            <h3>{{ item.title || '温馨一餐' }}</h3>
            <p>{{ item.note || '没有文字，也是一段回忆。' }}</p>
            <div class="meta"><span>{{ item.mood || '日常' }}</span><el-rate :model-value="item.rating || 0" disabled size="small" /></div>
            <div v-if="item.photos?.length" class="photos"><button v-for="(photo, index) in item.photos" :key="`${index}-${photo}`" type="button" class="memory-photo" :aria-label="`查看${item.title || '回忆'}的第 ${index + 1} 张照片`" @click="openMemoryPhoto(item, index)"><img :src="imageFor(photo)" alt="" @error="imageError" /></button></div>
            <div class="meal-names"><el-tag v-for="meal in item.mealIds || []" :key="meal._id" effect="plain">{{ meal.name }}</el-tag></div>
          </el-card>
        </div>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" title="记录饭后回忆" width="min(560px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <CreateRecoveryNotice v-if="saveUncertain" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="日期"><el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="餐次"><el-select v-model="form.mealType"><el-option v-for="(label, key) in mealTypeText" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="相关菜品"><el-select v-model="form.mealIds" multiple filterable remote reserve-keyword :remote-method="searchMeals" :loading="mealLoading" aria-label="搜索相关菜品" placeholder="搜索菜名或食材" @visible-change="openMealOptions" @change="rememberMeals"><el-option v-for="meal in mealOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select><small v-if="!mealError && mealTotal > 50" class="meal-help">仅显示前 50 道，请输入菜名或食材缩小范围。</small><el-alert v-if="mealError" type="warning" :closable="false" show-icon :title="`菜品暂时无法加载：${mealError}`"><el-button link type="primary" @click="searchMealCatalog">重试</el-button></el-alert></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="比如：周五晚上的番茄牛腩" /></el-form-item>
        <el-form-item label="心情"><el-input v-model="form.mood" placeholder="开心、满足、想再吃一次..." /></el-form-item>
        <el-form-item label="评分"><el-rate v-model="form.rating" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="4" /></el-form-item>
        <el-form-item label="照片"><el-upload action="#" :accept="photoAccept" :auto-upload="false" :disabled="saving || saveUncertain" multiple list-type="picture-card" v-model:file-list="photoFiles" :on-change="handlePhotoChange"><el-icon><Picture /></el-icon></el-upload></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || loading || !!loadError || !!deleteIssue" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog :model-value="!!viewedPhoto" title="饭后照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) viewedPhoto = null }"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.photos[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.photos[viewedPhoto.index])" :alt="viewedPhoto.title" @error="imageError" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张回忆照片" @click="moveMemoryPhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.photos.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.photos.length - 1" aria-label="下一张回忆照片" @click="moveMemoryPhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.memory-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2, h3 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}
.page-header p { color: var(--text-secondary); margin: 6px 0 0; }
.day-group { display: flex; flex-direction: column; gap: 12px; }
.memory-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr)); gap: 14px; }
.memory-top, .meta, .meal-names { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.memory-card p { color: var(--text-secondary); white-space: pre-wrap; }
.photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 10px; }
.memory-photo { padding: 0; border: 0; border-radius: 8px; background: var(--bg-secondary); cursor: pointer; }
.memory-photo:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.photos img { display: block; width: 100%; height: 90px; object-fit: cover; border-radius: 8px; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.meal-help { color: var(--text-secondary); line-height: 1.5; }
.timeline-note { color: var(--text-secondary); font-size: 13px; }
.meal-names { justify-content: flex-start; flex-wrap: wrap; margin-top: 10px; }
@media (max-width: 640px) { .page-header { flex-direction: column; align-items: stretch; } }
</style>
