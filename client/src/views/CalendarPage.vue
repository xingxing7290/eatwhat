<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useScheduleStore } from '../stores/schedule';
import { useMealStore } from '../stores/meal';
import { ElMessage, ElMessageBox } from 'element-plus';
import { format, addMonths, subMonths, getYear, getMonth, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

const router = useRouter();
const scheduleStore = useScheduleStore();
const mealStore = useMealStore();

const currentDate = ref(new Date());
const isLoading = ref(false);
const meals = ref([]);

// 记录是否需要在加载完成后滚动到今天
const shouldScrollToToday = ref(false);

// 计算头部偏移（移动端吸顶导航 + 应用头部）
const getHeaderOffset = () => {
  let offset = 0;
  const appHeader = document.querySelector('.app-header');
  if (appHeader) offset += appHeader.getBoundingClientRect().height;
  const mobileNav = document.querySelector('.mobile-month-nav');
  if (mobileNav) offset += mobileNav.getBoundingClientRect().height;
  return Math.max(offset, 60); // 至少预留60px
};

// 星期几标签
const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

// 餐食类型
const mealTypes = [
  { key: 'breakfast', label: '早餐', icon: 'Sunrise', color: '#FF9800' },
  { key: 'lunch', label: '午餐', icon: 'Sunny', color: '#f44336' },
  { key: 'dinner', label: '晚餐', icon: 'Sunset', color: '#673AB7' }
];

// 当前视图的月份和年份
const currentMonthText = computed(() => {
  return format(currentDate.value, 'yyyy年MM月');
});

// 计算当前月日历中需要显示的日期
const calendarDays = computed(() => {
  const firstDay = startOfMonth(currentDate.value);
  const lastDay = endOfMonth(currentDate.value);
  
  // 获取当月的所有天
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  
  // 填充月初空白
  const startDayOfWeek = getDay(firstDay); // 0 for Sunday, 1 for Monday, etc.
  const prefixDays = Array(startDayOfWeek).fill(null);
  
  // 返回完整日历天数组
  return [...prefixDays, ...days];
});

// 根据日期获取当日安排
const getDateSchedule = (date) => {
  if (!date) return null;
  const formattedDate = format(date, 'yyyy-MM-dd');
  return scheduleStore.getScheduleByDate(formattedDate);
};

// 获取该月所有日期的安排
const fetchMonthSchedules = async () => {
  isLoading.value = true;
  
  try {
    const year = getYear(currentDate.value);
    const month = getMonth(currentDate.value) + 1; // date-fns的月份是0-11
    await scheduleStore.fetchSchedulesByMonth(year, month);
    
    // 获取所有菜品数据，用于展示菜品名称
    if (mealStore.meals.length === 0) {
      await mealStore.fetchAllMeals();
    }
    meals.value = mealStore.meals;
  } catch (error) {
    ElMessage.error('获取月度安排失败');
  } finally {
    isLoading.value = false;
  }
};

// 新增：处理编辑日程的函数
const handleEditSchedule = (date, mealType) => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  const schedule = getDateSchedule(date);
  const currentMealIds = schedule?.meals?.[mealType]?.map(meal => meal._id || meal.id) || [];
  
  router.push({
    name: 'MealSelection',
    query: {
      date: formattedDate,
      mealType: mealType,
      currentMealIds: currentMealIds.join(',')
    }
  });
};

// 跳转到菜品选择页面
const navigateToMealSelection = (date, type) => {
  const formattedDate = format(date, 'yyyy-MM-dd');
  router.push({
    name: 'MealSelection',
    query: { 
      date: formattedDate,
      mealType: type
    }
  });
};

// 切换月份
const changeMonth = (delta) => {
  currentDate.value = delta > 0 
    ? addMonths(currentDate.value, 1)
    : subMonths(currentDate.value, 1);
};

// 工具：滚动到元素（窗口或容器）
const scrollElementIntoView = (el, options = {}) => {
  const headerOffset = getHeaderOffset();
  const { containerSelector = null } = options;
  if (!el) return;

  if (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (container) {
      const elTop = el.offsetTop;
      const top = elTop - headerOffset;
      container.scroll({ top: Math.max(top, 0), behavior: 'smooth' });
      return;
    }
  }

  const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
  window.scrollTo({ top: Math.max(y, 0), behavior: 'smooth' });
};

