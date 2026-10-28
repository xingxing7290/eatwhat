<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowLeft, Edit, Star, Clock, Bowl, Picture, Check, Warning } from '@element-plus/icons-vue';
import api from '@/services/api';
import defaultImage from '@/assets/meal-placeholder.svg';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import { useDraftGuard } from '@/composables/useDraftGuard';

const route = useRoute();
const router = useRouter();
const meal = ref(null);
const memories = ref([]);
const loading = ref(false);
const memoryLoading = ref(false);
const mealError = ref('');
const memoryError = ref('');
const reporting = ref(false);
const reportUncertain = ref(false);
const reportSubmitted = ref(false);
const reportChecked = ref(false);
const reportChecking = ref(false);
const reportMatches = ref(0);
const reportListTruncated = ref(false);
const reportError = ref('');
const viewedPhoto = ref(null);
let loadSequence = 0;
let memorySequence = 0;
let reportSequence = 0;
const reportBusy = computed(() => reporting.value || reportChecking.value);
const noDraft = ref(false);
useDraftGuard({ dirty: noDraft, busy: reportBusy, uncertain: reportUncertain, label: '图片反馈' });

const totalTime = computed(() => Number(meal.value?.prepTime || 0) + Number(meal.value?.cookTime || 0));
const difficultyText = computed(() => ({ easy: '简单', medium: '适中', hard: '费工夫' }[meal.value?.difficulty] || '未设置'));
const imageFor = value => resolveUploadedImage(value) || defaultImage;
const coverImage = computed(() => imageFor(meal.value?.imageUrl));
const photos = computed(() => Array.isArray(meal.value?.photos) ? meal.value.photos.filter(photo => typeof photo === 'string' && photo) : []);
const doneOnce = () => {
  if (!meal.value) return;
  router.push({ name: 'memories', query: { new: '1', mealId: meal.value._id || meal.value.id } });
};
const reportImageIssue = async () => {
  if (!meal.value || reporting.value || reportUncertain.value || reportSubmitted.value || reportChecking.value) return;
  const id = String(meal.value._id || meal.value.id);
  const sequence = ++reportSequence;
  reporting.value = true;
  try {
    const result = await api.mealImageIssue.create({ mealId: id, issueType: 'wrong_image', note: '这张图片和菜名不匹配' });
    if (sequence !== reportSequence) return;
    const reportedMeal = typeof result?.mealId === 'string' ? result.mealId : result?.mealId?._id || result?.mealId?.id;
    if (!(result?._id || result?.id) || String(reportedMeal || '') !== id) throw new Error('反馈响应不完整');
    reportSubmitted.value = true;
    ElMessage.success('已加入待修正图片列表');
  } catch (_) { if (sequence === reportSequence) { reportUncertain.value = true; reportChecked.value = false; reportError.value = ''; } }
  finally { if (sequence === reportSequence) reporting.value = false; }
};
const checkReports = async () => {
  if (!meal.value || !reportUncertain.value || reportChecking.value) return;
  const id = String(meal.value._id || meal.value.id);
  const sequence = ++reportSequence;
  reportChecking.value = true; reportChecked.value = false; reportError.value = '';
  try {
    const result = await api.mealImageIssue.list({ status: 'open' });
    if (sequence !== reportSequence) return;
    if (!Array.isArray(result)) throw new Error('反馈列表不完整');
    reportMatches.value = result.filter(issue => {
      const issueMeal = typeof issue?.mealId === 'string' ? issue.mealId : issue?.mealId?._id || issue?.mealId?.id;
      return String(issueMeal || '') === id && issue?.issueType === 'wrong_image';
    }).length;
    reportListTruncated.value = result.length >= 200;
    reportChecked.value = true;
  } catch (e) { if (sequence === reportSequence) reportError.value = e?.error || e?.message || '无法读取反馈列表'; }
  finally { if (sequence === reportSequence) reportChecking.value = false; }
};
const allowReportRetry = async () => {
  if (!reportUncertain.value || !reportChecked.value || reportChecking.value) return;
  try { await ElMessageBox.confirm('即使列表暂时没有记录，先前请求仍可能稍后完成。重新提交可能产生重复反馈。', '确认允许重试？', { type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对' }); reportUncertain.value = false; reportChecked.value = false; } catch (_) {}
};
const finishReportReview = async () => {
  if (!reportUncertain.value || !reportChecked.value || reportChecking.value) return;
  try { await ElMessageBox.confirm('确认不再重试这次反馈？这不会删除已有反馈。', '结束核对？', { type: 'warning', confirmButtonText: '结束核对', cancelButtonText: '继续核对' }); reportUncertain.value = false; reportSubmitted.value = true; } catch (_) {}
};
const loadMemories = async (id, sequence) => {
  const request = ++memorySequence;
  memoryLoading.value = true; memoryError.value = '';
  try {
    const result = await api.memory.list({ mealId: id });
    if (sequence !== loadSequence || request !== memorySequence) return;
    if (!Array.isArray(result) || result.some(item => !item || !(item._id || item.id) || typeof item.date !== 'string')) throw new Error('回忆列表数据不完整');
    memories.value = result;
  } catch (e) { if (sequence === loadSequence && request === memorySequence) memoryError.value = e?.error || e?.message || '加载相关回忆失败'; }
  finally { if (sequence === loadSequence && request === memorySequence) memoryLoading.value = false; }
};
const reloadMemories = () => { if (typeof route.params.id === 'string') loadMemories(route.params.id, loadSequence); };
const load = async () => {
  const id = route.params.id;
  const sequence = ++loadSequence;
  if (typeof id !== 'string' || !id) return;
  loading.value = true;
  mealError.value = '';
  memoryError.value = '';
  meal.value = null;
  memories.value = [];
  reportSequence++; reporting.value = false; reportUncertain.value = false; reportSubmitted.value = false; reportChecked.value = false; reportChecking.value = false; reportError.value = '';
  viewedPhoto.value = null;
  loadMemories(id, sequence);
  try {
    const result = await api.meal.getMealById(id);
    if (sequence !== loadSequence) return;
    if (!result || String(result._id || result.id || '') !== id || typeof result.name !== 'string' || !result.name.trim() || (result.imageUrl != null && typeof result.imageUrl !== 'string') || ['ingredients', 'steps', 'photos', 'tags', 'healthTags'].some(key => result[key] != null && !Array.isArray(result[key])) || (Array.isArray(result.photos) && result.photos.some(photo => typeof photo !== 'string'))) throw new Error('菜品数据不完整');
    meal.value = result;
  } catch (e) { if (sequence === loadSequence) mealError.value = e?.error || e?.message || '加载菜品详情失败'; }
  finally { if (sequence === loadSequence) loading.value = false; }
};
const fallbackImage = event => { if (event.target.dataset.fallback !== '1') { event.target.dataset.fallback = '1'; event.target.src = defaultImage; event.target.alt = '图片暂不可用'; } };
const showPhoto = (images, index, title) => { if (images.length && index >= 0 && index < images.length) viewedPhoto.value = { images, index, title }; };
const movePhoto = direction => { if (!viewedPhoto.value) return; const next = viewedPhoto.value.index + direction; if (next >= 0 && next < viewedPhoto.value.images.length) viewedPhoto.value.index = next; };
const onPhotoKey = event => { if (!viewedPhoto.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return; event.preventDefault(); movePhoto(event.key === 'ArrowLeft' ? -1 : 1); };
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.id === from.params.id) return true;
  if (reportBusy.value) { ElMessage.warning('图片反馈操作正在进行，请稍候'); return false; }
  if (!reportUncertain.value) return true;
  try { await ElMessageBox.confirm('图片反馈结果尚未确认，切换菜品后核对提示会丢失。', '确认切换？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续核对' }); return true; } catch (_) { return false; }
});
watch(() => route.params.id, load, { immediate: true });
window.addEventListener('keydown', onPhotoKey);
onBeforeUnmount(() => { loadSequence++; memorySequence++; reportSequence++; window.removeEventListener('keydown', onPhotoKey); });
</script>

