<template>
  <div class="workload-row-section">
    <!-- Workload Card -->
    <div class="stat-card">
      <div class="stat-card-header">
        <h3 class="stat-card-title">Workload</h3>
        <button class="view-all-btn" @click="$emit('view-workload-details')">
          View All
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
      <div class="workload-content">
        <div class="workload-gauge-wrapper">
          <div class="workload-gauge">
            <svg class="gauge-svg" viewBox="0 0 36 36">
              <path class="gauge-background"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke="currentColor" stroke-dasharray="100, 100" stroke-linecap="round" stroke-width="4">
              </path>
              <path class="gauge-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="currentColor" :stroke-dasharray="`${workload.capacity}, 100`" stroke-linecap="round"
                stroke-width="4">
              </path>
            </svg>
            <div class="gauge-percentage">{{ workload.capacity }}%</div>
          </div>
        </div>
        <div class="workload-details">
          <div class="workload-stats">
            <div class="workload-stat-item">
              <span class="stat-label">Hours/Week</span>
              <span class="stat-value">{{ workload.hoursPerWeek }} hrs</span>
            </div>
            <div class="workload-stat-item">
              <span class="stat-label">Projects</span>
              <span class="stat-value">{{ workload.totalProjects || 5 }}</span>
            </div>
            <div class="workload-stat-item">
              <span class="stat-label">Active Tasks</span>
              <span class="stat-value">{{ workload.activeTasks || 23 }}</span>
            </div>
          </div>
          <p class="workload-status">
            <span class="status-indicator"></span>
            Near peak performance
          </p>
        </div>
      </div>
    </div>

    <!-- Portfolio Summary Card -->
    <div class="stat-card summary-card">
      <div class="stat-card-header">
        <h3 class="stat-card-title">Portfolio Health</h3>
        <button class="view-all-btn" @click="$emit('generate-report')">
          View Report
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div class="summary-metrics">
        <div class="metric-item">
          <span class="metric-label">M-Rate</span>
          <span class="metric-value">{{ portfolioSummary.mRate }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-label">On Track</span>
          <span class="metric-value">{{ portfolioSummary.onTrack || 3 }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-label">At Risk</span>
          <span class="metric-value at-risk">{{ portfolioSummary.atRisk || 1 }}</span>
        </div>
        <div class="metric-divider"></div>
        <div class="metric-item">
          <span class="metric-label">Caution</span>
          <span class="metric-value caution">{{ portfolioSummary.caution || 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Deliverables Card -->
    <div class="stat-card deliverables-card">
      <div class="stat-card-header">
        <h3 class="stat-card-title">Upcoming Deliverables</h3>
        <button class="view-all-btn" @click="$emit('view-all-deliverables')">
          View All
          <span class="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>

      <div class="deliverables-list">
        <div v-for="(deliverable, index) in deliverables" :key="deliverable.id" class="deliverable-row"
          :class="{ 'last-item': index === deliverables.length - 1 }">
          <div class="deliverable-priority">
            <div :class="['priority-dot', getPriorityClass(deliverable.priority)]"></div>
            <div v-if="index < deliverables.length - 1" class="priority-line"></div>
          </div>
          <div class="deliverable-info">
            <div class="deliverable-header">
              <span class="deliverable-title">{{ deliverable.title }}</span>
              <span :class="['deadline-badge', getDeadlineClass(deliverable.priority)]">
                {{ deliverable.deadline }}
              </span>
            </div>
            <span class="deliverable-project">{{ deliverable.project }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WorkloadSidebar',
  props: {
    workload: {
      type: Object,
      default: () => ({
        capacity: 82,
        hoursPerWeek: 32,
        totalProjects: 5,
        activeTasks: 23
      })
    },
    deliverables: {
      type: Array,
      required: true
    },
    portfolioSummary: {
      type: Object,
      default: () => ({
        mRate: '94.2%',
        healthScore: '88/100',
        onTrack: 3,
        atRisk: 1,
        caution: 1
      })
    }
  },
  emits: ['view-workload-details', 'view-all-deliverables', 'generate-report'],
  setup() {
    const getPriorityClass = (priority) => {
      const classes = {
        urgent: 'priority-urgent',
        upcoming: 'priority-upcoming',
        warning: 'priority-warning',
        future: 'priority-future'
      }
      return classes[priority] || 'priority-future'
    }

    const getDeadlineClass = (priority) => {
      const classes = {
        urgent: 'deadline-urgent',
        upcoming: 'deadline-upcoming',
        warning: 'deadline-warning',
        future: 'deadline-future'
      }
      return classes[priority] || 'deadline-future'
    }

    return {
      getPriorityClass,
      getDeadlineClass
    }
  }
}
</script>

<style scoped>
@import '../../../../../styles/views/projects/WorkloadStat.css';
</style>