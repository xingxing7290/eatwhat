<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Refresh, Link, Food } from '@element-plus/icons-vue';
import api from '@/services/api';
import { useDraftGuard } from '@/composables/useDraftGuard';

const loading = ref(false); const working = ref(false); const listError = ref('');
const capabilities = ref(null); const capabilitiesError = ref(''); const sessions = ref([]);
const search = ref(''); const statusFilter = ref(''); const listPage = ref(1); const listPagination = ref(null); const paginationAvailable = ref(false);
const createOpen = ref(false); const detailOpen = ref(false); const detailLoading = ref(false);
const selectedId = ref(''); const detail = ref(null); const detailError = ref('');
const pending = ref(null); const mutationIssue = ref(null); const editing = ref(false);
const now = ref(Date.now());
const form = reactive({ title: '', eventAt: null, hours: 72 });
const editForm = reactive({ title: '', eventAt: null });
let listSequence = 0; let detailSequence = 0; let alive = true; let clockTimer; let filterTimer;
const statusLabels = { open: '正在点菜', locked: '已锁单', completed: '已完成', cancelled: '已取消', expired: '链接已过期' };
const statusTypes = { open: 'success', locked: 'warning', completed: 'info', cancelled: 'info', expired: 'info' };
const visibleSessions = computed(() => paginationAvailable.value ? sessions.value : sessions.value.filter(item => (!statusFilter.value || effectiveStatus(item) === statusFilter.value) && (!search.value.trim() || item.title.toLowerCase().includes(search.value.trim().toLowerCase()))));
const hasFilters = computed(() => !!(search.value.trim() || statusFilter.value));
const safeCreate = computed(() => capabilities.value?.supportsIdempotentSessionCreate === true && /^[a-f0-9]{24}$/.test(capabilities.value?.householdId || ''));
const pendingKey = computed(() => safeCreate.value ? `eatwhat.hostGuest.create.${capabilities.value.householdId}` : '');
const validVersion = item => item?.supportsConditionalSession === true && item.editVersion && (item.editVersion.revision === null || (typeof item.editVersion.revision === 'string' && !!item.editVersion.revision)) && (item.editVersion.updatedAt === null || (typeof item.editVersion.updatedAt === 'string' && Number.isFinite(Date.parse(item.editVersion.updatedAt))));
const canChange = computed(() => capabilities.value?.supportsConditionalSession === true && validVersion(detail.value) && !loading.value && !working.value && !detailLoading.value && !detailError.value && !mutationIssue.value);
const linkExpired = computed(() => !detail.value?.expiresAt || !Number.isFinite(Date.parse(detail.value.expiresAt)) || Date.parse(detail.value.expiresAt) <= now.value);
const effectiveStatus = item => item?.status === 'open' && item.expiresAt && Number.isFinite(Date.parse(item.expiresAt)) && Date.parse(item.expiresAt) <= now.value ? 'expired' : item?.status;
const detailStatus = computed(() => effectiveStatus(detail.value));
const canShare = computed(() => !loading.value && !detailLoading.value && !detailError.value && !mutationIssue.value && !linkExpired.value && ['open', 'locked'].includes(detail.value?.status) && !!safeShareUrl(detail.value?.shareUrl));
const dateText = value => { if (!value) return '未设置'; const date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(date) : '时间不可用'; };
const dateValue = value => { if (!value) return null; const date = new Date(value); return Number.isFinite(date.getTime()) ? date : null; };
const normalizedTitle = value => String(value || '').trim().replace(/\s+/g, ' ').slice(0, 80);
const dateIso = value => value instanceof Date && Number.isFinite(value.getTime()) ? value.toISOString() : null;
const createDirty = computed(() => createOpen.value && (!!form.title.trim() || !!form.eventAt || form.hours !== 72));
const editDirty = computed(() => editing.value && (normalizedTitle(editForm.title) !== normalizedTitle(detail.value?.title) || dateIso(editForm.eventAt) !== (detail.value?.eventAt ? dateIso(dateValue(detail.value.eventAt)) : null)));
const uncertain = computed(() => !!pending.value || !!mutationIssue.value);
useDraftGuard({ dirty: computed(() => createDirty.value || editDirty.value), busy: working, uncertain, label: '宴请点菜' });

