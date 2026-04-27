<template>
  <!-- My Projects - Card View -->
  <div class="myprojects-wrapper">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading projects...</p>
    </div>

    <!-- Projects Grid -->
    <div v-else class="projects-grid">
      <div 
        v-for="project in paginatedProjects" 
        :key="project.id" 
        class="project-card"
        @click="selectProject(project)"
      >
        <!-- Card Content -->
        <div class="card-content">
          <div class="card-header">
            <div class="project-title-section">
              <span class="project-id-badge">ID: {{ project.code || getProjectCode(project.id) }}</span>
              <h3 class="project-title">{{ truncateText(project.name, 25) }}</h3>
            </div>
            <span class="health-badge" :class="getHealthBadgeClass(project.health)">
              {{ getHealthLabel(project.health) }}
            </span>
          </div>

          <!-- Progress Section -->
          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-value">{{ project.progress || 0 }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: (project.progress || 0) + '%' }" :class="getProgressClass(project.health)"></div>
            </div>
          </div>

          <!-- Metrics Grid -->
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Budget</span>
              <span class="metric-value" :class="getBudgetClass(project.budget || 0)">{{ project.budget || 0 }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Team</span>
              <span class="metric-value">{{ getTeamCapacity(project) }}% Cap.</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Issues</span>
              <span class="metric-value error">{{ project.issues || 0 }}</span>
            </div>
          </div>

          <!-- Spacer pushes footer to bottom -->
          <div class="card-content-spacer"></div>
        </div>

        <!-- Card Footer -->
        <div class="card-footer">
          <div class="team-avatars">
            <div 
              v-for="(member, idx) in getTeamMembers(project)" 
              :key="member.id"
              class="team-avatar"
              :style="{ backgroundColor: member.avatarColor, zIndex: 5 - idx }"
              :title="member.name">
              {{ member.initials }}
            </div>
            <div v-if="getRemainingMembersCount(project) > 0" class="team-avatar more">
              +{{ getRemainingMembersCount(project) }}
            </div>
          </div>
          <div class="card-actions">
            <button class="icon-btn" @click.stop="openTimesheet(project)" title="Timesheet">
              <span class="material-symbols-outlined">timer</span>
            </button>
            <button class="icon-btn" @click.stop="openGantt(project)" title="Gantt Chart">
              <span class="material-symbols-outlined">insert_chart</span>
            </button>
            <button class="view-details-btn" @click.stop="selectProject(project)">
              View Details
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="paginatedProjects.length === 0 && !isLoading" class="empty-state">
        <span class="material-symbols-outlined">folder_off</span>
        <h3>No projects found</h3>
        <p>You don't have any projects assigned yet</p>
        <button class="create-project-btn" @click="openNewProjectModal">
          <span class="material-symbols-outlined">add</span>
          Create New Project
        </button>
      </div>
    </div>

    <!-- Pagination -->
    <div class="pagination-container">
      <div class="pagination-info">
        <span class="results-range">Showing {{ paginationStart }}-{{ paginationEnd }} of {{ projects.length }} projects</span>
      </div>
      
      <nav class="pagination-nav">
        <button class="pagination-prev" @click="prevPage" :disabled="currentPage === 1">
          <span class="material-symbols-outlined">chevron_left</span>
          <span>Previous</span>
        </button>
        
        <div class="pagination-pages">
          <button 
            v-for="page in displayedPages" 
            :key="page"
            class="pagination-page"
            :class="{ active: currentPage === page, dots: page === '...' }"
            :disabled="page === '...'"
            @click="page !== '...' && goToPage(page)">
            <span v-if="page === '...'">...</span>
            <span v-else>{{ page }}</span>
          </button>
        </div>
        
        <button class="pagination-next" @click="nextPage" :disabled="currentPage === totalPages">
          <span>Next</span>
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </nav>
      
      <div class="pagination-per-page">
        <label for="results-per-page">Results per page</label>
        <div class="per-page-select">
          <select id="results-per-page" v-model="itemsPerPage" @change="handleItemsPerPageChange">
            <option :value="6">6</option>
            <option :value="9">9</option>
            <option :value="12">12</option>
            <option :value="15">15</option>
            <option :value="18">18</option>
          </select>
          <span class="select-icon material-symbols-outlined">expand_more</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export default {
  name: 'IndividualProjectContent',
  props: {
    onOpenCreateModal: {
      type: Function,
      default: null
    },
    userProjects: {
      type: Array,
      default: () => []
    }
  },
  emits: ['project-created', 'project-selected'],
  setup(props, { emit }) {
    const router = useRouter()
    const toast = useToast()
    
    const isLoading = ref(true)
    const currentPage = ref(1)
    const itemsPerPage = ref(9)
    const projects = ref([])
    
    const teamMembersList = [
      { id: 1, name: 'John Smith', role: 'Senior Developer', initials: 'JS', avatarColor: '#3b82f6' },
      { id: 2, name: 'Sarah Johnson', role: 'UI/UX Designer', initials: 'SJ', avatarColor: '#10b981' },
      { id: 3, name: 'Michael Chen', role: 'Backend Developer', initials: 'MC', avatarColor: '#f59e0b' },
      { id: 4, name: 'Emily Davis', role: 'QA Engineer', initials: 'ED', avatarColor: '#8b5cf6' },
      { id: 5, name: 'Robert Wilson', role: 'DevOps', initials: 'RW', avatarColor: '#ec4899' },
      { id: 6, name: 'Lisa Wang', role: 'Frontend Dev', initials: 'LW', avatarColor: '#06b6d4' }
    ]
    
    const loadProjectsFromStorage = () => {
      isLoading.value = true
      try {
        const savedProjects = localStorage.getItem('saved_projects')
        
        if (savedProjects) {
          const parsedProjects = JSON.parse(savedProjects)
          
          projects.value = parsedProjects.map(project => ({
            id: project.id,
            name: project.name,
            code: project.code || `PRJ-${String(project.id).slice(-6)}`,
            client: project.client || '—',
            phase: project.phase || 'Discovery',
            progress: calculateOverallProgress(project.milestones),
            health: calculateProjectHealth(project),
            budget: calculateBudgetProgress(project.milestones),
            issues: project.issues || Math.floor(Math.random() * 10),
            teamMembers: project.teamMembers || getRandomTeamMembers(),
            timelineCreated: project.timelineCreated || false,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            rawData: project
          }))
        } else {
          loadDefaultProjects()
        }
      } catch (error) {
        console.error('Error loading projects:', error)
        loadDefaultProjects()
      } finally {
        isLoading.value = false
      }
    }
    
    const calculateOverallProgress = (milestones) => {
      if (!milestones || milestones.length === 0) return 0
      
      let totalPlanMandays = 0
      let completedMandays = 0
      
      milestones.forEach(milestone => {
        if (milestone.assignments && milestone.assignments.length > 0) {
          milestone.assignments.forEach(assignment => {
            totalPlanMandays += Number(assignment.plannedMandays) || 0
            if (milestone.isSaved) {
              completedMandays += Number(assignment.plannedMandays) || 0
            }
          })
        } else {
          totalPlanMandays += milestone.totalMandays || 0
          if (milestone.isSaved) {
            completedMandays += milestone.totalMandays || 0
          }
        }
      })
      
      return totalPlanMandays > 0 ? Math.round((completedMandays / totalPlanMandays) * 100) : 0
    }
    
    const calculateBudgetProgress = (milestones) => {
      if (!milestones || milestones.length === 0) return 0
      
      let totalBudget = 0
      let usedBudget = 0
      
      milestones.forEach(milestone => {
        if (milestone.assignments && milestone.assignments.length > 0) {
          milestone.assignments.forEach(assignment => {
            totalBudget += Number(assignment.plannedMandays) || 0
            usedBudget += Number(assignment.actualMandays) || 0
          })
        }
      })
      
      return totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0
    }
    
    const calculateProjectHealth = (project) => {
      const progress = calculateOverallProgress(project.milestones)
      const budgetUsage = calculateBudgetProgress(project.milestones)
      
      if (budgetUsage > 100) return 'at-risk'
      if (progress < 30 && budgetUsage > 70) return 'caution'
      if (progress < 10) return 'caution'
      return 'healthy'
    }
    
    const getRandomTeamMembers = () => {
      const shuffled = [...teamMembersList]
      const count = Math.floor(Math.random() * 4) + 2
      return shuffled.slice(0, count)
    }
    
    const loadDefaultProjects = () => {
      projects.value = [
        {
          id: 1,
          name: 'Enterprise CRM Implementation',
          code: 'PRJ-001',
          client: 'Nexus Systems',
          phase: 'Development',
          progress: 65,
          health: 'healthy',
          budget: 65,
          issues: 3,
          teamMembers: [teamMembersList[0], teamMembersList[1], teamMembersList[2]]
        },
        {
          id: 2,
          name: 'Cloud Migration Project',
          code: 'PRJ-002',
          client: 'Logistics Inc.',
          phase: 'Deployment',
          progress: 85,
          health: 'healthy',
          budget: 85,
          issues: 1,
          teamMembers: [teamMembersList[0], teamMembersList[3], teamMembersList[4], teamMembersList[5]]
        },
        {
          id: 3,
          name: 'Security Audit & Compliance',
          code: 'PRJ-003',
          client: 'Global Fin',
          phase: 'UAT',
          progress: 45,
          health: 'caution',
          budget: 45,
          issues: 8,
          teamMembers: [teamMembersList[1], teamMembersList[2], teamMembersList[4]]
        },
        {
          id: 4,
          name: 'Mobile Banking App',
          code: 'PRJ-004',
          client: 'Bank of America',
          phase: 'Development',
          progress: 30,
          health: 'at-risk',
          budget: 30,
          issues: 12,
          teamMembers: [teamMembersList[0], teamMembersList[2], teamMembersList[5]]
        },
        {
          id: 5,
          name: 'Data Analytics Platform',
          code: 'PRJ-005',
          client: 'TechCorp',
          phase: 'Discovery',
          progress: 15,
          health: 'healthy',
          budget: 15,
          issues: 0,
          teamMembers: [teamMembersList[3], teamMembersList[4]]
        },
        {
          id: 6,
          name: 'HR Management System',
          code: 'PRJ-006',
          client: 'HealthPlus',
          phase: 'Development',
          progress: 55,
          health: 'healthy',
          budget: 55,
          issues: 4,
          teamMembers: [teamMembersList[0], teamMembersList[1], teamMembersList[3], teamMembersList[5]]
        }
      ]
    }
    
    const truncateText = (text, maxLength) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
    
    const getProjectCode = (id) => {
      return `PRJ-${String(id).slice(-6)}`
    }
    
    const getTeamMembers = (project) => {
      return project.teamMembers?.slice(0, 3) || []
    }
    
    const getRemainingMembersCount = (project) => {
      const total = project.teamMembers?.length || 0
      return total > 3 ? total - 3 : 0
    }
    
    const getTeamCapacity = (project) => {
      if (project.health === 'at-risk') return 120
      if (project.health === 'caution') return 85
      return 100
    }
    
    const getBudgetClass = (budget) => {
      if (budget >= 100) return 'over-budget'
      if (budget >= 80) return 'high-budget'
      return 'normal-budget'
    }
    
    const totalPages = computed(() => Math.ceil(projects.value.length / itemsPerPage.value) || 1)
    const paginatedProjects = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage.value
      const end = start + itemsPerPage.value
      return projects.value.slice(start, end)
    })
    
    const paginationStart = computed(() => {
      if (projects.value.length === 0) return 0
      return (currentPage.value - 1) * itemsPerPage.value + 1
    })
    
    const paginationEnd = computed(() => {
      return Math.min(currentPage.value * itemsPerPage.value, projects.value.length)
    })
    
    const displayedPages = computed(() => {
      const total = totalPages.value
      const current = currentPage.value
      const pages = []
      
      if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
      } else {
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i)
          pages.push('...')
          pages.push(total)
        } else if (current >= total - 3) {
          pages.push(1)
          pages.push('...')
          for (let i = total - 4; i <= total; i++) pages.push(i)
        } else {
          pages.push(1)
          pages.push('...')
          for (let i = current - 1; i <= current + 1; i++) pages.push(i)
          pages.push('...')
          pages.push(total)
        }
      }
      return pages
    })
    
    const handleItemsPerPageChange = () => {
      currentPage.value = 1
    }
    
    const prevPage = () => {
      if (currentPage.value > 1) currentPage.value--
    }
    
    const nextPage = () => {
      if (currentPage.value < totalPages.value) currentPage.value++
    }
    
    const goToPage = (page) => {
      currentPage.value = page
    }
    
    const openNewProjectModal = () => {
      if (props.onOpenCreateModal) {
        props.onOpenCreateModal()
      } else {
        toast.info('Create new project feature coming soon')
      }
    }
    
    const selectProject = (project) => {
      console.log('Navigating to project:', project.id)
      router.push(`/projects/${project.id}`)
      emit('project-selected', project)
    }
    
    const openTimesheet = (project) => {
      router.push(`/projects/${project.id}/timesheet`)
      toast.info(`Opening timesheet for ${project.name}`)
    }
    
    const openGantt = (project) => {
      if (project.timelineCreated) {
        router.push(`/projects/${project.id}/timeline`)
      } else {
        router.push(`/projects/${project.id}/timeline/create`)
      }
      toast.info(`Opening Gantt chart for ${project.name}`)
    }
    
    const refreshProjects = () => {
      loadProjectsFromStorage()
    }
    
    const handleStorageChange = (event) => {
      if (event.key === 'saved_projects') {
        loadProjectsFromStorage()
      }
    }
    
    const getHealthBadgeClass = (health) => {
      const classes = {
        'healthy': 'badge-healthy',
        'caution': 'badge-caution',
        'at-risk': 'badge-risk'
      }
      return classes[health] || 'badge-healthy'
    }
    
    const getHealthLabel = (health) => {
      const labels = {
        'healthy': 'Healthy',
        'caution': 'Caution',
        'at-risk': 'At Risk'
      }
      return labels[health] || 'Healthy'
    }
    
    const getProgressClass = (health) => {
      const classes = {
        'healthy': 'progress-healthy',
        'caution': 'progress-caution',
        'at-risk': 'progress-risk'
      }
      return classes[health] || 'progress-healthy'
    }
    
    onMounted(() => {
      loadProjectsFromStorage()
      window.addEventListener('storage', handleStorageChange)
    })
    
    onUnmounted(() => {
      window.removeEventListener('storage', handleStorageChange)
    })
    
    return {
      isLoading,
      currentPage,
      itemsPerPage,
      projects,
      paginatedProjects,
      totalPages,
      paginationStart,
      paginationEnd,
      displayedPages,
      truncateText,
      getProjectCode,
      getTeamMembers,
      getRemainingMembersCount,
      getTeamCapacity,
      getBudgetClass,
      handleItemsPerPageChange,
      prevPage,
      nextPage,
      goToPage,
      openNewProjectModal,
      selectProject,
      openTimesheet,
      openGantt,
      refreshProjects,
      getHealthBadgeClass,
      getHealthLabel,
      getProgressClass
    }
  }
}
</script>

