<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { apiLogs } from '../services/api';
import { Search } from '@element-plus/icons-vue';

// 属性定义
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:visible', 'close']);

// 日志数据
const logs = ref([]);
const filterType = ref('all'); // 'all', 'request', 'response', 'error'
const searchQuery = ref('');
const autoRefresh = ref(true);
const refreshInterval = ref(null);

// 过滤后的日志
const filteredLogs = computed(() => {
  let result = logs.value;
  
  // 按类型过滤
  if (filterType.value !== 'all') {
    result = result.filter(log => log.type === filterType.value);
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(log => {
      return log.url.toLowerCase().includes(query) || 
             JSON.stringify(log.data).toLowerCase().includes(query);
    });
  }
  
  return result;
});

// 加载日志
const loadLogs = () => {
  logs.value = apiLogs.getLogs();
};

// 清除日志
const clearLogs = () => {
  apiLogs.clear();
  loadLogs();
};

// 关闭日志查看器
const closeLogger = () => {
  emit('update:visible', false);
  emit('close');
};

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
};

// 格式化JSON
const formatJSON = (data) => {
  try {
    return JSON.stringify(data, null, 2);
  } catch (e) {
    return String(data);
  }
};

// 获取日志类型样式
const getTypeStyle = (type) => {
  switch (type) {
    case 'request': return { color: '#2196F3' };
    case 'response': return { color: '#4CAF50' };
    case 'error': return { color: '#F44336' };
    default: return {};
  }
};

// 自动刷新
const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  
  if (autoRefresh.value) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
};

const startAutoRefresh = () => {
  stopAutoRefresh(); // 先清除之前的定时器
  refreshInterval.value = setInterval(() => {
    loadLogs();
  }, 2000); // 每2秒刷新一次
};

const stopAutoRefresh = () => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value);
    refreshInterval.value = null;
  }
};

// 生命周期钩子
onMounted(() => {
  loadLogs();
  if (autoRefresh.value) {
    startAutoRefresh();
  }
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<template>
  <div v-if="visible" class="api-logger">
    <div class="logger-header">
      <h2>API 请求日志</h2>
      <div class="header-actions">
        <el-switch
          v-model="autoRefresh"
          active-text="自动刷新"
          inactive-text="手动刷新"
          @change="toggleAutoRefresh"
        />
        <el-button type="primary" size="small" @click="loadLogs">刷新</el-button>
        <el-button type="danger" size="small" @click="clearLogs">清空</el-button>
        <el-button type="default" size="small" @click="closeLogger">关闭</el-button>
      </div>
    </div>
    
    <div class="logger-filters">
      <el-input 
        v-model="searchQuery" 
        placeholder="搜索URL或数据" 
        clearable
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
      </el-input>
      
      <el-radio-group v-model="filterType" size="small">
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="request">请求</el-radio-button>
        <el-radio-button value="response">响应</el-radio-button>
        <el-radio-button value="error">错误</el-radio-button>
      </el-radio-group>
    </div>
    
    <div class="logs-container">
      <el-empty v-if="filteredLogs.length === 0" description="暂无日志记录" />
      
      <div v-else class="logs-list">
        <el-collapse accordion>
          <el-collapse-item 
            v-for="(log, index) in filteredLogs" 
            :key="index"
            :name="index"
          >
            <template #title>
              <div class="log-title" :style="getTypeStyle(log.type)">
                <span class="log-type">{{ log.type.toUpperCase() }}</span>
                <span class="log-url">{{ log.url }}</span>
                <span class="log-time">{{ formatDateTime(log.timestamp) }}</span>
                <span v-if="log.status" class="log-status">
                  状态: {{ log.status }}
                </span>
              </div>
            </template>
            
            <div class="log-details">
              <div v-if="log.data" class="log-data">
                <h4>{{ log.type === 'request' ? '请求数据' : log.type === 'response' ? '响应数据' : '错误信息' }}</h4>
                <pre>{{ formatJSON(log.data) }}</pre>
              </div>
              <div v-else class="no-data">
                无数据
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.api-logger {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.95);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  padding: 20px;
  box-sizing: border-box;
  
  .dark-mode & {
    background-color: rgba(30, 30, 30, 0.95);
  }
  
  .logger-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 24px;
      color: var(--primary-color);
    }
    
    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
  }
  
  .logger-filters {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    align-items: center;
    
    .el-input {
      max-width: 300px;
    }
  }
  
  .logs-container {
    flex: 1;
    overflow-y: auto;
    
    .logs-list {
      .log-title {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: monospace;
        
        .log-type {
          font-weight: bold;
          width: 80px;
        }
        
        .log-url {
          flex: 1;
        }
        
        .log-time {
          font-size: 12px;
          color: #888;
        }
        
        .log-status {
          font-size: 12px;
          padding: 2px 6px;
          border-radius: 4px;
          background-color: #eee;
        }
      }
      
      .log-details {
        padding: 10px;
        background-color: #f8f8f8;
        border-radius: 4px;
        
        .dark-mode & {
          background-color: #333;
        }
        
        h4 {
          margin-top: 0;
          margin-bottom: 10px;
        }
        
        pre {
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
          font-family: monospace;
          font-size: 14px;
          max-height: 300px;
          overflow-y: auto;
        }
        
        .no-data {
          color: #999;
          font-style: italic;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .api-logger {
    padding: 10px;
    
    .logger-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
      
      .header-actions {
        width: 100%;
        justify-content: space-between;
      }
    }
    
    .logger-filters {
      flex-direction: column;
      align-items: stretch;
      
      .el-input {
        max-width: none;
      }
    }
  }
}
</style> 