function safeShareUrl(value) {
  try { const url = new URL(String(value || '')); return ['https:', 'http:'].includes(url.protocol) && /(?:^|\/)guest-order\/[^/]+\/?$/.test(url.pathname) ? url.href : ''; }
  catch (_) { return ''; }
}
function validPending(value, home) {
  return !!value && typeof value.title === 'string' && value.title.length <= 80 && (value.eventAt === null || (typeof value.eventAt === 'string' && Number.isFinite(Date.parse(value.eventAt)))) && typeof value.expiresAt === 'string' && Number.isFinite(Date.parse(value.expiresAt)) && value.expectedHouseholdId === home && /^[A-Za-z0-9_-]{43}$/.test(value.creationKey || '');
}
function readPending() {
  if (!pendingKey.value) return null;
  let raw; try { raw = sessionStorage.getItem(pendingKey.value); } catch (_) { return { invalid: true, unavailable: true }; }
  if (!raw) return null;
  try { const value = JSON.parse(raw); return validPending(value, capabilities.value.householdId) ? value : { invalid: true }; } catch (_) { return { invalid: true }; }
}
function savePending(value) {
  if (!validPending(value, capabilities.value?.householdId) || !pendingKey.value) throw new Error('安全创建数据无效');
  const text = JSON.stringify(value); sessionStorage.setItem(pendingKey.value, text);
  if (sessionStorage.getItem(pendingKey.value) !== text) throw new Error('无法保存安全创建凭证');
  pending.value = value;
}
function clearPending() {
  if (!pendingKey.value) throw new Error('家庭信息不可用');
  sessionStorage.removeItem(pendingKey.value);
  if (sessionStorage.getItem(pendingKey.value) !== null) throw new Error('无法清除安全创建凭证');
  pending.value = null;
}
function acceptSession(item, withOrders = false, listItem = false) {
  if (!item || typeof item.id !== 'string' || !item.id || typeof item.title !== 'string' || !statusLabels[item.status]) throw new Error('宴请数据不完整');
  if (capabilities.value?.householdId && item.householdId !== capabilities.value.householdId) throw new Error('家庭已变化，请重新加载宴请');
  const count = value => Number.isSafeInteger(value) && value >= 0;
  const quantity = value => Number.isSafeInteger(value) && value > 0;
  if (listItem && (!count(item.guestCount) || !count(item.totalQuantity))) throw new Error('宴请列表统计不完整');
  if (withOrders) {
    if (!Array.isArray(item.orders) || !item.summary || !count(item.summary.guestCount) || !count(item.summary.totalQuantity) || !Array.isArray(item.summary.dishes) || item.summary.dishes.some(dish => !dish || typeof dish.name !== 'string' || !dish.name.trim() || !quantity(dish.quantity) || !Array.isArray(dish.guestNames) || dish.guestNames.some(name => typeof name !== 'string') || !Array.isArray(dish.notes) || dish.notes.some(note => typeof note !== 'string')) || item.orders.some(order => !order || typeof order.id !== 'string' || !order.id || typeof order.guestName !== 'string' || !Array.isArray(order.items) || !order.items.length || order.items.some(dish => !dish || typeof dish.name !== 'string' || !dish.name.trim() || !quantity(dish.quantity)))) throw new Error('点菜汇总数据不完整');
    const orderTotal = item.orders.reduce((sum, order) => sum + order.items.reduce((subtotal, dish) => subtotal + dish.quantity, 0), 0);
    const summaryTotal = item.summary.dishes.reduce((sum, dish) => sum + dish.quantity, 0);
    if (new Set(item.orders.map(order => order.id)).size !== item.orders.length || item.summary.guestCount !== item.orders.length || !Number.isSafeInteger(orderTotal) || !Number.isSafeInteger(summaryTotal) || orderTotal !== item.summary.totalQuantity || summaryTotal !== item.summary.totalQuantity) throw new Error('点菜汇总与客人点菜单不一致');
  }
  return item;
}
async function load() {
  clearTimeout(filterTimer);
  const requestedPage = listPage.value;
  const params = { page: requestedPage, limit: 12 };
  if (search.value.trim()) params.search = search.value.trim();
  if (statusFilter.value) params.status = statusFilter.value;
  const sequence = ++listSequence; loading.value = true; listError.value = ''; capabilitiesError.value = '';
  const [caps, result] = await Promise.allSettled([api.guestOrder.capabilities(), api.guestOrder.list(params)]);
  if (!alive || sequence !== listSequence) return;
  if (caps.status === 'fulfilled' && caps.value && /^[a-f0-9]{24}$/.test(caps.value.householdId || '')) {
    const oldHome = capabilities.value?.householdId;
    capabilities.value = caps.value;
    if (oldHome && oldHome !== caps.value.householdId) { detailOpen.value = false; detail.value = null; selectedId.value = ''; mutationIssue.value = null; editing.value = false; }
    pending.value = readPending();
  } else { capabilities.value = null; pending.value = null; capabilitiesError.value = '服务器未提供安全宴请能力，当前只能查看。'; }
  if (result.status === 'fulfilled') {
    try {
      const supportsPagination = capabilities.value?.supportsSessionPagination === true;
      const meta = result.value?.pagination;
      if (!Array.isArray(result.value?.sessions)) throw new Error('宴请列表不完整');
      if (supportsPagination) {
        if (!meta || result.value.householdId !== capabilities.value.householdId || meta.page !== requestedPage || meta.limit !== 12 || !Number.isSafeInteger(meta.total) || meta.total < 0 || meta.totalPages !== Math.max(1, Math.ceil(meta.total / 12)) || result.value.sessions.length > 12) throw new Error('宴请分页数据不完整，请重试');
        if (requestedPage > meta.totalPages) { listPage.value = meta.totalPages; return load(); }
        if (result.value.sessions.length !== Math.min(12, Math.max(0, meta.total - (requestedPage - 1) * 12))) throw new Error('宴请列表可能已变化，请重新加载');
        listPagination.value = meta; paginationAvailable.value = true;
      } else {
        if (meta || result.value.sessions.length > 30) throw new Error('无法确认宴请列表范围，请重试');
        listPagination.value = null; paginationAvailable.value = false; listPage.value = 1;
      }
      const rows = result.value.sessions.map(item => acceptSession(item, false, true));
      if (new Set(rows.map(item => item.id)).size !== rows.length) throw new Error('宴请列表存在重复记录');
      sessions.value = rows;
    } catch (error) { sessions.value = []; listPagination.value = null; paginationAvailable.value = false; listError.value = error.message; }
  } else { sessions.value = []; listPagination.value = null; paginationAvailable.value = false; listError.value = result.reason?.error || result.reason?.message || '宴请列表加载失败'; }
  loading.value = false;
}
function queueFilters() {
  clearTimeout(filterTimer); listSequence++; listPage.value = 1; loading.value = true; listError.value = '';
  filterTimer = setTimeout(load, 250);
}
function clearFilters() { search.value = ''; statusFilter.value = ''; queueFilters(); }
function changePage(next) { if (loading.value || !listPagination.value || next < 1 || next > listPagination.value.totalPages) return; listPage.value = next; load(); }
async function readDetail(id, review = false) {
  const sequence = ++detailSequence; detailLoading.value = true; detailError.value = '';
  if (review && mutationIssue.value) mutationIssue.value.checked = false;
  try {
    const result = await api.guestOrder.get(id);
    if (!alive || sequence !== detailSequence || selectedId.value !== id) return;
    const item = acceptSession(result?.session, true);
    if (item.id !== id) throw new Error('宴请记录不匹配');
    detail.value = item;
    if (review && mutationIssue.value) mutationIssue.value.checked = true;
  } catch (error) {
    if (alive && sequence === detailSequence) {
      detailError.value = error?.error || error?.message || '宴请详情加载失败';
      if (review && mutationIssue.value && error?.code === 'GUEST_SESSION_NOT_FOUND') { mutationIssue.value.checked = true; mutationIssue.value.message = '当前家庭未找到该宴请，可能已被移除或家庭已变化；本页编辑草稿仍保留。'; }
    }
  }
  finally { if (alive && sequence === detailSequence) detailLoading.value = false; }
}
async function openDetail(item) {
  if (working.value || mutationIssue.value) return;
  selectedId.value = item.id; detail.value = null; detailOpen.value = true; editing.value = false;
  await readDetail(item.id);
}
async function closeDetail(done) {
  if (working.value || mutationIssue.value) return ElMessage.warning('请先完成操作或核对最新状态');
  if (editDirty.value) { try { await ElMessageBox.confirm('关闭会放弃尚未保存的宴请信息。', '放弃修改？', { type: 'warning', confirmButtonText: '放弃修改', cancelButtonText: '继续编辑' }); } catch (_) { return; } }
  editing.value = false; detailSequence++; detail.value = null; selectedId.value = ''; done();
}
async function closeCreate(done) {
  if (working.value || pending.value) return ElMessage.warning('请先完成或核对安全创建');
  if (createDirty.value) { try { await ElMessageBox.confirm('关闭会放弃尚未提交的宴请信息。', '放弃创建？', { type: 'warning', confirmButtonText: '放弃创建', cancelButtonText: '继续填写' }); } catch (_) { return; } }
  form.title = ''; form.eventAt = null; form.hours = 72; done();
}
async function createSession() {
  if (!safeCreate.value || working.value || pending.value) return;
  const title = normalizedTitle(form.title) || '来家里吃饭';
  const eventAt = dateIso(form.eventAt);
  if (form.eventAt && !eventAt) return ElMessage.warning('请选择有效的聚餐时间');
  try {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const creationKey = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    savePending({ title, eventAt, expiresAt: new Date(Date.now() + form.hours * 3600000).toISOString(), expectedHouseholdId: capabilities.value.householdId, creationKey });
  } catch (_) { return ElMessage.error('无法保存安全创建凭证，请允许会话存储后重试'); }
  await retryCreate();
}
async function retryCreate() {
  if (working.value || !validPending(pending.value, capabilities.value?.householdId)) return;
  working.value = true;
  try {
    const result = await api.guestOrder.createSafe(pending.value);
    const item = acceptSession(result?.session, true);
    if (!validVersion(item) || !safeShareUrl(item.shareUrl)) throw new Error('创建结果不完整');
    try { clearPending(); } catch (_) { ElMessage.warning('已创建，但无法清除安全凭证，可再次安全核对'); }
    form.title = ''; form.eventAt = null; form.hours = 72; createOpen.value = false;
    selectedId.value = item.id; detail.value = item; detailOpen.value = true; editing.value = false;
    ElMessage.success(result.replayed ? '已找回原来的宴请' : '宴请已创建');
    await load();
  } catch (error) { ElMessage.warning(error?.error || error?.message || '创建结果未确认，请使用安全重试'); }
  finally { working.value = false; }
}
async function abandonPending() {
  if (!pending.value || working.value) return;
  try { await ElMessageBox.confirm('原请求仍可能完成。放弃后再次创建可能产生重复宴请，请先与家人核对。', '放弃安全重试？', { type: 'warning', confirmButtonText: '已核对并放弃', cancelButtonText: '继续保留' }); } catch (_) { return; }
  try { clearPending(); } catch (_) { ElMessage.error('无法清除安全凭证，请检查浏览器存储'); }
}
async function changeSession(changes, label, expectedCheck) {
  if (!canChange.value) return;
  const id = detail.value.id; const version = detail.value.editVersion;
  working.value = true;
  try {
    const result = await api.guestOrder.update(id, { ...changes, expectedEditVersion: version });
    const updated = acceptSession(result?.session, true);
    if (updated.id !== id || !validVersion(updated) || JSON.stringify(updated.editVersion) === JSON.stringify(version) || (expectedCheck && !expectedCheck(updated))) throw new Error('更新响应不完整');
    detail.value = updated; editing.value = false; ElMessage.success(`${label}成功`); await load();
  } catch (error) { mutationIssue.value = { checked: false, message: error?.code === 'GUEST_SESSION_CONFLICT' ? '其他成员已修改宴请，本次操作未执行。' : '操作结果未确认，请读取最新状态并核对。' }; }
  finally { working.value = false; }
}
async function setStatus(status) {
  now.value = Date.now();
  if (!canChange.value) return;
  if (status === 'locked' && detailStatus.value !== 'open') return ElMessage.warning('链接已过期，请刷新后核对');
  if (status === 'open' && linkExpired.value) return ElMessage.warning('链接已过期，不能继续点菜');
  const messages = { locked: '锁单会阻止后续提交或修改；已在处理的请求仍可能完成。', open: '恢复后客人可继续点菜。', completed: '完成后不能再重新开放点菜；已在处理的请求仍可能完成。', cancelled: '取消后链接不能继续点菜；已在处理的请求仍可能完成。' };
  try { await ElMessageBox.confirm(messages[status], `${statusLabels[status]}？`, { type: 'warning', confirmButtonText: '确认', cancelButtonText: '返回' }); } catch (_) { return; }
  now.value = Date.now();
  if ((status === 'open' && linkExpired.value) || (status === 'locked' && detailStatus.value !== 'open')) return ElMessage.warning('链接状态已变化，请刷新后核对');
  await changeSession({ status }, '状态更新', item => item.storedStatus === status);
}
function startEdit() { if (!canChange.value) return; editForm.title = detail.value.title; editForm.eventAt = dateValue(detail.value.eventAt); editing.value = true; }
async function saveEdit() {
  if (!canChange.value || !editing.value) return;
  const title = normalizedTitle(editForm.title); if (!title) return ElMessage.warning('请填写宴请名称');
  const eventAt = dateIso(editForm.eventAt); if (editForm.eventAt && !eventAt) return ElMessage.warning('请选择有效的聚餐时间');
  await changeSession({ title, eventAt }, '宴请信息保存', item => item.title === title && dateIso(dateValue(item.eventAt)) === eventAt);
}
async function cancelEdit() {
  if (editDirty.value) { try { await ElMessageBox.confirm('将放弃尚未保存的宴请信息。', '放弃修改？', { type: 'warning', confirmButtonText: '放弃修改', cancelButtonText: '继续编辑' }); } catch (_) { return; } }
  editing.value = false;
}
async function rotateLink() {
  now.value = Date.now();
  if (!canChange.value || !detail.value?.shareUrl || linkExpired.value || !['open', 'locked'].includes(detailStatus.value)) return;
  try { await ElMessageBox.confirm('更换后旧链接不能发起新请求；已在处理的请求仍可能完成，已提交的点菜单保留。', '更换点菜链接？', { type: 'warning', confirmButtonText: '确认更换', cancelButtonText: '取消' }); } catch (_) { return; }
  now.value = Date.now();
  if (linkExpired.value || !['open', 'locked'].includes(detailStatus.value)) return ElMessage.warning('链接状态已变化，本次没有更换');
  const id = detail.value.id; const version = detail.value.editVersion; const previous = detail.value.shareUrl; working.value = true;
  try {
    const result = await api.guestOrder.rotate(id, version); const item = acceptSession(result?.session);
    if (item.id !== id || !validVersion(item) || !safeShareUrl(item.shareUrl) || item.shareUrl === previous || JSON.stringify(item.editVersion) === JSON.stringify(version)) throw new Error('更换结果不完整');
    await readDetail(id); if (detailError.value) throw new Error('无法核对新链接');
    ElMessage.success('点菜链接已更换'); await load();
  } catch (error) { mutationIssue.value = { checked: false, message: error?.code === 'GUEST_SESSION_CONFLICT' ? '其他成员已修改宴请，本次操作未执行。' : '链接更换结果未确认，请读取最新状态并核对。' }; }
  finally { working.value = false; }
}
async function finishReview() {
  if (!mutationIssue.value?.checked || working.value) return;
  try { await ElMessageBox.confirm('先前请求仍可能稍后完成。请确认已核对最新状态及链接；若家庭已变化，当前编辑草稿将关闭。', '结束核对？', { type: 'warning', confirmButtonText: '已核对，继续', cancelButtonText: '继续核对' }); } catch (_) { return; }
  mutationIssue.value = null;
  await load();
}
async function copyLink() {
  now.value = Date.now();
  const url = safeShareUrl(detail.value?.shareUrl); if (!url || !canShare.value) return;
  try { await navigator.clipboard.writeText(url); ElMessage.success('点菜链接已复制'); }
  catch (_) { ElMessage.warning('无法自动复制，请手动选择下方链接'); }
}
const refreshClock = () => { now.value = Date.now(); };
onMounted(() => { load(); window.addEventListener('focus', refreshClock); document.addEventListener('visibilitychange', refreshClock); clockTimer = setInterval(refreshClock, 30000); });
onBeforeUnmount(() => { alive = false; listSequence++; detailSequence++; window.removeEventListener('focus', refreshClock); document.removeEventListener('visibilitychange', refreshClock); clearInterval(clockTimer); clearTimeout(filterTimer); });
</script>

