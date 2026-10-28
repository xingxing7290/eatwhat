<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { Plus, Delete, Check, Star, Calendar } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';
import { useUncertainCreate } from '@/composables/useUncertainCreate';
import CreateRecoveryNotice from '@/components/CreateRecoveryNotice.vue';
import { validWishVersion } from '@/utils/wishlistVersion.mjs';

const items = ref([]);
const router = useRouter();
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const convertingId = ref('');
const actionId = ref('');
const confirmingId = ref('');
const actionIssue = ref('');
const pendingLinks = reactive({});
const uncertainCreates = reactive({});
const linkDialog = ref(false);
const linkItem = ref(null);
const availableMeals = ref([]);
const selectedMealId = ref('');
const selectedMeal = ref(null);
const linkQuery = ref('');
const linkTotal = ref(0);
const linkLoading = ref(false);
const linkError = ref('');
let linkSequence = 0;
let linkTimer = null;
let listSequence = 0;
let alive = true;
const form = reactive({ title: '', note: '', category: '', priority: 'normal' });
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value);
const recovery = useUncertainCreate({ reload: () => load(), loadError, close: () => { dialogVisible.value = false; }, discard: () => reset(), reopen: () => { dialogVisible.value = true; }, label: '想吃记录' });
const { uncertain: saveUncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft } = recovery;
const busy = computed(() => saving.value || !!convertingId.value || !!actionId.value || !!confirmingId.value || reviewing.value || deciding.value);
const uncertain = computed(() => saveUncertain.value || !!actionIssue.value || Object.keys(pendingLinks).length > 0 || Object.keys(uncertainCreates).length > 0);
useDraftGuard({ dirty, busy, uncertain, label: '想吃记录' });
const statusText = { open: '想吃', planned: '已安排', done: '已完成' };
const priorityText = { low: '随缘', normal: '普通', high: '超想吃' };
const priorityRank = { low: 0, normal: 1, high: 2 };
const rankOf = item => Object.prototype.hasOwnProperty.call(priorityRank, item.priority) ? priorityRank[item.priority] : priorityRank.normal;
const mealId = meal => String(meal?._id || meal?.id || '');
const linkOptions = computed(() => {
  const seen = new Set();
  return [selectedMeal.value, ...availableMeals.value].filter(meal => { const id = mealId(meal); if (!id || seen.has(id)) return false; seen.add(id); return true; });
});
const grouped = computed(() => ['open', 'planned', 'done'].map(status => ({
  status,
  items: items.value.filter(item => item.status === status).sort((a, b) => rankOf(b) - rankOf(a) || (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0))
})));

