<script setup>
import { ref, onMounted, onBeforeUnmount, computed, reactive, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMealStore } from '../stores/meal';
import api from '../services/api';
import MealCard from '../components/MealCard.vue';
import { useDraftGuard } from '../composables/useDraftGuard';
import { readCatalogQuery, buildCatalogQuery } from '../utils/catalogQuery.mjs';
import { resolveRecipeImage, handleUploadedImageError } from '../utils/uploadedImage.mjs';
import defaultImageSrc from '../assets/meal-placeholder.svg';
import { ElMessageBox, ElMessage } from 'element-plus';
import { Search, Plus, Upload, Delete, Food, Grid, List, Document, Edit, Menu, Filter, View, Present, Warning } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute();
const mealStore = useMealStore();
const initialCatalog = readCatalogQuery(route.query);
let applyingCatalogRoute = false;
let catalogUrlTimer = null;
const internalCatalogUrls = new Set();

// 状态 - 列表过滤和分页
const searchQuery = ref(initialCatalog.search);
const selectedTag = ref(initialCatalog.tag);
const selectedCategory = ref(initialCatalog.category);
const uncategorized = ref(initialCatalog.uncategorized);
const selectedSubcategory = ref(initialCatalog.subcategory);
const selectedDifficulty = ref(initialCatalog.difficulty);
const favoriteOnly = ref(initialCatalog.favorite);
const currentPage = ref(initialCatalog.page);
const pageSize = ref(8);
const catalogContent = ref(null);
let restoreCatalogFocus = false;
let returnMealFocus = typeof history.state?.catalogReturnMeal === 'string' && /^[a-z\d_-]{1,128}$/i.test(history.state.catalogReturnMeal) ? history.state.catalogReturnMeal : '';
if (returnMealFocus) { const state = { ...history.state }; delete state.catalogReturnMeal; history.replaceState(state, ''); }
const loading = ref(false);
const loadError = ref('');
const categoryLoadFailed = ref(false);
const categoryLoading = ref(false);
const categoryReady = ref(false);
const tagLoadFailed = ref(false);
const tagLoading = ref(false);
const categoryRetryButton = ref(null);
const categoryRefreshButton = ref(null);
const tagRetryButton = ref(null);
const displayedMeals = ref([]);
const totalMeals = ref(0);
let fetchSequence = 0;
const archiveDialog = ref(false);
const archiveSupported = ref(false);
const archiveLoading = ref(false);
const archiveError = ref('');
const archiveRows = ref([]);
const archiveTotal = ref(0);
const archivePage = ref(1);
const archiveSearch = ref('');
const archiveLimit = 24;
const archiveActionId = ref('');
const archiveProblem = ref(null);
const archiveChecking = ref(false);
let archiveSequence = 0;
let archiveTimer = null;
const archiveBusy = computed(() => !!archiveActionId.value || archiveChecking.value);
const archiveLastPage = computed(() => Math.max(1, Math.ceil(archiveTotal.value / archiveLimit)));
const canArchive = meal => meal?.supportsConditionalArchive === true && meal.archiveVersion &&
  (meal.archiveVersion.revision === null || (typeof meal.archiveVersion.revision === 'string' && !!meal.archiveVersion.revision && meal.archiveVersion.revision.length <= 128)) &&
  (meal.archiveVersion.updatedAt === null || (typeof meal.archiveVersion.updatedAt === 'string' && Number.isFinite(Date.parse(meal.archiveVersion.updatedAt))));

// 状态 - 显示方式
const currentView = ref(initialCatalog.view); // 'grid', 'list', 'table', 'grouped'
const showAdvancedFilters = ref(!!(initialCatalog.tag || initialCatalog.subcategory || initialCatalog.difficulty));
// An object value keeps the special choice distinct from any user-defined category name.
const uncategorizedChoice = Object.freeze({ kind: 'uncategorized' });
const categorySelection = computed({
  get: () => uncategorized.value ? uncategorizedChoice : selectedCategory.value,
  set: value => {
    if (value === uncategorizedChoice) { selectedCategory.value = ''; uncategorized.value = true; }
    else { uncategorized.value = false; selectedCategory.value = typeof value === 'string' ? value : ''; }
  }
});
const catalogState = () => ({ search: searchQuery.value, category: selectedCategory.value, uncategorized: uncategorized.value, subcategory: selectedSubcategory.value, tag: selectedTag.value, difficulty: selectedDifficulty.value, favorite: favoriteOnly.value, page: currentPage.value, view: currentView.value });
const catalogKey = value => JSON.stringify(readCatalogQuery(value));
const syncCatalogUrl = async () => {
  if (catalogUrlTimer) { clearTimeout(catalogUrlTimer); catalogUrlTimer = null; }
  if (route.name !== 'meals') return;
  const query = buildCatalogQuery(catalogState());
  const key = catalogKey(query);
  if (key === catalogKey(route.query)) return;
  internalCatalogUrls.add(key);
  try { await router.replace({ name: 'meals', query }); } finally { internalCatalogUrls.delete(key); }
};
const scheduleCatalogUrl = () => { if (catalogUrlTimer) clearTimeout(catalogUrlTimer); catalogUrlTimer = setTimeout(() => { catalogUrlTimer = null; void syncCatalogUrl(); }, 200); };

const hasActiveFilters = computed(() => {
  return !!(searchQuery.value || selectedTag.value || selectedCategory.value || uncategorized.value || selectedSubcategory.value || selectedDifficulty.value || favoriteOnly.value);
});
const activeFilterContainer = ref(null);
const filterToggleButton = ref(null);
const searchInput = ref(null);
const activeFilters = computed(() => [
  searchQuery.value && { key: 'search', label: `搜索：${searchQuery.value}` },
  selectedCategory.value && { key: 'category', label: `分类：${selectedCategory.value}` },
  uncategorized.value && { key: 'uncategorized', label: '分类：未填写分类（空值）' },
  selectedSubcategory.value && { key: 'subcategory', label: `子类：${selectedSubcategory.value}` },
  selectedTag.value && { key: 'tag', label: `标签：${selectedTag.value}` },
  selectedDifficulty.value && { key: 'difficulty', label: `难度：${({ easy: '简单', medium: '中等', hard: '进阶' })[selectedDifficulty.value] || selectedDifficulty.value}` },
  favoriteOnly.value && { key: 'favorite', label: '只看收藏' }
].filter(Boolean));
const removeActiveFilter = async key => {
  const index = activeFilters.value.findIndex(item => item.key === key);
  if (key === 'search') searchQuery.value = '';
  else if (key === 'category') selectedCategory.value = '';
  else if (key === 'uncategorized') uncategorized.value = false;
  else if (key === 'subcategory') selectedSubcategory.value = '';
  else if (key === 'tag') selectedTag.value = '';
  else if (key === 'difficulty') selectedDifficulty.value = '';
  else if (key === 'favorite') favoriteOnly.value = false;
  await nextTick();
  const buttons = activeFilterContainer.value?.querySelectorAll('button') || [];
  (buttons[Math.min(index, buttons.length - 1)] || filterToggleButton.value?.$el)?.focus();
};

// 状态 - 新增菜品对话框
const addMealDialogVisible = ref(false);
const isSubmitting = ref(false);
const newMealFormRef = ref(null);
const imageFileToUpload = ref(null);
const newMealImagePreviewUrl = ref('');

const newMealForm = reactive({
  name: '',
  description: '',
  tags: []
});

const newMealRules = {
  name: [{ required: true, message: '请输入菜品名称', trigger: 'blur' }]
};

const categoryOptions = computed(() => {
  const set = new Set();
  const rows = Array.isArray(mealStore.categories) && mealStore.categories.length > 0
    ? mealStore.categories
    : displayedMeals.value.map(m => ({ category: m.category || '' }));
  rows.forEach(r => {
    if (r.category) set.add(r.category);
  });
  return Array.from(set);
});
const categoryCounts = computed(() => {
  if (!categoryReady.value || categoryLoadFailed.value || categoryLoading.value || !Array.isArray(mealStore.categories)) return null;
  const counts = new Map(); const pairs = new Set();
  for (const row of mealStore.categories) {
    if (!Number.isSafeInteger(row.count) || row.count < 0) return null;
    const pair = JSON.stringify([row.category, row.subcategory || '']);
    if (pairs.has(pair)) return null;
    pairs.add(pair);
    const total = (counts.get(row.category) || 0) + row.count;
    if (!Number.isSafeInteger(total)) return null;
    counts.set(row.category, total);
  }
  return counts;
});
const categorySidebar = ref(null);
const revealActiveCategory = async () => {
  await nextTick();
  const sidebar = categorySidebar.value;
  if (!sidebar) return;
  const buttons = [...sidebar.querySelectorAll('.category-list button')];
  const target = uncategorized.value ? buttons.find(button => button.dataset.sidebarKind === 'uncategorized') : selectedCategory.value
    ? buttons.find(button => button.dataset.sidebarKind === 'category' && button.dataset.category === selectedCategory.value)
    : buttons.find(button => button.dataset.sidebarKind === (favoriteOnly.value ? 'favorite' : 'all'));
  if (!target) return;
  const box = sidebar.getBoundingClientRect(); const bounds = target.getBoundingClientRect();
  if (bounds.top < box.top + 4) sidebar.scrollTop += bounds.top - box.top - 4;
  else if (bounds.bottom > box.bottom - 4) sidebar.scrollTop += bounds.bottom - box.bottom + 4;
};
watch([selectedCategory, uncategorized, favoriteOnly, categoryOptions], revealActiveCategory, { flush: 'post' });
onMounted(revealActiveCategory);

