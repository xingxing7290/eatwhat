<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import MealCard from '../components/MealCard.vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Search, Plus, Upload, Delete, Food, Grid, List, Document, Edit, Menu, Filter, View, Present } from '@element-plus/icons-vue';

const router = useRouter();
const mealStore = useMealStore();

// 状态 - 列表过滤和分页
const searchQuery = ref('');
const selectedTag = ref('');
const selectedCategory = ref('');
const selectedSubcategory = ref('');
const selectedDifficulty = ref('');
const favoriteOnly = ref(false);
const currentPage = ref(1);
const pageSize = ref(8);
const loading = ref(false);

// 状态 - 显示方式
const currentView = ref('grid'); // 'grid', 'list', 'table'
const showAdvancedFilters = ref(false);

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedTag.value || selectedCategory.value || selectedSubcategory.value || selectedDifficulty.value || favoriteOnly.value);
});

// 状态 - 新增菜品对话框
const addMealDialogVisible = ref(false);
const isSubmitting = ref(false);
const newMealFormRef = ref(null);
const imageFileToUpload = ref(null);
const newMealImagePreviewUrl = ref('');

const newMealForm = reactive({
  name: '',
  description: '',
  tags: []
});

const newMealRules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }]
};

const categoryOptions = computed(() => {
  const set = new Set();
  const rows = Array.isArray(mealStore.categories) && mealStore.categories.length > 0
    ? mealStore.categories
    : mealStore.meals.map(m => ({ category: m.category || '' }));
  rows.forEach(r => {
    if (r.category) set.add(r.category);
  });
  return Array.from(set);
});

const subcategoryOptions = computed(() => {
  if (!selectedCategory.value) return [];
  const set = new Set();
  const rows = Array.isArray(mealStore.categories) && mealStore.categories.length > 0
    ? mealStore.categories
    : mealStore.meals.map(m => ({ category: m.category || '', subcategory: m.subcategory || '' }));
  rows.forEach(r => {
    if (r.category === selectedCategory.value && r.subcategory) set.add(r.subcategory);
  });
  return Array.from(set);
});

const groupedMeals = computed(() => {
  const groups = new Map();
  for (const meal of mealStore.meals) {
    const c = meal.category || '未分类';
    const s = meal.subcategory || '其它';
    if (!groups.has(c)) groups.set(c, new Map());
    const subMap = groups.get(c);
    if (!subMap.has(s)) subMap.set(s, []);
    subMap.get(s).push(meal);
  }
  const out = [];
  for (const [category, subMap] of groups.entries()) {
    const subs = [];
    for (const [subcategory, meals] of subMap.entries()) {
      subs.push({ subcategory, meals });
    }
    subs.sort((a, b) => a.subcategory.localeCompare(b.subcategory, 'zh'));
    out.push({ category, subs });
  }
  out.sort((a, b) => a.category.localeCompare(b.category, 'zh'));
  return out;
});

// 计算所有标签
const allTags = computed(() => {
  if (Array.isArray(mealStore.tags) && mealStore.tags.length > 0) {
    return mealStore.tags;
  }

  const tagsSet = new Set();

  mealStore.meals.forEach(meal => {
    if (meal.tags && Array.isArray(meal.tags)) {
      meal.tags.forEach(tag => tagsSet.add(tag));
    }
  });

  return Array.from(tagsSet);
});

// 获取菜品图片
const getMealImage = (meal) => {
  const imagePath = meal.imageUrl || meal.image;
  if (!imagePath) {
    return '/src/assets/meal-placeholder.png';
  }
  if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
    try {
      if (imagePath.startsWith('http')) {
        const u = new URL(imagePath);
        const isUploads = u.pathname.startsWith('/uploads/');
        const sameHost = u.hostname === window.location.hostname;
        const hasPort = !!u.port;
        if (isUploads && sameHost && !hasPort) {
          return `${window.location.origin}${u.pathname}`;
        }
      }
    } catch (_) {}
    return imagePath;
  }
  return '/src/assets/meal-placeholder.png';
};