// 重试查找今天元素
const tryScrollToToday = (attempt = 0) => {
  const mobileToday = document.querySelector('.mobile-date-card.today');
  if (mobileToday) {
    scrollElementIntoView(mobileToday);
    return true;
  }
  const desktopToday = document.querySelector('.calendar-body .date-cell.today');
  if (desktopToday) {
    scrollElementIntoView(desktopToday, { containerSelector: '.calendar-grid' });
    return true;
  }
  if (attempt < 15) { // 增加到 ~2s 重试时间
    setTimeout(() => tryScrollToToday(attempt + 1), 130);
  }
  return false;
};

// 切换到今天
const goToToday = async () => {
  currentDate.value = new Date();
  shouldScrollToToday.value = true;
  await nextTick();
  // 若无需等待加载，也尝试一次
  tryScrollToToday();
};

// 当加载状态从 true -> false 时，如果需要则滚动
watch(
  () => isLoading.value,
  async (newVal, oldVal) => {
    if (oldVal === true && newVal === false && shouldScrollToToday.value) {
      await nextTick();
      tryScrollToToday();
      shouldScrollToToday.value = false;
    }
  }
);

// 根据菜品ID查找菜品信息
const findMealById = (id) => {
  if (typeof id === 'object' && id !== null) {
    return id; // 如果传入的已经是菜品对象，直接返回
  }
  return meals.value.find(meal => (meal._id || meal.id) === id) || { name: '未知菜品' };
};

// 删除餐食安排
const handleDeleteSchedule = async (date, mealType) => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const result = await ElMessageBox.confirm(
      `确定删除 ${formattedDate} 的${mealTypes.find(m => m.key === mealType).label}安排吗？`,
      '删除确认',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    if (result === 'confirm') {
      await scheduleStore.deleteMeal(formattedDate, mealType);
    }
  } catch (error) {
    // 用户取消删除操作或其他错误
    if (error !== 'cancel') {
      ElMessage.error('删除餐食安排失败');
    }
  }
};

// 监听当前日期变化，切换月份时获取该月安排
watch(
  () => [getYear(currentDate.value), getMonth(currentDate.value)],
  () => {
    fetchMonthSchedules();
  }
);

onMounted(() => {
  fetchMonthSchedules();
});
</script>

