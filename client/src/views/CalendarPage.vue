<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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

// 切换到今天
const goToToday = () => {
  currentDate.value = new Date();
};

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
    <div class="calendar-header">
      <div class="header-left">
        <h2 class="month-title">{{ currentMonthText }}</h2>
        <div class="month-nav">
          <el-button-group>
            <el-button type="primary" @click="changeMonth(-1)">
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <el-button type="primary" @click="goToToday">今天</el-button>
            <el-button type="primary" @click="changeMonth(1)">
              <el-icon><ArrowRight /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </div>
      
      <div class="header-right">
        <div class="meal-legend">
          <div v-for="type in mealTypes" :key="type.key" class="legend-item" :style="{ 'border-color': type.color }">
            <el-icon :style="{ color: type.color }"><component :is="type.icon" /></el-icon>
            <span>{{ type.label }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <el-skeleton :loading="isLoading" animated>
      <template #default>
        <div class="calendar-grid">
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

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
  
  .header-left {
    display: flex;
    align-items: center;
    gap: 20px;
    
    .month-title {
      font-size: 28px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
      min-width: 150px;
      background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      color: transparent;
    }
  }
  
  .header-right {
    .meal-legend {
      display: flex;
      gap: 15px;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 5px 10px;
        border-radius: 20px;
        font-size: 14px;
        border-left: 3px solid;
        background: #f5f5f5;
        
        .dark-mode & {
          background: #333;
        }
      }
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
    background: linear-gradient(to right, var(--primary-color), var(--secondary-color));
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

// 响应式调整
@media (max-width: 768px) {
  .calendar-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    
    .header-right {
      width: 100%;
    }
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