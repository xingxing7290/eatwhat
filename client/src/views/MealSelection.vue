<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { useScheduleStore } from '../stores/schedule';
import MealCard from '../components/MealCard.vue';
import { useDraftGuard } from '../composables/useDraftGuard';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Grid, Menu, Search, Filter } from '@element-plus/icons-vue';
import api from '../services/api';
import { validWishVersion } from '../utils/wishlistVersion.mjs';
import { validWeekLink } from '../utils/weekLink.mjs';

const route = useRoute();
const router = useRouter();
const scheduleStore = useScheduleStore();

const date = computed(() => route.query.date);
const mealType = computed(() => route.query.mealType);
const calendarDestination = () => ({ name: 'calendar', ...(validWeekLink(date.value) ? { query: { date: date.value } } : {}) });

const isInitializing = ref(true);
const isSaving = ref(false);
const confirmingEmpty = ref(false);
const catalogLoading = ref(false);
const catalogError = ref('');
const metadataError = ref(false);
const loadError = ref(false);
const selectionReadError = ref('');
const conflict = ref(false);
const saveUncertain = ref(false);
const expectedVersion = ref(null);
const wishSnapshot = ref(null);
const wishNotice = ref('');
const suggestionNotice = ref('');
const searchQuery = ref('');
const selectedMeals = ref([]);
const initialIds = ref([]);
const displayedMeals = ref([]);
const totalMeals = ref(0);
const categories = ref([]);
const tags = ref([]);
const currentPage = ref(1);
const pageSize = ref(8);
const selectedTag = ref('');
const selectedCategory = ref('');
const selectedSubcategory = ref('');
const currentView = ref('grid');
const showAdvancedFilters = ref(false);
let catalogSequence = 0;
let selectionSequence = 0;
let catalogTimer = null;

const idsFor = meals => meals.map(meal => String(meal._id || meal.id)).sort();
const selectionDirty = computed(() => JSON.stringify(idsFor(selectedMeals.value)) !== JSON.stringify(initialIds.value));
const selectionStatus = computed(() => {
  if (isInitializing.value) return '正在核对当前安排';
  if (saveUncertain.value) return '保存结果待核对';
  if (loadError.value) return '当前安排尚未核实';
  if (confirmingEmpty.value) return '等待确认清空安排';
  if (isSaving.value) return '正在保存安排';
  return selectionDirty.value ? '选择有变更，尚未保存' : '与当前安排一致';
});
const selectedMealContainer = ref(null);
const selectionSearch = ref(null);
useDraftGuard({ dirty: selectionDirty, busy: isSaving, uncertain: saveUncertain, label: '餐食安排' });

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedTag.value || selectedCategory.value || selectedSubcategory.value);
});
const activeFilterContainer = ref(null);
const filterToggleButton = ref(null);
const activeFilters = computed(() => [
  searchQuery.value && { key: 'search', label: `搜索：${searchQuery.value}` },
  selectedCategory.value && { key: 'category', label: `分类：${selectedCategory.value}` },
  selectedSubcategory.value && { key: 'subcategory', label: `子类：${selectedSubcategory.value}` },
  selectedTag.value && { key: 'tag', label: `标签：${selectedTag.value}` }
].filter(Boolean));
const removeActiveFilter = async key => {
  const index = activeFilters.value.findIndex(item => item.key === key);
  if (key === 'search') searchQuery.value = '';
  else if (key === 'category') selectedCategory.value = '';
  else if (key === 'subcategory') selectedSubcategory.value = '';
  else if (key === 'tag') selectedTag.value = '';
  await nextTick();
  const buttons = activeFilterContainer.value?.querySelectorAll('button') || [];
  (buttons[Math.min(index, buttons.length - 1)] || filterToggleButton.value?.$el)?.focus();
};

// 计算餐食类型的中文名
const mealTypeText = computed(() => {
  switch (mealType.value) {
    case 'breakfast': return '早餐';
    case 'lunch': return '午餐';
    case 'dinner': return '晚餐';
    default: return '餐食';
  }
});

// 计算标题
const pageTitle = computed(() => {
  return `为 ${date.value} 选择${mealTypeText.value}`;
});

const categoryOptions = computed(() => {
  const set = new Set();
  const rows = categories.value.length ? categories.value : displayedMeals.value;
  rows.forEach(r => {
    if (r.category) set.add(r.category);
  });
  return Array.from(set);
});

