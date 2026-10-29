<script setup>
import { ref, watch, computed, onBeforeUnmount, defineAsyncComponent, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import zhCn from 'element-plus/dist/locale/zh-cn.mjs';
import { RouterLink, RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Monitor, Moon, Sunny, Menu, Close, Calendar, Food, User, ChatDotRound, Star, Present, SwitchButton, ArrowDown } from '@element-plus/icons-vue';
import { useMealStore } from './stores/meal';
import { useScheduleStore } from './stores/schedule';
import { adoptSession, sessionIsLocked, sessionLockReason } from './services/sessionScope';
import { householdVerificationFailed, verifyCurrentHousehold } from './services/api';

const route = useRoute();
const router = useRouter();
const moreSections = { '/wishlist': '想吃清单', '/guest-orders': '宴请点菜', '/memories': '饭后回忆', '/photo-album': '饭桌相册', '/review': '饭桌回顾', '/anniversaries': '纪念日', '/settings': '设置' };
const currentMoreSection = computed(() => moreSections[route.path] || '');
const mealSubpage = computed(() => route.path.startsWith('/meals/'));
const calendarSubpage = computed(() => route.name === 'MealSelection');
const isDarkMode = ref(localStorage.getItem('darkMode') === 'true');
const selectedColorTheme = ref(localStorage.getItem('colorTheme') || 'cream');
const locale = ref(zhCn);

// API日志查看器
const showApiLogger = ref(false);
const showDevTools = import.meta.env.DEV;
const ApiLogger = import.meta.env.DEV ? defineAsyncComponent(() => import('./components/ApiLogger.vue')) : null;

// 移动端导航菜单
const showMobileMenu = ref(false);
const mobileMenuButton = ref(null);
const mobileMenuCloseButton = ref(null);
const viewportWidth = ref(window.innerWidth);
const authToken = ref(localStorage.getItem('token') || '');
const authUser = ref(null);
const loggingOut = ref(false);
const sessionChanged = ref(sessionIsLocked());
const sessionExpired = ref(sessionLockReason() === 'expired');
const scopeUnverified = ref(householdVerificationFailed());
const checkingScope = ref(false);
const markScopeUnverified = () => { scopeUnverified.value = true; };
const markScopeVerified = () => { scopeUnverified.value = false; };
const retryScopeVerification = async () => {
  if (checkingScope.value) return;
  checkingScope.value = true;
  try { await verifyCurrentHousehold(); ElMessage.success('家庭保护已确认，请在页面重试加载或保存。'); }
  catch (_) { /* The appropriate warning remains visible. */ }
  finally { checkingScope.value = false; }
};
const markSessionChanged = () => { sessionChanged.value = true; };
const markSessionExpired = () => { sessionExpired.value = true; sessionChanged.value = true; };
const markSessionAdopted = () => {
  sessionChanged.value = sessionIsLocked();
  sessionExpired.value = sessionLockReason() === 'expired';
  scopeUnverified.value = householdVerificationFailed();
  if (!sessionChanged.value) { clearMealState(); loadAuthState(); }
};
const reloadChangedSession = async () => {
  try {
    await ElMessageBox.confirm('重新加载会丢失本页未保存的内容。请先复制或记录草稿。', '确认重新加载？', { type: 'warning', confirmButtonText: '重新加载', cancelButtonText: '继续保留草稿' });
    window.location.reload();
  } catch (_) { /* Keep the current page and draft. */ }
};
const reloginChangedSession = async () => {
  try {
    await ElMessageBox.confirm('重新登录会离开本页并丢失未保存内容。请先复制或记录草稿。', '确认重新登录？', { type: 'warning', confirmButtonText: '重新登录', cancelButtonText: '继续保留草稿' });
    window.location.assign(router.resolve({ name: 'login' }).href);
  } catch (_) { /* Keep the current page and draft. */ }
};

// 检测是否为移动设备
const isMobile = computed(() => {
  return viewportWidth.value <= 768;
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
  nextTick(() => (showMobileMenu.value ? mobileMenuCloseButton.value : mobileMenuButton.value)?.$el?.focus());
};

// 关闭移动端菜单
const closeMobileMenu = (restoreFocus = false) => {
  showMobileMenu.value = false;
  if (restoreFocus === true) nextTick(() => mobileMenuButton.value?.$el?.focus());
};
const closeSamePageMenu = (event, path) => {
  if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && route.fullPath === path) closeMobileMenu(true);
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
  const wasOpen = showMobileMenu.value;
  closeMobileMenu();
  if (wasOpen) nextTick(focusMain);
});

