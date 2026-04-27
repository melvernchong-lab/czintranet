<template>
  <div class="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm transition-all hover:shadow-md">
    <div class="flex justify-between items-start mb-4">
      <p class="text-muted-light dark:text-muted-dark text-sm font-medium">API Health Status</p>
      <span class="material-symbols-outlined text-green-500">check_circle</span>
    </div>
    
    <div class="flex gap-2">
      <div 
        v-for="api in apis" 
        :key="api.name"
        :class="[
          'text-[10px] font-bold px-2 py-0.5 rounded border',
          api.status === 'online' 
            ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
        ]"
      >
        {{ api.name }}
      </div>
    </div>
    
    <p class="text-xs text-muted-light dark:text-muted-dark mt-4 italic">
      {{ onlineCount }}/{{ totalCount }} Integrations Online
    </p>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'APICard',
  setup() {
    const apis = ref([
      { name: 'MANTIS', status: 'online' },
      { name: 'TSHEET', status: 'online' },
      { name: 'GMAIL', status: 'warning' }
    ])
    
    const onlineCount = computed(() => {
      return apis.value.filter(api => api.status === 'online').length
    })
    
    const totalCount = computed(() => {
      return apis.value.length
    })
    
    return {
      apis,
      onlineCount,
      totalCount
    }
  }
}
</script>