const subcategoryOptions = computed(() => {
  if (!selectedCategory.value) return [];
  const set = new Set();
  const rows = categories.value.length ? categories.value : displayedMeals.value;
  rows.forEach(r => {
    if (r.category === selectedCategory.value && r.subcategory) set.add(r.subcategory);
  });
  return Array.from(set);
});

const groupedMeals = computed(() => {
  const groups = new Map();
  for (const meal of displayedMeals.value) {
    const c = meal.category || '未分类';
    const s = meal.subcategory || '其它';
    if (!groups.has(c)) groups.set(c, new Map());
    const subMap = groups.get(c);
    if (!subMap.has(s)) subMap.set(s, []);
    subMap.get(s).push(meal);
  }
  const out = [];
  for (const [category, subMap] of groups.entries()) {
    const subs = [];
    for (const [subcategory, meals] of subMap.entries()) {
      subs.push({ subcategory, meals });
    }
    subs.sort((a, b) => a.subcategory.localeCompare(b.subcategory, 'zh'));
    out.push({ category, subs });
  }
  out.sort((a, b) => a.category.localeCompare(b.category, 'zh'));
  return out;
});

// 检查菜品是否被选中
const isMealSelected = (meal) => {
  if (!meal) return false;
  // 使用_id或id，兼容两种情况
  const mealId = meal._id || meal.id;
  if (!mealId) return false;
  
  return selectedMeals.value.some(m => {
    const selectedId = m._id || m.id;
    return String(selectedId) === String(mealId);
  });
};

// 切换菜品选中状态
const toggleMealSelection = (meal) => {
  if (!meal || isInitializing.value || isSaving.value || loadError.value || saveUncertain.value) {
    return;
  }
  
  // 使用_id或id，兼容两种情况
  const mealId = meal._id || meal.id;
  if (!mealId) {
    return;
  }

  const index = selectedMeals.value.findIndex(m => {
    const selectedId = m._id || m.id;
    return String(selectedId) === String(mealId);
  });
  
  if (index === -1) {
    selectedMeals.value.push(meal);
  } else {
    selectedMeals.value.splice(index, 1);
  }
};
const removeSelectedMeal = async meal => {
  const index = selectedMeals.value.findIndex(item => String(item._id || item.id) === String(meal._id || meal.id));
  if (index < 0 || isInitializing.value || isSaving.value || loadError.value || saveUncertain.value) return;
  toggleMealSelection(meal);
  await nextTick();
  const buttons = selectedMealContainer.value?.querySelectorAll('button:not([disabled])') || [];
  if (buttons.length) buttons[Math.min(index, buttons.length - 1)].focus();
  else selectionSearch.value?.focus();
};

// 保存餐食安排
const saveSelection = async () => {
  if (isInitializing.value || isSaving.value || loadError.value || saveUncertain.value) return;
  // 确保有日期和餐食类型
  if (!date.value || !mealType.value) {
    ElMessage.error('参数无效，请返回重试');
    return;
  }
  
  isSaving.value = true;
  
  try {
    // 过滤掉null或undefined的ID，优先使用_id，其次使用id
    const mealIds = selectedMeals.value
      .map(meal => meal._id || meal.id)
      .filter(id => id !== null && id !== undefined);
    
    // 如果没有选择有效的菜品，则提示用户
    if (mealIds.length === 0 && selectedMeals.value.length > 0) {
      ElMessage.warning('所选菜品ID无效，请重新选择');
      return;
    }
    if (mealIds.length === 0 && initialIds.value.length > 0) {
      confirmingEmpty.value = true;
      try {
        await ElMessageBox.confirm(`这会清空 ${date.value} ${mealTypeText.value}原有的 ${initialIds.value.length} 道菜，不影响其他餐次。确认保存空安排吗？`, '确认清空此餐次？', { type: 'warning', confirmButtonText: '确认清空', cancelButtonText: '继续选择' });
      } catch (_) { return; }
      finally { confirmingEmpty.value = false; }
    }
    
    await scheduleStore.setMeal(date.value, mealType.value, mealIds, { expectedVersion: expectedVersion.value });
    const suggestedId = typeof route.query.suggestedMealId === 'string' ? route.query.suggestedMealId : '';
    const wishlistId = typeof route.query.wishlistId === 'string' ? route.query.wishlistId : '';
    if (wishlistId && suggestedId && mealIds.some(id => String(id) === suggestedId)) {
      if (wishSnapshot.value?.status === 'open' && String(wishSnapshot.value._id || wishSnapshot.value.id) === wishlistId && validWishVersion(wishSnapshot.value)) {
        try {
          const updated = await api.wishlist.updateStatus(wishlistId, 'planned', wishSnapshot.value.editVersion);
          if (String(updated?._id || updated?.id || '') !== wishlistId || updated?.status !== 'planned' || !validWishVersion(updated)) throw new Error('状态响应不完整');
        } catch (_) { ElMessage.warning('餐食已保存，但想吃清单状态未确认或已变化，请在想吃清单中检查'); }
      } else if (wishSnapshot.value?.status !== 'planned') ElMessage.warning('餐食已保存，想吃清单状态未自动修改，请在清单中检查');
    }
    
    initialIds.value = idsFor(selectedMeals.value);
    isSaving.value = false;
    await router.push(calendarDestination());
    
  } catch (error) {
    if (error?.code === 'SCHEDULE_CONFLICT') {
      conflict.value = true;
      loadError.value = true;
    } else {
      saveUncertain.value = true;
      ElMessage.warning('保存结果未确认，请先重新核对日历安排');
    }
  } finally {
    isSaving.value = false;
  }
};

