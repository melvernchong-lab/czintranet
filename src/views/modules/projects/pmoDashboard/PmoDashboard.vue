<template>
  <div class="page-content">
    <!-- Header with filters (always visible) -->
    <div class="dashboard-header"  v-if="!isChildRoute">
      <div class="header-left">
        <h1 class="dashboard-title">PMO Dashboard</h1>
        <p class="dashboard-subtitle">Programme Management Office overview</p>
      </div>
      <div class="header-right">
        <div class="filter-group">
          <label>Month</label>
          <select v-model="selectedMonth" class="filter-select">
            <option v-for="(month, idx) in months" :key="idx" :value="idx">{{ month }}</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Year</label>
          <select v-model="selectedYear" class="filter-select">
            <option v-for="year in availableYears" :key="year" :value="year">{{ year }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Back button & breadcrumb – visible only on child routes -->
    <div class="project-nav-bar" v-if="isChildRoute">
      <button class="back-to-projects-btn" @click="goBackToDashboardHome">
        <span class="material-symbols-outlined">arrow_back</span>
        <span>Back to Dashboard</span>
      </button>
      <div class="project-breadcrumb">
        <span class="breadcrumb-item">PMO Dashboard</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ currentChildTitle }}</span>
      </div>
    </div>

    <!-- Child view (home page or sub‑page) -->
    <router-view />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'PMODashboard',
  setup() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const currentYear = new Date().getFullYear()
    const selectedYear = ref(currentYear)
    const selectedMonth = ref(new Date().getMonth())
    const allProjects = ref([])

    const route = useRoute()
    const router = useRouter()

    const loadProjects = () => {
      try {
        const data = localStorage.getItem('saved_projects')
        allProjects.value = data ? JSON.parse(data) : []
      } catch (e) { allProjects.value = [] }
    }

    onMounted(() => loadProjects())

    const isChildRoute = computed(() => {
      return route.path !== '/pmo-dashboard' && route.path !== '/pmo-dashboard/'
    })

    const currentChildTitle = computed(() => {
      if (route.path.includes('projectsummary')) return 'Project Summary'
      if (route.path.includes('resources')) return 'Resource Utilisation'
      if (route.path.includes('invoices')) return 'Invoice Tracking'
      return ''
    })

    // ✅ Fixed – navigate back to the dashboard home using the correct route name
    const goBackToDashboardHome = () => {
      router.push({ name: 'PmoDashboardContent' })
    }

    const availableYears = computed(() => {
      const years = new Set()
      allProjects.value.forEach(p => {
        if (p.startDate) years.add(new Date(p.startDate).getFullYear())
        if (p.endDate) years.add(new Date(p.endDate).getFullYear())
        if (p.createdAt) years.add(new Date(p.createdAt).getFullYear())
      })
      if (years.size === 0) years.add(currentYear)
      return Array.from(years).sort((a, b) => b - a)
    })

    return {
      months, selectedMonth, selectedYear, availableYears,
      isChildRoute, currentChildTitle, goBackToDashboardHome
    }
  }
}
</script>

<style scoped>
/* ============================================
   PMO DASHBOARD LAYOUT STYLES
   ============================================ */
@import '../../../../styles/shared/pages.css';

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.dashboard-title {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.dark .dashboard-title {
  color: #f1f5f9;
}

.dashboard-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.dark .dashboard-subtitle {
  color: #94a3b8;
}

.header-right {
  display: flex;
  gap: 16px;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-group label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.dark .filter-group label {
  color: #94a3b8;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  color: #1e293b;
  cursor: pointer;
  min-width: 130px;
}

.dark .filter-select {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

/* Project Navigation Bar */
.project-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.back-to-projects-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #6366f1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .back-to-projects-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.back-to-projects-btn:hover {
  background: #6366f1;
  color: white;
  transform: translateX(-5px);
}

.back-to-projects-btn .material-symbols-outlined {
  font-size: 18px;
}

.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-item {
  color: #64748b;
  transition: color 0.2s;
}

.dark .breadcrumb-item {
  color: #94a3b8;
}

.breadcrumb-item.active {
  color: #6366f1;
  font-weight: 600;
}

.dark .breadcrumb-item.active {
  color: #f1f5f9;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

</style>