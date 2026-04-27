<template>
  <Teleport to="body">
    <div v-if="show" class="prmpt-modal-overlay" @click="closeModal">
      <div class="prmpt-modal-container manday-modal-container" @click.stop>
        <!-- Modal Header -->
        <div class="prmpt-modal-header info">
          <span class="material-symbols-outlined prmpt-modal-icon">calendar_month</span>
          <h3 class="prmpt-modal-title">Manday Details</h3>
          <button class="close-btn" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="prmpt-modal-body manday-modal-body">
          <!-- Task Info -->
          <div class="task-info-card">
            <div class="task-title-row">
              <span class="task-title">{{ task?.taskTitle || 'N/A' }}</span>
              <span class="task-code">{{ task?.taskCode || 'N/A' }}</span>
            </div>
            <div class="task-meta">
              <span class="milestone-badge">{{ task?.milestone || 'N/A' }}</span>
              <span class="date-badge">{{ task?.milestoneDate || 'N/A' }}</span>
            </div>
          </div>

          <!-- Manday Summary Cards -->
          <div class="summary-cards">
            <div class="summary-card planned">
              <div class="card-label">Planned Mandays</div>
              <div class="card-value">{{ task?.planMandays || 0 }}</div>
              <div class="card-subtitle">Assigned by PM</div>
            </div>
            <div class="summary-card actual"
              :class="{ 'over-budget': (task?.actualMandays || 0) > (task?.planMandays || 0) }">
              <div class="card-label">Actual Mandays</div>
              <div class="card-value">{{ task?.actualMandays || 0 }}</div>
              <div class="card-subtitle">Logged by team</div>
            </div>
            <div class="summary-card variance">
              <div class="card-label">Variance</div>
              <div class="card-value" :class="getVarianceClass">
                {{ getVariance }}
              </div>
              <div class="card-subtitle">{{ getVarianceText }}</div>
            </div>
          </div>

          <!-- Team Member Breakdown - Table Format -->
          <div class="breakdown-section">
            <h4 class="section-title">
              <span class="material-symbols-outlined">group</span>
              Team Member Manday Comparison
            </h4>

            <div class="table-responsive">
              <table class="comparison-table">
                <thead>
                  <tr>
                    <th>Team Member</th>
                    <th>Role</th>
                    <th>Planned</th>
                    <th>Actual</th>
                    <th>Variance</th>
                    <th>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="member in taskMembers" :key="member.id">
                    <td class="member-cell">
                      <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                        {{ member.initials }}
                      </div>
                      <span>{{ member.name }}</span>
                    </td>
                    <td>{{ member.role }}</td>
                    <td class="number-cell planned">{{ member.plannedMandays }}</td>
                    <td class="number-cell actual"
                      :class="{ 'over-budget': member.actualMandays > member.plannedMandays }">
                      {{ member.actualMandays }}
                    </td>
                    <td class="number-cell">
                      <span class="variance-badge-table" :class="getMemberVarianceClass(member)">
                        {{ getMemberVariance(member) }}
                      </span>
                    </td>
                    <td class="number-cell">
                      <div class="utilization-bar">
                        <div class="utilization-fill" :style="{ width: getUtilizationPercentage(member) + '%' }"
                          :class="getUtilizationClass(member)">
                        </div>
                        <span class="utilization-value">{{ getUtilizationPercentage(member) }}%</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td colspan="2" class="total-label">Total</td>
                    <td class="number-cell total-planned">{{ task?.planMandays || 0 }}</td>
                    <td class="number-cell total-actual"
                      :class="{ 'over-budget': (task?.actualMandays || 0) > (task?.planMandays || 0) }">
                      {{ task?.actualMandays || 0 }}
                    </td>
                    <td class="number-cell">
                      <span class="variance-badge-table" :class="getVarianceClass">
                        {{ getVariance > 0 ? '+' : '' }}{{ getVariance }}
                      </span>
                    </td>
                    <td class="number-cell">
                      <div class="utilization-bar">
                        <div class="utilization-fill" :style="{ width: getOverallUtilizationPercentage + '%' }"
                          :class="getOverallUtilizationClass">
                        </div>
                        <span class="utilization-value">{{ getOverallUtilizationPercentage }}%</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <!-- Daily Log Summary - Grouped by Member -->
          <div class="date-section" v-if="taskLogs?.length">
            <h4 class="section-title">
              <span class="material-symbols-outlined">calendar_month</span>
              Daily Log Summary
              <span class="log-count-badge">{{ totalLogEntries }} entries</span>
            </h4>

            <!-- Summary Cards -->
            <div class="log-summary-cards">
              <div v-for="member in memberLogSummary" :key="member.id" class="log-summary-card"
                :class="{ 'expanded': expandedMember === member.id }" @click="toggleMemberLogs(member.id)">
                <div class="log-member-info">
                  <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                    {{ member.initials }}
                  </div>
                  <span class="log-member-name">{{ member.name }}</span>
                </div>
                <div class="log-stats">
                  <div class="log-stat">
                    <span class="log-stat-label">Total Hours</span>
                    <span class="log-stat-value">{{ member.totalHours }}h</span>
                  </div>
                  <div class="log-stat">
                    <span class="log-stat-label">Entries</span>
                    <span class="log-stat-value">{{ member.entryCount }}</span>
                  </div>
                  <div class="log-stat">
                    <span class="log-stat-label">Avg/Day</span>
                    <span class="log-stat-value">{{ member.avgHoursPerDay }}h</span>
                  </div>
                </div>
                <div class="expand-icon" :class="{ 'expanded': expandedMember === member.id }">
                  <span class="material-symbols-outlined">
                    {{ expandedMember === member.id ? 'expand_less' : 'expand_more' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Expanded Daily Logs for Selected Member -->
            <div v-if="expandedMember" class="expanded-logs">
              <div class="expanded-header">
                <span class="expanded-title">Daily Logs for {{ getMemberName(expandedMember) }}</span>
                <button class="close-expanded-btn" @click="expandedMember = null">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
              <div class="table-responsive">
                <table class="daily-log-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Hours</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="log in getMemberLogs(expandedMember)" :key="log.date">
                      <td>{{ formatDate(log.date) }}</td>
                      <td class="number-cell">{{ log.hours }}h</td>
                      <td class="notes-cell">{{ log.notes || '—' }}</td>
                    </tr>
                    <tr class="log-total-row">
                      <td class="total-label">Total</td>
                      <td class="number-cell total-value">{{ getMemberTotalHours(expandedMember) }}h</td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Quick View Toggle -->
            <div class="log-view-toggle" v-if="!expandedMember">
              <button class="view-all-btn" :class="{ 'active': showAllLogs }" @click="showAllLogs = !showAllLogs">
                <span class="material-symbols-outlined">{{ showAllLogs ? 'collapse_all' : 'expand_all' }}</span>
                {{ showAllLogs ? 'Hide All Logs' : 'View All Logs' }}
              </button>
            </div>

            <!-- All Logs Table (Compact) -->
            <div v-if="showAllLogs && !expandedMember" class="all-logs-table">
              <div class="table-responsive">
                <table class="daily-log-table compact">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Member</th>
                      <th>Hours</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="log in paginatedLogs" :key="log.date + log.memberName">
                      <td>{{ formatDate(log.date) }}</td>
                      <td>
                        <div class="member-tag">
                          <div class="member-dot" :style="{ backgroundColor: getMemberColor(log.memberName) }"></div>
                          {{ log.memberName }}
                        </div>
                      </td>
                      <td class="number-cell">{{ log.hours }}h</td>
                      <td class="notes-cell">{{ log.notes || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Pagination for All Logs -->
              <div v-if="totalLogPages > 1" class="log-pagination">
                <button class="pagination-btn" :disabled="currentLogPage === 1" @click="currentLogPage--">
                  <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <span class="page-info">Page {{ currentLogPage }} of {{ totalLogPages }}</span>
                <button class="pagination-btn" :disabled="currentLogPage === totalLogPages" @click="currentLogPage++">
                  <span class="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="no-logs">
            <span class="material-symbols-outlined">event_busy</span>
            <p>No daily logs available</p>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'MandayDetailModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    task: {
      type: Object,
      default: null
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const closeModal = () => {
      emit('close')
    }

    // Expanded state
    const expandedMember = ref(null)
    const showAllLogs = ref(false)
    const currentLogPage = ref(1)
    const logsPerPage = 5

    // Mock team members assigned to this task
    const taskMembers = computed(() => {
      if (!props.task) return []

      return [
        {
          id: 1,
          name: 'John Smith',
          role: 'Senior Developer',
          initials: 'JS',
          avatarColor: '#3b82f6',
          plannedMandays: Math.floor((props.task?.planMandays || 10) * 0.4) || 4,
          actualMandays: Math.floor((props.task?.actualMandays || 12) * 0.45) || 5
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'UI/UX Designer',
          initials: 'SJ',
          avatarColor: '#10b981',
          plannedMandays: Math.floor((props.task?.planMandays || 10) * 0.35) || 3,
          actualMandays: Math.floor((props.task?.actualMandays || 12) * 0.3) || 4
        },
        {
          id: 3,
          name: 'Michael Chen',
          role: 'Backend Developer',
          initials: 'MC',
          avatarColor: '#f59e0b',
          plannedMandays: Math.floor((props.task?.planMandays || 10) * 0.25) || 3,
          actualMandays: Math.floor((props.task?.actualMandays || 12) * 0.25) || 3
        }
      ]
    })

    // Mock daily logs - generate more logs to test pagination
    const taskLogs = computed(() => {
      if (!props.task) return []

      const logs = []
      const members = ['John Smith', 'Sarah Johnson', 'Michael Chen']
      const notes = ['API development', 'UI design', 'Database work', 'Testing', 'Code review', 'Documentation', 'Bug fix', 'Meeting']

      // Generate 30 days of logs
      for (let i = 1; i <= 30; i++) {
        const date = new Date(2024, 2, i)
        const member = members[Math.floor(Math.random() * members.length)]
        logs.push({
          date: date.toISOString().split('T')[0],
          memberName: member,
          hours: Math.floor(Math.random() * 4) + 2, // 2-6 hours
          notes: notes[Math.floor(Math.random() * notes.length)]
        })
      }

      return logs.sort((a, b) => new Date(b.date) - new Date(a.date))
    })

    // Member log summary
    const memberLogSummary = computed(() => {
      const summary = {}

      taskLogs.value.forEach(log => {
        if (!summary[log.memberName]) {
          const member = taskMembers.value.find(m => m.name === log.memberName) || {
            id: log.memberName,
            name: log.memberName,
            initials: log.memberName.split(' ').map(n => n[0]).join(''),
            avatarColor: '#6b7280'
          }

          summary[log.memberName] = {
            id: member.id,
            name: member.name,
            initials: member.initials,
            avatarColor: member.avatarColor,
            totalHours: 0,
            entryCount: 0,
            logs: []
          }
        }

        summary[log.memberName].totalHours += log.hours
        summary[log.memberName].entryCount++
        summary[log.memberName].logs.push(log)
      })

      // Calculate averages
      Object.values(summary).forEach(member => {
        member.avgHoursPerDay = Math.round((member.totalHours / member.entryCount) * 10) / 10
      })

      return Object.values(summary)
    })

    const totalLogEntries = computed(() => taskLogs.value.length)

    const getMemberName = (memberId) => {
      const member = memberLogSummary.value.find(m => m.id === memberId)
      return member ? member.name : ''
    }

    const getMemberLogs = (memberId) => {
      const member = memberLogSummary.value.find(m => m.id === memberId)
      return member ? member.logs.sort((a, b) => new Date(b.date) - new Date(a.date)) : []
    }

    const getMemberTotalHours = (memberId) => {
      const member = memberLogSummary.value.find(m => m.id === memberId)
      return member ? member.totalHours : 0
    }

    const getMemberColor = (memberName) => {
      const member = taskMembers.value.find(m => m.name === memberName)
      return member ? member.avatarColor : '#6b7280'
    }

    const toggleMemberLogs = (memberId) => {
      expandedMember.value = expandedMember.value === memberId ? null : memberId
      showAllLogs.value = false
    }

    // Pagination for all logs
    const paginatedLogs = computed(() => {
      const start = (currentLogPage.value - 1) * logsPerPage
      const end = start + logsPerPage
      return taskLogs.value.slice(start, end)
    })

    const totalLogPages = computed(() =>
      Math.ceil(taskLogs.value.length / logsPerPage)
    )

    // Watch for page changes
    watch(currentLogPage, () => {
      // Reset when changing pages
    })

    const getVariance = computed(() => {
      if (!props.task) return 0
      return (props.task.actualMandays || 0) - (props.task.planMandays || 0)
    })

    const getVarianceClass = computed(() => {
      const variance = getVariance.value
      if (variance > 0) return 'variance-over'
      if (variance < 0) return 'variance-under'
      return 'variance-on'
    })

    const getVarianceText = computed(() => {
      const variance = getVariance.value
      if (variance > 0) return `${variance} mandays over`
      if (variance < 0) return `${Math.abs(variance)} mandays under`
      return 'On target'
    })

    const getMemberVariance = (member) => {
      const variance = member.actualMandays - member.plannedMandays
      if (variance > 0) return `+${variance}`
      if (variance < 0) return `${variance}`
      return '0'
    }

    const getMemberVarianceClass = (member) => {
      const variance = member.actualMandays - member.plannedMandays
      if (variance > 0) return 'variance-over'
      if (variance < 0) return 'variance-under'
      return 'variance-on'
    }

    const getUtilizationPercentage = (member) => {
      return Math.round((member.actualMandays / (props.task?.planMandays || 1)) * 100)
    }

    const getUtilizationClass = (member) => {
      const percentage = getUtilizationPercentage(member)
      if (percentage > 100) return 'utilization-critical'
      if (percentage > 80) return 'utilization-high'
      if (percentage > 50) return 'utilization-medium'
      return 'utilization-low'
    }

    const getOverallUtilizationPercentage = computed(() => {
      return Math.round(((props.task?.actualMandays || 0) / (props.task?.planMandays || 1)) * 100)
    })

    const getOverallUtilizationClass = computed(() => {
      const percentage = getOverallUtilizationPercentage.value
      if (percentage > 100) return 'utilization-critical'
      if (percentage > 80) return 'utilization-high'
      if (percentage > 50) return 'utilization-medium'
      return 'utilization-low'
    })

    const formatDate = (dateStr) => {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return {
      closeModal,
      taskMembers,
      taskLogs,
      memberLogSummary,
      totalLogEntries,
      expandedMember,
      showAllLogs,
      currentLogPage,
      totalLogPages,
      paginatedLogs,
      getVariance,
      getVarianceClass,
      getVarianceText,
      getMemberVariance,
      getMemberVarianceClass,
      getUtilizationPercentage,
      getUtilizationClass,
      getOverallUtilizationPercentage,
      getOverallUtilizationClass,
      getMemberName,
      getMemberLogs,
      getMemberTotalHours,
      getMemberColor,
      toggleMemberLogs,
      formatDate
    }
  }
}
</script>

<style scoped>
@import "../../../../../styles/shared/globals.css";

/* Custom styles specific to manday modal */
.manday-modal-container {
  max-width: 800px !important;
  width: 90% !important;
  max-height: 85vh !important;
}

.manday-modal-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px 24px !important;
}

/* Custom close button positioning */
.prmpt-modal-header {
  position: relative;
  padding-right: 60px !important;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1;
}

.close-btn:hover {
  background-color: var(--border-light);
  color: var(--text-light);
}

.dark .close-btn:hover {
  background-color: var(--border-dark);
  color: var(--text-dark);
}

/* Task Info Card */
.task-info-card {
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  padding: 16px;
  margin-bottom: 20px;
  border: 1px solid var(--border-light);
}

.dark .task-info-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.task-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .task-title {
  color: var(--text-dark);
}

.task-code {
  font-size: 12px;
  color: var(--muted-light);
  background-color: var(--border-light);
  padding: 2px 8px;
  border-radius: 12px;
}

.dark .task-code {
  color: var(--muted-dark);
  background-color: var(--border-dark);
}

.task-meta {
  display: flex;
  gap: 8px;
}

.milestone-badge,
.date-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
}

.milestone-badge {
  background-color: rgba(59, 130, 246, 0.1);
  color: var(--primary);
}

.date-badge {
  background-color: var(--border-light);
  color: var(--muted-light);
}

.dark .date-badge {
  background-color: var(--border-dark);
  color: var(--muted-dark);
}

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.summary-card {
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  padding: 16px;
  text-align: center;
  border: 1px solid var(--border-light);
}

.dark .summary-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.summary-card.planned {
  border-top: 3px solid var(--primary);
}

.summary-card.actual {
  border-top: 3px solid #10b981;
}

.summary-card.actual.over-budget {
  border-top: 3px solid #ef4444;
}

.summary-card.variance {
  border-top: 3px solid #8b5cf6;
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.dark .card-label {
  color: var(--muted-dark);
}

.card-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-light);
  margin-bottom: 4px;
}