// 取消选择
const handleCancel = () => {
  router.push(calendarDestination());
};

// 清除过滤
const clearFilters = () => {
  searchQuery.value = '';
  selectedTag.value = '';
  selectedCategory.value = '';
  selectedSubcategory.value = '';
  showAdvancedFilters.value = false;
  currentPage.value = 1;
};

// 页码变化处理
const handlePageChange = (page) => {
  currentPage.value = page;
  scheduleCatalogFetch(0);
};

watch([searchQuery, selectedTag, selectedCategory, selectedSubcategory], () => {
  currentPage.value = 1;
  scheduleCatalogFetch();
});

watch(selectedCategory, () => {
  selectedSubcategory.value = '';
});

// 进入新增菜品
const goToNewMeal = () => {
  router.push({ name: 'MealEditor' });
};

const legacyMatches = (meal) => {
  const query = searchQuery.value.trim().toLowerCase();
  const mealTags = Array.isArray(meal.tags) ? meal.tags : [];
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const steps = Array.isArray(meal.steps) ? meal.steps : [];
  const fields = [meal.name, meal.description, meal.tips, ...mealTags, ...ingredients.map(item => item?.name || item), ...steps.map(step => step?.description || step)];
  return (!query || fields.some(value => String(value || '').toLowerCase().includes(query))) &&
    (!selectedTag.value || mealTags.includes(selectedTag.value)) &&
    (!selectedCategory.value || meal.category === selectedCategory.value) &&
    (!selectedSubcategory.value || meal.subcategory === selectedSubcategory.value);
};

const fetchCatalog = async () => {
  const sequence = ++catalogSequence;
  catalogLoading.value = true;
  catalogError.value = '';
  try {
    const params = { page: currentPage.value, limit: pageSize.value };
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim();
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (selectedSubcategory.value) params.subcategory = selectedSubcategory.value;
    if (selectedTag.value) params.tag = selectedTag.value;
    const result = await api.meal.getAllMeals(params);
    if (sequence !== catalogSequence) return;
    let rows = result.data;
    let total = result.total;
    // Older servers return a complete array and ignore pagination; keep their
    // existing client-side filtering behavior without rendering all cards.
    if (result.page == null && result.limit == null && rows.length === total) {
      const filtered = rows.filter(legacyMatches);
      total = filtered.length;
      rows = filtered.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
    }
    const lastPage = Math.max(1, Math.ceil(total / pageSize.value));
    if (currentPage.value > lastPage) {
      currentPage.value = lastPage;
      return fetchCatalog();
    }
    displayedMeals.value = rows;
    totalMeals.value = total;
  } catch (error) {
    if (sequence === catalogSequence) catalogError.value = error?.error || error?.message || '菜品列表加载失败';
  } finally {
    if (sequence === catalogSequence) catalogLoading.value = false;
  }
};

const scheduleCatalogFetch = (delay = 160) => {
  catalogSequence++;
  catalogLoading.value = true;
  catalogError.value = '';
  if (catalogTimer) clearTimeout(catalogTimer);
  catalogTimer = setTimeout(fetchCatalog, delay);
};

const loadMetadata = async () => {
  const [categoryResult, tagResult] = await Promise.allSettled([api.meal.getMealCategories(), api.meal.getMealTags()]);
  categories.value = categoryResult.status === 'fulfilled' ? categoryResult.value.data : [];
  tags.value = tagResult.status === 'fulfilled' ? tagResult.value.data : [];
  metadataError.value = categoryResult.status === 'rejected' || tagResult.status === 'rejected';
};

