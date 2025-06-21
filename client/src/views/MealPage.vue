<script setup>
import { ref, onMounted, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import MealCard from '../components/MealCard.vue';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Search, Plus, Upload, Delete } from '@element-plus/icons-vue';

const router = useRouter();
const mealStore = useMealStore();

// 状态 - 列表过滤和分页
const searchQuery = ref('');
const selectedTag = ref('');
const currentPage = ref(1);
const pageSize = ref(8);
const loading = ref(false);

// 状态 - 新增菜品对话框
const addMealDialogVisible = ref(false);
const isSubmitting = ref(false);
const newMealFormRef = ref(null);
const imageFileToUpload = ref(null);
const newMealImagePreviewUrl = ref('');

const newMealForm = reactive({
  name: '',
  description: ''
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

// 新增菜品 - 打开对话框
const handleAddMeal = () => {
  addMealDialogVisible.value = true;
};

// 关闭新增对话框
const handleCloseDialog = () => {
  addMealDialogVisible.value = false;
  // 重置表单和文件
  newMealFormRef.value?.resetFields();
  newMealForm.description = '';
  imageFileToUpload.value = null;
  newMealImagePreviewUrl.value = '';
};

// 新增菜品的图片处理
const handleNewMealFileChange = (uploadFile) => {
  if (uploadFile) {
    newMealImagePreviewUrl.value = URL.createObjectURL(uploadFile.raw);
    imageFileToUpload.value = uploadFile;
  }
};

const handleNewMealFileRemove = () => {
  newMealImagePreviewUrl.value = '';
  imageFileToUpload.value = null;
};

// 提交新菜品
const submitNewMeal = async () => {
  if (!newMealFormRef.value) return;
  
  await newMealFormRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;
      const formData = new FormData();
      formData.append('name', newMealForm.name);
      formData.append('description', newMealForm.description);
      if (imageFileToUpload.value) {
        formData.append('image', imageFileToUpload.value.raw);
      }
      
      try {
        await mealStore.createMeal(formData);
        handleCloseDialog();
      } catch (error) {
        console.error('创建菜品失败:', error);
      } finally {
        isSubmitting.value = false;
      }
    }
  });
};

// 删除菜品
const handleDeleteMeal = async (meal) => {
  try {
    const result = await ElMessageBox.confirm(
      `确定要删除"${meal.name}"吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (result === 'confirm') {
      await mealStore.deleteMeal(meal.id);
    }
  } catch (error) {
    // 用户取消或其他错误
    if (error !== 'cancel') {
      ElMessage.error('删除菜品失败');
    }
  }
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

// 搜索处理
const handleSearch = () => {
  currentPage.value = 1; // 重置为第一页
};

// 清除过滤
const clearFilters = () => {
  searchQuery.value = '';
  selectedTag.value = '';
  currentPage.value = 1;
};

// 页码变化处理
const handlePageChange = (page) => {
  currentPage.value = page;
};

onMounted(() => {
  fetchMeals();
});
</script>

<template>
  <div class="meal-page">
    <div class="page-header">
      <h2 class="page-title">菜品管理</h2>
      <el-button type="primary" @click="handleAddMeal">
        <el-icon><Plus /></el-icon>
        添加新菜品
      </el-button>
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
          <span>标签筛选:</span>
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
      <el-skeleton :loading="loading" animated :count="4" :throttle="500">
        <template #default>
          <div v-if="filteredMeals.length === 0" class="empty-state">
            <el-empty description="没有找到匹配的菜品" />
          </div>
          
          <div v-else class="meals-grid">
            <div v-for="meal in paginatedMeals" :key="meal.id" class="meal-item">
              <MealCard 
                :meal="meal" 
                :showActions="true"
                @edit="handleEditMeal"
                @delete="handleDeleteMeal"
              />
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

    <!-- 添加菜品对话框 -->
    <el-dialog
      v-model="addMealDialogVisible"
      title="添加新菜品"
      width="500px"
      :before-close="handleCloseDialog"
      draggable
    >
      <el-form
        ref="newMealFormRef"
        :model="newMealForm"
        :rules="newMealRules"
        label-position="top"
      >
        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="newMealForm.name" placeholder="输入菜品名称" />
        </el-form-item>
        <el-form-item label="菜品描述" prop="description">
          <el-input 
            v-model="newMealForm.description" 
            type="textarea" 
            rows="3" 
            placeholder="简要描述这道菜的特点"
          />
        </el-form-item>
        <el-form-item label="菜品图片">
          <el-upload
            class="image-uploader-dialog"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleNewMealFileChange"
          >
            <div v-if="newMealImagePreviewUrl" class="image-preview">
              <img :src="newMealImagePreviewUrl" class="uploaded-image" />
              <div class="image-actions">
                <el-button type="danger" circle :icon="Delete" @click.stop="handleNewMealFileRemove" />
              </div>
            </div>
            <div v-else class="upload-placeholder">
              <el-icon><Upload /></el-icon>
              <div class="upload-text">点击上传图片</div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleCloseDialog">取消</el-button>
          <el-button 
            type="primary" 
            @click="submitNewMeal"
            :loading="isSubmitting"
          >
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.meal-page {
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
          transition: all 0.2s ease;
          border-radius: 20px;
          padding: 0 15px;
          height: 32px;
          line-height: 30px;

          &:hover {
            transform: translateY(-2px);
            box-shadow: var(--el-box-shadow-light);
          }

          &.selected-tag {
            background-color: var(--primary-color);
            color: #fff;
            border-color: var(--primary-color);
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
  .meal-page {
    .meals-container {
      .meals-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        grid-gap: 15px;
      }
    }
  }
}

.image-uploader-dialog {
  width: 100%;
  :deep(.el-upload) {
    width: 100%;
  }

  .image-preview, .upload-placeholder {
    width: 100%;
    height: 180px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    position: relative;
    border: 1px dashed var(--border-color);
    transition: border-color 0.3s;

    &:hover {
      border-color: var(--primary-color);
    }
  }

  .image-preview {
    .uploaded-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .image-actions {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover .image-actions {
      opacity: 1;
    }
  }

  .upload-placeholder {
    flex-direction: column;
    cursor: pointer;
    
    .el-icon {
      font-size: 32px;
      color: var(--text-secondary);
    }
    
    .upload-text {
      color: var(--text-secondary);
      font-size: 14px;
      margin-top: 8px;
    }
  }
}
</style> 