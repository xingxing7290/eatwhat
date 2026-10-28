<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import { useScheduleStore } from '../stores/schedule';
import MealCard from '../components/MealCard.vue';
import { ElMessage } from 'element-plus';
import { format } from 'date-fns';
import { Grid, Menu, Search, Filter } from '@element-plus/icons-vue';
import api from '../services/api';

const route = useRoute();
const router = useRouter();
const mealStore = useMealStore();
const scheduleStore = useScheduleStore();

const date = computed(() => route.query.date);
const mealType = computed(() => route.query.mealType);

const isLoading = ref(false);
const loadError = ref(false);
const conflict = ref(false);
const expectedVersion = ref(null);
const searchQuery = ref('');
const selectedMeals = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const selectedTag = ref('');
const selectedCategory = ref('');
const selectedSubcategory = ref('');
const currentView = ref('grouped');
const showAdvancedFilters = ref(false);

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedTag.value || selectedCategory.value || selectedSubcategory.value);
});

// 计算餐食类型的中文名
const mealTypeText = computed(() => {
  switch (mealType.value) {
    case 'breakfast': return '早餐';
    case 'lunch': return '午餐';
    case 'dinner': return '晚餐';
    default: return '餐食';
  }
});

// 计算标题
const pageTitle = computed(() => {
  return `为 ${date.value} 选择${mealTypeText.value}`;
});

// 计算所有标签
const allTags = computed(() => {
  const tagsSet = new Set();
  
  mealStore.meals.forEach(meal => {
    if (meal.tags && Array.isArray(meal.tags)) {
      meal.tags.forEach(tag => tagsSet.add(tag));
    }
  });
  
  return Array.from(tagsSet);
});

// 计算过滤后的菜品
const filteredMeals = computed(() => {
  let result = mealStore.meals;
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(meal => 
      meal.name.toLowerCase().includes(query) || 
      meal.description?.toLowerCase().includes(query)
    );
  }
  
  // 标签过滤
  if (selectedTag.value) {
    result = result.filter(meal => 
      meal.tags && meal.tags.includes(selectedTag.value)
    );
  }

  if (selectedCategory.value) {
    result = result.filter(meal => (meal.category || '') === selectedCategory.value);
  }

  if (selectedSubcategory.value) {
    result = result.filter(meal => (meal.subcategory || '') === selectedSubcategory.value);
  }
  
  return result;
});

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
  for (const meal of filteredMeals.value) {
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

// 计算分页后的菜品
const paginatedMeals = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredMeals.value.slice(startIndex, endIndex);
});

// 检查菜品是否被选中
const isMealSelected = (meal) => {
  if (!meal) return false;
  // 使用_id或id，兼容两种情况
  const mealId = meal._id || meal.id;
  if (!mealId) return false;
  
  return selectedMeals.value.some(m => {
    const selectedId = m._id || m.id;
    return String(selectedId) === String(mealId);
  });
};

// 切换菜品选中状态
const toggleMealSelection = (meal) => {
  if (!meal) {
    return;
  }
  
  // 使用_id或id，兼容两种情况
  const mealId = meal._id || meal.id;
  if (!mealId) {
    return;
  }

  const index = selectedMeals.value.findIndex(m => {
    const selectedId = m._id || m.id;
    return String(selectedId) === String(mealId);
  });
  
  if (index === -1) {
    selectedMeals.value.push(meal);
  } else {
    selectedMeals.value.splice(index, 1);
  }
};

// 保存餐食安排
const saveSelection = async () => {
  // 确保有日期和餐食类型
  if (!date.value || !mealType.value) {
    ElMessage.error('参数无效，请返回重试');
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 过滤掉null或undefined的ID，优先使用_id，其次使用id
    const mealIds = selectedMeals.value
      .map(meal => meal._id || meal.id)
      .filter(id => id !== null && id !== undefined);
    
    // 如果没有选择有效的菜品，则提示用户
    if (mealIds.length === 0 && selectedMeals.value.length > 0) {
      ElMessage.warning('所选菜品ID无效，请重新选择');
      isLoading.value = false;
      return;
    }
    
    await scheduleStore.setMeal(date.value, mealType.value, mealIds, { expectedVersion: expectedVersion.value });
    const suggestedId = typeof route.query.suggestedMealId === 'string' ? route.query.suggestedMealId : '';
    const wishlistId = typeof route.query.wishlistId === 'string' ? route.query.wishlistId : '';
    if (wishlistId && suggestedId && mealIds.some(id => String(id) === suggestedId)) {
      try {
        await api.wishlist.updateStatus(wishlistId, 'planned');
      } catch (_) {
        ElMessage.warning('餐食已保存，但想吃清单状态未更新，请在想吃清单中检查');
      }
    }
    
    // 跳回日历页
    router.push({ name: 'calendar' });
    
  } catch (error) {
    if (error?.code === 'SCHEDULE_CONFLICT') {
      conflict.value = true;
      loadError.value = true;
    } else {
      ElMessage.error('保存餐食安排失败');
    }
  } finally {
    isLoading.value = false;
  }
};