<template>
  <div class="meal-detail" v-loading="loading">
    <div class="detail-toolbar">
      <el-button @click="router.push('/meals')"><el-icon><ArrowLeft /></el-icon>返回</el-button>
      <div class="toolbar-actions">
        <el-button type="success" :disabled="!meal || loading" @click="doneOnce"><el-icon><Check /></el-icon>记录做过</el-button>
        <el-button type="warning" :disabled="!meal || loading || reportUncertain || reportSubmitted || reportChecking" :loading="reporting" @click="reportImageIssue"><el-icon><Warning /></el-icon>{{ reportSubmitted ? '已反馈' : '图片不对' }}</el-button>
        <el-button type="primary" :disabled="!meal || loading" @click="router.push({ name: 'MealEditor', params: { id: route.params.id } })">
          <el-icon><Edit /></el-icon>编辑菜品
        </el-button>
      </div>
    </div>

    <el-alert v-if="reportUncertain" type="warning" :closable="false" show-icon title="图片反馈提交结果未确认，请先核对后再决定是否重试。">
      <el-button link type="primary" :loading="reportChecking" @click="checkReports">核对待修正反馈</el-button>
      <p v-if="reportError">{{ reportError }}</p>
      <template v-if="reportChecked"><p>{{ reportMatches ? `当前列表有 ${reportMatches} 条这道菜的图片不匹配反馈。` : '当前列表没有发现这道菜的图片不匹配反馈。' }}{{ reportListTruncated ? ' 列表仅显示最近 200 条，可能不完整。' : '' }}先前请求仍可能稍后完成。</p><el-button link type="primary" @click="allowReportRetry">已核对，允许重试</el-button><el-button link @click="finishReportReview">不再重试</el-button></template>
    </el-alert>
    <el-alert v-if="mealError" type="error" :closable="false" show-icon :title="`无法加载菜品：${mealError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <template v-if="meal && !mealError">
      <section class="hero">
        <button class="cover-button" type="button" :disabled="!meal.imageUrl" :aria-label="`查看${meal.name}封面照片`" @click="showPhoto([meal.imageUrl], 0, `${meal.name}封面`)"><img :src="coverImage" :alt="meal.name" @error="fallbackImage" /></button>
        <div class="hero-info">
          <div class="title-row">
            <h1>{{ meal.name }}</h1>
            <el-tag v-if="meal.favorite" type="warning"><el-icon><Star /></el-icon> 收藏</el-tag>
          </div>
          <p>{{ meal.description || '还没有写下这道菜的故事。' }}</p>
          <div class="meta-grid">
            <div><el-icon><Clock /></el-icon><span>{{ totalTime || '-' }} 分钟</span></div>
            <div><el-icon><Bowl /></el-icon><span>{{ meal.servingSize || '份量未设' }}</span></div>
            <div><span>难度</span><strong>{{ difficultyText }}</strong></div>
            <div><span>辣度</span><strong>{{ meal.spiceLevel || 0 }}/5</strong></div>
          </div>
          <el-rate :model-value="meal.rating || 0" disabled />
          <div class="tags">
            <el-tag v-for="tag in meal.tags || []" :key="tag" effect="light">{{ tag }}</el-tag>
            <el-tag v-for="tag in meal.healthTags || []" :key="`h-${tag}`" type="success" effect="plain">{{ tag }}</el-tag>
          </div>
        </div>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header>食材清单</template>
          <el-empty v-if="!meal.ingredients?.length" description="暂无食材" />
          <div v-else class="ingredient-list">
            <div v-for="(item, index) in meal.ingredients" :key="index" class="ingredient-row">
              <span>{{ typeof item === 'string' ? item : item?.name }}</span><strong>{{ typeof item === 'string' ? '' : item?.amount }}</strong>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>做法步骤</template>
          <el-empty v-if="!meal.steps?.length" description="暂无做法" />
          <div v-else class="steps-list">
            <div v-for="(step, index) in meal.steps" :key="index" class="step-item" :class="{ 'no-image': !step?.imageUrl }">
              <div class="step-index">{{ index + 1 }}</div>
              <button v-if="step?.imageUrl" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 步照片`" @click="showPhoto([step.imageUrl], 0, `第 ${index + 1} 步`)" ><img :src="imageFor(step.imageUrl)" :alt="`第 ${index + 1} 步照片`" @error="fallbackImage" /></button>
              <p>{{ typeof step === 'string' ? step : step?.description }}</p>
            </div>
          </div>
        </el-card>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header>照片墙</template>
          <div v-if="photos.length" class="photo-grid">
            <button v-for="(photo, index) in photos" :key="`${index}-${photo}`" class="detail-photo" type="button" :aria-label="`查看第 ${index + 1} 张菜品照片`" @click="showPhoto(photos, index, meal.name)"><img :src="imageFor(photo)" :alt="`第 ${index + 1} 张菜品照片`" @error="fallbackImage" /></button>
          </div>
          <el-empty v-else description="暂无额外照片"><template #image><el-icon><Picture /></el-icon></template></el-empty>
        </el-card>

        <el-card>
          <template #header>饭后回忆</template>
          <el-alert v-if="memoryError" type="error" :closable="false" show-icon :title="`无法加载相关回忆：${memoryError}`"><el-button link type="primary" :loading="memoryLoading" @click="reloadMemories">重新加载</el-button></el-alert>
          <p v-else-if="memoryLoading" class="memory-date">正在加载相关回忆…</p>
          <el-empty v-else-if="!memories.length" description="还没有相关回忆" />
          <div v-else class="memory-list">
            <p v-if="memories.length >= 200" class="memory-date">显示最近 200 条相关回忆。</p>
            <div v-for="item in memories" :key="item._id" class="memory-item">
              <div class="memory-date">{{ item.date }} · {{ item.mood || '日常一餐' }}</div>
              <strong>{{ item.title || meal.name }}</strong>
              <p>{{ item.note }}</p>
              <p v-if="item.actualCookTime || item.nextImprovement" class="memory-extra">实际耗时 {{ item.actualCookTime || '-' }} 分钟 · {{ item.nextImprovement || '暂无改进记录' }}</p>
              <el-rate :model-value="item.rating || 0" disabled size="small" />
              <router-link class="memory-link" :to="{ name: 'memories', query: { edit: item._id || item.id } }">查看并编辑回忆 →</router-link>
            </div>
          </div>
        </el-card>
      </section>

      <el-card v-if="meal.tips" class="tips-card">
        <template #header>烹饪小贴士</template>
        <p>{{ meal.tips }}</p>
      </el-card>
    </template>
    <el-dialog :model-value="!!viewedPhoto" title="菜品照片" width="min(680px, 92vw)" @update:model-value="value => { if (!value) viewedPhoto = null }"><template v-if="viewedPhoto"><img :key="`${viewedPhoto.index}-${viewedPhoto.images[viewedPhoto.index]}`" class="photo-preview" :src="imageFor(viewedPhoto.images[viewedPhoto.index])" :alt="viewedPhoto.title" @error="fallbackImage" /><div class="photo-nav"><el-button :disabled="viewedPhoto.index === 0" aria-label="上一张菜品照片" @click="movePhoto(-1)">上一张</el-button><span aria-live="polite">{{ viewedPhoto.index + 1 }} / {{ viewedPhoto.images.length }}</span><el-button :disabled="viewedPhoto.index >= viewedPhoto.images.length - 1" aria-label="下一张菜品照片" @click="movePhoto(1)">下一张</el-button></div><h3>{{ viewedPhoto.title }}</h3></template></el-dialog>
  </div>
</template>

<style scoped>
.meal-detail { display: flex; flex-direction: column; gap: 18px; }
.detail-toolbar { display: flex; justify-content: space-between; gap: 12px; }
.toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.hero { display: grid; grid-template-columns: minmax(280px, 460px) 1fr; gap: 24px; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px var(--shadow-color); }
.hero img { width: 100%; height: 320px; object-fit: cover; border-radius: 10px; background: var(--bg-secondary); }
.cover-button, .detail-photo { border: 0; padding: 0; background: var(--bg-secondary); border-radius: 10px; cursor: pointer; }
.cover-button:disabled { cursor: default; }
.cover-button:focus-visible, .detail-photo:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.hero-info { display: flex; flex-direction: column; gap: 14px; }
.title-row { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
h1 { margin: 0; color: var(--text-primary); }
.meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
.meta-grid div { background: var(--bg-secondary); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 6px; color: var(--text-secondary); }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.ingredient-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
.steps-list, .memory-list { display: flex; flex-direction: column; gap: 12px; }
.step-item { display: grid; grid-template-columns: 34px 96px 1fr; gap: 12px; align-items: start; }
.step-item.no-image { grid-template-columns: 34px 1fr; }
.step-index { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.step-item img, .photo-grid img { width: 100%; height: 82px; object-fit: cover; border-radius: 8px; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.memory-item { padding: 12px; background: var(--bg-secondary); border-radius: 8px; }
.memory-date, .memory-extra { color: var(--text-muted); font-size: 13px; }
.memory-link { display: block; margin-top: 8px; color: var(--secondary-color); font-weight: 700; }
.photo-preview { display: block; width: 100%; max-height: 420px; object-fit: contain; border-radius: 16px; background: var(--bg-secondary); }
.photo-nav { display: flex; align-items: center; justify-content: center; gap: 12px; margin: 12px 0; color: var(--text-secondary); font-size: 13px; }
.photo-nav .el-button { margin: 0; min-height: 44px; }
.tips-card p { white-space: pre-wrap; }
@media (max-width: 768px) { .hero, .content-grid { grid-template-columns: 1fr; } .meta-grid { grid-template-columns: repeat(2, 1fr); } .step-item, .step-item.no-image { grid-template-columns: 28px 1fr; } .step-item img { grid-column: 2; } }
</style>