const subcategoryOptions = computed(() => {
  if (!selectedCategory.value) return [];
  const set = new Set();
  const rows = Array.isArray(mealStore.categories) && mealStore.categories.length > 0
    ? mealStore.categories
    : displayedMeals.value.map(m => ({ category: m.category || '', subcategory: m.subcategory || '' }));
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

// 计算所有标签
const allTags = computed(() => {
  if (Array.isArray(mealStore.tags) && mealStore.tags.length > 0) {
    return mealStore.tags;
  }

  const tagsSet = new Set();

  displayedMeals.value.forEach(meal => {
    if (meal.tags && Array.isArray(meal.tags)) {
      meal.tags.forEach(tag => tagsSet.add(tag));
    }
  });

  return Array.from(tagsSet);
});

// 获取菜品图片
const getMealImage = meal => resolveRecipeImage(meal.imageUrl || meal.image, defaultImageSrc);

// 图片加载错误处理
const handleImageError = event => handleUploadedImageError(event, defaultImageSrc);

const legacyCatalogMatches = meal => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  const tags = Array.isArray(meal.tags) ? meal.tags : [];
  const ingredients = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const steps = Array.isArray(meal.steps) ? meal.steps : [];
  const fields = [meal.name, meal.description, meal.tips, ...tags, ...ingredients.map(item => item?.name || item), ...steps.map(item => item?.description || item)];
  return (!query || fields.some(value => String(value || '').toLocaleLowerCase().includes(query))) && (!selectedTag.value || tags.includes(selectedTag.value)) && (!uncategorized.value || meal.category == null || meal.category === '') && (!selectedCategory.value || meal.category === selectedCategory.value) && (!selectedSubcategory.value || meal.subcategory === selectedSubcategory.value) && (!selectedDifficulty.value || meal.difficulty === selectedDifficulty.value) && (!favoriteOnly.value || meal.favorite === true);
};

// 加载菜品；完整数组是旧接口，在本地筛选和分页。
const fetchMeals = async () => {
  const sequence = ++fetchSequence;
  loading.value = true;
  loadError.value = '';

  try {
    const params = {};

    if (searchQuery.value) params.search = searchQuery.value;
    if (selectedTag.value) params.tag = selectedTag.value;
    if (selectedCategory.value) params.category = selectedCategory.value;
    if (uncategorized.value) params.uncategorized = '1';
    if (selectedSubcategory.value) params.subcategory = selectedSubcategory.value;
    if (selectedDifficulty.value) params.difficulty = selectedDifficulty.value;
    if (favoriteOnly.value) params.favorite = 'true';

    params.page = currentPage.value;
    params.limit = pageSize.value;

    const requestedPage = currentPage.value;
    const result = await api.meal.getAllMeals(params);
    if (sequence !== fetchSequence) return;
    let rows = result.data; let total = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(item => !item || !(item._id || item.id) || typeof item.name !== 'string' || !item.name.trim()) || new Set(rows.map(item => String(item._id || item.id))).size !== rows.length) throw new Error('菜品列表数据不完整');
    if (result.legacyArray) { rows = rows.filter(legacyCatalogMatches); total = rows.length; rows = rows.slice((requestedPage - 1) * pageSize.value, requestedPage * pageSize.value); }
    else if (uncategorized.value && !result.supportsUncategorizedFilter) throw new Error('当前服务器不支持未分类筛选，请升级服务器或查看全部分类');
    else if (uncategorized.value && rows.some(meal => meal.category != null && meal.category !== '')) throw new Error('未分类筛选结果不完整，请重试');
    else if (result.page != null || result.limit != null) {
      if (result.page !== requestedPage || result.limit !== pageSize.value || rows.length !== Math.min(pageSize.value, Math.max(0, total - (requestedPage - 1) * pageSize.value))) throw new Error('菜品分页数据不完整或已发生变化，请重试');
    }
    const lastPage = Math.max(1, Math.ceil(total / pageSize.value));
    if (currentPage.value > lastPage) {
      currentPage.value = lastPage;
      void syncCatalogUrl();
      return fetchMeals();
    }
    displayedMeals.value = rows;
    totalMeals.value = total;
  } catch (error) {
    if (sequence === fetchSequence) loadError.value = error?.error || error?.message || '获取菜品列表失败';
  } finally {
    if (sequence === fetchSequence) {
      loading.value = false;
      const restore = restoreCatalogFocus;
      restoreCatalogFocus = false;
      if (restore || returnMealFocus) {
        await nextTick();
        if (returnMealFocus) await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const focused = document.activeElement;
        if (sequence === fetchSequence && (!focused || focused === document.body || !focused.isConnected)) {
          const target = returnMealFocus && [...(catalogContent.value?.querySelectorAll('[data-catalog-id]') || [])].find(node => node.dataset.catalogId === returnMealFocus && node.getClientRects().length);
          (target || catalogContent.value)?.focus();
        }
        if (sequence === fetchSequence) returnMealFocus = '';
      }
    }
  }
};

// 编辑菜品
const handleEditMeal = async (meal) => {
  const mealId = meal._id || meal.id;
  await syncCatalogUrl();
  if (route.name !== 'meals') return;
  router.push({
    name: 'MealEditor',
    params: { id: mealId }, query: buildCatalogQuery(catalogState())
  });
};

const handleViewMeal = async (meal) => {
  const mealId = meal._id || meal.id;
  await syncCatalogUrl();
  if (route.name !== 'meals') return;
  return router.push({ name: 'MealDetail', params: { id: mealId }, query: buildCatalogQuery(catalogState()) });
};

const handleMealKeydown = (event, meal) => {
  if (event.target !== event.currentTarget || !['Enter', ' '].includes(event.key)) return;
  event.preventDefault();
  handleViewMeal(meal);
};

const sharingMealIds = reactive({});
const pendingWishes = ref([]);
const pendingStorageAvailable = ref(true);
const legacyWishlistServer = ref(false);
const wishStorageKey = (() => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const identity = user.id || user._id || user.username;
    const household = user.householdId?._id || user.householdId || 'unknown';
    return identity ? `eatwhat-pending-meal-wishes:${identity}:${household}` : '';
  } catch (_) { return ''; }
})();
useDraftGuard({ dirty: computed(() => false), busy: archiveBusy, uncertain: computed(() => !!archiveProblem.value || (pendingWishes.value.length > 0 && !pendingStorageAvailable.value)), label: '菜品操作' });
const persistPendingWishes = () => {
  try {
    if (!wishStorageKey) throw new Error('用户标识不可用');
    sessionStorage.setItem(wishStorageKey, JSON.stringify(pendingWishes.value.map(({ id, name }) => ({ id, name }))));
    pendingStorageAvailable.value = true;
  } catch (_) { pendingStorageAvailable.value = false; }
};
const hasPendingWish = (id) => pendingWishes.value.some(item => item.id === String(id));
const removePendingWish = (id) => {
  pendingWishes.value = pendingWishes.value.filter(item => item.id !== String(id));
  persistPendingWishes();
};
const getOpenWishes = async () => {
  const result = await api.wishlist.list({ status: 'open', includeCapabilities: 'true' });
  if (Array.isArray(result)) return { items: result, mode: 'legacy' };
  if (!Array.isArray(result?.items) || typeof result.supportsAtomicMealWish !== 'boolean') throw new Error('清单响应不完整');
  return { items: result.items, mode: result.supportsAtomicMealWish ? 'atomic' : 'unavailable' };
};
const wishMatchesMeal = (item, id) => String(item.mealId?._id || item.mealId?.id || item.mealId || '') === String(id);
const handleShareMeal = async (meal) => {
  const id = String(meal?._id || meal?.id || '');
  if (!id || sharingMealIds[id] || hasPendingWish(id)) return;
  sharingMealIds[id] = true;
  let existing;
  try {
    existing = await getOpenWishes();
    if (existing.items.some(item => wishMatchesMeal(item, id))) {
      ElMessage.info('这道菜已经在想吃清单中');
      delete sharingMealIds[id];
      return;
    }
    if (existing.mode === 'unavailable') {
      ElMessage.warning('服务器尚未启用安全点菜，本次没有提交');
      delete sharingMealIds[id];
      return;
    }
    if (existing.mode === 'legacy') legacyWishlistServer.value = true;
  } catch (_) {
    ElMessage.warning('无法核对想吃清单，本次没有提交');
    delete sharingMealIds[id];
    return;
  }
  pendingWishes.value.push({ id, name: String(meal.name || '这道菜'), reviewed: false, reviewing: false });
  persistPendingWishes();
  try {
    const result = existing.mode === 'atomic'
      ? await api.wishlist.createMealWish(id)
      : await api.wishlist.create({ title: meal.name, mealId: id, category: meal.category || '', priority: 'normal' });
    const created = existing.mode === 'atomic' ? result?.item : result;
    if (!created?._id && !created?.id) throw new Error('保存响应不完整');
    removePendingWish(id);
    if (result?.alreadyExists) ElMessage.info('这道菜已经在想吃清单中');
    else ElMessage.success(`「${meal.name}」已加入小家的想吃清单`);
  } catch (_) {
    ElMessage.warning(`「${meal.name}」加入结果未确认，请先核对想吃清单`);
  } finally {
    delete sharingMealIds[id];
  }
};

const reviewPendingWish = async (item) => {
  if (item.reviewing || sharingMealIds[item.id]) return;
  item.reviewing = true;
  item.reviewed = false;
  try {
    const result = await getOpenWishes();
    if (result.items.some(wish => wishMatchesMeal(wish, item.id))) {
      removePendingWish(item.id);
      ElMessage.success(`已在想吃清单中找到「${item.name}」`);
    } else {
      item.reviewed = true;
    }
  } catch (_) { ElMessage.warning('清单读取失败，请稍后重新核对'); }
  finally { item.reviewing = false; }
};

const allowWishRetry = async (item) => {
  if (!item.reviewed || item.reviewing || item.deciding || sharingMealIds[item.id]) return;
  item.deciding = true;
  try {
    await ElMessageBox.confirm('清单暂未显示这道菜，但之前的请求仍可能稍后完成；重新提交可能产生重复记录。', '确认允许重试？', {
      type: 'warning', confirmButtonText: '已了解，允许重试', cancelButtonText: '继续等待'
    });
    removePendingWish(item.id);
  } catch (_) { /* Keep the pending record until the user confirms. */ }
  finally { item.deciding = false; }
};

