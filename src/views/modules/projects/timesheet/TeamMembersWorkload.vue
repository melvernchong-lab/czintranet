<template>
  <div class="team-members-card">
    <!-- Card Header -->
    <div class="card-header">
      <h3 class="card-title">Project Team Members</h3>
      <div class="header-stats">
        <span class="member-count">{{ teamMembers?.length || 0 }} members</span>
      </div>
    </div>

    <!-- Team Members List -->
    <div class="members-list">
      <div v-for="member in teamMembers || []" :key="member?.id" class="member-item"
        :class="getMemberLoadClass(member)">
        <!-- Member Avatar -->
        <div class="member-avatar" :style="{ backgroundColor: member?.avatarColor }">
          {{ member?.initials }}
        </div>

        <!-- Member Info -->
        <div class="member-info">
          <div class="member-header">
            <div class="member-name-row">
              <span class="member-name">{{ member?.name }}</span>
              <span class="member-role">{{ member?.role }}</span>
            </div>
            <div class="btn-tooltip-container">
              <button class="view-details-btn" @click.stop="openMemberModal(member)"
                @mouseenter="showTooltip(member, $event)" @mouseleave="hideTooltip">
                <span class="material-symbols-outlined">visibility</span>
              </button>
            </div>
          </div>

          <!-- Member Stats -->
          <div class="member-stats">
            <!-- Regular stats -->
            <div class="stat-badge">
              <span class="stat-value">{{ member?.projectsCount || 0 }}</span>
              <span class="stat-label">Projects</span>
            </div>

            <div class="stat-badge cr-badge" :class="getCRClass(member)">
              <span class="stat-value">{{ member?.crCount || 0 }}</span>
              <span class="stat-label">CRs</span>
            </div>

            <div class="stat-badge">
              <span class="stat-value">{{ member?.tasksCount || 0 }}</span>
              <span class="stat-label">Unplanned tasks</span>
            </div>

            <div class="stat-badge workload-badge" :class="getWorkloadClass(member)">
              <span class="stat-value">{{ getWorkloadStatus(member) }}</span>
            </div>

          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="!teamMembers || teamMembers.length === 0" class="empty-state">
        <span class="material-symbols-outlined empty-icon">group_off</span>
        <p>No team members found for this project</p>
      </div>
    </div>

    <!-- Member Details Modal - Updated to include CR info -->
    <MemberDetailsModal :show="showModal" :member="selectedMember" :cr-details="selectedMember?.crDetails"
      @close="closeModal" />

    <!-- Tooltip Portal -->
    <Teleport to="body">
      <div v-if="activeTooltip" class="tooltip-portal tooltip-below" :style="tooltipStyle">
        {{ tooltipText }}
        <div class="tooltip-arrow"></div>
      </div>
    </Teleport>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import MemberDetailsModal from './MemberDetailsModal.vue'

