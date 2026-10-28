<script setup>
import { computed, nextTick, onMounted, onBeforeUnmount, ref } from 'vue';
import api from '@/services/api';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const loading = ref(false);
const now = new Date();
const month = ref(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
const data = ref({ photos: [], total: 0 });
const page = ref(1);
const loadedPage = ref(1);
const pageSize = 24;
const selectedIndex = ref(null);
const photoGrid = ref(null);
const retryButton = ref(null);
const previousMonthButton = ref(null);
const returnFocusIndex = ref(null);
let viewerEpoch = 0;
let focusAfterLoad = false;
const selected = computed(() => selectedIndex.value === null ? null : data.value.photos[selectedIndex.value] || null);
const lastPage = computed(() => Math.max(1, Math.ceil(data.value.total / pageSize)));
const photoPosition = computed(() => selectedIndex.value === null ? 0 : (loadedPage.value - 1) * pageSize + selectedIndex.value + 1);
const loadError = ref('');
let loadSequence = 0;
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '其它' };
const focusPhoto = (onlyIfUnfocused = false) => {
  if (loading.value || selectedIndex.value !== null || returnFocusIndex.value === null) return;
  if (onlyIfUnfocused && document.activeElement && document.activeElement !== document.body && document.activeElement.isConnected) return;
  if (loadError.value) retryButton.value?.$el?.focus();
  else (photoGrid.value?.querySelectorAll('.photo-card')[returnFocusIndex.value] || previousMonthButton.value?.$el)?.focus();
};
const schedulePhotoFocus = async () => { await nextTick(); focusPhoto(); };
const openPhoto = index => { viewerEpoch++; returnFocusIndex.value = index; selectedIndex.value = index; };
const closeViewer = () => {
  if (selectedIndex.value === null) return;
  returnFocusIndex.value = selectedIndex.value;
  viewerEpoch++;
  selectedIndex.value = null;
  if (loading.value) focusAfterLoad = true;
};
const load = async (openAt = null, viewerToken = null) => {
  if (!month.value) return;
  const requestedMonth = month.value;
  const requestedPage = page.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await api.photoAlbum.month(requestedMonth, { page: requestedPage, limit: pageSize });
    if (sequence !== loadSequence || month.value !== requestedMonth || page.value !== requestedPage) return;
    if (!result || result.month !== requestedMonth || !Array.isArray(result.photos) || result.photos.some(item => typeof item?.photo !== 'string' || !item.photo || !item.memoryId || typeof item.date !== 'string' || !item.date.startsWith(`${requestedMonth}-`))) throw new Error('相册数据不完整');
    let rows = result.photos;
    let total = result.total;
    if (result.page == null && result.limit == null) {
      total = rows.length;
      rows = rows.slice((requestedPage - 1) * pageSize, requestedPage * pageSize);
    } else if (!Number.isSafeInteger(total) || total < 0 || result.page !== requestedPage || result.limit !== pageSize || rows.length > pageSize || rows.length > total) throw new Error('相册分页数据不完整');
    const finalPage = Math.max(1, Math.ceil(total / pageSize));
    if (requestedPage > finalPage) { page.value = finalPage; return load(openAt, viewerToken); }
    if (rows.length !== Math.min(pageSize, Math.max(0, total - (requestedPage - 1) * pageSize))) throw new Error('相册分页数据不完整');
    data.value = { photos: rows, total };
    loadedPage.value = requestedPage;
    const target = rows.length && ['first', 'last'].includes(openAt) ? (openAt === 'last' ? rows.length - 1 : 0) : null;
    if (target !== null && viewerToken !== viewerEpoch) { selectedIndex.value = null; returnFocusIndex.value = target; focusAfterLoad = true; }
    else selectedIndex.value = target;
  } catch(e) {
    if (sequence === loadSequence && month.value === requestedMonth) { if (openAt) focusAfterLoad = true; data.value = { photos: [], total: 0 }; selectedIndex.value = null; loadError.value = e?.error || e?.message || '加载饭桌相册失败'; }
  } finally {
    if (sequence === loadSequence) {
      loading.value = false;
      if (focusAfterLoad) { focusAfterLoad = false; await nextTick(); if (sequence === loadSequence) focusPhoto(true); }
    }
  }
};
const changeMonth = () => { page.value = 1; selectedIndex.value = null; data.value = { photos: [], total: 0 }; load(); };
const moveMonth = offset => {
  if (loading.value) return;
  const [year, currentMonth] = month.value.split('-').map(Number);
  const next = new Date(year, currentMonth - 1 + offset, 1);
  month.value = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
  changeMonth();
};
const changePage = next => { if (loading.value || next < 1 || next > lastPage.value) return; page.value = next; selectedIndex.value = null; load(); };
const navigatePhoto = async direction => {
  if (loading.value || selectedIndex.value === null) return;
  const next = selectedIndex.value + direction;
  if (next >= 0 && next < data.value.photos.length) { selectedIndex.value = next; return; }
  const targetPage = page.value + direction;
  if (targetPage < 1 || targetPage > lastPage.value) return;
  page.value = targetPage;
  await load(direction < 0 ? 'last' : 'first', viewerEpoch);
};
const onKey = event => {
  if (!selected.value || loading.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  navigatePhoto(event.key === 'ArrowLeft' ? -1 : 1);
};
const imageFor = item => resolveUploadedImage(item.photo) || placeholder;
const imageError = event => { if (event.target.dataset.fallback !== '1') { event.target.dataset.fallback = '1'; event.target.src = placeholder; event.target.alt = '图片暂不可用'; } };
onMounted(load);
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => { loadSequence++; window.removeEventListener('keydown', onKey); });
</script>

