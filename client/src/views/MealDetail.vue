<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { ArrowLeft, Edit, Star, Clock, Bowl, Picture, Check, Warning } from '@element-plus/icons-vue';
import api from '@/services/api';
import defaultImage from '@/assets/meal-placeholder.png';

const route = useRoute();
const router = useRouter();
const meal = ref(null);
const memories = ref([]);
const loading = ref(false);

const totalTime = computed(() => Number(meal.value?.prepTime || 0) + Number(meal.value?.cookTime || 0));
const difficultyText = computed(() => ({ easy: '简单', medium: '适中', hard: '费工夫' }[meal.value?.difficulty] || '未设置'));
const coverImage = computed(() => meal.value?.imageUrl || defaultImage);
const todayKey = () => new Date().toISOString().slice(0, 10);
const doneOnce = async () => {
  if (!meal.value) return;
  try {
    const fd = new FormData();
    fd.append('date', todayKey());
    fd.append('mealType', 'dinner');
    fd.append('title', `做过一次：${meal.value.name}`);
    fd.append('mealIds', JSON.stringify([meal.value._id || meal.value.id]));
    fd.append('rating', String(meal.value.rating || 5));
    fd.append('actualCookTime', String(totalTime.value || 0));
    fd.append('nextImprovement', '下次可以根据这次口味继续微调。');
    await api.memory.create(fd);
    ElMessage.success('已记录为一条饭后回忆');
    router.push('/memories');
  } catch (e) { ElMessage.error(e?.error || '记录失败'); }
};
const reportImageIssue = async () => {
  if (!meal.value) return;
  try {
    await api.mealImageIssue.create({ mealId: meal.value._id || meal.value.id, issueType: 'wrong_image', note: '这张图片和菜名不匹配' });
    ElMessage.success('已加入待修正图片列表');
  } catch (e) { ElMessage.error(e?.error || '提交失败'); }
};

const load = async () => {
  try {
    loading.value = true;
    meal.value = await api.meal.getMealById(route.params.id);
    memories.value = await api.memory.list({ mealId: route.params.id });
  } catch (e) {
    ElMessage.error(e?.error || '加载菜品详情失败');
  } finally {
    loading.value = false;
  }
};

onMounted(load);
</script>

<template>
  <div class="meal-detail" v-loading="loading">
    <div class="detail-toolbar">
      <el-button @click="router.push('/meals')"><el-icon><ArrowLeft /></el-icon>返回</el-button>
      <div class="toolbar-actions">
        <el-button type="success" @click="doneOnce"><el-icon><Check /></el-icon>做过一次</el-button>
        <el-button type="warning" @click="reportImageIssue"><el-icon><Warning /></el-icon>图片不对</el-button>
        <el-button type="primary" @click="router.push({ name: 'MealEditor', params: { id: route.params.id } })">
          <el-icon><Edit /></el-icon>编辑菜品
        </el-button>
      </div>
    </div>

    <template v-if="meal">
      <section class="hero">
        <img :src="coverImage" :alt="meal.name" />
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
              <span>{{ item.name }}</span><strong>{{ item.amount }}</strong>
            </div>
          </div>
        </el-card>

        <el-card>
          <template #header>做法步骤</template>
          <el-empty v-if="!meal.steps?.length" description="暂无做法" />
          <div v-else class="steps-list">
            <div v-for="(step, index) in meal.steps" :key="index" class="step-item">
              <div class="step-index">{{ index + 1 }}</div>
              <img v-if="step.imageUrl" :src="step.imageUrl" alt="步骤图" />
              <p>{{ step.description }}</p>
            </div>
          </div>
        </el-card>
      </section>

      <section class="content-grid">
        <el-card>
          <template #header>照片墙</template>
          <div v-if="meal.photos?.length" class="photo-grid">
            <img v-for="photo in meal.photos" :key="photo" :src="photo" alt="菜品照片" />
          </div>
          <el-empty v-else description="暂无额外照片"><template #image><el-icon><Picture /></el-icon></template></el-empty>
        </el-card>

        <el-card>
          <template #header>饭后回忆</template>
          <el-empty v-if="!memories.length" description="还没有相关回忆" />
          <div v-else class="memory-list">
            <div v-for="item in memories" :key="item._id" class="memory-item">
              <div class="memory-date">{{ item.date }} · {{ item.mood || '日常一餐' }}</div>
              <strong>{{ item.title || meal.name }}</strong>
              <p>{{ item.note }}</p>
              <p v-if="item.actualCookTime || item.nextImprovement" class="memory-extra">实际耗时 {{ item.actualCookTime || '-' }} 分钟 · {{ item.nextImprovement || '暂无改进记录' }}</p>
              <el-rate :model-value="item.rating || 0" disabled size="small" />
            </div>
          </div>
        </el-card>
      </section>

      <el-card v-if="meal.tips" class="tips-card">
        <template #header>烹饪小贴士</template>
        <p>{{ meal.tips }}</p>
      </el-card>
    </template>
  </div>
</template>

<style scoped>
.meal-detail { display: flex; flex-direction: column; gap: 18px; }
.detail-toolbar { display: flex; justify-content: space-between; gap: 12px; }
.toolbar-actions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.hero { display: grid; grid-template-columns: minmax(280px, 460px) 1fr; gap: 24px; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 12px var(--shadow-color); }
.hero img { width: 100%; height: 320px; object-fit: cover; border-radius: 10px; background: var(--bg-secondary); }
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
.step-index { width: 28px; height: 28px; border-radius: 50%; background: var(--primary-color); color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.step-item img, .photo-grid img { width: 100%; height: 82px; object-fit: cover; border-radius: 8px; }
.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; }
.memory-item { padding: 12px; background: var(--bg-secondary); border-radius: 8px; }
.memory-date, .memory-extra { color: var(--text-muted); font-size: 13px; }
.tips-card p { white-space: pre-wrap; }
@media (max-width: 768px) { .hero, .content-grid { grid-template-columns: 1fr; } .meta-grid { grid-template-columns: repeat(2, 1fr); } .step-item { grid-template-columns: 28px 1fr; } .step-item img { grid-column: 2; } }
</style>