// 取消选择
const handleCancel = () => {
  router.push({ name: 'calendar' });
};

// 清除过滤
const clearFilters = () => {
  searchQuery.value = '';
  selectedTag.value = '';
  selectedCategory.value = '';
  selectedSubcategory.value = '';
  showAdvancedFilters.value = false;
  currentPage.value = 1;
};

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1; // 重置为第一页
};

// 页码变化处理
const handlePageChange = (page) => {
  currentPage.value = page;
};

watch([searchQuery, selectedTag, selectedCategory, selectedSubcategory], () => {
  currentPage.value = 1;
});

watch(selectedCategory, () => {
  selectedSubcategory.value = '';
});

// 进入新增菜品
const goToNewMeal = () => {
  router.push({ name: 'MealEditor' });
};

const loadSelection = async () => {
  // 检查必要参数
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date.value || '') || !['breakfast', 'lunch', 'dinner'].includes(mealType.value)) {
    ElMessage.error('缺少必要参数');
    router.push({ name: 'calendar' });
    return;
  }

  isLoading.value = true;
  loadError.value = false;
  conflict.value = false;
  try {
    if (!mealStore.allLoaded) {
      await mealStore.fetchAllMeals();
    }
    const schedule = await api.schedule.getScheduleByDate(date.value);
    if (typeof schedule?.scheduleExists !== 'boolean' ||
        (schedule.scheduleExists && (typeof schedule.scheduleVersion !== 'string' || !Number.isFinite(Date.parse(schedule.scheduleVersion)))) ||
        (!schedule.scheduleExists && schedule.scheduleVersion !== null)) {
      throw new Error('服务器未提供有效的安排版本，暂时无法安全保存');
    }
    expectedVersion.value = schedule.scheduleVersion;
    const items = schedule?.meals?.[mealType.value] || [];
    const existingIds = items.map(item => {
      const meal = item?.meal || item;
      return meal?._id || meal?.id || (typeof meal === 'string' ? meal : '');
    }).filter(Boolean).map(String);
    if (existingIds.length !== items.length) {
      throw new Error('现有安排中有无法读取的菜品，请先在日历中检查');
    }
    const suggestedId = typeof route.query.suggestedMealId === 'string' ? route.query.suggestedMealId : '';
    const ids = [...new Set([...existingIds, suggestedId].filter(Boolean))];
    selectedMeals.value = mealStore.getMealsByIds(ids);
    if (selectedMeals.value.length !== ids.length) {
      throw new Error('部分已安排的菜品无法读取，请刷新后重试');
    }
    try {
      await mealStore.fetchMealCategories();
    } catch (_) {}
  } catch (error) {
    loadError.value = true;
    ElMessage.error(error?.message || '加载页面数据失败，请重试');
  } finally {
    isLoading.value = false;
  }
};
onMounted(loadSelection);
</script>

