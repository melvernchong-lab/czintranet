<template>
  <div class="project-summary-card">
    <div class="card-header">
      <h3 class="card-title">Project Summary</h3>
      <span class="project-name">{{ projectName }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <span class="material-symbols-outlined spinning">progress_activity</span>
      <p>Calculating metrics...</p>
    </div>

    <div v-else class="summary-content">
      <!-- Manday Summary -->
      <div class="summary-section">
        <h4 class="section-title">
          <span class="material-symbols-outlined">calendar_month</span>
          Manday Analysis
        </h4>
        
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Total Planned</span>
              <span class="metric-icon">📅</span>
            </div>
            <div class="metric-value">{{ summary.totalPlannedMandays }}</div>
            <div class="metric-footer">mandays</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Total Actual</span>
              <span class="metric-icon">✅</span>
            </div>
            <div class="metric-value" :class="getMandayTrendClass(summary.mandayVariance)">
              {{ summary.totalActualMandays }}
            </div>
            <div class="metric-footer">mandays</div>
          </div>
        </div>

        <!-- Variance Indicator -->
        <div class="variance-indicator" :class="getVarianceClass(summary.mandayVariance)">
          <span class="material-symbols-outlined">{{ getVarianceIcon(summary.mandayVariance) }}</span>
          <div class="variance-details">
            <span class="variance-label">{{ getVarianceLabel(summary.mandayVariance) }}</span>
            <span class="variance-value">
              {{ summary.mandayVariance > 0 ? '+' : '' }}{{ summary.mandayVariance }} mandays
            </span>
          </div>
          <span class="variance-percentage">{{ summary.mandayVariancePercentage }}%</span>
        </div>

        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-label">
            <span>Progress</span>
            <span>{{ summary.completionPercentage }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: summary.completionPercentage + '%' }"
              :class="getProgressClass(summary.completionPercentage)"
            ></div>
          </div>
        </div>
      </div>

      <!-- Budget Summary -->
      <div class="summary-section">
        <h4 class="section-title">
          <span class="material-symbols-outlined">payments</span>
          Budget Analysis
        </h4>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Budget Allocated</span>
              <span class="metric-icon">💰</span>
            </div>
            <div class="metric-value">${{ formatNumber(summary.budgetAllocated) }}</div>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">Budget Spent</span>
              <span class="metric-icon">💸</span>
            </div>
            <div class="metric-value" :class="getBudgetTrendClass(summary.budgetVariance)">
              ${{ formatNumber(summary.budgetSpent) }}
            </div>
          </div>
        </div>

        <!-- Budget Variance -->
        <div class="variance-indicator" :class="getBudgetVarianceClass(summary.budgetVariance)">
          <span class="material-symbols-outlined">{{ getBudgetVarianceIcon(summary.budgetVariance) }}</span>
          <div class="variance-details">
            <span class="variance-label">{{ getBudgetVarianceLabel(summary.budgetVariance) }}</span>
            <span class="variance-value">
              {{ summary.budgetVariance > 0 ? '+' : '' }}${{ formatNumber(Math.abs(summary.budgetVariance)) }}
            </span>
          </div>
          <span class="variance-percentage">{{ summary.budgetVariancePercentage }}%</span>
        </div>

        <!-- Budget Utilization -->
        <div class="progress-section">
          <div class="progress-label">
            <span>Utilization</span>
            <span>{{ summary.budgetUtilization }}%</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: summary.budgetUtilization + '%' }"
              :class="getUtilizationClass(summary.budgetUtilization)"
            ></div>
          </div>
        </div>

        <!-- Forecast -->
        <div class="forecast-card" :class="getForecastClass(summary.forecast)">
          <span class="material-symbols-outlined forecast-icon">{{ getForecastIcon(summary.forecast) }}</span>
          <div class="forecast-content">
            <span class="forecast-title">{{ getForecastTitle(summary.forecast) }}</span>
            <span class="forecast-message">{{ summary.forecast.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'

export default {
  name: 'ProjectSummary',
  props: {
    projectId: {
      type: String,
      default: null
    },
    projectName: {
      type: String,
      default: null
    },
    tasks: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const isLoading = ref(false)

    // Calculate summary metrics
    const summary = computed(() => {
      if (!props.projectId || !props.tasks.length) {
        return {
          totalPlannedMandays: 0,
          totalActualMandays: 0,
          mandayVariance: 0,
          mandayVariancePercentage: 0,
          completionPercentage: 0,
          budgetAllocated: 0,
          budgetSpent: 0,
          budgetVariance: 0,
          budgetVariancePercentage: 0,
          budgetUtilization: 0,
          forecast: {
            type: 'on-track',
            message: 'Project is on track'
          }
        }
      }

      // Filter tasks for this project
      const projectTasks = props.tasks.filter(task => task.project === props.projectName)

      // Calculate mandays
      const totalPlanned = projectTasks.reduce((sum, task) => sum + (task.planMandays || 0), 0)
      const totalActual = projectTasks.reduce((sum, task) => sum + (task.actualMandays || 0), 0)
      const mandayVariance = totalActual - totalPlanned
      const mandayVariancePercentage = totalPlanned ? ((mandayVariance / totalPlanned) * 100).toFixed(1) : 0

      // Calculate completion (tasks with actual mandays > 0 are considered in progress/completed)
      const completedTasks = projectTasks.filter(task => task.actualMandays > 0).length
      const completionPercentage = projectTasks.length ? ((completedTasks / projectTasks.length) * 100).toFixed(1) : 0

      // Mock budget data - in real app, this would come from API
      const budgetAllocated = 150000
      const budgetSpent = projectTasks.reduce((sum, task) => {
        // Assuming $1000 per manday rate
        return sum + (task.actualMandays * 1000)
      }, 0)
      const budgetVariance = budgetSpent - budgetAllocated
      const budgetVariancePercentage = ((budgetVariance / budgetAllocated) * 100).toFixed(1)
      const budgetUtilization = ((budgetSpent / budgetAllocated) * 100).toFixed(1)

      // Determine forecast
      let forecast = {}
      if (budgetVariance > budgetAllocated * 0.1) {
        forecast = {
          type: 'critical',
          message: 'Budget overrun critical - immediate action required'
        }
      } else if (budgetVariance > 0) {
        forecast = {
          type: 'warning',
          message: 'Budget overrun detected - review required'
        }
      } else if (mandayVariance > totalPlanned * 0.2) {
        forecast = {
          type: 'warning',
          message: 'Manday overrun - timeline may be affected'
        }
      } else {
        forecast = {
          type: 'on-track',
          message: 'Project is on track'
        }
      }

      return {
        totalPlannedMandays: totalPlanned,
        totalActualMandays: totalActual,
        mandayVariance,
        mandayVariancePercentage,
        completionPercentage,
        budgetAllocated,
        budgetSpent,
        budgetVariance,
        budgetVariancePercentage,
        budgetUtilization,
        forecast
      }
    })

    // Helper methods
    const formatNumber = (num) => {
      return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }

    const getMandayTrendClass = (variance) => {
      if (variance > 0) return 'trend-up'
      if (variance < 0) return 'trend-down'
      return 'trend-neutral'
    }

    const getVarianceClass = (variance) => {
      if (variance > 0) return 'variance-over'
      if (variance < 0) return 'variance-under'
      return 'variance-on'
    }

    const getVarianceIcon = (variance) => {
      if (variance > 0) return 'trending_up'
      if (variance < 0) return 'trending_down'
      return 'trending_flat'
    }

    const getVarianceLabel = (variance) => {
      if (variance > 0) return 'Over budget'
      if (variance < 0) return 'Under budget'
      return 'On target'
    }

    const getBudgetTrendClass = (variance) => {
      if (variance > 0) return 'trend-up'
      if (variance < 0) return 'trend-down'
      return 'trend-neutral'
    }

    const getBudgetVarianceClass = (variance) => {
      if (variance > 0) return 'variance-over'
      if (variance < 0) return 'variance-under'
      return 'variance-on'
    }

    const getBudgetVarianceIcon = (variance) => {
      if (variance > 0) return 'trending_up'
      if (variance < 0) return 'trending_down'
      return 'trending_flat'
    }

    const getBudgetVarianceLabel = (variance) => {
      if (variance > 0) return 'Budget overrun'
      if (variance < 0) return 'Under budget'
      return 'On budget'
    }

    const getProgressClass = (percentage) => {
      if (percentage >= 75) return 'progress-high'
      if (percentage >= 40) return 'progress-medium'
      return 'progress-low'
    }

    const getUtilizationClass = (utilization) => {
      if (utilization >= 90) return 'utilization-critical'
      if (utilization >= 70) return 'utilization-high'
      if (utilization >= 40) return 'utilization-medium'
      return 'utilization-low'
    }

    const getForecastClass = (forecast) => {
      return `forecast-${forecast.type}`
    }

    const getForecastIcon = (forecast) => {
      const icons = {
        'on-track': 'check_circle',
        'warning': 'warning',
        'critical': 'error'
      }
      return icons[forecast.type] || 'info'
    }

    const getForecastTitle = (forecast) => {
      const titles = {
        'on-track': 'On Track',
        'warning': 'Warning',
        'critical': 'Critical'
      }
      return titles[forecast.type] || 'Info'
    }

    return {
      isLoading,
      summary,
      formatNumber,
      getMandayTrendClass,
      getVarianceClass,
      getVarianceIcon,
      getVarianceLabel,
      getBudgetTrendClass,
      getBudgetVarianceClass,
      getBudgetVarianceIcon,
      getBudgetVarianceLabel,
      getProgressClass,
      getUtilizationClass,
      getForecastClass,
      getForecastIcon,
      getForecastTitle
    }
  }
}
</script>

<style scoped>
.project-summary-card {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.dark .card-header {
  border-bottom-color: var(--border-dark);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.dark .card-title {
  color: var(--text-dark);
}

.project-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--primary);
  background-color: rgba(59, 130, 246, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
}

.dark .project-name {
  background-color: rgba(59, 130, 246, 0.2);
}

.summary-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.summary-section {
  margin-bottom: 24px;
}

.summary-section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.dark .section-title {
  color: var(--text-dark);
  border-bottom-color: var(--border-dark);
}

.section-title .material-symbols-outlined {
  font-size: 18px;
  color: var(--primary);
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  padding: 12px;
  border: 1px solid var(--border-light);
}

.dark .metric-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.metric-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .metric-label {
  color: var(--muted-dark);
}

.metric-icon {
  font-size: 16px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 4px;
}

.dark .metric-value {
  color: var(--text-dark);
}

.metric-footer {
  font-size: 10px;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .metric-footer {
  color: var(--muted-dark);
}

.trend-up {
  color: #dc2626;
}

.trend-down {
  color: #059669;
}

.trend-neutral {
  color: var(--text-light);
}

.dark .trend-neutral {
  color: var(--text-dark);
}

.variance-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
}

.dark .variance-indicator {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.variance-indicator.variance-over {
  border-left: 4px solid #dc2626;
}

.variance-indicator.variance-under {
  border-left: 4px solid #059669;
}

.variance-indicator.variance-on {
  border-left: 4px solid #6b7280;
}

.variance-indicator .material-symbols-outlined {
  font-size: 24px;
}

.variance-over .material-symbols-outlined {
  color: #dc2626;
}

.variance-under .material-symbols-outlined {
  color: #059669;
}

.variance-on .material-symbols-outlined {
  color: #6b7280;
}

.variance-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.variance-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-light);
}

.dark .variance-label {
  color: var(--text-dark);
}

.variance-value {
  font-size: 11px;
  color: var(--muted-light);
}

.dark .variance-value {
  color: var(--muted-dark);
}

.variance-percentage {
  font-size: 16px;
  font-weight: 700;
}

.variance-over .variance-percentage {
  color: #dc2626;
}

.variance-under .variance-percentage {
  color: #059669;
}

.variance-on .variance-percentage {
  color: #6b7280;
}

.progress-section {
  margin-bottom: 16px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--muted-light);
  margin-bottom: 6px;
}

.dark .progress-label {
  color: var(--muted-dark);
}

.progress-bar {
  height: 8px;
  background-color: var(--border-light);
  border-radius: 20px;
  overflow: hidden;
}

.dark .progress-bar {
  background-color: var(--border-dark);
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.progress-high {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.progress-medium {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-fill.progress-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-fill.utilization-critical {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.progress-fill.utilization-high {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-fill.utilization-medium {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-fill.utilization-low {
  background: linear-gradient(90deg, #6b7280, #4b5563);
}

.forecast-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--border-radius-md);
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  margin-top: 16px;
}

.dark .forecast-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.forecast-card.forecast-on-track {
  border-left: 4px solid #10b981;
}

.forecast-card.forecast-warning {
  border-left: 4px solid #f59e0b;
}

.forecast-card.forecast-critical {
  border-left: 4px solid #ef4444;
}

.forecast-icon {
  font-size: 28px;
}

.forecast-on-track .forecast-icon {
  color: #10b981;
}

.forecast-warning .forecast-icon {
  color: #f59e0b;
}

.forecast-critical .forecast-icon {
  color: #ef4444;
}

.forecast-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.forecast-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin-bottom: 4px;
}

.dark .forecast-title {
  color: var(--text-dark);
}

.forecast-message {
  font-size: 12px;
  color: var(--muted-light);
}

.dark .forecast-message {
  color: var(--muted-dark);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--muted-light);
}

.dark .loading-state {
  color: var(--muted-dark);
}

.spinning {
  animation: spin 1.5s linear infinite;
  font-size: 32px;
  margin-bottom: 12px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Scrollbar */
.summary-content::-webkit-scrollbar {
  width: 4px;
}

.summary-content::-webkit-scrollbar-track {
  background: transparent;
}

.summary-content::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 2px;
}

.dark .summary-content::-webkit-scrollbar-thumb {
  background: var(--border-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  
  .metric-value {
    font-size: 18px;
  }
}
</style>