<template>
  <div class="calendar-page">
    <!-- 页面标题和导航 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">餐食日历</h1>
        <div class="header-actions">
          <div class="month-navigation">
            <el-button 
              @click="changeMonth(-1)" 
              :disabled="isLoading"
              class="nav-btn"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            
            <span class="current-month">{{ currentMonthText }}</span>
            
            <el-button 
              @click="changeMonth(1)" 
              :disabled="isLoading"
              class="nav-btn"
            >
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </div>
          
          <el-button 
            @click="goToToday" 
            :disabled="isLoading"
            class="today-btn"
          >
            今天
          </el-button>
        </div>
      </div>
    </div>

    <!-- 移动端月份导航 - 只在移动端显示 -->
    <div class="mobile-month-nav">
      <div class="mobile-nav-controls">
        <el-button 
          @click="changeMonth(-1)" 
          :disabled="isLoading"
          size="small"
          class="mobile-nav-btn"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>
        
        <span class="mobile-month-text">{{ currentMonthText }}</span>
        
        <el-button 
          @click="changeMonth(1)" 
          :disabled="isLoading"
          size="small"
          class="mobile-nav-btn"
        >
          <el-icon><ArrowRight /></el-icon>
        </el-button>
        
        <el-button 
          @click="goToToday" 
          :disabled="isLoading"
          size="small"
          class="mobile-today-btn inline"
        >
          今天
        </el-button>
      </div>
    </div>
    
    <el-skeleton :loading="isLoading" animated>
      <template #default>
        <!-- 桌面端日历网格 -->
        <div class="calendar-grid desktop-only">
          <!-- 星期表头 -->
          <div class="calendar-header-row">
            <div 
              v-for="(day, index) in weekDays" 
              :key="index" 
              class="weekday-cell"
            >
              {{ day }}
            </div>
          </div>
          
          <!-- 日历单元格 -->
          <div class="calendar-body">
            <div 
              v-for="(day, index) in calendarDays" 
              :key="index" 
              class="date-cell"
              :class="{
                'empty-cell': !day,
                'today': day && format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
                'different-month': day && getMonth(day) !== getMonth(currentDate)
              }"
            >
              <!-- 日期标题 -->
              <div v-if="day" class="date-header">
                <span class="date-number">{{ format(day, 'd') }}</span>
              </div>
              
              <!-- 三餐安排区域 -->
              <div v-if="day" class="meals-container">
                <div 
                  v-for="mealType in mealTypes" 
                  :key="mealType.key"
                  class="meal-slot"
                >
                  <!-- 如果已有安排 -->
                  <template v-if="getDateSchedule(day)?.meals?.[mealType.key]?.length">
                    <div 
                      class="planned-meal"
                      :style="{
                        'border-left': `3px solid ${mealType.color}`,
                        'background-color': `${mealType.color}10`
                      }"
                    >
                      <div class="planned-meal-header">
                        <el-icon class="meal-icon" :style="{ color: mealType.color }">
                          <component :is="mealType.icon" />
                        </el-icon>
                        <span class="meal-label" :style="{ color: mealType.color }">{{ mealType.label }}</span>
                        <div class="meal-actions">
                           <el-button 
                            class="action-btn"
                            type="primary"
                            size="small" 
                            circle
                            @click.stop="handleEditSchedule(day, mealType.key)"
                          >
                            <el-icon><Edit /></el-icon>
                          </el-button>
                          <el-button 
                            class="action-btn" 
                            type="danger" 
                            size="small" 
                            circle
                            @click.stop="handleDeleteSchedule(day, mealType.key)"
                          >
                            <el-icon><Delete /></el-icon>
                          </el-button>
                        </div>
                      </div>
                      
                      <div class="meal-items">
                        <div 
                          v-for="meal in getDateSchedule(day).meals[mealType.key]" 
                          :key="meal._id || meal.id"
                          class="meal-item"
                          :style="{ 'background-color': mealType.color }"
                        >
                          {{ findMealById(meal).name }}
                        </div>
                      </div>
                    </div>
                  </template>
                  
                  <!-- 如果没有安排 -->
                  <div 
                    v-else 
                    class="add-meal" 
                    @click="navigateToMealSelection(day, mealType.key)"
                    :style="{ 'border-color': `${mealType.color}50` }"
                  >
                    <el-icon class="meal-icon" :style="{ color: mealType.color }">
                      <component :is="mealType.icon" />
                    </el-icon>
                    <span class="meal-label" :style="{ color: mealType.color }">{{ mealType.label }}</span>
                    <el-icon class="add-icon" :style="{ color: mealType.color }"><Plus /></el-icon>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 移动端日期列表 -->
        <div class="mobile-date-list mobile-only">
          <template v-for="(day, index) in calendarDays" :key="index">
            <div 
              v-if="day && getMonth(day) === getMonth(currentDate)"
              class="mobile-date-card"
              :class="{
                'today': format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
              }"
            >
              <!-- 日期头部 -->
              <div class="mobile-date-header">
                <div class="date-info">
                  <span class="date-number">{{ format(day, 'd') }}</span>
                  <span class="date-weekday">{{ weekDays[getDay(day)] }}</span>
                </div>
              </div>

              <!-- 餐食安排 -->
              <div class="mobile-meals-section">
                <div 
                  v-for="mealType in mealTypes" 
                  :key="mealType.key"
                  class="mobile-meal-type"
                >
                  <div class="meal-type-header">
                    <el-icon class="meal-icon" :style="{ color: mealType.color }">
                      <component :is="mealType.icon" />
                    </el-icon>
                    <span class="meal-type-label" :style="{ color: mealType.color }">{{ mealType.label }}</span>
                    <div class="meal-type-actions">
                      <el-button 
                        type="primary" 
                        size="small" 
                        circle
                        @click="handleEditSchedule(day, mealType.key)"
                      >
                        <el-icon><Edit /></el-icon>
                      </el-button>
                      <el-button 
                        type="danger" 
                        size="small" 
                        circle
                        @click="handleDeleteSchedule(day, mealType.key)"
                      >
                        <el-icon><Delete /></el-icon>
                      </el-button>
                    </div>
                  </div>

                  <!-- 如果已有安排 -->
                  <div v-if="getDateSchedule(day)?.meals?.[mealType.key]?.length" class="mobile-meal-items">
                    <div 
                      v-for="meal in getDateSchedule(day).meals[mealType.key]" 
                      :key="meal._id || meal.id"
                      class="mobile-meal-item"
                      :style="{ 'background-color': mealType.color }"
                    >
                      <span class="meal-name">{{ findMealById(meal).name }}</span>
                    </div>
                  </div>

                  <!-- 如果没有安排 -->
                  <div 
                    v-else 
                    class="mobile-add-meal"
                    @click="navigateToMealSelection(day, mealType.key)"
                    :style="{ 'border-color': `${mealType.color}50` }"
                  >
                    <el-icon class="add-icon" :style="{ color: mealType.color }"><Plus /></el-icon>
                    <span class="add-text" :style="{ color: mealType.color }">添加{{ mealType.label }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </template>
    </el-skeleton>
  </div>
</template>

<style lang="scss" scoped>
.calendar-page {
  padding: 20px;
  display: flex;
  flex-direction: column;
  max-width: 1600px; // 增加日历最大宽度
  margin: 0 auto; // 使日历居中
  height: calc(100vh - var(--header-height)); // 确保页面占满视口高度
}

/* 页面标题和导航 */
.page-header {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
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
      
      .month-navigation {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .nav-btn {
          border-radius: 8px;
          padding: 8px 12px;
        }
        
        .current-month {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary);
          min-width: 120px;
          text-align: center;
        }
      }
      
      .today-btn {
        border-radius: 8px;
        padding: 8px 16px;
        background: var(--gradient-primary);
        border: none;
        color: white;
        font-weight: 500;
        
        &:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }
      }
    }
  }
}

