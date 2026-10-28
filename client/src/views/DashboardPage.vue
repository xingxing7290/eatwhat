<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Calendar, ShoppingCart, Picture, Star, Warning, Food } from '@element-plus/icons-vue';
import api from '@/services/api';

const router = useRouter();
const loading = ref(false);
const summary = ref(null);
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };

const mealName = (item) => item?.meal?.name || item?.name || '未命名菜品';
const mealId = (meal) => meal?._id || meal?.id || meal?.mealId || (typeof meal === 'string' ? meal : '');
const plannedSlots = computed(() => (summary.value?.week?.days || []).reduce((count, day) => count + Object.keys(mealTypeText).filter(type => day.meals?.[type]?.length).length, 0));
const loadError = ref('');
const load = async () => {
  loading.value = true;
  loadError.value = '';
  try { summary.value = await api.dashboard.summary(); }
  catch (e) { loadError.value = e?.error || '暂时无法读取饭桌信息，请稍后重试'; }
  finally { loading.value = false; }
};
const arrangeWishlistDinner = (item) => {
  const id = mealId(item.mealId);
  if (!id) return router.push('/wishlist');
  return router.push({ name: 'MealSelection', query: {
    date: summary.value.today, mealType: 'dinner', suggestedMealId: id, wishlistId: item._id
  } });
};

onMounted(load);
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">OUR TABLE · 小家饭桌</p>
        <h1>好好吃饭，<br /><span>慢慢生活。</span></h1>
        <p>把每天的饭菜、想吃的灵感和一起度过的时光，收进属于你们的小家。</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" @click="router.push('/calendar')"><el-icon><Calendar /></el-icon>安排今天</el-button>
          <el-button size="large" @click="router.push('/meals')"><el-icon><Food /></el-icon>逛逛菜谱</el-button>
        </div>
      </div>
      <div class="hero-image" role="img" aria-label="家常菜照片"><span>日常的味道，值得被记住</span></div>
    </section>

    <div v-if="loadError && !loading" class="load-error" role="alert"><div><strong>暂时没有加载出饭桌信息</strong><p>{{ loadError }}</p></div><el-button @click="load">重新加载</el-button></div>
    <div v-if="summary && !loadError" class="section-heading"><div><small>TODAY & THIS WEEK</small><h2>你的饭桌，一目了然</h2></div><span>{{ summary.today }}</span></div>
    <section class="dashboard-grid" v-if="summary && !loadError">
      <el-card class="today-card">
        <template #header><div class="card-title"><el-icon><Food /></el-icon><span>今天吃什么</span><el-tag>{{ summary.today }}</el-tag></div></template>
        <div v-for="(label, type) in mealTypeText" :key="type" class="meal-row">
          <strong>{{ label }}</strong>
          <div class="meal-tags">
            <el-tag v-for="item in summary.todaySchedule?.meals?.[type] || []" :key="item.meal?._id || item._id" effect="plain">{{ mealName(item) }}</el-tag>
            <span v-if="!summary.todaySchedule?.meals?.[type]?.length" class="muted">还没安排</span>
          </div>
        </div>
        <div v-if="summary.todayHints?.length" class="hint-list"><el-tag v-for="hint in summary.todayHints" :key="hint" type="warning">{{ hint }}</el-tag></div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Calendar /></el-icon><span>本周饭桌计划</span></div></template>
        <div class="metric-row"><span>本周已安排</span><strong>{{ plannedSlots }}</strong><span>餐</span></div>
        <div class="week-mini">
          <div v-for="day in summary.week?.days || []" :key="day.date" class="week-day">
            <strong>{{ day.date.slice(5) }}</strong>
            <span>{{ ['breakfast','lunch','dinner'].filter(t => day.meals?.[t]?.length).length }} 餐</span>
          </div>
        </div>
        <el-button type="primary" plain @click="router.push('/weekly-plan')">查看周计划</el-button>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Star /></el-icon><span>TA 想吃提醒</span></div></template>
        <el-empty v-if="!summary.partnerWishlist?.length" description="暂时没有新的想吃提醒" />
        <div v-else class="wishlist-list">
          <div v-for="item in summary.partnerWishlist" :key="item._id" class="wishlist-row">
            <div><strong>{{ item.title }}</strong><p>{{ item.mealId?.name || item.note || '可以安排到今天晚餐' }}</p></div>
            <el-button size="small" type="primary" @click="arrangeWishlistDinner(item)">安排晚餐</el-button>
          </div>
        </div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Picture /></el-icon><span>最近饭桌照片</span></div></template>
        <el-empty v-if="!summary.recentPhotos?.length" description="还没有饭后照片" />
        <div v-else class="photo-strip">
          <img v-for="photo in summary.recentPhotos" :key="photo.photo" :src="photo.photo" :alt="photo.title || photo.date" @click="router.push('/photo-album')" />
        </div>
      </el-card>

      <el-card>
        <template #header><div class="card-title"><el-icon><Warning /></el-icon><span>默认菜品和图片</span></div></template>
        <div class="status-grid">
          <div><span>默认菜品</span><strong>{{ summary.defaultMeals?.imported || 0 }}/{{ summary.defaultMeals?.total || 0 }}</strong></div>
          <div><span>待修图</span><strong>{{ summary.imageIssues?.open || 0 }}</strong></div>
          <div><span>收藏菜</span><strong>{{ summary.meals?.favorites || 0 }}</strong></div>
        </div>
        <el-button plain @click="router.push('/settings')">去设置里管理</el-button>
      </el-card>
      <el-card class="quick-card">
        <template #header><div class="card-title"><el-icon><ShoppingCart /></el-icon><span>准备下一顿</span></div></template>
        <p class="quick-description">计划、食材和灵感，放在顺手的位置。</p>
        <div class="quick-links"><router-link to="/weekly-plan">生成周计划 <span>→</span></router-link><router-link to="/shopping-list">查看购物清单 <span>→</span></router-link><router-link to="/meals">探索全部菜谱 <span>→</span></router-link></div>
      </el-card>
    </section>
  </div>
