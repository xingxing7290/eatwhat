<script setup>
defineProps({ label: { type: String, required: true }, reviewed: Boolean, reviewing: Boolean, deciding: Boolean })
defineEmits(['review', 'retry', 'discard'])
</script>

<template>
  <el-alert :title="`${label}保存结果未确认`" type="warning" :closable="false" show-icon>
    <p class="recovery-copy">请核对列表后再操作；原请求可能仍在处理，立即重试可能产生重复记录。</p>
    <div class="recovery-actions">
      <el-button link type="primary" :loading="reviewing" :disabled="deciding" @click="$emit('review')">刷新列表并核对</el-button>
      <el-button v-if="reviewed" link type="primary" :disabled="reviewing || deciding" @click="$emit('retry')">已核对，允许重试</el-button>
      <el-button v-if="reviewed" link :disabled="reviewing || deciding" @click="$emit('discard')">已有记录，放弃草稿</el-button>
    </div>
  </el-alert>
</template>

<style scoped>
.recovery-copy { margin: 4px 0 8px; line-height: 1.5; }
.recovery-actions { display: flex; flex-wrap: wrap; gap: 4px 12px; }
.recovery-actions :deep(.el-button + .el-button) { margin-left: 0; }
</style>