/* 移动端月份导航 - 默认隐藏 */
.mobile-month-nav {
  display: none;
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
  
  /* 吸顶 */
  position: sticky;
  top: 0;
  z-index: 20;
  
  .mobile-nav-controls {
    display: grid;
    grid-template-columns: auto 1fr auto auto; /* 左箭头 | 月份文本自适应 | 右箭头 | 今天 */
    align-items: center;
    gap: 8px;
    
    .mobile-nav-btn {
      border-radius: 8px;
      padding: 6px;
    }
    
    .mobile-month-text {
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .mobile-today-btn.inline {
      justify-self: end;
      border-radius: 8px;
      padding: 6px 12px;
      background: var(--gradient-primary);
      border: none;
      color: white;
      font-weight: 500;
    }
  }
}

.calendar-grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-primary);
  border-radius: 12px;
  overflow-y: auto; // 允许垂直滚动
  box-shadow: 0 4px 20px var(--shadow-color);
  
  .calendar-header-row {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    background: var(--gradient-primary);
    color: white;
    position: sticky; // 使表头在滚动时固定
    top: 0;
    z-index: 10;
    
    .weekday-cell {
      padding: 12px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
    }
  }
  
  .calendar-body {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    flex: 1; // 移除flex: 1，让内容自然撑开
    
    .date-cell {
      position: relative;
      min-height: 145px; // 增加单元格高度
      border: 1px solid var(--border-color);
      padding: 8px;
      display: flex;
      flex-direction: column;
      transition: transform 0.3s, box-shadow 0.3s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(0,0,0,0.08);
        z-index: 2;
      }
      
      &.empty-cell {
        background-color: var(--bg-secondary);
      }
      
      &.today {
        box-shadow: inset 0 0 0 2px var(--primary-color);
        
        .date-number {
          background-color: var(--primary-color);
          color: white;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
        }
      }
      
      &.different-month {
        opacity: 0.5;
      }
      
      .date-header {
        display: flex;
        justify-content: flex-start;
        margin-bottom: 8px;
        
        .date-number {
          font-size: 16px;
          font-weight: 600;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
      
      .meals-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        
        .meal-slot {
          flex: 1;
          display: flex;
          flex-direction: column;
          
          .add-meal {
            display: flex;
            align-items: center;
            gap: 5px;
            padding: 8px;
            border-radius: 8px;
            cursor: pointer;
            color: var(--text-secondary);
            border: 1px dashed var(--border-color);
            transition: all 0.3s;
            
            &:hover {
              background-color: var(--bg-secondary);
              transform: translateY(-1px);
              box-shadow: 0 3px 8px rgba(0,0,0,0.05);
            }
            
            .meal-icon {
              font-size: 16px;
            }
            
            .meal-label {
              flex: 1;
              font-size: 14px;
            }
            
            .add-icon {
              font-size: 14px;
            }
          }
          
          .planned-meal {
            border-radius: 8px;
            background-color: rgba(60, 165, 92, 0.05);
            padding: 8px;
            
            .planned-meal-header {
              display: flex;
              align-items: center;
              gap: 5px;
              margin-bottom: 5px;
              
              .meal-icon {
                font-size: 16px;
              }
              
              .meal-label {
                flex: 1;
                font-size: 14px;
                font-weight: 600;
              }
              
              .meal-actions {
                display: flex;
                gap: 5px;
                opacity: 0;
                transition: opacity 0.2s;
              }

              .delete-btn { // for backward compatibility if any
                opacity: 0;
                transition: opacity 0.2s;
              }
            }
            
            &:hover .planned-meal-header .meal-actions,
            &:hover .planned-meal-header .delete-btn {
              opacity: 1;
            }
            
            .meal-items {
              display: flex;
              flex-wrap: wrap;
              gap: 4px;
              
              .meal-item {
                color: white;
                border-radius: 4px;
                padding: 2px 8px;
                font-size: 12px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100%;
              }
            }
          }
        }
      }
    }
  }
}