<style scoped>
@import '../../../../styles/shared/globals.css';

.myprojects-wrapper {
  min-height: 100vh;
}

.dark .myprojects-wrapper {
  background: #0f172a;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  margin-top: 16px;
  color: #64748b;
  font-size: 14px;
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

/* Large Desktop */
@media (min-width: 1400px) and (max-width: 1899px) {
  .projects-grid {
    grid-template-columns: repeat(3, minmax(380px, 450px));
    justify-content: center;
    gap: 28px;
  }
}

@media (min-width: 1900px) and (max-width: 2399px) {
  .projects-grid {
    grid-template-columns: repeat(4, minmax(380px, 420px));
    justify-content: center;
    gap: 30px;
  }
}

@media (min-width: 2400px) {
  .projects-grid {
    grid-template-columns: repeat(5, minmax(380px, 420px));
    justify-content: center;
    gap: 32px;
    max-width: 2400px;
    margin-left: auto;
    margin-right: auto;
  }
}

/* Project Card */
.project-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.dark .project-card {
  background: #1e293b;
  border-color: #334155;
}

.project-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
}

/* Card Content */
.card-content {
  padding: 16px 20px 20px 20px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

@media (min-width: 1400px) {
  .card-content {
    padding: 20px 24px 24px 24px;
  }
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  gap: 12px;
  flex-shrink: 0;
}

.project-title-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.project-id-badge {
  font-size: 11px;
  font-weight: 600;
  color: #6366f1;
  background: transparent;
  padding: 0;
  letter-spacing: 0.3px;
  display: block;
  width: 100%;
  text-align: left;
  border: none;
}

@media (min-width: 1400px) {
  .project-id-badge {
    font-size: 12px;
  }
}

.dark .project-id-badge {
  color: #818cf8;
}

.project-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: normal;
  max-width: 100%;
  display: block;
}

