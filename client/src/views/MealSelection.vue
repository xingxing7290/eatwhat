<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import { useScheduleStore } from '../stores/schedule';
import MealCard from '../components/MealCard.vue';
import { ElMessage } from 'element-plus';
import { format } from 'date-fns';

const route = useRoute();
const router = useRouter();
const mealStore = useMealStore();
const scheduleStore = useScheduleStore();

const date = computed(() => route.query.date);
const mealType = computed(() => route.query.mealType);

const isLoading = ref(false);
const searchQuery = ref('');
const selectedMeals = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const selectedTag = ref('');

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
  
  return result;
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
  console.log('MealSelection - 接收到的菜品对象:', meal);
  
  if (!meal) {
    console.error('无效的菜品对象:', meal);
    return;
  }
  
  // 使用_id或id，兼容两种情况
  const mealId = meal._id || meal.id;
  if (!mealId) {
    console.error('菜品对象缺少ID:', meal);
    return;
  }
  
  console.log('切换菜品选中状态:', meal.name, mealId);
  const index = selectedMeals.value.findIndex(m => {
    const selectedId = m._id || m.id;
    return String(selectedId) === String(mealId);
  });
  console.log('查找结果索引:', index, '当前选中菜品数量:', selectedMeals.value.length);
  
  if (index === -1) {
    selectedMeals.value.push(meal);
    console.log('添加菜品后选中数量:', selectedMeals.value.length);
  } else {
    selectedMeals.value.splice(index, 1);
    console.log('移除菜品后选中数量:', selectedMeals.value.length);
  }
};

// 加载已有安排
const loadExistingSchedule = async () => {
  try {
    const schedule = scheduleStore.getScheduleByDate(date.value);
    
    // 如果有已经安排的餐食，预选中这些菜品
    if (schedule && schedule[mealType.value]?.length > 0) {
      const mealIds = schedule[mealType.value];
      const meals = mealStore.getMealsByIds(mealIds);
      
      if (meals.length > 0) {
        selectedMeals.value = meals;
      }
    }
  } catch (error) {
    console.error('加载已有安排失败', error);
  }
};

// 加载所有菜品
const fetchAllMeals = async () => {
  isLoading.value = true;
  
  try {
    if (mealStore.meals.length === 0) {
      await mealStore.fetchAllMeals();
    }
    
    await loadExistingSchedule();
  } catch (error) {
    ElMessage.error('获取菜品列表失败');
  } finally {
    isLoading.value = false;
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
    console.log('保存前的选中菜品:', selectedMeals.value);
    
    // 过滤掉null或undefined的ID，优先使用_id，其次使用id
    const mealIds = selectedMeals.value
      .map(meal => meal._id || meal.id)
      .filter(id => id !== null && id !== undefined);
    
    console.log('处理后的菜品ID列表:', mealIds);
    
    // 如果没有选择有效的菜品，则提示用户
    if (mealIds.length === 0 && selectedMeals.value.length > 0) {
      ElMessage.warning('所选菜品ID无效，请重新选择');
      isLoading.value = false;
      return;
    }
    
    await scheduleStore.setMeal(date.value, mealType.value, mealIds);
    
    // 跳回日历页
    router.push({ name: 'calendar' });
    
  } catch (error) {
    console.error('保存餐食安排失败:', error);
    ElMessage.error('保存餐食安排失败');
  } finally {
    isLoading.value = false;
  }
};

// 取消选择
const handleCancel = () => {
  router.push({ name: 'calendar' });
};

// 切换标签过滤
const handleTagClick = (tag) => {
  if (selectedTag.value === tag) {
    selectedTag.value = '';
  } else {
    selectedTag.value = tag;
  }
  currentPage.value = 1; // 重置为第一页
};

// 清除过滤
const clearFilters = () => {
  searchQuery.value = '';
  selectedTag.value = '';
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

// 进入新增菜品
const goToNewMeal = () => {
  router.push({ name: 'mealEditor' });
};

onMounted(() => {
  // 检查必要参数
  if (!date.value || !mealType.value) {
    ElMessage.error('缺少必要参数');
    router.push({ name: 'calendar' });
    return;
  }
  
  fetchAllMeals();
});
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
          :disabled="isLoading"
          :loading="isLoading"
        >
          保存安排
        </el-button>
      </div>
    </div>
    
    <div class="selection-info">
      <div class="selected-count">
        <strong>已选择:</strong> {{ selectedMeals.length }} 个菜品
      </div>
      
      <div class="selected-meals" v-if="selectedMeals.length > 0">
        <el-tag 
          v-for="meal in selectedMeals" 
          :key="meal.id"
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
      
      <div class="tags-filter">
        <div class="tags-header">
          <span>按标签筛选:</span>
          <el-button type="text" @click="clearFilters" v-if="searchQuery || selectedTag">
            清除筛选
          </el-button>
        </div>
        
        <div class="tags-list">
          <el-tag
            v-for="tag in allTags"
            :key="tag"
            :class="{ 'selected-tag': selectedTag === tag }"
            @click="handleTagClick(tag)"
            effect="light"
            class="tag-item"
          >
            {{ tag }}
          </el-tag>
        </div>
      </div>
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
          
          <div v-else class="meals-grid">
            <div v-for="meal in paginatedMeals" :key="meal.id" class="meal-item">
              <MealCard 
                :meal="meal" 
                :showActions="false"
                :selected="isMealSelected(meal)"
                :selectable="true"
                @select="(selectedMeal) => toggleMealSelection(selectedMeal)"
              />
              <el-button 
                type="primary" 
                size="small" 
                style="margin-top: 10px; width: 100%;" 
                @click="toggleMealSelection(meal)"
              >
                测试选择
              </el-button>
            </div>
          </div>
          
          <div class="pagination-container" v-if="filteredMeals.length > 0">
            <el-pagination
              layout="prev, pager, next"
              :total="filteredMeals.length"
              :page-size="pageSize"
              v-model:current-page="currentPage"
              @current-change="handlePageChange"
              background
            />
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
      background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
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
    .meals-container {
      .meals-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        grid-gap: 15px;
      }
    }
  }
}
</style> 