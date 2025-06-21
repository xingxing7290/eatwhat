<script setup>
import { ref, computed } from 'vue';
import defaultImageSrc from '../assets/meal-placeholder.png';
import { Check, Edit, Delete } from '@element-plus/icons-vue';

const props = defineProps({
  meal: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  selectable: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['edit', 'delete', 'select']);

const defaultImage = ref(defaultImageSrc);

// 图片加载错误处理
const handleImageError = (e) => {
  e.target.src = defaultImage.value;
};

// 处理选择事件
const handleSelect = () => {
  if (props.selectable) {
    console.log('MealCard - 发出select事件，菜品:', props.meal);
    emit('select', props.meal);
  }
};

// 计算样式
const cardClass = computed(() => ({
  'meal-card': true,
  'selected': props.selected,
  'selectable': props.selectable
}));

// 计算图片URL
const imageUrl = computed(() => {
  const imagePath = props.meal.imageUrl || props.meal.image; // 兼容 imageUrl 和 image 字段
  if (!imagePath) return defaultImage.value;
  
  // 检查图片URL是否为绝对路径
  if (imagePath.startsWith('http')) {
    return imagePath;
  } else {
    return defaultImage.value;
  }
});
</script>

<template>
  <el-card 
    :class="cardClass" 
    :shadow="selectable ? 'hover' : 'always'" 
    @click="selectable ? handleSelect() : null"
  >
    <div class="meal-card-content">
      <div class="meal-image-container">
        <img 
          :src="imageUrl" 
          :alt="meal.name" 
          class="meal-image" 
          @error="handleImageError"
        />
        <div v-if="selected" class="selected-overlay">
          <el-icon><Check /></el-icon>
        </div>
      </div>
      
      <div class="meal-info">
        <div class="meal-header">
          <h3 class="meal-name">{{ meal.name }}</h3>
          <div v-if="showActions" class="meal-actions">
            <el-button 
              type="primary" 
              size="small" 
              circle 
              @click.stop="emit('edit', meal)"
            >
              <el-icon><Edit /></el-icon>
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              circle 
              @click.stop="emit('delete', meal)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
        
        <p v-if="meal.description" class="meal-description">{{ meal.description }}</p>
        
        <div v-if="meal.tags && meal.tags.length" class="meal-tags">
          <el-tag 
            v-for="(tag, index) in meal.tags" 
            :key="index" 
            size="small" 
            effect="light"
            class="tag"
          >
            {{ tag }}
          </el-tag>
        </div>
        
        <div v-if="meal.ingredients && meal.ingredients.length" class="meal-ingredients">
          <h4>食材:</h4>
          <ul>
            <li v-for="(ingredient, index) in meal.ingredients" :key="index">
              {{ ingredient.name }}: {{ ingredient.amount }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.meal-card {
  position: relative;
  transition: all 0.3s ease;
  height: 100%;
  
  &.selectable {
    cursor: pointer;
    
    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
  }
  
  &.selected {
    box-shadow: 0 0 0 2px var(--primary-color), 0 10px 20px rgba(0, 0, 0, 0.1);
    transform: translateY(-5px);
    
    .dark-mode & {
      box-shadow: 0 0 0 2px var(--primary-color), 0 10px 20px rgba(0, 0, 0, 0.3);
    }
  }
  
  .meal-card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .meal-image-container {
    position: relative;
    height: 180px;
    overflow: hidden;
    border-radius: 8px;
    margin-bottom: 15px;
    
    .meal-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }
    
    .selected-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(60, 165, 92, 0.5);
      
      .el-icon {
        font-size: 40px;
        color: white;
      }
    }
  }
  
  &:hover .meal-image {
    transform: scale(1.05);
  }
  
  .meal-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .meal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 10px;
      
      .meal-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
        flex: 1;
      }
      
      .meal-actions {
        display: flex;
        gap: 5px;
      }
    }
    
    .meal-description {
      color: var(--text-secondary);
      font-size: 14px;
      margin-bottom: 15px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .meal-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      margin-bottom: 15px;
      
      .tag {
        border-radius: 20px;
      }
    }
    
    .meal-ingredients {
      margin-top: auto;
      
      h4 {
        font-size: 14px;
        margin-bottom: 5px;
        color: var(--text-primary);
      }
      
      ul {
        padding-left: 20px;
        margin: 0;
        
        li {
          font-size: 13px;
          color: var(--text-secondary);
        }
      }
    }
  }
}
</style> 