<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Calendar, ShoppingCart, Picture, Star, Warning, Food } from '@element-plus/icons-vue';
import api from '@/services/api';
import { resolveUploadedImage, retryLocalUpload } from '@/utils/uploadedImage.mjs';

const router = useRouter();
const loading = ref(false);
const summary = ref(null);
const arranging = ref('');
const failedPhotos = reactive(new Set());
const photoError = (event, photo, index) => { if (!retryLocalUpload(event)) failedPhotos.add(photoKey(photo, index)); };
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const weekdayText = date => `周${['日', '一', '二', '三', '四', '五', '六'][new Date(`${date}T00:00:00Z`).getUTCDay()]}`;

const mealName = (item) => item?.meal?.name || item?.name || '菜品不可用';
const mealId = (meal) => meal?._id || meal?.id || meal?.mealId || (typeof meal === 'string' ? meal : '');
const scheduledRecipeId = item => {
  const meal = item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'meal') ? item.meal : item;
  if (!meal || typeof meal !== 'object' || typeof meal.name !== 'string' || !meal.name.trim()) return '';
  const id = mealId(meal);
  return typeof id === 'string' && /^[a-z\d_-]{1,128}$/i.test(id) ? id : '';
};
const wishMealId = item => item?.mealId?.archived === true ? '' : mealId(item?.mealId);
const wishDescription = item => item?.mealId?.archived === true ? '关联菜品已移入回收站，请先核对' : wishMealId(item) ? (item.mealId?.name || item.note || '可以安排到今天晚餐') : '尚无法安排，请在想吃清单中核对菜品';
const plannedSlots = computed(() => (summary.value?.week?.days || []).reduce((count, day) => count + Object.keys(mealTypeText).filter(type => day.meals?.[type]?.length).length, 0));
const loadError = ref('');
let loadRequest = null;
let active = true;
let dayTimer = null;
let lastLocalDay = '';
let wasAway = false;
const localDay = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const validMeals = value => value && typeof value === 'object' && Object.keys(mealTypeText).every(type => Array.isArray(value[type]));
const validCount = value => Number.isSafeInteger(value) && value >= 0;
const validateSummary = value => {
  if (!value || !validDate(value.today) || !validMeals(value.todaySchedule?.meals) ||
      !Array.isArray(value.todayHints) || value.todayHints.some(hint => typeof hint !== 'string') ||
      !Array.isArray(value.week?.days) || value.week.days.length !== 7 || value.week.days.some(day => !day || !validDate(day.date) || !validMeals(day.meals)) ||
      !Array.isArray(value.partnerWishlist) || value.partnerWishlist.some(item => !item || !(item._id || item.id) || typeof item.title !== 'string') ||
      !Array.isArray(value.recentPhotos) || value.recentPhotos.some(photo => !photo || typeof photo.photo !== 'string') ||
      !validCount(value.defaultMeals?.imported) || !validCount(value.defaultMeals?.total) || value.defaultMeals.imported > value.defaultMeals.total || !validCount(value.imageIssues?.open) || !validCount(value.meals?.favorites) ||
      (value.todaySchedule.date != null && value.todaySchedule.date !== value.today)) throw new Error('饭桌信息不完整，请重新加载');
  const days = value.week.days.map(day => day.date).sort();
  if (!days.includes(value.today) || days.some((day, index) => index && Date.parse(`${day}T00:00:00Z`) - Date.parse(`${days[index - 1]}T00:00:00Z`) !== 86400000)) throw new Error('饭桌信息不完整，请重新加载');
  return { ...value, week: { ...value.week, days: [...value.week.days].sort((a, b) => a.date.localeCompare(b.date)) } };
};
const load = () => {
  if (loadRequest) return loadRequest;
  loading.value = true;
  loadError.value = '';
  loadRequest = (async () => {
    try { const result = validateSummary(await api.dashboard.summary()); summary.value = result; failedPhotos.clear(); return result; }
    catch (e) { loadError.value = e?.error || e?.message || '暂时无法读取饭桌信息，请稍后重试'; return null; }
    finally { loading.value = false; loadRequest = null; }
  })();
  return loadRequest;
};
const arrangeWishlistDinner = async (item) => {
  if (arranging.value || loading.value) return;
  const shownMealId = String(wishMealId(item) || '');
  if (!shownMealId) return router.push('/wishlist');
  const shownDate = summary.value?.today;
  const wishId = String(item._id || item.id || '');
  arranging.value = wishId;
  try {
    const fresh = await load();
    if (!active || !fresh) return;
    const current = fresh.partnerWishlist.find(wish => String(wish._id || wish.id || '') === wishId);
    const id = wishMealId(current);
    if (!current || !id) { ElMessage.warning('心愿已变化，请先在想吃清单中核对'); return router.push('/wishlist'); }
    if (fresh.today !== shownDate || String(id) !== shownMealId || current.title !== item.title) return ElMessage.warning('日期或想吃内容已变化，请核对更新后的提醒再安排');
    return router.push({ name: 'MealSelection', query: { date: fresh.today, mealType: 'dinner', suggestedMealId: id, wishlistId: wishId } });
  } finally { arranging.value = ''; }
};
const openTodaySlot = async type => {
  if (!summary.value || loading.value || arranging.value || !mealTypeText[type]) return;
  const shownDate = summary.value.today;
  const hadMeals = summary.value.todaySchedule.meals[type].length > 0;
  arranging.value = `slot:${type}`;
  try {
    const fresh = await load();
    if (!active || !fresh) return;
    const hasMeals = fresh.todaySchedule.meals[type].length > 0;
    if (fresh.today !== shownDate || hasMeals !== hadMeals) return ElMessage.warning('日期或餐次安排已变化，请先核对首页后再操作');
    if (hasMeals) return router.push({ name: 'calendar', query: { date: fresh.today } });
    return router.push({ name: 'MealSelection', query: { date: fresh.today, mealType: type } });
  } finally { arranging.value = ''; }
};
const openTodayCalendar = async () => {
  if (!summary.value || loading.value || arranging.value) return;
  const shownDate = summary.value.today;
  arranging.value = 'calendar';
  try {
    const fresh = await load();
    if (!active || !fresh) return;
    if (fresh.today !== shownDate) return ElMessage.warning('日期已变化，请核对更新后的首页再安排');
    return router.push({ name: 'calendar', query: { date: fresh.today } });
  } finally { arranging.value = ''; }
};
const refreshAfterLocalDayChange = async () => {
  const today = localDay();
  if (!active || today === lastLocalDay) return;
  lastLocalDay = today;
  if (loadRequest) await loadRequest;
  if (active) await load();
};
const onReturn = async () => {
  if (!active || document.hidden) return;
  if (!wasAway) return refreshAfterLocalDayChange();
  wasAway = false;
  lastLocalDay = localDay();
  // A request started before leaving may contain stale data; refresh after it finishes.
  if (loadRequest) await loadRequest;
  if (active && !document.hidden) await load();
};
const onBlur = () => { wasAway = true; };
const onVisibility = () => { if (document.hidden) wasAway = true; else void onReturn(); };
const photoKey = (photo, index) => `${photo.memoryId || ''}:${index}:${photo.photo || ''}`;
const photoLink = photo => {
  if (!validDate(photo?.date)) return { name: 'photoAlbum' };
  const query = { month: photo.date.slice(0, 7) };
  if (typeof photo.memoryId === 'string' && /^[a-f\d]{24}$/i.test(photo.memoryId) && Number.isSafeInteger(photo.photoIndex) && photo.photoIndex >= 0 && typeof photo.fingerprint === 'string' && /^[a-f\d]{64}$/i.test(photo.fingerprint)) Object.assign(query, { memoryId: photo.memoryId, photoIndex: String(photo.photoIndex), fingerprint: photo.fingerprint });
  return { name: 'photoAlbum', query };
};