@media (min-width: 1400px) {
  .project-title {
    font-size: 18px;
    line-height: 1.45;
  }
}

.dark .project-title {
  color: #f1f5f9;
}

.health-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 5px 12px;
  border-radius: 20px;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (min-width: 1400px) {
  .health-badge {
    font-size: 11px;
    padding: 6px 14px;
  }
}

.badge-healthy {
  background: #d1fae5;
  color: #059669;
}

.badge-caution {
  background: #fef3c7;
  color: #d97706;
}

.badge-risk {
  background: #fee2e2;
  color: #dc2626;
}

.dark .badge-healthy {
  background: #064e3b;
  color: #34d399;
}

.dark .badge-caution {
  background: #5c3d00;
  color: #fbbf24;
}

.dark .badge-risk {
  background: #7f1d1d;
  color: #f87171;
}

/* Progress Section */
.progress-section {
  margin-bottom: 20px;
  width: 100%;
  flex-shrink: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  width: 100%;
}

.progress-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

@media (min-width: 1400px) {
  .progress-label {
    font-size: 12px;
  }
}

.dark .progress-label {
  color: #94a3b8;
}

.progress-value {
  font-size: 11px;
  font-weight: 700;
  color: #1e293b;
}

@media (min-width: 1400px) {
  .progress-value {
    font-size: 12px;
  }
}

