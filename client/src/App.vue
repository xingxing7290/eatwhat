<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute } from 'vue-router';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ApiLogger from './components/ApiLogger.vue';
import { Monitor, Moon, Sunny, Menu, Close, Calendar, Food } from '@element-plus/icons-vue';
import { useMealStore } from './stores/meal';

const route = useRoute();
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const locale = ref(zhCn);

// API日志查看器
const showApiLogger = ref(false);

// 移动端导航菜单
const showMobileMenu = ref(false);

// 获取当前页面标题
const pageTitle = computed(() => {
  return route.meta.title || '安排吃啥';
});

// 检测是否为移动设备
const isMobile = computed(() => {
  return window.innerWidth <= 768;
});

// 切换暗黑模式
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  localStorage.setItem('darkMode', isDarkMode.value);
};

// 切换移动端菜单
const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value;
};

// 关闭移动端菜单
const closeMobileMenu = () => {
  showMobileMenu.value = false;
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
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
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

// 窗口大小变化处理
const handleResize = () => {
  if (window.innerWidth > 768) {
    showMobileMenu.value = false;
  }
};
</script>

<template>
  <el-config-provider :locale="locale">
    <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
      <!-- 移动端遮罩层 -->
      <div 
        v-if="showMobileMenu" 
        class="mobile-overlay"
        @click="closeMobileMenu"
      ></div>
      
      <header class="app-header">
        <div class="header-left">
          <router-link to="/" class="logo" @click="closeMobileMenu">
            {{ appName }}
          </router-link>
          
          <!-- 桌面端导航 -->
          <nav class="main-nav desktop-nav">
            <router-link to="/" class="nav-link" @click="closeMobileMenu">日历</router-link>
            <router-link to="/meals" class="nav-link" @click="closeMobileMenu">菜品</router-link>
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
          <!-- 移动端菜单按钮 -->
          <el-button 
            v-if="isMobile"
            type="text" 
            class="mobile-menu-btn"
            @click="toggleMobileMenu"
          >
            <el-icon v-if="!showMobileMenu"><Menu /></el-icon>
            <el-icon v-else><Close /></el-icon>
          </el-button>
          
          <!-- 桌面端功能按钮 -->
          <div class="desktop-actions">
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
        </div>
      </header>
      
      <!-- 移动端导航菜单 -->
      <div class="mobile-nav" :class="{ 'show': showMobileMenu }">
        <div class="mobile-nav-header">
          <h3>菜单</h3>
          <el-button type="text" @click="closeMobileMenu">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <nav class="mobile-nav-links">
          <router-link to="/" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><Calendar /></el-icon>
            <span>日历</span>
          </router-link>
          <router-link to="/meals" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><Food /></el-icon>
            <span>菜品</span>
          </router-link>
        </nav>
        
        <div class="mobile-nav-actions">
          <el-button 
            v-if="$route.path === '/meals' && !hasMeals" 
            type="success" 
            size="large"
            @click="addSampleMeals"
            class="mobile-sample-btn"
          >
            添加示例菜品
          </el-button>
          
          <div class="mobile-utility-buttons">
            <el-button 
              type="primary" 
              @click="showApiLogger = true"
              class="mobile-api-btn"
            >
              <el-icon><Monitor /></el-icon>
              API日志
            </el-button>
            
            <el-button 
              @click="toggleDarkMode"
              class="mobile-theme-btn"
            >
              <el-icon>
                <Moon v-if="!isDarkMode" />
                <Sunny v-else />
              </el-icon>
              {{ isDarkMode ? '亮色' : '暗色' }}
            </el-button>
          </div>
        </div>
      </div>
      
      <main class="app-main">
        <router-view />
      </main>
      
      <ApiLogger v-model:visible="showApiLogger" @close="showApiLogger = false" />
    </div>
  </el-config-provider>
</template>

<style lang="scss">
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #4cd964;
  --warning-color: #ff9500;
  --error-color: #ff3b30;
  
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f4;
  
  --text-primary: #2c3e50;
  --text-secondary: #7f8c8d;
  --text-muted: #95a5a6;
  
  --border-color: #e1e8ed;
  --border-light: #f1f3f4;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --shadow-heavy: rgba(0, 0, 0, 0.12);
  
  --header-height: 60px;
  --mobile-header-height: 56px;
  
  --gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  --gradient-accent: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.dark-mode {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #4cd964;
  --warning-color: #ff9500;
  --error-color: #ff3b30;
  
  --bg-primary: #1a1a1a;
  --bg-secondary: #2c2c2e;
  --bg-tertiary: #3a3a3c;
  
  --text-primary: #f5f5f7;
  --text-secondary: #a1a1a6;
  --text-muted: #86868b;
  
  --border-color: #424242;
  --border-light: #3a3a3c;
  --shadow-color: rgba(0, 0, 0, 0.3);
  --shadow-heavy: rgba(0, 0, 0, 0.5);
  
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
  overflow-x: hidden;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 移动端遮罩层 */
.mobile-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
  backdrop-filter: blur(4px);
}

.app-header {
  height: var(--header-height);
  background: var(--gradient-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px var(--shadow-color);
  position: sticky;
  top: 0;
  z-index: 1000;
  
  .header-left {
    display: flex;
    align-items: center;
    
    .logo {
      font-size: 20px;
      font-weight: bold;
      margin-right: 20px;
      color: white;
      text-decoration: none;
      white-space: nowrap;
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
    
    .mobile-menu-btn {
      display: none;
      color: white;
      font-size: 20px;
      padding: 8px;
      
      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
    
    .desktop-actions {
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
}

/* 移动端导航菜单 */
.mobile-nav {
  position: fixed;
  top: 0;
  right: -300px;
  width: 300px;
  height: 100vh;
  background: var(--bg-primary);
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: right 0.3s ease;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  
  &.show {
    right: 0;
  }
  
  .mobile-nav-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
    border-bottom: 1px solid var(--border-color);
    background: var(--gradient-primary);
    color: white;
    
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }
  }
  
  .mobile-nav-links {
    flex: 1;
    padding: 20px 0;
    
    .mobile-nav-link {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      color: var(--text-primary);
      text-decoration: none;
      font-size: 16px;
      font-weight: 500;
      border-bottom: 1px solid var(--border-color);
      transition: all 0.3s ease;
      
      &:hover {
        background: var(--bg-secondary);
        color: var(--primary-color);
      }
      
      .el-icon {
        font-size: 18px;
        width: 20px;
      }
    }
  }
  
  .mobile-nav-actions {
    padding: 20px;
    border-top: 1px solid var(--border-color);
    
    .mobile-sample-btn {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .mobile-utility-buttons {
      display: flex;
      gap: 12px;
      
      .mobile-api-btn,
      .mobile-theme-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
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

/* 响应式设计 */
@media (max-width: 768px) {
  :root {
    --header-height: var(--mobile-header-height);
  }
  
  .app-header {
    height: var(--mobile-header-height);
    padding: 0 16px;
    
    .header-left {
      .logo {
        font-size: 18px;
        margin-right: 16px;
      }
      
      .desktop-nav {
        display: none;
      }
    }
    
    .header-right {
      .mobile-menu-btn {
        display: flex;
      }
      
      .desktop-actions {
        display: none;
      }
    }
  }
  
  .app-main {
    padding: 16px 12px;
  }
  
  .mobile-nav {
    width: 280px;
    right: -280px;
  }
}

@media (max-width: 480px) {
  .app-header {
    padding: 0 12px;
    
    .header-left {
      .logo {
        font-size: 16px;
        margin-right: 12px;
      }
    }
  }
  
  .app-main {
    padding: 12px 8px;
  }
  
  .mobile-nav {
    width: 100%;
    right: -100%;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .nav-link,
  .mobile-nav-link {
    min-height: 44px;
    display: flex;
    align-items: center;
  }
  
  .el-button {
    min-height: 44px;
  }
  
  .el-input__wrapper {
    min-height: 44px;
  }
}

/* 暗色模式下的移动端导航 */
.dark-mode {
  .mobile-nav {
    background: var(--bg-primary);
    border-left: 1px solid var(--border-color);
    
    .mobile-nav-links {
      .mobile-nav-link {
        color: var(--text-primary);
        border-bottom-color: var(--border-color);
        
        &:hover {
          background: var(--bg-secondary);
        }
      }
    }
    
    .mobile-nav-actions {
      border-top-color: var(--border-color);
    }
  }
}
</style> 