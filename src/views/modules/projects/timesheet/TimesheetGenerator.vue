<template>
  <div class="timesheet-generator">
    <!-- Header -->
    <div class="generator-header">
      <h4 class="generator-title">Generate Timesheets</h4>
      <p class="generator-subtitle">Create timesheets based on project timeline and milestones</p>
    </div>

    <!-- Timesheet Configuration -->
    <div class="config-section">
      <div class="config-grid">
        <div class="form-group">
          <label class="form-label">Timesheet Period</label>
          <select v-model="timesheetConfig.period" class="form-select">
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Start Date</label>
          <input type="date" v-model="timesheetConfig.startDate" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">End Date</label>
          <input type="date" v-model="timesheetConfig.endDate" class="form-input" />
        </div>

        <div class="form-group">
          <label class="form-label">Generate For</label>
          <select v-model="timesheetConfig.target" class="form-select">
            <option value="all">All Team Members</option>
            <option value="selected">Selected Members</option>
            <option value="milestone">By Milestone</option>
          </select>
        </div>
      </div>

      <!-- Member Selection (when "selected" is chosen) -->
      <div v-if="timesheetConfig.target === 'selected'" class="member-selection">
        <label class="form-label">Select Team Members</label>
        <div class="member-checkboxes">
          <label v-for="member in teamMembers" :key="member.id" class="member-checkbox">
            <input type="checkbox" :value="member.id" v-model="selectedMemberIds" />
            <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
              {{ member.initials }}
            </div>
            <span>{{ member.name }}</span>
          </label>
        </div>
      </div>

      <!-- Milestone Selection (when "milestone" is chosen) -->
      <div v-if="timesheetConfig.target === 'milestone'" class="milestone-selection">
        <label class="form-label">Select Milestone</label>
        <select v-model="selectedMilestoneId" class="form-select">
          <option value="">Choose a milestone</option>
          <option v-for="milestone in projectMilestones" :key="milestone.id" :value="milestone.id">
            {{ milestone.name }} ({{ formatDate(milestone.date) }})
          </option>
        </select>
      </div>
    </div>

    <!-- Timesheet Preview -->
    <div class="preview-section">
      <div class="preview-header">
        <h5 class="preview-title">Timesheet Preview</h5>
        <div class="preview-actions">
          <button class="btn-outline" @click="refreshPreview">
            <span class="material-symbols-outlined">refresh</span>
            Refresh
          </button>
          <button class="btn-outline" @click="exportTimesheets">
            <span class="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
      </div>

      <!-- Timesheet Periods -->
      <div class="periods-list">
        <div v-for="(period, index) in timesheetPeriods" :key="period.id" class="period-card">
          <div class="period-header" @click="togglePeriod(index)">
            <div class="period-title">
              <span class="material-symbols-outlined expand-icon">
                {{ period.expanded ? 'expand_more' : 'chevron_right' }}
              </span>
              <span class="period-name">{{ period.name }}</span>
              <span class="period-dates">{{ formatDateRange(period.startDate, period.endDate) }}</span>
            </div>
            <div class="period-stats">
              <span class="stat-badge">
                {{ getTotalHours(period) }} hrs
              </span>
              <span class="stat-badge" :class="{ warning: isOverdue(period) }">
                {{ getMemberCount(period) }} members
              </span>
            </div>
          </div>

          <!-- Period Details (expanded) -->
          <div v-if="period.expanded" class="period-details">
            <!-- Member Timesheets -->
            <div v-for="member in period.members" :key="member.id" class="member-timesheet">
              <div class="member-info">
                <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                  {{ member.initials }}
                </div>
                <div class="member-details">
                  <span class="member-name">{{ member.name }}</span>
                  <span class="member-role">{{ member.role }}</span>
                </div>
              </div>

              <!-- Daily Hours Entry -->
              <div class="daily-hours">
                <div v-for="day in period.days" :key="day.date" class="day-entry">
                  <span class="day-label">{{ formatDay(day.date) }}</span>
                  <input type="number" v-model="day.hours[member.id]" class="hours-input" min="0" max="24" step="0.5"
                    placeholder="0" @change="updateTotalHours(period, member)" />
                </div>
              </div>

              <!-- Member Total -->
              <div class="member-total">
                <span class="total-label">Total:</span>
                <span class="total-value">{{ getMemberTotalHours(period, member.id) }} hrs</span>
              </div>
            </div>

            <!-- Period Summary -->
            <div class="period-summary">
              <div class="summary-row">
                <span>Total Hours:</span>
                <span class="summary-value">{{ getTotalHours(period) }} hrs</span>
              </div>
              <div class="summary-row">
                <span>Billable Hours:</span>
                <span class="summary-value">{{ getBillableHours(period) }} hrs</span>
              </div>
              <div class="summary-row">
                <span>Status:</span>
                <span class="status-badge" :class="getPeriodStatus(period)">
                  {{ getPeriodStatus(period) }}
                </span>
              </div>
            </div>

            <!-- Period Actions -->
            <div class="period-actions">
              <button class="btn-icon" @click="generateTimesheet(period)">
                <span class="material-symbols-outlined">description</span>
                Generate
              </button>
              <button class="btn-icon" @click="sendReminder(period)">
                <span class="material-symbols-outlined">notifications</span>
                Remind
              </button>
              <button class="btn-icon" @click="approveTimesheet(period)">
                <span class="material-symbols-outlined">check_circle</span>
                Approve
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary Section -->
    <div class="summary-section">
      <div class="summary-card">
        <div class="summary-icon">
          <span class="material-symbols-outlined">schedule</span>
        </div>
        <div class="summary-content">
          <span class="summary-label">Total Periods</span>
          <span class="summary-number">{{ timesheetPeriods.length }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <span class="material-symbols-outlined">person</span>
        </div>
        <div class="summary-content">
          <span class="summary-label">Total Members</span>
          <span class="summary-number">{{ totalUniqueMembers }}</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <span class="material-symbols-outlined">hourglass_empty</span>
        </div>
        <div class="summary-content">
          <span class="summary-label">Total Hours</span>
          <span class="summary-number">{{ totalProjectHours }} hrs</span>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon">
          <span class="material-symbols-outlined">payments</span>
        </div>
        <div class="summary-content">
          <span class="summary-label">Est. Cost</span>
          <span class="summary-number">${{ estimatedCost }}</span>
        </div>
      </div>
    </div>

    <!-- Generate Button -->
    <div class="generate-footer">
      <button class="btn-primary generate-all-btn" @click="generateAllTimesheets">
        <span class="material-symbols-outlined">auto_awesome</span>
        Generate All Timesheets
      </button>
      <button class="btn-secondary" @click="scheduleTimesheets">
        <span class="material-symbols-outlined">schedule_send</span>
        Schedule Generation
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'TimesheetGenerator',
  props: {
    projectData: {
      type: Object,
      required: true
    },
    timelineData: {
      type: Object,
      default: () => ({})
    },
    teamMembers: {
      type: Array,
      required: true
    },
    projectMilestones: {
      type: Array,
      default: () => []
    }
  },
  emits: ['generate', 'update', 'export'],
  setup(props, { emit }) {
    const timesheetConfig = ref({
      period: 'weekly',
      startDate: props.projectData?.startDate || new Date().toISOString().split('T')[0],
      endDate: props.projectData?.endDate || new Date().toISOString().split('T')[0],
      target: 'all'
    })

    const selectedMemberIds = ref([])
    const selectedMilestoneId = ref('')
    const timesheetPeriods = ref([])

    // Computed properties
    const totalUniqueMembers = computed(() => {
      const members = new Set()
      timesheetPeriods.value.forEach(period => {
        period.members?.forEach(member => members.add(member.id))
      })
      return members.size
    })

    const totalProjectHours = computed(() => {
      return timesheetPeriods.value.reduce((total, period) => {
        return total + getTotalHours(period)
      }, 0)
    })

    const estimatedCost = computed(() => {
      // Assuming $50 per hour average rate
      return (totalProjectHours.value * 50).toLocaleString()
    })

    // Methods
    function generateTimesheetPeriods() {
      const periods = []
      const start = new Date(timesheetConfig.value.startDate)
      const end = new Date(timesheetConfig.value.endDate)
      let currentStart = new Date(start)

      while (currentStart <= end) {
        let periodEnd
        switch (timesheetConfig.value.period) {
          case 'weekly':
            periodEnd = new Date(currentStart)
            periodEnd.setDate(periodEnd.getDate() + 6)
            break
          case 'biweekly':
            periodEnd = new Date(currentStart)
            periodEnd.setDate(periodEnd.getDate() + 13)
            break
          case 'monthly':
            periodEnd = new Date(currentStart)
            periodEnd.setMonth(periodEnd.getMonth() + 1)
            periodEnd.setDate(periodEnd.getDate() - 1)
            break
          default:
            periodEnd = new Date(currentStart)
            periodEnd.setDate(periodEnd.getDate() + 6)
        }

        if (periodEnd > end) periodEnd = new Date(end)

        const period = {
          id: `period-${periods.length}`,
          name: `${timesheetConfig.value.period.charAt(0).toUpperCase() + timesheetConfig.value.period.slice(1)} ${periods.length + 1}`,
          startDate: new Date(currentStart),
          endDate: new Date(periodEnd),
          expanded: periods.length === 0, // Expand first period by default
          members: getMembersForPeriod(currentStart, periodEnd),
          days: generateDaysInRange(currentStart, periodEnd),
          status: 'pending'
        }

        periods.push(period)
        currentStart = new Date(periodEnd)
        currentStart.setDate(currentStart.getDate() + 1)
      }

      timesheetPeriods.value = periods
    }

    function getMembersForPeriod(startDate, endDate) {
      let members = []

      switch (timesheetConfig.value.target) {
        case 'all':
          members = [...props.teamMembers]
          break
        case 'selected':
          members = props.teamMembers.filter(m => selectedMemberIds.value.includes(m.id))
          break
        case 'milestone':
          if (selectedMilestoneId.value) {
            const milestone = props.projectMilestones.find(m => m.id === selectedMilestoneId.value)
            if (milestone && milestone.assignments) {
              const memberIds = milestone.assignments.map(a => a.memberId)
              members = props.teamMembers.filter(m => memberIds.includes(m.id))
            }
          }
          break
      }

      return members.map(member => ({
        ...member,
        totalHours: 0,
        tasks: []
      }))
    }

    function generateDaysInRange(startDate, endDate) {
      const days = []
      const current = new Date(startDate)

      while (current <= endDate) {
        days.push({
          date: new Date(current),
          hours: {},
          isWeekend: current.getDay() === 0 || current.getDay() === 6
        })
        current.setDate(current.getDate() + 1)
      }

      return days
    }

    function getTotalHours(period) {
      if (!period.members || !period.days) return 0

      return period.members.reduce((total, member) => {
        return total + getMemberTotalHours(period, member.id)
      }, 0)
    }

    function getMemberTotalHours(period, memberId) {
      if (!period.days) return 0

      return period.days.reduce((total, day) => {
        return total + (Number(day.hours[memberId]) || 0)
      }, 0)
    }

    function getBillableHours(period) {
      // For now, assume all hours are billable
      return getTotalHours(period)
    }

    function getMemberCount(period) {
      return period.members?.length || 0
    }

    function isOverdue(period) {
      return new Date(period.endDate) < new Date() && period.status !== 'approved'
    }

    function getPeriodStatus(period) {
      if (period.status === 'approved') return 'approved'
      if (isOverdue(period)) return 'overdue'
      return 'pending'
    }

    function formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }

    function formatDateRange(start, end) {
      return `${formatDate(start)} - ${formatDate(end)}`
    }

    function formatDay(date) {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric'
      })
    }

    function togglePeriod(index) {
      timesheetPeriods.value[index].expanded = !timesheetPeriods.value[index].expanded
    }

    function updateTotalHours(period, member) {
      const total = getMemberTotalHours(period, member.id)
      const memberIndex = period.members.findIndex(m => m.id === member.id)
      if (memberIndex !== -1) {
        period.members[memberIndex].totalHours = total
      }
      emit('update', period)
    }

    function refreshPreview() {
      generateTimesheetPeriods()
    }

    function generateTimesheet(period) {
      const timesheet = {
        id: `timesheet-${Date.now()}`,
        period: { ...period },
        project: props.projectData,
        generatedAt: new Date(),
        status: 'generated'
      }
      emit('generate', timesheet)
    }

    function generateAllTimesheets() {
      timesheetPeriods.value.forEach(period => {
        generateTimesheet(period)
      })
    }

    function exportTimesheets() {
      const exportData = {
        project: props.projectData,
        periods: timesheetPeriods.value,
        totalHours: totalProjectHours.value,
        estimatedCost: estimatedCost.value
      }
      emit('export', exportData)
    }

    function sendReminder(period) {
      console.log('Sending reminder for period:', period)
      // Implement reminder logic
    }

    function approveTimesheet(period) {
      period.status = 'approved'
      emit('update', period)
    }

    function scheduleTimesheets() {
      console.log('Scheduling timesheet generation')
      // Implement scheduling logic
    }

    // Watch for changes
    watch([timesheetConfig, selectedMemberIds, selectedMilestoneId], () => {
      generateTimesheetPeriods()
    }, { deep: true })

    // Initialize on mount
    onMounted(() => {
      generateTimesheetPeriods()
    })

    return {
      timesheetConfig,
      selectedMemberIds,
      selectedMilestoneId,
      timesheetPeriods,
      totalUniqueMembers,
      totalProjectHours,
      estimatedCost,
      formatDate,
      formatDateRange,
      formatDay,
      togglePeriod,
      getTotalHours,
      getMemberTotalHours,
      getBillableHours,
      getMemberCount,
      isOverdue,
      getPeriodStatus,
      updateTotalHours,
      refreshPreview,
      generateTimesheet,
      generateAllTimesheets,
      exportTimesheets,
      sendReminder,
      approveTimesheet,
      scheduleTimesheets
    }
  }
}
</script>

