import { defineStore } from 'pinia';
import { mealApi } from '../services/api';
import { ElMessage } from 'element-plus';

export const useMealStore = defineStore('meal', {
  state: () => ({
    meals: [],
    currentMeal: null,
    categories: [],
    tags: [],
    loading: false,
    error: null,
    totalMeals: 0,
		allLoaded: false
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
    async fetchMealTags() {
      this.loading = true;
      this.error = null;

      try {
        const res = await mealApi.getMealTags();
        this.tags = res.data;
        return this.tags;
      } catch (err) {
        this.error = err.message || '获取菜品标签失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async fetchMealCategories() {
      this.loading = true;
      this.error = null;

      try {
        const res = await mealApi.getMealCategories();
        this.categories = res.data;
        return this.categories;
      } catch (err) {
        this.error = err.message || '获取菜品分类失败';
        ElMessage.error(this.error);
        throw err;
      } finally {
        this.loading = false;
      }
    },
    // 获取所有菜品
    async fetchAllMeals(params = {}) {
      this.loading = true;
      this.error = null;
      
      try {
        const res = await mealApi.getAllMeals(params);
        this.meals = res.data;
        this.totalMeals = (typeof res.total === 'number') ? res.total : res.data.length;
		// 只有在“无任何查询参数”的情况下才认为已加载全量菜品列表。
		// 其他页面可能会使用筛选/分页请求覆盖 meals，这里避免误判导致日历显示“未知菜品”。
		const safeParams = params || {};
		const hasPagination = Object.prototype.hasOwnProperty.call(safeParams, 'page') || Object.prototype.hasOwnProperty.call(safeParams, 'limit');
		const isUnfilteredFullLoad = !hasPagination && Object.keys(safeParams).length === 0;
		this.allLoaded = isUnfilteredFullLoad;
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
        const index = this.meals.findIndex(m => String(m._id || m.id) === String(id));
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
        this.meals = this.meals.filter(meal => String(meal._id || meal.id) !== String(id));
        this.totalMeals--;
        
        if (this.currentMeal && String(this.currentMeal._id || this.currentMeal.id) === String(id)) {
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