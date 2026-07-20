<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Calendar, ShoppingCart, Picture, Star, Warning, Food } from '@element-plus/icons-vue';
import api from '@/services/api';

const router = useRouter();
const loading = ref(false);
const summary = ref(null);
const mealTypeText = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
const todayDinnerLoading = ref('');

const mealName = (item) => item?.meal?.name || item?.name || '未命名菜品';
const mealId = (meal) => meal?._id || meal?.id || meal?.mealId || '';
const load = async () => {
  loading.value = true;
  try { summary.value = await api.dashboard.summary(); }
  catch (e) { ElMessage.error(e?.error || '加载小家仪表盘失败'); }
  finally { loading.value = false; }
};
const arrangeWishlistDinner = async (item) => {
  const id = mealId(item.mealId);
  if (!id) return router.push('/wishlist');
  try {
    todayDinnerLoading.value = item._id;
    await api.schedule.setMeal(summary.value.today, 'dinner', [id]);
    await api.wishlist.updateStatus(item._id, 'planned');
    ElMessage.success('已安排到今天晚餐');
    await load();
  } catch (e) { ElMessage.error(e?.error || '安排失败'); }
  finally { todayDinnerLoading.value = ''; }
};

onMounted(load);
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <section class="hero-panel">
      <div>
        <p class="eyebrow">两个人的小饭桌</p>
        <h1>今天一起吃点什么？</h1>
        <p>把日历排餐、想吃清单、饭后回忆和默认菜品都放在一个入口里。</p>
      </div>
      <div class="hero-actions">
        <el-button type="primary" @click="router.push('/weekly-plan')"><el-icon><Calendar /></el-icon>生成本周菜单</el-button>
        <el-button @click="router.push('/shopping-list')"><el-icon><ShoppingCart /></el-icon>购物清单</el-button>
      </div>
    </section>

    <section class="dashboard-grid" v-if="summary">
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
        <div class="metric-row"><span>本周已安排</span><strong>{{ summary.week?.plannedMeals || 0 }}</strong><span>餐</span></div>
        <div class="week-mini">
          <div v-for="day in summary.week?.days || []" :key="day.date" class="week-day">
            <strong>{{ day.date.slice(5) }}</strong>
            <span>{{ ['breakfast','lunch','dinner'].reduce((n,t)=>n+(day.meals?.[t]?.length||0),0) }} 餐</span>
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
            <el-button size="small" type="primary" :loading="todayDinnerLoading === item._id" @click="arrangeWishlistDinner(item)">安排晚餐</el-button>
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
    </section>
  </div>
</template>

<style scoped>
.dashboard-page { display: flex; flex-direction: column; gap: 18px; }
.hero-panel { display: flex; justify-content: space-between; gap: 18px; align-items: center; padding: 26px; border-radius: 22px; background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary)); box-shadow: 0 18px 46px var(--shadow-color); }
.eyebrow { color: var(--primary-color); font-weight: 700; margin-bottom: 8px; }
h1 { margin: 0 0 8px; color: var(--text-primary); }
.hero-panel p { color: var(--text-secondary); }
.hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
.dashboard-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.card-title { display: flex; align-items: center; gap: 8px; justify-content: space-between; }
.meal-row, .wishlist-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border-light); }
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
@media (max-width: 820px) { .hero-panel, .meal-row, .wishlist-row { flex-direction: column; align-items: stretch; } .dashboard-grid { grid-template-columns: 1fr; } .week-mini { grid-template-columns: repeat(4, 1fr); } }
</style>