const loadSelection = async ({ includeSuggestion = true } = {}) => {
  // 检查必要参数
  if (!validWeekLink(date.value) || !['breakfast', 'lunch', 'dinner'].includes(mealType.value)) {
    ElMessage.error('缺少必要参数');
    router.push(calendarDestination());
    return;
  }

  const sequence = ++selectionSequence;
  isInitializing.value = true;
  loadError.value = false;
  selectionReadError.value = '';
  wishSnapshot.value = null;
  wishNotice.value = '';
  suggestionNotice.value = '';
  try {
    const schedule = await api.schedule.getScheduleByDate(date.value);
    if (sequence !== selectionSequence) return;
    if (schedule?.date !== date.value || typeof schedule?.scheduleExists !== 'boolean' ||
        (schedule.scheduleExists && (typeof schedule.scheduleVersion !== 'string' || !Number.isFinite(Date.parse(schedule.scheduleVersion)))) ||
        (!schedule.scheduleExists && schedule.scheduleVersion !== null)) {
      throw new Error('服务器未提供有效的安排版本，暂时无法安全保存');
    }
    expectedVersion.value = schedule.scheduleVersion;
    const items = schedule?.meals?.[mealType.value];
    if (!Array.isArray(items)) throw new Error('现有餐食安排不完整，请刷新后重试');
    const existingMeals = items.map(item => {
      const meal = item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, 'meal') ? item.meal : item;
      return meal;
    });
    const existingIds = existingMeals.map(meal => {
      return meal?._id || meal?.id || (typeof meal === 'string' ? meal : '');
    }).filter(Boolean).map(String);
    if (existingIds.length !== items.length) {
      throw new Error('现有安排中有不可用的菜品。请先在日历中核对并清除该餐次，再重新安排。');
    }
    if (new Set(existingIds).size !== existingIds.length) throw new Error('现有安排包含重复菜品，请先在日历中检查');
    const suggestedId = includeSuggestion && typeof route.query.suggestedMealId === 'string' ? route.query.suggestedMealId : '';
    const known = new Map(existingMeals.filter(meal => meal && typeof meal === 'object' && typeof meal.name === 'string' && (meal._id || meal.id)).map(meal => [String(meal._id || meal.id), meal]));
    const resolved = await Promise.all(existingIds.map(async id => known.get(id) || api.meal.getMealById(id)));
    if (sequence !== selectionSequence) return;
    if (resolved.some((meal, index) => !meal || String(meal._id || meal.id || '') !== existingIds[index] || typeof meal.name !== 'string')) throw new Error('部分已安排的菜品无法读取，请刷新后重试');
    if (suggestedId && !existingIds.includes(suggestedId)) {
      try {
        const suggestion = await api.meal.getMealById(suggestedId);
        if (sequence !== selectionSequence) return;
        if (!suggestion || String(suggestion._id || suggestion.id || '') !== suggestedId || typeof suggestion.name !== 'string' || !suggestion.name || suggestion.archived === true) throw new Error('推荐菜品不可用');
        resolved.push(suggestion);
      } catch (e) {
        if (sequence !== selectionSequence) return;
        if (['SESSION_CHANGED', 'SESSION_EXPIRED', 'HOUSEHOLD_SCOPE_UNVERIFIED', 'HOUSEHOLD_SCOPE_CHANGED'].includes(e?.code)) throw e;
        suggestionNotice.value = '推荐菜品无法读取或已移入回收站，未自动加入本次安排。原有安排已保留；请在菜品列表中核对并重新选择。';
      }
    }
    const wishlistId = typeof route.query.wishlistId === 'string' ? route.query.wishlistId : '';
    const linkedMealId = typeof route.query.suggestedMealId === 'string' ? route.query.suggestedMealId : '';
    if (wishlistId && linkedMealId) {
      try {
        const wish = await api.wishlist.get(wishlistId);
        if (sequence !== selectionSequence) return;
        const linked = typeof wish?.mealId === 'string' ? wish.mealId : wish?.mealId?._id || wish?.mealId?.id;
        if (String(wish?._id || wish?.id || '') !== wishlistId || String(linked || '') !== linkedMealId || !validWishVersion(wish) || !['open', 'planned', 'done'].includes(wish.status)) throw new Error('想吃记录或版本不可用');
        wishSnapshot.value = wish;
        if (wish.status === 'done') wishNotice.value = '这条想吃已完成，保存排餐时不会自动修改其状态。';
      } catch (_) {
        if (sequence !== selectionSequence) return;
        wishNotice.value = '无法确认想吃记录的最新状态；仍可保存排餐，但不会自动修改清单。';
      }
    }
    selectedMeals.value = resolved;
    initialIds.value = [...new Set(existingIds)].sort();
    conflict.value = false;
    saveUncertain.value = false;
  } catch (error) {
    if (sequence === selectionSequence) {
      loadError.value = true;
      selectionReadError.value = error?.error || error?.message || '加载页面数据失败，请重试';
      ElMessage.error(error?.error || error?.message || '加载页面数据失败，请重试');
    }
  } finally {
    if (sequence === selectionSequence) isInitializing.value = false;
  }
};

