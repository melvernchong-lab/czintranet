<template>
  <div 
    class="bg-card-light dark:bg-card-dark p-6 rounded-xl border border-border-light dark:border-border-dark shadow-sm transition-all hover:shadow-md"
  >
    <div class="flex justify-between items-start mb-4">
      <p class="text-muted-light dark:text-muted-dark text-sm font-medium">{{ title }}</p>
      <span :class="['material-symbols-outlined', iconColor]">{{ icon }}</span>
    </div>
    
    <p class="text-2xl font-bold">{{ value }}</p>
    
    <template v-if="showProgress">
      <div class="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div 
          class="bg-primary h-full" 
          :style="{ width: progressWidth }"
        ></div>
      </div>
      <p class="text-xs text-slate-500 mt-2" v-if="subtext">{{ subtext }}</p>
    </template>
    
    <p v-else-if="subtext" class="text-slate-400 text-xs font-medium mt-2">{{ subtext }}</p>
  </div>
</template>

<script>
export default {
  name: 'DashboardCard',
  props: {
    title: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    iconColor: {
      type: String,
      default: 'text-primary'
    },
    showProgress: {
      type: Boolean,
      default: false
    },
    progressWidth: {
      type: String,
      default: '0%'
    },
    subtext: {
      type: String,
      default: ''
    }
  }
}
</script>