import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export function useUncertainCreate ({ reload, loadError, close, discard, reopen, label }) {
  const uncertain = ref(false)
  const reviewed = ref(false)
  const reviewing = ref(false)
  const deciding = ref(false)

  const markUncertain = () => {
    uncertain.value = true
    reviewed.value = false
    ElMessage.warning(`${label}保存结果未确认，请先核对列表`)
  }
  const review = async () => {
    if (!uncertain.value || reviewing.value || deciding.value) return
    close()
    reviewed.value = false
    reviewing.value = true
    try {
      await reload()
      reviewed.value = !loadError.value
    } catch (_) {
      ElMessage.error('列表加载失败，请重新核对')
    } finally { reviewing.value = false }
  }
  const allowRetry = async () => {
    if (!uncertain.value || !reviewed.value || reviewing.value || deciding.value) return
    deciding.value = true
    let accepted = false
    try {
      await ElMessageBox.confirm('即使列表暂时没有记录，之前的请求仍可能稍后完成。请确认已核对并理解重复创建的风险。', '确认重新提交？', {
        type: 'warning', confirmButtonText: '已核对，允许重试', cancelButtonText: '继续核对'
      })
      accepted = true
    } catch (_) {} finally { deciding.value = false }
    if (!accepted) return
    uncertain.value = false
    reviewed.value = false
    reopen()
  }
  const discardDraft = async () => {
    if (!uncertain.value || !reviewed.value || reviewing.value || deciding.value) return
    deciding.value = true
    let accepted = false
    try {
      await ElMessageBox.confirm('确认列表中已有记录并放弃本页草稿？这不会删除列表中的记录。', '确认放弃草稿？', {
        type: 'warning', confirmButtonText: '确认放弃草稿', cancelButtonText: '继续核对'
      })
      accepted = true
    } catch (_) {} finally { deciding.value = false }
    if (!accepted) return
    discard()
    uncertain.value = false
    reviewed.value = false
    close()
  }
  return { uncertain, reviewed, reviewing, deciding, markUncertain, review, allowRetry, discardDraft }
}