const appName = "安排吃啥"
const focusMain = () => document.getElementById('app-main')?.focus();

const mealStore = useMealStore();
const scheduleStore = useScheduleStore();
const isLoggedIn = computed(() => !!authToken.value);
const currentUserName = computed(() => authUser.value?.displayName || authUser.value?.username || '我的账号');
const currentUserInitial = computed(() => currentUserName.value.slice(0, 1).toUpperCase());
const currentHouseholdName = computed(() => {
  if (sessionChanged.value || scopeUnverified.value) return '小家待确认';
  const household = authUser.value?.household;
  const id = authUser.value?.householdId;
  if (!household || typeof household.name !== 'string' || !household.name.trim() || !id || String(household.id || household._id || '') !== String(id)) return '小家信息待确认';
  return household.name.trim();
});

const loadAuthState = () => {
  authToken.value = localStorage.getItem('token') || '';
  try {
    authUser.value = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (_) {
    authUser.value = null;
  }
};

const clearMealState = () => {
  mealStore.$reset();
  scheduleStore.$reset();
};

const handleLogout = async () => {
  if (loggingOut.value) return;
  if (sessionIsLocked()) { ElMessage.warning('当前会话已失效或变化，请先保留草稿并重新登录。'); return; }
  loggingOut.value = true;
  try {
    // Let the current page finish or reject navigation before clearing auth.
    // A cancelled unsaved-changes dialog must leave the session intact.
    if (route.name !== 'login') {
      const failure = await router.replace({ name: 'login' });
      if (failure) return;
    }
    if (sessionIsLocked()) { ElMessage.warning('当前会话已失效或变化，请重新登录后再操作。'); return; }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    adoptSession('');
    loadAuthState();
    clearMealState();
    closeMobileMenu();
    ElMessage.success('已退出登录');
  } catch (_) {
    ElMessage.error('无法退出，请稍后重试');
  } finally { loggingOut.value = false; }
};

const handleUserCommand = (command) => {
  if (command === 'settings') {
    router.push({ name: 'settings' });
    return;
  }
  if (command === 'logout') handleLogout();
};

onMounted(async () => {
  loadAuthState();
  applyColorTheme();

  // 初始化暗黑模式
  document.documentElement.classList.toggle('dark', isDarkMode.value);
  
  // 添加键盘快捷键监听
  window.addEventListener('keydown', handleKeyDown);
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize);
  window.addEventListener('eatwhat-theme-change', handleColorThemeChange);
  window.addEventListener('eatwhat-session-changed', markSessionChanged);
  window.addEventListener('eatwhat-session-expired', markSessionExpired);
  window.addEventListener('eatwhat-session-adopted', markSessionAdopted);
  window.addEventListener('eatwhat-session-user-updated', loadAuthState);
  window.addEventListener('eatwhat-scope-unverified', markScopeUnverified);
  window.addEventListener('eatwhat-scope-verified', markScopeVerified);
  sessionChanged.value = sessionIsLocked();
  sessionExpired.value = sessionLockReason() === 'expired';
  scopeUnverified.value = householdVerificationFailed();
  
  // Meal data is loaded by each page on demand to keep the larger default catalog from slowing the app shell.
})

