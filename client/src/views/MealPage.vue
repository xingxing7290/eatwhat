<script setup>
import { ref, onMounted, computed, reactive, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import MealCard from '../components/MealCard.vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Search, Plus, Upload, Delete, Food, Grid, List, Document, Edit } from '@element-plus/icons-vue';

const router = useRouter();
const mealStore = useMealStore();

// 状态 - 列表过滤和分页
const searchQuery = ref('');
const selectedTag = ref('');
const currentPage = ref(1);
const pageSize = ref(8);
const loading = ref(false);

// 状态 - 显示方式
const currentView = ref('grid'); // 'grid', 'list', 'table'

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

// 计算属性：过滤菜品
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

// 计算属性：分页菜品
const paginatedMeals = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredMeals.value.slice(startIndex, endIndex);
});

// 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(filteredMeals.value.length / pageSize.value);
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
    await mealStore.fetchAllMeals();
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
  currentPage.value = 1;
};

// 分页变化
const handlePageChange = (page) => {
  currentPage.value = page;
};

// 监听筛选条件变化，重置分页
watch([searchQuery, selectedTag], () => {
  currentPage.value = 1;
});

onMounted(async () => {
  await fetchMeals();
});
</script>

<template>
  <div class="meal-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">菜品管理</h1>
        <div class="header-actions">
          <!-- 显示方式切换 -->
          <div class="view-toggle">
            <el-radio-group v-model="currentView" size="large" class="view-switcher">
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
            </el-radio-group>
          </div>
          
          <el-button 
            type="primary" 
            @click="addMealDialogVisible = true"
            class="add-meal-btn"
          >
        <el-icon><Plus /></el-icon>
            <span class="btn-text">添加菜品</span>
      </el-button>
        </div>
      </div>
    </div>
    
    <!-- 搜索和过滤区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="search-box">
        <el-input
          v-model="searchQuery"
            placeholder="搜索菜品名称或描述..."
          clearable
            class="search-input"
            :prefix-icon="Search"
          />
        </div>
        
        <div class="tag-filter">
          <el-select
            v-model="selectedTag"
            placeholder="选择标签"
            clearable
            class="tag-select"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </div>
      </div>
      
      <!-- 移动端过滤按钮 -->
      <div class="mobile-filter-actions">
        <el-button 
          v-if="searchQuery || selectedTag"
          type="info" 
          size="small"
          @click="clearFilters"
          class="clear-filters-btn"
        >
            清除筛选
          </el-button>
      </div>
        </div>
        
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 菜品列表 -->
    <div v-else-if="filteredMeals.length > 0" class="meals-container">
      <!-- 网格布局 -->
      <div v-if="currentView === 'grid'" class="meals-grid">
        <MealCard
          v-for="meal in paginatedMeals"
          :key="meal._id || meal.id"
          :meal="meal"
          @edit="handleEditMeal"
          @delete="handleDeleteMeal"
        />
      </div>
      
      <!-- 列表布局 -->
      <div v-else-if="currentView === 'list'" class="meals-list">
        <div 
          v-for="meal in paginatedMeals" 
          :key="meal._id || meal.id"
          class="meal-list-item"
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
                  type="primary" 
                  size="small" 
                  circle 
                  @click="handleEditMeal(meal)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  circle 
                  @click="handleDeleteMeal(meal)"
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
          :data="paginatedMeals" 
          style="width: 100%"
          class="meals-table-content"
        >
          <el-table-column label="图片" width="80" align="center">
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
      <div v-if="totalPages > 1" class="pagination-container desktop-only">
            <el-pagination
              v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="filteredMeals.length"
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
          @click="addMealDialogVisible = true"
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
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
          }
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
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
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
</style> 