// 图片加载错误处理
const handleImageError = (e) => {
  const img = e.target;
  const src = img?.src || '';
  const hasRetried = img?.dataset?.retry === '1';
  try {
    const u = new URL(src, window.location.origin);
    const isUploads = u.pathname.startsWith('/uploads/');
    if (isUploads && !hasRetried) {
      img.dataset.retry = '1';
      img.src = `${window.location.origin}/api${u.pathname}`;
      return;
    }
  } catch (_) {}
  img.src = '/src/assets/meal-placeholder.png';
};

// 加载所有菜品
const fetchMeals = async () => {
  loading.value = true;

  try {
    const params = {};

    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedTag.value) params.tag = selectedTag.value;
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedSubcategory.value) params.subcategory = selectedSubcategory.value;
    if (selectedDifficulty.value) params.difficulty = selectedDifficulty.value;
    if (favoriteOnly.value) params.favorite = 'true';

    if (currentView.value !== 'grouped') {
      params.page = currentPage.value;
      params.limit = pageSize.value;
    }

    await mealStore.fetchAllMeals(params);
  } catch (error) {
    ElMessage.error('获取菜品列表失败');
  } finally {
    loading.value = false;
  }
};

// 编辑菜品
const handleEditMeal = (meal) => {
  const mealId = meal._id || meal.id;
  router.push({
    name: 'MealEditor',
    params: { id: mealId }
  });
};

const handleViewMeal = (meal) => {
  const mealId = meal._id || meal.id;
  router.push({ name: 'MealDetail', params: { id: mealId } });
};

const handleShareMeal = (meal) => {
  ElMessage.success(`已把「${meal.name}」投喂给 TA 的今日灵感`);
};

const feedInspiration = () => {
  const meal = mealStore.meals[0];
  if (meal) {
    handleShareMeal(meal);
    return;
  }
  router.push({ name: 'MealEditor' });
};

