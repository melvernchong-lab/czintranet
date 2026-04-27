<template>
  <div>
    <!-- Stats Cards Row -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon projects">
          <span class="material-symbols-outlined">folder</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ totalProjectsThisYear }}</span>
          <span class="stat-label">Total Projects</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon live">
          <span class="material-symbols-outlined">play_circle</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ liveProjectsThisYear }}</span>
          <span class="stat-label">Live Projects</span>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completion">
          <span class="material-symbols-outlined">check_circle</span>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ projectCompletionRate }}%</span>
          <span class="stat-label">Completion Rate</span>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-content">
      <!-- Project Summary Table -->
      <div class="card summary-card">
        <h3 class="card-title">Project Summary</h3>
        <div class="table-wrapper">
          <table class="summary-table">
            <thead>
              <tr>
                <th>Priority</th>
                <th>Project Name</th>
                <th>Country</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Progress</th>
                <th>Project Manager</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="project in filteredProjectsSummary" :key="project.id">
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
              </tr>
            </tbody>
          </table>
        </div>
        <div class="card-footer">
          <router-link to="/pmo-dashboard/projectsummary" class="view-more">View More →</router-link>
        </div>
      </div>

      <!-- Resources & Timesheet – Redesigned -->
      <div class="card resources-card">
        <h3 class="card-title">Resources & Timesheet</h3>
        <div class="resource-grid">
          <div v-for="resource in resourceList" :key="resource.name" class="resource-item">
            <div class="resource-avatar" :style="{ backgroundColor: resource.avatarColor }">
              {{ getInitials(resource.name) }}
            </div>
            <div class="resource-details">
              <span class="resource-name">{{ resource.name }}</span>
              <span class="resource-role">{{ resource.role }}</span>
              <div class="resource-hours-wrapper">
                <svg class="progress-ring" width="60" height="60">
                  <circle class="ring-bg" cx="30" cy="30" r="25" />
                  <circle class="ring-fill" cx="30" cy="30" r="25"
                    :style="{ strokeDasharray: circumference, strokeDashoffset: getOffset(resource.hoursThisWeek) }" />
                </svg>
                <span class="hours-inside">{{ resource.hoursThisWeek }}h</span>
              </div>
              <span class="resource-target"> / 40h</span>
            </div>
          </div>
        </div>
        <div class="card-footer">
          <router-link to="/pmo-dashboard/resources" class="view-more">View More →</router-link>
        </div>
      </div>

      <!-- Backlog Projects -->
      <div class="card backlog-card">
        <h3 class="card-title">Backlog Projects</h3>
        <div class="backlog-list">
          <div v-for="project in backlogProjects" :key="project.id" class="backlog-item">
            <span class="backlog-name">{{ project.name }}</span>
            <span class="backlog-status">{{ formatStatus(project.status) }}</span>
            <span class="backlog-date">{{ formatDate(project.startDate) }}</span>
          </div>
        </div>
        <p v-if="backlogProjects.length === 0" class="empty-message">No backlog projects.</p>
        <div class="card-footer">
          <router-link to="/pmo/backlog" class="view-more">View More →</router-link>
        </div>
      </div>

      <!-- Project Invoice Info (simplified) -->
      <div class="card invoice-card">
        <h3 class="card-title">Invoice Tracking</h3>
        <div class="invoice-list">
          <div v-for="item in invoiceData" :key="item.projectId" class="invoice-item">
            <span class="invoice-name">{{ item.projectName }}</span>
            <span class="invoice-progress">
              {{ item.invoicedCount }}/{{ item.totalMilestones }} invoice
            </span>
            <span :class="['invoice-status-badge', item.overallStatusClass]">
              {{ item.overallStatus }}
            </span>
          </div>
        </div>
        <p v-if="invoiceData.length === 0" class="empty-message">No projects with milestones found.</p>
        <div class="card-footer">
          <router-link to="/pmo-dashboard/invoices" class="view-more">View More →</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'PMODashboardHome',
  setup() {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const currentYear = new Date().getFullYear()
    const selectedYear = ref(currentYear)
    const selectedMonth = ref(new Date().getMonth())

    const allProjects = ref([])
    const circumference = 2 * Math.PI * 25

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

    const projectsThisYear = computed(() => {
      return allProjects.value.filter(p => {
        if (p.startDate) return new Date(p.startDate).getFullYear() === selectedYear.value
        if (p.createdAt) return new Date(p.createdAt).getFullYear() === selectedYear.value
        return true
      })
    })

    const totalProjectsThisYear = computed(() => projectsThisYear.value.length)

    const liveProjectsThisYear = computed(() => {
      return projectsThisYear.value.filter(p => p.status === 'active' || p.status === 'in_progress').length
    })

    const projectCompletionRate = computed(() => {
      if (totalProjectsThisYear.value === 0) return 0
      const completed = projectsThisYear.value.filter(p => p.status === 'completed').length
      return Math.round((completed / totalProjectsThisYear.value) * 100)
    })

    const filteredProjectsSummary = computed(() => {
      return projectsThisYear.value.map(p => ({
        id: p.id,
        name: p.name || 'Unnamed',
        priority: p.priority || 'Medium',
        country: p.country || 'Malaysia',
        startDate: p.startDate,
        endDate: p.endDate,
        progress: p.progress || 0,
        projectManager: p.projectManager || 'Unassigned'
      }))
    })

    // Dummy resource list (replace with actual team members from projects)
    const resourceList = ref([
      { name: 'John Doe', role: 'Developer', hoursThisWeek: 32, avatarColor: '#6366f1' },
      { name: 'Jane Smith', role: 'Designer', hoursThisWeek: 38, avatarColor: '#10b981' },
      { name: 'Mike Chen', role: 'Architect', hoursThisWeek: 20, avatarColor: '#f59e0b' },
      { name: 'Sarah Lee', role: 'PM', hoursThisWeek: 40, avatarColor: '#ef4444' }
    ])

    const backlogProjects = computed(() => {
      return allProjects.value.filter(p => p.status === 'pending' || p.status === 'on_hold')
    })

    // Invoice data: simplified project‑level summary
    const invoiceData = computed(() => {
      const summary = []
      allProjects.value.forEach(project => {
        const timeline = project.timeline
        if (!timeline || !timeline.groups) return

        let totalMilestones = 0
        let invoicedCount = 0

        timeline.groups.forEach(group => {
          const subs = group.subMilestones || group.subGroups || []
          subs.forEach(sub => {
            totalMilestones++
            if (sub.invoiceStatus === 'raised') invoicedCount++
          })
          // Direct tasks (no sub‑milestones) count as one milestone
          if (group.tasks && group.tasks.length > 0 && subs.length === 0) {
            totalMilestones++
          }
        })

        if (totalMilestones > 0) {
          let overallStatus = 'Not Invoiced'
          let overallStatusClass = 'status-not-invoiced'
          if (invoicedCount === totalMilestones) {
            overallStatus = 'All Invoiced'
            overallStatusClass = 'status-invoiced'
          } else if (invoicedCount > 0) {
            overallStatus = 'Partial'
            overallStatusClass = 'status-partial'
          }

          summary.push({
            projectId: project.id,
            projectName: project.name || 'Unnamed',
            totalMilestones,
            invoicedCount,
            overallStatus,
            overallStatusClass
          })
        }
      })
      return summary
    })

    const formatDate = (date) => {
      if (!date) return '—'
      const d = new Date(date)
      return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }

    const formatStatus = (status) => {
      const statusMap = {
        active: 'Active',
        pending: 'Pending',
        on_hold: 'On Hold',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
      return statusMap[status] || status
    }

    const getInitials = (name) => {
      return name.split(' ').map(n => n[0]).join('').toUpperCase()
    }

    const getOffset = (hours) => {
      const max = 40
      const ratio = Math.min(hours / max, 1)
      return circumference * (1 - ratio)
    }

    onMounted(() => {
      loadProjects()
    })

    return {
      months, selectedMonth, selectedYear, availableYears,
      totalProjectsThisYear, liveProjectsThisYear, projectCompletionRate,
      filteredProjectsSummary, resourceList, backlogProjects, invoiceData,
      formatDate, formatStatus, getInitials, getOffset, circumference
    }
  }
}
</script>