.dark .progress-value {
  color: #cbd5e1;
}

.progress-bar {
  width: 100%;
  background: #f1f5f9;
  height: 8px;
  border-radius: 10px;
  overflow: hidden;
}

@media (min-width: 1400px) {
  .progress-bar {
    height: 10px;
  }
}

.dark .progress-bar {
  background: #0f172a;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.progress-healthy {
  background: linear-gradient(90deg, #10b981, #059669);
}

.progress-caution {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.progress-risk {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 0;
  width: 100%;
  flex-shrink: 0;
}

@media (min-width: 1400px) {
  .metrics-grid {
    gap: 20px;
  }
}

.metric-item {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.metric-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
}

@media (min-width: 1400px) {
  .metric-label {
    font-size: 11px;
    margin-bottom: 8px;
  }
}

.dark .metric-label {
  color: #94a3b8;
}

.metric-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

@media (min-width: 1400px) {
  .metric-value {
    font-size: 16px;
  }
}

.dark .metric-value {
  color: #cbd5e1;
}

.metric-value.error {
  color: #ef4444;
}

.metric-value.over-budget {
  color: #ef4444;
}

.metric-value.high-budget {
  color: #f59e0b;
}

.metric-value.normal-budget {
  color: #10b981;
}

/* Spacer */
.card-content-spacer {
  flex: 1;
  min-height: 8px;
}

/* Card Footer */
.card-footer {
  background: #f8fafc;
  padding: 14px 20px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  flex-shrink: 0;
}

@media (min-width: 1400px) {
  .card-footer {
    padding: 16px 24px;
  }
}

.dark .card-footer {
  background: #0f172a;
  border-top-color: #334155;
}

/* Team Avatars */
.team-avatars {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.team-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 11px;
  border: 2px solid white;
  position: relative;
}

.dark .team-avatar {
  border-color: #1e293b;
}

.team-avatar:not(:first-child) {
  margin-left: -10px;
}

.team-avatar.more {
  background: #e2e8f0;
  color: #475569;
  font-size: 10px;
  font-weight: 700;
}

.dark .team-avatar.more {
  background: #334155;
  color: #94a3b8;
}

/* Card Actions */
.card-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #6366f1;
}

.dark .icon-btn:hover {
  background: #334155;
  color: #a5b4fc;
}

.icon-btn .material-symbols-outlined {
  font-size: 20px;
}

@media (min-width: 1400px) {
  .icon-btn .material-symbols-outlined {
    font-size: 22px;
  }
}

.view-details-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

@media (min-width: 1400px) {
  .view-details-btn {
    padding: 10px 20px;
    font-size: 13px;
  }
}

.view-details-btn:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.dark .empty-state {
  background: #1e293b;
  border-color: #334155;
}

.empty-state .material-symbols-outlined {
  font-size: 64px;
  color: #64748b;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dark .empty-state h3 {
  color: #f1f5f9;
}

.empty-state p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 20px 0;
}

