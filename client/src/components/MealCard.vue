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
  const img = e.target;
  const src = img?.src || '';
  const hasRetried = img?.dataset?.retry === '1';
  // 若是/uploads路径且尚未重试，则尝试切换到/api/uploads再试一次
  try {
    const u = new URL(src, window.location.origin);
    const isUploads = u.pathname.startsWith('/uploads/');
    if (isUploads && !hasRetried) {
      img.dataset.retry = '1';
      img.src = `${window.location.origin}/api${u.pathname}`;
      return;
    }
  } catch (_) {}
  // 最终回退到占位图
  img.src = defaultImage.value;
};

// 处理选择事件
const handleSelect = () => {
  if (props.selectable) {
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
  const imagePath = props.meal.imageUrl || props.meal.image;
  if (!imagePath) return defaultImage.value;
  
  // 支持绝对URL或以/开头的相对路径（例如 /uploads/xxx.jpg）
  if (imagePath.startsWith('http') || imagePath.startsWith('/')) {
    try {
      // 若为绝对URL但缺失端口且指向当前主机的 /uploads，规范化为当前origin
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
  return defaultImage.value;
});
</script>

<template>
  <el-card 
    :class="cardClass" 
    :shadow="selectable ? 'hover' : 'always'" 
    @click="selectable ? handleSelect() : null"
    class="meal-card-wrapper"
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
        
        <!-- 移动端操作按钮 -->
        <div v-if="showActions" class="mobile-actions">
          <el-button 
            type="primary" 
            size="small" 
            circle 
            @click.stop="emit('edit', meal)"
            class="mobile-edit-btn"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            circle 
            @click.stop="emit('delete', meal)"
            class="mobile-delete-btn"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
      
      <div class="meal-info">
        <div class="meal-header">
          <h3 class="meal-name">{{ meal.name }}</h3>
          <div v-if="showActions" class="meal-actions desktop-actions">
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
        
        <p v-if="meal.description" class="meal-description">
          {{ meal.description }}
        </p>
        
        <div v-if="meal.tags && meal.tags.length > 0" class="meal-tags">
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
        
        <div v-if="meal.ingredients && meal.ingredients.length > 0" class="meal-ingredients">
          <div class="ingredients-title">主要食材:</div>
          <div class="ingredients-list">
            <span 
              v-for="(ingredient, index) in meal.ingredients.slice(0, 4)" 
              :key="index"
              class="ingredient-item"
            >
              {{ ingredient.name || ingredient }}
            </span>
            <span v-if="meal.ingredients.length > 4" class="more-ingredients">
              等{{ meal.ingredients.length }}种
            </span>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style scoped>
.meal-card-wrapper {
  transition: all 0.3s ease;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  }
  
  .meal-card-content {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .meal-image-container {
    position: relative;
  width: 100%;
  height: 200px;
    overflow: hidden;
  border-radius: 8px 8px 0 0;
}
    
    .meal-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

.meal-card-wrapper:hover .meal-image {
  transform: scale(1.05);
}
    
    .selected-overlay {
      position: absolute;
      top: 0;
      left: 0;
  right: 0;
  bottom: 0;
  background: rgba(60, 165, 92, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
        color: white;
  font-size: 32px;
}

/* 移动端操作按钮 */
.mobile-actions {
  display: none;
  position: absolute;
  top: 8px;
  right: 8px;
  gap: 8px;
}

.mobile-edit-btn,
.mobile-delete-btn {
  width: 32px;
  height: 32px;
  font-size: 14px;
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .meal-info {
    flex: 1;
  padding: 16px;
    display: flex;
    flex-direction: column;
  gap: 12px;
}
    
    .meal-header {
      display: flex;
  align-items: flex-start;
      justify-content: space-between;
  gap: 12px;
}
      
      .meal-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
  line-height: 1.3;
        flex: 1;
  min-width: 0;
      }
      
      .meal-actions {
        display: flex;
  gap: 8px;
  flex-shrink: 0;
    }
    
    .meal-description {
      color: var(--text-secondary);
      font-size: 14px;
  line-height: 1.5;
  margin: 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    
    .meal-tags {
      display: flex;
      flex-wrap: wrap;
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
    
    .meal-ingredients {
      margin-top: auto;
}

.ingredients-title {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  font-weight: 500;
}

.ingredients-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.ingredient-item {
  font-size: 12px;
        color: var(--text-primary);
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.more-ingredients {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 4px;
}

/* 选择状态样式 */
.meal-card-wrapper.selectable {
  cursor: pointer;
  transition: all 0.3s ease;
}

.meal-card-wrapper.selectable:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px var(--shadow-color);
}

.meal-card-wrapper.selectable.selected {
  border: 2px solid var(--primary-color);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .meal-image-container {
    height: 160px;
  }
  
  .meal-info {
    padding: 12px;
    gap: 10px;
  }
  
  .meal-name {
    font-size: 16px;
  }
  
  .meal-description {
          font-size: 13px;
    -webkit-line-clamp: 2;
  }
  
  .meal-tags {
    gap: 4px;
  }
  
  .meal-tag {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .ingredients-title {
    font-size: 11px;
  }
  
  .ingredient-item {
    font-size: 11px;
    padding: 1px 4px;
  }
  
  .desktop-actions {
    display: none;
  }
  
  .mobile-actions {
    display: flex;
  }
  
  .mobile-edit-btn,
  .mobile-delete-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .meal-image-container {
    height: 140px;
  }
  
  .meal-info {
    padding: 10px;
    gap: 8px;
  }
  
  .meal-name {
    font-size: 15px;
  }
  
  .meal-description {
    font-size: 12px;
  }
  
  .meal-tags {
    gap: 3px;
  }
  
  .meal-tag {
    font-size: 10px;
    padding: 2px 5px;
  }
  
  .ingredients-title {
    font-size: 10px;
  }
  
  .ingredient-item {
    font-size: 10px;
    padding: 1px 3px;
  }
  
  .mobile-edit-btn,
  .mobile-delete-btn {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .meal-card-wrapper.selectable:hover {
    transform: none;
  }
  
  .meal-card-wrapper.selectable:active {
    transform: translateY(-2px);
  }
  
  .mobile-edit-btn,
  .mobile-delete-btn {
    min-height: 44px;
    min-width: 44px;
  }
  
  .meal-actions .el-button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 暗色模式适配 */
.dark-mode {
  .meal-card-wrapper {
    background: var(--bg-primary);
    border-color: var(--border-color);
  }
  
  .meal-image-container {
    background: var(--bg-secondary);
  }
  
  .mobile-edit-btn,
  .mobile-delete-btn {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  .ingredient-item {
    background: var(--bg-secondary);
    border-color: var(--border-color);
  }
}

/* 移动端列表布局优化 */
@media (max-width: 768px) {
  .meal-card-wrapper {
    margin-bottom: 16px;
  }
  
  .meal-card-content {
    flex-direction: row;
  }
  
  .meal-image-container {
    width: 120px;
    height: 120px;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .meal-info {
    flex: 1;
    min-width: 0;
  }
  
  .meal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .meal-name {
    font-size: 16px;
    line-height: 1.2;
  }
  
  .meal-description {
    -webkit-line-clamp: 3;
  }
  
  .meal-ingredients {
    margin-top: 8px;
  }
}

@media (max-width: 480px) {
  .meal-image-container {
    width: 100px;
    height: 100px;
  }
  
  .meal-info {
    padding: 8px;
    gap: 6px;
  }
  
  .meal-name {
    font-size: 15px;
  }
  
  .meal-description {
    font-size: 12px;
    -webkit-line-clamp: 2;
  }
}
</style> 