const reloadSelection = async () => {
  if (selectionDirty.value || saveUncertain.value) {
    try {
      await ElMessageBox.confirm('重新加载会用服务器上的最新安排替换当前选择；如果上次保存结果未确认，请先记下需要保留的菜品。', '确认重新加载？', { type: 'warning', confirmButtonText: '重新加载', cancelButtonText: '继续核对' });
    } catch (_) { return; }
  }
  await loadSelection({ includeSuggestion: false });
};

onBeforeRouteUpdate(async (to, from) => {
  if (to.fullPath === from.fullPath) return true;
  if (isSaving.value) { ElMessage.warning('操作正在进行，请稍候'); return false; }
  if (!selectionDirty.value && !saveUncertain.value) return true;
  try {
    await ElMessageBox.confirm('切换餐食会放弃当前未保存或未确认的选择。', '确认切换？', { type: 'warning', confirmButtonText: '放弃并切换', cancelButtonText: '继续编辑' });
    return true;
  } catch (_) { return false; }
});
watch(() => route.fullPath, () => {
  selectedMeals.value = [];
  initialIds.value = [];
  conflict.value = false;
  saveUncertain.value = false;
  loadSelection();
});
onMounted(() => { loadSelection(); fetchCatalog(); loadMetadata(); });
onBeforeUnmount(() => {
  selectionSequence++;
  catalogSequence++;
  if (catalogTimer) clearTimeout(catalogTimer);
});
</script>

