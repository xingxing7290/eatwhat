<script setup>
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import ApiLogger from './components/ApiLogger.vue';
import { Monitor, Moon, Sunny, Menu, Close, Calendar, Food, User, ChatDotRound, Star, Present, SwitchButton, ArrowDown } from '@element-plus/icons-vue';
import { useMealStore } from './stores/meal';

const route = useRoute();
const router = useRouter();
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const selectedColorTheme = ref(localStorage.getItem('colorTheme') || 'cream');
const locale = ref(zhCn);

// API日志查看器
const showApiLogger = ref(false);
const showDevTools = import.meta.env.DEV;

// 移动端导航菜单
const showMobileMenu = ref(false);
const authToken = ref(localStorage.getItem('token') || '');
const authUser = ref(null);

// 获取当前页面标题
const pageTitle = computed(() => {
  return route.meta.title || '安排吃啥';
});

// 检测是否为移动设备
const isMobile = computed(() => {
  return window.innerWidth <= 768;
});

// 切换暗黑模式
const applyColorTheme = () => {
  document.documentElement.dataset.theme = selectedColorTheme.value || 'cream';
};

const handleColorThemeChange = (event) => {
  selectedColorTheme.value = event?.detail || localStorage.getItem('colorTheme') || 'cream';
  applyColorTheme();
};

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
watch(isDarkMode, () => {
  document.documentElement.classList.toggle('dark', isDarkMode.value);
});

watch(selectedColorTheme, () => {
  applyColorTheme();
});

watch(() => route.fullPath, () => {
  loadAuthState();
});

const appName = "安排吃啥"

const mealStore = useMealStore();
const hasMeals = computed(() => mealStore.meals.length > 0);
const isLoggedIn = computed(() => !!authToken.value);
const currentUserName = computed(() => authUser.value?.displayName || authUser.value?.username || '我的账号');
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase());

const loadAuthState = () => {
  authToken.value = localStorage.getItem('token') || '';
  try {
    authUser.value = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (_) {
    authUser.value = null;
  }
};

const clearMealState = () => {
  mealStore.meals = [];
  mealStore.currentMeal = null;
  mealStore.categories = [];
  mealStore.tags = [];
  mealStore.totalMeals = 0;
  mealStore.allLoaded = false;
  mealStore.error = null;
};

const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  loadAuthState();
  clearMealState();
  closeMobileMenu();
  ElMessage.success('已退出登录');
  router.replace({ name: 'login' });
};

const handleUserCommand = (command) => {
  if (command === 'settings') {
    router.push({ name: 'settings' });
    return;
  }
  if (command === 'logout') handleLogout();
};

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
  loadAuthState();

  // 初始化暗黑模式
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  
  // 添加键盘快捷键监听
  window.addEventListener('keydown', handleKeyDown);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  
  // Meal data is loaded by each page on demand to keep the larger default catalog from slowing the app shell.
})

