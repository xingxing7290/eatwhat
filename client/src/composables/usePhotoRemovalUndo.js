import { nextTick, ref } from 'vue'

// Keep removals local to the current draft; duplicate URLs remain distinct.
export function usePhotoRemovalUndo (form) {
  const removedPhotos = ref([])
  const existingPhotoGrid = ref(null)
  const undoPhotoButton = ref(null)
  const resetPhotoUndo = () => { removedPhotos.value = [] }
  const removeExistingPhoto = async (index, event) => {
    const source = event.currentTarget
    const hadFocus = document.activeElement === source
    const [photo] = form.existingPhotos.splice(index, 1)
    if (photo === undefined) return
    removedPhotos.value.push({ photo, index })
    await nextTick()
    const active = document.activeElement
    if (hadFocus && (!active || active === document.body || active === source || !active.isConnected)) undoPhotoButton.value?.$el?.focus()
  }
  const undoPhotoRemoval = async () => {
    const removed = removedPhotos.value.pop()
    if (!removed) return
    const index = Math.min(removed.index, form.existingPhotos.length)
    form.existingPhotos.splice(index, 0, removed.photo)
    await nextTick()
    const active = document.activeElement
    if (!active || active === document.body || !active.isConnected) existingPhotoGrid.value?.querySelectorAll('.existing-photo button')[index]?.focus()
  }
  return { removedPhotos, existingPhotoGrid, undoPhotoButton, resetPhotoUndo, removeExistingPhoto, undoPhotoRemoval }
}
