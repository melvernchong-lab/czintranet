<template>
  <Teleport to="body">
    <div v-if="show" class="modal-overlay" @click="closeModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <div class="header-left">
            <div class="member-avatar-large" :style="{ backgroundColor: member.avatarColor }">
              {{ member.initials }}
            </div>
            <div class="member-title-info">
              <h2 class="member-name">{{ member.name }}</h2>
              <span class="member-role-badge">{{ member.role }}</span>
            </div>
          </div>
          <button class="close-btn" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card">
              <span class="material-symbols-outlined card-icon">assignment</span>
              <div class="card-content">
                <span class="card-label">Projects</span>
                <span class="card-value">{{ member.projectsCount }}</span>
              </div>
            </div>
            <div class="summary-card">
              <span class="material-symbols-outlined card-icon">task</span>
              <div class="card-content">
                <span class="card-label">Tasks</span>
                <span class="card-value">{{ member.tasksCount }}</span>
              </div>
            </div>
            <div class="summary-card">
              <span class="material-symbols-outlined card-icon">hourglass_empty</span>
              <div class="card-content">
                <span class="card-label">Workload</span>
                <span class="card-value" :class="getWorkloadClass(member.workload)">
                  {{ member.workload }}%
                </span>
              </div>
            </div>
            <div class="summary-card">
              <span class="material-symbols-outlined card-icon">calendar_month</span>
              <div class="card-content">
                <span class="card-label">Mandays</span>
                <span class="card-value" :class="getMandayVarianceClass(member)">
                  {{ member.actualMandays }}/{{ member.plannedMandays }}
                </span>
              </div>
            </div>
          </div>

          <!-- Workload Gauge -->
          <div class="section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">speed</span>
              Workload Analysis
            </h3>
            <div class="workload-gauge-container">
              <div class="progress-circle large">
                <svg viewBox="0 0 36 36" class="circular-chart">
                  <path class="circle-bg"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path class="circle"
                    :class="getWorkloadCircleClass(member.workload)"
                    :stroke-dasharray="`${member.workload}, 100`"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <text x="18" y="20.35" class="percentage">{{ member.workload }}%</text>
                </svg>
              </div>
              <div class="workload-details">
                <div class="detail-item">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value" :class="getWorkloadTextClass(member.workload)">
                    {{ getWorkloadStatus(member.workload) }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Capacity:</span>
                  <span class="detail-value">{{ 100 - member.workload }}% available</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Utilization:</span>
                  <span class="detail-value" :class="getMandayProgressClass(member)">
                    {{ getMandayProgress(member) }}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Task Distribution -->
          <div class="section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">checklist</span>
              Task Distribution
            </h3>
            <div class="task-distribution">
              <div class="task-stat">
                <span class="stat-name">Completed</span>
                <span class="stat-bar">
                  <span class="bar-fill completed" :style="{ width: getTaskPercentage(member.completedTasks, member.tasksCount) + '%' }"></span>
                </span>
                <span class="stat-number">{{ member.completedTasks }}</span>
              </div>
              <div class="task-stat">
                <span class="stat-name">In Progress</span>
                <span class="stat-bar">
                  <span class="bar-fill in-progress" :style="{ width: getTaskPercentage(member.inProgressTasks, member.tasksCount) + '%' }"></span>
                </span>
                <span class="stat-number">{{ member.inProgressTasks }}</span>
              </div>
              <div class="task-stat">
                <span class="stat-name">Pending</span>
                <span class="stat-bar">
                  <span class="bar-fill pending" :style="{ width: getTaskPercentage(member.pendingTasks, member.tasksCount) + '%' }"></span>
                </span>
                <span class="stat-number">{{ member.pendingTasks }}</span>
              </div>
              <div class="task-stat">
                <span class="stat-name">At Risk</span>
                <span class="stat-bar">
                  <span class="bar-fill at-risk" :style="{ width: getTaskPercentage(member.atRiskTasks, member.tasksCount) + '%' }"></span>
                </span>
                <span class="stat-number">{{ member.atRiskTasks }}</span>
              </div>
            </div>
          </div>

          <!-- Assigned Projects -->
          <div class="section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">folder</span>
              Assigned Projects
            </h3>
            <div class="projects-list">
              <div v-for="project in member.projects" :key="project.id" class="project-item">
                <span class="project-dot" :style="{ backgroundColor: project.color }"></span>
                <span class="project-name">{{ project.name }}</span>
              </div>
            </div>
          </div>

          <!-- Milestone Breakdown -->
          <div class="section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">timeline</span>
              Manday Breakdown by Milestone
            </h3>
            <div class="milestone-breakdown">
              <div 
                v-for="ms in member.milestoneBreakdown" 
                :key="ms.name"
                class="breakdown-item"
              >
                <div class="breakdown-info">
                  <span class="breakdown-name">{{ ms.name }}</span>
                  <span class="breakdown-tasks">{{ ms.taskCount }} tasks</span>
                </div>
                <div class="breakdown-values">
                  <span class="planned">{{ ms.planned }}</span>
                  <span class="separator">/</span>
                  <span class="actual" :class="getMilestoneVarianceClass(ms)">
                    {{ ms.actual }}
                  </span>
                </div>
                <div class="breakdown-progress">
                  <div class="progress-bar mini">
                    <div 
                      class="progress-fill" 
                      :style="{ width: ms.utilization + '%' }"
                      :class="getMilestoneProgressClass(ms)"
                    ></div>
                  </div>
                </div>
                <div class="breakdown-variance" :class="getMilestoneVarianceClass(ms)">
                  <span class="material-symbols-outlined variance-icon">
                    {{ getVarianceIcon(ms.variance) }}
                  </span>
                  <span>{{ getVarianceText(ms) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Footer -->
          <div class="modal-footer">
            <div class="total-mandays-info">
              <span class="material-symbols-outlined">summarize</span>
              <span>Total Mandays: {{ member.actualMandays }}/{{ member.plannedMandays }}</span>
            </div>
            <div class="variance-info" :class="getVarianceTextClass(member)">
              <span class="material-symbols-outlined">{{ getVarianceIcon(member.variance) }}</span>
              <span>{{ getVarianceText(member) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'MemberDetailsModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    member: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeModal = () => {
      emit('close')
    }

    // Task percentage for bar charts
    const getTaskPercentage = (count, total) => {
      if (total === 0) return 0
      return Math.round((count / total) * 100)
    }

    // Workload classes (reused from parent)
    const getWorkloadClass = (workload) => {
      if (workload >= 90) return 'workload-critical'
      if (workload >= 70) return 'workload-high'
      if (workload >= 40) return 'workload-medium'
      return 'workload-low'
    }

    const getWorkloadCircleClass = (workload) => {
      if (workload >= 90) return 'circle-critical'
      if (workload >= 70) return 'circle-high'
      if (workload >= 40) return 'circle-medium'
      return 'circle-low'
    }

    const getWorkloadTextClass = (workload) => {
      if (workload >= 90) return 'text-critical'
      if (workload >= 70) return 'text-high'
      if (workload >= 40) return 'text-medium'
      return 'text-low'
    }

    const getWorkloadStatus = (workload) => {
      if (workload >= 90) return 'Critical'
      if (workload >= 70) return 'High'
      if (workload >= 40) return 'Medium'
      return 'Low'
    }

    // Manday related
    const getMandayProgress = (member) => {
      if (!member || member.plannedMandays === 0) return 0
      return Math.min(Math.round((member.actualMandays / member.plannedMandays) * 100), 100)
    }

    const getMandayProgressClass = (member) => {
      const progress = getMandayProgress(member)
      if (progress > 100) return 'progress-over'
      if (progress > 90) return 'progress-high'
      if (progress > 70) return 'progress-medium'
      return 'progress-normal'
    }

    const getMandayVarianceClass = (member) => {
      if (!member) return ''
      if (member.actualMandays > member.plannedMandays) return 'variance-over'
      if (member.actualMandays < member.plannedMandays) return 'variance-under'
      return 'variance-on'
    }

    // Milestone related
    const getMilestoneVarianceClass = (ms) => {
      if (ms.variance > 0) return 'variance-over'
      if (ms.variance < 0) return 'variance-under'
      return 'variance-on'
    }

    const getMilestoneProgressClass = (ms) => {
      if (ms.utilization > 100) return 'progress-over'
      if (ms.utilization > 90) return 'progress-high'
      if (ms.utilization > 70) return 'progress-medium'
      return 'progress-normal'
    }

    // Variance text and icons
    const getVarianceText = (item) => {
      if (!item) return ''
      const variance = item.variance !== undefined ? item.variance : (item.actualMandays - item.plannedMandays)
      if (variance > 0) return `${variance} over`
      if (variance < 0) return `${Math.abs(variance)} under`
      return 'on target'
    }

    const getVarianceIcon = (variance) => {
      if (variance > 0) return 'trending_up'
      if (variance < 0) return 'trending_down'
      return 'trending_flat'
    }

    const getVarianceTextClass = (member) => {
      if (!member) return ''
      const variance = member.actualMandays - member.plannedMandays
      if (variance > 0) return 'text-over'
      if (variance < 0) return 'text-under'
      return 'text-on'
    }

    return {
      closeModal,
      getTaskPercentage,
      getWorkloadClass,
      getWorkloadCircleClass,
      getWorkloadTextClass,
      getWorkloadStatus,
      getMandayProgress,
      getMandayProgressClass,
      getMandayVarianceClass,
      getMilestoneVarianceClass,
      getMilestoneProgressClass,
      getVarianceText,
      getVarianceIcon,
      getVarianceTextClass
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-container {
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  background-color: var(--card-light);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--box-shadow-light);
  animation: slideUp 0.3s ease;
}

.dark .modal-container {
  background-color: var(--card-dark);
  box-shadow: var(--box-shadow-dark);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  position: sticky;
  top: 0;
  background-color: var(--card-light);
  z-index: 1;
}

.dark .modal-header {
  background-color: var(--card-dark);
  border-bottom-color: var(--border-dark);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.member-avatar-large {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 20px;
}

.member-title-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.dark .member-name {
  color: var(--text-dark);
}

.member-role-badge {
  font-size: 12px;
  color: var(--muted-light);
  background-color: var(--border-light);
  padding: 4px 8px;
  border-radius: 20px;
  display: inline-block;
  width: fit-content;
}

.dark .member-role-badge {
  color: var(--muted-dark);
  background-color: var(--border-dark);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background-color: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background-color: var(--border-light);
  color: var(--text-light);
}

.dark .close-btn:hover {
  background-color: var(--border-dark);
  color: var(--text-dark);
}

.modal-body {
  padding: 24px;
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dark .summary-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.card-icon {
  font-size: 24px;
  color: var(--primary);
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 11px;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .card-label {
  color: var(--muted-dark);
}

.card-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-light);
}

.dark .card-value {
  color: var(--text-dark);
}

/* Sections */
.section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
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
  font-size: 20px;
  color: var(--primary);
}

/* Workload Gauge */
.workload-gauge-container {
  display: flex;
  align-items: center;
  gap: 32px;
}

.progress-circle.large {
  width: 120px;
  height: 120px;
}

.progress-circle.large .percentage {
  font-size: 0.5rem;
}

.workload-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed var(--border-light);
}

.dark .detail-item {
  border-bottom-color: var(--border-dark);
}

.detail-label {
  font-size: 13px;
  color: var(--muted-light);
}

.dark .detail-label {
  color: var(--muted-dark);
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .detail-value {
  color: var(--text-dark);
}

/* Task Distribution */
.task-distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-stat {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-name {
  width: 80px;
  font-size: 13px;
  color: var(--text-light);
}

.dark .stat-name {
  color: var(--text-dark);
}

.stat-bar {
  flex: 1;
  height: 8px;
  background-color: var(--border-light);
  border-radius: 4px;
  overflow: hidden;
}

.dark .stat-bar {
  background-color: var(--border-dark);
}

.bar-fill {
  height: 100%;
  display: block;
  border-radius: 4px;
}

.bar-fill.completed {
  background-color: #10b981;
}

.bar-fill.in-progress {
  background-color: #3b82f6;
}

.bar-fill.pending {
  background-color: #f59e0b;
}

.bar-fill.at-risk {
  background-color: #ef4444;
}

.stat-number {
  width: 40px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-light);
  text-align: right;
}

.dark .stat-number {
  color: var(--text-dark);
}

/* Projects List */
.projects-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
}

.dark .project-item {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.project-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.project-name {
  font-size: 13px;
  color: var(--text-light);
}

.dark .project-name {
  color: var(--text-dark);
}

/* Milestone Breakdown */
.milestone-breakdown {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 8px;
}

.milestone-breakdown::-webkit-scrollbar {
  width: 4px;
}

.milestone-breakdown::-webkit-scrollbar-track {
  background: transparent;
}

.milestone-breakdown::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 2px;
}

.dark .milestone-breakdown::-webkit-scrollbar-thumb {
  background: var(--border-dark);
}

.breakdown-item {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  align-items: center;
  gap: 12px;
  padding: 8px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
}

.dark .breakdown-item {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.breakdown-info {
  display: flex;
  flex-direction: column;
}

.breakdown-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .breakdown-name {
  color: var(--text-dark);
}

.breakdown-tasks {
  font-size: 10px;
  color: var(--muted-light);
}

.dark .breakdown-tasks {
  color: var(--muted-dark);
}

.breakdown-values {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 13px;
  font-weight: 600;
}

.breakdown-values .planned {
  color: var(--muted-light);
}

.breakdown-values .actual {
  font-weight: 700;
}

.breakdown-values .actual.variance-over {
  color: #dc2626;
}

.breakdown-values .actual.variance-under {
  color: #059669;
}

.breakdown-values .separator {
  color: var(--muted-light);
}

.breakdown-progress {
  width: 100%;
}

.progress-bar.mini {
  height: 4px;
}

.breakdown-variance {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  justify-content: flex-end;
}

.breakdown-variance .variance-icon {
  font-size: 14px;
}

.breakdown-variance.variance-over {
  color: #dc2626;
}

.breakdown-variance.variance-under {
  color: #059669;
}

.breakdown-variance.variance-on {
  color: #10b981;
}

/* Modal Footer */
.modal-footer {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dark .modal-footer {
  border-top-color: var(--border-dark);
}

.total-mandays-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--primary);
}

.variance-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 20px;
  background-color: var(--bg-header);
}

.dark .variance-info {
  background-color: var(--dark-bg-header);
}

.variance-info.text-over {
  color: #dc2626;
}

.variance-info.text-under {
  color: #059669;
}

.variance-info.text-on {
  color: #10b981;
}

/* Color classes */
.workload-critical { color: #ef4444; }
.workload-high { color: #f59e0b; }
.workload-medium { color: #10b981; }
.workload-low { color: var(--muted-light); }

.text-critical { color: #ef4444; }
.text-high { color: #f59e0b; }
.text-medium { color: #10b981; }
.text-low { color: var(--primary); }

.circle-critical { stroke: #ef4444; }
.circle-high { stroke: #f59e0b; }
.circle-medium { stroke: #10b981; }
.circle-low { stroke: var(--primary); }

.variance-over { color: #dc2626; }
.variance-under { color: #059669; }
.variance-on { color: #10b981; }

.progress-over { background-color: #ef4444; }
.progress-high { background-color: #f59e0b; }
.progress-medium { background-color: #10b981; }
.progress-normal { background-color: #3b82f6; }

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .workload-gauge-container {
    flex-direction: column;
    text-align: center;
  }

  .breakdown-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .breakdown-variance {
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .modal-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-left {
    width: 100%;
  }

  .close-btn {
    align-self: flex-end;
  }

  .summary-cards {
    grid-template-columns: 1fr;
  }
}
</style>