<template>
  <div class="meal-selection">
    <div class="page-header">
      <h2 class="page-title">{{ pageTitle }}</h2>
      
      <div class="header-actions">
        <el-button @click="handleCancel">取消</el-button>
        <el-button 
          type="primary" 
          @click="saveSelection" 
          :disabled="isInitializing || isSaving || loadError || saveUncertain"
          :loading="isSaving"
        >
          保存安排
        </el-button>
      </div>
    </div>
    <el-alert v-if="loadError || saveUncertain" type="error" :closable="false" show-icon :title="saveUncertain ? '保存结果未确认，请先核对最新安排。' : conflict ? '其他成员刚刚更新了安排，当前选择尚未保存。' : '无法读取完整的现有安排，为保护数据暂时不能保存。'">
      <span v-if="conflict || saveUncertain">重新加载会用最新安排替换当前选择，请先记下需要保留的菜品。</span>
      <p v-else-if="selectionReadError">{{ selectionReadError }}</p>
      <el-button link type="primary" :disabled="isInitializing" @click="reloadSelection">{{ conflict || saveUncertain ? '重新加载最新安排' : '重新加载' }}</el-button>
    </el-alert>
    <el-alert v-if="wishNotice" type="info" :closable="false" show-icon :title="wishNotice" />
    <el-alert v-if="suggestionNotice" type="warning" :closable="false" show-icon :title="suggestionNotice" />
    
    <div class="selection-info">
      <div class="selected-count">
        <strong>已选择:</strong> {{ selectedMeals.length }} 个菜品
      </div>
      <p class="selection-status" role="status">{{ selectionStatus }}</p>
      <p class="selection-hint">切换分类、搜索或翻页不会清除已选菜品；点击“保存安排”后才会更新日历。</p>
      
      <div class="selected-meals" ref="selectedMealContainer" v-if="selectedMeals.length > 0">
        <button
          v-for="meal in selectedMeals" 
          :key="meal._id || meal.id"
          type="button"
          :aria-label="`移除${meal.name}`"
          :disabled="isInitializing || isSaving || loadError || saveUncertain"
          @click="removeSelectedMeal(meal)"
          class="selected-meal-tag"
        >
          {{ meal.name }} <span aria-hidden="true">×</span>
        </button>
      </div>
    </div>
        <div class="filters-container">
      <div class="search-container">
        <el-input
          ref="selectionSearch"
          v-model="searchQuery"
          placeholder="搜索菜名、食材或做法"
          aria-label="搜索可选菜品"
          clearable
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <div class="toolbar-row">
        <el-radio-group v-model="currentView" size="small" aria-label="菜品显示方式">
          <el-radio-button value="grouped" aria-label="分组视图" title="分组视图">
            <el-icon><Menu /></el-icon>
          </el-radio-button>
          <el-radio-button value="grid" aria-label="网格视图" title="网格视图">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
        </el-radio-group>

        <div class="toolbar-actions">
          <el-button ref="filterToggleButton" size="small" :aria-expanded="showAdvancedFilters" aria-controls="selection-advanced-filters" @click="showAdvancedFilters = !showAdvancedFilters">
            <el-icon><Filter /></el-icon>
            筛选
          </el-button>
          <el-button v-if="hasActiveFilters" size="small" type="info" @click="clearFilters">
            清除
          </el-button>
        </div>
      </div>

      <el-collapse-transition>
        <div id="selection-advanced-filters" v-show="showAdvancedFilters" class="advanced-filters">
          <div class="filter-item">
            <span class="filter-field-label" aria-hidden="true">分类</span>
            <el-select v-model="selectedCategory" aria-label="分类" placeholder="选择分类" clearable style="width: 100%;">
              <el-option
                v-for="c in categoryOptions"
                :key="c"
                :label="c"
                :value="c"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-field-label" aria-hidden="true">子类</span>
            <el-select
              v-model="selectedSubcategory"
              aria-label="子类"
              placeholder="选择子类"
              clearable
              style="width: 100%;"
              :disabled="!selectedCategory"
            >
              <el-option
                v-for="s in subcategoryOptions"
                :key="s"
                :label="s"
                :value="s"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-field-label" aria-hidden="true">标签</span>
            <el-select v-model="selectedTag" aria-label="标签" placeholder="选择标签" clearable style="width: 100%;">
              <el-option
                v-for="tag in tags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>
        </div>
      </el-collapse-transition>
      <div v-if="activeFilters.length" ref="activeFilterContainer" class="active-filters" role="group" aria-label="当前筛选条件">
        <span class="active-filters-label">当前筛选</span>
        <button v-for="filter in activeFilters" :key="filter.key" type="button" class="active-filter-chip" :aria-label="`移除${filter.label}筛选`" @click="removeActiveFilter(filter.key)"><span>{{ filter.label }}</span><span aria-hidden="true">×</span></button>
      </div>
      
      <div v-if="!catalogLoading && !catalogError" class="catalog-summary" aria-live="polite">{{ hasActiveFilters ? '筛选结果' : '全部菜品' }} · {{ totalMeals }} 道<span v-if="currentView === 'grouped'"> · 按当前页分组</span></div>
    </div>

    <div class="catalog-layout">
      <aside class="category-sidebar" aria-label="菜品分类">
        <div class="category-heading">菜品分类</div>
        <nav class="category-list" aria-label="选择菜品分类">
          <button type="button" :class="{ active: !selectedCategory }" :aria-pressed="!selectedCategory" @click="selectedCategory = ''">全部分类</button>
          <button v-for="category in categoryOptions" :key="category" type="button" :class="{ active: selectedCategory === category }" :aria-pressed="selectedCategory === category" @click="selectedCategory = category">{{ category }}</button>
        </nav>
        <div v-if="metadataError" class="metadata-warning" role="status">分类或标签可能不完整 <button type="button" @click="loadMetadata">重试</button></div>
      </aside>
    <section class="meals-container" aria-label="可选菜品">
      <el-alert v-if="catalogError && !catalogLoading" type="error" :closable="false" show-icon :title="`无法加载菜品：${catalogError}`"><el-button link type="primary" @click="fetchCatalog">重新加载菜品</el-button></el-alert>
      <el-skeleton v-else :loading="catalogLoading || isInitializing" animated :count="4" :throttle="500">
        <template #default>
          <div v-if="displayedMeals.length === 0" class="empty-state">
            <el-empty :description="hasActiveFilters ? '没有找到匹配的菜品' : '暂无菜品'">
              <template #extra>
                <el-button v-if="hasActiveFilters" @click="clearFilters">清除筛选</el-button>
                <el-button v-else type="primary" @click="goToNewMeal">
                  添加新菜品
                </el-button>
              </template>
            </el-empty>
          </div>
          
          <div v-else>
            <div v-if="currentView === 'grouped'" class="meals-grouped">
              <el-collapse accordion>
                <el-collapse-item
                  v-for="group in groupedMeals"
                  :key="group.category"
                  :title="`${group.category}（${group.subs.reduce((acc, s) => acc + s.meals.length, 0)}）`"
                >
                  <el-collapse accordion>
                    <el-collapse-item
                      v-for="sub in group.subs"
                      :key="`${group.category}-${sub.subcategory}`"
                      :title="`${sub.subcategory}（${sub.meals.length}）`"
                    >
                      <div class="meals-grid">
                        <div v-for="meal in sub.meals" :key="meal._id || meal.id" class="meal-item">
                          <MealCard
                            :meal="meal"
                            :showActions="false"
                            :selected="isMealSelected(meal)"
                            :selectable="true"
                            :aria-disabled="isInitializing || isSaving || loadError || saveUncertain"
                            @select="(selectedMeal) => toggleMealSelection(selectedMeal)"
                          />
                        </div>
                      </div>
                    </el-collapse-item>
                  </el-collapse>
                </el-collapse-item>
              </el-collapse>
            </div>

            <div v-else class="meals-grid">
              <div v-for="meal in displayedMeals" :key="meal._id || meal.id" class="meal-item">
                <MealCard 
                  :meal="meal" 
                  :showActions="false"
                  :selected="isMealSelected(meal)"
                  :selectable="true"
                  :aria-disabled="isInitializing || isSaving || loadError || saveUncertain"
                  @select="(selectedMeal) => toggleMealSelection(selectedMeal)"
                />
              </div>
            </div>

            <div class="pagination-container desktop-pagination" v-if="totalMeals > pageSize">
              <el-pagination
                layout="prev, pager, next"
                :total="totalMeals"
                :page-size="pageSize"
                v-model:current-page="currentPage"
                @current-change="handlePageChange"
                background
              />
            </div>
            <div v-if="totalMeals > pageSize" class="mobile-pagination" aria-label="菜品分页">
              <el-button :disabled="currentPage <= 1 || catalogLoading" @click="handlePageChange(currentPage - 1)">上一页</el-button>
              <span>第 {{ currentPage }} / {{ Math.ceil(totalMeals / pageSize) }} 页</span>
              <el-button :disabled="currentPage >= Math.ceil(totalMeals / pageSize) || catalogLoading" @click="handlePageChange(currentPage + 1)">下一页</el-button>
            </div>
          </div>
        </template>
      </el-skeleton>
    </section>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meal-selection {
  padding: 0;
  
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: var(--text-primary);
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .selection-info {
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 15px 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px var(--shadow-color);
    
    .selected-count {
      margin-bottom: 10px;
      font-size: 16px;
      
      strong {
        color: var(--text-primary);
      }
    }
    
    .selected-meals {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      
      .selected-meal-tag {
        min-height: 44px;
        max-width: 100%;
        overflow-wrap: anywhere;
        padding: 6px 12px;
        border: 1px solid var(--border-color);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        border-radius: 20px;
        font: inherit;
        cursor: pointer;
        &:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 2px; }
        &:disabled { cursor: not-allowed; opacity: .65; }
      }
    }
  }
  
  .filters-container {
    background-color: var(--bg-primary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px 0 var(--shadow-color);
    
    .search-container {
      margin-bottom: 15px;
    }

    .toolbar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .toolbar-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .advanced-filters {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .filter-item {
      min-width: 0;
    }
    
    .tags-filter {
      .tags-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        
        span {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
        }
      }
      
      .tags-list {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        
        .tag-item {
          cursor: pointer;
          transition: all 0.3s;
          border-radius: 20px;
          
          &:hover {
            transform: translateY(-2px);
          }
          
          &.selected-tag {
            background-color: var(--primary-color);
            color: white;
          }
        }
      }
    }
  }
  
  .meals-container {
    .meals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr));
      grid-gap: 20px;
    }
    
    .empty-state {
      padding: 50px 0;
    }
    
    .pagination-container {
      margin-top: 30px;
      display: flex;
      justify-content: center;
    }
  }
}

