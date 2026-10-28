import { onBeforeUnmount, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'

// Drafts remain in the current page when their dialog is closed. Navigation
// must not silently discard them or interrupt a write whose outcome is unknown.
export function useDraftGuard ({ dirty, busy, label }) {
  const warnBeforeUnload = event => {
    if (!dirty.value && !busy.value) return
    event.preventDefault()
    event.returnValue = ''
  }
  onBeforeRouteLeave(async () => {
    if (busy.value) { ElMessage.warning('操作正在进行，请稍候'); return false }
    if (!dirty.value) return true
    try {
      await ElMessageBox.confirm(`当前${label}尚未保存，离开后会丢失。`, '放弃未保存的内容？', {
        type: 'warning', confirmButtonText: '放弃并离开', cancelButtonText: '继续编辑'
      })
      return true
    } catch (_) { return false }
  })
  onMounted(() => window.addEventListener('beforeunload', warnBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', warnBeforeUnload))
}
