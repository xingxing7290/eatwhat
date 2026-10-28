<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Delete, ShoppingCart } from '@element-plus/icons-vue';
import api from '@/services/api';

const loading = ref(false);
const working = ref(false);
const loadError = ref('');
const list = ref({ items: [] });
const weekStart = ref('');
let loadSequence = 0;
const form = reactive({ name: '', amount: '', category: 'other' });
const categoryText = { vegetable: '蔬菜', meat_egg: '肉蛋', staple: '主食', seasoning: '调料', other: '其他' };
const monday = () => { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const groups = computed(() => Object.keys(categoryText).map(key => ({ key, label: categoryText[key], items: (list.value.items || []).filter(item => key === 'other' ? !categoryText[item.category] || item.category === 'other' : item.category === key) })).filter(g => g.items.length));
const purchased = computed(() => (list.value.items || []).filter(item => item.checked).length);
const load = async () => {
  if (!weekStart.value) return;
  const requestedWeek = weekStart.value;
  const sequence = ++loadSequence;
  loading.value = true;
  loadError.value = '';
  list.value = { items: [] };
  try {
    const result = await api.shoppingList.get(requestedWeek);
    if (sequence === loadSequence && weekStart.value === requestedWeek) list.value = result;
  } catch(e) {
    if (sequence === loadSequence && weekStart.value === requestedWeek) loadError.value = e?.error || '加载购物清单失败';
  } finally {
    if (sequence === loadSequence) loading.value = false;
  }
};
const generate = async () => {
  if (!weekStart.value || working.value || loading.value || loadError.value) return;
  working.value = true;
  try {
    if ((list.value.items || []).some(item => !item.manual)) {
      try { await ElMessageBox.confirm('重新生成会替换排餐生成的食材，手动添加的食材会保留。', '重新生成购物清单', { type: 'warning', confirmButtonText: '重新生成', cancelButtonText: '取消' }); } catch (_) { return; }
    }
    list.value = await api.shoppingList.generate(weekStart.value); ElMessage.success('已按本周排餐生成购物清单');
  } catch(e) { ElMessage.error(e?.error || '生成失败'); } finally { working.value = false; }
};
const addItem = async () => { if (!form.name.trim()) return ElMessage.warning('请输入食材名称'); if (!weekStart.value || working.value || loading.value || loadError.value) return; working.value = true; try { list.value = await api.shoppingList.addItem({ ...form, name: form.name.trim(), weekStart: weekStart.value }); form.name=''; form.amount=''; form.category='other'; } catch(e) { ElMessage.error(e?.error || '添加失败'); } finally { working.value = false; } };
const toggle = async (item) => { if (working.value || loading.value || loadError.value) return; working.value = true; try { list.value = await api.shoppingList.updateItem(item._id, { weekStart: weekStart.value, checked: !item.checked }); } catch(e) { ElMessage.error(e?.error || '更新失败'); } finally { working.value = false; } };
const remove = async (item) => { if (working.value || loading.value || loadError.value) return; working.value = true; try { await api.shoppingList.deleteItem(item._id, weekStart.value); await load(); } catch(e) { ElMessage.error(e?.error || '删除失败'); } finally { working.value = false; } };
const clearPurchased = async () => { if (!purchased.value || working.value || loading.value || loadError.value) return; working.value = true; try { try { await ElMessageBox.confirm(`将删除 ${purchased.value} 项已购食材。`, '清空已购', { type: 'warning', confirmButtonText: '清空', cancelButtonText: '取消' }); } catch (_) { return; } list.value = await api.shoppingList.clearPurchased(weekStart.value); ElMessage.success('已清空已购'); } catch(e) { ElMessage.error(e?.error || '清空失败'); } finally { working.value = false; } };
onMounted(() => { weekStart.value = monday(); load(); });
</script>

<template>
  <div class="shopping-page" v-loading="loading">
    <div class="page-header"><div><span class="eyebrow">SHOPPING LIST · 本周采购</span><h1>好好买菜，轻松做饭</h1><p>从排餐汇总食材，也可以补充自己需要的东西。</p></div><div class="actions"><el-date-picker v-model="weekStart" type="date" value-format="YYYY-MM-DD" :clearable="false" :disabled="loading || working" aria-label="选择购物清单日期" @change="load" /><el-button type="primary" :disabled="loading || working || !!loadError" @click="generate"><el-icon><ShoppingCart /></el-icon>从排餐生成</el-button><el-button :disabled="!purchased || working || loading || !!loadError" @click="clearPurchased">清空已购</el-button></div></div>
    <div v-if="loadError" class="load-error" role="alert">{{ loadError }} <el-button link type="primary" @click="load">重试</el-button></div>
    <template v-else>
    <div class="progress-card"><div><span>采购进度</span><strong>{{ purchased }} / {{ list.items?.length || 0 }}</strong><small>项已买好</small></div><el-progress :percentage="list.items?.length ? Math.round(purchased / list.items.length * 100) : 0" :show-text="false" /></div>
    <el-card><div class="add-row"><el-input v-model="form.name" placeholder="食材名称" :disabled="working" @keyup.enter="addItem" /><el-input v-model="form.amount" placeholder="数量/备注" :disabled="working" @keyup.enter="addItem" /><el-select v-model="form.category" :disabled="working"><el-option v-for="(label,key) in categoryText" :key="key" :label="label" :value="key" /></el-select><el-button type="primary" :disabled="working || loading" @click="addItem"><el-icon><Plus /></el-icon>添加食材</el-button></div></el-card>
    <el-empty v-if="!loading && !list.items?.length" description="还没有购物项，先从排餐生成或手动添加" />
    <section v-else class="group-grid"><el-card v-for="group in groups" :key="group.key"><template #header>{{ group.label }}</template><div v-for="item in group.items" :key="item._id" class="item-row" :class="{ checked: item.checked }"><el-checkbox :model-value="item.checked" :disabled="working" @change="() => toggle(item)"><strong>{{ item.name }}</strong><span>{{ item.amount }}</span></el-checkbox><div class="item-actions"><el-tag size="small" :type="item.manual ? 'warning' : 'info'">{{ item.manual ? '手动' : '排餐' }}</el-tag><el-button type="danger" link :disabled="working" :aria-label="`删除${item.name}`" @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div></el-card></section>
    </template>
  </div>
</template>

<style scoped>
.shopping-page { display: flex; flex-direction: column; gap: 18px; }.page-header{display:flex;justify-content:space-between;gap:20px;align-items:center;background:var(--bg-primary);border:1px solid var(--border-color);border-radius:26px;padding:clamp(22px,3vw,36px);box-shadow:0 12px 28px var(--shadow-color)}h1{margin:8px 0;font-family:Georgia,'Songti SC',serif;font-size:clamp(26px,3vw,36px)}.eyebrow{color:var(--secondary-color);font-size:11px;letter-spacing:.14em;font-weight:800}.page-header p{color:var(--text-secondary)}.actions,.add-row{display:flex;gap:10px;flex-wrap:wrap}.actions .el-button,.add-row .el-button{margin:0}.add-row .el-input{flex:1;min-width:160px}.progress-card{display:flex;align-items:center;gap:24px;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:20px;padding:18px 24px}.progress-card>div:first-child{display:flex;align-items:baseline;gap:8px;white-space:nowrap;color:var(--text-secondary)}.progress-card strong{color:var(--secondary-color);font-size:26px}.progress-card .el-progress{flex:1}.load-error{padding:18px;border:1px solid var(--border-color);border-radius:18px;background:var(--bg-primary);color:var(--text-secondary)}.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}.item-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)}.item-row.checked :deep(.el-checkbox__label){color:var(--text-secondary);text-decoration:line-through}.item-row .el-checkbox span span{margin-left:8px;color:var(--text-secondary)}.item-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}@media(max-width:720px){.page-header{flex-direction:column;align-items:stretch}.add-row{flex-direction:column}.progress-card{align-items:stretch;flex-direction:column;gap:12px}.group-grid{grid-template-columns:1fr}}
</style>