<template>
  <div class="album-page" v-loading="loading" element-loading-text="正在加载照片" :aria-busy="loading ? 'true' : 'false'">
    <div class="page-header"><div><span class="eyebrow">TABLE STORIES · 饭桌故事</span><h1>饭桌相册</h1><p>把饭后回忆里的照片按月份收起来。</p><span v-if="!loading && !loadError" class="photo-count">{{ month }} · {{ data.total }} 张照片</span></div><div class="month-actions"><el-button ref="previousMonthButton" :disabled="loading" aria-label="上个月" @click="moveMonth(-1)">上个月</el-button><el-date-picker v-model="month" type="month" value-format="YYYY-MM" :clearable="false" :disabled="loading" aria-label="选择相册月份" @change="changeMonth" /><el-button :disabled="loading" aria-label="下个月" @click="moveMonth(1)">下个月</el-button></div></div>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`相册暂时无法加载：${loadError}`"><el-button ref="retryButton" link type="primary" @click="load">重新加载</el-button></el-alert>
    <el-empty v-else-if="!loading && !data.photos.length" description="这个月还没有饭桌照片" />
    <template v-else-if="!loading"><div ref="photoGrid" class="album-grid"><button v-for="(item, index) in data.photos" :key="`${item.memoryId}-${item.photoIndex ?? index}-${item.photo}`" class="photo-card" type="button" :aria-label="`查看${item.date} ${item.title || '饭桌照片'}，第 ${(page - 1) * pageSize + index + 1} 张`" @click="openPhoto(index)"><img :src="imageFor(item)" :alt="item.title || item.date" @error="imageError" /><span>{{ item.date }} · {{ mealTypeText[item.mealType] || '一餐' }}</span></button></div><div v-if="data.total > pageSize" class="pagination"><el-button :disabled="loading || page <= 1" @click="changePage(page - 1)">上一页</el-button><span>第 {{ page }} / {{ lastPage }} 页</span><el-button :disabled="loading || page >= lastPage" @click="changePage(page + 1)">下一页</el-button></div></template>
    <el-dialog :model-value="!!selected" title="饭桌回忆" width="min(680px, 92vw)" @update:model-value="val => { if (!val) closeViewer() }" @close="closeViewer" @close-auto-focus="schedulePhotoFocus"><template v-if="selected"><img :key="`${selected.memoryId}-${selected.photoIndex ?? selectedIndex}-${selected.photo}`" class="preview" :src="imageFor(selected)" :alt="selected.title || '饭桌照片'" @error="imageError" /><div class="viewer-nav"><el-button :disabled="loading || photoPosition <= 1" aria-label="上一张照片" @click="navigatePhoto(-1)">上一张</el-button><span aria-live="polite">{{ photoPosition }} / {{ data.total }}</span><el-button :disabled="loading || photoPosition >= data.total" aria-label="下一张照片" @click="navigatePhoto(1)">下一张</el-button></div><h3>{{ selected.title || selected.date }}</h3><p>{{ selected.date }} · {{ mealTypeText[selected.mealType] || '一餐' }} · {{ selected.mood || '日常心情' }}</p><div class="meal-tags"><el-tag v-for="meal in selected.meals || []" :key="meal._id || meal.id">{{ meal.name }}</el-tag></div><p class="note">{{ selected.note }}</p><el-rate :model-value="selected.rating || 0" disabled /><div class="memory-link"><router-link :to="{ name: 'memories', query: { edit: selected.memoryId } }">编辑这条饭后回忆 →</router-link></div></template></el-dialog>
  </div>
