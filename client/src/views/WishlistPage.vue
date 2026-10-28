<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useRouter } from 'vue-router';
import { Plus, Delete, Check, Star, Calendar } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';

const items = ref([]);
const router = useRouter();
const loading = ref(false);
const loadError = ref('');
const dialogVisible = ref(false);
const saving = ref(false);
const convertingId = ref('');
const pendingLinks = reactive({});
const uncertainCreates = reactive({});
const linkDialog = ref(false);
const linkItem = ref(null);
const availableMeals = ref([]);
const selectedMealId = ref('');
const linkLoading = ref(false);
const linkError = ref('');
const form = reactive({ title: '', note: '', category: '', priority: 'normal' });
const initialForm = ref(JSON.stringify(form));
const dirty = computed(() => JSON.stringify(form) !== initialForm.value);
const busy = computed(() => saving.value || !!convertingId.value);
useDraftGuard({ dirty, busy, label: '想吃记录' });
const statusText = { open: '想吃', planned: '已安排', done: '已完成' };
const priorityText = { low: '随缘', normal: '普通', high: '超想吃' };
const grouped = computed(() => ['open', 'planned', 'done'].map(status => ({ status, items: items.value.filter(item => item.status === status) })));

const load = async () => {
  loading.value = true;
  loadError.value = '';
  try {
    items.value = await api.wishlist.list();
    for (const item of items.value) if (item.mealId) { delete pendingLinks[item._id]; delete uncertainCreates[item._id]; }
  }
  catch (e) { loadError.value = e?.error || '加载想吃清单失败'; }
  finally { loading.value = false; }
};
const reset = () => { Object.assign(form, { title: '', note: '', category: '', priority: 'normal' }); initialForm.value = JSON.stringify(form); };
const save = async () => {
  if (!form.title.trim()) return ElMessage.warning('请填写想吃什么');
  if (saving.value) return;
  saving.value = true;
  try {
    await api.wishlist.create({ ...form, title: form.title.trim() });
    ElMessage.success('已加入想吃清单');
    dialogVisible.value = false;
    reset();
    await load();
  } catch (e) { ElMessage.error(e?.error || '保存失败'); }
  finally { saving.value = false; }
};
const vote = async (item) => { try { await api.wishlist.vote(item._id); await load(); } catch (e) { ElMessage.error(e?.error || '投票失败'); } };
const setStatus = async (item, status) => { try { await api.wishlist.updateStatus(item._id, status); await load(); } catch (e) { ElMessage.error(e?.error || '更新状态失败'); } };
const remove = async (item) => {
  try { await ElMessageBox.confirm('确定删除这个想吃项吗？', '删除确认'); await api.wishlist.delete(item._id); await load(); }
  catch (e) { if (e !== 'cancel') ElMessage.error(e?.error || '删除失败'); }
};
const convertToMeal = async (item) => {
  if (item.mealId) return ElMessage.info('这条想吃已经关联菜谱');
  if (!item.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  if (convertingId.value) return;
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
const openLinkDialog = async (item) => {
  if (!item?.supportsSafeMealLink) return ElMessage.warning('服务器未提供安全关联能力，请稍后重试');
  linkItem.value = item;
  selectedMealId.value = '';
  availableMeals.value = [];
  linkDialog.value = true;
  linkLoading.value = true;
  linkError.value = '';
  try { availableMeals.value = (await api.meal.getAllMeals()).data || []; }
  catch (e) { linkError.value = e?.error || '加载菜谱失败'; }
  finally { linkLoading.value = false; }
};
const attachExisting = async (item, mealId) => {
  if (!item || !item.supportsSafeMealLink || !mealId || convertingId.value) return;
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
  const meal = item.mealId;
  const id = typeof meal === 'string' ? meal : meal?._id || meal?.id;
  if (!id) return ElMessage.warning('请先关联菜谱');
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  router.push({ name: 'MealSelection', query: { date, mealType: 'dinner', suggestedMealId: id, wishlistId: item._id } });
};
onMounted(load);
</script>

<template>
  <div class="wishlist-page">
    <div class="page-header">
      <div><span class="eyebrow">LITTLE WISHES · 想吃灵感</span><h1>想吃清单</h1><p>把突然想吃的、对方提到的、周末想试的都先记下来。</p><small>手动标记状态不会自动写入日历；关联菜谱后可安排到今天晚餐。</small></div>
      <el-button type="primary" @click="dialogVisible = true"><el-icon><Plus /></el-icon>添加想吃</el-button>
    </div>

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
          <div class="vote-row"><el-button link type="warning" @click="vote(item)"><el-icon><Star /></el-icon>{{ item.votes?.length || 0 }} 票</el-button><span>{{ item.category }}</span></div>
          <div class="actions">
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="!!convertingId || !item.supportsSafeMealLink || !!uncertainCreates[item._id]" @click="convertToMeal(item)">转菜品</el-button>
            <el-button v-if="!item.mealId && !pendingLinks[item._id]" size="small" :disabled="!!convertingId || !item.supportsSafeMealLink" @click="openLinkDialog(item)">关联已有菜谱</el-button>
            <el-button v-if="!item.mealId && pendingLinks[item._id]" size="small" :loading="convertingId === item._id" :disabled="!!convertingId" @click="attachExisting(item, pendingLinks[item._id])">重试关联</el-button>
            <el-button v-if="item.mealId" size="small" :disabled="!!convertingId" @click="arrangeToday(item)"><el-icon><Calendar /></el-icon>安排今天晚餐</el-button>
            <el-button v-if="item.status === 'open'" size="small" @click="setStatus(item, 'planned')">标记已安排</el-button>
            <el-button v-if="item.status !== 'done'" size="small" type="success" @click="setStatus(item, 'done')"><el-icon><Check /></el-icon>完成</el-button>
            <el-button v-if="item.status !== 'open'" size="small" @click="setStatus(item, 'open')">重新想吃</el-button>
            <el-button size="small" type="danger" :aria-label="`删除${item.title}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button>
          </div>
        </el-card>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" title="添加想吃" width="min(520px, 92vw)" :close-on-click-modal="!saving" :close-on-press-escape="!saving" :show-close="!saving">
      <el-form label-position="top" :disabled="saving">
        <el-form-item label="想吃什么"><el-input v-model="form.title" placeholder="比如：冬阴功火锅、楼下那家牛肉面" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="外食、家常、甜品、周末计划..." /></el-form-item>
        <el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="随缘" value="low" /><el-option label="普通" value="normal" /><el-option label="超想吃" value="high" /></el-select></el-form-item>
      </el-form>
      <template #footer><span class="draft-hint">关闭后草稿会暂留在本页</span><el-button :disabled="saving" @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="linkDialog" title="关联已有菜谱" width="min(520px, 92vw)">
      <p>为「{{ linkItem?.title }}」选择已有菜谱，不会创建新菜品。</p>
      <el-alert v-if="linkError" type="error" :closable="false" :title="linkError"><el-button link type="primary" @click="openLinkDialog(linkItem)">重试</el-button></el-alert>
      <el-select v-else v-model="selectedMealId" filterable placeholder="搜索并选择菜谱" :loading="linkLoading" style="width:100%"><el-option v-for="meal in availableMeals" :key="meal._id || meal.id" :label="meal.name" :value="meal._id || meal.id" /></el-select>
      <template #footer><el-button @click="linkDialog = false">取消</el-button><el-button type="primary" :disabled="!selectedMealId || linkLoading || !!linkError" :loading="!!convertingId" @click="attachExisting(linkItem, selectedMealId)">确认关联</el-button></template>
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
.actions { justify-content: flex-start; }
@media (max-width: 900px) { .board { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: stretch; } }
</style>
