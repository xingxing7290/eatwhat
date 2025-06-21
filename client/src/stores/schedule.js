import { defineStore } from 'pinia';
import { scheduleApi } from '../services/api';
import { ElMessage } from 'element-plus';
import { format } from 'date-fns';

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    loading: false,
    error: null,
    currentDate: format(new Date(), 'yyyy-MM-dd')
  }),
  
  getters: {
    // 根据日期获取餐食安排
    getScheduleByDate: (state) => (date) => {
      return state.schedules.find(schedule => schedule.date === date);
    },
    
    // 检查某天某餐是否已有安排
    hasMealScheduled: (state) => (date, mealType) => {
      const schedule = state.schedules.find(s => s.date === date);
      if (schedule) {
        return schedule[mealType] && schedule[mealType].length > 0;
      }
      return false;
    },
    
    // 获取某日某餐的菜品ID列表
    getMealIdsByDateAndType: (state) => (date, mealType) => {
      const schedule = state.schedules.find(s => s.date === date);
      if (schedule && schedule.meals && schedule.meals[mealType]) {
        // 如果是新API格式（包含完整菜品对象），提取ID
        if (schedule.meals[mealType].length > 0 && typeof schedule.meals[mealType][0] === 'object') {
          return schedule.meals[mealType].map(meal => meal._id || meal.id);
        }
        // 如果已经是ID列表，直接返回
        return schedule.meals[mealType];
      }
      return [];
    }
  },
  
  actions: {
    // 获取某月的所有餐食安排
    async fetchSchedulesByMonth(year, month) {
      this.loading = true;
      this.error = null;
      
      try {
        const schedules = await scheduleApi.getSchedulesByMonth(year, month);
        
        // 新接口直接返回数组，直接赋值
        this.schedules = schedules || [];
        return this.schedules;
        
      } catch (err) {
        this.error = err.message || '获取餐食安排失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 设置某日某餐的菜品
    async setMeal(date, mealType, mealIds) {
      this.loading = true;
      this.error = null;
      
      try {
        // 确保过滤掉无效的ID并转换为字符串
        const validMealIds = Array.isArray(mealIds) 
          ? mealIds.filter(id => id !== null && id !== undefined)
                  .map(id => String(id))
          : [];
          
        console.log(`保存餐食安排: ${date} ${mealType}`, validMealIds);
        const result = await scheduleApi.setMeal(date, mealType, validMealIds);
        
        // 更新本地状态
        const index = this.schedules.findIndex(s => s.date === date);
        if (index !== -1) {
          // 更新现有日期的餐食
          const updatedSchedule = { ...this.schedules[index] };
          if (!updatedSchedule.meals) {
            updatedSchedule.meals = { breakfast: [], lunch: [], dinner: [] };
          }
          updatedSchedule.meals[mealType] = validMealIds; // 注意这里现在操作的是 meals 对象
          this.schedules[index] = updatedSchedule;
        } else {
          // 创建新的日期餐食记录
          const newSchedule = { 
            date,
            meals: { breakfast: [], lunch: [], dinner: [] }
          };
          newSchedule.meals[mealType] = validMealIds;
          this.schedules.push(newSchedule);
        }
        
        ElMessage.success(`${date} 的${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}安排已保存`);
        return true;
      } catch (err) {
        this.error = err.message || '保存餐食安排失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除某日某餐的安排
    async deleteMeal(date, mealType) {
      this.loading = true;
      this.error = null;
      
      try {
        await scheduleApi.deleteMeal(date, mealType);
        
        // 更新本地状态
        const index = this.schedules.findIndex(s => s.date === date);
        if (index !== -1) {
          const schedule = { ...this.schedules[index] };
          if (schedule.meals) {
            schedule.meals[mealType] = [];
          }
          
          // 检查是否该日所有餐食都空了，如果是则删除整个日期条目
          const hasAnyMeal = ['breakfast', 'lunch', 'dinner'].some(type => 
            schedule.meals && schedule.meals[type] && schedule.meals[type].length > 0
          );
          
          if (hasAnyMeal) {
            this.schedules[index] = schedule;
          } else {
            // 所有餐食都为空，删除该日期条目
            this.schedules.splice(index, 1);
          }
        }
        
        ElMessage.success(`${date} 的${mealType === 'breakfast' ? '早餐' : mealType === 'lunch' ? '午餐' : '晚餐'}安排已删除`);
        return true;
      } catch (err) {
        this.error = err.message || '删除餐食安排失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 重置状态
    resetState() {
      this.schedules = [];
      this.error = null;
    }
  }
}); 