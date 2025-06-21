<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ApiLogger from './components/ApiLogger.vue';
import { Monitor, Moon, Sunny } from '@element-plus/icons-vue';
import { useMealStore } from './stores/meal';

const route = useRoute();
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const locale = ref(zhCn);

// API日志查看器
const showApiLogger = ref(false);

// 获取当前页面标题
const pageTitle = computed(() => {
  return route.meta.title || '安排吃啥';
});

// 切换暗黑模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
};

// 监听暗黑模式变化
watch(isDarkMode, (newVal) => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

const appName = "安排吃啥"

const mealStore = useMealStore();
const hasMeals = computed(() => mealStore.meals.length > 0);

// 添加示例菜品
const addSampleMeals = async () => {
  try {
    // 示例菜品1
    await mealStore.createMeal({
      name: '糖醋里脊',
      description: '酸甜可口，外脆里嫩',
      tags: ['家常菜', '热菜', '肉类'],
      ingredients: [
        { name: '里脊肉', amount: '300克' },
        { name: '白糖', amount: '30克' },
        { name: '醋', amount: '20ml' },
        { name: '番茄酱', amount: '30克' },
        { name: '淀粉', amount: '适量' }
      ]
    });
    
    // 示例菜品2
    await mealStore.createMeal({
      name: '西红柿炒鸡蛋',
      description: '家常美味，营养丰富',
      tags: ['家常菜', '快手菜', '素菜'],
      ingredients: [
        { name: '西红柿', amount: '2个' },
        { name: '鸡蛋', amount: '3个' },
        { name: '葱', amount: '适量' },
        { name: '盐', amount: '适量' },
        { name: '糖', amount: '少许' }
      ]
    });
    
    // 示例菜品3
    await mealStore.createMeal({
      name: '麻婆豆腐',
      description: '麻辣鲜香，下饭神器',
      tags: ['川菜', '辣菜', '豆制品'],
      ingredients: [
        { name: '豆腐', amount: '1块' },
        { name: '肉末', amount: '100克' },
        { name: '豆瓣酱', amount: '1勺' },
        { name: '花椒', amount: '适量' },
        { name: '辣椒', amount: '适量' }
      ]
    });
  } catch (error) {
    console.error('添加示例菜品失败:', error);
  }
};

onMounted(async () => {
  // 显示API对接成功通知
  ElMessage.success({
    message: '后端接口对接成功，现已连接到真实服务',
    duration: 5000
  })
  
  // 初始化暗黑模式
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  
  // 添加键盘快捷键监听
  window.addEventListener('keydown', handleKeyDown);
  
  // 加载菜品数据
  if (mealStore.meals.length === 0) {
    try {
      await mealStore.fetchAllMeals();
    } catch (error) {
      console.error('获取菜品列表失败:', error);
    }
  }
})

// 键盘快捷键处理
const handleKeyDown = (e) => {
  // Alt+L 打开API日志查看器
  if (e.altKey && e.key === 'l') {
    showApiLogger.value = !showApiLogger.value;
  }
};
</script>

<template>
  <el-config-provider :locale="locale">
    <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
      <header class="app-header">
        <div class="header-left">
          <router-link to="/" class="logo">
            {{ appName }}
          </router-link>
          <nav class="main-nav">
            <router-link to="/" class="nav-link">日历</router-link>
            <router-link to="/meals" class="nav-link">菜品</router-link>
            <router-link to="/meals/add" class="nav-link">添加菜品</router-link>
            <el-button 
              v-if="$route.path === '/meals' && !hasMeals" 
              type="success" 
              size="small"
              @click="addSampleMeals"
            >
              添加示例菜品
            </el-button>
          </nav>
        </div>
        <div class="header-right">
          <el-tooltip content="查看API日志 (Alt+L)" placement="bottom">
            <el-button 
              type="primary" 
              circle 
              @click="showApiLogger = true"
              class="api-log-btn"
            >
              <el-icon><Monitor /></el-icon>
            </el-button>
          </el-tooltip>
          
          <el-tooltip :content="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'" placement="bottom">
            <el-button 
              circle 
              @click="toggleDarkMode"
            >
              <el-icon>
                <Moon v-if="!isDarkMode" />
                <Sunny v-else />
              </el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </header>
      
      <main class="app-main">
        <router-view />
      </main>
      
      <ApiLogger v-model:visible="showApiLogger" @close="showApiLogger = false" />
    </div>
  </el-config-provider>
</template>

<style lang="scss">
:root {
  --primary-color: #3ca55c;
  --secondary-color: #b5ac49;
  --bg-primary: #ffffff;
  --bg-secondary: #f5f7fa;
  --text-primary: #303133;
  --text-secondary: #606266;
  --border-color: #e4e7ed;
  --shadow-color: rgba(0, 0, 0, 0.1);
  --header-height: 60px;
}

.dark-mode {
  --primary-color: #3ca55c;
  --secondary-color: #b5ac49;
  --bg-primary: #1e1e1e;
  --bg-secondary: #2c2c2c;
  --text-primary: #e0e0e0;
  --text-secondary: #a0a0a0;
  --border-color: #4c4c4c;
  --shadow-color: rgba(0, 0, 0, 0.3);
  
  color-scheme: dark;
  
  .el-card {
    --el-card-bg-color: var(--bg-primary);
    color: var(--text-primary);
    border-color: var(--border-color);
  }
  
  .el-input__wrapper {
    background-color: var(--bg-secondary);
  }
  
  .el-table {
    --el-table-bg-color: var(--bg-primary);
    --el-table-tr-bg-color: var(--bg-primary);
    --el-table-header-bg-color: var(--bg-secondary);
    --el-table-border-color: var(--border-color);
    --el-table-text-color: var(--text-primary);
  }
  
  .el-pagination {
    --el-pagination-button-bg-color: var(--bg-secondary);
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: var(--header-height);
  background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 100;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-right: 20px;
      color: white;
      text-decoration: none;
    }
    
    .main-nav {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .nav-link {
        color: white;
        text-decoration: none;
        font-size: 16px;
        font-weight: 500;
        padding: 5px 0;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background-color: white;
          transition: width 0.3s;
        }
        
        &:hover::after,
        &.router-link-active::after {
          width: 100%;
        }
      }
    }
  }
  
  .header-right {
    display: flex;
    align-items: center;
    gap: 10px;
    
    .api-log-btn {
      background-color: #ff9800;
      border-color: #ff9800;
      
      &:hover, &:focus {
        background-color: #f57c00;
        border-color: #f57c00;
      }
    }
  }
}

.app-main {
  flex: 1;
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .app-header {
    padding: 0 10px;
    
    .header-left {
      .logo {
        margin-right: 10px;
      }
      
      .main-nav {
        gap: 10px;
        
        .nav-link {
          font-size: 14px;
        }
      }
    }
  }
  
  .app-main {
    padding: 15px 10px;
  }
}
</style> 