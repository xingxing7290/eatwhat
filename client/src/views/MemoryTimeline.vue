<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture, Edit } from '@element-plus/icons-vue';
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
const editing = ref(null);
const editIssue = ref('');
const editReviewed = ref(false);
const checkingEdit = ref(false);
const latestEdit = ref(null);
const latestError = ref('');
const linkedId = ref('');
const linkedError = ref('');
const linkedLoading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const photoFiles = ref([]);
const viewedPhoto = ref(null);
const localToday = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const form = reactive({ date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', actualCookTime: 0, nextImprovement: '', mealIds: [], existingPhotos: [] });
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value || photoFiles.value.length > 0);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => resetForm(), reopen: () => { dialogVisible.value = true; }, label: '回忆' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || reviewing.value || deciding.value || checkingEdit.value || linkedLoading.value || !!deletingId.value);
const uncertain = computed(() => saveUncertain.value || !!editIssue.value);
useDraftGuard({ dirty, busy, uncertain, label: '饭后回忆' });
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
const validVersion = item => item?.supportsConditionalEdit === true && item.editVersion &&
  (item.editVersion.revision === null || (typeof item.editVersion.revision === 'string' && !!item.editVersion.revision && item.editVersion.revision.length <= 128)) &&
  (item.editVersion.updatedAt === null || (typeof item.editVersion.updatedAt === 'string' && Number.isFinite(Date.parse(item.editVersion.updatedAt))));