export default {
  name: 'TeamMembersWorkload',
  components: {
    MemberDetailsModal
  },
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
    },
    changeRequests: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const showModal = ref(false)
    const selectedMember = ref(null)

    // Tooltip state
    const activeTooltip = ref(false)
    const tooltipText = ref('')
    const tooltipPosition = ref({ top: 0, left: 0 })

    // Open member modal
    const openMemberModal = (member) => {
      selectedMember.value = member
      showModal.value = true
    }

    // Close member modal
    const closeModal = () => {
      showModal.value = false
      selectedMember.value = null
    }

    // Show tooltip below the button
    const showTooltip = (member, event) => {
      const rect = event.currentTarget.getBoundingClientRect()
      tooltipPosition.value = {
        top: rect.bottom + 8,
        left: rect.left + (rect.width / 2)
      }

      // Enhanced tooltip with CR info
      if (member.crCount > 0) {
        tooltipText.value = `${member.name} · ${member.crCount} CRs (+${member.crImpact}% workload)`
      } else {
        tooltipText.value = `View ${member.name}'s details`
      }
      activeTooltip.value = true
    }

    // Hide tooltip
    const hideTooltip = () => {
      activeTooltip.value = false
    }

    // Tooltip style
    const tooltipStyle = computed(() => ({
      top: tooltipPosition.value.top + 'px',
      left: tooltipPosition.value.left + 'px'
    }))

    // Generate avatar color based on name
    const getAvatarColor = (name) => {
      if (!name) return '#3b82f6'
      const colors = [
        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
        '#ec4899', '#06b6d4', '#14b8a6', '#f97316', '#6b7280'
      ]
      const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      return colors[index]
    }

    // Get initials from name
    const getInitials = (name) => {
      if (!name) return '??'
      return name
        .split(' ')
        .map(part => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    }

    // Calculate total planned mandays for the project
    const totalPlannedMandays = computed(() => {
      if (!props.tasks || !props.tasks.length) return 0
      return props.tasks.reduce((sum, task) => sum + (task.planMandays || 0), 0)
    })

    // Calculate total actual mandays for the project
    const totalActualMandays = computed(() => {
      if (!props.tasks || !props.tasks.length) return 0
      return props.tasks.reduce((sum, task) => sum + (task.actualMandays || 0), 0)
    })

    // Calculate total variance
    const totalVariance = computed(() => {
      return totalActualMandays.value - totalPlannedMandays.value
    })

    // Calculate total utilization percentage
    const totalUtilization = computed(() => {
      if (totalPlannedMandays.value === 0) return 0
      return Math.round((totalActualMandays.value / totalPlannedMandays.value) * 100)
    })

    // Get total variance class
    const getTotalVarianceClass = computed(() => {
      if (totalVariance.value > 0) return 'variance-over'
      if (totalVariance.value < 0) return 'variance-under'
      return 'variance-on'
    })

    // Calculate total tasks
    const totalTasks = computed(() => {
      return props.tasks?.length || 0
    })

    // Calculate total CRs
    const totalCRs = computed(() => {
      return props.changeRequests?.length || 0
    })

    // Calculate average CR impact
    const averageCRImpact = computed(() => {
      if (!teamMembers.value.length) return 0
      const total = teamMembers.value.reduce((sum, member) => sum + (member.crImpact || 0), 0)
      return Math.round(total / teamMembers.value.length)
    })

    // Group tasks by milestone for breakdown
    const milestoneBreakdown = computed(() => {
      if (!props.tasks || !props.tasks.length) return []

      const milestoneMap = new Map()

      props.tasks.forEach(task => {
        if (!milestoneMap.has(task.milestone)) {
          milestoneMap.set(task.milestone, {
            name: task.milestone,
            plannedMandays: 0,
            actualMandays: 0,
            taskCount: 0
          })
        }

        const milestone = milestoneMap.get(task.milestone)
        milestone.plannedMandays += task.planMandays || 0
        milestone.actualMandays += task.actualMandays || 0
        milestone.taskCount += 1
      })

      return Array.from(milestoneMap.values()).map(m => ({
        ...m,
        variance: m.actualMandays - m.plannedMandays,
        utilization: m.plannedMandays ? Math.round((m.actualMandays / m.plannedMandays) * 100) : 0
      }))
    })

    // Get milestone variance class
    const getMilestoneVarianceClass = (milestone) => {
      if (!milestone) return ''
      if (milestone.variance > 0) return 'variance-over'
      if (milestone.variance < 0) return 'variance-under'
      return 'variance-on'
    }

    // Get milestone progress class
    const getMilestoneProgressClass = (milestone) => {
      if (!milestone) return ''
      const utilization = milestone.utilization
      if (utilization > 100) return 'progress-over'
      if (utilization > 90) return 'progress-high'
      if (utilization > 70) return 'progress-medium'
      return 'progress-normal'
    }

    // Get CR class based on count
    const getCRClass = (member) => {
      if (!member) return ''
      if (member.crCount >= 5) return 'cr-high'
      if (member.crCount >= 3) return 'cr-medium'
      if (member.crCount >= 1) return 'cr-low'
      return 'cr-none'
    }

    // Get effective workload including CR impact
    const getEffectiveWorkload = (member) => {
      if (!member) return 0
      const baseWorkload = member.workload || 0
      const crImpact = member.crImpact || 0
      return Math.min(baseWorkload + crImpact, 150) // Cap at 150%
    }

    // Get CR impact percentage for progress bar
    const getCRImpactPercentage = (member) => {
      if (!member) return 0
      const totalWorkload = getEffectiveWorkload(member)
      const baseWorkload = member.workload || 0
      return Math.min(Math.round((member.crImpact / totalWorkload) * 100), 100)
    }

    const getWorkloadIcon = (member) => {
      if (!member) return 'hourglass_empty'
      const effectiveWorkload = getEffectiveWorkload(member)

      if (effectiveWorkload >= 120) return 'warning'
      if (effectiveWorkload >= 100) return 'priority_high'
      if (effectiveWorkload >= 70) return 'hourglass_empty'
      if (effectiveWorkload >= 40) return 'check_circle'
      return 'coffee'
    }
    // Get member load class based on effective workload
    const getMemberLoadClass = (member) => {
      if (!member) return ''
      const effectiveWorkload = getEffectiveWorkload(member)
      if (effectiveWorkload >= 120) return 'high-load critical'
      if (effectiveWorkload >= 100) return 'high-load'
      if (effectiveWorkload >= 80) return 'medium-load'
      if (effectiveWorkload <= 40) return 'low-load'
      return ''
    }

    // Mock team members data with CR information
    const teamMembers = computed(() => {
      if (!props.projectId || props.projectId === 'all') return []

      const milestones = milestoneBreakdown.value

      // Mock CR distribution
      const memberCRs = {
        1: 2,  // John: 2 CRs
        2: 1,  // Sarah: 1 CR
        3: 4,  // Michael: 4 CRs
        4: 0,  // Emily: 0 CRs
        5: 1   // Robert: 1 CR
      }

      // Mock CR details
      const crDetails = {
        1: [
          { id: 'CR-001', title: 'Add new reporting feature', impact: 10, status: 'in-progress' },
          { id: 'CR-002', title: 'UI color scheme update', impact: 5, status: 'approved' }
        ],
        2: [
          { id: 'CR-003', title: 'Mobile responsive fixes', impact: 8, status: 'in-progress' }
        ],
        3: [
          { id: 'CR-004', title: 'API integration change', impact: 12, status: 'in-progress' },
          { id: 'CR-005', title: 'Database schema update', impact: 15, status: 'pending' },
          { id: 'CR-006', title: 'Security enhancement', impact: 10, status: 'approved' },
          { id: 'CR-007', title: 'Performance optimization', impact: 8, status: 'in-progress' }
        ],
        5: [
          { id: 'CR-008', title: 'DevOps pipeline update', impact: 7, status: 'approved' }
        ]
      }

      const members = [
        {
          id: 1,
          name: 'John Smith',
          role: 'Senior Developer',
          initials: 'JS',
          avatarColor: getAvatarColor('John Smith'),
          projectsCount: 3,
          tasksCount: Math.floor(props.tasks?.length * 0.3) || 8,
          completedTasks: 5,
          inProgressTasks: 2,
          pendingTasks: 1,
          atRiskTasks: 0,
          workload: 85,
          crCount: memberCRs[1],
          crImpact: memberCRs[1] * 8,
          crDetails: crDetails[1],
          projects: [
            { id: 'alpha-redesign', name: 'Alpha Redesign', color: '#3b82f6' },
            { id: 'beta-launch', name: 'Beta Launch', color: '#10b981' },
            { id: 'gamma-maintenance', name: 'Gamma Maintenance', color: '#f59e0b' }
          ],
          milestoneBreakdown: milestones.map(m => ({
            name: m.name,
            planned: Math.floor(m.plannedMandays * 0.3) || 0,
            actual: Math.floor(m.actualMandays * 0.32) || 0,
            taskCount: Math.floor(m.taskCount * 0.3) || 0,
            variance: (Math.floor(m.actualMandays * 0.32) || 0) - (Math.floor(m.plannedMandays * 0.3) || 0),
            utilization: m.plannedMandays ? Math.round(((Math.floor(m.actualMandays * 0.32) || 0) / (Math.floor(m.plannedMandays * 0.3) || 1)) * 100) : 0
          }))
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          role: 'UI/UX Designer',
          initials: 'SJ',
          avatarColor: getAvatarColor('Sarah Johnson'),
          projectsCount: 2,
          tasksCount: Math.floor(props.tasks?.length * 0.15) || 5,
          completedTasks: 3,
          inProgressTasks: 1,
          pendingTasks: 1,
          atRiskTasks: 0,
          workload: 65,
          crCount: memberCRs[2],
          crImpact: memberCRs[2] * 8,
          crDetails: crDetails[2],
          projects: [
            { id: 'alpha-redesign', name: 'Alpha Redesign', color: '#3b82f6' },
            { id: 'epsilon-app', name: 'Epsilon Mobile App', color: '#8b5cf6' }
          ],
          milestoneBreakdown: milestones.map(m => ({
            name: m.name,
            planned: Math.floor(m.plannedMandays * 0.15) || 0,
            actual: Math.floor(m.actualMandays * 0.12) || 0,
            taskCount: Math.floor(m.taskCount * 0.15) || 0,
            variance: (Math.floor(m.actualMandays * 0.12) || 0) - (Math.floor(m.plannedMandays * 0.15) || 0),
            utilization: m.plannedMandays ? Math.round(((Math.floor(m.actualMandays * 0.12) || 0) / (Math.floor(m.plannedMandays * 0.15) || 1)) * 100) : 0
          }))
        },
        {
          id: 3,
          name: 'Michael Chen',
          role: 'Backend Developer',
          initials: 'MC',
          avatarColor: getAvatarColor('Michael Chen'),
          projectsCount: 4,
          tasksCount: Math.floor(props.tasks?.length * 0.25) || 12,
          completedTasks: 6,
          inProgressTasks: 4,
          pendingTasks: 1,
          atRiskTasks: 1,
          workload: 95,
          crCount: memberCRs[3],
          crImpact: memberCRs[3] * 8,
          crDetails: crDetails[3],
          projects: [
            { id: 'alpha-redesign', name: 'Alpha Redesign', color: '#3b82f6' },
            { id: 'beta-launch', name: 'Beta Launch', color: '#10b981' },
            { id: 'delta-migration', name: 'Delta Migration', color: '#ef4444' },
            { id: 'epsilon-app', name: 'Epsilon Mobile App', color: '#8b5cf6' }
          ],
          milestoneBreakdown: milestones.map(m => ({
            name: m.name,
            planned: Math.floor(m.plannedMandays * 0.25) || 0,
            actual: Math.floor(m.actualMandays * 0.28) || 0,
            taskCount: Math.floor(m.taskCount * 0.25) || 0,
            variance: (Math.floor(m.actualMandays * 0.28) || 0) - (Math.floor(m.plannedMandays * 0.25) || 0),
            utilization: m.plannedMandays ? Math.round(((Math.floor(m.actualMandays * 0.28) || 0) / (Math.floor(m.plannedMandays * 0.25) || 1)) * 100) : 0
          }))
        },
        {
          id: 4,
          name: 'Emily Davis',
          role: 'QA Engineer',
          initials: 'ED',
          avatarColor: getAvatarColor('Emily Davis'),
          projectsCount: 3,
          tasksCount: Math.floor(props.tasks?.length * 0.2) || 15,
          completedTasks: 8,
          inProgressTasks: 5,
          pendingTasks: 2,
          atRiskTasks: 0,
          workload: 78,
          crCount: memberCRs[4],
          crImpact: memberCRs[4] * 8,
          crDetails: crDetails[4],
          projects: [
            { id: 'alpha-redesign', name: 'Alpha Redesign', color: '#3b82f6' },
            { id: 'beta-launch', name: 'Beta Launch', color: '#10b981' },
            { id: 'gamma-maintenance', name: 'Gamma Maintenance', color: '#f59e0b' }
          ],
          milestoneBreakdown: milestones.map(m => ({
            name: m.name,
            planned: Math.floor(m.plannedMandays * 0.2) || 0,
            actual: Math.floor(m.actualMandays * 0.18) || 0,
            taskCount: Math.floor(m.taskCount * 0.2) || 0,
            variance: (Math.floor(m.actualMandays * 0.18) || 0) - (Math.floor(m.plannedMandays * 0.2) || 0),
            utilization: m.plannedMandays ? Math.round(((Math.floor(m.actualMandays * 0.18) || 0) / (Math.floor(m.plannedMandays * 0.2) || 1)) * 100) : 0
          }))
        },
        {
          id: 5,
          name: 'Robert Wilson',
          role: 'DevOps Engineer',
          initials: 'RW',
          avatarColor: getAvatarColor('Robert Wilson'),
          projectsCount: 2,
          tasksCount: Math.floor(props.tasks?.length * 0.1) || 6,
          completedTasks: 2,
          inProgressTasks: 2,
          pendingTasks: 2,
          atRiskTasks: 0,
          workload: 45,
          crCount: memberCRs[5],
          crImpact: memberCRs[5] * 8,
          crDetails: crDetails[5],
          projects: [
            { id: 'delta-migration', name: 'Delta Migration', color: '#ef4444' },
            { id: 'epsilon-app', name: 'Epsilon Mobile App', color: '#8b5cf6' }
          ],
          milestoneBreakdown: milestones.map(m => ({
            name: m.name,
            planned: Math.floor(m.plannedMandays * 0.1) || 0,
            actual: Math.floor(m.actualMandays * 0.1) || 0,
            taskCount: Math.floor(m.taskCount * 0.1) || 0,
            variance: (Math.floor(m.actualMandays * 0.1) || 0) - (Math.floor(m.plannedMandays * 0.1) || 0),
            utilization: m.plannedMandays ? Math.round(((Math.floor(m.actualMandays * 0.1) || 0) / (Math.floor(m.plannedMandays * 0.1) || 1)) * 100) : 0
          }))
        }
      ].filter(member =>
        member.projects.some(p => p.id === props.projectId)
      )

      // Calculate total planned and actual for each member
      return members.map(member => ({
        ...member,
        plannedMandays: member.milestoneBreakdown.reduce((sum, m) => sum + m.planned, 0),
        actualMandays: member.milestoneBreakdown.reduce((sum, m) => sum + m.actual, 0)
      }))
    })

    // Get workload class based on effective workload (including CRs)
    const getWorkloadClass = (member) => {
      if (!member) return ''
      const effectiveWorkload = getEffectiveWorkload(member)
      if (effectiveWorkload >= 120) return 'workload-critical'
      if (effectiveWorkload >= 100) return 'workload-high'
      if (effectiveWorkload >= 70) return 'workload-medium'
      if (effectiveWorkload >= 40) return 'workload-normal'
      return 'workload-low'
    }

    // Get workload circle class
    const getWorkloadCircleClass = (member) => {
      if (!member) return ''
      const effectiveWorkload = getEffectiveWorkload(member)
      if (effectiveWorkload >= 120) return 'circle-critical'
      if (effectiveWorkload >= 100) return 'circle-high'
      if (effectiveWorkload >= 70) return 'circle-medium'
      if (effectiveWorkload >= 40) return 'circle-normal'
      return 'circle-low'
    }

    // Get workload text class
    const getWorkloadTextClass = (member) => {
      if (!member) return ''
      const effectiveWorkload = getEffectiveWorkload(member)
      if (effectiveWorkload >= 120) return 'text-critical'
      if (effectiveWorkload >= 100) return 'text-high'
      if (effectiveWorkload >= 70) return 'text-medium'
      if (effectiveWorkload >= 40) return 'text-normal'
      return 'text-low'
    }
    // Get workload status (word instead of percentage)
    const getWorkloadStatus = (member) => {
      if (!member) return 'Unknown'
      const effectiveWorkload = getEffectiveWorkload(member)

      if (effectiveWorkload >= 120) return 'Critical'
      if (effectiveWorkload >= 100) return 'Overloaded'
      if (effectiveWorkload >= 70) return 'Busy'
      if (effectiveWorkload >= 40) return 'Balanced'
      return 'Available'
    }

    // Get manday progress percentage
    const getMandayProgress = (member) => {
      if (!member || member.plannedMandays === 0) return 0
      return Math.min(Math.round((member.actualMandays / member.plannedMandays) * 100), 100)
    }

    // Get manday progress class
    const getMandayProgressClass = (member) => {
      if (!member) return ''
      const progress = getMandayProgress(member)
      if (progress > 100) return 'progress-over'
      if (progress > 90) return 'progress-high'
      if (progress > 70) return 'progress-medium'
      return 'progress-normal'
    }

    // Get manday variance class for badge
    const getMandayVarianceClass = (member) => {
      if (!member) return ''
      if (member.actualMandays > member.plannedMandays) return 'variance-over'
      if (member.actualMandays < member.plannedMandays) return 'variance-under'
      return 'variance-on'
    }

    // Get variance text
    const getVarianceText = (member) => {
      if (!member) return ''
      const variance = member.actualMandays - member.plannedMandays
      if (variance > 0) return `+${variance} over`
      if (variance < 0) return `${Math.abs(variance)} under`
      return 'on target'
    }

    // Get variance text class
    const getVarianceTextClass = (member) => {
      if (!member) return ''
      const variance = member.actualMandays - member.plannedMandays
      if (variance > 0) return 'text-over'
      if (variance < 0) return 'text-under'
      return 'text-on'
    }

    return {
      showModal,
      selectedMember,
      openMemberModal,
      closeModal,
      activeTooltip,
      tooltipText,
      tooltipStyle,
      showTooltip,
      hideTooltip,
      teamMembers,
      totalPlannedMandays,
      totalActualMandays,
      totalVariance,
      totalUtilization,
      getTotalVarianceClass,
      totalTasks,
      totalCRs,
      averageCRImpact,
      getWorkloadClass,
      getWorkloadCircleClass,
      getWorkloadTextClass,
      getWorkloadStatus,
      getEffectiveWorkload,
      getMemberLoadClass,
      getCRClass,
      getCRImpactPercentage,
      getMandayProgress,
      getMandayProgressClass,
      getMandayVarianceClass,
      getVarianceText,
      getVarianceTextClass,
      getMilestoneVarianceClass,
      getMilestoneProgressClass,
      getWorkloadIcon
    }
  }
}
</script>

<style scoped>
@import '../../../../styles/views/projects/TeamMembersWorkload.css';
</style>