const handleImageIssue = async (meal) => {
  const mealId = meal._id || meal.id;
  await syncCatalogUrl();
  if (route.name !== 'meals') return;
  return router.push({ name: 'MealDetail', params: { id: mealId }, query: { ...buildCatalogQuery(catalogState()), report: '1' } });
};

// 归档而不删除，保留排餐、回忆和图片引用。
const handleDeleteMeal = async (meal) => {
  if (archiveBusy.value || archiveProblem.value || loading.value) return;
  if (!canArchive(meal) || meal.archived === true) return ElMessage.warning('服务器未提供安全归档能力，请稍后重试');
  const id = String(meal._id || meal.id || '');
  if (!id) return;
  archiveActionId.value = id;
  try {
    await ElMessageBox.confirm(
      `将「${meal.name}」移入回收站？它会从菜谱和新推荐中隐藏，但历史排餐、回忆和图片会保留，可随时恢复。`,
      '移入回收站',
      {
        confirmButtonText: '确认移入',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );
    const result = await api.meal.setArchived(id, true, meal.archiveVersion);
    if (String(result?._id || result?.id || '') !== id || result?.archived !== true || !canArchive(result)) throw new Error('归档响应不完整');
    ElMessage.success('已移入回收站，可随时恢复');
    await fetchMeals();
    await Promise.allSettled([loadCategories(), mealStore.fetchMealTags()]);
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') archiveProblem.value = { id, name: meal.name, target: true, conflict: error?.code === 'MEAL_ARCHIVE_CONFLICT', checked: false, state: null, error: '' };
  } finally { archiveActionId.value = ''; }
};

const loadArchived = async () => {
  if (!archiveDialog.value || !archiveSupported.value) return;
  const sequence = ++archiveSequence;
  const requestedPage = archivePage.value;
  archiveLoading.value = true; archiveError.value = '';
  try {
    const params = { archived: 'true', page: requestedPage, limit: archiveLimit };
    if (archiveSearch.value.trim()) params.search = archiveSearch.value.trim();
    const result = await api.meal.getAllMeals(params);
    if (sequence !== archiveSequence || !archiveDialog.value) return;
    if (!Array.isArray(result.data) || !Number.isSafeInteger(result.total) || result.total < 0 || result.page !== requestedPage || result.limit !== archiveLimit || result.data.some(row => !row || !canArchive(row) || row.archived !== true || !(row._id || row.id) || typeof row.name !== 'string')) throw new Error('回收站数据不完整');
    const last = Math.max(1, Math.ceil(result.total / archiveLimit));
    if (requestedPage > last) { archivePage.value = last; return loadArchived(); }
    if (result.data.length !== Math.min(archiveLimit, Math.max(0, result.total - (requestedPage - 1) * archiveLimit))) throw new Error('回收站分页数据不完整');
    archiveRows.value = result.data; archiveTotal.value = result.total;
  } catch (e) { if (sequence === archiveSequence && archiveDialog.value) { archiveRows.value = []; archiveTotal.value = 0; archiveError.value = e?.error || e?.message || '回收站加载失败'; } }
  finally { if (sequence === archiveSequence) archiveLoading.value = false; }
};
const openArchive = async () => {
  if (archiveBusy.value || archiveProblem.value) return;
  archiveDialog.value = true; archiveSupported.value = false; archiveLoading.value = true; archiveError.value = ''; archiveRows.value = []; archiveTotal.value = 0; archivePage.value = 1; archiveSearch.value = '';
  const sequence = ++archiveSequence;
  try {
    const capability = await api.meal.archiveCapabilities();
    if (sequence !== archiveSequence || !archiveDialog.value) return;
    if (capability?.supportsMealArchive !== true) throw new Error('服务器未提供安全回收站能力');
    archiveSupported.value = true;
    await loadArchived();
  } catch (e) { if (sequence === archiveSequence && archiveDialog.value) archiveError.value = e?.message || '无法确认服务器是否支持安全回收站，请检查服务或稍后重试'; }
  finally { if (sequence === archiveSequence) archiveLoading.value = false; }
};
const restoreMeal = async meal => {
  if (archiveBusy.value || archiveProblem.value || archiveLoading.value || !canArchive(meal) || meal.archived !== true) return;
  const id = String(meal._id || meal.id || ''); if (!id) return;
  archiveActionId.value = id;
  try {
    const result = await api.meal.setArchived(id, false, meal.archiveVersion);
    if (String(result?._id || result?.id || '') !== id || result?.archived !== false || !canArchive(result)) throw new Error('恢复响应不完整');
    ElMessage.success('菜品已恢复');
    await Promise.all([loadArchived(), fetchMeals()]);
    await Promise.allSettled([loadCategories(), mealStore.fetchMealTags()]);
  } catch (error) {
    archiveDialog.value = false;
    archiveProblem.value = { id, name: meal.name, target: false, conflict: error?.code === 'MEAL_ARCHIVE_CONFLICT', checked: false, state: null, error: '' };
  } finally { archiveActionId.value = ''; }
};
const checkArchiveProblem = async () => {
  const issue = archiveProblem.value; if (!issue || archiveChecking.value) return;
  archiveChecking.value = true; issue.checked = false; issue.error = '';
  try {
    const item = await api.meal.getMealById(issue.id);
    if (archiveProblem.value !== issue) return;
    if (String(item?._id || item?.id || '') !== issue.id || !canArchive(item) || typeof item.archived !== 'boolean') throw new Error('菜品状态或版本不完整');
    issue.state = item.archived; issue.checked = true;
  } catch (e) {
    if (archiveProblem.value === issue) {
      if (e?.code === 'MEAL_NOT_FOUND') { issue.state = 'missing'; issue.checked = true; }
      else issue.error = e?.error || e?.message || '无法读取最新菜品状态';
    }
  }
  finally { archiveChecking.value = false; }
};
const finishArchiveReview = async () => {
  const issue = archiveProblem.value; if (!issue?.checked || archiveChecking.value) return;
  try { await ElMessageBox.confirm('先前请求仍可能稍后完成。确认已核对当前状态并继续？', '结束核对？', { type: 'warning', confirmButtonText: '已核对，继续', cancelButtonText: '继续核对' }); } catch (_) { return; }
  if (archiveProblem.value !== issue) return;
  archiveProblem.value = null;
  await fetchMeals();
  await Promise.allSettled([loadCategories(), loadTags()]);
};

// 添加菜品
const handleAddMeal = async () => {
  await newMealFormRef.value?.validate(async (valid) => {
    if (!valid) return;

    try {
      isSubmitting.value = true;

      // 使用 FormData 携带文本与图片
      const fd = new FormData();
      fd.append('name', newMealForm.name);
      fd.append('description', newMealForm.description || '');
      fd.append('tags', JSON.stringify(newMealForm.tags || []));
      if (imageFileToUpload.value?.raw) {
        fd.append('image', imageFileToUpload.value.raw);
      }

      await mealStore.createMeal(fd);

      ElMessage.success('添加成功');
      addMealDialogVisible.value = false;

      // 重置表单
      newMealForm.name = '';
      newMealForm.description = '';
      newMealForm.tags = [];
      newMealImagePreviewUrl.value = '';
      imageFileToUpload.value = null;

      // 重新获取菜品列表
      await fetchMeals();
      await loadCategories();
    } catch (error) {
      ElMessage.error('添加失败');
    } finally {
      isSubmitting.value = false;
    }
  });
};

// 处理图片上传
const handleImageChange = (file) => {
  imageFileToUpload.value = file;
  newMealImagePreviewUrl.value = URL.createObjectURL(file.raw);
};

// 清除筛选
const clearFilters = async () => {
  searchQuery.value = '';
  selectedTag.value = '';
  selectedCategory.value = '';
  uncategorized.value = false;
  selectedSubcategory.value = '';
  selectedDifficulty.value = '';
  favoriteOnly.value = false;
  showAdvancedFilters.value = false;
  currentPage.value = 1;
  await nextTick();
  searchInput.value?.focus();
};

// 分页变化
const handlePageChange = (page) => {
  restoreCatalogFocus = restoreCatalogFocus || !!document.activeElement?.closest?.('.pagination-container, .mobile-pagination');
  currentPage.value = page;
  scheduleFetch(0);
  void syncCatalogUrl();
};

let fetchTimer = null;
const scheduleFetch = (delay = 160) => {
  fetchSequence++;
  loading.value = true;
  loadError.value = '';
  if (fetchTimer) clearTimeout(fetchTimer);
  fetchTimer = setTimeout(() => {
    fetchMeals();
  }, delay);
};

// 监听筛选条件变化，重置分页
watch([searchQuery, selectedTag, selectedCategory, uncategorized, selectedSubcategory, selectedDifficulty, favoriteOnly], () => {
  if (applyingCatalogRoute) return;
  currentPage.value = 1;
  scheduleFetch();
  scheduleCatalogUrl();
}, { flush: 'sync' });

watch(selectedCategory, () => {
  if (applyingCatalogRoute) return;
  if (selectedCategory.value) uncategorized.value = false;
  selectedSubcategory.value = '';
}, { flush: 'sync' });

watch(currentView, () => {
  if (applyingCatalogRoute) return;
  void syncCatalogUrl();
}, { flush: 'sync' });
watch(() => route.fullPath, () => {
  if (route.name !== 'meals' || internalCatalogUrls.has(catalogKey(route.query))) return;
  const next = readCatalogQuery(route.query);
  if (JSON.stringify(next) === JSON.stringify(catalogState())) return;
  if (catalogUrlTimer) { clearTimeout(catalogUrlTimer); catalogUrlTimer = null; }
  applyingCatalogRoute = true;
  searchQuery.value = next.search; selectedCategory.value = next.category; uncategorized.value = next.uncategorized; selectedSubcategory.value = next.subcategory; selectedTag.value = next.tag; selectedDifficulty.value = next.difficulty; favoriteOnly.value = next.favorite; currentPage.value = next.page; currentView.value = next.view;
  showAdvancedFilters.value = !!(next.tag || next.subcategory || next.difficulty);
  applyingCatalogRoute = false;
  scheduleFetch(0);
}, { flush: 'sync' });
watch(archiveSearch, () => {
  if (!archiveDialog.value || !archiveSupported.value) return;
  archivePage.value = 1; archiveSequence++; archiveLoading.value = true;
  if (archiveTimer) clearTimeout(archiveTimer);
  archiveTimer = setTimeout(loadArchived, 180);
});
watch(archiveDialog, visible => {
  if (visible) return;
  archiveSequence++; archiveLoading.value = false;
  if (archiveTimer) clearTimeout(archiveTimer);
});

const loadCategories = async () => {
  if (categoryLoading.value) return;
  const wasRetry = document.activeElement === categoryRetryButton.value;
  const wasRefresh = document.activeElement === categoryRefreshButton.value;
  categoryLoading.value = true;
  try {
    await mealStore.fetchMealCategories();
    categoryReady.value = true;
    categoryLoadFailed.value = false;
  } catch (_) {
    categoryLoadFailed.value = true;
  } finally {
    categoryLoading.value = false;
    if (wasRetry || wasRefresh) {
      await nextTick();
      if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) (categoryLoadFailed.value ? categoryRetryButton.value : wasRefresh ? categoryRefreshButton.value : filterToggleButton.value?.$el)?.focus();
    }
  }
};
const loadTags = async () => {
  if (tagLoading.value) return;
  const restoreFocus = document.activeElement === tagRetryButton.value;
  tagLoading.value = true;
  try { await mealStore.fetchMealTags(); tagLoadFailed.value = false; }
  catch (_) { tagLoadFailed.value = true; }
  finally {
    tagLoading.value = false;
    if (restoreFocus) {
      await nextTick();
      if (!document.activeElement || document.activeElement === document.body || !document.activeElement.isConnected) (tagLoadFailed.value ? tagRetryButton.value : filterToggleButton.value?.$el)?.focus();
    }
  }
};

