<template>
  <div>
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card gradient-blue">
        <div class="stat-icon"><span class="material-symbols-outlined">folder</span></div>
        <div class="stat-info"><span class="stat-value">{{ allProjects.length }}</span><span class="stat-label">Total
            Projects</span></div>
      </div>
      <div class="stat-card gradient-green">
        <div class="stat-icon"><span class="material-symbols-outlined">task_alt</span></div>
        <div class="stat-info"><span class="stat-value">{{ activeProjects }}</span><span class="stat-label">Active
            Projects</span></div>
      </div>
      <div class="stat-card gradient-purple">
        <div class="stat-icon"><span class="material-symbols-outlined">checklist</span></div>
        <div class="stat-info"><span class="stat-value">{{ totalTasksCount }}</span><span class="stat-label">Total
            Tasks</span></div>
      </div>
      <div class="stat-card gradient-red">
        <div class="stat-icon"><span class="material-symbols-outlined">schedule</span></div>
        <div class="stat-info"><span class="stat-value">{{ overdueProjects }}</span><span
            class="stat-label">Overdue</span></div>
      </div>
    </div>

    <!-- Projects Table -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Projects</h3>
        <div class="table-controls">
          <div class="search-box">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" type="text" placeholder="Search projects..." class="search-input" />
          </div>
          <button class="advanced-filter-btn" @click="showFilters = !showFilters">
            <span class="material-symbols-outlined">filter_list</span>
            Filters
            <span class="material-symbols-outlined chevron" :class="{ rotated: showFilters }">expand_more</span>
          </button>
        </div>
      </div>

      <!-- Advanced Filters -->
      <div v-if="showFilters" class="advanced-filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <label class="filter-label">Priority</label>
            <select v-model="filterPriority" class="filter-select">
              <option value="">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">Status</label>
            <select v-model="filterStatus" class="filter-select">
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">Country</label>
            <select v-model="filterCountry" class="filter-select">
              <option value="">All</option>
              <option v-for="country in uniqueCountries" :key="country" :value="country">{{ country }}</option>
            </select>
          </div>
          <div class="filter-item">
            <label class="filter-label">Project Manager</label>
            <input v-model="filterManager" type="text" placeholder="Search manager..." class="filter-select" />
          </div>
        </div>
        <div class="filters-actions">
          <button class="btn-secondary" @click="clearFilters">Clear All</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="projects-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Project Name</th>
              <th>Country</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Progress</th>
              <th>Project Manager</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="project in paginatedProjects" :key="project.id">
              <td>
                <span :class="['priority-badge', project.priority]">{{ project.priority || 'Medium' }}</span>
              </td>
              <td class="project-name-cell">{{ project.name }}</td>
              <td>{{ project.country || '—' }}</td>
              <td>{{ formatDate(project.startDate) }}</td>
              <td>{{ formatDate(project.endDate) }}</td>
              <td>
                <div class="progress-wrapper small">
                  <div class="progress-bar" :style="{ width: (project.progress || 0) + '%' }"></div>
                  <span class="progress-text small">{{ project.progress || 0 }}%</span>
                </div>
              </td>
              <td>{{ project.projectManager || '—' }}</td>
              <td>
                <span :class="['status-indicator', getProjectStatusClass(project)]">
                  {{ getProjectStatusText(project) }}
                </span>
              </td>
              <td>
                <button class="view-btn" @click="viewProject(project.id)">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-wrapper">
        <span class="pagination-info">
          Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredProjects.length }} projects
        </span>
        <div class="pagination-controls">
          <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <span class="page-number">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'PmoProjectSummary',
  setup() {
    const allProjects = ref([])
    const searchQuery = ref('')
    const filterPriority = ref('')
    const filterStatus = ref('')
    const filterCountry = ref('')
    const filterManager = ref('')
    const showFilters = ref(false)
    const currentPage = ref(1)
    const itemsPerPage = 10

    const router = useRouter()

    // Navigate to individual project with a ref query parameter
    const viewProject = (id) => {
      router.push({ path: `/projects/${id}`, query: { ref: 'pmo' } })
    }

    const loadProjects = () => {
      try {
        const data = localStorage.getItem('saved_projects')
        if (data) {
          allProjects.value = JSON.parse(data)
        } else {
          allProjects.value = []
        }
      } catch (e) {
        allProjects.value = []
      }
    }

    // Stats
    const activeProjects = computed(() =>
      allProjects.value.filter(p => p.status === 'active' || p.status === 'in_progress').length
    )
    const totalTasksCount = computed(() => {
      let count = 0
      allProjects.value.forEach(project => {
        const timeline = project.timeline
        if (timeline && timeline.groups) {
          timeline.groups.forEach(group => {
            const subs = group.subMilestones || group.subGroups || []
            subs.forEach(sub => {
              count += (sub.tasks || []).length
            })
            count += (group.tasks || []).length
          })
        }
      })
      return count
    })
    const overdueProjects = computed(() => {
      const today = new Date()
      return allProjects.value.filter(p => {
        if (!p.endDate) return false
        const end = new Date(p.endDate)
        return end < today && p.status !== 'completed'
      }).length
    })

    // Unique filter options
    const uniqueCountries = computed(() => {
      const set = new Set(allProjects.value.map(p => p.country).filter(Boolean))
      return Array.from(set).sort()
    })

    // Filtered projects
    const filteredProjects = computed(() => {
      let result = allProjects.value.map(p => ({
        ...p,
        priority: p.priority || 'Medium',
        country: p.country || 'Malaysia',
        projectManager: p.projectManager || 'Unassigned',
        progress: p.progress || 0
      }))

      const query = searchQuery.value.toLowerCase().trim()
      if (query) {
        result = result.filter(p => p.name?.toLowerCase().includes(query))
      }
      if (filterPriority.value) {
        result = result.filter(p => p.priority === filterPriority.value)
      }
      if (filterStatus.value) {
        result = result.filter(p => p.status === filterStatus.value)
      }
      if (filterCountry.value) {
        result = result.filter(p => p.country === filterCountry.value)
      }
      if (filterManager.value) {
        const mgr = filterManager.value.toLowerCase()
        result = result.filter(p => p.projectManager?.toLowerCase().includes(mgr))
      }

      return result
    })

    const totalPages = computed(() => Math.ceil(filteredProjects.value.length / itemsPerPage) || 1)
    const paginatedProjects = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage
      return filteredProjects.value.slice(start, start + itemsPerPage)
    })
    const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
    const paginationEnd = computed(() => Math.min(currentPage.value * itemsPerPage, filteredProjects.value.length))

    // Project status logic
    const getProjectStatusText = (project) => {
      if (project.status === 'completed') return 'COMPLETED'
      if (project.status === 'on_hold') return 'ON HOLD'

      const today = new Date()
      if (!project.endDate) {
        return project.status === 'active' ? 'ON TRACK' : '—'
      }

      const end = new Date(project.endDate)
      const diffDays = Math.ceil((end - today) / (1000 * 60 * 60 * 24))

      if (end < today) return 'RED'
      if (diffDays <= 30) return 'POTENTIAL DELAY'
      return 'GREEN - ONTRACK'
    }

    const getProjectStatusClass = (project) => {
      const text = getProjectStatusText(project)
      if (text.startsWith('GREEN')) return 'status-green'
      if (text.startsWith('AMBER')) return 'status-amber'
      if (text.startsWith('RED') || text === 'ON HOLD') return 'status-red'
      if (text === 'COMPLETED') return 'status-completed'
      return ''
    }

    const clearFilters = () => {
      searchQuery.value = ''
      filterPriority.value = ''
      filterStatus.value = ''
      filterCountry.value = ''
      filterManager.value = ''
    }

    const formatDate = (date) => {
      if (!date) return '—'
      const d = new Date(date)
      return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    watch([searchQuery, filterPriority, filterStatus, filterCountry, filterManager], () => {
      currentPage.value = 1
    })

    onMounted(() => loadProjects())

    return {
      allProjects,
      searchQuery, filterPriority, filterStatus, filterCountry, filterManager, showFilters,
      currentPage, totalPages, paginatedProjects, paginationStart, paginationEnd,
      filteredProjects, uniqueCountries,
      activeProjects, totalTasksCount, overdueProjects,
      viewProject, clearFilters, formatDate,
      getProjectStatusText, getProjectStatusClass
    }
  }
}
</script>