<template>
  <div class="meal-selection">
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveSelection" 
          :disabled="isLoading || loadError"
          :loading="isLoading"
        >
          保存安排
        </el-button>
      </div>
    </div>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="conflict ? '其他成员刚刚更新了安排，当前选择尚未保存。' : '无法读取完整的现有安排，为保护数据暂时不能保存。'">
      <span v-if="conflict">重新加载会用最新安排替换当前选择，请先记下需要保留的菜品。</span>
      <el-button link type="primary" @click="loadSelection">{{ conflict ? '重新加载最新安排' : '重新加载' }}</el-button>
    </el-alert>
    
    <div class="selection-info">
      <div class="selected-count">
        <strong>已选择:</strong> {{ selectedMeals.length }} 个菜品
      </div>
      
      <div class="selected-meals" v-if="selectedMeals.length > 0">
        <el-tag 
          v-for="meal in selectedMeals" 
          :key="meal._id || meal.id"
          closable
          @close="toggleMealSelection(meal)"
          class="selected-meal-tag"
        >
          {{ meal.name }}
        </el-tag>
      </div>
    </div>
        <div class="filters-container">
      <div class="search-container">
        <el-input
          v-model="searchQuery"
          placeholder="搜索菜品名称或描述"
          clearable
          @input="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="toolbar-row">
        <el-radio-group v-model="currentView" size="small">
          <el-radio-button value="grouped">
            <el-icon><Menu /></el-icon>
          </el-radio-button>
          <el-radio-button value="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
        </el-radio-group>

        <div class="toolbar-actions">
          <el-button size="small" @click="showAdvancedFilters = !showAdvancedFilters">
            <el-icon><Filter /></el-icon>
            筛选
          </el-button>
          <el-button v-if="hasActiveFilters" size="small" type="info" @click="clearFilters">
            清除
          </el-button>
        </div>
      </div>

      <el-collapse-transition>
        <div v-show="showAdvancedFilters" class="advanced-filters">
          <div class="filter-item">
            <el-select v-model="selectedCategory" placeholder="选择分类" clearable style="width: 100%;">
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
              style="width: 100%;"
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
            <el-select v-model="selectedTag" placeholder="选择标签" clearable style="width: 100%;">
              <el-option
                v-for="tag in allTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>
      </el-collapse-transition>
      
      <div v-if="false"></div>
    </div>
    
    <div class="meals-container">
      <el-skeleton :loading="isLoading" animated :count="4" :throttle="500">
        <template #default>
          <div v-if="filteredMeals.length === 0" class="empty-state">
            <el-empty description="没有找到匹配的菜品">
              <template #extra>
                <el-button type="primary" @click="goToNewMeal">
                  添加新菜品
                </el-button>
              </template>
            </el-empty>
          </div>
          
          <div v-else>
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
                        <div v-for="meal in sub.meals" :key="meal._id || meal.id" class="meal-item">
                          <MealCard
                            :meal="meal"
                            :showActions="false"
                            :selected="isMealSelected(meal)"
                            :selectable="true"
                            @select="(selectedMeal) => toggleMealSelection(selectedMeal)"
                          />
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div v-else class="meals-grid">
              <div v-for="meal in paginatedMeals" :key="meal._id || meal.id" class="meal-item">
                <MealCard 
                  :meal="meal" 
                  :showActions="false"
                  :selected="isMealSelected(meal)"
                  :selectable="true"
                  @select="(selectedMeal) => toggleMealSelection(selectedMeal)"
                />
              </div>
            </div>

            <div class="pagination-container" v-if="currentView !== 'grouped' && filteredMeals.length > 0">
              <el-pagination
                layout="prev, pager, next"
                :total="filteredMeals.length"
                :page-size="pageSize"
                v-model:current-page="currentPage"
                @current-change="handlePageChange"
                background
              />
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meal-selection {
  padding: 0;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
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
      gap: 10px;
    }
  }
  
  .selection-info {
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 15px 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px var(--shadow-color);
    
    .selected-count {
      margin-bottom: 10px;
      font-size: 16px;
      
      strong {
        color: var(--primary-color);
      }
    }
    
    .selected-meals {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .selected-meal-tag {
        background-color: var(--primary-color);
        color: white;
        border-radius: 20px;
      }
    }
  }
  
  .filters-container {
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
    
    .search-container {
      margin-bottom: 15px;
    }

    .toolbar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .advanced-filters {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .filter-item {
      min-width: 0;
    }
    
    .tags-filter {
      .tags-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        
        span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .tag-item {
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 20px;
          
          &:hover {
            transform: translateY(-2px);
          }
          
          &.selected-tag {
            background-color: var(--primary-color);
            color: white;
          }
        }
      }
    }
  }
  
  .meals-container {
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      grid-gap: 20px;
    }
    
    .empty-state {
      padding: 50px 0;
    }
    
    .pagination-container {
      margin-top: 30px;
      display: flex;
      justify-content: center;
    }
  }
}

@media (max-width: 768px) {
  .meal-selection {
    .filters-container {
      .advanced-filters {
        grid-template-columns: 1fr;
      }
    }

    .meals-container {
      .meals-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        grid-gap: 15px;
      }
    }
  }
}
</style>