onMounted(async () => {
  try {
    const saved = wishStorageKey ? JSON.parse(sessionStorage.getItem(wishStorageKey) || '[]') : [];
    if (Array.isArray(saved)) pendingWishes.value = saved.filter(item => typeof item?.id === 'string' && typeof item?.name === 'string').map(item => ({ id: item.id, name: item.name, reviewed: false, reviewing: false }));
  } catch (_) { /* Storage is optional; keep the page usable. */ }
  await fetchMeals();
  await loadCategories();
  await loadTags();
});
onBeforeUnmount(() => {
  fetchSequence++;
  archiveSequence++;
  if (fetchTimer) clearTimeout(fetchTimer);
  if (catalogUrlTimer) clearTimeout(catalogUrlTimer);
  if (archiveTimer) clearTimeout(archiveTimer);
  if (newMealImagePreviewUrl.value) URL.revokeObjectURL(newMealImagePreviewUrl.value);
});
</script>

<template>
  <div class="meal-page">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <div>
          <h1 class="page-title">菜品管理</h1>
          <p class="page-subtitle">属于小家的菜谱手账，收藏每一顿日常的好味道</p>
        </div>
        <div class="header-actions">
          <el-button :disabled="archiveBusy || !!archiveProblem" @click="openArchive">菜品回收站</el-button>
          <el-button
            type="primary"
            @click="router.push({ name: 'MealEditor', query: buildCatalogQuery(catalogState()) })"
            class="add-meal-btn"
          >
        <el-icon><Plus /></el-icon>
            <span class="btn-text">添加菜品</span>
      </el-button>
        </div>
      </div>
    </div>

    <el-alert v-if="archiveProblem" type="warning" :closable="false" show-icon class="wish-recovery" :title="archiveProblem.conflict ? `「${archiveProblem.name}」已变化，本次操作未执行。` : `「${archiveProblem.name}」的操作结果未确认。`">
      <p>请先核对当前菜品状态；先前请求仍可能稍后完成。</p><el-button link type="primary" :loading="archiveChecking" @click="checkArchiveProblem">读取最新状态</el-button><p v-if="archiveProblem.error">{{ archiveProblem.error }}</p><template v-if="archiveProblem.checked"><p>当前状态：{{ archiveProblem.state === 'missing' ? '未找到菜品，可能已被删除或不属于当前家庭' : archiveProblem.state ? '已在回收站' : '仍在菜谱中' }}。</p><el-button link type="primary" @click="finishArchiveReview">已核对，继续</el-button></template>
    </el-alert>
    <el-alert v-if="!loading && !loadError && displayedMeals.some(meal => !canArchive(meal))" type="info" :closable="false" show-icon title="服务器未提供安全回收站能力，暂不能移除部分菜品。" />

    <div class="couple-presence-card">
      <div class="presence-avatars" aria-hidden="true">
        <span>我</span>
        <span>TA</span>
      </div>
      <div class="presence-copy">
        <strong>把好味道留给家人</strong>
        <p>在菜品卡片选择“加入想吃”，家人可以一起查看和安排。</p>
      </div>
      <el-button type="primary" class="feed-inspiration-btn" @click="router.push({ name: 'wishlist' })">
        <el-icon><Present /></el-icon>
        查看想吃清单
      </el-button>
    </div>

    <el-alert v-if="legacyWishlistServer" type="info" :closable="false" show-icon class="wish-recovery" title="当前服务器为旧版本">
      多个设备同时添加同一道菜时仍可能出现重复；升级并启用服务端安全点菜后可避免。
    </el-alert>
    <el-alert v-for="item in pendingWishes" :key="item.id" type="warning" :closable="false" show-icon class="wish-recovery" :title="`「${item.name}」${sharingMealIds[item.id] ? '正在添加' : '加入结果未确认'}`">
      <p v-if="sharingMealIds[item.id]">正在提交，请稍候。</p>
      <p v-else>请先核对想吃清单。原请求可能仍在处理，立即重试可能产生重复记录。<span v-if="!pendingStorageAvailable">当前浏览器无法暂存此提示，离开页面后提示可能丢失。</span></p>
      <div class="wish-recovery-actions">
        <el-button link type="primary" :loading="item.reviewing" :disabled="!!sharingMealIds[item.id]" @click="reviewPendingWish(item)">刷新并核对</el-button>
        <el-button link type="primary" @click="router.push({ name: 'wishlist' })">查看想吃清单</el-button>
        <el-button v-if="item.reviewed" link type="primary" :disabled="item.deciding" @click="allowWishRetry(item)">已核对，允许重试</el-button>
      </div>
    </el-alert>

    <!-- 搜索和过滤区域 -->
    <div class="filter-section">
      <div class="filter-row">
        <div class="search-box">
          <el-input
            ref="searchInput"
            v-model="searchQuery"
            placeholder="搜索菜名、描述、食材或做法..."
            aria-label="搜索菜品"
            aria-describedby="catalog-search-hint"
            maxlength="200"
            show-word-limit
            clearable
            class="search-input"
            :prefix-icon="Search"
          />
          <p id="catalog-search-hint" class="search-hint">可搜索菜名、食材或做法，最多 200 字。</p>
        </div>
      </div>

      <div class="toolbar-row">
        <div class="view-toggle">
          <el-radio-group v-model="currentView" size="small" class="view-switcher" aria-label="菜品显示方式">
            <el-radio-button value="grid" aria-label="网格视图" title="网格视图">
              <el-icon><Grid /></el-icon>
              <span class="view-label">网格</span>
            </el-radio-button>
            <el-radio-button value="list" aria-label="列表视图" title="列表视图">
              <el-icon><List /></el-icon>
              <span class="view-label">列表</span>
            </el-radio-button>
            <el-radio-button value="table" aria-label="表格视图" title="表格视图">
              <el-icon><Document /></el-icon>
              <span class="view-label">表格</span>
            </el-radio-button>
            <el-radio-button value="grouped" aria-label="分组视图" title="分组视图">
              <el-icon><Menu /></el-icon>
              <span class="view-label">分组</span>
            </el-radio-button>
          </el-radio-group>
        </div>

        <div class="toolbar-actions">
          <el-button ref="filterToggleButton" size="small" :aria-expanded="showAdvancedFilters" aria-controls="catalog-advanced-filters" @click="showAdvancedFilters = !showAdvancedFilters">
            <el-icon><Filter /></el-icon>
            筛选
          </el-button>
          <el-button v-if="hasActiveFilters" type="info" size="small" @click="clearFilters" class="clear-filters-btn">
            清除
          </el-button>
        </div>
      </div>

      <el-collapse-transition>
        <div id="catalog-advanced-filters" v-show="showAdvancedFilters" class="advanced-filters">
          <div class="filter-item">
            <span class="filter-field-label" aria-hidden="true">标签</span>
            <el-select v-model="selectedTag" aria-label="标签" placeholder="选择标签" clearable class="tag-select">
              <el-option
                v-for="tag in allTags"
                :key="tag"
                :label="tag"
                :value="tag"
              />
            </el-select>
          </div>

          <div class="filter-item">
            <span class="filter-field-label" aria-hidden="true">分类</span>
            <el-select v-model="categorySelection" value-key="kind" aria-label="分类" placeholder="选择分类" clearable class="tag-select">
              <el-option label="未填写分类" :value="uncategorizedChoice" />
              <el-option
                v-for="c in categoryOptions"
                :key="c"
                :label="c === '未填写分类' ? '分类：未填写分类' : c"
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
              class="tag-select"
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
            <span class="filter-field-label" aria-hidden="true">难度</span>
            <el-select v-model="selectedDifficulty" aria-label="难度" placeholder="选择难度" clearable class="tag-select">
              <el-option label="简单" value="easy" />
              <el-option label="中等" value="medium" />
              <el-option label="进阶" value="hard" />
            </el-select>
          </div>

          <div class="filter-item favorite-filter">
            <el-checkbox v-model="favoriteOnly">只看收藏</el-checkbox>
          </div>
        </div>
      </el-collapse-transition>
      <div v-if="activeFilters.length" ref="activeFilterContainer" class="active-filters" role="group" aria-label="当前筛选条件">
        <span class="active-filters-label">当前筛选</span>
        <button v-for="filter in activeFilters" :key="filter.key" type="button" class="active-filter-chip" :aria-label="`移除${filter.label}筛选`" @click="removeActiveFilter(filter.key)"><span>{{ filter.label }}</span><span aria-hidden="true">×</span></button>
      </div>
      <div v-if="tagLoadFailed" class="tag-error" role="status">标签可能不完整，当前仅显示已加载的数据。<button ref="tagRetryButton" type="button" :disabled="tagLoading" @click="loadTags">{{ tagLoading ? '正在重试' : '重试标签' }}</button></div>
      <div v-if="!loading && !loadError" class="results-summary" aria-live="polite">{{ hasActiveFilters ? '筛选结果' : '全部菜品' }} · {{ totalMeals }} 道<span v-if="currentView === 'grouped'"> · 按当前页分组</span></div>
        </div>

    <div class="catalog-layout">
      <aside ref="categorySidebar" class="category-sidebar" aria-label="菜品分类">
        <div class="category-heading">菜品分类</div>
        <nav class="category-list" aria-label="选择菜品分类">
          <button type="button" data-sidebar-kind="all" :class="{ active: !selectedCategory && !uncategorized && !favoriteOnly }" :aria-pressed="!selectedCategory && !uncategorized && !favoriteOnly" @click="selectedCategory = ''; uncategorized = false; favoriteOnly = false">全部分类</button>
          <button type="button" data-sidebar-kind="favorite" :class="{ active: favoriteOnly }" :aria-pressed="favoriteOnly" @click="selectedCategory = ''; uncategorized = false; favoriteOnly = !favoriteOnly">我的收藏</button>
          <button type="button" data-sidebar-kind="uncategorized" :class="{ active: uncategorized }" :aria-pressed="uncategorized" aria-label="未填写分类" :aria-description="categoryCounts ? `分类总数 ${categoryCounts.get('') || 0} 道` : undefined" @click="selectedCategory = ''; uncategorized = true; favoriteOnly = false"><span>未填写分类</span><small v-if="categoryCounts" aria-hidden="true">{{ categoryCounts.get('') || 0 }}</small></button>
          <button v-for="category in categoryOptions" :key="category" type="button" data-sidebar-kind="category" :data-category="category" :class="{ active: selectedCategory === category }" :aria-pressed="selectedCategory === category" :aria-label="category === '未填写分类' ? '分类：未填写分类' : category" :aria-description="categoryCounts && categoryCounts.has(category) ? `分类总数 ${categoryCounts.get(category)} 道` : undefined" @click="uncategorized = false; favoriteOnly = false; selectedCategory = category"><span>{{ category === '未填写分类' ? '分类：未填写分类' : category }}</span><small v-if="categoryCounts && categoryCounts.has(category)" aria-hidden="true">{{ categoryCounts.get(category) }}</small></button>
        </nav>
        <p v-if="categoryCounts" class="category-count-note">数字为上次更新时的分类总数，不随搜索和筛选变化。</p>
        <button v-if="!categoryLoadFailed" ref="categoryRefreshButton" class="category-refresh" type="button" :disabled="categoryLoading" @click="loadCategories">{{ categoryLoading ? '正在更新' : '更新分类' }}</button>
        <div v-if="categoryLoadFailed" class="category-error" role="status">分类可能不完整<button ref="categoryRetryButton" type="button" :disabled="categoryLoading" @click="loadCategories">{{ categoryLoading ? '正在重试' : '重试' }}</button></div>
      </aside>
      <section ref="catalogContent" class="catalog-content" aria-label="菜品列表" tabindex="-1">
    <!-- 加载状态 -->
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`无法加载菜品：${loadError}`"><el-button link type="primary" @click="fetchMeals">重新加载</el-button></el-alert>
    <div v-else-if="loading" class="loading-container" role="status" aria-live="polite">
      <span>正在加载菜品…</span>
      <el-skeleton :rows="3" animated />
    </div>

    <!-- 菜品列表 -->
    <div v-else-if="displayedMeals.length > 0" class="meals-container">
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
                  <MealCard
                    v-for="meal in sub.meals"
                    :key="meal._id || meal.id"
                    :data-catalog-id="meal._id || meal.id"
                    :meal="meal"
                    :archive-disabled="archiveBusy || !!archiveProblem || !canArchive(meal)"
                    :share-pending="!!sharingMealIds[String(meal._id || meal.id)]"
                    :share-uncertain="hasPendingWish(meal._id || meal.id)"
                    @view="handleViewMeal"
                    @edit="handleEditMeal"
                    @delete="handleDeleteMeal"
                    @share="handleShareMeal"
                    @image-issue="handleImageIssue"
                  />
                </div>
              </el-collapse-item>
            </el-collapse>
          </el-collapse-item>
        </el-collapse>
      </div>

      <!-- 网格布局 -->
      <div v-else-if="currentView === 'grid'" class="meals-grid">
        <MealCard
          v-for="meal in displayedMeals"
          :key="meal._id || meal.id"
          :data-catalog-id="meal._id || meal.id"
          :meal="meal"
          :archive-disabled="archiveBusy || !!archiveProblem || !canArchive(meal)"
          :share-pending="!!sharingMealIds[String(meal._id || meal.id)]"
          :share-uncertain="hasPendingWish(meal._id || meal.id)"
          @view="handleViewMeal"
          @edit="handleEditMeal"
          @delete="handleDeleteMeal"
          @share="handleShareMeal"
          @image-issue="handleImageIssue"
        />
      </div>

      <!-- 列表布局 -->
      <div v-else-if="currentView === 'list'" class="meals-list">
        <div
          v-for="meal in displayedMeals"
          :key="meal._id || meal.id"
          class="meal-list-item"
          :data-catalog-id="meal._id || meal.id"
          role="button"
          tabindex="0"
          :aria-label="`查看${meal.name}`"
          @click="handleViewMeal(meal)"
          @keydown="handleMealKeydown($event, meal)"
        >
          <div class="meal-list-image">
            <img
              :key="getMealImage(meal)"
              :src="getMealImage(meal)"
              :alt="meal.name"
              @error="handleImageError"
            />
          </div>

          <div class="meal-list-info">
            <div class="meal-list-header">
              <h3 class="meal-list-name">{{ meal.name }}</h3>
              <div class="meal-list-actions">
                <el-button
                  type="info"
                  size="small"
                  circle
                  :aria-label="`查看${meal.name}`"
                  @click.stop="handleViewMeal(meal)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  circle
                  :aria-label="`加入想吃清单：${meal.name}`"
                  :loading="!!sharingMealIds[String(meal._id || meal.id)]"
                  :disabled="!!sharingMealIds[String(meal._id || meal.id)] || hasPendingWish(meal._id || meal.id)"
                  class="list-feed-btn"
                  @click.stop="handleShareMeal(meal)"
                >
                  <el-icon><Present /></el-icon>
                </el-button>
                <el-button
                  type="warning"
                  size="small"
                  circle
                  :aria-label="`在详情反馈${meal.name}图片问题`"
                  title="在详情中反馈图片问题"
                  @click.stop="handleImageIssue(meal)"
                >
                  <el-icon><Warning /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  circle
                  :aria-label="`编辑${meal.name}`"
                  @click.stop="handleEditMeal(meal)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  :aria-label="`移入回收站：${meal.name}`"
                  :disabled="archiveBusy || !!archiveProblem || !canArchive(meal)"
                  @click.stop="handleDeleteMeal(meal)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>

            <p v-if="meal.description" class="meal-list-description">
              {{ meal.description }}
            </p>

            <div class="meal-list-meta">
              <div v-if="meal.tags && meal.tags.length > 0" class="meal-list-tags">
          <el-tag
                  v-for="tag in meal.tags.slice(0, 3)"
            :key="tag"
                  size="small"
            effect="light"
                  class="meal-tag"
          >
            {{ tag }}
          </el-tag>
                <span v-if="meal.tags.length > 3" class="more-tags">
                  +{{ meal.tags.length - 3 }}
                </span>
        </div>

              <div v-if="meal.ingredients && meal.ingredients.length > 0" class="meal-list-ingredients">
                <span class="ingredients-count">
                  {{ meal.ingredients.length }} 种食材
                </span>
      </div>
    </div>
          </div>
        </div>
          </div>

      <!-- 表格布局 -->
      <div v-else-if="currentView === 'table'" class="meals-table">
        <el-table
          :data="displayedMeals"
          style="width: 100%"
          class="meals-table-content"
        >
          <el-table-column label="图片" width="160" align="center">
            <template #default="{ row }">
              <div class="table-image">
                <img
                  :key="getMealImage(row)"
                  :src="getMealImage(row)"
                  :alt="row.name"
                  @error="handleImageError"
              />
            </div>
            </template>
          </el-table-column>

          <el-table-column prop="name" label="菜品名称" min-width="120">
            <template #default="{ row }">
              <div class="table-name">{{ row.name }}</div>
            </template>
          </el-table-column>

          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="{ row }">
              <div class="table-description">
                {{ row.description || '暂无描述' }}
          </div>
            </template>
          </el-table-column>

          <el-table-column label="标签" min-width="150">
            <template #default="{ row }">
              <div class="table-tags">
                <el-tag
                  v-for="tag in (row.tags || []).slice(0, 2)"
                  :key="tag"
                  size="small"
                  effect="light"
                  class="table-tag"
                >
                  {{ tag }}
                </el-tag>
                <span v-if="row.tags && row.tags.length > 2" class="more-tags">
                  +{{ row.tags.length - 2 }}
                </span>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="食材" min-width="120">
            <template #default="{ row }">
              <div class="table-ingredients">
                {{ row.ingredients && row.ingredients.length > 0 ? `${row.ingredients.length} 种` : '无' }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="操作" width="280" align="center">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button type="warning" size="small" circle :aria-label="`加入想吃清单：${row.name}`" :loading="!!sharingMealIds[String(row._id || row.id)]" :disabled="!!sharingMealIds[String(row._id || row.id)] || hasPendingWish(row._id || row.id)" @click="handleShareMeal(row)"><el-icon><Present /></el-icon></el-button>
                <el-button type="warning" size="small" circle :aria-label="`在详情反馈${row.name}图片问题`" title="在详情中反馈图片问题" @click="handleImageIssue(row)"><el-icon><Warning /></el-icon></el-button>
                <el-button
                  type="info"
                  size="small"
                  circle
                  :data-catalog-id="row._id || row.id"
                  :aria-label="`查看${row.name}`"
                  @click="handleViewMeal(row)"
                >
                  <el-icon><View /></el-icon>
                </el-button>
                <el-button
                  type="primary"
                  size="small"
                  circle
                  :aria-label="`编辑${row.name}`"
                  @click="handleEditMeal(row)"
                >
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button
                  type="danger"
                  size="small"
                  circle
                  :aria-label="`移入回收站：${row.name}`"
                  :disabled="archiveBusy || !!archiveProblem || !canArchive(row)"
                  @click="handleDeleteMeal(row)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页器 (仅桌面端) -->
      <div v-if="Math.ceil(totalMeals / pageSize) > 1" class="pagination-container desktop-only">
            <el-pagination
              v-model:current-page="currentPage"
          :page-size="pageSize"
          :total="totalMeals"
          layout="prev, pager, next, jumper"
              @current-change="handlePageChange"
            />
          </div>
      <div v-if="Math.ceil(totalMeals / pageSize) > 1" class="mobile-pagination mobile-only" aria-label="菜品分页">
        <el-button :disabled="currentPage <= 1" @click="handlePageChange(currentPage - 1)">上一页</el-button>
        <span>第 {{ currentPage }} / {{ Math.ceil(totalMeals / pageSize) }} 页</span>
        <el-button :disabled="currentPage >= Math.ceil(totalMeals / pageSize)" @click="handlePageChange(currentPage + 1)">下一页</el-button>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-content">
        <el-icon class="empty-icon"><Food /></el-icon>
        <h3>{{ hasActiveFilters ? '没有找到匹配的菜品' : '暂无菜品' }}</h3>
        <p>{{ hasActiveFilters ? '试试调整关键词或清除筛选。' : '开始添加你的第一个菜品吧！' }}</p>
        <el-button v-if="hasActiveFilters" @click="clearFilters">清除筛选</el-button>
        <el-button
          v-else
          type="primary"
          @click="router.push({ name: 'MealEditor', query: buildCatalogQuery(catalogState()) })"
          class="empty-action-btn"
        >
          <el-icon><Plus /></el-icon>
          添加菜品
        </el-button>
      </div>
    </div>
      </section>
    </div>

    <!-- 添加菜品对话框 -->
    <el-dialog
      v-model="addMealDialogVisible"
      title="添加菜品"
      width="90%"
      :max-width="600"
      center
      class="add-meal-dialog"
    >
      <el-form
        ref="newMealFormRef"
        :model="newMealForm"
        :rules="newMealRules"
        label-width="80px"
        class="add-meal-form"
      >
        <el-form-item label="菜品名称" prop="name">
          <el-input
            v-model="newMealForm.name"
            placeholder="请输入菜品名称"
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="newMealForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入菜品描述"
            class="form-input"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="newMealForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="选择或创建标签"
            class="form-input"
          >
            <el-option
              v-for="tag in allTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="图片">
          <el-upload
            class="image-upload"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleImageChange"
            accept="image/*"
          >
            <div class="upload-area">
              <el-icon v-if="!newMealImagePreviewUrl" class="upload-icon"><Upload /></el-icon>
              <img
                v-else
                :src="newMealImagePreviewUrl"
                class="image-preview"
                alt="预览图"
              />
              <div class="upload-text">
                {{ newMealImagePreviewUrl ? '点击更换图片' : '点击上传图片' }}
              </div>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addMealDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleAddMeal"
            :loading="isSubmitting"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="archiveDialog" title="菜品回收站" width="min(640px, 92vw)" :close-on-click-modal="!archiveBusy" :close-on-press-escape="!archiveBusy" :show-close="!archiveBusy">
      <p class="archive-intro">回收站中的菜品不会出现在菜谱或新推荐里，历史排餐、回忆和图片仍会保留。</p>
      <el-input v-if="archiveSupported" v-model="archiveSearch" clearable aria-label="搜索回收站菜品" placeholder="搜索菜名或食材" />
      <el-alert v-if="archiveError" type="error" :closable="false" show-icon :title="`回收站暂不可用：${archiveError}`"><el-button link type="primary" @click="archiveSupported ? loadArchived() : openArchive()">重试</el-button></el-alert>
      <p v-else-if="archiveLoading" class="archive-intro">正在加载回收站…</p>
      <el-empty v-else-if="archiveSupported && !archiveRows.length" description="回收站里没有符合条件的菜品" />
      <div v-else class="archive-list"><div v-for="meal in archiveRows" :key="meal._id || meal.id" class="archive-row"><img :key="getMealImage(meal)" :src="getMealImage(meal)" :alt="meal.name" @error="handleImageError" /><div><strong>{{ meal.name }}</strong><p>{{ meal.category || '未分类' }}</p></div><el-button type="primary" plain :disabled="archiveBusy || archiveLoading" :aria-label="`恢复${meal.name}`" @click="restoreMeal(meal)">恢复</el-button></div></div>
      <div v-if="archiveSupported && archiveTotal > archiveLimit && !archiveError" class="archive-pagination"><el-button :disabled="archiveLoading || archiveBusy || archivePage <= 1" @click="archivePage--; loadArchived()">上一页</el-button><span>第 {{ archivePage }} / {{ archiveLastPage }} 页</span><el-button :disabled="archiveLoading || archiveBusy || archivePage >= archiveLastPage" @click="archivePage++; loadArchived()">下一页</el-button></div>
      <template #footer><el-button :disabled="archiveBusy" @click="archiveDialog = false">关闭</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.archive-intro { color: var(--text-secondary); line-height: 1.6; }
.archive-list { display: flex; flex-direction: column; gap: 10px; margin-top: 14px; }
.archive-row { display: grid; grid-template-columns: 56px minmax(0, 1fr) auto; align-items: center; gap: 12px; padding: 10px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-secondary); }
.archive-row img { width: 56px; height: 48px; object-fit: cover; border-radius: 10px; }
.archive-row strong { overflow-wrap: anywhere; }
.archive-row p { margin: 4px 0 0; color: var(--text-secondary); font-size: 12px; }
.archive-pagination { display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 14px; color: var(--text-secondary); }
.archive-pagination .el-button + .el-button, .header-actions .el-button + .el-button { margin-left: 0; }
.mobile-pagination { display:none; align-items:center; justify-content:center; gap:12px; margin-top:18px; color:var(--text-secondary); }
@media (max-width:768px) { .mobile-pagination { display:flex; } }
.meal-page {
  min-height: 100vh;
  background: var(--bg-secondary);
  padding: 0;
}