.create-project-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.create-project-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Pagination */
.pagination-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 32px;
  padding: 20px 8px;
  border-top: 1px solid #e2e8f0;
}

@media (min-width: 768px) {
  .pagination-container {
    flex-direction: row;
  }
}

.dark .pagination-container {
  border-top-color: #334155;
}

.pagination-info {
  display: flex;
  align-items: center;
}

.results-range {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.5px;
}

@media (min-width: 1400px) {
  .results-range {
    font-size: 14px;
  }
}

.dark .results-range {
  color: #94a3b8;
}

.pagination-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-prev,
.pagination-next {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 10px;
}

@media (min-width: 1400px) {
  .pagination-prev,
  .pagination-next {
    padding: 12px 20px;
    font-size: 15px;
  }
}

.dark .pagination-prev,
.dark .pagination-next {
  color: #94a3b8;
}

.pagination-prev:hover:not(:disabled),
.pagination-next:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #6366f1;
}

.dark .pagination-prev:hover:not(:disabled),
.dark .pagination-next:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #a5b4fc;
}

.pagination-prev:disabled,
.pagination-next:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-prev .material-symbols-outlined,
.pagination-next .material-symbols-outlined {
  font-size: 20px;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.pagination-page {
  min-width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  padding: 0 10px;
}

@media (min-width: 1400px) {
  .pagination-page {
    min-width: 44px;
    height: 44px;
    font-size: 15px;
  }
}

.dark .pagination-page {
  color: #94a3b8;
}

.pagination-page:hover:not(.active):not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
  color: #6366f1;
}