// 键盘快捷键处理
const handleKeyDown = (e) => {
  if (e.key === 'Escape' && showMobileMenu.value) {
    // A teleported confirmation or other dialog owns Escape while it is open.
    // Closing the drawer as well would hide the original focus target.
    const dialogOpen = [...document.querySelectorAll('[role="dialog"], [role="alertdialog"]')].some(dialog => dialog.getClientRects().length && !dialog.closest('[inert], [aria-hidden="true"]'));
    if (dialogOpen) return;
    e.preventDefault();
    closeMobileMenu(true);
    return;
  }
  if (e.key === 'Tab' && showMobileMenu.value) {
    const panel = document.getElementById('mobile-navigation');
    if (panel?.contains(document.activeElement)) {
      const items = [...panel.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')].filter(item => item.getClientRects().length && !item.closest('[inert]'));
      if (items.length && e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (items.length && !e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    }
  }
  if (!showDevTools) return;

  // Alt+L opens the API log viewer in development
  if (e.altKey && e.key === 'l') {
    showApiLogger.value = !showApiLogger.value;
  }
};

// 窗口大小变化处理
const handleResize = () => {
  viewportWidth.value = window.innerWidth;
  if (viewportWidth.value > 768 && showMobileMenu.value) {
    const focusWasInDrawer = document.getElementById('mobile-navigation')?.contains(document.activeElement);
    closeMobileMenu();
    if (focusWasInDrawer) nextTick(focusMain);
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('eatwhat-theme-change', handleColorThemeChange);
  window.removeEventListener('eatwhat-session-changed', markSessionChanged);
  window.removeEventListener('eatwhat-session-expired', markSessionExpired);
  window.removeEventListener('eatwhat-session-adopted', markSessionAdopted);
  window.removeEventListener('eatwhat-session-user-updated', loadAuthState);
  window.removeEventListener('eatwhat-scope-unverified', markScopeUnverified);
  window.removeEventListener('eatwhat-scope-verified', markScopeVerified);
});
</script>

<template>
  <el-config-provider :locale="locale">
    <div class="app-container" :class="{ 'dark-mode': isDarkMode }">
      <a href="#app-main" class="skip-link" @click.prevent="focusMain">跳转到主要内容</a>
      <div v-if="sessionExpired" class="session-warning" role="alert">
        <div><strong>登录状态已失效</strong><span>本页新请求已暂停，草稿仍在。请先记录未保存内容；此前发送的请求可能仍会完成。</span></div>
        <div class="session-warning-actions"><button type="button" @click="reloginChangedSession">重新登录</button></div>
      </div>
      <div v-else-if="sessionChanged" class="session-warning" role="alert">
        <div><strong>账号或小家已变化</strong><span>本页新请求已暂停，未保存内容仍在。此前已发送的请求可能仍会完成，请先核对。</span></div>
        <div class="session-warning-actions"><button type="button" @click="reloadChangedSession">重新加载</button><button type="button" @click="reloginChangedSession">重新登录</button></div>
      </div>
      <div v-else-if="scopeUnverified" class="session-warning" role="alert">
        <div><strong>暂时无法确认家庭保护</strong><span>服务器可能未升级、网络异常或账号资料不完整；未通过核验的请求不会发送，草稿仍在。此前发出的请求可能仍会完成。</span></div>
        <div class="session-warning-actions"><button type="button" :disabled="checkingScope" @click="retryScopeVerification">{{ checkingScope ? '检查中…' : '重新检查' }}</button><button type="button" @click="reloginChangedSession">重新登录</button></div>
      </div>
      <!-- 移动端遮罩层 -->
      <div 
        v-if="showMobileMenu" 
        class="mobile-overlay"
        @click="closeMobileMenu(true)"
      ></div>
      
      <header v-if="isLoggedIn" class="app-header">
        <div class="header-left">
          <router-link to="/dashboard" class="logo" @click="closeMobileMenu">
            {{ appName }}
          </router-link>
          
          <!-- 桌面端导航 -->
          <nav class="main-nav desktop-nav" aria-label="主导航">
            <router-link to="/dashboard" class="nav-link" @click="closeMobileMenu">首页</router-link>
            <router-link to="/calendar" class="nav-link" :class="{ 'section-active': calendarSubpage }" :aria-current="calendarSubpage ? 'location' : route.path === '/calendar' ? 'page' : undefined" @click="closeMobileMenu">日历</router-link>
            <router-link to="/weekly-plan" class="nav-link" @click="closeMobileMenu">周计划</router-link>
            <router-link to="/meals" class="nav-link" :class="{ 'section-active': mealSubpage }" :aria-current="mealSubpage ? 'location' : route.path === '/meals' ? 'page' : undefined" @click="closeMobileMenu">菜品</router-link>
            <router-link to="/shopping-list" class="nav-link" @click="closeMobileMenu">购物清单</router-link>
            <el-dropdown trigger="click">
              <button class="nav-more" :class="{ 'section-active': currentMoreSection }" :aria-current="currentMoreSection ? 'location' : undefined" :aria-description="currentMoreSection ? `当前：${currentMoreSection}` : undefined" type="button" aria-label="更多功能">更多<span v-if="currentMoreSection" class="nav-more-current" aria-hidden="true"> · {{ currentMoreSection }}</span> <el-icon><ArrowDown /></el-icon></button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item><router-link to="/wishlist">想吃清单</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/guest-orders">宴请点菜</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/memories">饭后回忆</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/photo-album">饭桌相册</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/review">饭桌回顾</router-link></el-dropdown-item>
                  <el-dropdown-item><router-link to="/anniversaries">纪念日</router-link></el-dropdown-item>
                  <el-dropdown-item divided><router-link to="/settings">设置</router-link></el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </nav>
        </div>
        
        <div class="header-right">
          <!-- 移动端菜单按钮 -->
          <el-button 
            v-if="isMobile"
            ref="mobileMenuButton"
            type="text" 
            class="mobile-menu-btn"
            :aria-label="showMobileMenu ? '关闭导航菜单' : '打开导航菜单'"
            :aria-expanded="showMobileMenu"
            aria-controls="mobile-navigation"
            @click="toggleMobileMenu"
          >
            <el-icon v-if="!showMobileMenu"><Menu /></el-icon>
            <el-icon v-else><Close /></el-icon>
          </el-button>
          
          <!-- 桌面端功能按钮 -->
          <div class="desktop-actions">
            <el-dropdown
              v-if="isLoggedIn"
              trigger="click"
              class="user-dropdown"
              @command="handleUserCommand"
            >
              <el-button class="user-menu-btn" :disabled="loggingOut" :aria-label="`${currentUserName}，小家：${currentHouseholdName}，账号菜单`">
                <span class="user-avatar">{{ currentUserInitial }}</span>
                <span class="user-meta"><span class="user-name">{{ currentUserName }}</span><span class="user-household" :title="`小家：${currentHouseholdName}（本地资料，可能需要刷新）`">小家：{{ currentHouseholdName }}</span></span>
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="settings">
                    <el-icon><User /></el-icon>
                    账号设置
                  </el-dropdown-item>
                  <el-dropdown-item command="logout" divided :disabled="loggingOut">
                    <el-icon><SwitchButton /></el-icon>
                    退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>

            <el-button
              v-if="isLoggedIn"
              class="desktop-logout-btn"
              :loading="loggingOut"
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
                :aria-label="isDarkMode ? '切换到亮色模式' : '切换到暗色模式'"
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
      <div v-if="isLoggedIn" id="mobile-navigation" class="mobile-nav" :class="{ 'show': showMobileMenu }" :inert="!showMobileMenu ? '' : null" :aria-hidden="!showMobileMenu">
        <div class="mobile-nav-header">
          <h3>菜单</h3>
          <el-button ref="mobileMenuCloseButton" type="text" aria-label="关闭导航菜单" @click="closeMobileMenu(true)">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        
        <nav class="mobile-nav-links" aria-label="移动端导航">
          <router-link to="/dashboard" class="mobile-nav-link" @click="closeSamePageMenu($event, '/dashboard')">
            <el-icon><Calendar /></el-icon>
            <span>首页</span>
          </router-link>
          <router-link to="/calendar" class="mobile-nav-link" :class="{ 'section-active': calendarSubpage }" :aria-current="calendarSubpage ? 'location' : route.path === '/calendar' ? 'page' : undefined" @click="closeSamePageMenu($event, '/calendar')">
            <el-icon><Calendar /></el-icon>
            <span>日历</span>
          </router-link>
          <router-link to="/weekly-plan" class="mobile-nav-link" @click="closeSamePageMenu($event, '/weekly-plan')">
            <el-icon><Calendar /></el-icon>
            <span>周计划</span>
          </router-link>
          <router-link to="/shopping-list" class="mobile-nav-link" @click="closeSamePageMenu($event, '/shopping-list')">
            <el-icon><Food /></el-icon>
            <span>购物清单</span>
          </router-link>
          <router-link to="/meals" class="mobile-nav-link" :class="{ 'section-active': mealSubpage }" :aria-current="mealSubpage ? 'location' : route.path === '/meals' ? 'page' : undefined" @click="closeSamePageMenu($event, '/meals')">
            <el-icon><Food /></el-icon>
            <span>菜品</span>
          </router-link>
          <router-link to="/memories" class="mobile-nav-link" @click="closeSamePageMenu($event, '/memories')">
            <el-icon><ChatDotRound /></el-icon>
            <span>回忆</span>
          </router-link>
          <router-link to="/photo-album" class="mobile-nav-link" @click="closeSamePageMenu($event, '/photo-album')">
            <el-icon><ChatDotRound /></el-icon>
            <span>相册</span>
          </router-link>
          <router-link to="/review" class="mobile-nav-link" @click="closeSamePageMenu($event, '/review')">
            <el-icon><Calendar /></el-icon>
            <span>饭桌回顾</span>
          </router-link>
          <router-link to="/wishlist" class="mobile-nav-link" @click="closeSamePageMenu($event, '/wishlist')">
            <el-icon><Star /></el-icon>
            <span>想吃</span>
          </router-link>
          <router-link to="/guest-orders" class="mobile-nav-link" @click="closeSamePageMenu($event, '/guest-orders')">
            <el-icon><Food /></el-icon>
            <span>宴请点菜</span>
          </router-link>
          <router-link to="/anniversaries" class="mobile-nav-link" @click="closeSamePageMenu($event, '/anniversaries')">
            <el-icon><Present /></el-icon>
            <span>纪念日</span>
          </router-link>
          <router-link to="/settings" class="mobile-nav-link" @click="closeSamePageMenu($event, '/settings')">
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
                <span>小家：{{ currentHouseholdName }}</span>
              </div>
            </div>
            <el-button type="danger" class="mobile-logout-btn" :loading="loggingOut" @click="handleLogout">
              <el-icon><SwitchButton /></el-icon>
              退出登录
            </el-button>
          </div>

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
      
      <main id="app-main" class="app-main" tabindex="-1">
        <router-view />
      </main>
      
      <ApiLogger v-if="showDevTools" v-model:visible="showApiLogger" @close="showApiLogger = false" />
    </div>
  </el-config-provider>
</template>

<style lang="scss">
.user-meta { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; line-height: 1.15; }
.user-household { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-secondary); font-size: 10px; }
.session-warning { position: relative; z-index: 2001; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px 20px; padding: 12px 20px; background: #fff4d6; color: #33220d; border-bottom: 1px solid #aa773c; }
.session-warning div { display: flex; flex-wrap: wrap; gap: 4px 12px; line-height: 1.5; }
.session-warning button { min-height: 44px; padding: 8px 14px; border: 1px solid #523510; border-radius: 9px; color: #fff; background: #523510; cursor: pointer; font-weight: 700; }
.session-warning button:focus-visible { outline: 3px solid #523510; outline-offset: 2px; }
.skip-link { position: fixed; z-index: 3000; top: 8px; left: 8px; padding: 12px 16px; transform: translateY(-160%); border-radius: 10px; background: var(--bg-primary); color: var(--text-primary); font-weight: 700; box-shadow: 0 3px 16px var(--shadow-color); }
.skip-link:focus-visible { transform: translateY(0); outline: 3px solid var(--secondary-color); outline-offset: 2px; }
.app-main:focus { outline: none; }
.app-main:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: -2px; }
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
  z-index: 1001;
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
  z-index: 1002;
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
    color: #4a2b20;

    .el-button { color: #4a2b20; }
    
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

/* Compact global navigation */
.app-header { gap: 16px; }
.app-header .header-left { min-width: 0; }
.app-header .header-left .main-nav { gap: 3px; }
.app-header .header-left .main-nav .nav-link { padding: 9px 11px; font-size: 14px; white-space: nowrap; }
.nav-more { display: inline-flex; align-items: center; gap: 4px; border: 0; padding: 9px 11px; border-radius: 999px; background: transparent; color: var(--text-secondary); font: inherit; font-size: 14px; cursor: pointer; }
.nav-more:hover, .nav-more:focus-visible, .nav-more.section-active { color: var(--text-primary); background: var(--bg-secondary); }
.nav-more-current { font-weight: 700; }
.app-header .header-left .main-nav .nav-link.section-active { color: var(--text-primary); background: var(--bg-secondary); }
.el-dropdown-menu__item a { color: inherit; text-decoration: none; display: block; width: 100%; }
.app-header .header-right .desktop-actions .desktop-logout-btn { display: none; }
.mobile-nav-link.router-link-active, .mobile-nav-link.section-active { color: var(--secondary-color); background: var(--bg-secondary); font-weight: 700; }
.app-header .header-right .mobile-menu-btn { color: var(--text-primary); }
html.dark[data-theme] {
  --primary-color: #ffad99;
  --secondary-color: #efb27c;
  --accent-color: #e8c087;
  --text-primary: #fff3e8;
  --text-secondary: #dbc7ba;
  --text-muted: #bfa99b;
  --bg-primary: #29211e;
  --bg-secondary: #352a26;
  --bg-tertiary: #41322c;
  --border-color: #604b40;
  --border-light: #4c3a32;
  --shadow-color: rgba(0, 0, 0, .28);
  --body-bg: linear-gradient(180deg, #201a18, #2a211e);
  --header-bg: rgba(38, 30, 27, .96);
  --el-bg-color: #29211e;
  --el-bg-color-overlay: #352a26;
  --el-fill-color-blank: #29211e;
  --el-fill-color-light: #41322c;
  --el-text-color-primary: #fff3e8;
  --el-text-color-regular: #dbc7ba;
  --el-text-color-secondary: #bfa99b;
  --el-border-color: #604b40;
  --el-border-color-light: #4c3a32;
  color-scheme: dark;
}
html.dark[data-theme] body, html.dark[data-theme] .app-main { background: var(--body-bg); color: var(--text-primary); }
html.dark[data-theme] .app-header { background: var(--header-bg); }
html.dark[data-theme] .app-header .header-left .logo,
html.dark[data-theme] .app-header .header-left .main-nav .nav-link,
html.dark[data-theme] .app-header .header-right .desktop-actions .user-menu-btn { color: var(--text-primary); }
html.dark[data-theme] .app-header .header-left .logo,
html.dark[data-theme] .app-header .header-right .desktop-actions .user-menu-btn { background: var(--bg-secondary); }
html.dark[data-theme] .dark-mode .el-card { color: var(--text-primary); }
html.dark[data-theme] .dark-mode .el-card strong { color: var(--text-primary); }
html.dark[data-theme] .dark-mode .el-input__wrapper,
html.dark[data-theme] .dark-mode .el-textarea__inner,
html.dark[data-theme] .dark-mode .el-select__wrapper { background: var(--bg-secondary) !important; }
html.dark[data-theme] .el-dialog__title,
html.dark[data-theme] .el-message-box__title { color: var(--text-primary); }
@media (min-width: 769px) and (max-width: 1120px) {
  .app-header { padding-left: 16px; padding-right: 16px; }
  .app-header .header-left .logo { margin-right: 8px; font-size: 18px; }
  .app-header .header-left .main-nav .nav-link { padding-left: 7px; padding-right: 7px; font-size: 13px; }
  .app-header .header-right .desktop-actions .user-name { max-width: 65px; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; transition-duration: .01ms !important; }
}

</style> 