/* 页面标题和操作栏 */
  .page-header {
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  margin: -20px -20px 20px -20px;
  padding: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.header-content {
    display: flex;
    align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

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
}

/* 显示方式切换 */
.view-toggle {
  margin-right: 16px;
}

.view-switcher {
  border-radius: 8px;
  overflow: hidden;
}

.view-switcher .el-radio-button__inner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all 0.3s ease;
  cursor: pointer;
}

.view-switcher .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: var(--primary-color);
  color: white;
  box-shadow: none;
}

.view-label {
  font-size: 14px;
  font-weight: 500;
}

.add-meal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
}

.btn-text {
  display: inline;
}

/* 搜索和过滤区域 */
.filter-section {
  background: var(--bg-primary);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
  box-shadow: 0 2px 8px var(--shadow-color);
    }

.filter-row {
        display: flex;
  gap: 16px;
        align-items: center;
  margin-bottom: 16px;
}

.search-box {
  flex: 1;
  min-width: 0;
}

.search-input {
  width: 100%;
}
.search-hint { margin: 6px 2px 0; color: var(--text-secondary); font-size: 12px; line-height: 1.5; }

.toolbar-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 4px;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.advanced-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.filter-item {
  min-width: 0;
}
.filter-field-label { display: block; margin: 0 0 6px; color: var(--text-primary); font-size: 13px; font-weight: 700; }