.dark .pagination-page:hover:not(.active):not(:disabled) {
  background: rgba(255, 255, 255, 0.05);
  color: #a5b4fc;
}

.pagination-page.active {
  background: #6366f1;
  color: white;
}

.pagination-page.dots {
  cursor: default;
}

.pagination-page.dots:hover {
  background: transparent;
}

.pagination-per-page {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-per-page label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  letter-spacing: 0.5px;
}

@media (min-width: 1400px) {
  .pagination-per-page label {
    font-size: 13px;
  }
}

.dark .pagination-per-page label {
  color: #94a3b8;
}

.per-page-select {
  position: relative;
  display: inline-block;
}

.per-page-select select {
  appearance: none;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 8px 32px 8px 14px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  cursor: pointer;
  outline: none;
  transition: all 0.2s;
}

@media (min-width: 1400px) {
  .per-page-select select {
    padding: 10px 36px 10px 16px;
    font-size: 14px;
  }
}

.dark .per-page-select select {
  border-color: #334155;
  color: #cbd5e1;
}

.per-page-select select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.select-icon {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #64748b;
  pointer-events: none;
}

.dark .select-icon {
  color: #94a3b8;
}

/* Responsive Breakpoints */
@media (min-width: 768px) and (max-width: 991px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .card-content {
    padding: 14px 16px 16px 16px;
  }
  
  .project-title {
    font-size: 15px;
  }
  
  .metric-value {
    font-size: 13px;
  }
  
  .view-details-btn {
    padding: 7px 14px;
    font-size: 11px;
  }
}

@media (min-width: 576px) and (max-width: 767px) {
  .projects-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .myprojects-wrapper {
    padding: 12px;
  }
  
  .card-content {
    padding: 12px 14px 14px 14px;
  }
  
  .project-title {
    font-size: 14px;
  }
  
  .project-id-badge {
    font-size: 10px;
  }
  
  .health-badge {
    font-size: 9px;
    padding: 4px 10px;
  }
  
  .metric-label {
    font-size: 9px;
  }
  
  .metric-value {
    font-size: 12px;
  }
  
  .card-footer {
    padding: 12px 14px;
  }
  
  .team-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }
  
  .view-details-btn {
    padding: 6px 12px;
    font-size: 10px;
  }
  
  .icon-btn {
    width: 30px;
    height: 30px;
  }
  
  .icon-btn .material-symbols-outlined {
    font-size: 18px;
  }
}

