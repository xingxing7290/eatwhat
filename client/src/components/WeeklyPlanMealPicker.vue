<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { ElMessageBox } from 'element-plus';
import api from '@/services/api';
import { resolveUploadedImage } from '@/utils/uploadedImage.mjs';
import placeholder from '@/assets/meal-placeholder.svg';

const props = defineProps({ date: { type: String, required: true }, label: { type: String, required: true }, meals: { type: Array, required: true } });
const emit = defineEmits(['confirm', 'cancel']);
const idOf = meal => String(meal?._id || meal?.id || '');
const selected = ref(props.meals.map(meal => ({ ...meal })));
const initialIds = selected.value.map(idOf);
const dirty = computed(() => JSON.stringify(selected.value.map(idOf)) !== JSON.stringify(initialIds));
const query = ref('');
const category = ref('');
const categories = ref([]);
const metadataError = ref(false);
const meals = ref([]);
const total = ref(0);
const page = ref(1);
const limit = 8;
const loading = ref(false);
const error = ref('');
let sequence = 0;
let timer = null;
let alive = true;

const selectedIds = computed(() => new Set(selected.value.map(idOf)));
const lastPage = computed(() => Math.max(1, Math.ceil(total.value / limit)));
const legacyMatches = meal => {
  const terms = [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])];
  const text = query.value.trim().toLowerCase();
  return (!text || terms.some(term => String(term || '').toLowerCase().includes(text))) && (!category.value || meal.category === category.value);
};
const load = async () => {
  const ticket = ++sequence;
  loading.value = true;
  error.value = '';
  try {
    const params = { page: page.value, limit };
    if (query.value.trim()) params.search = query.value.trim();
    if (category.value) params.category = category.value;
    const result = await api.meal.getAllMeals(params);
    if (!alive || ticket !== sequence) return;
    let rows = result.data;
    let count = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(count) || count < 0 || rows.some(meal => !idOf(meal) || typeof meal.name !== 'string' || !meal.name.trim()) || new Set(rows.map(idOf)).size !== rows.length) throw new Error('菜品列表不完整，请重试');
    if (result.page == null && result.limit == null && rows.length === count) {
      const filtered = rows.filter(legacyMatches);
      count = filtered.length;
      rows = filtered.slice((page.value - 1) * limit, page.value * limit);
    }
    if (page.value > Math.max(1, Math.ceil(count / limit))) { page.value = Math.max(1, Math.ceil(count / limit)); return load(); }
    meals.value = rows;
    total.value = count;
  } catch (e) {
    if (alive && ticket === sequence) error.value = e?.error || e?.message || '菜品加载失败';
  } finally { if (alive && ticket === sequence) loading.value = false; }
};
const queueLoad = delay => {
  sequence++;
  loading.value = true;
  if (timer) clearTimeout(timer);
  timer = setTimeout(load, delay);
};
watch([query, category], () => { page.value = 1; queueLoad(180); });
const changePage = next => { if (loading.value || next < 1 || next > lastPage.value) return; page.value = next; queueLoad(0); };
const loadCategories = async () => {
  try {
    const result = await api.meal.getMealCategories();
    if (!alive) return;
    categories.value = [...new Set(result.data.map(item => item.category).filter(Boolean))];
    metadataError.value = false;
  } catch (_) { if (alive) metadataError.value = true; }
};
const toggle = meal => {
  const index = selected.value.findIndex(item => idOf(item) === idOf(meal));
  if (index < 0) selected.value.push(meal);
  else selected.value.splice(index, 1);
};
const cancel = async () => {
  if (dirty.value) {
    try { await ElMessageBox.confirm('本餐次的调整还没有保存到周计划草稿。', '放弃本次调整？', { type: 'warning', confirmButtonText: '放弃调整', cancelButtonText: '继续选择' }); }
    catch (_) { return; }
  }
  emit('cancel');
};
const imageFor = meal => resolveUploadedImage(meal.imageUrl || meal.image || '') || placeholder;
const imageError = event => { if (event.target.dataset.fallback !== '1') { event.target.dataset.fallback = '1'; event.target.src = placeholder; } };
onMounted(() => { load(); loadCategories(); });
onBeforeUnmount(() => { alive = false; sequence++; if (timer) clearTimeout(timer); });
</script>

