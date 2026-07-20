<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { Plus, Delete, ShoppingCart } from '@element-plus/icons-vue';
import api from '@/services/api';

const loading = ref(false);
const list = ref({ items: [] });
const weekStart = ref('');
const form = reactive({ name: '', amount: '', category: 'other' });
const categoryText = { vegetable: '蔬菜', meat_egg: '肉蛋', staple: '主食', seasoning: '调料', other: '其他' };
const monday = () => { const d = new Date(); const day = d.getDay() || 7; d.setDate(d.getDate() - day + 1); return d.toISOString().slice(0, 10); };
const groups = computed(() => Object.keys(categoryText).map(key => ({ key, label: categoryText[key], items: (list.value.items || []).filter(item => item.category === key) })).filter(g => g.items.length));
const load = async () => { loading.value = true; try { list.value = await api.shoppingList.get(weekStart.value); } catch(e) { ElMessage.error(e?.error || '加载购物清单失败'); } finally { loading.value = false; } };
const generate = async () => { loading.value = true; try { list.value = await api.shoppingList.generate(weekStart.value); ElMessage.success('已按本周排餐生成购物清单'); } catch(e) { ElMessage.error(e?.error || '生成失败'); } finally { loading.value = false; } };
const addItem = async () => { if (!form.name.trim()) return ElMessage.warning('请输入食材名称'); try { list.value = await api.shoppingList.addItem({ ...form, weekStart: weekStart.value }); form.name=''; form.amount=''; form.category='other'; } catch(e) { ElMessage.error(e?.error || '添加失败'); } };
const toggle = async (item) => { try { list.value = await api.shoppingList.updateItem(item._id, { weekStart: weekStart.value, checked: !item.checked }); } catch(e) { ElMessage.error(e?.error || '更新失败'); } };
const remove = async (item) => { try { await api.shoppingList.deleteItem(item._id, weekStart.value); await load(); } catch(e) { ElMessage.error(e?.error || '删除失败'); } };
const clearPurchased = async () => { try { list.value = await api.shoppingList.clearPurchased(weekStart.value); ElMessage.success('已清空已购'); } catch(e) { ElMessage.error(e?.error || '清空失败'); } };
onMounted(() => { weekStart.value = monday(); load(); });
</script>

<template>
  <div class="shopping-page" v-loading="loading">
    <div class="page-header"><div><h1>购物清单</h1><p>按本周排餐自动汇总食材，也可以手动补充。</p></div><div class="actions"><el-date-picker v-model="weekStart" type="date" value-format="YYYY-MM-DD" @change="load" /><el-button type="primary" @click="generate"><el-icon><ShoppingCart /></el-icon>从排餐生成</el-button><el-button @click="clearPurchased">清空已购</el-button></div></div>
    <el-card><div class="add-row"><el-input v-model="form.name" placeholder="食材名称" /><el-input v-model="form.amount" placeholder="数量/备注" /><el-select v-model="form.category"><el-option v-for="(label,key) in categoryText" :key="key" :label="label" :value="key" /></el-select><el-button type="primary" @click="addItem"><el-icon><Plus /></el-icon></el-button></div></el-card>
    <el-empty v-if="!list.items?.length" description="还没有购物项，先从排餐生成或手动添加" />
    <section v-else class="group-grid"><el-card v-for="group in groups" :key="group.key"><template #header>{{ group.label }}</template><div v-for="item in group.items" :key="item._id" class="item-row" :class="{ checked: item.checked }"><el-checkbox :model-value="item.checked" @change="() => toggle(item)"><strong>{{ item.name }}</strong><span>{{ item.amount }}</span></el-checkbox><div class="item-actions"><el-tag size="small" :type="item.manual ? 'warning' : 'info'">{{ item.manual ? '手动' : '排餐' }}</el-tag><el-button type="danger" link @click="remove(item)"><el-icon><Delete /></el-icon></el-button></div></div></el-card></section>
  </div>
</template>

<style scoped>
.shopping-page { display: flex; flex-direction: column; gap: 18px; }.page-header{display:flex;justify-content:space-between;gap:14px;align-items:center;background:var(--bg-primary);border-radius:18px;padding:20px;box-shadow:0 12px 28px var(--shadow-color)}h1{margin:0}.page-header p{color:var(--text-secondary)}.actions,.add-row{display:flex;gap:10px;flex-wrap:wrap}.add-row .el-input{flex:1;min-width:160px}.group-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}.item-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-bottom:1px solid var(--border-light)}.item-row.checked{opacity:.58;text-decoration:line-through}.item-row span{margin-left:8px;color:var(--text-secondary)}.item-actions{display:flex;align-items:center;gap:8px}@media(max-width:720px){.page-header{flex-direction:column;align-items:stretch}.add-row{flex-direction:column}}
</style>