<style scoped>
@import "../../../../styles/shared/globals.css";

.timesheet-generator {
  padding: 20px;
  background-color: var(--card-light);
  border-radius: var(--border-radius-lg);
}

.dark .timesheet-generator {
  background-color: var(--card-dark);
}

.generator-header {
  margin-bottom: 24px;
}

.generator-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 4px 0;
}

.dark .generator-title {
  color: var(--text-dark);
}

.generator-subtitle {
  font-size: 13px;
  color: var(--muted-light);
  margin: 0;
}

/* Config Section */
.config-section {
  margin-bottom: 24px;
  padding: 20px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.dark .config-section {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.member-selection,
.milestone-selection {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

.dark .member-selection,
.dark .milestone-selection {
  border-top-color: var(--border-dark);
}

.member-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 12px;
}

.member-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--card-light);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.dark .member-checkbox {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
}

.member-checkbox:hover {
  border-color: var(--primary);
}

.member-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

/* Preview Section */
.preview-section {
  margin-bottom: 24px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
}

.dark .preview-title {
  color: var(--text-dark);
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.btn-outline {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-outline:hover {
  background-color: var(--bg-header);
  border-color: var(--primary);
  color: var(--primary);
}

/* Period Cards */
.periods-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.period-card {
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.dark .period-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.period-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.period-header:hover {
  background-color: rgba(59, 130, 246, 0.05);
}

.period-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  font-size: 20px;
  color: var(--muted-light);
}

.period-name {
  font-weight: 600;
  color: var(--text-light);
}

.dark .period-name {
  color: var(--text-dark);
}

.period-dates {
  font-size: 12px;
  color: var(--muted-light);
  margin-left: 8px;
}

.period-stats {
  display: flex;
  gap: 8px;
}

.stat-badge {
  padding: 4px 8px;
  background-color: var(--card-light);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-light);
}

.dark .stat-badge {
  background-color: var(--card-dark);
  color: var(--text-dark);
}

.stat-badge.warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.period-details {
  padding: 16px;
  border-top: 1px solid var(--border-light);
  background-color: var(--card-light);
}

.dark .period-details {
  background-color: var(--card-dark);
  border-top-color: var(--border-dark);
}

/* Member Timesheet */
.member-timesheet {
  margin-bottom: 20px;
  padding: 16px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.dark .member-timesheet {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.member-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.member-details {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .member-name {
  color: var(--text-dark);
}

.member-role {
  font-size: 12px;
  color: var(--muted-light);
}

/* Daily Hours */
.daily-hours {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 8px;
  margin-bottom: 16px;
}

.day-entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
}

.hours-input {
  padding: 6px 8px;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background-color: var(--card-light);
  color: var(--text-light);
  font-size: 13px;
  text-align: right;
  width: 100%;
}

.dark .hours-input {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.hours-input:focus {
  outline: none;
  border-color: var(--primary);
}

.member-total {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.dark .member-total {
  border-top-color: var(--border-dark);
}

.total-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted-light);
}

.total-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--primary);
}

/* Period Summary */
.period-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  margin-bottom: 16px;
}

.dark .period-summary {
  background-color: var(--dark-bg-header);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: var(--text-light);
}

.dark .summary-row {
  color: var(--text-dark);
}

.summary-value {
  font-weight: 600;
  color: var(--primary);
}

.status-badge {
  padding: 4px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.status-badge.approved {
  background-color: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.status-badge.overdue {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

/* Period Actions */
.period-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn-icon {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--text-light);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* Summary Section */
.summary-section {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  transition: all 0.2s;
}

.dark .summary-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.summary-card:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
}

.summary-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
}

.summary-content {
  display: flex;
  flex-direction: column;
}

.summary-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.summary-number {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-light);
}

.dark .summary-number {
  color: var(--text-dark);
}

/* Generate Footer */
.generate-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 20px;
  border-top: 1px solid var(--border-light);
}