.dark .card-value {
  color: var(--text-dark);
}

.card-subtitle {
  font-size: 10px;
  color: var(--muted-light);
}

.dark .card-subtitle {
  color: var(--muted-dark);
}

/* Section Title */
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
  position: relative;
}

.dark .section-title {
  color: var(--text-dark);
  border-bottom-color: var(--border-dark);
}

.section-title .material-symbols-outlined {
  font-size: 18px;
  color: var(--primary);
}

.log-count-badge {
  margin-left: auto;
  background-color: var(--primary);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.dark .log-count-badge {
  background-color: var(--primary-dark);
}

/* Table Styles */
.table-responsive {
  overflow-x: auto;
  margin-bottom: 24px;
}

.comparison-table,
.daily-log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparison-table th,
.daily-log-table th {
  text-align: left;
  padding: 12px 8px;
  background-color: var(--bg-header);
  color: var(--muted-light);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid var(--border-light);
}

.dark .comparison-table th,
.dark .daily-log-table th {
  background-color: var(--dark-bg-header);
  color: var(--muted-dark);
  border-bottom-color: var(--border-dark);
}

.comparison-table td,
.daily-log-table td {
  padding: 12px 8px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-light);
}

.dark .comparison-table td,
.dark .daily-log-table td {
  border-bottom-color: var(--border-dark);
  color: var(--text-dark);
}