<style scoped>
/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}
.stat-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s;
}
.dark .stat-card { background: #1e293b; border-color: #334155; }
.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-icon.projects { background: #e0e7ff; color: #4f46e5; }
.stat-icon.live { background: #d1fae5; color: #059669; }
.stat-icon.completion { background: #fef3c7; color: #d97706; }
.stat-info { display: flex; flex-direction: column; }
.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}
.dark .stat-value { color: #f1f5f9; }
.stat-label { font-size: 13px; color: #64748b; }
.dark .stat-label { color: #94a3b8; }

/* Main content grid */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

@media (max-width: 1300px) {
  .dashboard-content { grid-template-columns: 1fr; }
}

.card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  display: flex;
  flex-direction: column;
}
.dark .card { background: #1e293b; border-color: #334155; }
.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 20px 0;
}
.dark .card-title { color: #f1f5f9; }
.card-footer {
  margin-top: auto;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
  text-align: right;
}
.dark .card-footer { border-top-color: #334155; }
.view-more {
  font-size: 13px;
  font-weight: 600;
  color: #6366f1;
  text-decoration: none;
  transition: color 0.2s;
}
.view-more:hover { color: #4f46e5; }

/* Summary Table */
.table-wrapper { overflow-x: auto; }
.summary-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 700px;
}
.summary-table th {
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
.dark .summary-table th { background: #0f172a; border-bottom-color: #334155; color: #94a3b8; }
.summary-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 13px;
  color: #1e293b;
  vertical-align: middle;
}
.dark .summary-table td { border-bottom-color: #1e293b; color: #cbd5e1; }
.project-name-cell { font-weight: 600; }

/* Priority Badges */
.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}
.priority-badge.High { background: #fee2e2; color: #dc2626; }
.priority-badge.Medium { background: #fef3c7; color: #d97706; }
.priority-badge.Low { background: #d1fae5; color: #059669; }

/* Progress bar small */
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
.progress-text.small { font-size: 12px; font-weight: 600; color: #475569; }
.dark .progress-text.small { color: #cbd5e1; }

/* Resources – redesigned */
.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
}
.resource-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  background: #f8fafc;
  border-radius: 12px;
  padding: 20px 12px;
}
.dark .resource-item { background: #0f172a; }
.resource-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 18px;
  margin-bottom: 12px;
}
.resource-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.resource-name { font-weight: 600; font-size: 14px; color: #1e293b; }
.dark .resource-name { color: #f1f5f9; }
.resource-role { font-size: 12px; color: #64748b; }
.dark .resource-role { color: #94a3b8; }
.resource-hours-wrapper {
  position: relative;
  display: inline-block;
  margin-top: 8px;
}
.hours-inside {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}
.dark .hours-inside { color: #f1f5f9; }
.resource-target { font-size: 12px; color: #64748b; margin-top: 4px; }

/* Progress ring */
.progress-ring { transform: rotate(-90deg); }
.ring-bg {
  fill: none;
  stroke: #e2e8f0;
  stroke-width: 6;
}
.dark .ring-bg { stroke: #334155; }
.ring-fill {
  fill: none;
  stroke: #10b981;
  stroke-width: 6;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s;
}

/* Backlog & Invoice lists */
.backlog-list, .invoice-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.backlog-item, .invoice-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 16px;
}
.dark .backlog-item, .dark .invoice-item { background: #1e293b; }
.backlog-name, .invoice-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dark .backlog-name, .dark .invoice-name { color: #f1f5f9; }
.backlog-status {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
  background: #fef3c7;
  color: #d97706;
}
.backlog-date { font-size: 12px; color: #64748b; }

/* Simplified Invoice Styles */
.invoice-progress {
  font-size: 13px;
  color: #475569;
  font-weight: 500;
}

.invoice-status-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}

.status-invoiced {
  background: #d1fae5;
  color: #059669;
}
.status-partial {
  background: #fef3c7;
  color: #d97706;
}
.status-not-invoiced {
  background: #fee2e2;
  color: #dc2626;
}
.dark .status-invoiced {
  background: #064e3b;
  color: #34d399;
}
.dark .status-partial {
  background: #78350f;
  color: #fbbf24;
}
.dark .status-not-invoiced {
  background: #7f1d1d;
  color: #fca5a5;
}

.empty-message { text-align: center; color: #94a3b8; padding: 16px; font-size: 13px; }
</style>