</template>

<style scoped>
.album-page{--album-accent-ink:color-mix(in srgb,var(--secondary-color) 45%,#33211a);display:flex;flex-direction:column;gap:18px}.page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:26px;padding:clamp(22px,3vw,36px);box-shadow:0 12px 28px var(--shadow-color)}h1,h3{margin:0;color:var(--text-primary)}h1{margin-top:8px;font-family:Georgia,'Songti SC',serif;font-size:clamp(26px,3vw,36px)}.eyebrow{color:var(--album-accent-ink);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.note{color:var(--text-secondary)}.photo-count{display:inline-block;color:var(--text-secondary);font-size:13px;border:1px solid var(--border-light);border-radius:999px;padding:5px 10px}.month-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.month-actions .el-button{margin:0}.album-grid{columns:4 220px;column-gap:14px}.photo-card{break-inside:avoid;width:100%;margin:0 0 14px;padding:10px;border:1px solid var(--border-light);border-radius:18px;background:var(--bg-primary);box-shadow:0 10px 28px var(--shadow-color);cursor:pointer;text-align:left;color:var(--text-primary);transition:transform .2s ease,box-shadow .2s ease}.photo-card:hover{transform:translateY(-2px) scale(1.01)}.photo-card:focus-visible{outline:2px solid var(--secondary-color);outline-offset:3px}.photo-card img{width:100%;border-radius:14px;display:block;margin-bottom:8px;min-height:100px;object-fit:cover;background:var(--bg-secondary)}.photo-card span{font-size:13px;color:var(--text-secondary)}.preview{width:100%;max-height:420px;object-fit:contain;border-radius:16px;background:var(--bg-secondary)}.meal-tags{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.note{white-space:pre-wrap;overflow-wrap:anywhere}.memory-link{margin-top:14px}.memory-link a{color:var(--secondary-color);font-weight:700}.pagination,.viewer-nav{display:flex;align-items:center;justify-content:center;gap:12px;color:var(--text-secondary);font-size:13px}.viewer-nav{margin:12px 0}.pagination .el-button,.viewer-nav .el-button{margin:0}:global(html.dark .album-page){--album-accent-ink:var(--secondary-color)}@media(max-width:700px){.page-header{flex-direction:column;align-items:stretch}.album-grid{columns:2 150px}.month-actions .el-button,.pagination .el-button,.viewer-nav .el-button{min-height:44px}}
.memory-link a { color: var(--text-primary); text-decoration: underline; text-underline-offset: 3px; }
</style>