// 删除菜品
const handleDeleteMeal = async (meal) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除菜品"${meal.name}"吗？`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const mealId = meal._id || meal.id;
    await mealStore.deleteMeal(mealId);
    ElMessage.success('删除成功');

    // 重新获取菜品列表
    await fetchMeals();
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
};

// 添加菜品
const handleAddMeal = async () => {
  await newMealFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    try {
      isSubmitting.value = true;

      // 使用 FormData 携带文本与图片
      const fd = new FormData();
      fd.append('name', newMealForm.name);
      fd.append('description', newMealForm.description || '');
      fd.append('tags', JSON.stringify(newMealForm.tags || []));
      if (imageFileToUpload.value?.raw) {
        fd.append('image', imageFileToUpload.value.raw);
      }

      await mealStore.createMeal(fd);

      ElMessage.success('添加成功');
      addMealDialogVisible.value = false;

      // 重置表单
      newMealForm.name = '';
      newMealForm.description = '';
      newMealForm.tags = [];
      newMealImagePreviewUrl.value = '';
      imageFileToUpload.value = null;

      // 重新获取菜品列表
      await fetchMeals();
    } catch (error) {
      ElMessage.error('添加失败');
    } finally {
      isSubmitting.value = false;
    }
  });
};

// 处理图片上传
const handleImageChange = (file) => {
  imageFileToUpload.value = file;
  newMealImagePreviewUrl.value = URL.createObjectURL(file.raw);
};

// 清除筛选
const clearFilters = () => {
  searchQuery.value = '';
  selectedTag.value = '';
  selectedCategory.value = '';
  selectedSubcategory.value = '';
  selectedDifficulty.value = '';
  favoriteOnly.value = false;
  showAdvancedFilters.value = false;
  currentPage.value = 1;
};

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
  scheduleFetch(0);
};

let fetchTimer = null;
const scheduleFetch = (delay = 160) => {
  if (fetchTimer) clearTimeout(fetchTimer);
  fetchTimer = setTimeout(() => {
    fetchMeals();
  }, delay);
};

// 监听筛选条件变化，重置分页
watch([searchQuery, selectedTag, selectedCategory, selectedSubcategory, selectedDifficulty, favoriteOnly], () => {
  currentPage.value = 1;
  scheduleFetch();
});

watch(selectedCategory, () => {
  selectedSubcategory.value = '';
});

watch(currentView, () => {
  currentPage.value = 1;
  scheduleFetch(0);
});

onMounted(async () => {
  await fetchMeals();
  try {
    await mealStore.fetchMealCategories();
    await mealStore.fetchMealTags();
  } catch (_) {}
});
</script>

<template>
  <div class="meal-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">菜品管理</h1>
          <p class="page-subtitle">两个人的小小菜谱手账，收藏每一顿日常的好味道</p>
        </div>
        <div class="header-actions">
          <el-button
            type="primary"
            @click="router.push({ name: 'MealEditor' })"
            class="add-meal-btn"
          >
        <el-icon><Plus /></el-icon>
            <span class="btn-text">添加菜品</span>
      </el-button>
        </div>
      </div>
    </div>

    <div class="couple-presence-card">
      <div class="presence-avatars">
        <span>我</span>
        <span>TA</span>
      </div>
      <div class="presence-copy">
        <strong>TA 正在看当前的菜谱...</strong>
        <p>挑一道今晚一起吃的菜，或者把灵感先投喂给 TA。</p>
      </div>
      <el-button type="primary" class="feed-inspiration-btn" @click="feedInspiration">
        <el-icon><Present /></el-icon>
        投喂灵感
      </el-button>
    </div>

    <!-- 搜索和过滤区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="search-box">
          <el-input
            v-model="searchQuery"
            placeholder="搜索菜名、描述、食材或做法..."
            clearable
            class="search-input"
            :prefix-icon="Search"
          />
        </div>
      </div>

      <div class="toolbar-row">
        <div class="view-toggle">
          <el-radio-group v-model="currentView" size="small" class="view-switcher">
            <el-radio-button value="grid">
              <el-icon><Grid /></el-icon>
              <span class="view-label">网格</span>
            </el-radio-button>
            <el-radio-button value="list">
              <el-icon><List /></el-icon>
              <span class="view-label">列表</span>
            </el-radio-button>
            <el-radio-button value="table">
              <el-icon><Document /></el-icon>
              <span class="view-label">表格</span>
            </el-radio-button>
            <el-radio-button value="grouped">
              <el-icon><Menu /></el-icon>
              <span class="view-label">分组</span>
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="toolbar-actions">
          <el-button size="small" @click="showAdvancedFilters = !showAdvancedFilters">
            <el-icon><Filter /></el-icon>
            筛选
          </el-button>
          <el-button v-if="hasActiveFilters" type="info" size="small" @click="clearFilters" class="clear-filters-btn">
            清除
          </el-button>
        </div>
      </div>

      <el-collapse-transition>
        <div v-show="showAdvancedFilters" class="advanced-filters">
          <div class="filter-item">
            <el-select v-model="selectedTag" placeholder="选择标签" clearable class="tag-select">
              <el-option
                v-for="tag in allTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <el-select v-model="selectedCategory" placeholder="选择分类" clearable class="tag-select">
              <el-option
                v-for="c in categoryOptions"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <el-select
              v-model="selectedSubcategory"
              placeholder="选择子类"
              clearable
              class="tag-select"
              :disabled="!selectedCategory"
            >
              <el-option
                v-for="s in subcategoryOptions"
                :key="s"
                :label="s"
                :value="s"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <el-select v-model="selectedDifficulty" placeholder="选择难度" clearable class="tag-select">
              <el-option label="简单" value="easy" />
              <el-option label="中等" value="medium" />
              <el-option label="进阶" value="hard" />
            </el-select>
          </div>

          <div class="filter-item favorite-filter">
            <el-checkbox v-model="favoriteOnly">只看收藏</el-checkbox>
          </div>
        </div>
      </el-collapse-transition>
        </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 菜品列表 -->
    <div v-else-if="mealStore.meals.length > 0" class="meals-container">
      <div v-if="currentView === 'grouped'" class="meals-grouped">
        <el-collapse accordion>
          <el-collapse-item
            v-for="group in groupedMeals"
            :key="group.category"
            :title="`${group.category}（${group.subs.reduce((acc, s) => acc + s.meals.length, 0)}）`"
          >
            <el-collapse accordion>
              <el-collapse-item
                v-for="sub in group.subs"
                :key="`${group.category}-${sub.subcategory}`"
                :title="`${sub.subcategory}（${sub.meals.length}）`"
              >
                <div class="meals-grid">
                  <MealCard
                    v-for="meal in sub.meals"
                    :key="meal._id || meal.id"
                    :meal="meal"
                    @view="handleViewMeal"
                    @edit="handleEditMeal"
                    @delete="handleDeleteMeal"
                    @share="handleShareMeal"
                  />
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 网格布局 -->
      <div v-else-if="currentView === 'grid'" class="meals-grid">
        <MealCard
          v-for="meal in mealStore.meals"
          :key="meal._id || meal.id"
          :meal="meal"
          @view="handleViewMeal"
          @edit="handleEditMeal"
          @delete="handleDeleteMeal"
          @share="handleShareMeal"
        />
      </div>

      <!-- 列表布局 -->
      <div v-else-if="currentView === 'list'" class="meals-list">
        <div
          v-for="meal in mealStore.meals"
          :key="meal._id || meal.id"
          class="meal-list-item"
          @click="handleViewMeal(meal)"
        >
          <div class="meal-list-image">
            <img
              :src="getMealImage(meal)"
              :alt="meal.name"
              @error="handleImageError"
            />
          </div>

          <div class="meal-list-info">
            <div class="meal-list-header">
              <h3 class="meal-list-name">{{ meal.name }}</h3>
              <div class="meal-list-actions">
                <el-button
                  type="info"
                  size="small"
                  circle
                  @click.stop="handleViewMeal(meal)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  circle
                  class="list-feed-btn"
                  @click.stop="handleShareMeal(meal)"
                >
                  <el-icon><Present /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  circle
                  @click.stop="handleEditMeal(meal)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click.stop="handleDeleteMeal(meal)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <p v-if="meal.description" class="meal-list-description">
              {{ meal.description }}
            </p>

            <div class="meal-list-meta">
              <div v-if="meal.tags && meal.tags.length > 0" class="meal-list-tags">
          <el-tag
                  v-for="tag in meal.tags.slice(0, 3)"
            :key="tag"
                  size="small"
            effect="light"
                  class="meal-tag"
          >
            {{ tag }}
          </el-tag>
                <span v-if="meal.tags.length > 3" class="more-tags">
                  +{{ meal.tags.length - 3 }}
                </span>
        </div>

              <div v-if="meal.ingredients && meal.ingredients.length > 0" class="meal-list-ingredients">
                <span class="ingredients-count">
                  {{ meal.ingredients.length }} 种食材
                </span>
      </div>
    </div>
          </div>
        </div>
          </div>

      <!-- 表格布局 -->
      <div v-else-if="currentView === 'table'" class="meals-table">
        <el-table
          :data="mealStore.meals"
          style="width: 100%"
          class="meals-table-content"
        >
          <el-table-column label="操作" width="160" align="center">
            <template #default="{ row }">
              <div class="table-image">
                <img
                  :src="getMealImage(row)"
                  :alt="row.name"
                  @error="handleImageError"
              />
            </div>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="菜品名称" min-width="120">
            <template #default="{ row }">
              <div class="table-name">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">
              <div class="table-description">
                {{ row.description || '暂无描述' }}
          </div>
            </template>
          </el-table-column>

          <el-table-column label="标签" min-width="150">
            <template #default="{ row }">
              <div class="table-tags">
                <el-tag
                  v-for="tag in (row.tags || []).slice(0, 2)"
                  :key="tag"
                  size="small"
                  effect="light"
                  class="table-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="row.tags && row.tags.length > 2" class="more-tags">
                  +{{ row.tags.length - 2 }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="食材" min-width="120">
            <template #default="{ row }">
              <div class="table-ingredients">
                {{ row.ingredients && row.ingredients.length > 0 ? `${row.ingredients.length} 种` : '无' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="120" align="center">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button
                  type="info"
                  size="small"
                  circle
                  @click="handleViewMeal(row)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  circle
                  @click="handleEditMeal(row)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  @click="handleDeleteMeal(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页器 (仅桌面端) -->
      <div v-if="currentView !== 'grouped' && Math.ceil(mealStore.totalMeals / pageSize) > 1" class="pagination-container desktop-only">
            <el-pagination
              v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="mealStore.totalMeals"
          layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <el-icon class="empty-icon"><Food /></el-icon>
        <h3>暂无菜品</h3>
        <p>开始添加你的第一个菜品吧！</p>
        <el-button
          type="primary"
          @click="router.push({ name: 'MealEditor' })"
          class="empty-action-btn"
        >
          <el-icon><Plus /></el-icon>
          添加菜品
        </el-button>
      </div>
    </div>

    <!-- 添加菜品对话框 -->
    <el-dialog
      v-model="addMealDialogVisible"
      title="添加菜品"
      width="90%"
      :max-width="600"
      center
      class="add-meal-dialog"
    >
      <el-form
        ref="newMealFormRef"
        :model="newMealForm"
        :rules="newMealRules"
        label-width="80px"
        class="add-meal-form"
      >
        <el-form-item label="菜品名称" prop="name">
          <el-input
            v-model="newMealForm.name"
            placeholder="请输入菜品名称"
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="newMealForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入菜品描述"
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="newMealForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            class="form-input"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="图片">
          <el-upload
            class="image-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <div class="upload-area">
              <el-icon v-if="!newMealImagePreviewUrl" class="upload-icon"><Upload /></el-icon>
              <img
                v-else
                :src="newMealImagePreviewUrl"
                class="image-preview"
                alt="预览图"
              />
              <div class="upload-text">
                {{ newMealImagePreviewUrl ? '点击更换图片' : '点击上传图片' }}
              </div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addMealDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleAddMeal"
            :loading="isSubmitting"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.meal-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 0;
}

/* 页面标题和操作栏 */
  .page-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  margin: -20px -20px 20px -20px;
  padding: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.header-content {
    display: flex;
    align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
  background: var(--gradient-primary);
      -webkit-background-clip: text;
      color: transparent;
    }

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

/* 显示方式切换 */
.view-toggle {
  margin-right: 16px;
}

.view-switcher {
  border-radius: 8px;
  overflow: hidden;
}

.view-switcher .el-radio-button__inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all 0.3s ease;
  cursor: pointer;
}

.view-switcher .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--primary-color);
  color: white;
  box-shadow: none;
}

.view-label {
  font-size: 14px;
  font-weight: 500;
}

.add-meal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-text {
  display: inline;
}

/* 搜索和过滤区域 */
.filter-section {
  background: var(--bg-primary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
    }

.filter-row {
        display: flex;
  gap: 16px;
        align-items: center;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
}

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.advanced-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.filter-item {
  min-width: 0;
}

.favorite-filter {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.tag-filter {
  min-width: 200px;
}

.tag-select {
  width: 100%;
}

.mobile-filter-actions {
  display: none;
  justify-content: flex-end;
}

.clear-filters-btn {
          font-size: 14px;
}

/* 加载状态 */
.loading-container {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 20px;
}

/* 菜品列表容器 */
.meals-container {
  margin-bottom: 20px;
}

/* 网格布局 */
.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 列表布局样式 */
.meals-list {
        display: flex;
  flex-direction: column;
  gap: 16px;
}

.meal-list-item {
  display: flex;
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: all 0.3s ease;
  cursor: pointer;

          &:hover {
            transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow-color);
  }
}

.meal-list-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  overflow: hidden;
}

.meal-list-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meal-list-info {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.meal-list-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.meal-list-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.meal-list-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
          }

.meal-list-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  }

.meal-list-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.meal-tag {
  border-radius: 16px;
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  line-height: 1.2;
}

.more-tags {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.meal-list-ingredients {
  font-size: 12px;
  color: var(--text-secondary);
}

.ingredients-count {
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

/* 表格布局样式 */
.meals-table {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.meals-table-content {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: var(--bg-secondary);
  --el-table-bg-color: var(--bg-primary);
  --el-table-tr-bg-color: var(--bg-primary);
  --el-table-text-color: var(--text-primary);
}

.table-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.table-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-name {
  font-weight: 600;
  color: var(--text-primary);
}

.table-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
    }

.table-tags {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.table-tag {
  border-radius: 12px;
  font-size: 11px;
  padding: 2px 6px;
  height: auto;
  line-height: 1.2;
    }

.table-ingredients {
  color: var(--text-secondary);
  font-size: 14px;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 分页器 */
    .pagination-container {
  display: flex;
  justify-content: center;
      margin-top: 30px;
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

/* 空状态 */
.empty-state {
      display: flex;
  align-items: center;
      justify-content: center;
  min-height: 400px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.empty-content {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.empty-content h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.empty-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

/* 对话框样式 */
.add-meal-dialog {
  border-radius: 16px;
}

.add-meal-form {
  padding: 20px 0;
}

.form-input {
    width: 100%;
  }

.image-upload {
    width: 100%;
}

.upload-area {
  border: 2px dashed var(--border-color);
    border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);

    &:hover {
      border-color: var(--primary-color);
    background: var(--bg-primary);
  }
}

.upload-icon {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  }

  .image-preview {
  width: 120px;
  height: 120px;
      object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.upload-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-footer {
      display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    margin: -16px -16px 16px -16px;
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-title {
    font-size: 20px;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    gap: 12px;
  }

  .view-toggle {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: 0;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .advanced-filters {
    grid-template-columns: 1fr;
  }

  .view-switcher {
    width: 100%;
  }

  .view-switcher .el-radio-button {
    flex: 1;
  }

  .view-switcher .el-radio-button__inner {
      justify-content: center;
    padding: 10px 12px;
  }

  .view-label {
    display: none;
  }

  .add-meal-btn {
    width: 100%;
    justify-content: center;
    }

  .filter-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .filter-row {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }

  .search-box,
  .tag-filter {
    width: 100%;
    min-width: 0;
  }

  .mobile-filter-actions {
    display: flex;
  }

  .meals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .meal-list-item {
    flex-direction: column;
  }

  .meal-list-image {
    width: 100%;
    height: 160px;
  }

  .meal-list-info {
    padding: 12px;
  }

  .meal-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meal-list-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .meal-list-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meals-table {
    overflow-x: auto;
  }

  .meals-table-content {
    min-width: 600px;
  }

  .desktop-only {
    display: none;
  }

  .empty-state {
    min-height: 300px;
  }

  .empty-content {
    padding: 30px 16px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-content h3 {
    font-size: 18px;
  }

  .add-meal-dialog {
    width: 95%;
    margin: 10px;
  }

  .add-meal-form {
    padding: 16px 0;
  }

  .upload-area {
    padding: 30px 16px;
  }

  .image-preview {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .page-header {
    margin: -12px -12px 12px -12px;
    padding: 12px;
  }

  .filter-section {
    padding: 12px;
    margin-bottom: 12px;
  }

  .filter-row {
    gap: 8px;
  }

  .view-switcher .el-radio-button__inner {
    padding: 8px 8px;
    font-size: 12px;
  }

  .meal-list-image {
    height: 140px;
  }

  .meal-list-info {
    padding: 10px;
    gap: 8px;
  }

  .meal-list-name {
    font-size: 16px;
  }

  .meal-list-description {
    font-size: 13px;
  }

  .empty-state {
    min-height: 250px;
  }

  .empty-content {
    padding: 20px 12px;
  }

  .empty-icon {
    font-size: 40px;
  }

  .add-meal-dialog {
    width: 98%;
    margin: 5px;
  }

  .upload-area {
    padding: 20px 12px;
  }

  .image-preview {
    width: 80px;
    height: 80px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .meal-list-item:hover {
    transform: none;
  }

  .meal-list-item:active {
    transform: translateY(-1px);
  }

  .view-switcher .el-radio-button__inner {
    min-height: 44px;
  }

  .add-meal-btn,
  .clear-filters-btn,
  .empty-action-btn {
    min-height: 44px;
    padding: 12px 20px;
  }

  .search-input :deep(.el-input__wrapper),
  .tag-select :deep(.el-input__wrapper) {
    min-height: 44px;
    }

  .upload-area {
    min-height: 120px;
  }

  .meal-list-actions .el-button {
    min-height: 44px;
    min-width: 44px;
  }

  .table-actions .el-button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 暗色模式适配 */
.dark-mode {
  .page-header {
    background: var(--bg-primary);
    border-bottom-color: var(--border-color);
  }

  .filter-section,
  .loading-container,
  .pagination-container,
  .empty-state {
    background: var(--bg-primary);
    box-shadow: 0 2px 8px var(--shadow-color);
  }

  .upload-area {
    background: var(--bg-secondary);
    border-color: var(--border-color);

    &:hover {
      background: var(--bg-primary);
      border-color: var(--primary-color);
    }
  }

  .meals-table-content {
    --el-table-border-color: var(--border-color);
    --el-table-header-bg-color: var(--bg-secondary);
    --el-table-bg-color: var(--bg-primary);
    --el-table-tr-bg-color: var(--bg-primary);
    --el-table-text-color: var(--text-primary);
  }

  .meal-list-item {
    background: var(--bg-primary);
    box-shadow: 0 2px 8px var(--shadow-color);
    }

  .meal-list-item:hover {
    box-shadow: 0 4px 16px var(--shadow-color);
  }
}


/* Cozy cookbook page override */
.meal-page {
  min-height: auto;
  background: transparent;
}

.page-header {
  margin: 0 0 18px;
  padding: 24px;
  border: 1px solid rgba(224, 159, 103, 0.18);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(253, 251, 247, 0.96), rgba(245, 235, 230, 0.84));
  box-shadow: 0 18px 46px rgba(117, 78, 58, 0.1);
}

.header-content {
  max-width: none;
}

.page-title {
  font-size: 30px;
  color: #4a3e3d;
  background: none;
  -webkit-text-fill-color: initial;
}

.page-subtitle {
  margin-top: 8px;
  color: #8a746b;
  font-size: 14px;
}

.add-meal-btn,
.feed-inspiration-btn {
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  color: #fffaf3;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
  box-shadow: 0 14px 28px rgba(224, 159, 103, 0.24);
  transition: all 0.3s ease-in-out;
}

.add-meal-btn:hover,
.feed-inspiration-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(224, 159, 103, 0.3);
}

.couple-presence-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 180, 162, 0.24);
  border-radius: 26px;
  background: rgba(253, 251, 247, 0.78);
  box-shadow: 0 14px 36px rgba(117, 78, 58, 0.08);
  backdrop-filter: blur(14px);
}

.presence-avatars {
  display: flex;
  flex-shrink: 0;
}

.presence-avatars span {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
  border: 3px solid #fdfbf7;
  border-radius: 999px;
  color: #fffaf3;
  font-size: 12px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
  box-shadow: 0 10px 20px rgba(117, 78, 58, 0.12);
}

.presence-avatars span:first-child {
  margin-left: 0;
  background: linear-gradient(135deg, #a8b8a0, #e09f67);
}

.presence-copy {
  flex: 1;
  min-width: 0;
}

.presence-copy strong {
  color: #4a3e3d;
  font-size: 15px;
}

.presence-copy p {
  margin: 4px 0 0;
  color: #8a746b;
  font-size: 13px;
}

.filter-section,
.loading-container,
.pagination-container,
.empty-state,
.meals-table {
  border: 1px solid rgba(224, 159, 103, 0.18);
  border-radius: 26px;
  background: rgba(253, 251, 247, 0.84);
  box-shadow: 0 16px 38px rgba(117, 78, 58, 0.09);
}

.search-input :deep(.el-input__wrapper),
.tag-select :deep(.el-input__wrapper) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(224, 159, 103, 0.2);
  transition: all 0.3s ease-in-out;
}

.search-input :deep(.el-input__wrapper.is-focus),
.tag-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px #ffb4a2, 0 10px 24px rgba(255, 180, 162, 0.16);
}

.view-switcher {
  border-radius: 999px;
  padding: 4px;
  background: rgba(245, 235, 230, 0.82);
}

.view-switcher .el-radio-button__inner {
  border-radius: 999px !important;
  background: transparent;
}

.view-switcher .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: #4a3e3d;
  color: #fdfbf7;
}

.meals-grid {
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 24px;
  align-items: start;
}

.meals-grid :deep(.meal-card-wrapper:nth-child(3n + 2)) {
  margin-top: 18px;
}

.meals-grid :deep(.meal-card-wrapper:nth-child(4n)) {
  margin-top: 8px;
}

.meal-list-item {
  border: 1px solid rgba(224, 159, 103, 0.2);
  border-radius: 24px;
  background: rgba(253, 251, 247, 0.9);
  box-shadow: 0 16px 34px rgba(117, 78, 58, 0.1);
}

.meal-list-item:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 22px 42px rgba(117, 78, 58, 0.16);
}

.meal-list-image {
  width: 150px;
  height: 150px;
  margin: 12px 0 12px 12px;
  border-radius: 20px;
}

.meal-list-actions .el-button,
.table-actions .el-button,
.list-feed-btn {
  border: 0;
  box-shadow: 0 8px 18px rgba(117, 78, 58, 0.12);
}

.add-meal-dialog :deep(.el-dialog) {
  border-radius: 28px;
  background: linear-gradient(135deg, #fdfbf7, #f5ebe6);
  box-shadow: 0 30px 80px rgba(74, 62, 61, 0.18);
}

.add-meal-dialog :deep(.el-dialog__header) {
  padding: 24px 28px 10px;
}

.add-meal-dialog :deep(.el-dialog__title) {
  color: #4a3e3d;
  font-weight: 800;
}

.add-meal-form {
  padding: 18px 8px;
  background: linear-gradient(90deg, rgba(224, 159, 103, 0.08) 1px, transparent 1px), rgba(253, 251, 247, 0.46);
  background-size: 18px 18px;
  border-radius: 22px;
}

.upload-area {
  border-radius: 22px;
  background: rgba(245, 235, 230, 0.62);
}

@media (max-width: 768px) {
  .page-header {
    margin: 0 0 14px;
    padding: 18px;
    border-radius: 22px;
  }

  .page-title {
    font-size: 24px;
    text-align: left;
  }

  .couple-presence-card {
    align-items: flex-start;
    flex-wrap: wrap;
    border-radius: 22px;
  }

  .feed-inspiration-btn {
    width: 100%;
  }

  .meals-grid :deep(.meal-card-wrapper:nth-child(n)) {
    margin-top: 0;
  }

  .meal-list-image {
    width: auto;
    height: 180px;
    margin: 10px 10px 0;
  }
}

</style>