// 键盘快捷键处理
const handleKeyDown = (e) => {
  if (!showDevTools) return;

  // Alt+L opens the API log viewer in development
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
            <router-link to="/memories" class="nav-link" @click="closeMobileMenu">回忆</router-link>
            <router-link to="/wishlist" class="nav-link" @click="closeMobileMenu">想吃</router-link>
            <router-link to="/anniversaries" class="nav-link" @click="closeMobileMenu">纪念日</router-link>
            <router-link to="/settings" class="nav-link" @click="closeMobileMenu">设置</router-link>
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
            <div v-if="isLoggedIn" class="presence-pill">
              <span class="presence-dot"></span>
              <span>TA 正在同步小家的菜单</span>
            </div>
            <el-dropdown
              v-if="isLoggedIn"
              trigger="click"
              class="user-dropdown"
              @command="handleUserCommand"
            >
              <el-button class="user-menu-btn">
                <span class="user-avatar">{{ currentUserInitial }}</span>
                <span class="user-name">{{ currentUserName }}</span>
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings">
                    <el-icon><User /></el-icon>
                    账号设置
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided>
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button
              v-if="isLoggedIn"
              class="desktop-logout-btn"
              @click="handleLogout"
            >
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-button>

            <el-tooltip v-if="showDevTools" content="查看API日志 (Alt+L)" placement="bottom">
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
          <router-link to="/memories" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><ChatDotRound /></el-icon>
            <span>回忆</span>
          </router-link>
          <router-link to="/wishlist" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><Star /></el-icon>
            <span>想吃</span>
          </router-link>
          <router-link to="/anniversaries" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><Present /></el-icon>
            <span>纪念日</span>
          </router-link>
          <router-link to="/settings" class="mobile-nav-link" @click="closeMobileMenu">
            <el-icon><User /></el-icon>
            <span>设置</span>
          </router-link>
        </nav>
        
        <div class="mobile-nav-actions">
          <div v-if="isLoggedIn" class="mobile-user-box">
            <div class="mobile-user-info">
              <span class="mobile-user-avatar">{{ currentUserInitial }}</span>
              <div class="mobile-user-text">
                <strong>{{ currentUserName }}</strong>
                <span>当前账号</span>
              </div>
            </div>
            <el-button type="danger" class="mobile-logout-btn" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>

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
              v-if="showDevTools"
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
      
      <ApiLogger v-if="showDevTools" v-model:visible="showApiLogger" @close="showApiLogger = false" />
    </div>
  </el-config-provider>
</template>

<style lang="scss">
:root {
  --primary-color: #d85f65;
  --secondary-color: #f09a73;
  --accent-color: #e6b85c;
  --success-color: #7aa874;
  --warning-color: #d9903d;
  --error-color: #c94c4c;
  
  --bg-primary: #fffaf3;
  --bg-secondary: #fff4e8;
  --bg-tertiary: #f7e3d2;
  
  --text-primary: #3d3028;
  --text-secondary: #7c675a;
  --text-muted: #a58d7f;
  
  --border-color: #ead4c3;
  --border-light: #f4e4d8;
  --shadow-color: rgba(121, 76, 47, 0.12);
  --shadow-heavy: rgba(121, 76, 47, 0.2);
  

  --el-color-primary: #d85f65;
  --el-color-primary-light-3: #e48887;
  --el-color-primary-light-5: #efa7a0;
  --el-color-primary-light-7: #f6c7bd;
  --el-color-primary-light-8: #f9d9cf;
  --el-color-primary-light-9: #fdece5;
  --el-color-primary-dark-2: #ad4c51;
  --el-color-success: #7aa874;
  --el-color-warning: #d9903d;
  --el-color-danger: #c94c4c;
  --header-height: 60px;
  --mobile-header-height: 56px;
  
  --gradient-primary: linear-gradient(135deg, #f4a261 0%, #d85f65 48%, #8d5a50 100%);
  --gradient-secondary: linear-gradient(135deg, #ffe0c2 0%, #f4a7a3 52%, #d85f65 100%);
  --gradient-accent: linear-gradient(135deg, #f7d58b 0%, #f09a73 50%, #9fbd8d 100%);
}

.dark-mode {
  --primary-color: #ff9b8c;
  --secondary-color: #f2b279;
  --accent-color: #f7d27a;
  --success-color: #9fc28f;
  --warning-color: #e0a15a;
  --error-color: #e57a74;
  
  --bg-primary: #241c19;
  --bg-secondary: #302620;
  --bg-tertiary: #3b2e27;
  
  --text-primary: #fff3e8;
  --text-secondary: #d8c2b2;
  --text-muted: #b79e8e;
  
  --border-color: #5a4337;
  --border-light: #46342d;
  --shadow-color: rgba(0, 0, 0, 0.35);
  --shadow-heavy: rgba(0, 0, 0, 0.55);
  

  --el-color-primary: #ff9b8c;
  --el-color-primary-light-3: #c77e72;
  --el-color-primary-light-5: #9d635a;
  --el-color-primary-light-7: #724941;
  --el-color-primary-light-8: #5a3a34;
  --el-color-primary-light-9: #3f2b27;
  --el-color-primary-dark-2: #ffc1b6;
  --el-color-success: #9fc28f;
  --el-color-warning: #e0a15a;
  --el-color-danger: #e57a74;
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
  background: linear-gradient(180deg, var(--bg-secondary) 0%, #fff8ef 100%);
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
  background: rgba(61, 48, 40, 0.38);
  z-index: 998;
  backdrop-filter: blur(4px);
}

.app-header {
  height: var(--header-height);
  background: var(--gradient-primary);
  color: #fffaf3;
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
      color: #fffaf3;
      text-decoration: none;
      white-space: nowrap;
    }
    
    .main-nav {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .nav-link {
        color: #fffaf3;
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
          background-color: #fffaf3;
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
      color: #fffaf3;
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
      
            .user-menu-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        max-width: 210px;
        height: 36px;
        color: #fffaf3;
        background: rgba(255, 250, 243, 0.16);
        border: 1px solid rgba(255, 250, 243, 0.28);
        border-radius: 999px;
        padding: 0 10px;
      }

      .user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 250, 243, 0.24);
        font-size: 12px;
        font-weight: 700;
        flex-shrink: 0;
      }

      .user-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        min-width: 0;
      }

.api-log-btn {
        background-color: var(--accent-color);
        border-color: var(--accent-color);
        
        &:hover, &:focus {
          background-color: var(--warning-color);
          border-color: var(--warning-color);
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
  box-shadow: -5px 0 18px rgba(121, 76, 47, 0.16);
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
    
        .mobile-user-box {
      margin-bottom: 16px;
      padding: 14px;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      background: var(--bg-secondary);
    }

    .mobile-user-info {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .mobile-user-avatar {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: var(--gradient-primary);
      color: #fffaf3;
      font-weight: 700;
      flex-shrink: 0;
    }

    .mobile-user-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;

      strong {
        color: var(--text-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      span {
        color: var(--text-secondary);
        font-size: 12px;
      }
    }

    .mobile-logout-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

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


/* Creamy cozy shell overrides */
.app-header {
  height: 72px;
  padding: 0 28px;
  background: rgba(253, 251, 247, 0.82);
  color: var(--text-primary);
  border-bottom: 1px solid rgba(224, 159, 103, 0.18);
  box-shadow: 0 14px 36px rgba(117, 78, 58, 0.08);
  backdrop-filter: blur(18px);
}

.app-header .header-left .logo {
  color: var(--text-primary);
  font-size: 22px;
  letter-spacing: 0;
  padding: 8px 14px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 180, 162, 0.22), rgba(253, 251, 247, 0.68));
  border: 1px solid rgba(255, 180, 162, 0.28);
}

.app-header .header-left .main-nav .nav-link {
  color: var(--text-secondary);
  padding: 9px 13px;
  border-radius: 999px;
  transition: all 0.3s ease-in-out;
}

.app-header .header-left .main-nav .nav-link::after {
  display: none;
}

.app-header .header-left .main-nav .nav-link:hover,
.app-header .header-left .main-nav .nav-link.router-link-active {
  color: var(--text-primary);
  background: rgba(255, 180, 162, 0.2);
  box-shadow: inset 0 0 0 1px rgba(224, 159, 103, 0.2);
}

.presence-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(224, 159, 103, 0.22);
  border-radius: 999px;
  padding: 8px 12px;
  box-shadow: 0 10px 24px rgba(117, 78, 58, 0.08);
  font-size: 13px;
  white-space: nowrap;
}

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #ffb4a2;
  box-shadow: 0 0 0 5px rgba(255, 180, 162, 0.18);
}

.app-header .header-right .desktop-actions .user-menu-btn {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.64);
  border: 1px solid rgba(224, 159, 103, 0.24);
  border-radius: 999px;
  height: 42px;
}

.app-header .header-right .desktop-actions .user-avatar {
  color: #fffaf3;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
}

.app-header .header-right .desktop-actions .desktop-logout-btn {
  height: 42px;
  padding: 0 13px;
  border-radius: 999px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(224, 159, 103, 0.24);
  box-shadow: 0 10px 22px rgba(117, 78, 58, 0.08);
  transition: all 0.3s ease-in-out;
}

.app-header .header-right .desktop-actions .desktop-logout-btn:hover,
.app-header .header-right .desktop-actions .desktop-logout-btn:focus {
  color: #fffaf3;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
  border-color: rgba(224, 159, 103, 0.34);
  transform: translateY(-1px);
}


html[data-theme='cream'] {
  --primary-color: #ffb4a2;
  --secondary-color: #e09f67;
  --accent-color: #d7a86e;
  --success-color: #a8b8a0;
  --warning-color: #e09f67;
  --error-color: #c96c5d;
  --text-primary: #4a3e3d;
  --text-secondary: #7d6c67;
  --text-muted: #a89287;
  --bg-primary: #fdfbf7;
  --bg-secondary: #f5ebe6;
  --bg-tertiary: #efe1d8;
  --border-color: rgba(224, 159, 103, 0.24);
  --border-light: rgba(255, 180, 162, 0.2);
  --shadow-color: rgba(117, 78, 58, 0.1);
  --shadow-heavy: rgba(117, 78, 58, 0.18);
  --gradient-primary: linear-gradient(135deg, #ffb4a2 0%, #e09f67 100%);
  --gradient-secondary: linear-gradient(135deg, #fdfbf7 0%, #f5ebe6 100%);
  --gradient-accent: linear-gradient(135deg, #fff4eb 0%, #ffcfbd 52%, #e09f67 100%);
  --body-bg: radial-gradient(circle at 12% 12%, rgba(255, 180, 162, 0.2), transparent 26%), linear-gradient(180deg, #fdfbf7 0%, #f5ebe6 100%);
  --header-bg: rgba(253, 251, 247, 0.82);
  --el-color-primary: #e09f67;
  --el-color-primary-light-3: #eab98f;
  --el-color-primary-light-5: #f1cbaa;
  --el-color-primary-light-7: #f7ddc6;
  --el-color-primary-light-8: #fae8d8;
  --el-color-primary-light-9: #fdf3ec;
  --el-color-primary-dark-2: #bf7c48;
}

html[data-theme='peach'] {
  --primary-color: #ff9d8f;
  --secondary-color: #f0786f;
  --accent-color: #f5ba73;
  --success-color: #94b49f;
  --warning-color: #e89a5f;
  --error-color: #c9565b;
  --text-primary: #4d3937;
  --text-secondary: #82615d;
  --text-muted: #aa8178;
  --bg-primary: #fff9f5;
  --bg-secondary: #ffece7;
  --bg-tertiary: #f8d8cf;
  --border-color: rgba(240, 120, 111, 0.24);
  --border-light: rgba(255, 157, 143, 0.22);
  --shadow-color: rgba(128, 63, 56, 0.1);
  --shadow-heavy: rgba(128, 63, 56, 0.18);
  --gradient-primary: linear-gradient(135deg, #ffb4a2 0%, #f0786f 100%);
  --gradient-secondary: linear-gradient(135deg, #fff9f5 0%, #ffece7 100%);
  --gradient-accent: linear-gradient(135deg, #fff1e8 0%, #ffc8bc 50%, #f0786f 100%);
  --body-bg: radial-gradient(circle at 14% 12%, rgba(255, 157, 143, 0.2), transparent 28%), linear-gradient(180deg, #fff9f5 0%, #ffece7 100%);
  --header-bg: rgba(255, 249, 245, 0.84);
  --el-color-primary: #f0786f;
  --el-color-primary-light-3: #f39a91;
  --el-color-primary-light-5: #f7b8b0;
  --el-color-primary-light-7: #fbd1ca;
  --el-color-primary-light-8: #fde0dc;
  --el-color-primary-light-9: #fff0ee;
  --el-color-primary-dark-2: #c85f58;
}

html[data-theme='caramel'] {
  --primary-color: #d99455;
  --secondary-color: #b97842;
  --accent-color: #e7bd73;
  --success-color: #9aa978;
  --warning-color: #c98542;
  --error-color: #b65d4d;
  --text-primary: #49382c;
  --text-secondary: #79624f;
  --text-muted: #a38973;
  --bg-primary: #fffaf0;
  --bg-secondary: #f3e5d2;
  --bg-tertiary: #e7d0b6;
  --border-color: rgba(185, 120, 66, 0.26);
  --border-light: rgba(231, 189, 115, 0.24);
  --shadow-color: rgba(105, 65, 35, 0.1);
  --shadow-heavy: rgba(105, 65, 35, 0.18);
  --gradient-primary: linear-gradient(135deg, #e7bd73 0%, #b97842 100%);
  --gradient-secondary: linear-gradient(135deg, #fffaf0 0%, #f3e5d2 100%);
  --gradient-accent: linear-gradient(135deg, #fff2d8 0%, #e7bd73 48%, #b97842 100%);
  --body-bg: radial-gradient(circle at 10% 10%, rgba(231, 189, 115, 0.24), transparent 28%), linear-gradient(180deg, #fffaf0 0%, #f3e5d2 100%);
  --header-bg: rgba(255, 250, 240, 0.84);
  --el-color-primary: #b97842;
  --el-color-primary-light-3: #cb9a72;
  --el-color-primary-light-5: #d8b28e;
  --el-color-primary-light-7: #e8cfb8;
  --el-color-primary-light-8: #f1dfcf;
  --el-color-primary-light-9: #f8efe7;
  --el-color-primary-dark-2: #965d32;
}

html[data-theme='matcha'] {
  --primary-color: #8fa878;
  --secondary-color: #6f8f62;
  --accent-color: #d0aa68;
  --success-color: #7f9d6d;
  --warning-color: #c69a53;
  --error-color: #b86c60;
  --text-primary: #3e4438;
  --text-secondary: #65705d;
  --text-muted: #89927f;
  --bg-primary: #fbfbf4;
  --bg-secondary: #edf1e3;
  --bg-tertiary: #dde6d2;
  --border-color: rgba(111, 143, 98, 0.24);
  --border-light: rgba(143, 168, 120, 0.2);
  --shadow-color: rgba(73, 93, 60, 0.1);
  --shadow-heavy: rgba(73, 93, 60, 0.18);
  --gradient-primary: linear-gradient(135deg, #b5c99a 0%, #6f8f62 100%);
  --gradient-secondary: linear-gradient(135deg, #fbfbf4 0%, #edf1e3 100%);
  --gradient-accent: linear-gradient(135deg, #f5f3db 0%, #b5c99a 48%, #6f8f62 100%);
  --body-bg: radial-gradient(circle at 12% 12%, rgba(181, 201, 154, 0.26), transparent 28%), linear-gradient(180deg, #fbfbf4 0%, #edf1e3 100%);
  --header-bg: rgba(251, 251, 244, 0.84);
  --el-color-primary: #6f8f62;
  --el-color-primary-light-3: #94ad89;
  --el-color-primary-light-5: #b0c3a8;
  --el-color-primary-light-7: #d0dbc9;
  --el-color-primary-light-8: #e1e8dd;
  --el-color-primary-light-9: #f0f4ee;
  --el-color-primary-dark-2: #57724d;
}

html[data-theme='azuki'] {
  --primary-color: #bd6f74;
  --secondary-color: #8d5654;
  --accent-color: #d8a45f;
  --success-color: #8fa17f;
  --warning-color: #c99055;
  --error-color: #a84d4f;
  --text-primary: #4a3737;
  --text-secondary: #765d5b;
  --text-muted: #9d7d77;
  --bg-primary: #fff8f4;
  --bg-secondary: #f3e4df;
  --bg-tertiary: #e7d1cb;
  --border-color: rgba(141, 86, 84, 0.24);
  --border-light: rgba(189, 111, 116, 0.2);
  --shadow-color: rgba(101, 54, 55, 0.1);
  --shadow-heavy: rgba(101, 54, 55, 0.18);
  --gradient-primary: linear-gradient(135deg, #d79a8f 0%, #8d5654 100%);
  --gradient-secondary: linear-gradient(135deg, #fff8f4 0%, #f3e4df 100%);
  --gradient-accent: linear-gradient(135deg, #fff0e4 0%, #d79a8f 48%, #8d5654 100%);
  --body-bg: radial-gradient(circle at 12% 12%, rgba(189, 111, 116, 0.22), transparent 28%), linear-gradient(180deg, #fff8f4 0%, #f3e4df 100%);
  --header-bg: rgba(255, 248, 244, 0.84);
  --el-color-primary: #8d5654;
  --el-color-primary-light-3: #aa7b79;
  --el-color-primary-light-5: #c3a09d;
  --el-color-primary-light-7: #ddc6c3;
  --el-color-primary-light-8: #ead8d6;
  --el-color-primary-light-9: #f6eeed;
  --el-color-primary-dark-2: #714341;
}

html[data-theme='mist'] {
  --primary-color: #8aa6ad;
  --secondary-color: #6d8f99;
  --accent-color: #d6a76d;
  --success-color: #90a58b;
  --warning-color: #c89a5f;
  --error-color: #b56a62;
  --text-primary: #374246;
  --text-secondary: #627176;
  --text-muted: #87979b;
  --bg-primary: #fbfcfb;
  --bg-secondary: #e9f0ef;
  --bg-tertiary: #d9e4e2;
  --border-color: rgba(109, 143, 153, 0.24);
  --border-light: rgba(138, 166, 173, 0.2);
  --shadow-color: rgba(52, 76, 83, 0.1);
  --shadow-heavy: rgba(52, 76, 83, 0.18);
  --gradient-primary: linear-gradient(135deg, #a7c4c9 0%, #6d8f99 100%);
  --gradient-secondary: linear-gradient(135deg, #fbfcfb 0%, #e9f0ef 100%);
  --gradient-accent: linear-gradient(135deg, #f6f3e8 0%, #a7c4c9 48%, #6d8f99 100%);
  --body-bg: radial-gradient(circle at 12% 12%, rgba(138, 166, 173, 0.24), transparent 28%), linear-gradient(180deg, #fbfcfb 0%, #e9f0ef 100%);
  --header-bg: rgba(251, 252, 251, 0.84);
  --el-color-primary: #6d8f99;
  --el-color-primary-light-3: #93aeb6;
  --el-color-primary-light-5: #b4c7cc;
  --el-color-primary-light-7: #d2dfe2;
  --el-color-primary-light-8: #e0e9eb;
  --el-color-primary-light-9: #f0f5f6;
  --el-color-primary-dark-2: #55747d;
}

html[data-theme] body,
html[data-theme] .app-main {
  background: var(--body-bg);
}

html[data-theme] .app-header {
  background: var(--header-bg);
}

html[data-theme] .el-card,
html[data-theme] .el-dialog,
html[data-theme] .el-message-box,
html[data-theme] .el-popper {
  background: color-mix(in srgb, var(--bg-primary) 92%, white) !important;
}

.app-main {
  max-width: 1680px;
  padding: 28px;
}

@media (max-width: 768px) {
  .app-header {
    height: var(--mobile-header-height);
    padding: 0 14px;
  }

  .app-header .header-left .logo {
    font-size: 17px;
    padding: 6px 10px;
  }
}

</style> 