.comparison-table tbody tr:hover,
.daily-log-table tbody tr:hover {
  background-color: var(--bg-header);
}

.dark .comparison-table tbody tr:hover,
.dark .daily-log-table tbody tr:hover {
  background-color: var(--dark-bg-header);
}

.member-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.number-cell {
  text-align: right;
  font-weight: 600;
}

.planned {
  color: var(--primary);
}

.actual {
  color: #10b981;
}

.actual.over-budget {
  color: #ef4444;
}

/* Variance Badge in Table */
.variance-badge-table {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.variance-badge-table.variance-over {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.variance-badge-table.variance-under {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.variance-badge-table.variance-on {
  background-color: rgba(107, 114, 128, 0.1);
  color: var(--muted-light);
}

/* Utilization Bar */
.utilization-bar {
  width: 100px;
  height: 20px;
  background-color: var(--border-light);
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  display: inline-block;
}

.dark .utilization-bar {
  background-color: var(--border-dark);
}

.utilization-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.utilization-fill.utilization-critical {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.utilization-fill.utilization-high {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.utilization-fill.utilization-medium {
  background: linear-gradient(90deg, #10b981, #059669);
}

.utilization-fill.utilization-low {
  background: linear-gradient(90deg, #3b82f6, #2563eb);
}

.utilization-value {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-size: 10px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  pointer-events: none;
}

/* Total Row */
.total-row {
  background-color: var(--bg-header);
  font-weight: 700;
}

.dark .total-row {
  background-color: var(--dark-bg-header);
}

.total-label {
  font-size: 13px;
  color: var(--text-light);
}

.dark .total-label {
  color: var(--text-dark);
}

.total-planned {
  color: var(--primary);
}

.total-actual {
  color: #10b981;
}

.total-actual.over-budget {
  color: #ef4444;
}

/* Log Summary Cards */
.log-summary-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
  cursor: pointer;
}

.log-summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  transition: all 0.2s;
}

.dark .log-summary-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.log-summary-card:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.log-member-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 140px;
}

.log-member-name {
  font-weight: 600;
  color: var(--text-light);
}

.dark .log-member-name {
  color: var(--text-dark);
}

.log-stats {
  display: flex;
  gap: 16px;
  flex: 1;
  justify-content: center;
}

.log-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.log-stat-label {
  font-size: 10px;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.dark .log-stat-label {
  color: var(--muted-dark);
}

.log-stat-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .log-stat-value {
  color: var(--text-dark);
}

.expand-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.expand-btn:hover {
  background-color: var(--border-light);
  color: var(--text-light);
}

.dark .expand-btn:hover {
  background-color: var(--border-dark);
  color: var(--text-dark);
}

/* Expanded Logs Section */
.expanded-logs {
  margin-top: 16px;
  padding: 16px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  animation: slideDown 0.3s ease;
}

.dark .expanded-logs {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.expanded-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.expanded-title {
  font-weight: 600;
  color: var(--text-light);
}

.dark .expanded-title {
  color: var(--text-dark);
}

.close-expanded-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-expanded-btn:hover {
  background-color: var(--border-light);
  color: var(--text-light);
}

.dark .close-expanded-btn:hover {
  background-color: var(--border-dark);
  color: var(--text-dark);
}

/* Log View Toggle */
.log-view-toggle {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

.view-all-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  background-color: transparent;
  color: var(--text-light);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none !important;
  /* Force remove underline */
}

.view-all-btn:hover {
  background-color: var(--border-light);
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.dark .view-all-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.dark .view-all-btn:hover {
  background-color: var(--border-dark);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.view-all-btn .material-symbols-outlined {
  font-size: 18px;
}

/* All Logs Table */
.all-logs-table {
  margin-top: 16px;
}

.daily-log-table.compact td {
  padding: 8px;
  font-size: 12px;
}

.member-tag {
  display: flex;
  align-items: center;
  gap: 6px;
}

.member-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.notes-cell {
  color: var(--muted-light);
  font-style: italic;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .notes-cell {
  color: var(--muted-dark);
}

/* Log Pagination */
.log-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
}

.log-pagination .pagination-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid var(--border-light);
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.log-pagination .pagination-btn:hover:not(:disabled) {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

.log-pagination .pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dark .log-pagination .pagination-btn {
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.log-pagination .page-info {
  font-size: 13px;
  color: var(--muted-light);
}

.dark .log-pagination .page-info {
  color: var(--muted-dark);
}

/* Log Total Row */
.log-total-row {
  background-color: var(--bg-header);
  font-weight: 600;
}

.dark .log-total-row {
  background-color: var(--dark-bg-header);
}

.log-total-row .total-value {
  color: var(--primary);
}

/* No Logs */
.no-logs {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--muted-light);
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px dashed var(--border-light);
  margin-top: 16px;
}

.dark .no-logs {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
  color: var(--muted-dark);
}

.no-logs .material-symbols-outlined {
  font-size: 48px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-logs p {
  font-size: 13px;
  margin: 0;
}

/* Variance Classes */
.variance-over {
  color: #ef4444;
}

.variance-under {
  color: #10b981;
}

.variance-on {
  color: var(--muted-light);
}

/* Responsive */
@media (max-width: 768px) {
  .summary-cards {
    grid-template-columns: 1fr;
  }

  .comparison-table th:nth-child(2),
  .comparison-table td:nth-child(2) {
    display: none;
    /* Hide Role column on mobile */
  }

  .utilization-bar {
    width: 60px;
  }

  .log-stats {
    gap: 8px;
  }

  .log-stat {
    min-width: 45px;
  }

  .manday-modal-container {
    width: 95% !important;
  }
}

@media (max-width: 480px) {
  .manday-modal-body {
    padding: 16px !important;
  }

  .comparison-table th:nth-child(5),
  .comparison-table td:nth-child(5) {
    display: none;
    /* Hide Variance column on very small screens */
  }

  .log-summary-card {
    flex-wrap: wrap;
    gap: 8px;
  }

  .log-member-info {
    min-width: 100%;
  }

  .log-stats {
    width: 100%;
    justify-content: space-around;
  }

  .expand-btn {
    width: 100%;
    border-radius: var(--border-radius-md);
  }

  .member-avatar-small {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }

  .manday-modal-container {
    width: 98% !important;
  }
}
</style>