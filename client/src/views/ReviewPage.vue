<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { Calendar, Picture, Food, ChatDotRound, Refresh } from '@element-plus/icons-vue';
import { useRoute, useRouter } from 'vue-router';
import api from '@/services/api';
import placeholder from '@/assets/meal-placeholder.svg';
import { resolveUploadedImage, handleUploadedImageError } from '@/utils/uploadedImage.mjs';

const today = new Date();
const route = useRoute();
const router = useRouter();
const routeNotice = ref('');
let applyingRoute = false;
let routeInitialized = false;
let preserveInvalidRoute = false;
const clock = ref(today);
let clockTimer = null;
const mode = ref('month');
const month = ref(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
const year = ref(String(today.getFullYear()));
const result = ref(null); const loading = ref(false); const error = ref('');
let sequence = 0; let alive = true;
const period = computed(() => mode.value === 'month' ? month.value : year.value);
const periodKey = computed(() => `${mode.value}:${period.value}`);
const displayPeriod = computed(() => mode.value === 'year' ? `${year.value} 年` : `${month.value.slice(0, 4)} 年 ${Number(month.value.slice(5))} 月`);
const currentPeriod = () => { const date = clock.value; return mode.value === 'year' ? String(date.getFullYear()) : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; };
const refreshClock = () => { clock.value = new Date(); };
const canStep = direction => {
  if (mode.value === 'year') return Number(year.value) + direction >= 2000 && Number(year.value) + direction <= 2100;
  const [y, m] = month.value.split('-').map(Number); const index = y * 12 + m - 1 + direction;
  return index >= 2000 * 12 && index <= 2100 * 12 + 11;
};
const stepPeriod = direction => {
  if (!canStep(direction)) return;
  if (mode.value === 'year') year.value = String(Number(year.value) + direction);
  else { const [y, m] = month.value.split('-').map(Number); const index = y * 12 + m - 1 + direction; month.value = `${Math.floor(index / 12)}-${String(index % 12 + 1).padStart(2, '0')}`; }
};
const currentInRange = computed(() => clock.value.getFullYear() >= 2000 && clock.value.getFullYear() <= 2100);
const goCurrent = () => { if (!currentInRange.value) return; if (mode.value === 'year') year.value = currentPeriod(); else month.value = currentPeriod(); };
const empty = computed(() => !!result.value && result.value.summary.memoryCount === 0 && result.value.summary.plannedMealCount === 0);
const albumMonth = computed(() => mode.value === 'month' ? month.value : result.value?.photos?.[0]?.date?.slice(0, 7) || `${year.value}-01`);
const summaryText = computed(() => {
  const data = result.value; if (!data) return '';
  const { memoryCount, plannedMealCount, photoCount } = data.summary;
  if (!memoryCount && !plannedMealCount) return '这段时间还没有排餐或饭后回忆，留一顿饭的记录吧。';
  if (data.topMeals.length) return `记录了 ${plannedMealCount} 条排餐和 ${memoryCount} 条回忆，最常出现的是${data.topMeals[0].name}。`;
  if (photoCount) return `留下了 ${photoCount} 张饭桌照片和 ${memoryCount} 条回忆。`;
  return `记录了 ${plannedMealCount} 条排餐和 ${memoryCount} 条饭后回忆。`;
});
const mealType = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐', snack: '加餐', other: '一餐' };
const nonnegative = value => Number.isSafeInteger(value) && value >= 0;
const idOf = value => String(value?._id || value?.id || '');
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validYear = value => /^\d{4}$/.test(value || '') && Number(value) >= 2000 && Number(value) <= 2100;
function expectedRange(type, label) {
  if (type === 'year' && validYear(label)) return { start: `${label}-01-01`, end: `${label}-12-31` };
  if (type === 'month' && /^\d{4}-(0[1-9]|1[0-2])$/.test(label || '') && validYear(label.slice(0, 4))) {
    const [y, m] = label.split('-').map(Number); const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return { start: `${label}-01`, end: `${label}-${String(last).padStart(2, '0')}` };
  }
  return null;
}
function acceptReview(data, type, label) {
  if (data?.supportsHouseholdScopedReview !== true) throw new Error('服务器未提供安全的家庭回顾能力，请升级后查看。');
  const range = expectedRange(type, label);
  if (!range || data.type !== type || data.label !== label || data.range?.start !== range.start || data.range?.end !== range.end || !data.summary) throw new Error('回顾时间范围不完整');
  if (['memoryCount', 'plannedMealCount', 'reviewedDayCount', 'photoCount', 'wishlistOpen', 'mealTotal', 'favoriteTotal'].some(key => !nonnegative(data.summary[key]))) throw new Error('回顾统计数据不完整');
  if (!Array.isArray(data.topMeals) || data.topMeals.some(item => !item || typeof item.id !== 'string' || !item.id || typeof item.name !== 'string' || !item.name || !nonnegative(item.count) || !nonnegative(item.memoryCount) || !nonnegative(item.scheduleCount))) throw new Error('菜品统计数据不完整');
  for (const [key, field] of [['moodStats', 'mood'], ['categoryStats', 'category'], ['healthTagStats', 'tag']]) {
    if (!Array.isArray(data[key]) || data[key].some(item => !item || typeof item[field] !== 'string' || !item[field] || !nonnegative(item.count))) throw new Error('回顾分类数据不完整');
  }
  if (!Array.isArray(data.photos) || data.photos.some(item => !item || typeof item.photo !== 'string' || !item.photo || typeof item.memoryId !== 'string' || !item.memoryId || !validDate(item.date) || item.date < range.start || item.date > range.end)) throw new Error('回顾照片数据不完整');
  if (!Array.isArray(data.recentMemories) || data.recentMemories.some(item => !item || !idOf(item) || !validDate(item.date) || item.date < range.start || item.date > range.end)) throw new Error('回忆记录不完整');
  if (data.bestMemory && (!idOf(data.bestMemory) || !validDate(data.bestMemory.date) || data.bestMemory.date < range.start || data.bestMemory.date > range.end)) throw new Error('精选回忆数据不完整');
  return data;
}
async function load() {
  const type = mode.value; const label = period.value; const request = ++sequence;
  loading.value = true; error.value = ''; result.value = null;
  try {
    const data = type === 'month' ? await api.review.monthly(label) : await api.review.yearly(label);
    if (!alive || request !== sequence || periodKey.value !== `${type}:${label}`) return;
    result.value = acceptReview(data, type, label);
  } catch (e) { if (alive && request === sequence) error.value = e?.error || e?.message || '饭桌回顾加载失败，请稍后重试'; }
  finally { if (alive && request === sequence) loading.value = false; }
}
const disabledDate = value => value.getFullYear() < 2000 || value.getFullYear() > 2100;
const imageFor = value => {
  const resolved = resolveUploadedImage(value);
  if (!resolved) return placeholder;
  try { const url = new URL(resolved, window.location.origin); return ['http:', 'https:'].includes(url.protocol) ? url.href : placeholder; } catch (_) { return placeholder; }
};
const imageError = event => handleUploadedImageError(event, placeholder);
const photoLink = photo => {
  if (/^[a-f\d]{24}$/i.test(photo.memoryId) && Number.isSafeInteger(photo.photoIndex) && photo.photoIndex >= 0 && typeof photo.fingerprint === 'string' && /^[a-f\d]{64}$/i.test(photo.fingerprint)) return { name: 'photoAlbum', query: { month: photo.date.slice(0, 7), memoryId: photo.memoryId, photoIndex: String(photo.photoIndex), fingerprint: photo.fingerprint } };
  return { name: 'memories', query: { edit: photo.memoryId, month: photo.date.slice(0, 7) } };
};
const widthFor = item => `${Math.round((item.count / Math.max(1, ...result.value.categoryStats.map(row => row.count))) * 100)}%`;
watch(mode, value => {
  if (applyingRoute) return;
  if (value === 'year') year.value = month.value.slice(0, 4);
  else month.value = `${year.value}-${month.value.slice(5, 7)}`;
}, { flush: 'sync' });
watch(periodKey, () => {
  if (preserveInvalidRoute) { preserveInvalidRoute = false; load(); return; }
  if (route.name === 'review') {
    const query = mode.value === 'month' ? { month: month.value } : { year: year.value };
    if (route.query.month !== query.month || route.query.year !== query.year) void router.replace({ name: 'review', query });
  }
  routeNotice.value = '';
  load();
});
watch(() => route.fullPath, () => {
  if (route.name !== 'review') return;
  const requestedMonth = route.query.month;
  const requestedYear = route.query.year;
  const monthValid = typeof requestedMonth === 'string' && !!expectedRange('month', requestedMonth);
  const yearValid = typeof requestedYear === 'string' && !!expectedRange('year', requestedYear);
  const invalid = (requestedMonth !== undefined && !monthValid) || (requestedYear !== undefined && !yearValid) || (requestedMonth !== undefined && requestedYear !== undefined);
  const current = new Date();
  const targetMode = !invalid && yearValid ? 'year' : 'month';
  const target = invalid || (requestedMonth === undefined && requestedYear === undefined) ? `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}` : targetMode === 'year' ? requestedYear : requestedMonth;
  const before = periodKey.value;
  routeNotice.value = invalid ? '回顾链接中的时间无效，已打开当前月份。' : '';
  applyingRoute = true;
  if (targetMode === 'year') { year.value = target; month.value = `${target}-${month.value.slice(5, 7)}`; }
  else { month.value = target; year.value = target.slice(0, 4); }
  mode.value = targetMode;
  applyingRoute = false;
  if (invalid && before !== periodKey.value) preserveInvalidRoute = true;
  if (!routeInitialized && before === periodKey.value) load();
  routeInitialized = true;
}, { immediate: true });
onMounted(() => { window.addEventListener('focus', refreshClock); document.addEventListener('visibilitychange', refreshClock); clockTimer = setInterval(refreshClock, 60000); });
onBeforeUnmount(() => { alive = false; sequence++; window.removeEventListener('focus', refreshClock); document.removeEventListener('visibilitychange', refreshClock); if (clockTimer) clearInterval(clockTimer); });
</script>

<template>
  <div class="review-page">
    <section class="review-hero"><div><span class="eyebrow">OUR TABLE JOURNAL · 饭桌回顾</span><h1>把日子，慢慢记下来</h1><p>从排餐、回忆和照片里，看看这段时间属于小家的味道。</p></div><div class="period-controls"><el-radio-group v-model="mode" aria-label="回顾周期"><el-radio-button label="month">月度</el-radio-button><el-radio-button label="year">年度</el-radio-button></el-radio-group><el-date-picker v-if="mode === 'month'" v-model="month" type="month" value-format="YYYY-MM" :clearable="false" :disabled-date="disabledDate" aria-label="选择回顾月份" /><el-date-picker v-else v-model="year" type="year" value-format="YYYY" :clearable="false" :disabled-date="disabledDate" aria-label="选择回顾年份" /><div class="period-navigation" role="group" aria-label="切换回顾时间"><button type="button" :disabled="!canStep(-1)" :aria-label="mode === 'month' ? '上个月' : '上一年'" @click="stepPeriod(-1)">← <span>{{ mode === 'month' ? '上个月' : '上一年' }}</span></button><button type="button" :disabled="!currentInRange || period === currentPeriod()" :title="!currentInRange ? '当前日期超出可查看范围（2000–2100）' : ''" @click="goCurrent">{{ mode === 'month' ? '回到本月' : '回到今年' }}</button><button type="button" :disabled="!canStep(1)" :aria-label="mode === 'month' ? '下个月' : '下一年'" @click="stepPeriod(1)"><span>{{ mode === 'month' ? '下个月' : '下一年' }}</span> →</button></div></div></section>
    <el-alert v-if="routeNotice" type="warning" :closable="false" show-icon :title="routeNotice" />
    <div v-if="loading" class="state-card" role="status">正在整理 {{ displayPeriod }} 的饭桌记录…</div>
    <div v-else-if="error" class="state-card" role="alert"><strong>暂时无法查看回顾</strong><p>{{ error }}</p><el-button @click="load"><el-icon><Refresh /></el-icon>重新加载</el-button></div>
    <template v-else-if="result">
      <section class="intro"><div><span class="eyebrow">{{ displayPeriod }} · OUR STORY</span><h2>{{ empty ? '新的饭桌故事，等你开始' : '这一段日常，值得回味' }}</h2><p>{{ summaryText }}</p></div><router-link v-if="empty" class="text-link" :to="{ name: 'calendar', query: { month: mode === 'month' ? month : `${year}-01` } }">{{ mode === 'month' ? '查看本月日历 →' : '查看本年一月日历 →' }}</router-link></section>
      <section class="metrics" aria-label="本期记录统计"><div class="metric"><el-icon><Calendar /></el-icon><span>有记录的日期</span><strong>{{ result.summary.reviewedDayCount }}</strong><small>天</small></div><div class="metric"><el-icon><Food /></el-icon><span>排餐条目</span><strong>{{ result.summary.plannedMealCount }}</strong><small>条</small></div><div class="metric"><el-icon><ChatDotRound /></el-icon><span>饭后回忆</span><strong>{{ result.summary.memoryCount }}</strong><small>条</small></div><div class="metric"><el-icon><Picture /></el-icon><span>饭桌照片</span><strong>{{ result.summary.photoCount }}</strong><small>张</small></div></section>
      <p class="metric-note">统计来自所选期间的排餐和回忆；排餐条目包括菜品已不可用的历史记录，不代表实际食用次数。</p>
      <div class="content-grid"><section class="panel favorites"><div class="panel-head"><div><span class="eyebrow">FAVORITE FLAVORS</span><h2>常出现在饭桌上的菜</h2></div><router-link class="text-link" to="/meals">查看菜谱 →</router-link></div><p class="explain">出现次数为排餐条目与关联回忆次数之和，同一餐可能在两处各记一次。</p><div v-if="!result.topMeals.length" class="panel-empty">这段时间还没有可展示的关联菜品。</div><div v-else class="meal-list"><router-link v-for="(meal, index) in result.topMeals" :key="meal.id" :to="{ name: 'MealDetail', params: { id: meal.id } }" class="meal-row"><span class="rank">{{ String(index + 1).padStart(2, '0') }}</span><img :src="imageFor(meal.imageUrl)" :alt="meal.name" loading="lazy" @error="imageError" /><div><strong>{{ meal.name }}</strong><small>排餐 {{ meal.scheduleCount }} · 回忆 {{ meal.memoryCount }}</small></div><b>{{ meal.count }} 次</b></router-link></div></section>
        <section class="panel categories"><div class="panel-head"><div><span class="eyebrow">AT THE TABLE</span><h2>这段时间的搭配</h2></div></div><p class="explain">按菜品出现次数统计；条形长度相对于出现最多的分类。</p><div v-if="!result.categoryStats.length" class="panel-empty">暂时没有分类记录。</div><div v-else class="bars"><div v-for="item in result.categoryStats" :key="item.category" class="bar-row"><div><span>{{ item.category }}</span><strong>{{ item.count }} 次</strong></div><div class="bar-track" :aria-label="`${item.category}出现 ${item.count} 次`"><span :style="{ width: widthFor(item) }"></span></div></div></div><div v-if="result.healthTagStats.length" class="tag-section"><h3>菜品标签</h3><div class="tags"><span v-for="item in result.healthTagStats" :key="item.tag">{{ item.tag }} · {{ item.count }}</span></div></div></section>
        <section class="panel memory-feature"><div class="panel-head"><div><span class="eyebrow">A MOMENT TO KEEP</span><h2>精选饭桌回忆</h2></div><router-link class="text-link" :to="{ name: 'memories', query: mode === 'month' ? { month } : {} }">{{ mode === 'month' ? '查看本月 →' : '查看全部 →' }}</router-link></div><div v-if="!result.bestMemory" class="panel-empty">还没有值得收藏的饭后回忆。</div><router-link v-else class="feature-link" :to="{ name: 'memories', query: { edit: idOf(result.bestMemory), month: result.bestMemory.date.slice(0, 7) } }"><img v-if="result.bestMemory.photos?.length" :src="imageFor(result.bestMemory.photos[0])" :alt="result.bestMemory.title || '饭桌回忆'" @error="imageError" /><div><span>{{ result.bestMemory.date }} · {{ mealType[result.bestMemory.mealType] || '一餐' }}</span><h3>{{ result.bestMemory.title || '一段饭桌回忆' }}</h3><p>{{ result.bestMemory.note || '那天的味道，留在这段小小的记录里。' }}</p><small>{{ result.bestMemory.mood || '日常心情' }}<template v-if="result.bestMemory.rating"> · {{ result.bestMemory.rating }} / 5 分</template></small></div></router-link></section>
        <section class="panel moods"><div class="panel-head"><div><span class="eyebrow">LITTLE FEELINGS</span><h2>饭桌上的心情</h2></div></div><div v-if="!result.moodStats.length" class="panel-empty">还没有心情记录。</div><div v-else class="mood-list"><div v-for="item in result.moodStats" :key="item.mood"><span>{{ item.mood }}</span><strong>{{ item.count }} 条</strong></div></div><p class="current-note">当前小家：{{ result.summary.mealTotal }} 道菜 · {{ result.summary.favoriteTotal }} 道收藏 · {{ result.summary.wishlistOpen }} 条待完成想吃</p></section>
      </div>
      <section class="panel photos"><div class="panel-head"><div><span class="eyebrow">PHOTO NOTES</span><h2>照片里的日常</h2><p class="explain">最多展示本期最近 12 张照片。</p></div><router-link class="text-link" :to="{ name: 'photoAlbum', query: { month: albumMonth } }">{{ mode === 'month' ? '打开本月相册 →' : `打开 ${albumMonth} 相册 →` }}</router-link></div><div v-if="!result.photos.length" class="panel-empty">这段时间还没有饭桌照片。</div><div v-else class="photo-grid"><router-link v-for="(photo, index) in result.photos" :key="`${photo.memoryId}-${index}-${photo.photo}`" :to="photoLink(photo)" class="photo-card" :aria-label="`${photoLink(photo).name === 'photoAlbum' ? '在相册查看照片' : '查看饭桌回忆'}：${photo.date} ${photo.title || '饭桌回忆'}`"><img :src="imageFor(photo.photo)" :alt="photo.title || photo.date || '饭桌照片'" loading="lazy" @error="imageError" /><span>{{ photo.date }} · {{ photo.title || '饭桌回忆' }}</span></router-link></div></section>
      <section class="panel recent"><div class="panel-head"><div><span class="eyebrow">RECENT NOTES</span><h2>最近的回忆</h2></div><router-link class="text-link" :to="{ name: 'memories', query: mode === 'month' ? { month } : {} }">{{ mode === 'month' ? '本月回忆 →' : '全部回忆 →' }}</router-link></div><div v-if="!result.recentMemories.length" class="panel-empty">这段时间还没有饭后回忆。</div><div v-else class="recent-list"><router-link v-for="item in result.recentMemories" :key="idOf(item)" :to="{ name: 'memories', query: { edit: idOf(item), month: item.date.slice(0, 7) } }"><div><strong>{{ item.title || '一段饭桌回忆' }}</strong><small>{{ item.date }} · {{ mealType[item.mealType] || '一餐' }} · {{ item.mood || '日常心情' }}</small></div><span aria-hidden="true">→</span></router-link></div></section>
    </template>
  </div>
</template>

<style scoped>
.review-page{--review-accent:color-mix(in srgb,var(--secondary-color) 42%,#33211a);display:flex;flex-direction:column;gap:18px;color:var(--text-primary)}.review-hero{display:flex;justify-content:space-between;align-items:end;gap:24px;padding:clamp(24px,3.5vw,42px);border:1px solid var(--border-color);border-radius:28px;background:linear-gradient(130deg,var(--bg-primary),var(--bg-secondary));box-shadow:0 12px 32px var(--shadow-color)}.review-hero h1{font-family:Georgia,'Songti SC',serif;font-size:clamp(29px,3.5vw,42px);font-weight:600;margin:10px 0}.review-hero p,.intro p{color:var(--text-primary);line-height:1.7;margin:0}.eyebrow{color:var(--review-accent);font-size:11px;font-weight:800;letter-spacing:.13em}.period-controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.period-controls :deep(.el-date-editor){width:160px}.state-card,.intro,.panel,.metric{border:1px solid var(--border-color);border-radius:22px;background:var(--bg-primary);box-shadow:0 8px 24px var(--shadow-color)}.state-card{padding:32px;text-align:center}.state-card p{color:var(--text-primary)}.intro{display:flex;align-items:end;justify-content:space-between;gap:16px;padding:24px}.intro h2{font-size:22px;margin:8px 0}.text-link{color:var(--review-accent);font-weight:800;text-decoration:none;white-space:nowrap}.text-link:focus-visible,.meal-row:focus-visible,.feature-link:focus-visible,.photo-card:focus-visible,.recent-list a:focus-visible{outline:3px solid var(--review-accent);outline-offset:3px}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.metric{padding:18px;display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center}.metric .el-icon{color:var(--review-accent);font-size:22px}.metric span{font-size:13px;color:var(--text-primary)}.metric strong{font-size:30px;color:var(--review-accent);grid-column:2}.metric small{color:var(--text-primary);align-self:end;padding-bottom:5px}.metric-note,.explain,.current-note{color:var(--text-primary);font-size:13px;line-height:1.6}.metric-note{margin:-8px 3px 0}.content-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.panel{padding:22px;min-width:0}.panel-head{display:flex;align-items:end;justify-content:space-between;gap:12px}.panel h2{font-size:20px;margin:7px 0 0}.panel h3{font-size:16px}.explain{margin:10px 0}.panel-empty{padding:24px 0;color:var(--text-primary);font-size:14px}.meal-list{display:grid;gap:4px}.meal-row{display:grid;grid-template-columns:28px 52px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light);color:var(--text-primary);text-decoration:none}.meal-row:last-child{border-bottom:0}.meal-row img{width:52px;height:52px;object-fit:cover;border-radius:12px;background:var(--bg-secondary)}.meal-row strong,.meal-row small,.recent-list strong,.recent-list small{display:block;overflow-wrap:anywhere}.meal-row small,.recent-list small{margin-top:4px;color:var(--text-primary);font-size:12px}.meal-row b,.rank{color:var(--review-accent)}.rank{font-family:Georgia,serif;font-size:17px}.bar-row{margin-top:14px}.bar-row>div:first-child{display:flex;justify-content:space-between;gap:10px;font-size:13px}.bar-track{height:8px;margin-top:7px;border-radius:99px;background:var(--bg-tertiary);overflow:hidden}.bar-track span{display:block;height:100%;border-radius:inherit;background:var(--review-accent)}.tag-section{margin-top:22px}.tags{display:flex;flex-wrap:wrap;gap:8px}.tags span{padding:7px 10px;border-radius:999px;background:var(--bg-secondary);color:var(--text-primary);font-size:12px}.feature-link{display:grid;grid-template-columns:120px minmax(0,1fr);gap:16px;margin-top:16px;color:var(--text-primary);text-decoration:none}.feature-link:not(:has(img)){grid-template-columns:1fr}.feature-link img{width:120px;height:120px;object-fit:cover;border-radius:16px;background:var(--bg-secondary)}.feature-link span,.feature-link small{color:var(--text-primary);font-size:12px}.feature-link h3{margin:8px 0}.feature-link p{line-height:1.6;overflow-wrap:anywhere}.mood-list{display:grid;gap:8px;margin-top:16px}.mood-list div{display:flex;justify-content:space-between;gap:10px;padding:10px 12px;border-radius:12px;background:var(--bg-secondary)}.current-note{margin:18px 0 0;padding-top:14px;border-top:1px solid var(--border-light)}.photo-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:10px;margin-top:16px}.photo-card{position:relative;aspect-ratio:1;overflow:hidden;border-radius:14px;background:var(--bg-secondary);color:white}.photo-card img{width:100%;height:100%;object-fit:cover}.photo-card span{position:absolute;bottom:0;left:0;right:0;padding:18px 8px 7px;background:linear-gradient(transparent,rgba(20,15,12,.85));font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.recent-list{display:grid;margin-top:12px}.recent-list a{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:12px 0;border-bottom:1px solid var(--border-light);color:var(--text-primary);text-decoration:none}.recent-list a:last-child{border-bottom:0}.recent-list a>span{color:var(--review-accent)}:global(html.dark .review-page){--review-accent:var(--secondary-color)}@media(max-width:760px){.review-hero{align-items:stretch;flex-direction:column}.period-controls{align-items:stretch}.period-controls :deep(.el-date-editor){flex:1;min-width:140px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.metric{padding:14px}.content-grid{grid-template-columns:1fr}.photo-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.panel{padding:18px}.intro{align-items:start;flex-direction:column}.period-controls :deep(.el-radio-button__inner),.period-controls :deep(.el-input__wrapper){min-height:44px;display:flex;align-items:center}.text-link{min-height:44px;display:inline-flex;align-items:center}}
.review-page{--review-on-accent:#fff}
:global(html.dark .review-page){--review-on-accent:#241810}
.period-controls :deep(.el-radio-button.is-active .el-radio-button__inner){background:var(--review-accent);border-color:var(--review-accent);color:var(--review-on-accent);box-shadow:none}
.period-controls :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner){outline:3px solid var(--review-accent);outline-offset:2px}
.period-navigation{display:flex;flex-wrap:wrap;gap:6px;width:100%}.period-navigation button{min-height:44px;padding:8px 12px;border:1px solid var(--border-color);border-radius:12px;background:var(--bg-primary);color:var(--text-primary);font:inherit;font-size:13px;cursor:pointer}.period-navigation button:disabled{opacity:.55;cursor:not-allowed}.period-navigation button:focus-visible{outline:3px solid var(--review-accent);outline-offset:2px}
</style>