.favorite-filter {
  display: flex;
  align-items: end;
  padding-bottom: 4px;
  min-height: 32px;
}

.tag-filter {
  min-width: 200px;
}

.tag-select {
  width: 100%;
}

.mobile-filter-actions {
  display: none;
  justify-content: flex-end;
}

.clear-filters-btn {
          font-size: 14px;
}
.active-filters { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; min-width: 0; }
.active-filters-label { color: var(--text-secondary); font-size: 13px; font-weight: 600; }
.active-filter-chip { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; min-height: 44px; padding: 6px 12px; border: 1px solid var(--border-color); border-radius: 999px; background: var(--bg-secondary); color: var(--text-primary); font: inherit; font-size: 13px; cursor: pointer; }
.active-filter-chip span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.active-filter-chip:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }

/* 加载状态 */
.loading-container {
  background: var(--bg-primary);
  border-radius: 12px;
  padding: 40px;
  margin-bottom: 20px;
}

/* 菜品列表容器 */
.meals-container {
  margin-bottom: 20px;
}

/* 网格布局 */
.meals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

/* 列表布局样式 */
.meals-list {
        display: flex;
  flex-direction: column;
  gap: 16px;
}

.meal-list-item {
  display: flex;
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
  transition: all 0.3s ease;
  cursor: pointer;

          &:hover {
            transform: translateY(-2px);
    box-shadow: 0 4px 16px var(--shadow-color);
  }
}

.meal-list-image {
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  overflow: hidden;
}

.meal-list-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.meal-list-info {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.meal-list-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.meal-list-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

.meal-list-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex-shrink: 0;
}

.meal-list-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
          }

.meal-list-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  }

.meal-list-tags {
  display: flex;
  gap: 6px;
  align-items: center;
}

.meal-tag {
  border-radius: 16px;
  font-size: 12px;
  padding: 4px 8px;
  height: auto;
  line-height: 1.2;
}

.more-tags {
  font-size: 12px;
  color: var(--text-secondary);
  margin-left: 4px;
}

