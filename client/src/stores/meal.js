import { defineStore } from 'pinia';
import { mealApi } from '../services/api';
import { ElMessage } from 'element-plus';

export const useMealStore = defineStore('meal', {
  state: () => ({
    meals: [],
    currentMeal: null,
    loading: false,
    error: null,
    totalMeals: 0
  }),
  
  getters: {
    getMealById: (state) => (id) => {
      if (!id) return null;
      // 确保字符串比较
      const strId = String(id);
      return state.meals.find(meal => {
        const mealId = meal._id || meal.id;
        return String(mealId) === strId;
      }) || null;
    },
    
    getMealsByIds: (state) => (ids) => {
      if (!ids || !Array.isArray(ids)) return [];
      
      // 过滤掉无效ID并确保字符串比较
      const validIds = ids.filter(id => id !== null && id !== undefined)
                          .map(id => String(id));
      
      return validIds.map(strId => {
        return state.meals.find(meal => {
          const mealId = meal._id || meal.id;
          return String(mealId) === strId;
        }) || null;
      }).filter(Boolean); // 过滤掉null值
    },
    
    getMealsByTag: (state) => (tag) => {
      return state.meals.filter(meal => meal.tags && meal.tags.includes(tag));
    }
  },
  
  actions: {
    // 获取所有菜品
    async fetchAllMeals(params = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const res = await mealApi.getAllMeals(params);
        this.meals = res.data;
        this.totalMeals = res.total || res.data.length;
        return this.meals;
      } catch (err) {
        this.error = err.message || '获取菜品列表失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 获取单个菜品详情
    async fetchMeal(id) {
      this.loading = true;
      this.error = null;
      
      try {
        const meal = await mealApi.getMealById(id);
        this.currentMeal = meal;
        
        // 更新本地缓存
        const index = this.meals.findIndex(m => m.id === id);
        if (index !== -1) {
          this.meals[index] = meal;
        } else {
          this.meals.push(meal);
        }
        
        return meal;
      } catch (err) {
        this.error = err.message || '获取菜品详情失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 创建新菜品
    async createMeal(mealData) {
      this.loading = true;
      this.error = null;
      
      try {
        const newMeal = await mealApi.createMeal(mealData);
        this.meals.unshift(newMeal);
        this.totalMeals++;
        ElMessage.success('菜品创建成功');
        return newMeal;
      } catch (err) {
        this.error = err.message || '创建菜品失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 更新菜品
    async updateMeal(id, mealData) {
      this.loading = true;
      this.error = null;
      
      try {
        const updatedMeal = await mealApi.updateMeal(id, mealData);
        const index = this.meals.findIndex(meal => String(meal._id || meal.id) === String(id));
        
        if (index !== -1) {
          this.meals[index] = updatedMeal;
        }
        
        this.currentMeal = updatedMeal;
        ElMessage.success('菜品更新成功');
        return updatedMeal;
      } catch (err) {
        this.error = err.message || '更新菜品失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 删除菜品
    async deleteMeal(id) {
      this.loading = true;
      this.error = null;
      
      try {
        await mealApi.deleteMeal(id);
        this.meals = this.meals.filter(meal => meal.id !== id);
        this.totalMeals--;
        
        if (this.currentMeal && this.currentMeal.id === id) {
          this.currentMeal = null;
        }
        
        ElMessage.success('菜品删除成功');
      } catch (err) {
        this.error = err.message || '删除菜品失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    
    // 重置状态
    resetState() {
      this.currentMeal = null;
      this.error = null;
    }
  }
}); 