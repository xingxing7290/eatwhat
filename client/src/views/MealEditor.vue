<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useMealStore } from '../stores/meal';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Picture, Upload } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const mealStore = useMealStore();

const isLoading = ref(false);
const isSubmitting = ref(false);
const imageUrl = ref('');
const imageFileToUpload = ref(null); // 用于存储待上传的文件

// 编辑模式判断
const editMode = computed(() => !!route.params.id);
const pageTitle = computed(() => editMode.value ? '编辑菜品' : '创建新菜品');

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  imageUrl: '',
  tags: [],
  ingredients: []
});

// 表单验证规则
const rules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ]
};

// 引用表单以便验证
const formRef = ref(null);

// 关闭编辑前确认
const hasUnsavedChanges = ref(false);
const originalData = ref(null);

// 新标签输入
const newTag = ref('');
const tagInputVisible = ref(false);
const tagInputRef = ref(null);

// 新食材输入
const newIngredient = reactive({
  name: '',
  amount: ''
});

// 显示标签输入
const showTagInput = () => {
  tagInputVisible.value = true;
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

// 添加标签
const handleAddTag = () => {
  if (newTag.value) {
    if (!formData.tags.includes(newTag.value)) {
      formData.tags.push(newTag.value);
      hasUnsavedChanges.value = true;
    }
    newTag.value = '';
    tagInputVisible.value = false;
  }
};

// 删除标签
const handleRemoveTag = (tag) => {
  formData.tags = formData.tags.filter(t => t !== tag);
  hasUnsavedChanges.value = true;
};

// 添加食材
const handleAddIngredient = () => {
  if (newIngredient.name && newIngredient.amount) {
    formData.ingredients.push({
      name: newIngredient.name,
      amount: newIngredient.amount
    });
    newIngredient.name = '';
    newIngredient.amount = '';
    hasUnsavedChanges.value = true;
  } else {
    ElMessage.warning('请输入食材名称和用量');
  }
};

// 删除食材
const handleRemoveIngredient = (index) => {
  formData.ingredients.splice(index, 1);
  hasUnsavedChanges.value = true;
};

// 文件状态改变时的钩子
const handleFileChange = (uploadFile) => {
  if (uploadFile) {
    // 创建本地预览 URL
    imageUrl.value = URL.createObjectURL(uploadFile.raw);
    imageFileToUpload.value = uploadFile;
    hasUnsavedChanges.value = true;
  }
};

// 移除文件时的钩子
const handleFileRemove = () => {
  imageUrl.value = '';
  imageFileToUpload.value = null;
  // 如果是编辑模式，恢复成原来的图片
  if (editMode.value) {
    imageUrl.value = formData.imageUrl;
  }
};

// 处理图片加载错误
const handleImageError = () => {
  ElMessage.warning('图片预览失败');
  imageUrl.value = ''; // 清空无效的预览
};

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return;
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      isSubmitting.value = true;

      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      // 将标签和食材数组转换为 JSON 字符串
      formDataToSend.append('tags', JSON.stringify(formData.tags));
      formDataToSend.append('ingredients', JSON.stringify(formData.ingredients));

      // 如果有新上传的图片，则添加到 FormData
      if (imageFileToUpload.value) {
        formDataToSend.append('image', imageFileToUpload.value.raw);
      }
      
      try {
        if (editMode.value) {
          const mealId = route.params.id;
          await mealStore.updateMeal(mealId, formDataToSend);
        } else {
          await mealStore.createMeal(formDataToSend);
        }
        
        hasUnsavedChanges.value = false;
        router.push({ name: 'meals' });
      } catch (error) {
        console.error('保存菜品失败:', error);
        ElMessage.error(editMode.value ? '更新菜品失败' : '创建菜品失败');
      } finally {
        isSubmitting.value = false;
      }
    } else {
      return false;
    }
  });
};