onMounted(() => {
  lastLocalDay = localDay();
  window.addEventListener('focus', onReturn);
  window.addEventListener('blur', onBlur);
  document.addEventListener('visibilitychange', onVisibility);
  dayTimer = setInterval(refreshAfterLocalDayChange, 60000);
  load();
});
onBeforeUnmount(() => { active = false; window.removeEventListener('focus', onReturn); window.removeEventListener('blur', onBlur); document.removeEventListener('visibilitychange', onVisibility); if (dayTimer) clearInterval(dayTimer); });
</script>

<template>
  <div class="dashboard-page" v-loading="loading" element-loading-text="正在更新饭桌信息" :aria-busy="loading ? 'true' : 'false'">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">OUR TABLE · 小家饭桌</p>
        <h1>好好吃饭，<br /><span>慢慢生活。</span></h1>
        <p>把每天的饭菜、想吃的灵感和一起度过的时光，收进属于你们的小家。</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" :disabled="!summary || !!loadError || loading || !!arranging" :loading="arranging === 'calendar'" @click="openTodayCalendar"><el-icon><Calendar /></el-icon>安排今天</el-button>
          <el-button size="large" @click="router.push('/meals')"><el-icon><Food /></el-icon>逛逛菜谱</el-button>
        </div>
      </div>
      <div class="hero-image" role="img" aria-label="家常菜照片"><span>日常的味道，值得被记住</span></div>
    </section>

    <div v-if="loadError && !loading" class="load-error" role="alert"><div><strong>暂时没有加载出饭桌信息</strong><p>{{ loadError }}</p></div><el-button @click="load">重新加载</el-button></div>
    <div v-if="summary && !loadError" class="section-heading"><div><small>TODAY & THIS WEEK</small><h2>你的饭桌，一目了然</h2></div><div class="summary-controls"><span>{{ summary.today }}（服务器日期）</span><el-button size="small" plain :disabled="loading || !!arranging" @click="load">刷新饭桌</el-button></div></div>
    <section class="dashboard-grid" v-if="summary && !loadError">
      <el-card class="today-card">
        <template #header><div class="card-title"><el-icon><Food /></el-icon><span>今天吃什么</span><el-tag>{{ summary.today }}</el-tag></div></template>
        <div v-for="(label, type) in mealTypeText" :key="type" class="meal-row">
          <strong>{{ label }}</strong>
          <div class="meal-tags">
            <template v-for="(item, index) in summary.todaySchedule?.meals?.[type] || []" :key="item?.meal?._id || item?._id || `unavailable-${index}`"><router-link v-if="scheduledRecipeId(item)" class="today-recipe-link" :to="{ name: 'MealDetail', params: { id: scheduledRecipeId(item) }, query: { fromDashboard: '1' } }" :aria-label="`查看${label}的${mealName(item)}菜谱`">{{ mealName(item) }}</router-link><el-tag v-else effect="plain">{{ mealName(item) }}</el-tag></template>
            <span v-if="!summary.todaySchedule?.meals?.[type]?.length" class="muted">还没安排</span>
          </div>
          <el-button link type="primary" class="today-slot-action" :loading="arranging === `slot:${type}`" :disabled="loading || !!arranging" :aria-label="`${summary.todaySchedule.meals[type].length ? '查看' : '安排'}${summary.today}${label}`" @click="openTodaySlot(type)">{{ summary.todaySchedule.meals[type].length ? '查看' : '安排' }}</el-button>
        </div>
        <div v-if="summary.todayHints?.length" class="hint-list"><el-tag v-for="hint in summary.todayHints" :key="hint" type="warning">{{ hint }}</el-tag></div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Calendar /></el-icon><span>本周饭桌计划</span></div></template>
        <div class="metric-row"><span>本周已安排</span><strong>{{ plannedSlots }}</strong><span>餐</span></div>
        <div class="week-mini">
          <router-link v-for="day in summary.week?.days || []" :key="day.date" class="week-day" :to="{ name: 'calendar', query: { date: day.date } }" :aria-current="day.date === summary.today ? 'date' : undefined" :aria-label="`查看 ${day.date} 的日历安排，${weekdayText(day.date)}${day.date === summary.today ? '，今天' : ''}，已安排 ${['breakfast','lunch','dinner'].filter(t => day.meals?.[t]?.length).length} 餐`">
            <span class="week-day-label">{{ weekdayText(day.date) }}<template v-if="day.date === summary.today"> · 今天</template></span>
            <strong>{{ day.date.slice(5) }}</strong>
            <span>{{ ['breakfast','lunch','dinner'].filter(t => day.meals?.[t]?.length).length }} 餐</span>
          </router-link>
        </div>
        <el-button type="primary" plain @click="router.push('/weekly-plan')">查看周计划</el-button>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Star /></el-icon><span>家人想吃提醒</span></div></template>
        <p class="wishlist-context">家人提出或支持的待完成心愿，最多显示 6 条。</p>
        <el-empty v-if="!summary.partnerWishlist?.length" description="暂时没有新的想吃提醒" />
        <div v-else class="wishlist-list">
          <div v-for="item in summary.partnerWishlist" :key="item._id || item.id" class="wishlist-row">
            <div><strong>{{ item.title }}</strong><p>{{ wishDescription(item) }}</p></div>
            <el-button size="small" type="primary" :loading="arranging === String(item._id || item.id)" :disabled="loading || !!arranging" :aria-label="`${wishMealId(item) ? '安排晚餐' : '查看心愿'}：${item.title}`" @click="arrangeWishlistDinner(item)">{{ wishMealId(item) ? '安排晚餐' : '查看心愿' }}</el-button>
          </div>
        </div>
        <div class="card-links"><router-link :to="{ name: 'wishlist' }">查看想吃清单 <span aria-hidden="true">→</span></router-link></div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Picture /></el-icon><span>最近饭桌照片</span></div></template>
        <el-empty v-if="!summary.recentPhotos?.length" description="还没有饭后照片" />
        <div v-else class="photo-strip">
          <router-link v-for="(photo, index) in summary.recentPhotos" :key="photoKey(photo, index)" :to="photoLink(photo)" class="photo-tile" :aria-label="`前往饭桌相册：${photo.title || photo.date || '饭桌照片'}`">
            <img v-if="!failedPhotos.has(photoKey(photo, index))" :src="resolveUploadedImage(photo.photo)" :alt="photo.title || photo.date || '饭桌照片'" loading="lazy" @error="photoError($event, photo, index)" />
            <span v-else class="photo-unavailable">照片暂不可用</span>
          </router-link>
        </div>
        <div class="card-links"><router-link :to="{ name: 'photoAlbum' }">打开饭桌相册 <span aria-hidden="true">→</span></router-link><router-link v-if="!summary.recentPhotos.length" :to="{ name: 'memories' }">记录饭后回忆 <span aria-hidden="true">→</span></router-link></div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Warning /></el-icon><span>默认菜品和图片</span></div></template>
        <div class="status-grid">
          <router-link :to="{ name: 'settings', query: { section: 'defaults' } }" :aria-label="`管理默认菜品，当前 ${summary.defaultMeals.imported} / ${summary.defaultMeals.total} 道`"><span>默认菜品</span><strong>{{ summary.defaultMeals.imported }}/{{ summary.defaultMeals.total }}</strong><small>管理菜品 →</small></router-link>
          <router-link :to="{ name: 'settings', query: { section: 'issues' } }" :aria-label="`查看待修正图片，当前 ${summary.imageIssues.open} 条`"><span>待修图</span><strong>{{ summary.imageIssues.open }}</strong><small>查看反馈 →</small></router-link>
          <router-link class="favorite-shortcut" :to="{ name: 'meals', query: { favorite: '1' } }" :aria-label="`查看收藏菜，当前 ${summary.meals.favorites} 道`"><span>收藏菜</span><strong>{{ summary.meals.favorites }}</strong><small>查看收藏 →</small></router-link>
        </div>
        <el-button plain @click="router.push('/settings')">去设置里管理</el-button>
      </el-card>
      <el-card class="quick-card">
        <template #header><div class="card-title"><el-icon><ShoppingCart /></el-icon><span>准备下一顿</span></div></template>
        <p class="quick-description">计划、食材和灵感，放在顺手的位置。</p>
        <div class="quick-links">
          <router-link to="/weekly-plan"><span class="quick-link-copy"><strong>查看周计划</strong><small>查看安排，按需生成草稿</small></span><span class="quick-arrow" aria-hidden="true">→</span></router-link>
          <router-link to="/shopping-list"><span class="quick-link-copy"><strong>查看购物清单</strong><small>整理下一顿需要的食材</small></span><span class="quick-arrow" aria-hidden="true">→</span></router-link>
          <router-link to="/meals"><span class="quick-link-copy"><strong>探索全部菜谱</strong><small>按分类或名称寻找灵感</small></span><span class="quick-arrow" aria-hidden="true">→</span></router-link>
          <router-link to="/review"><span class="quick-link-copy"><strong>回顾饭桌时光</strong><small>重温一起吃过的日子</small></span><span class="quick-arrow" aria-hidden="true">→</span></router-link>
        </div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page { --dashboard-accent-ink: color-mix(in srgb, var(--secondary-color) 45%, #33211a); display: flex; flex-direction: column; gap: 18px; }
.hero-panel { display: grid; grid-template-columns: 1fr 42%; min-height: 310px; align-items: stretch; border-radius: 30px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-primary); box-shadow: 0 18px 46px var(--shadow-color); }
.hero-panel > div:first-child { padding: clamp(28px, 4vw, 55px); align-self: center; }
.eyebrow { color: var(--dashboard-accent-ink) !important; font-size: 11px; letter-spacing: .14em; font-weight: 800; margin-bottom: 16px; }
h1 { margin: 0 0 12px; color: var(--text-primary); font-family: Georgia, 'Noto Serif SC', 'Songti SC', serif; font-size: clamp(34px, 4vw, 52px); line-height: 1.2; font-weight: 600; }
h1 span { color: var(--dashboard-accent-ink); }
.hero-panel p { color: var(--text-secondary); line-height: 1.8; font-size: 14px; max-width: 470px; }
.hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }.hero-actions .el-button { margin: 0; }
.hero-image { min-height: 260px; position: relative; background: linear-gradient(0deg, rgba(34,25,20,.52), transparent 50%), url('../assets/dashboard-hero.jpg') center/cover; }.hero-image span { position: absolute; right: 22px; bottom: 20px; color: white; font-size: 12px; letter-spacing: .12em; }
.section-heading { display: flex; justify-content: space-between; align-items: end; gap: 12px; padding: 8px 2px 0; }.section-heading small { color: var(--dashboard-accent-ink); letter-spacing: .14em; font-weight: 800; }.section-heading h2 { margin: 6px 0 0; font-size: 22px; color: var(--text-primary); }.summary-controls { display: flex; align-items: center; gap: 12px; color: var(--text-secondary); font-size: 13px; }
.load-error { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 20px; }.load-error p { margin-top: 5px; color: var(--text-secondary); }
.dashboard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.card-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 700; }.card-title .el-icon { color: var(--secondary-color); }.card-title .el-tag { margin-left: auto; }
.meal-row, .wishlist-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-light); }
.wishlist-row > div { min-width: 0; overflow-wrap: anywhere; }
.wishlist-context { margin: 0 0 4px; color: var(--text-secondary); font-size: 13px; line-height: 1.6; }
.wishlist-row .el-button { flex-shrink: 0; min-height: 44px; }
.meal-tags, .hint-list { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.meal-tags { flex: 1; min-width: 0; align-items: center; }
.today-recipe-link { display: inline-flex; align-items: center; min-height: 44px; max-width: 100%; padding: 5px 10px; border: 1px solid var(--border-color); border-radius: 10px; background: var(--bg-secondary); color: var(--text-primary); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; overflow-wrap: anywhere; }
.today-recipe-link:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.meal-tags :deep(.el-tag) { max-width: 100%; height: auto; }
.meal-tags :deep(.el-tag__content) { white-space: normal; overflow-wrap: anywhere; }
.hint-list :deep(.el-tag) { box-sizing: border-box; max-width: 100%; height: auto; }
.hint-list :deep(.el-tag__content) { min-width: 0; white-space: normal; overflow-wrap: anywhere; }
.meal-row > strong { flex: 0 0 auto; }
.today-slot-action { flex: 0 0 auto; min-width: 44px; min-height: 44px; color: var(--text-primary); font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.today-slot-action:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.muted, .wishlist-row p { color: var(--text-secondary); font-size: 13px; margin: 4px 0 0; }
.metric-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; color: var(--text-secondary); }
.metric-row strong { font-size: 32px; color: var(--dashboard-accent-ink); }
.week-mini { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 14px; }
.week-day { min-width: 0; min-height: 44px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 12px; padding: 8px; color: var(--text-primary); text-decoration: none; text-align: center; display: flex; flex-direction: column; justify-content: center; gap: 4px; }
.week-day:hover { background: var(--bg-tertiary); }
.week-day:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.week-day[aria-current="date"] { box-shadow: inset 0 0 0 2px var(--text-primary); }
.week-day span { color: var(--text-primary); }
.photo-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.photo-tile { display: block; min-width: 0; height: 88px; border-radius: 12px; overflow: hidden; background: var(--bg-secondary); text-decoration: none; }
.photo-tile:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 3px; }
.photo-strip img { display: block; width: 100%; height: 100%; object-fit: cover; }
.photo-unavailable { display: flex; align-items: center; justify-content: center; height: 100%; padding: 4px; text-align: center; color: var(--text-primary); font-size: 12px; }
.card-links { display: flex; flex-wrap: wrap; gap: 0 18px; margin-top: 12px; }
.card-links a { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; color: var(--text-primary); font-size: 13px; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.card-links a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; border-radius: 2px; }
.status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.status-grid div, .status-grid a { background: var(--bg-secondary); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.status-grid a { color: var(--text-primary); text-decoration: none; }
.status-grid a:hover { background: var(--bg-tertiary); }
.status-grid a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.status-grid a small { color: var(--text-primary); font-size: 12px; text-decoration: underline; text-underline-offset: 3px; }
.status-grid span { color: var(--text-secondary); font-size: 13px; }
.status-grid strong { color: var(--text-primary); font-size: 22px; }
.quick-description { color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; }
.quick-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.quick-links a { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 0; min-height: 72px; padding: 12px 14px; border: 1px solid var(--border-color); border-radius: 14px; text-decoration: none; background: var(--bg-secondary); color: var(--text-primary); }
.quick-links a:hover { background: var(--bg-tertiary); }
.quick-links a:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.quick-link-copy { display: flex; min-width: 0; flex-direction: column; gap: 5px; overflow-wrap: anywhere; }
.quick-link-copy strong { font-size: 14px; }.quick-link-copy small { color: var(--text-primary); font-size: 12px; line-height: 1.5; }
.quick-arrow { flex: 0 0 auto; font-size: 18px; }
@media (max-width: 820px) { .wishlist-row { flex-direction: column; align-items: stretch; } .dashboard-grid { grid-template-columns: 1fr; } .week-mini { grid-template-columns: repeat(7, 1fr); } }
@media (max-width: 600px) { .hero-panel { grid-template-columns: 1fr; }.hero-image { min-height: 150px; }.section-heading { align-items: start; flex-direction: column; gap: 8px; }.week-day { padding: 8px 2px; font-size: 10px; }.load-error { align-items: start; flex-direction: column; } }
@media (max-width: 480px) { .week-mini { grid-template-columns: repeat(4, minmax(0, 1fr)); } .week-day { font-size: 12px; } .status-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .status-grid .favorite-shortcut { grid-column: 1 / -1; flex-direction: row; align-items: center; } .status-grid .favorite-shortcut small { margin-left: auto; } .quick-links { grid-template-columns: 1fr; } }
:global(html:not(.dark) .dashboard-page .el-tag) { color: #8e4938; background: #fff8f4; border-color: #e8baaa; }
:global(html:not(.dark) .dashboard-page .hint-list .el-tag) { color: #744016; background: #fff0db; border-color: #d8aa75; }
:global(html.dark .dashboard-page .el-tag) { color: var(--text-primary); background: var(--bg-tertiary); border-color: var(--border-color); }
:global(html.dark .dashboard-page .hint-list .el-tag) { color: #ffe0b7; background: #543b29; border-color: #a77c50; }
:global(html.dark .dashboard-page) { --dashboard-accent-ink: var(--secondary-color); }
</style>