const load = async () => {
  const sequence = ++listSequence;
  loading.value = true;
  loadError.value = '';
  try {
    const result = await api.wishlist.list();
    if (!alive || sequence !== listSequence) return;
    if (!Array.isArray(result)) throw new Error('清单数据不完整');
    items.value = result;
    for (const item of items.value) if (item.mealId) { delete pendingLinks[item._id]; delete uncertainCreates[item._id]; }
    actionIssue.value = '';
  }
  catch (e) { if (alive && sequence === listSequence) loadError.value = e?.error || e?.message || '加载想吃清单失败'; }
  finally { if (alive && sequence === listSequence) loading.value = false; }
};
const reset = () => { Object.assign(form, { title: '', note: '', category: '', priority: 'normal' }); initialForm.value = JSON.stringify(form); };
const save = async () => {
  if (!form.title.trim()) return ElMessage.warning('请填写想吃什么');
  if (saving.value || saveUncertain.value || reviewing.value || loading.value || loadError.value || actionIssue.value || actionId.value) return;
  saving.value = true;
  try {
    const created = await api.wishlist.create({ ...form, title: form.title.trim() });
    if (!created?._id && !created?.id) throw new Error('保存响应不完整');
    ElMessage.success('已加入想吃清单');
    dialogVisible.value = false;
    reset();
    await load();
  } catch (_) { markUncertain(); }
  finally { saving.value = false; }
};
const runAction = async (item, label, action) => {
  if (!item?._id || busy.value || loading.value || loadError.value || actionIssue.value) return;
  actionId.value = item._id;
  try { await action(); await load(); }
  catch (e) { actionIssue.value = e?.code === 'WISH_CONFLICT' ? '这条想吃已被其他成员修改或删除，本次未操作；请刷新清单并核对。' : `${label}结果未确认，请刷新清单并核对后再操作；先前请求仍可能稍后完成。`; }
  finally { actionId.value = ''; }
};
const vote = item => {
  if (!item.supportsSetVote || typeof item.votedByMe !== 'boolean') return ElMessage.warning('服务器未提供安全投票能力，请稍后重试');
  return runAction(item, '投票', () => api.wishlist.setVote(item._id, !item.votedByMe));
};
const setStatus = (item, status) => {
  if (!validWishVersion(item)) return ElMessage.warning('服务器未提供有效的记录版本，暂时不能安全修改状态');
  return runAction(item, '状态更新', () => api.wishlist.updateStatus(item._id, status, item.editVersion));
};
const remove = async (item) => {
  if (busy.value || loading.value || loadError.value || actionIssue.value) return;
  if (!validWishVersion(item)) return ElMessage.warning('服务器未提供有效的记录版本，暂时不能安全删除');
  confirmingId.value = item._id;
  try { await ElMessageBox.confirm('确定删除这个想吃项吗？', '删除确认'); } catch (_) { return; }
  finally { confirmingId.value = ''; }
  await runAction(item, '删除', () => api.wishlist.delete(item._id, item.editVersion));
};
const convertToMeal = async (item) => {
  if (item.mealId) return ElMessage.info('这条想吃已经关联菜谱');
  if (!item.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  if (busy.value || loading.value || loadError.value || actionIssue.value) return;
  convertingId.value = item._id;
  try {
    const meal = await api.meal.createMeal({ name: item.title, description: item.note || '来自想吃清单', category: item.category || '想吃清单', tags: ['想吃清单'], favorite: true });
    if (!meal?._id && !meal?.id) throw new Error('创建结果缺少菜谱编号');
    pendingLinks[item._id] = meal._id || meal.id;
    try {
      await api.wishlist.attachMeal(item._id, pendingLinks[item._id], { onlyIfUnlinked: true });
      delete pendingLinks[item._id];
    } catch (error) {
      if (error?.code === 'WISH_ALREADY_LINKED') delete pendingLinks[item._id];
      ElMessage.warning('菜谱已创建，但关联未完成；请先检查清单或重试关联，避免重复创建');
      await load();
      return;
    }
    ElMessage.success('已创建并关联菜谱，可继续安排到日历');
    await load();
  } catch (e) { uncertainCreates[item._id] = true; ElMessage.warning('创建结果不确定，请先在菜谱中检查，也可选择关联已有菜谱'); }
  finally { convertingId.value = ''; }
};
const fetchLinkMeals = async () => {
  const sequence = ++linkSequence;
  const query = linkQuery.value.trim();
  linkLoading.value = true; linkError.value = '';
  try {
    const params = { page: 1, limit: 50 }; if (query) params.search = query;
    const result = await api.meal.getAllMeals(params);
    if (!alive || sequence !== linkSequence || !linkDialog.value) return;
    let rows = result.data; let total = result.total;
    if (!Array.isArray(rows) || !Number.isSafeInteger(total) || total < 0 || rows.some(meal => !mealId(meal) || typeof meal.name !== 'string' || !meal.name.trim())) throw new Error('菜谱列表不完整');
    if (result.page == null && result.limit == null && rows.length === total) {
      const lower = query.toLowerCase();
      rows = rows.filter(meal => [meal.name, meal.description, meal.tips, ...(Array.isArray(meal.tags) ? meal.tags : []), ...(Array.isArray(meal.ingredients) ? meal.ingredients.map(item => item?.name || item) : []), ...(Array.isArray(meal.steps) ? meal.steps.map(item => item?.description || item) : [])].some(field => String(field || '').toLowerCase().includes(lower)));
      total = rows.length; rows = rows.slice(0, 50);
    }
    availableMeals.value = rows; linkTotal.value = total;
  } catch (e) { if (alive && sequence === linkSequence && linkDialog.value) linkError.value = e?.error || e?.message || '加载菜谱失败'; }
  finally { if (alive && sequence === linkSequence) linkLoading.value = false; }
};
const searchLinkMeals = query => {
  linkQuery.value = typeof query === 'string' ? query : ''; linkSequence++;
  linkLoading.value = true; linkError.value = '';
  if (linkTimer) clearTimeout(linkTimer);
  linkTimer = setTimeout(fetchLinkMeals, 180);
};
const rememberLinkMeal = id => { selectedMeal.value = linkOptions.value.find(meal => mealId(meal) === String(id)) || null; };
const openLinkDialog = item => {
  if (!item?.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  if (busy.value || loading.value || loadError.value || actionIssue.value) return;
  linkItem.value = item;
  selectedMealId.value = '';
  selectedMeal.value = null;
  availableMeals.value = [];
  linkTotal.value = 0;
  linkDialog.value = true;
  searchLinkMeals('');
};
const attachExisting = async (item, mealId) => {
  if (!item || !item.supportsSafeMealLink || !mealId || busy.value || loading.value || loadError.value || actionIssue.value) return;
  convertingId.value = item._id;
  try {
    await api.wishlist.attachMeal(item._id, mealId, { onlyIfUnlinked: true });
    delete pendingLinks[item._id];
    delete uncertainCreates[item._id];
    linkDialog.value = false;
    ElMessage.success('已关联菜谱');
  } catch (error) {
    if (error?.code === 'WISH_ALREADY_LINKED') { delete pendingLinks[item._id]; linkDialog.value = false; }
    else ElMessage.warning('关联未确认，请先刷新清单后检查');
  } finally { await load(); convertingId.value = ''; }
};
const arrangeToday = (item) => {
  if (busy.value || loading.value || loadError.value || actionIssue.value) return;
  const meal = item.mealId;
  const id = typeof meal === 'string' ? meal : meal?._id || meal?.id;
  if (!id) return ElMessage.warning('请先关联菜谱');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  router.push({ name: 'MealSelection', query: { date, mealType: 'dinner', suggestedMealId: id, wishlistId: item._id } });
};
onMounted(load);
onBeforeUnmount(() => { alive = false; linkSequence++; listSequence++; if (linkTimer) clearTimeout(linkTimer); });
</script>

<template>
  <div class="wishlist-page">
    <div class="page-header">
      <div><span class="eyebrow">LITTLE WISHES · 想吃灵感</span><h1>想吃清单</h1><p>把突然想吃的、对方提到的、周末想试的都先记下来。</p><small>手动标记状态不会自动写入日历；关联菜谱后可安排到今天晚餐。</small></div>
      <el-button type="primary" :disabled="loading || !!loadError || reviewing || !!actionIssue || !!actionId || !!confirmingId" @click="dialogVisible = true"><el-icon><Plus /></el-icon>添加想吃</el-button>
    </div>

    <CreateRecoveryNotice v-if="saveUncertain && !dialogVisible" label="想吃记录" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />

    <el-alert v-if="actionIssue" type="warning" :closable="false" show-icon :title="actionIssue"><el-button link type="primary" :loading="loading" @click="load">刷新清单并核对</el-button></el-alert>
    <el-alert v-if="loadError" type="error" :closable="false" show-icon :title="`想吃清单暂时无法加载：${loadError}`"><el-button link type="primary" @click="load">重新加载</el-button></el-alert>
    <div v-else v-loading="loading" class="board">
      <section v-for="group in grouped" :key="group.status" class="status-column">
        <h2>{{ statusText[group.status] }} <span>{{ group.items.length }}</span></h2>
        <p v-if="!group.items.length" class="empty-column">暂时没有{{ statusText[group.status] }}的记录</p>
        <el-card v-for="item in group.items" :key="item._id" class="wish-card">
          <div class="wish-title"><strong>{{ item.title }}</strong><el-tag>{{ priorityText[item.priority] }}</el-tag></div>
          <p>{{ item.note || '还没有备注' }}</p>
          <p v-if="!item.mealId && !item.supportsSafeMealLink" class="pending-note">服务器未提供安全关联能力，暂不能关联菜谱。</p>
          <p v-if="uncertainCreates[item._id] && !item.mealId" class="pending-note">创建结果不确定，请先搜索并关联已有菜谱，避免重复创建。</p>
          <p v-if="pendingLinks[item._id]" class="pending-note">菜谱已创建，关联尚未确认。请重试关联，避免重复创建。</p>
          <div class="vote-row"><el-button link type="warning" :disabled="busy || loading || !!actionIssue || !item.supportsSetVote || typeof item.votedByMe !== 'boolean'" :aria-pressed="item.votedByMe === true" :aria-label="`${item.votedByMe ? '取消想吃' : '我想吃'}${item.title}`" @click="vote(item)"><el-icon><Star /></el-icon>{{ item.votedByMe ? '已想吃' : '我想吃' }} · {{ item.votes?.length || 0 }} 票</el-button><span>{{ item.category }}</span></div>
          <p v-if="!item.supportsSetVote || typeof item.votedByMe !== 'boolean'" class="pending-note">服务器暂不支持安全投票。</p>
          <p v-if="!validWishVersion(item)" class="pending-note">服务器未提供记录版本，暂不能安全修改状态或删除。</p>
          <div class="actions">
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || !item.supportsSafeMealLink || !!uncertainCreates[item._id]" @click="convertToMeal(item)">转菜品</el-button>
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="busy || loading || !!actionIssue || !item.supportsSafeMealLink" @click="openLinkDialog(item)">关联已有菜谱</el-button>
            <el-button v-if="!item.mealId && pendingLinks[item._id]" size="small" :loading="convertingId === item._id" :disabled="busy || loading || !!actionIssue" @click="attachExisting(item, pendingLinks[item._id])">重试关联</el-button>
            <el-button v-if="item.mealId" size="small" :disabled="busy || loading || !!actionIssue" @click="arrangeToday(item)"><el-icon><Calendar /></el-icon>安排今天晚餐</el-button>
            <el-button v-if="item.status === 'open'" size="small" :disabled="busy || loading || !!actionIssue || !validWishVersion(item)" @click="setStatus(item, 'planned')">标记已安排</el-button>
            <el-button v-if="item.status !== 'done'" size="small" type="success" :disabled="busy || loading || !!actionIssue || !validWishVersion(item)" @click="setStatus(item, 'done')"><el-icon><Check /></el-icon>完成</el-button>
            <el-button v-if="item.status !== 'open'" size="small" :disabled="busy || loading || !!actionIssue || !validWishVersion(item)" @click="setStatus(item, 'open')">重新想吃</el-button>
            <el-button size="small" type="danger" :disabled="busy || loading || !!actionIssue || !validWishVersion(item)" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button>
          </div>
        </el-card>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" title="添加想吃" width="min(520px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <CreateRecoveryNotice v-if="saveUncertain" label="想吃记录" :reviewed="reviewed" :reviewing="reviewing" :deciding="deciding" @review="review" @retry="allowRetry" @discard="discardDraft" />
      <el-form label-position="top" :disabled="saving || saveUncertain">
        <el-form-item label="想吃什么"><el-input v-model="form.title" placeholder="比如：冬阴功火锅、楼下那家牛肉面" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="外食、家常、甜品、周末计划..." /></el-form-item>
        <el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="随缘" value="low" /><el-option label="普通" value="normal" /><el-option label="超想吃" value="high" /></el-select></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :disabled="saveUncertain || loading || !!loadError || !!actionIssue || !!actionId" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="linkDialog" title="关联已有菜谱" width="min(520px, 92vw)" :close-on-click-modal="!convertingId" :close-on-press-escape="!convertingId" :show-close="!convertingId">
      <p>为「{{ linkItem?.title }}」选择已有菜谱，不会创建新菜品。</p>
      <el-alert v-if="linkError" type="error" :closable="false" :title="linkError"><el-button link type="primary" @click="fetchLinkMeals">重试</el-button></el-alert>
      <el-select v-model="selectedMealId" filterable remote reserve-keyword :remote-method="searchLinkMeals" aria-label="搜索并选择菜谱" placeholder="搜索并选择菜谱" :loading="linkLoading" :disabled="!!convertingId" style="width:100%" @change="rememberLinkMeal"><el-option v-for="meal in linkOptions" :key="mealId(meal)" :label="meal.name" :value="mealId(meal)" /></el-select>
      <small v-if="!linkError && linkTotal > 50" class="search-hint">仅显示前 50 道，请输入菜名或食材缩小范围。</small>
      <template #footer><el-button :disabled="!!convertingId" @click="linkDialog = false">取消</el-button><el-button type="primary" :disabled="!selectedMealId || linkLoading || !!linkError || !!actionIssue" :loading="!!convertingId" @click="attachExisting(linkItem, selectedMealId)">确认关联</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.draft-hint { color: var(--text-secondary); font-size: 12px; margin-right: 12px; }
.wishlist-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border:1px solid var(--border-color); border-radius:26px; padding:clamp(22px,3vw,36px); box-shadow:0 12px 28px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
h1 { margin-top:8px; font-family:Georgia,'Songti SC',serif; font-size:clamp(26px,3vw,36px); }.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p,.page-header small { color: var(--text-secondary); }.page-header p { margin: 6px 0; }.pending-note { color:var(--secondary-color) !important; font-size:13px; }
.board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.status-column { background: var(--bg-primary); border-radius: 12px; padding: 14px; box-shadow: 0 2px 8px var(--shadow-color); display: flex; flex-direction: column; gap: 12px; }
.status-column h2 { display: flex; justify-content: space-between; font-size: 18px; }
.wish-card p { color: var(--text-secondary); }
.empty-column { color:var(--text-secondary); font-size:13px; margin:0; padding:12px 0; }
.wish-title, .vote-row, .actions { display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
.wish-title strong { overflow-wrap: anywhere; min-width: 0; }
.wish-title .el-tag { color: var(--text-primary); min-width: max-content; }
.actions { justify-content: flex-start; }
.actions .el-button + .el-button { margin-left: 0; }
.search-hint { display: block; margin-top: 8px; color: var(--text-secondary); line-height: 1.5; }
@media (max-width: 900px) { .board { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: stretch; } }
</style>
