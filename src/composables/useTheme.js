// src/composables/useTheme.js
import { ref, computed } from 'vue'

export function useTheme() {
  const isDark = ref(false)
  
  // Initialize theme from localStorage or system preference
  const initTheme = () => {
    const saved = localStorage.getItem('pmo-theme')
    
    if (saved === 'dark' || saved === 'light') {
      isDark.value = saved === 'dark'
    } else {
      // Check system preference
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      isDark.value = prefersDark
      localStorage.setItem('pmo-theme', prefersDark ? 'dark' : 'light')
    }
    
    updateTheme()
  }
  
  const toggleTheme = () => {
    isDark.value = !isDark.value
    updateTheme()
  }
  
  const updateTheme = () => {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('pmo-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('pmo-theme', 'light')
    }
  }

  // Computed property for theme icon
  const themeIcon = computed(() => {
    return isDark.value ? 'light_mode' : 'dark_mode'
  })
  
  // Initialize theme immediately
  initTheme()
  
  return {
    isDark,
    toggleTheme,
    initTheme,
    themeIcon // Add this export
  }
}