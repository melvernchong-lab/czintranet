<template>
  <div class="tw-content-bottom">
    <!-- Left Column - Team Members Workload (only shown when project selected) -->
    <div v-if="selectedProject && selectedProject !== 'all'" class="left-column">
      <TeamMembersWorkload :project-id="selectedProject" :project-name="selectedProjectName" :tasks="filteredTasks" />
    </div>

    <!-- Right Column - Project Summary (only shown when project selected) -->
    <div v-if="selectedProject && selectedProject !== 'all'" class="right-column">
      <TeamWorkloadSummary :project-id="selectedProject" :project-name="selectedProjectName" :tasks="filteredTasks" />
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import TeamMembersWorkload from './TeamMembersWorkload.vue'
import TeamWorkloadSummary from './TeamWorkloadSummary.vue'

export default {
  name: 'TeamWorkload',
  components: {
    TwTable,
    TeamMembersWorkload,
    TeamWorkloadSummary
  },
  setup() {
    // State that needs to be passed to TwTable
    const selectedProject = ref('all')
    const currentDateRange = ref('Oct 23 - Oct 29, 2023')
    const currentPage = ref(1)
    const itemsPerPage = ref(10)

    // Projects list
    const projects = ref([
      { id: 'alpha-redesign', name: 'Alpha Redesign' },
      { id: 'beta-launch', name: 'Beta Launch' },
      { id: 'gamma-maintenance', name: 'Gamma Maintenance' },
      { id: 'delta-migration', name: 'Delta Cloud Migration' },
      { id: 'epsilon-app', name: 'Epsilon Mobile App' }
    ])

    // Get selected project name
    const selectedProjectName = computed(() => {
      if (selectedProject.value === 'all') return ''
      const project = projects.value.find(p => p.id === selectedProject.value)
      return project ? project.name : ''
    })

    // Tasks data organized by project
    const tasksByProject = ref({
      'alpha-redesign': [
        {
          id: 1,
          milestone: 'RD Stage',
          milestoneDate: 'Oct 15, 2023',
          taskTitle: 'Requirements Analysis',
          project: 'Alpha Redesign',
          billingPercentage: 100,
          planMandays: 5,
          actualMandays: 6,
          variance: 1,
          revenuePercentage: 120,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 2,
          milestone: 'RD Stage',
          milestoneDate: 'Oct 15, 2023',
          taskTitle: 'Technical Feasibility Study',
          project: 'Alpha Redesign',
          billingPercentage: 100,
          planMandays: 4,
          actualMandays: 4,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 3,
          milestone: 'Development Phase',
          milestoneDate: 'Nov 5, 2023',
          taskTitle: 'Backend API Development',
          project: 'Alpha Redesign',
          billingPercentage: 60,
          planMandays: 12,
          actualMandays: 8,
          variance: -4,
          revenuePercentage: 45,
          status: 'In Progress',
          hasIssue: false
        },
        {
          id: 4,
          milestone: 'Development Phase',
          milestoneDate: 'Nov 8, 2023',
          taskTitle: 'Database Design & Implementation',
          project: 'Alpha Redesign',
          billingPercentage: 60,
          planMandays: 6,
          actualMandays: 6,
          variance: 0,
          revenuePercentage: 55,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 5,
          milestone: 'Development Phase',
          milestoneDate: 'Nov 12, 2023',
          taskTitle: 'Frontend Component Development',
          project: 'Alpha Redesign',
          billingPercentage: 40,
          planMandays: 10,
          actualMandays: 7,
          variance: -3,
          revenuePercentage: 35,
          status: 'In Progress',
          hasIssue: false
        },
        {
          id: 6,
          milestone: 'SIT Stage',
          milestoneDate: 'Nov 20, 2023',
          taskTitle: 'System Integration Testing',
          project: 'Alpha Redesign',
          billingPercentage: 20,
          planMandays: 8,
          actualMandays: 2,
          variance: -6,
          revenuePercentage: 15,
          status: 'Pending',
          hasIssue: false
        }
      ],
      'beta-launch': [
        {
          id: 7,
          milestone: 'RD Stage',
          milestoneDate: 'Sep 10, 2023',
          taskTitle: 'Market Research',
          project: 'Beta Launch',
          billingPercentage: 100,
          planMandays: 3,
          actualMandays: 3,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 8,
          milestone: 'Development Phase',
          milestoneDate: 'Oct 15, 2023',
          taskTitle: 'Core API Development',
          project: 'Beta Launch',
          billingPercentage: 45,
          planMandays: 15,
          actualMandays: 12,
          variance: -3,
          revenuePercentage: 40,
          status: 'In Progress',
          hasIssue: false
        },
        {
          id: 9,
          milestone: 'Development Phase',
          milestoneDate: 'Oct 20, 2023',
          taskTitle: 'Database Schema Design',
          project: 'Beta Launch',
          billingPercentage: 30,
          planMandays: 5,
          actualMandays: 7,
          variance: 2,
          revenuePercentage: 25,
          status: 'At Risk',
          hasIssue: true
        }
      ],
      'gamma-maintenance': [
        {
          id: 10,
          milestone: 'Bug Fixing Stage',
          milestoneDate: 'Oct 5, 2023',
          taskTitle: 'Critical Bug #402 Fix',
          project: 'Gamma Maintenance',
          billingPercentage: 100,
          planMandays: 2,
          actualMandays: 3,
          variance: 1,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: true
        },
        {
          id: 11,
          milestone: 'Security Patch',
          milestoneDate: 'Oct 18, 2023',
          taskTitle: 'Security Vulnerability Patch',
          project: 'Gamma Maintenance',
          billingPercentage: 100,
          planMandays: 2,
          actualMandays: 2,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 12,
          milestone: 'Performance Optimization',
          milestoneDate: 'Oct 28, 2023',
          taskTitle: 'Query Performance Tuning',
          project: 'Gamma Maintenance',
          billingPercentage: 60,
          planMandays: 4,
          actualMandays: 3,
          variance: -1,
          revenuePercentage: 55,
          status: 'In Progress',
          hasIssue: false
        }
      ],
      'delta-migration': [
        {
          id: 13,
          milestone: 'RD Stage',
          milestoneDate: 'Oct 1, 2023',
          taskTitle: 'Migration Assessment',
          project: 'Delta Cloud Migration',
          billingPercentage: 100,
          planMandays: 4,
          actualMandays: 4,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 14,
          milestone: 'Migration Planning',
          milestoneDate: 'Oct 10, 2023',
          taskTitle: 'Migration Strategy',
          project: 'Delta Cloud Migration',
          billingPercentage: 100,
          planMandays: 3,
          actualMandays: 3,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 15,
          milestone: 'Data Migration',
          milestoneDate: 'Oct 25, 2023',
          taskTitle: 'Data Transfer Scripts',
          project: 'Delta Cloud Migration',
          billingPercentage: 40,
          planMandays: 10,
          actualMandays: 6,
          variance: -4,
          revenuePercentage: 35,
          status: 'In Progress',
          hasIssue: false
        }
      ],
      'epsilon-app': [
        {
          id: 16,
          milestone: 'RD Stage',
          milestoneDate: 'Sep 15, 2023',
          taskTitle: 'Market Research',
          project: 'Epsilon Mobile App',
          billingPercentage: 100,
          planMandays: 2,
          actualMandays: 2,
          variance: 0,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: false
        },
        {
          id: 17,
          milestone: 'Design Phase',
          milestoneDate: 'Oct 5, 2023',
          taskTitle: 'UI/UX Design',
          project: 'Epsilon Mobile App',
          billingPercentage: 100,
          planMandays: 8,
          actualMandays: 10,
          variance: 2,
          revenuePercentage: 100,
          status: 'Completed',
          hasIssue: true
        },
        {
          id: 18,
          milestone: 'Development Phase',
          milestoneDate: 'Oct 20, 2023',
          taskTitle: 'Mobile App Development',
          project: 'Epsilon Mobile App',
          billingPercentage: 25,
          planMandays: 20,
          actualMandays: 8,
          variance: -12,
          revenuePercentage: 20,
          status: 'In Progress',
          hasIssue: false
        }
      ]
    })

    // Combine all tasks from all projects
    const allTasks = computed(() => {
      return Object.values(tasksByProject.value).flat()
    })

    // Filter tasks for selected project only
    const filteredTasks = computed(() => {
      if (selectedProject.value === 'all' || !selectedProject.value) {
        return []
      }

      const projectName = selectedProjectName.value
      return allTasks.value.filter(task => task.project === projectName)
    })

    // Event handlers
    const syncTimesheets = () => {
      console.log('Syncing timesheets...')
      // Add your sync logic here
    }

    const exportData = () => {
      console.log('Exporting data...')
      // Add your export logic here
    }

    const handleTaskSelect = (task) => {
      console.log('Task selected:', task)
      // Add your task selection logic here
    }

    const handleActionClick = (action) => {
      console.log('Action clicked:', action)
      // Add your action handling logic here
    }

    return {
      // State
      selectedProject,
      selectedProjectName,
      currentDateRange,
      currentPage,
      itemsPerPage,
      projects,
      allTasks,
      filteredTasks,

      // Methods
      syncTimesheets,
      exportData,
      handleTaskSelect,
      handleActionClick
    }
  }
}
</script>

<style scoped>
@import '../../../../styles/views/projects/TeamWorkload.css';
</style>