<template>
  <el-dialog :model-value="true" :title="`调整 ${date} ${label}`" width="min(760px, 94vw)" :close-on-click-modal="false" :before-close="cancel" class="weekly-meal-picker">
    <div class="picker-intro">选择或取消菜品，确认后只更新周计划草稿，尚不会写入日历。</div>
    <div class="chosen" aria-live="polite">
      <strong>本餐已选 {{ selected.length }} 道</strong>
      <div v-if="selected.length" class="chosen-list"><button v-for="meal in selected" :key="idOf(meal)" type="button" :aria-label="`移除${meal.name}`" @click="toggle(meal)">{{ meal.name }} <span aria-hidden="true">×</span></button></div>
      <span v-else class="muted">未选择菜品；确认后该餐次为空。</span>
    </div>
    <el-input v-model="query" clearable placeholder="搜索菜名、食材或做法" aria-label="搜索周计划菜品" />
    <div class="picker-layout">
      <aside aria-label="周计划菜品分类" class="category-list">
        <button type="button" :class="{ active: !category }" :aria-pressed="!category" @click="category = ''">全部</button>
        <button v-for="item in categories" :key="item" type="button" :class="{ active: category === item }" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
        <div v-if="metadataError" class="metadata-note">分类暂不可用 <button type="button" @click="loadCategories">重试</button></div>
      </aside>
      <section aria-label="可选菜品" class="catalog">
        <div v-if="error && !loading" class="catalog-error" role="alert">{{ error }} <el-button link type="primary" @click="load">重试</el-button></div>
        <div v-else-if="loading" class="catalog-state" role="status">正在加载菜品…</div>
        <template v-else>
          <div v-if="!meals.length" class="catalog-state">没有找到匹配的菜品</div>
          <div v-else class="meal-list">
            <button v-for="meal in meals" :key="idOf(meal)" type="button" class="meal-option" :class="{ active: selectedIds.has(idOf(meal)) }" :aria-label="`${selectedIds.has(idOf(meal)) ? '取消选择' : '选择'}${meal.name}`" :aria-pressed="selectedIds.has(idOf(meal))" @click="toggle(meal)">
              <img :src="imageFor(meal)" alt="" @error="imageError" /><span class="meal-copy"><strong>{{ meal.name }}</strong><small>{{ meal.category || '未分类' }}</small></span><span class="choice-mark" aria-hidden="true">{{ selectedIds.has(idOf(meal)) ? '✓' : '+' }}</span>
            </button>
          </div>
          <div v-if="total > limit" class="pagination"><el-button :disabled="page <= 1" @click="changePage(page - 1)">上一页</el-button><span>第 {{ page }} / {{ lastPage }} 页</span><el-button :disabled="page >= lastPage" @click="changePage(page + 1)">下一页</el-button></div>
        </template>
      </section>
    </div>
    <template #footer><div class="picker-footer"><el-button @click="cancel">取消</el-button><el-button type="primary" @click="emit('confirm', selected)">保存到草稿</el-button></div></template>
  </el-dialog>
</template>

<style scoped>
.picker-intro,.muted { color: var(--text-secondary); font-size: 13px; line-height: 1.5; }
.chosen { padding: 12px; margin: 12px 0; background: var(--bg-secondary); border-radius: 12px; }
.chosen strong { display: block; margin-bottom: 8px; color: var(--text-primary); }
.chosen-list { display: flex; flex-wrap: wrap; gap: 6px; max-height: 100px; overflow-y: auto; }
.chosen-list button { border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); border-radius: 20px; padding: 6px 10px; min-height: 36px; cursor: pointer; font: inherit; }
.picker-layout { display: grid; grid-template-columns: 110px minmax(0, 1fr); gap: 12px; margin-top: 14px; }
.category-list,.catalog { min-width: 0; max-height: min(45vh, 440px); overflow-y: auto; }
.category-list { display: flex; flex-direction: column; gap: 4px; }
.category-list > button { border: 0; background: transparent; color: var(--text-secondary); text-align: left; padding: 10px; min-height: 42px; border-radius: 10px; overflow-wrap: anywhere; cursor: pointer; font: inherit; }
.category-list > button.active { background: var(--bg-tertiary); color: var(--text-primary); font-weight: 700; box-shadow: inset 3px 0 0 var(--secondary-color); }
.metadata-note,.catalog-state,.catalog-error { color: var(--text-secondary); font-size: 13px; padding: 12px; }
.metadata-note button { border: 0; padding: 5px 0; background: none; color: var(--secondary-color); text-decoration: underline; font: inherit; cursor: pointer; }
.meal-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.meal-option { display: flex; align-items: center; gap: 10px; min-width: 0; min-height: 74px; padding: 8px; border: 1px solid var(--border-color); border-radius: 14px; background: var(--bg-primary); color: var(--text-primary); text-align: left; cursor: pointer; font: inherit; }
.meal-option.active { border-color: var(--secondary-color); background: var(--bg-secondary); }
.meal-option img { width: 56px; height: 56px; flex: 0 0 56px; border-radius: 10px; object-fit: cover; background: var(--bg-tertiary); }
.meal-copy { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 4px; overflow-wrap: anywhere; }
.meal-copy small { color: var(--text-secondary); }
.choice-mark { color: var(--secondary-color); font-size: 20px; font-weight: 700; }
.pagination,.picker-footer { display: flex; align-items: center; justify-content: center; gap: 10px; }
.pagination { margin-top: 12px; color: var(--text-secondary); font-size: 13px; }
.picker-footer { justify-content: flex-end; }
.picker-footer .el-button + .el-button,.pagination .el-button + .el-button { margin-left: 0; }
.meal-option:focus-visible,.chosen-list button:focus-visible,.category-list button:focus-visible { outline: 2px solid var(--secondary-color); outline-offset: 2px; }
@media (max-width: 600px) {
  .picker-layout { grid-template-columns: 74px minmax(0, 1fr); gap: 8px; }
  .category-list > button { padding: 9px 6px; min-height: 44px; font-size: 12px; }
  .meal-list { grid-template-columns: 1fr; }
  .picker-footer .el-button,.pagination .el-button { min-height: 44px; }
}
</style>