const canDelete = item => item?.supportsConditionalDelete === true && validVersion(item);
const deleteBlocked = computed(() => saveUncertain.value || !!editIssue.value || (!!editing.value && dirty.value));
const legacyDeleteWarning = computed(() => memories.value.some(item => !canDelete(item)));
const sameVersion = (left, right) => !!left && !!right && left.revision === right.revision && left.updatedAt === right.updatedAt;
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
  Object.assign(form, { date: localToday(), mealType: 'dinner', title: '', mood: '', rating: 0, note: '', actualCookTime: 0, nextImprovement: '', mealIds: [], existingPhotos: [] });
  photoFiles.value = [];
  selectedMeals.value = [];
  editing.value = null; editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const fillEdit = item => {
  if (!(item?._id || item?.id) || !validVersion(item) || typeof item.date !== 'string' || !Object.prototype.hasOwnProperty.call(mealTypeText, item.mealType) || !Array.isArray(item.photos) || item.photos.some(photo => typeof photo !== 'string') || !Array.isArray(item.mealIds) || item.mealIds.some(meal => !mealId(meal) || typeof meal.name !== 'string')) throw new Error('回忆数据或版本不完整，请刷新后重试');
  Object.assign(form, { date: item.date, mealType: item.mealType, title: item.title || '', mood: item.mood || '', rating: item.rating || 0, note: item.note || '', actualCookTime: item.actualCookTime || 0, nextImprovement: item.nextImprovement || '', mealIds: item.mealIds.map(mealId), existingPhotos: [...item.photos] });
  selectedMeals.value = [...item.mealIds]; photoFiles.value = [];
  editing.value = { id: String(item._id || item.id), version: { ...item.editVersion } };
  editIssue.value = ''; editReviewed.value = false; latestEdit.value = null; latestError.value = '';
  initialForm.value = JSON.stringify(form);
};
const confirmReplaceDraft = async () => {
  if (!dirty.value) return true;
  try { await ElMessageBox.confirm('切换回忆会丢失当前未保存的内容和所选照片。', '放弃当前草稿？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续编辑' }); return true; } catch (_) { return false; }
};
const startCreate = async () => {
  if (busy.value || deleteIssue.value) return;
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (editing.value) { if (!await confirmReplaceDraft()) return; resetForm(); }
  dialogVisible.value = true;
};
const startEdit = async item => {
  if (busy.value || deleteIssue.value || saveUncertain.value) return;
  if (editing.value?.id === String(item._id || item.id)) { dialogVisible.value = true; return; }
  if (editIssue.value) return ElMessage.warning('请先核对当前编辑结果');
  if (!validVersion(item)) return ElMessage.warning('服务器未提供有效的回忆版本，暂时无法安全编辑');
  if (!await confirmReplaceDraft()) return;
  try { fillEdit(item); dialogVisible.value = true; } catch (e) { ElMessage.warning(e.message); }
};
const checkLatest = async () => {
  if (!editing.value || checkingEdit.value) return;
  checkingEdit.value = true; editReviewed.value = false; latestError.value = ''; latestEdit.value = null;
  try {
    const item = await api.memory.get(editing.value.id);
    if (!item || String(item._id || item.id) !== editing.value.id || !validVersion(item)) throw new Error('最新回忆数据或版本不完整');
    latestEdit.value = item; editReviewed.value = true;
  } catch (e) {
    if (e?.code === 'MEMORY_NOT_FOUND') editReviewed.value = true;
    else latestError.value = e?.error || e?.message || '无法读取最新回忆，请重试';
  } finally { checkingEdit.value = false; }
};
const reloadLatest = async () => {
  if (!editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value)) return;
  try { await ElMessageBox.confirm('载入最新回忆会放弃当前草稿和所选照片。', '重新载入最新内容？', { type: 'warning', confirmButtonText: '放弃草稿并载入', cancelButtonText: '继续保留草稿' }); } catch (_) { return; }
  try { fillEdit(latestEdit.value); } catch (e) { ElMessage.warning(e.message); }
};
const retryEdit = async () => {
  if (editIssue.value !== 'unknown' || !editReviewed.value || !latestEdit.value || !validVersion(latestEdit.value) || !sameVersion(editing.value?.version, latestEdit.value.editVersion)) return;
  try { await ElMessageBox.confirm('核对时版本尚未变化；先前请求仍可能稍后完成。重试使用相同版本，只有一个请求可以成功。', '确认重新提交？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); editIssue.value = ''; editReviewed.value = false; } catch (_) {}
};
const discardEditDraft = async () => {
  if (!editing.value || !editReviewed.value) return;
  try { await ElMessageBox.confirm('将放弃本页编辑草稿与所选照片，不会删除服务器上的回忆。', '放弃编辑草稿？', { type: 'warning', confirmButtonText: '确认放弃草稿', cancelButtonText: '继续核对' }); } catch (_) { return; }
  resetForm(); dialogVisible.value = false;
};
const openLinkedMemory = async id => {
  if (!id || linkedLoading.value || uncertain.value) return;
  if (!await confirmReplaceDraft()) return;
  linkedId.value = id; linkedLoading.value = true; linkedError.value = '';
  try {
    const item = await api.memory.get(id);
    if (!alive) return;
    if (!item || String(item._id || item.id) !== id) throw new Error('回忆数据不完整');
    fillEdit(item); dialogVisible.value = true; linkedId.value = '';
  } catch (e) { if (alive) linkedError.value = e?.error || e?.message || '无法打开这条回忆'; }
  finally { if (alive) linkedLoading.value = false; }
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
    if (typeof route.query.edit === 'string' && route.query.edit) {
      const requestedId = route.query.edit;
      await openLinkedMemory(requestedId);
      if (!alive || sequence !== memorySequence) return;
      await router.replace({ name: 'memories' });
      return;
    }
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
  if (saving.value || saveUncertain.value || editIssue.value || reviewing.value || loading.value || loadError.value || deleteIssue.value) return;
  try {
    const invalidPhoto = photoFiles.value.find(file => !isSupportedPhoto(file.raw || file));
    if (invalidPhoto) {
      const reason = photoValidationError(invalidPhoto.raw || invalidPhoto);
      logRejectedPhoto(invalidPhoto, reason);
      ElMessage.warning(reason === 'size' ? '\u56fe\u7247\u4e0d\u80fd\u8d85\u8fc7 5MB' : '\u8bf7\u4e0a\u4f20 jpg\u3001png\u3001gif\u3001webp \u56fe\u7247');
      return;
    }
    if (photoFiles.value.length > 12) return ElMessage.warning('每次最多上传 12 张照片');
    saving.value = true;
    const fd = new FormData();
    const original = editing.value ? JSON.parse(initialForm.value) : null;
    Object.entries(form).forEach(([key, value]) => {
      if (!editing.value && key === 'existingPhotos') return;
      if (editing.value && JSON.stringify(value) === JSON.stringify(original[key])) return;
      fd.append(key, Array.isArray(value) ? JSON.stringify(value) : value);
    });
    if (editing.value) fd.append('expectedEditVersion', JSON.stringify(editing.value.version));
    photoFiles.value.forEach(file => fd.append('photos', file.raw || file));
    const result = editing.value ? await api.memory.update(editing.value.id, fd) : await api.memory.create(fd);
    if (!result?._id && !result?.id) throw new Error('保存响应不完整');
    if (editing.value && (String(result._id || result.id) !== editing.value.id || !validVersion(result))) throw new Error('保存响应不完整');
    ElMessage.success('回忆已保存');
    dialogVisible.value = false;
    resetForm();
    await load();
  } catch (e) {
    if (editing.value) { editIssue.value = e?.code === 'MEMORY_CONFLICT' ? 'conflict' : 'unknown'; editReviewed.value = false; latestEdit.value = null; latestError.value = ''; }
    else markUncertain();
  }
  finally { saving.value = false; }
};
const remove = async (item) => {
  if (deletingId.value || saving.value || deleteIssue.value || loading.value || loadError.value || deleteBlocked.value) return;
  if (!canDelete(item)) return ElMessage.warning('服务器未提供安全删除能力，请稍后重试');
  deletingId.value = item._id;
  try {
    await ElMessageBox.confirm('确定删除这条饭后回忆吗？', '删除确认');
    await api.memory.delete(item._id, item.editVersion);
    if (editing.value?.id === String(item._id)) resetForm();
    ElMessage.success('已删除');
    await load();
  } catch (e) { if (e !== 'cancel' && e !== 'close') deleteIssue.value = e?.code === 'MEMORY_CONFLICT' ? '回忆已被修改或删除，本次未删除；请重新加载并核对。' : '删除结果未确认，请重新加载并核对后再操作。'; }
  finally { deletingId.value = ''; }
};
onMounted(() => { window.addEventListener('keydown', onPhotoKey); load(); });
onBeforeUnmount(() => { alive = false; memorySequence++; mealSequence++; if (mealTimer) clearTimeout(mealTimer); window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="memory-page">
    <div class="page-header">
      <div><span class="eyebrow">AFTER THE MEAL · 饭后时光</span><h1>饭后回忆</h1><p>把每一餐后的心情、照片和小故事留下来。</p></div>
      <el-button type="primary" :disabled="loading || !!loadError || !!deletingId || !!deleteIssue || !!editIssue" @click="startCreate"><el-icon><Plus /></el-icon>记录一餐</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
    <el-alert v-if="linkedError" type="warning" :closable="false" show-icon :title="`无法打开相册关联的回忆：${linkedError}`"><el-button link type="primary" :loading="linkedLoading" @click="openLinkedMemory(linkedId)">重新打开</el-button><el-button link @click="linkedError = ''; linkedId = ''">关闭提示</el-button></el-alert>
    <el-alert v-if="editing && !dialogVisible" type="info" :closable="false" show-icon :title="editIssue ? '编辑结果需要核对，草稿仍保留在本页。' : '编辑草稿仍保留在本页。'"><el-button link type="primary" @click="dialogVisible = true">继续编辑</el-button></el-alert>
    <el-alert v-if="deleteIssue" type="warning" :closable="false" show-icon :title="deleteIssue"><el-button link type="primary" :loading="loading" @click="load">重新加载并核对</el-button></el-alert>
    <el-alert v-if="!loading && !loadError && legacyDeleteWarning" type="info" :closable="false" show-icon title="服务器未提供安全删除能力，暂不能删除部分回忆。" />

    <div v-loading="loading" class="timeline">
      <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载回忆：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
      <el-empty v-else-if="!loading && !memories.length" description="还没有饭后回忆" />
      <p v-if="!loading && !loadError && memories.length >= 200" class="timeline-note">当前显示最近 200 条回忆，其他照片可在饭桌相册中按月查看。</p>
      <section v-for="(items, date) in (loadError ? {} : grouped)" :key="date" class="day-group">
        <h2>{{ date }}</h2>
        <div class="memory-grid">
          <el-card v-for="item in items" :key="item._id" class="memory-card">
            <div class="memory-top"><el-tag>{{ mealTypeText[item.mealType] || item.mealType }}</el-tag><div class="card-actions"><el-button type="primary" link :disabled="!!deletingId || saving || !!deleteIssue || !!saveUncertain || (!!editIssue && editing?.id !== String(item._id || item.id))" :aria-label="`编辑${item.title || '这条回忆'}`" @click="startEdit(item)"><el-icon><Edit /></el-icon>编辑</el-button><el-button type="danger" link :disabled="!!deletingId || saving || !!deleteIssue || deleteBlocked || !canDelete(item)" :aria-label="`删除${item.title || '这条回忆'}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div>
            <h3>{{ item.title || '温馨一餐' }}</h3>
            <p>{{ item.note || '没有文字，也是一段回忆。' }}</p>
            <div class="meta"><span>{{ item.mood || '日常' }}</span><el-rate :model-value="item.rating || 0" disabled size="small" /></div>
            <p v-if="item.actualCookTime || item.nextImprovement" class="cooking-note"><span v-if="item.actualCookTime">用时 {{ item.actualCookTime }} 分钟</span><span v-if="item.nextImprovement">下次改进：{{ item.nextImprovement }}</span></p>
            <div v-if="item.photos?.length" class="photos"><button v-for="(photo, index) in item.photos" :key="`${index}-${photo}`" type="button" class="memory-photo" :aria-label="`查看${item.title || '回忆'}的第 ${index + 1} 张照片`" @click="openMemoryPhoto(item, index)"><img :src="imageFor(photo)" alt="" @error="imageError" /></button></div>
            <div class="meal-names"><el-tag v-for="meal in item.mealIds || []" :key="meal._id" effect="plain">{{ meal.name }}</el-tag></div>
          </el-card>
        </div>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑饭后回忆' : '记录饭后回忆'" width="min(560px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <CreateRecoveryNotice v-if="saveUncertain" label="回忆" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-alert v-if="editIssue" type="warning" :closable="false" show-icon :title="editIssue === 'conflict' ? '回忆已被修改或删除，本次未保存。' : '编辑结果未确认，请先核对最新回忆。'">
        <p>你的草稿和所选照片仍在本页。载入最新内容会放弃当前草稿。</p>
        <el-button link type="primary" :loading="checkingEdit" @click="checkLatest">读取最新回忆并核对</el-button>
        <p v-if="latestError">{{ latestError }}</p>
        <div v-if="editReviewed" class="latest-summary">
          <template v-if="latestEdit"><strong>{{ latestEdit.title || '温馨一餐' }} · {{ latestEdit.date }}</strong><p>{{ mealTypeText[latestEdit.mealType] || latestEdit.mealType }} · {{ latestEdit.mood || '日常' }} · {{ latestEdit.rating || 0 }} 分 · {{ latestEdit.photos?.length || 0 }} 张照片</p><p>{{ latestEdit.note || '无备注' }}</p><p>菜品：{{ (latestEdit.mealIds || []).map(meal => meal.name).join('、') || '未关联' }}</p><p v-if="latestEdit.actualCookTime || latestEdit.nextImprovement">用时 {{ latestEdit.actualCookTime || 0 }} 分钟 · {{ latestEdit.nextImprovement || '无改进记录' }}</p><el-button link type="primary" @click="reloadLatest">放弃草稿并载入最新</el-button><el-button v-if="editIssue === 'unknown' && sameVersion(editing?.version, latestEdit.editVersion)" link type="primary" @click="retryEdit">已核对，允许重试</el-button></template>
          <p v-else>这条回忆已不存在或不属于当前家庭。</p>
          <el-button link type="danger" @click="discardEditDraft">放弃编辑草稿</el-button>
        </div>
      </el-alert>
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="日期"><el-date-picker v-model="form.date" value-format="YYYY-MM-DD" type="date" /></el-form-item>
        <el-form-item label="餐次"><el-select v-model="form.mealType"><el-option v-for="(label, key) in mealTypeText" :key="key" :label="label" :value="key" /></el-select></el-form-item>
        <el-form-item label="相关菜品"><el-select v-model="form.mealIds" multiple filterable remote reserve-keyword :remote-method="searchMeals" :loading="mealLoading" aria-label="搜索相关菜品" placeholder="搜索菜名或食材" @visible-change="openMealOptions" @change="rememberMeals"><el-option v-for="meal in mealOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select><small v-if="!mealError && mealTotal > 50" class="meal-help">仅显示前 50 道，请输入菜名或食材缩小范围。</small><el-alert v-if="mealError" type="warning" :closable="false" show-icon :title="`菜品暂时无法加载：${mealError}`"><el-button link type="primary" @click="searchMealCatalog">重试</el-button></el-alert></el-form-item>
        <el-form-item label="标题"><el-input v-model="form.title" placeholder="比如：周五晚上的番茄牛腩" /></el-form-item>
        <el-form-item label="心情"><el-input v-model="form.mood" placeholder="开心、满足、想再吃一次..." /></el-form-item>
        <el-form-item label="评分"><el-rate v-model="form.rating" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="4" /></el-form-item>
        <el-form-item label="实际烹饪时间（分钟）"><el-input-number v-model="form.actualCookTime" :min="0" :precision="0" /></el-form-item>
        <el-form-item label="下次改进"><el-input v-model="form.nextImprovement" type="textarea" rows="2" placeholder="下次想调整什么？" /></el-form-item>
        <el-form-item label="照片"><div v-if="editing && form.existingPhotos.length" class="existing-photos"><div v-for="(photo, index) in form.existingPhotos" :key="`${index}-${photo}`" class="existing-photo"><img :src="imageFor(photo)" :alt="`已有照片 ${index + 1}`" @error="imageError" /><el-button size="small" type="danger" plain :aria-label="`移除已有照片 ${index + 1}`" @click="form.existingPhotos.splice(index, 1)">移除</el-button></div></div><el-upload action="#" :accept="photoAccept" :limit="12" :on-exceed="() => ElMessage.warning('每次最多上传 12 张照片')" :auto-upload="false" :disabled="saving || saveUncertain" multiple list-type="picture-card" v-model:file-list="photoFiles" :on-change="handlePhotoChange"><el-icon><Picture /></el-icon></el-upload><small class="meal-help">每次最多上传 12 张 JPG、PNG、GIF 或 WebP，单张不超过 5MB。移除已有照片需保存才生效。</small></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || !!editIssue || loading || !!loadError || !!deleteIssue" :loading="saving" @click="save">保存</el-button></template>
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
.card-actions { display: flex; align-items: center; flex-shrink: 0; }
.card-actions .el-button + .el-button { margin-left: 10px; }
.cooking-note { display: flex; flex-direction: column; gap: 4px; font-size: 13px; }
.latest-summary { margin-top: 8px; padding: 12px; border-radius: 10px; background: var(--bg-primary); overflow-wrap: anywhere; }
.latest-summary p { margin: 6px 0; }
.existing-photos { display: flex; flex-wrap: wrap; gap: 10px; width: 100%; margin-bottom: 12px; }
.existing-photo { display: grid; gap: 6px; width: 90px; }
.existing-photo img { width: 90px; height: 72px; border-radius: 8px; object-fit: cover; }
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