<template>
  <div class="guest-host-page">
    <section class="hero"><div><span class="eyebrow">GATHER TOGETHER · 家庭宴请</span><h1>邀请大家，点一桌好菜</h1><p>创建专属菜单，分享给客人，再一起查看大家想吃什么。</p></div><div class="hero-actions"><el-button :loading="loading" :disabled="working" @click="load"><el-icon><Refresh /></el-icon>刷新</el-button><el-button type="primary" :disabled="!safeCreate || loading || working || !!pending" @click="createOpen = true"><el-icon><Plus /></el-icon>创建宴请</el-button></div></section>
    <el-alert v-if="capabilitiesError" type="warning" :closable="false" show-icon :title="capabilitiesError" />
    <el-alert v-if="pending" type="warning" :closable="false" show-icon :title="pending.invalid ? '无法读取安全创建凭证，请检查浏览器存储并与家人核对。' : '有一份宴请的创建结果待核对。安全重试会使用原内容，不会重复创建。'"><div class="alert-actions"><el-button link type="primary" :disabled="working || !!pending.invalid" @click="retryCreate">安全重试</el-button><el-button link :disabled="working" @click="abandonPending">放弃安全重试</el-button></div></el-alert>
    <div class="section-head"><div><span class="eyebrow">YOUR GATHERINGS</span><h2>我的宴请</h2></div><span class="muted" aria-live="polite">{{ loading ? '加载中' : listError ? '暂不可用' : `${paginationAvailable ? listPagination.total : visibleSessions.length} 场` }}</span></div>
    <div class="list-filters"><el-input v-model="search" clearable maxlength="80" aria-label="搜索宴请名称" placeholder="搜索宴请名称" :disabled="working" @input="queueFilters" /><el-select v-model="statusFilter" aria-label="筛选宴请状态" placeholder="全部状态" :disabled="working" @change="queueFilters"><el-option label="全部状态" value="" /><el-option label="正在点菜" value="open" /><el-option label="已锁单" value="locked" /><el-option label="已完成" value="completed" /><el-option label="已取消" value="cancelled" /><el-option label="链接已过期" value="expired" /></el-select><el-button v-if="hasFilters" :disabled="working" @click="clearFilters">清除筛选</el-button></div>
    <p v-if="!loading && !listError && !paginationAvailable && sessions.length === 30" class="legacy-note">当前服务器仅提供最近 30 场宴请，搜索和筛选结果可能不完整。</p>
    <nav v-if="!loading && !listError && listPagination && listPagination.totalPages > 1" class="list-pagination top" aria-label="宴请顶部分页"><el-button :disabled="working || listPage <= 1" aria-label="上一页（顶部）" @click="changePage(listPage - 1)">上一页</el-button><span>第 {{ listPage }} / {{ listPagination.totalPages }} 页</span><el-button :disabled="working || listPage >= listPagination.totalPages" aria-label="下一页（顶部）" @click="changePage(listPage + 1)">下一页</el-button></nav>
    <div v-if="listError" class="empty-card" role="alert"><p>{{ listError }}</p><el-button @click="load">重新加载</el-button></div>
    <div v-else-if="loading" class="empty-card">正在加载宴请…</div>
    <div v-else-if="!visibleSessions.length" class="empty-card"><el-icon :size="34"><Food /></el-icon><template v-if="hasFilters"><h3>没有找到匹配的宴请</h3><p>试试其他名称或状态。</p><el-button @click="clearFilters">清除筛选</el-button></template><template v-else><h3>还没有宴请</h3><p>创建一场聚餐，邀请客人挑选喜欢的菜。</p><el-button type="primary" :disabled="!safeCreate || !!pending" @click="createOpen = true">创建第一场宴请</el-button></template></div>
    <div v-else class="session-grid"><article v-for="item in visibleSessions" :key="item.id" class="session-card"><div class="card-top"><el-tag :type="statusTypes[effectiveStatus(item)]" round>{{ statusLabels[effectiveStatus(item)] }}</el-tag><span>有效至 {{ dateText(item.expiresAt) }}</span></div><h3>{{ item.title }}</h3><p>聚餐时间：{{ dateText(item.eventAt) }}</p><div class="card-bottom"><div><strong>{{ item.guestCount }}</strong><small> 份点菜单</small><strong>{{ item.totalQuantity }}</strong><small> 份菜</small></div><el-button :disabled="working || !!mutationIssue" @click="openDetail(item)">查看详情</el-button></div></article></div>
    <nav v-if="!loading && !listError && listPagination && listPagination.totalPages > 1" class="list-pagination" aria-label="宴请分页"><el-button :disabled="working || listPage <= 1" @click="changePage(listPage - 1)">上一页</el-button><span>第 {{ listPage }} / {{ listPagination.totalPages }} 页</span><el-button :disabled="working || listPage >= listPagination.totalPages" @click="changePage(listPage + 1)">下一页</el-button></nav>

    <el-dialog v-model="createOpen" title="创建宴请" width="min(560px, 94vw)" :before-close="closeCreate" :close-on-click-modal="false" :close-on-press-escape="!working"><el-alert v-if="pending" type="warning" :closable="false" show-icon title="创建结果待核对，可安全重试原内容。"><div class="alert-actions"><el-button link type="primary" :disabled="working || !!pending.invalid" @click="retryCreate">安全重试</el-button><el-button link :disabled="working" @click="abandonPending">放弃安全重试</el-button></div></el-alert><el-form label-position="top"><el-form-item label="宴请名称"><el-input v-model="form.title" maxlength="80" show-word-limit placeholder="例如：周末家庭聚餐" :disabled="working || !!pending" /></el-form-item><el-form-item label="聚餐时间（选填）"><el-date-picker v-model="form.eventAt" type="datetime" placeholder="选择日期和时间" aria-label="聚餐时间" :disabled="working || !!pending" style="width:100%" /></el-form-item><el-form-item label="链接有效期"><el-select v-model="form.hours" :disabled="working || !!pending" style="width:100%"><el-option :value="24" label="24 小时" /><el-option :value="72" label="3 天" /><el-option :value="168" label="7 天" /></el-select></el-form-item></el-form><p class="dialog-note">链接仅供受邀客人使用；创建后可复制或更换。</p><template #footer><el-button :disabled="working || !!pending" @click="closeCreate(() => createOpen = false)">取消</el-button><el-button type="primary" :loading="working" :disabled="!!pending || !safeCreate" @click="createSession">创建并查看链接</el-button></template></el-dialog>

    <el-dialog v-model="detailOpen" title="宴请详情" width="min(760px, 94vw)" :before-close="closeDetail" :close-on-click-modal="false" :close-on-press-escape="!working"><div v-if="detailLoading && !detail" class="empty-card">正在加载详情…</div><el-alert v-if="detailError" type="error" :closable="false" show-icon :title="detailError"><p v-if="detail">以下是上次成功加载的内容，可能已过期；请重试后核对。</p><el-button link type="primary" :disabled="working" @click="readDetail(selectedId, !!mutationIssue)">重试</el-button></el-alert><el-alert v-if="mutationIssue" type="warning" :closable="false" show-icon :title="mutationIssue.message"><div class="alert-actions"><el-button link type="primary" :loading="detailLoading" :disabled="working" @click="readDetail(selectedId, true)">读取最新状态</el-button><el-button v-if="mutationIssue.checked" link type="primary" :disabled="working" @click="finishReview">已核对，继续</el-button></div></el-alert>
      <template v-if="detail"><div class="detail-head"><div><el-tag :type="statusTypes[detailStatus]" round>{{ statusLabels[detailStatus] }}</el-tag><h2>{{ detail.title }}</h2><p>聚餐 {{ dateText(detail.eventAt) }} · 链接有效至 {{ dateText(detail.expiresAt) }}</p></div><div class="inline-actions"><el-button :loading="detailLoading" :disabled="working || editing || !!mutationIssue" @click="readDetail(selectedId)">刷新点菜</el-button><el-button v-if="!editing" :disabled="!canChange" @click="startEdit">编辑信息</el-button></div></div>
        <div v-if="editing" class="edit-panel"><el-form label-position="top"><el-form-item label="宴请名称"><el-input v-model="editForm.title" maxlength="80" show-word-limit :disabled="working" /></el-form-item><el-form-item label="聚餐时间"><el-date-picker v-model="editForm.eventAt" type="datetime" aria-label="编辑聚餐时间" :disabled="working" style="width:100%" /></el-form-item></el-form><div class="inline-actions"><el-button :disabled="working" @click="cancelEdit">取消</el-button><el-button type="primary" :disabled="!canChange || !editDirty" @click="saveEdit">保存信息</el-button></div></div>
        <el-alert v-if="!validVersion(detail)" type="warning" :closable="false" show-icon title="服务器未提供安全版本信息，详情暂时只能查看。" />
        <section class="share-panel"><div><span class="eyebrow">GUEST LINK</span><h3>客人点菜链接</h3><p>请只分享给受邀客人，任何持有链接的人都可以查看菜单。</p><p v-if="linkExpired">链接已过期，不能重新开放或更换。</p></div><el-input :model-value="canShare ? safeShareUrl(detail.shareUrl) : ''" readonly aria-label="客人点菜链接" placeholder="链接暂不可用，请先核对" /><div class="inline-actions"><el-button :disabled="!canShare || working || linkExpired" @click="copyLink"><el-icon><Link /></el-icon>复制链接</el-button><el-button :disabled="!canChange || linkExpired || !['open', 'locked'].includes(detail.status)" @click="rotateLink">更换链接</el-button></div></section>
        <div class="status-actions"><el-button v-if="detailStatus === 'open'" :disabled="!canChange || editing" @click="setStatus('locked')">锁单</el-button><el-button v-if="detailStatus === 'locked'" :disabled="!canChange || editing || linkExpired" @click="setStatus('open')">继续点菜</el-button><el-button v-if="['open', 'locked', 'expired'].includes(detailStatus)" :disabled="!canChange || editing" @click="setStatus('completed')">标记完成</el-button><el-button v-if="['open', 'locked', 'expired'].includes(detailStatus)" type="danger" plain :disabled="!canChange || editing" @click="setStatus('cancelled')">取消宴请</el-button></div>
        <section class="summary"><div class="summary-head"><div><span class="eyebrow">ORDER SUMMARY</span><h3>大家想吃</h3></div><span>{{ detail.summary.guestCount }} 份点菜单 · {{ detail.summary.totalQuantity }} 份菜</span></div><div v-if="!detail.summary.dishes.length" class="summary-empty">还没有客人提交点菜单。</div><div v-else class="dish-list"><div v-for="dish in detail.summary.dishes" :key="dish.mealId || dish.name" class="dish-row"><div><strong>{{ dish.name }}</strong><small>{{ (dish.guestNames || []).join('、') }}</small><small v-for="(note, index) in dish.notes || []" :key="index">{{ note }}</small></div><b>× {{ dish.quantity }}</b></div></div></section>
        <section v-if="detail.orders.length" class="orders"><h3>客人点菜单</h3><el-collapse><el-collapse-item v-for="order in detail.orders" :key="order.id" :name="order.id" :title="`${order.guestName} · ${dateText(order.submittedAt)}`"><p v-for="(item, index) in order.items || []" :key="index">{{ item.name }} × {{ item.quantity }}<span v-if="item.note"> · {{ item.note }}</span></p><p v-if="order.note" class="muted">整单备注：{{ order.note }}</p></el-collapse-item></el-collapse></section>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.guest-host-page{display:flex;flex-direction:column;gap:20px}.hero{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:clamp(24px,3.5vw,40px);border:1px solid var(--border-color);border-radius:28px;background:linear-gradient(130deg,var(--bg-primary),var(--bg-secondary));box-shadow:0 12px 28px var(--shadow-color)}.hero h1{margin:8px 0;font-family:Georgia,'Songti SC',serif;font-size:clamp(27px,3.2vw,40px)}.hero p,.dialog-note,.muted,.detail-head p,.share-panel p,.session-card p{color:var(--text-secondary);line-height:1.6}.eyebrow{color:var(--secondary-color);font-size:11px;font-weight:800;letter-spacing:.14em}.hero-actions,.inline-actions,.status-actions,.alert-actions{display:flex;gap:10px;flex-wrap:wrap}.hero-actions .el-button,.inline-actions .el-button,.status-actions .el-button,.alert-actions .el-button{margin:0}.section-head,.summary-head{display:flex;align-items:end;justify-content:space-between;gap:12px}.section-head h2,.summary-head h3{margin:5px 0 0}.session-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,310px),1fr));gap:16px}.session-card,.empty-card,.share-panel,.summary,.edit-panel{padding:22px;border:1px solid var(--border-color);border-radius:22px;background:var(--bg-primary);box-shadow:0 8px 22px var(--shadow-color)}.session-card h3{font-size:20px;margin:18px 0 4px;overflow-wrap:anywhere}.card-top,.card-bottom{display:flex;justify-content:space-between;align-items:center;gap:10px}.card-top span,.card-bottom small{color:var(--text-secondary);font-size:12px}.card-bottom{margin-top:20px}.card-bottom strong{font-size:22px;color:var(--secondary-color);margin-left:12px}.card-bottom strong:first-child{margin-left:0}.empty-card{text-align:center;color:var(--text-secondary);padding:38px}.detail-head{display:flex;justify-content:space-between;gap:16px;align-items:start}.detail-head h2{margin:10px 0 4px;overflow-wrap:anywhere}.share-panel,.summary,.edit-panel{margin-top:18px;box-shadow:none;background:var(--bg-secondary)}.share-panel h3,.summary h3{margin:6px 0}.share-panel p{margin:6px 0 14px}.share-panel .inline-actions{margin-top:12px}.status-actions{margin-top:18px}.dish-list{margin-top:12px}.dish-row{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light)}.dish-row:last-child{border-bottom:0}.dish-row small{display:block;margin-top:4px;color:var(--text-secondary);overflow-wrap:anywhere}.dish-row b{white-space:nowrap;color:var(--secondary-color)}.summary-empty{padding:18px 0 4px;color:var(--text-secondary)}.orders{margin-top:20px}.orders p{margin:8px 0;overflow-wrap:anywhere}.alert-actions{margin-top:8px}@media(max-width:720px){.hero{align-items:stretch;flex-direction:column}.hero-actions .el-button{flex:1;min-height:44px}.session-grid{grid-template-columns:1fr}.detail-head{flex-direction:column}.status-actions .el-button{min-height:44px}.session-card{padding:18px}.card-top{align-items:flex-start}.card-top span{text-align:right}}
.share-panel p,.dish-row small{color:var(--text-primary)}
.card-top :deep(.el-tag),.detail-head :deep(.el-tag){color:var(--text-primary);background:var(--bg-primary);border-color:var(--border-color)}
.card-top :deep(.el-tag__content),.detail-head :deep(.el-tag__content){color:var(--text-primary)}
.list-filters{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.list-filters .el-input{flex:1;min-width:180px}.list-filters .el-select{width:180px}.list-filters .el-button{margin:0}.legacy-note{margin:0;color:var(--text-primary);font-size:13px}.list-pagination{display:flex;justify-content:center;align-items:center;gap:12px;color:var(--text-primary);font-size:13px}.list-pagination.top{justify-content:flex-end}.list-pagination .el-button{margin:0}@media(max-width:720px){.list-filters .el-input{flex-basis:100%}.list-filters .el-select{flex:1;min-width:0}.list-filters :deep(.el-input__wrapper),.list-filters :deep(.el-select__wrapper),.list-filters .el-button,.list-pagination .el-button{min-height:44px}}
</style>
