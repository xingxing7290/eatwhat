<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, Check, Star, Calendar } from '@element-plus/icons-vue';
import api from '@/services/api';

const items = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const saving = ref(false);
const convertingId = ref('');
const form = reactive({ title: '', note: '', category: '', priority: 'normal' });
const statusText = { open: '想吃', planned: '已安排', done: '已完成' };
const priorityText = { low: '随缘', normal: '普通', high: '超想吃' };
const grouped = computed(() => ['open', 'planned', 'done'].map(status => ({ status, items: items.value.filter(item => item.status === status) })));

const load = async () => {
  loading.value = true;
  try { items.value = await api.wishlist.list(); }
  catch (e) { ElMessage.error(e?.error || '加载想吃清单失败'); }
  finally { loading.value = false; }
};
const reset = () => Object.assign(form, { title: '', note: '', category: '', priority: 'normal' });
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
  if (convertingId.value) return;
  convertingId.value = item._id;
  try {
    const meal = await api.meal.createMeal({ name: item.title, description: item.note || '来自想吃清单', category: item.category || '想吃清单', tags: ['想吃清单'], favorite: true });
    try {
      await api.wishlist.attachMeal(item._id, meal._id || meal.id);
    } catch (_) {
      ElMessage.warning('菜谱已创建，但关联失败，请勿重复创建，稍后检查想吃清单');
      await load();
      return;
    }
    ElMessage.success('已创建并关联菜谱，可继续安排到日历');
    await load();
  } catch (e) { ElMessage.error(e?.error || '转菜品失败'); }
  finally { convertingId.value = ''; }
};
onMounted(load);
</script>

<template>
  <div class="wishlist-page">
    <div class="page-header">
      <div><h1>想吃清单</h1><p>把突然想吃的、对方提到的、周末想试的都先记下来。</p></div>
      <el-button type="primary" @click="dialogVisible = true"><el-icon><Plus /></el-icon>添加想吃</el-button>
    </div>

    <div v-loading="loading" class="board">
      <section v-for="group in grouped" :key="group.status" class="status-column">
        <h2>{{ statusText[group.status] }} <span>{{ group.items.length }}</span></h2>
        <el-empty v-if="!group.items.length" description="暂无" />
        <el-card v-for="item in group.items" :key="item._id" class="wish-card">
          <div class="wish-title"><strong>{{ item.title }}</strong><el-tag>{{ priorityText[item.priority] }}</el-tag></div>
          <p>{{ item.note || '还没有备注' }}</p>
          <div class="vote-row"><el-button link type="warning" @click="vote(item)"><el-icon><Star /></el-icon>{{ item.votes?.length || 0 }} 票</el-button><span>{{ item.category }}</span></div>
          <div class="actions">
            <el-button size="small" :disabled="!!item.mealId" :loading="convertingId === item._id" @click="convertToMeal(item)">{{ item.mealId ? '已关联菜谱' : '转菜品' }}</el-button>
            <el-button size="small" @click="setStatus(item, 'planned')"><el-icon><Calendar /></el-icon>已安排</el-button>
            <el-button size="small" type="success" @click="setStatus(item, 'done')"><el-icon><Check /></el-icon>完成</el-button>
            <el-button size="small" type="danger" @click="remove(item)"><el-icon><Delete /></el-icon></el-button>
          </div>
        </el-card>
      </section>
    </div>

    <el-dialog v-model="dialogVisible" title="添加想吃" width="min(520px, 92vw)">
      <el-form label-position="top">
        <el-form-item label="想吃什么"><el-input v-model="form.title" placeholder="比如：冬阴功火锅、楼下那家牛肉面" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.note" type="textarea" rows="3" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="form.category" placeholder="外食、家常、甜品、周末计划..." /></el-form-item>
        <el-form-item label="优先级"><el-select v-model="form.priority"><el-option label="随缘" value="low" /><el-option label="普通" value="normal" /><el-option label="超想吃" value="high" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="dialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="save">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<style scoped>
.wishlist-page { display: flex; flex-direction: column; gap: 18px; }
.page-header { display: flex; justify-content: space-between; gap: 16px; align-items: center; background: var(--bg-primary); border-radius: 12px; padding: 20px; box-shadow: 0 2px 8px var(--shadow-color); }
h1, h2 { margin: 0; color: var(--text-primary); }
.page-header p { color: var(--text-secondary); margin: 6px 0 0; }
.board { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.status-column { background: var(--bg-primary); border-radius: 12px; padding: 14px; box-shadow: 0 2px 8px var(--shadow-color); display: flex; flex-direction: column; gap: 12px; }
.status-column h2 { display: flex; justify-content: space-between; font-size: 18px; }
.wish-card p { color: var(--text-secondary); }
.wish-title, .vote-row, .actions { display: flex; align-items: center; gap: 8px; justify-content: space-between; flex-wrap: wrap; }
.actions { justify-content: flex-start; }
@media (max-width: 900px) { .board { grid-template-columns: 1fr; } .page-header { flex-direction: column; align-items: stretch; } }
</style>