.catalog-layout { display: grid; grid-template-columns: minmax(130px, 180px) minmax(0, 1fr); gap: 20px; align-items: start; }
.category-sidebar { position: sticky; top: calc(var(--header-height, 64px) + 12px); max-height: calc(100vh - var(--header-height, 64px) - 24px); overflow-y: auto; padding: 18px 12px; border: 1px solid var(--border-color); border-radius: 24px; background: var(--bg-primary); box-shadow: 0 16px 38px var(--shadow-color); }
.category-heading { padding: 0 10px 12px; color: var(--text-secondary); font-size: 12px; font-weight: 700; }
.category-list { display: flex; flex-direction: column; gap: 5px; }
.category-list button { width: 100%; border: 0; border-radius: 14px; background: transparent; color: var(--text-secondary); padding: 11px 12px; text-align: left; font: inherit; font-size: 14px; cursor: pointer; overflow-wrap: anywhere; }
.category-list button:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.category-list button.active { background: #f9e6dc; color: #713d30; font-weight: 700; box-shadow: inset 3px 0 0 #c77c5c; }
.category-list button:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 2px; }
.metadata-warning { padding: 12px 8px 0; color: var(--text-secondary); font-size: 12px; }
.metadata-warning button { border: 0; background: none; color: var(--text-primary); padding: 6px 0; text-decoration: underline; font: inherit; cursor: pointer; }
.catalog-summary { color: var(--text-secondary); font-size: 13px; }
.filter-field-label { display: block; margin-bottom: 6px; color: var(--text-primary); font-size: 13px; font-weight: 700; }
.active-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 14px 0; min-width: 0; }
.active-filters-label { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
.active-filter-chip { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; min-height: 44px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); font: inherit; font-size: 13px; cursor: pointer; }
.active-filter-chip span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.active-filter-chip:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.selection-status, .selection-hint { margin: 0 0 10px; color: var(--text-primary); font-size: 13px; line-height: 1.6; overflow-wrap: anywhere; }
.selection-status { font-weight: 700; }
.selection-hint { color: var(--text-secondary); }
.meals-container { min-width: 0; }
.mobile-pagination { display: none; }
:global(html.dark .meal-selection .category-list button.active) { color: var(--text-primary); background: #604131; box-shadow: inset 3px 0 0 var(--secondary-color); }
:global(html.dark .meal-selection .meals-grouped .el-collapse-item__header),
:global(html.dark .meal-selection .meals-grouped .el-collapse-item__wrap) { color: var(--text-primary); background: var(--bg-primary); border-color: var(--border-color); }
:global(.meal-selection .el-radio-button__original-radio:focus-visible + .el-radio-button__inner) { outline: 2px solid var(--secondary-color); outline-offset: 2px; }

@media (max-width: 768px) {
  .meal-selection {
    .page-header { align-items: flex-start; flex-direction: column; gap: 14px; }
    .header-actions { width: 100%; }
    .header-actions .el-button { flex: 1; min-height: 44px; }
    .filters-container {
      .advanced-filters {
        grid-template-columns: 1fr;
      }
    }

    .meals-container {
      .meals-grid {
        grid-template-columns: minmax(0, 1fr);
        grid-gap: 10px;
      }
    }
  }
  .meal-selection :deep(.meal-card-wrapper) { margin-bottom: 0; border-radius: 16px; }
  .meal-selection :deep(.meal-card-wrapper .el-card__body) { padding: 0; }
  .meal-selection :deep(.meal-card-content) { flex-direction: row; align-items: flex-start; }
  .meal-selection :deep(.meal-image-container) { width: 88px; height: 88px; flex: 0 0 88px; margin: 10px; border-radius: 12px; }
  .meal-selection :deep(.meal-image) { border-radius: 12px; }
  .meal-selection :deep(.photo-pin) { width: 28px; height: 8px; top: 7px; }
  .meal-selection :deep(.meal-info) { min-width: 0; padding: 14px 10px 12px 0; gap: 6px; }
  .meal-selection :deep(.meal-name) { font-size: 15px; overflow-wrap: anywhere; }
  .meal-selection :deep(.meal-description) { font-size: 12px; -webkit-line-clamp: 2; }
  .meal-selection :deep(.meal-tags),
  .meal-selection :deep(.meal-ingredients) { display: none; }
  .catalog-layout { grid-template-columns: 82px minmax(0, 1fr); gap: 10px; }
  .category-sidebar { padding: 12px 5px; border-radius: 18px; }
  .category-heading { padding: 0 5px 9px; font-size: 11px; }
  .category-list button { min-height: 44px; padding: 10px 6px; font-size: 12px; border-radius: 10px; }
  .metadata-warning { padding: 8px 4px 0; }
  .desktop-pagination { display: none !important; }
  .mobile-pagination { display: flex; justify-content: center; align-items: center; gap: 8px; margin-top: 18px; font-size: 12px; color: var(--text-secondary); }
  .mobile-pagination :deep(.el-button) { min-height: 44px; padding: 8px 10px; }
}
</style>