// 取消编辑
const handleCancel = async () => {
  if (hasUnsavedChanges.value) {
    try {
      await ElMessageBox.confirm(
        '有未保存的更改，确定要离开吗？',
        '确认离开',
        {
          confirmButtonText: '离开',
          cancelButtonText: '继续编辑',
          type: 'warning'
        }
      );
      router.push({ name: 'meals' });
    } catch {
      // 用户取消，继续编辑
    }
  } else {
    router.push({ name: 'meals' });
  }
};

// 加载菜品数据
const loadMealData = async () => {
  if (!editMode.value) return;
  
  const mealId = route.params.id;
  if (!mealId) {
    ElMessage.error('菜品ID无效');
    router.push({ name: 'meals' });
    return;
  }
  
  isLoading.value = true;
  
  try {
    // 尝试从 store 中获取，如果没有则从 API 获取
    let mealData = mealStore.getMealById(mealId);
    
    if (!mealData) {
      mealData = await mealStore.fetchMeal(mealId);
    }
    
    if (mealData) {
      console.log('加载菜品数据:', mealData);
      
      // 填充表单数据
      formData.name = mealData.name || '';
      formData.description = mealData.description || '';
      formData.imageUrl = mealData.imageUrl || '';
      formData.tags = [...(mealData.tags || [])];
      formData.ingredients = [...(mealData.ingredients || [])];
      
      // 设置图片预览
      imageUrl.value = mealData.imageUrl || '';
      
      // 保存原始数据用于检测变更
      originalData.value = JSON.stringify(formData);
    } else {
      ElMessage.error('找不到该菜品信息');
      router.push({ name: 'meals' });
    }
  } catch (error) {
    console.error('加载菜品信息失败:', error);
    ElMessage.error('加载菜品信息失败');
  } finally {
    isLoading.value = false;
  }
};

// 监听表单变化
const checkFormChanges = () => {
  if (!originalData.value) return;
  
  const currentData = JSON.stringify(formData);
  hasUnsavedChanges.value = currentData !== originalData.value;
};

// 页面离开提示
const handleBeforeUnload = (e) => {
  if (hasUnsavedChanges.value) {
    e.preventDefault();
    e.returnValue = ''; // 这是必须的，为了触发提示
  }
};

onMounted(async () => {
  await loadMealData();
  
  // 添加页面离开前提示
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // 如果是新建模式，设置原始数据
  if (!editMode.value && originalData.value === null) {
    originalData.value = JSON.stringify(formData);
  }
});