@media (min-width: 375px) and (max-width: 575px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .myprojects-wrapper {
    padding: 12px;
  }
  
  .card-content {
    padding: 12px 14px 14px 14px;
  }
  
  .card-header {
    margin-bottom: 14px;
    gap: 10px;
  }
  
  .project-title-section {
    gap: 6px;
  }
  
  .project-id-badge {
    font-size: 10px;
  }
  
  .project-title {
    font-size: 15px;
  }
  
  .health-badge {
    font-size: 9px;
    padding: 4px 10px;
  }
  
  .progress-section {
    margin-bottom: 14px;
  }
  
  .progress-label,
  .progress-value {
    font-size: 10px;
  }
  
  .progress-bar {
    height: 6px;
  }
  
  .metrics-grid {
    gap: 12px;
  }
  
  .metric-label {
    font-size: 9px;
    margin-bottom: 4px;
  }
  
  .metric-value {
    font-size: 13px;
  }
  
  .card-footer {
    padding: 12px 14px;
    flex-direction: row;
    flex-wrap: wrap;
  }
  
  .team-avatars {
    order: 1;
  }
  
  .card-actions {
    order: 2;
    flex: 1;
    justify-content: flex-end;
  }
  
  .team-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }
  
  .view-details-btn {
    padding: 6px 12px;
    font-size: 10px;
  }
  
  .pagination-prev span:not(.material-symbols-outlined),
  .pagination-next span:not(.material-symbols-outlined) {
    display: none;
  }
  
  .pagination-prev,
  .pagination-next {
    padding: 8px 12px;
  }
  
  .pagination-page {
    min-width: 34px;
    height: 34px;
    font-size: 13px;
  }
  
  .pagination-per-page label {
    font-size: 10px;
  }
  
  .per-page-select select {
    font-size: 11px;
    padding: 6px 28px 6px 10px;
  }
}

@media (max-width: 374px) {
  .projects-grid {
    grid-template-columns: 1fr;
    gap: 14px;
  }
  
  .myprojects-wrapper {
    padding: 8px;
  }
  
  .card-content {
    padding: 10px 12px 12px 12px;
  }
  
  .card-header {
    flex-direction: column;
    margin-bottom: 12px;
    gap: 8px;
  }
  
  .project-title-section {
    gap: 4px;
    width: 100%;
  }
  
  .health-badge {
    align-self: flex-start;
  }
  
  .project-id-badge {
    font-size: 9px;
  }
  
  .project-title {
    font-size: 14px;
  }
  
  .progress-label,
  .progress-value {
    font-size: 9px;
  }
  
  .progress-bar {
    height: 5px;
  }
  
  .metrics-grid {
    gap: 10px;
  }
  
  .metric-label {
    font-size: 8px;
  }
  
  .metric-value {
    font-size: 11px;
  }
  
  .card-footer {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }
  
  .team-avatars {
    order: 2;
    justify-content: center;
  }
  
  .card-actions {
    order: 1;
    width: 100%;
    justify-content: center;
  }
  
  .team-avatar {
    width: 26px;
    height: 26px;
    font-size: 9px;
  }
  
  .view-details-btn {
    padding: 5px 10px;
    font-size: 10px;
  }
  
  .pagination-container {
    padding: 16px 4px;
  }
  
  .pagination-prev span:not(.material-symbols-outlined),
  .pagination-next span:not(.material-symbols-outlined) {
    display: none;
  }
  
  .pagination-prev,
  .pagination-next {
    padding: 6px 10px;
  }
  
  .pagination-page {
    min-width: 30px;
    height: 30px;
    font-size: 12px;
  }
  
  .pagination-pages {
    gap: 4px;
  }
  
  .pagination-per-page {
    gap: 8px;
  }
  
  .pagination-per-page label {
    font-size: 9px;
  }
  
  .per-page-select select {
    font-size: 10px;
    padding: 5px 24px 5px 8px;
  }
  
  .results-range {
    font-size: 10px;
  }
}
</style>