</template>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 18px; }
.hero-panel { display: grid; grid-template-columns: 1fr 42%; min-height: 310px; align-items: stretch; border-radius: 30px; overflow: hidden; border: 1px solid var(--border-color); background: var(--bg-primary); box-shadow: 0 18px 46px var(--shadow-color); }
.hero-panel > div:first-child { padding: clamp(28px, 4vw, 55px); align-self: center; }
.eyebrow { color: var(--secondary-color) !important; font-size: 11px; letter-spacing: .14em; font-weight: 800; margin-bottom: 16px; }
h1 { margin: 0 0 12px; color: var(--text-primary); font-family: Georgia, 'Noto Serif SC', 'Songti SC', serif; font-size: clamp(34px, 4vw, 52px); line-height: 1.2; font-weight: 600; }
h1 span { color: var(--secondary-color); }
.hero-panel p { color: var(--text-secondary); line-height: 1.8; font-size: 14px; max-width: 470px; }
.hero-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 24px; }.hero-actions .el-button { margin: 0; }
.hero-image { min-height: 260px; position: relative; background: linear-gradient(0deg, rgba(34,25,20,.52), transparent 50%), url('../assets/dashboard-hero.jpg') center/cover; }.hero-image span { position: absolute; right: 22px; bottom: 20px; color: white; font-size: 12px; letter-spacing: .12em; }
.section-heading { display: flex; justify-content: space-between; align-items: end; padding: 8px 2px 0; }.section-heading small { color: var(--secondary-color); letter-spacing: .14em; font-weight: 800; }.section-heading h2 { margin: 6px 0 0; font-size: 22px; color: var(--text-primary); }.section-heading > span { color: var(--text-secondary); font-size: 13px; }
.load-error { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 24px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: 20px; }.load-error p { margin-top: 5px; color: var(--text-secondary); }
.dashboard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.card-title { display: flex; align-items: center; gap: 8px; color: var(--text-primary); font-weight: 700; }.card-title .el-icon { color: var(--secondary-color); }.card-title .el-tag { margin-left: auto; }
.meal-row, .wishlist-row { display: flex; justify-content: space-between; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--border-light); }
.meal-tags, .hint-list { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.muted, .wishlist-row p { color: var(--text-secondary); font-size: 13px; margin: 4px 0 0; }
.metric-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 12px; color: var(--text-secondary); }
.metric-row strong { font-size: 32px; color: var(--primary-color); }
.week-mini { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 14px; }
.week-day { background: var(--bg-secondary); border-radius: 12px; padding: 8px; text-align: center; display: flex; flex-direction: column; gap: 4px; }
.photo-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.photo-strip img { width: 100%; height: 88px; object-fit: cover; border-radius: 12px; cursor: pointer; }
.status-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
.status-grid div { background: var(--bg-secondary); border-radius: 14px; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
.status-grid span { color: var(--text-secondary); font-size: 13px; }
.status-grid strong { color: var(--text-primary); font-size: 22px; }
.quick-description { color: var(--text-secondary); font-size: 13px; margin-bottom: 12px; }.quick-links { display: grid; gap: 8px; }.quick-links a { display: flex; justify-content: space-between; padding: 12px 14px; border-radius: 14px; text-decoration: none; background: var(--bg-secondary); color: var(--text-primary); }.quick-links a:hover { color: var(--secondary-color); }
@media (max-width: 820px) { .wishlist-row { flex-direction: column; align-items: stretch; } .dashboard-grid { grid-template-columns: 1fr; } .week-mini { grid-template-columns: repeat(7, 1fr); } }
@media (max-width: 600px) { .hero-panel { grid-template-columns: 1fr; }.hero-image { min-height: 150px; }.section-heading { align-items: start; flex-direction: column; gap: 8px; }.week-day { padding: 8px 2px; font-size: 10px; }.load-error { align-items: start; flex-direction: column; } }
</style>