onBeforeUnmount(() => {
  // 移除页面离开前提示
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<template>
  <div class="meal-editor">
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitForm" 
          :loading="isSubmitting" 
          :disabled="isSubmitting"
        >
          保存
        </el-button>
      </div>
    </div>
    
    <el-skeleton :loading="isLoading" animated>
      <template #default>
        <div class="form-container">
          <el-form 
            ref="formRef" 
            :model="formData" 
            :rules="rules" 
            label-position="top"
            @input="checkFormChanges"
            @change="checkFormChanges"
          >
            <div class="form-layout">
              <div class="form-main">
                <el-form-item label="菜品名称" prop="name">
                  <el-input 
                    v-model="formData.name" 
                    placeholder="输入菜品名称" 
                  />
                </el-form-item>
                
                <el-form-item label="菜品描述" prop="description">
                  <el-input 
                    v-model="formData.description" 
                    type="textarea" 
                    rows="4"
                    placeholder="简要描述这道菜的特点、口感等信息"
                  />
                </el-form-item>
                
                <el-form-item label="标签">
                  <div class="tags-container">
                    <el-tag
                      v-for="tag in formData.tags"
                      :key="tag"
                      closable
                      @close="handleRemoveTag(tag)"
                      class="tag-item"
                    >
                      {{ tag }}
                    </el-tag>
                    
                    <el-input
                      v-if="tagInputVisible"
                      ref="tagInputRef"
                      v-model="newTag"
                      class="tag-input"
                      size="small"
                      placeholder="输入标签名称"
                      @keyup.enter="handleAddTag"
                      @blur="handleAddTag"
                    />
                    
                    <el-button v-else class="tag-add-button" @click="showTagInput">
                      <el-icon><Plus /></el-icon> 添加标签
                    </el-button>
                  </div>
                </el-form-item>
                
                <el-form-item label="食材">
                  <div class="ingredients-form">
                    <div class="ingredient-inputs">
                      <el-input
                        v-model="newIngredient.name"
                        placeholder="食材名称"
                        class="ingredient-name"
                      />
                      <el-input
                        v-model="newIngredient.amount"
                        placeholder="用量"
                        class="ingredient-amount"
                      />
                      <el-button 
                        type="primary" 
                        @click="handleAddIngredient"
                      >
                        <el-icon><Plus /></el-icon>
                      </el-button>
                    </div>
                    
                    <div class="ingredients-list">
                      <el-table 
                        :data="formData.ingredients" 
                        style="width: 100%"
                        v-if="formData.ingredients.length > 0"
                      >
                        <el-table-column prop="name" label="食材" />
                        <el-table-column prop="amount" label="用量" />
                        <el-table-column label="操作" width="100">
                          <template #default="scope">
                            <el-button 
                              type="danger" 
                              circle 
                              size="small"
                              @click="handleRemoveIngredient(scope.$index)"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </template>
                        </el-table-column>
                      </el-table>
                      
                      <div v-else class="no-ingredients">
                        <p>暂无食材，请添加</p>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </div>
              
              <div class="form-side">
                <el-form-item label="菜品图片">
                  <el-upload
                    class="image-uploader"
                    action="#"
                    :show-file-list="false"
                    :auto-upload="false"
                    :on-change="handleFileChange"
                  >
                    <div v-if="imageUrl" class="image-preview">
                      <img :src="imageUrl" class="uploaded-image" @error="handleImageError" />
                      <div class="image-actions">
                        <el-button type="primary" circle :icon="Upload" />
                        <el-button type="danger" circle :icon="Delete" @click.stop="handleFileRemove" />
                      </div>
                    </div>
                    <div v-else class="upload-placeholder">
                      <el-icon><Upload /></el-icon>
                      <div class="upload-text">
                        <span>点击或拖拽上传图片</span>
                        <p>推荐尺寸 800*600，大小不超过2MB</p>
                      </div>
                    </div>
                  </el-upload>
                </el-form-item>
              </div>
            </div>
          </el-form>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style lang="scss" scoped>
.meal-editor {
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
  
  .form-container {
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
    
    .form-layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 30px;
      
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
      
      .form-main {
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          
          .tag-item {
            margin-right: 0;
            border-radius: 20px;
          }
          
          .tag-input {
            width: 120px;
          }
          
          .tag-add-button {
            border-style: dashed;
            height: 32px;
          }
        }
        
        .ingredients-form {
          .ingredient-inputs {
            display: flex;
            gap: 10px;
            margin-bottom: 15px;
            
            .ingredient-name {
              flex: 2;
            }
            
            .ingredient-amount {
              flex: 1;
            }
          }
          
          .no-ingredients {
            padding: 20px 0;
            text-align: center;
            color: var(--text-secondary);
            border: 1px dashed var(--border-color);
            border-radius: 4px;
          }
        }
      }
      
      .form-side {
        .image-uploader {
          width: 100%;
          :deep(.el-upload) {
            width: 100%;
            display: block;
          }
        }

        .image-preview, .upload-placeholder {
          width: 100%;
          height: 240px;
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
            bottom: 0;
            left: 0;
            right: 0;
            height: 50px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 20px;
            transform: translateY(100%);
            transition: transform 0.3s ease;
          }

          &:hover .image-actions {
            transform: translateY(0);
          }
        }
        
        .upload-placeholder {
          flex-direction: column;
          cursor: pointer;
          
          .el-icon {
            font-size: 48px;
            color: var(--text-secondary);
            margin-bottom: 10px;
          }
          
          .upload-text {
            text-align: center;
            color: var(--text-secondary);
            
            span {
              font-size: 16px;
              display: block;
              margin-bottom: 5px;
            }
            
            p {
              font-size: 14px;
              margin: 0;
            }
          }
        }
      }
    }
  }
}
</style> 