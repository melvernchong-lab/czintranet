<template>
  <div class="bg-white dark:bg-background-dark p-6 rounded-xl border border-slate-200 dark:border-[#323b67] shadow-sm">
    <h3 class="text-lg font-bold mb-6">Quick Configuration</h3>
    
    <div class="space-y-6">
      <!-- Feature Toggles -->
      <div 
        v-for="feature in features" 
        :key="feature.id"
        class="flex items-center justify-between"
      >
        <div>
          <p class="text-sm font-semibold">{{ feature.name }}</p>
          <p class="text-[10px] text-slate-500">{{ feature.description }}</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input 
            v-model="feature.enabled"
            type="checkbox" 
            class="sr-only peer" 
          />
          <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
    
    <button 
      @click="viewSecurityPolicy"
      class="w-full mt-8 py-2.5 bg-slate-100 dark:bg-[#232948] text-slate-900 dark:text-white text-xs font-bold rounded-lg border border-slate-200 dark:border-[#323b67] hover:bg-slate-200 transition-colors"
    >
      View Security Policy
    </button>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'QuickConfigurationPanel',
  setup() {
    const features = ref([
      {
        id: 1,
        name: 'AI Auto-Tagging',
        description: 'Classify wiki docs using LLM',
        enabled: true
      },
      {
        id: 2,
        name: 'Enforce MFA',
        description: 'Mandatory for all admin accounts',
        enabled: true
      },
      {
        id: 3,
        name: 'Slack Notifications',
        description: 'Real-time alerts for system criticals',
        enabled: false
      }
    ])
    
    const viewSecurityPolicy = () => {
      console.log('View security policy')
      // Navigate to security policy page
    }
    
    return {
      features,
      viewSecurityPolicy
    }
  }
}
</script>