.meal-list-ingredients {
  font-size: 12px;
  color: var(--text-secondary);
}

.ingredients-count {
  background: var(--bg-secondary);
  padding: 4px 8px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
}

/* 表格布局样式 */
.meals-table {
  background: var(--bg-primary);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.meals-table-content {
  --el-table-border-color: var(--border-color);
  --el-table-header-bg-color: var(--bg-secondary);
  --el-table-bg-color: var(--bg-primary);
  --el-table-tr-bg-color: var(--bg-primary);
  --el-table-text-color: var(--text-primary);
}

.table-image {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.table-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.table-name {
  font-weight: 600;
  color: var(--text-primary);
}

.table-description {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
    }

.table-tags {
  display: flex;
  gap: 4px;
  align-items: center;
  flex-wrap: wrap;
}

.table-tag {
  border-radius: 12px;
  font-size: 11px;
  padding: 2px 6px;
  height: auto;
  line-height: 1.2;
  color: #8e4938;
    }

.meal-list-tags .meal-tag { color: #8e4938; }

.table-ingredients {
  color: var(--text-secondary);
  font-size: 14px;
}

.table-actions {
  display: flex;
  gap: 8px;
  justify-content: center;
}

/* 分页器 */
    .pagination-container {
  display: flex;
  justify-content: center;
      margin-top: 30px;
  padding: 20px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

/* 空状态 */
.empty-state {
      display: flex;
  align-items: center;
      justify-content: center;
  min-height: 400px;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 8px var(--shadow-color);
}

.empty-content {
  text-align: center;
  padding: 40px 20px;
}

.empty-icon {
  font-size: 64px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.empty-content h3 {
  font-size: 20px;
  color: var(--text-primary);
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-content p {
  color: var(--text-secondary);
  margin: 0 0 20px 0;
}

.empty-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
}

/* 对话框样式 */
.add-meal-dialog {
  border-radius: 16px;
}

.add-meal-form {
  padding: 20px 0;
}

.form-input {
    width: 100%;
  }

.image-upload {
    width: 100%;
}

.upload-area {
  border: 2px dashed var(--border-color);
    border-radius: 8px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: var(--bg-secondary);

    &:hover {
      border-color: var(--primary-color);
    background: var(--bg-primary);
  }
}

.upload-icon {
  font-size: 48px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  }

  .image-preview {
  width: 120px;
  height: 120px;
      object-fit: cover;
  border-radius: 8px;
  margin-bottom: 16px;
}

.upload-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.dialog-footer {
      display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid var(--border-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    margin: -16px -16px 16px -16px;
    padding: 16px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .page-title {
    font-size: 20px;
    text-align: center;
  }

  .header-actions {
    flex-direction: column;
    gap: 12px;
  }

  .view-toggle {
    margin-right: 0;
    margin-bottom: 8px;
  }

  .toolbar-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    margin-top: 0;
  }

  .toolbar-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .advanced-filters {
    grid-template-columns: 1fr;
  }

  .view-switcher {
    width: 100%;
  }

  .view-switcher .el-radio-button {
    flex: 1;
  }

  .view-switcher .el-radio-button__inner {
      justify-content: center;
    padding: 10px 12px;
  }

  .view-label {
    display: none;
  }

  .add-meal-btn {
    width: 100%;
    justify-content: center;
    }

  .filter-section {
    padding: 16px;
    margin-bottom: 16px;
  }

  .filter-row {
    flex-direction: column;
    gap: 12px;
    margin-bottom: 12px;
  }

  .search-box,
  .tag-filter {
    width: 100%;
    min-width: 0;
  }

  .mobile-filter-actions {
    display: flex;
  }

  .meals-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .meal-list-item {
    flex-direction: column;
  }

  .meal-list-image {
    width: 100%;
    height: 160px;
  }

  .meal-list-info {
    padding: 12px;
  }

  .meal-list-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meal-list-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .meal-list-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .meals-table {
    overflow-x: auto;
  }

  .meals-table-content {
    min-width: 600px;
  }

  .desktop-only {
    display: none;
  }

  .empty-state {
    min-height: 300px;
  }

  .empty-content {
    padding: 30px 16px;
  }

  .empty-icon {
    font-size: 48px;
  }

  .empty-content h3 {
    font-size: 18px;
  }

  .add-meal-dialog {
    width: 95%;
    margin: 10px;
  }

  .add-meal-form {
    padding: 16px 0;
  }

  .upload-area {
    padding: 30px 16px;
  }

  .image-preview {
    width: 100px;
    height: 100px;
  }
}

@media (max-width: 480px) {
  .page-header {
    margin: -12px -12px 12px -12px;
    padding: 12px;
  }

  .filter-section {
    padding: 12px;
    margin-bottom: 12px;
  }

  .filter-row {
    gap: 8px;
  }

  .view-switcher .el-radio-button__inner {
    padding: 8px 8px;
    font-size: 12px;
  }

  .meal-list-image {
    height: 140px;
  }

  .meal-list-info {
    padding: 10px;
    gap: 8px;
  }

  .meal-list-name {
    font-size: 16px;
  }

  .meal-list-description {
    font-size: 13px;
  }

  .empty-state {
    min-height: 250px;
  }

  .empty-content {
    padding: 20px 12px;
  }

  .empty-icon {
    font-size: 40px;
  }

  .add-meal-dialog {
    width: 98%;
    margin: 5px;
  }

  .upload-area {
    padding: 20px 12px;
  }

  .image-preview {
    width: 80px;
    height: 80px;
  }
}

/* 触摸设备优化 */
@media (hover: none) and (pointer: coarse) {
  .meal-list-item:hover {
    transform: none;
  }

  .meal-list-item:active {
    transform: translateY(-1px);
  }

  .view-switcher .el-radio-button__inner {
    min-height: 44px;
  }

  .add-meal-btn,
  .clear-filters-btn,
  .empty-action-btn {
    min-height: 44px;
    padding: 12px 20px;
  }

  .search-input :deep(.el-input__wrapper),
  .tag-select :deep(.el-input__wrapper) {
    min-height: 44px;
    }

  .upload-area {
    min-height: 120px;
  }

  .meal-list-actions .el-button {
    min-height: 44px;
    min-width: 44px;
  }

  .table-actions .el-button {
    min-height: 44px;
    min-width: 44px;
  }
}

/* 暗色模式适配 */
.dark-mode {
  .page-header {
    background: var(--bg-primary);
    border-bottom-color: var(--border-color);
  }

  .filter-section,
  .loading-container,
  .pagination-container,
  .empty-state {
    background: var(--bg-primary);
    box-shadow: 0 2px 8px var(--shadow-color);
  }

  .upload-area {
    background: var(--bg-secondary);
    border-color: var(--border-color);

    &:hover {
      background: var(--bg-primary);
      border-color: var(--primary-color);
    }
  }

  .meals-table-content {
    --el-table-border-color: var(--border-color);
    --el-table-header-bg-color: var(--bg-secondary);
    --el-table-bg-color: var(--bg-primary);
    --el-table-tr-bg-color: var(--bg-primary);
    --el-table-text-color: var(--text-primary);
  }

  .meal-list-item {
    background: var(--bg-primary);
    box-shadow: 0 2px 8px var(--shadow-color);
    }

  .meal-list-item:hover {
    box-shadow: 0 4px 16px var(--shadow-color);
  }
}


/* Cozy cookbook page override */
.meal-page {
  min-height: auto;
  background: transparent;
}

.page-header {
  margin: 0 0 18px;
  padding: 24px;
  border: 1px solid rgba(224, 159, 103, 0.18);
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(253, 251, 247, 0.96), rgba(245, 235, 230, 0.84));
  box-shadow: 0 18px 46px rgba(117, 78, 58, 0.1);
}

.header-content {
  max-width: none;
}

.page-title {
  font-size: 30px;
  color: #4a3e3d;
  background: none;
  -webkit-text-fill-color: initial;
}

.page-subtitle {
  margin-top: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.add-meal-btn,
.feed-inspiration-btn {
  min-height: 44px;
  border: 0;
  border-radius: 999px;
  color: #4a2b20;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
  box-shadow: 0 14px 28px rgba(224, 159, 103, 0.24);
  transition: all 0.3s ease-in-out;
}

.add-meal-btn:hover,
.feed-inspiration-btn:hover,
.add-meal-btn:focus-visible,
.feed-inspiration-btn:focus-visible {
  color: #4a2b20;
  transform: translateY(-2px);
  box-shadow: 0 18px 34px rgba(224, 159, 103, 0.3);
}

.couple-presence-card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 18px;
  padding: 18px 20px;
  border: 1px solid rgba(255, 180, 162, 0.24);
  border-radius: 26px;
  background: rgba(253, 251, 247, 0.78);
  box-shadow: 0 14px 36px rgba(117, 78, 58, 0.08);
  backdrop-filter: blur(14px);
}

.presence-avatars {
  display: flex;
  flex-shrink: 0;
}

.presence-avatars span {
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
  border: 3px solid #fdfbf7;
  border-radius: 999px;
  color: #fffaf3;
  font-size: 12px;
  font-weight: 800;
  background: linear-gradient(135deg, #ffb4a2, #e09f67);
  box-shadow: 0 10px 20px rgba(117, 78, 58, 0.12);
}

.presence-avatars span:first-child {
  margin-left: 0;
  background: linear-gradient(135deg, #a8b8a0, #e09f67);
}

.presence-copy {
  flex: 1;
  min-width: 0;
}

.presence-copy strong {
  color: #4a3e3d;
  font-size: 15px;
}

.presence-copy p {
  margin: 4px 0 0;
  color: var(--text-secondary);
  font-size: 13px;
}

.filter-section,
.loading-container,
.pagination-container,
.empty-state,
.meals-table {
  border: 1px solid rgba(224, 159, 103, 0.18);
  border-radius: 26px;
  background: rgba(253, 251, 247, 0.84);
  box-shadow: 0 16px 38px rgba(117, 78, 58, 0.09);
}

.search-input :deep(.el-input__wrapper),
.tag-select :deep(.el-input__wrapper) {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(224, 159, 103, 0.2);
  transition: all 0.3s ease-in-out;
}

.search-input :deep(.el-input__wrapper.is-focus),
.tag-select :deep(.el-input__wrapper.is-focus) {
  box-shadow: inset 0 0 0 1px #ffb4a2, 0 10px 24px rgba(255, 180, 162, 0.16);
}

.view-switcher {
  border-radius: 999px;
  padding: 4px;
  background: rgba(245, 235, 230, 0.82);
}

.view-switcher .el-radio-button__inner {
  border-radius: 999px !important;
  background: transparent;
}

.view-switcher .el-radio-button__original-radio:checked + .el-radio-button__inner {
  background: #4a3e3d;
  color: #fdfbf7;
}

.meals-grid {
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 24px;
  align-items: start;
}

.meals-grid :deep(.meal-card-wrapper:nth-child(3n + 2)) {
  margin-top: 18px;
}

.meals-grid :deep(.meal-card-wrapper:nth-child(4n)) {
  margin-top: 8px;
}

.meal-list-item {
  border: 1px solid rgba(224, 159, 103, 0.2);
  border-radius: 24px;
  background: rgba(253, 251, 247, 0.9);
  box-shadow: 0 16px 34px rgba(117, 78, 58, 0.1);
}

.meal-list-item:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 22px 42px rgba(117, 78, 58, 0.16);
}

.meal-list-image {
  width: 150px;
  height: 150px;
  margin: 12px 0 12px 12px;
  border-radius: 20px;
}

.meal-list-actions .el-button,
.table-actions .el-button,
.list-feed-btn {
  border: 0;
  box-shadow: 0 8px 18px rgba(117, 78, 58, 0.12);
}

.add-meal-dialog :deep(.el-dialog) {
  border-radius: 28px;
  background: linear-gradient(135deg, #fdfbf7, #f5ebe6);
  box-shadow: 0 30px 80px rgba(74, 62, 61, 0.18);
}

.add-meal-dialog :deep(.el-dialog__header) {
  padding: 24px 28px 10px;
}

.add-meal-dialog :deep(.el-dialog__title) {
  color: #4a3e3d;
  font-weight: 800;
}

.add-meal-form {
  padding: 18px 8px;
  background: linear-gradient(90deg, rgba(224, 159, 103, 0.08) 1px, transparent 1px), rgba(253, 251, 247, 0.46);
  background-size: 18px 18px;
  border-radius: 22px;
}

.upload-area {
  border-radius: 22px;
  background: rgba(245, 235, 230, 0.62);
}

@media (max-width: 768px) {
  .page-header {
    margin: 0 0 14px;
    padding: 18px;
    border-radius: 22px;
  }

  .page-title {
    font-size: 24px;
    text-align: left;
  }

  .header-content { gap: 10px; }
  .header-actions { flex-direction: row; gap: 8px; }
  .header-actions .el-button { flex: 1 1 0; min-width: 0; min-height: 44px; margin: 0; padding-inline: 8px; }

  .couple-presence-card {
    align-items: center;
    flex-wrap: nowrap;
    gap: 10px;
    padding: 12px 14px;
    border-radius: 22px;
  }
  .presence-avatars { display: none; }
  .presence-copy strong { font-size: 13px; }

  .feed-inspiration-btn {
    width: auto;
    flex: 0 0 auto;
    max-width: 48%;
    padding-inline: 8px;
    font-size: 12px;
    white-space: normal;
  }

  .meals-grid :deep(.meal-card-wrapper:nth-child(n)) {
    margin-top: 0;
  }

  .meal-list-image {
    width: auto;
    height: 180px;
    margin: 10px 10px 0;
  }
}

.catalog-layout { display: grid; grid-template-columns: minmax(130px, 180px) minmax(0, 1fr); gap: 20px; align-items: start; }
.category-sidebar { position: sticky; top: calc(var(--header-height, 64px) + 12px); max-height: calc(100vh - var(--header-height, 64px) - 24px); overflow-y: auto; padding: 18px 12px; border: 1px solid rgba(224,159,103,.18); border-radius: 24px; background: var(--bg-primary); box-shadow: 0 16px 38px rgba(117,78,58,.09); }
.category-heading { padding: 0 10px 12px; color: var(--text-secondary); font-size: 12px; font-weight: 700; letter-spacing: .08em; }
.category-list { display: flex; flex-direction: column; gap: 5px; }
.category-list button { width: 100%; border: 0; border-radius: 14px; background: transparent; color: var(--text-secondary); padding: 11px 12px; text-align: left; font: inherit; font-size: 14px; cursor: pointer; overflow-wrap: anywhere; }
.category-list button[data-sidebar-kind="category"], .category-list button[data-sidebar-kind="uncategorized"] { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 2px 4px; }
.category-list button span { min-width: 0; }
.category-list button small { font-size: 11px; font-weight: 600; }
.category-count-note { margin: 10px 6px 0; color: var(--text-secondary); font-size: 11px; line-height: 1.5; }
.category-refresh { min-height: 44px; padding: 4px 6px; border: 0; background: none; color: var(--text-primary); font: inherit; font-size: 12px; text-decoration: underline; cursor: pointer; }
.category-refresh:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.category-list button:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.category-list button.active { color: #713d30; background: #f9e6dc; font-weight: 700; box-shadow: inset 3px 0 0 #c77c5c; }
.category-list button:focus-visible, .meal-list-item:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 2px; }
.category-error { padding: 12px 8px 0; color: var(--text-secondary); font-size: 12px; }
.category-error button { display: block; padding: 6px 0; border: 0; background: none; color: var(--text-primary); text-decoration: underline; font: inherit; cursor: pointer; }
.tag-error { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; color: var(--text-primary); font-size: 13px; line-height: 1.5; }
.tag-error button { min-height: 44px; padding: 4px 6px; border: 0; background: none; color: var(--text-primary); text-decoration: underline; font: inherit; cursor: pointer; }
.tag-error button:focus-visible { outline: 2px solid var(--text-primary); outline-offset: 2px; }
.catalog-content { min-width: 0; }
.catalog-content .meals-grid { grid-template-columns: repeat(auto-fill, minmax(min(100%, 270px), 1fr)); }
@media (max-width: 768px) {
  .catalog-layout { grid-template-columns: 82px minmax(0, 1fr); gap: 10px; }
  .category-sidebar { padding: 12px 5px; border-radius: 18px; }
  .category-heading { padding: 0 5px 9px; font-size: 11px; letter-spacing: 0; }
  .category-list button { padding: 10px 6px; font-size: 12px; border-radius: 10px; }
  .category-list button { min-height: 44px; }
  .category-error { padding: 8px 4px 0; }
  .catalog-content .meals-grid { grid-template-columns: minmax(0, 1fr); gap: 16px; }
  :global(.meal-page .view-switcher .el-radio-button) { flex: 1; }
  :global(.meal-page .view-switcher .el-radio-button__inner) { min-height: 44px; display: flex; align-items: center; justify-content: center; }
}
.results-summary { color: var(--text-secondary); font-size: 12px; padding-top: 10px; }
.wish-recovery { margin-bottom: 12px; }
.wish-recovery p { margin: 4px 0 8px; line-height: 1.5; }
.wish-recovery-actions { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.wish-recovery-actions :deep(.el-button + .el-button) { margin-left: 0; }
.table-actions :deep(.el-button + .el-button), .meal-list-actions :deep(.el-button + .el-button) { margin-left: 0; }
:global(.meal-page .view-switcher .el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
  outline: 2px solid var(--secondary-color);
  outline-offset: 2px;
}

/* Component styles are scoped, so the dark-mode ancestor must be global. */
:global(html.dark .meal-page .page-header),
:global(html.dark .meal-page .couple-presence-card),
:global(html.dark .meal-page .filter-section),
:global(html.dark .meal-page .loading-container),
:global(html.dark .meal-page .pagination-container),
:global(html.dark .meal-page .empty-state),
:global(html.dark .meal-page .meals-table),
:global(html.dark .meal-page .meal-list-item) {
  background: var(--bg-primary);
  border-color: var(--border-color);
  box-shadow: 0 14px 32px var(--shadow-color);
}
:global(html.dark .meal-page .page-title),
:global(html.dark .meal-page .presence-copy strong),
:global(html.dark .meal-page .meal-list-name),
:global(html.dark .meal-page .table-name) { color: var(--text-primary); }
:global(html.dark .meal-page .page-subtitle),
:global(html.dark .meal-page .presence-copy p),
:global(html.dark .meal-page .meal-list-description),
:global(html.dark .meal-page .table-description) { color: var(--text-secondary); }
:global(html.dark .meal-page .meal-list-tags .meal-tag),
:global(html.dark .meal-page .table-tags .table-tag) {
  color: var(--text-primary);
  background: var(--bg-tertiary);
  border-color: var(--border-color);
}
:global(html.dark .meal-page .category-list button.active) {
  color: var(--text-primary);
  background: #604131;
  box-shadow: inset 3px 0 0 var(--secondary-color);
}
:global(html.dark .meal-page .view-switcher) { background: var(--bg-secondary); }
:global(html.dark .meal-page .view-switcher .el-radio-button__inner) {
  background: transparent;
  border-color: var(--border-color);
  color: var(--text-primary);
}
:global(html.dark .meal-page .view-switcher .el-radio-button.is-active .el-radio-button__inner) {
  color: #fff3e8;
  background: #76503d;
}
:global(html.dark .meal-page .meals-grouped .el-collapse-item__header),
:global(html.dark .meal-page .meals-grouped .el-collapse-item__wrap) {
  color: var(--text-primary);
  background: var(--bg-primary);
  border-color: var(--border-color);
}
:global(html.dark .meal-page .meals-table .el-table) {
  --el-table-bg-color: var(--bg-primary);
  --el-table-tr-bg-color: var(--bg-primary);
  --el-table-header-bg-color: var(--bg-secondary);
  --el-table-text-color: var(--text-primary);
  --el-table-border-color: var(--border-color);
}
</style>