.dark .generate-footer {
  border-top-color: var(--border-dark);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: var(--primary);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: var(--primary-dark);
  transform: translateY(-2px);
}

.btn-secondary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: transparent;
  color: var(--text-light);
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .btn-secondary {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.btn-secondary:hover {
  background-color: var(--bg-header);
  border-color: var(--primary);
  color: var(--primary);
}

.generate-all-btn {
  background-color: #10b981;
}

.generate-all-btn:hover {
  background-color: #059669;
}

/* Responsive */
@media (max-width: 1024px) {
  .config-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .summary-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .config-grid {
    grid-template-columns: 1fr;
  }

  .period-header {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .period-title {
    flex-wrap: wrap;
  }

  .period-stats {
    width: 100%;
    justify-content: flex-start;
  }

  .daily-hours {
    grid-template-columns: repeat(4, 1fr);
  }

  .period-summary {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .period-actions {
    flex-wrap: wrap;
  }

  .btn-icon {
    flex: 1;
    justify-content: center;
  }

  .summary-section {
    grid-template-columns: 1fr;
  }

  .generate-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .daily-hours {
    grid-template-columns: repeat(2, 1fr);
  }

  .member-checkboxes {
    flex-direction: column;
  }

  .member-checkbox {
    width: 100%;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .preview-actions {
    width: 100%;
  }

  .btn-outline {
    flex: 1;
    justify-content: center;
  }
}
</style>