<style scoped>

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.stat-card {
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 28px;
  opacity: 0.9;
}

.stat-info {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 13px;
  opacity: 0.9;
}

.gradient-blue {
  background: linear-gradient(135deg, #4f46e5, #6366f1);
}

.gradient-green {
  background: linear-gradient(135deg, #059669, #10b981);
}

.gradient-purple {
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
}

.gradient-red {
  background: linear-gradient(135deg, #dc2626, #f87171);
}

/* Card & Table */
.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
}

.dark .card {
  background: #1e293b;
  border-color: #334155;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .card-title {
  color: #f1f5f9;
}

.table-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 10px;
  font-size: 18px;
  color: #64748b;
}

.search-input {
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #1e293b;
  width: 220px;
  transition: border-color 0.2s;
}

.dark .search-input {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.advanced-filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .advanced-filter-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.advanced-filter-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.chevron {
  font-size: 18px;
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.advanced-filters-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  animation: slideDown 0.2s ease;
}

.dark .advanced-filters-card {
  background: #0f172a;
  border-color: #334155;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.dark .filter-label {
  color: #94a3b8;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
  color: #1e293b;
  min-width: 120px;
  transition: border-color 0.2s;
}

.dark .filter-select {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.filter-select:focus {
  outline: none;
  border-color: #6366f1;
}

.filters-actions {
  display: flex;
  justify-content: flex-end;
}

.table-wrapper {
  overflow-x: auto;
}

.projects-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
}

.projects-table th {
  padding: 12px 16px;
  background: #f8fafc;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.dark .projects-table th {
  background: #0f172a;
  border-bottom-color: #334155;
  color: #94a3b8;
}

.projects-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  color: #1e293b;
  vertical-align: middle;
}

.dark .projects-table td {
  border-bottom-color: #1e293b;
  color: #cbd5e1;
}

.projects-table tbody tr:hover {
  background: #f8fafc;
}

.dark .projects-table tbody tr:hover {
  background: #1e293b;
}

.project-name-cell {
  font-weight: 600;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.priority-badge.High {
  background: #fee2e2;
  color: #dc2626;
}

.priority-badge.Medium {
  background: #fef3c7;
  color: #d97706;
}

.priority-badge.Low {
  background: #d1fae5;
  color: #059669;
}

.progress-wrapper.small {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100px;
}

.progress-bar {
  height: 6px;
  background: #6366f1;
  border-radius: 3px;
  min-width: 2px;
  transition: width 0.3s;
}

.progress-text.small {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
}

.dark .progress-text.small {
  color: #cbd5e1;
}

/* Status indicator styles */
.status-indicator {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}

.status-green {
  background: #d1fae5;
  color: #059669;
}

.status-amber {
  background: #fef3c7;
  color: #d97706;
}

.status-red {
  background: #fee2e2;
  color: #dc2626;
}

.status-completed {
  background: #dbeafe;
  color: #2563eb;
}

.dark .status-green {
  background: #064e3b;
  color: #34d399;
}

.dark .status-amber {
  background: #78350f;
  color: #fbbf24;
}

.dark .status-red {
  background: #7f1d1d;
  color: #fca5a5;
}

.dark .status-completed {
  background: #1e3a8a;
  color: #60a5fa;
}

.view-btn {
  padding: 4px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #475569;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .view-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.view-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.dark .pagination-wrapper {
  border-top-color: #334155;
}

.pagination-info {
  font-size: 13px;
  color: #64748b;
}

.dark .pagination-info {
  color: #94a3b8;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #475569;
}

.dark .page-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.page-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-number {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.dark .page-number {
  color: #94a3b8;
}

.btn-secondary {
  padding: 8px 16px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .btn-secondary {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.btn-secondary:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.dark .btn-secondary:hover {
  background: #0f172a;
}

@media (max-width: 768px) {
  .card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .table-controls {
    flex-direction: column;
    align-items: stretch;
    width: 100%;
  }

  .search-input {
    width: 100%;
  }

  .advanced-filter-btn {
    justify-content: center;
    width: 100%;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .pagination-wrapper {
    flex-direction: column;
    gap: 12px;
  }
}
</style>