/* 桌面端和移动端显示控制 */
.desktop-only {
  display: block;
}

.mobile-only {
  display: none;
}

/* 移动端日期列表样式 */
.mobile-date-list {
  display: none; /* 默认隐藏 */
  flex-direction: column;
  gap: 12px; /* 原16 改为12 */
  padding: 0 4px;
  
  .mobile-date-card {
    background: var(--bg-primary);
    border-radius: 10px; /* 原12 改为10 */
    padding: 12px; /* 原16 改为12 */
    box-shadow: 0 2px 8px var(--shadow-color);
    border: 1px solid var(--border-color);
    
    &.today {
      border: 2px solid var(--primary-color);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
    }
    
    .mobile-date-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px; /* 原16 改为10 */
      padding-bottom: 8px; /* 原12 改为8 */
      border-bottom: 1px solid var(--border-light);
      
      .date-info {
        display: flex;
        align-items: center;
        gap: 6px; /* 原8 改为6 */
        
        .date-number {
          font-size: 20px; /* 原24 改为20 */
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .date-weekday {
          font-size: 14px; /* 原16 改为14 */
          color: var(--text-secondary);
          font-weight: 500;
        }
      }
    }
    
    .mobile-meals-section {
      display: flex;
      flex-direction: column;
      gap: 10px; /* 原12 改为10 */
      
      .mobile-meal-type {
        .meal-type-header {
          display: flex;
          align-items: center;
          gap: 6px; /* 原8 改为6 */
          margin-bottom: 6px; /* 原8 改为6 */
          
          .meal-icon {
            font-size: 14px; /* 原16 改为14 */
          }
          
          .meal-type-label {
            font-size: 13px; /* 原14 改为13 */
            font-weight: 600;
            flex: 1; /* 让标题占满，按钮靠右 */
          }

          .meal-type-actions {
            display: flex;
            gap: 6px;
            
            .el-button {
              width: 30px;
              height: 30px;
            }
          }
        }
        
        .mobile-meal-items {
          display: flex;
          flex-direction: column;
          gap: 6px; /* 原8 改为6 */
          
          .mobile-meal-item {
            display: flex;
            align-items: center;
            padding: 10px; /* 原12 改为10 */
            border-radius: 8px;
            color: white;
            
            .meal-name {
              font-size: 13px; /* 原14 改为13 */
              font-weight: 500;
              flex: 1;
            }
          }
        }
        
        .mobile-add-meal {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px; /* 原8 改为6 */
          padding: 12px; /* 原16 改为12 */
          border: 2px dashed;
          border-radius: 8px;
          background: var(--bg-secondary);
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: var(--bg-tertiary);
            transform: translateY(-1px);
          }
          
          .add-icon {
            font-size: 14px; /* 原16 改为14 */
          }
          
          .add-text {
            font-size: 13px; /* 原14 改为13 */
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 响应式调整
@media (max-width: 768px) {
  .page-header {
    .header-content {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      
      /* 隐藏桌面端月份导航与今天按钮，避免与移动端重复 */
      .header-actions {
        display: none;
      }
    }
  }
  
  .mobile-month-nav {
    display: block;
  }

  /* 移动端显示控制 */
  .desktop-only {
    display: none !important;
  }
  
  .mobile-only {
    display: block !important;
  }
  
  /* 移动端日期列表显示 */
  .mobile-date-list {
    display: flex !important;
  }

  .calendar-grid {
    .calendar-body {
      .date-cell {
        min-height: 80px;
        padding: 4px;
        
        .date-header {
          margin-bottom: 4px;
        }
        
        .meals-container {
          gap: 4px;
          
          .meal-slot {
            .add-meal, .planned-meal {
              padding: 3px;
              
              .meal-icon, .add-icon {
                font-size: 12px;
              }
              
              .meal-label {
                font-size: 12px;
              }
            }
            
            .planned-meal {
              .meal-items {
                .meal-item {
                  font-size: 10px;
                  padding: 1px 4px;
                }
              }
            }
          }
        }
      }
    }
  }
}
</style> 