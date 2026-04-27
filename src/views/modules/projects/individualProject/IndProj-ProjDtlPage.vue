<template>
  <div class="project-detail-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading project details...</p>
    </div>

    <!-- Project Detail Content -->
    <div v-else-if="project" class="project-detail-content">
      <!-- Header Section -->
      <div class="detail-header">
        <div class="title-info">
          <h1 class="project-name">{{ project.name }}</h1>
          <div class="project-status">
            <span class="project-status-badge" :class="getProjectStatusClass(project.status)">
              <span class="material-symbols-outlined">{{ getProjectStatusIcon(project.status) }}</span>
              {{ getProjectStatusText(project.status) }}
            </span>
          </div>
        </div>
        <button class="projectdtl-action-btn share-btn" @click="shareProject">
          <span class="material-symbols-outlined">share</span>
          Share
        </button>
      </div>

      <!-- Main Content Tabs -->
      <div class="detail-tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id">
          {{ tab.label }}
        </button>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="tab-content">
        <div class="content-grid">
          <ProjectInfoCard 
            :project="project" 
            @update-project="handleProjectUpdate"
          />
          <TeamMembersCard 
            :team-members="teamMembers"
            @edit="showTeamMembersModal = true" 
          />
        </div>
      </div>

      <!-- Timesheet Tab -->
      <div v-if="activeTab === 'timesheet'" class="tab-content">
        <div class="timesheet-container">
          <ProjectTimesheet 
            :milestones="allMilestones"
            :project-id="project.id"
            :project-name="project.name"
            :team-members="teamMembers" />
        </div>
      </div>

      <!-- Timeline Tab -->
      <div v-if="activeTab === 'timeline'" class="tab-content">
        <IndividualProjectTimelineView 
          :project-id="project.id"
          :project-name="project.name"
          :timeline-data="project.timeline"
          @edit-timeline="openTimelineModal"
          @create-timeline="openTimelineModal"
          @timeline-updated="refreshTimeline"
          @show-notification="handleTimelineNotification" />
      </div>

      <!-- Task Tracker Tab -->
      <div v-if="activeTab === 'tasks'" class="tab-content">
        <ProjectTaskTracker 
          :project-id="project.id" 
          :team-members="teamMembers" 
        />
      </div>
    </div>

    <!-- Not Found State -->
    <div v-else class="not-found-state">
      <span class="material-symbols-outlined">folder_off</span>
      <h3>Project Not Found</h3>
      <p>The project you're looking for doesn't exist or has been deleted.</p>
      <button class="btn-primary" @click="goBack">Back to Projects</button>
    </div>

    <!-- Timeline Creation/Edit Modal -->
    <div v-if="showTimelineModal" class="modal-overlay" @click.self="closeTimelineModal">
      <div class="timeline-modal">
        <div class="modal-header">
          <div class="modal-header-left">
            <button class="modal-back-btn" @click="closeTimelineModal">
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <h3>{{ existingTimeline ? 'Edit Timeline' : 'Create Timeline' }} for {{ project?.name }}</h3>
          </div>
          <button class="close-btn" @click="closeTimelineModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <ProjectTimelinePlanner 
            :project-start-date="project?.startDate"
            :milestones="allMilestones"
            :team-members="teamMembers"
            :project-id="project?.id"
            :project-name="project?.name"
            :existing-timeline="existingTimeline"
            :readonly="false"
            @update:timeline="handleTimelineSave" />
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTimelineModal">Cancel</button>
          <button class="btn-primary" @click="saveTimeline">Save Timeline</button>
        </div>
      </div>
    </div>

    <!-- Team Members Edit Modal -->
    <TeamMembersEditModal
      v-model:visible="showTeamMembersModal"
      :team-members="teamMembers"
      @save="handleTeamMembersSave"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import ProjectTimelinePlanner from '../createProject/projectTimelineCreation/ProjectTimelinePlanner.vue'
import ProjectTimesheet from '../timesheet/ProjectTimesheet.vue'
import IndividualProjectTimelineView from './ProjDtlPage-TimelineTab/ProjectTimelineView.vue'
import ProjectInfoCard from './ProjDtlPage-OverviewTab/ProjectInfoCard.vue'
import TeamMembersCard from './ProjDtlPage-OverviewTab/ProjectMemberCard.vue'
import ProjectTaskTracker from './ProjDtlPage-TasksTab/ProjectTaskTracker.vue'
import TeamMembersEditModal from './ProjDtlPage-OverviewTab/ProjectMemberEditModal.vue'

export default {
  name: 'ProjectDetailPage',
  components: {
    ProjectTimelinePlanner,
    ProjectTimesheet,
    IndividualProjectTimelineView,
    ProjectInfoCard,
    TeamMembersCard,
    ProjectTaskTracker,
    TeamMembersEditModal
  },
  emits: ['update-project-name'],
  setup(props, { emit }) {
    const router = useRouter()
    const route = useRoute()
    const toast = useToast()
    const isLoading = ref(true)
    const project = ref(null)
    const activeTab = ref('overview')
    const allMilestones = ref([])
    const teamMembers = ref([])
    
    // Timeline Modal state
    const showTimelineModal = ref(false)
    const tempTimelineData = ref(null)
    const existingTimeline = ref(null)

    // Team Members Modal visibility
    const showTeamMembersModal = ref(false)

    // Tabs
    const tabs = [
      { id: 'overview', label: 'Overview'},
      { id: 'timesheet', label: 'Timesheet'},
      { id: 'timeline', label: 'Timeline'},
      { id: 'tasks', label: 'Task Tracker'}
    ]

    // Load project from localStorage
    const loadProject = () => {
      isLoading.value = true
      try {
        const projectId = route.params.id
        const savedProjects = localStorage.getItem('saved_projects')
        
        if (savedProjects) {
          const projects = JSON.parse(savedProjects)
          const foundProject = projects.find(p => p.id == projectId)
          
          if (foundProject) {
            project.value = {
              id: foundProject.id,
              name: foundProject.name,
              code: foundProject.code || `PRJ-${String(foundProject.id).slice(-6)}`,
              client: foundProject.client || '—',
              type: foundProject.type || 'development',
              phase: foundProject.phase || 'discovery',
              health: foundProject.health || 'healthy',
              status: foundProject.status || 'active',
              progress: foundProject.progress || 0,
              startDate: foundProject.startDate || new Date().toISOString().split('T')[0],
              endDate: foundProject.endDate || '',
              budget: foundProject.budget || '',
              description: foundProject.description || 'No description provided.',
              timelineCreated: foundProject.timelineCreated || false,
              timeline: foundProject.timeline,
              createdAt: foundProject.createdAt,
              updatedAt: foundProject.updatedAt
            }
            allMilestones.value = foundProject.milestones || []
            teamMembers.value = foundProject.teamMembers || []
            
            emit('update-project-name', foundProject.name)
          } else {
            project.value = null
          }
        } else {
          project.value = null
        }
      } catch (error) {
        console.error('Error loading project:', error)
        project.value = null
      } finally {
        isLoading.value = false
      }
    }

    // Project Status helpers
    const getProjectStatusText = (status) => {
      const statusMap = {
        'active': 'Active',
        'pending': 'Pending',
        'on_hold': 'On Hold',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'archived': 'Archived'
      }
      return statusMap[status] || 'Active'
    }

    const getProjectStatusIcon = (status) => {
      const iconMap = {
        'active': 'play_circle',
        'pending': 'pending',
        'on_hold': 'pause_circle',
        'completed': 'check_circle',
        'cancelled': 'cancel',
        'archived': 'archive'
      }
      return iconMap[status] || 'help'
    }

    const getProjectStatusClass = (status) => {
      const classMap = {
        'active': 'status-active',
        'pending': 'status-pending',
        'on_hold': 'status-on-hold',
        'completed': 'status-completed',
        'cancelled': 'status-cancelled',
        'archived': 'status-archived'
      }
      return classMap[status] || 'status-active'
    }

    // Handle project update from ProjectInfoCard
    const handleProjectUpdate = (updatedData) => {
      project.value = { ...project.value, ...updatedData, updatedAt: new Date().toISOString() }
      
      const savedProjects = localStorage.getItem('saved_projects')
      if (savedProjects) {
        const projects = JSON.parse(savedProjects)
        const index = projects.findIndex(p => p.id === project.value.id)
        if (index !== -1) {
          projects[index] = { ...projects[index], ...updatedData, updatedAt: new Date().toISOString() }
          localStorage.setItem('saved_projects', JSON.stringify(projects))
        }
      }
      
      toast.success('Project information updated successfully!')
      emit('update-project-name', project.value.name)
    }

    // Handle team members save
    const handleTeamMembersSave = (updatedMembers) => {
      teamMembers.value = updatedMembers
      
      const savedProjects = localStorage.getItem('saved_projects')
      if (savedProjects) {
        const projects = JSON.parse(savedProjects)
        const index = projects.findIndex(p => p.id === project.value.id)
        if (index !== -1) {
          projects[index].teamMembers = updatedMembers
          projects[index].updatedAt = new Date().toISOString()
          localStorage.setItem('saved_projects', JSON.stringify(projects))
        }
      }
      
      toast.success('Team members updated successfully!')
    }

    // Timeline Modal methods
    const openTimelineModal = (timelineData = null) => {
      existingTimeline.value = timelineData
      showTimelineModal.value = true
    }

    const closeTimelineModal = () => {
      showTimelineModal.value = false
      tempTimelineData.value = null
      existingTimeline.value = null
    }

    const handleTimelineSave = (data) => {
      tempTimelineData.value = data
    }

    const saveTimeline = () => {
      if (tempTimelineData.value) {
        handleTimelineUpdate(tempTimelineData.value)
        closeTimelineModal()
        toast.success('Timeline saved successfully!')
        loadProject()
      }
    }

    const refreshTimeline = () => {
      loadProject()
    }

    const handleTimelineUpdate = (data) => {
      if (project.value) {
        const savedProjects = localStorage.getItem('saved_projects')
        if (savedProjects) {
          const projects = JSON.parse(savedProjects)
          const index = projects.findIndex(p => p.id === project.value.id)
          if (index !== -1) {
            projects[index].timeline = data
            projects[index].timelineCreated = true
            projects[index].updatedAt = new Date().toISOString()
            localStorage.setItem('saved_projects', JSON.stringify(projects))
            project.value.timelineCreated = true
            project.value.timeline = data
          }
        }
        localStorage.setItem(`project_timeline_${project.value.id}`, JSON.stringify(data))
      }
    }

    const handleTimelineNotification = ({ type, message }) => {
      if (type === 'success') toast.success(message)
      else if (type === 'warning') toast.warning(message)
      else toast.info(message)
    }

    // Navigation
    const goBack = () => {
      router.push('/projects')
    }

    const shareProject = () => {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Project link copied to clipboard!')
    }

    onMounted(() => {
      loadProject()
    })

    return {
      isLoading,
      project,
      activeTab,
      tabs,
      allMilestones,
      teamMembers,
      showTimelineModal,
      openTimelineModal,
      closeTimelineModal,
      handleTimelineSave,
      saveTimeline,
      refreshTimeline,
      existingTimeline,
      showTeamMembersModal,
      handleProjectUpdate,
      handleTeamMembersSave,
      getProjectStatusText,
      getProjectStatusIcon,
      getProjectStatusClass,
      goBack,
      shareProject,
      handleTimelineNotification
    }
  }
}
</script>

<style scoped>
@import "../../../../styles/shared/globals.css";

/* ============================================
   PROJECT DETAIL PAGE - MAIN CONTAINER
   ============================================ */
.project-detail-content {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden !important;
  background: white;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 16px;
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

/* ============================================
   HEADER SECTION
   ============================================ */
.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
  gap: 16px;
}

.title-info {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.title-info h1 {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .title-info h1 {
  color: #f1f5f9;
}

.project-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.project-status-badge .material-symbols-outlined {
  font-size: 14px;
}

/* Status Colors */
.status-active {
  background: #d1fae5;
  color: #059669;
}

.dark .status-active {
  background: #064e3b;
  color: #34d399;
}

.status-pending {
  background: #fef3c7;
  color: #d97706;
}

.dark .status-pending {
  background: #78350f;
  color: #fbbf24;
}

.status-on-hold {
  background: #fee2e2;
  color: #dc2626;
}

.dark .status-on-hold {
  background: #7f1d1d;
  color: #fca5a5;
}

.status-completed {
  background: #dbeafe;
  color: #2563eb;
}

.dark .status-completed {
  background: #1e3a8a;
  color: #60a5fa;
}

.status-cancelled {
  background: #f1f5f9;
  color: #64748b;
}

.dark .status-cancelled {
  background: #1e293b;
  color: #94a3b8;
}

.status-archived {
  background: #f3e8ff;
  color: #9333ea;
}

.dark .status-archived {
  background: #4c1d95;
  color: #c084fc;
}

/* Share Button */
.projectdtl-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.share-btn {
  background: #10b981;
  color: white;
}

.share-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

/* ============================================
   TABS
   ============================================ */
.detail-tabs {
  display: flex;
  gap: 8px;
  background: #e2e8f0;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 20px;
  width: fit-content;
  max-width: 100%;
}

.dark .detail-tabs {
  background: #1e293b;
}

.tab-btn {
  flex: 0 0 auto;
  padding: 10px 20px;
  background: transparent;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .tab-btn {
  color: #94a3b8;
}

.tab-btn.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .tab-btn.active {
  background: #0f172a;
  color: #818cf8;
}

.tab-btn:hover:not(.active) {
  color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.dark .tab-btn:hover:not(.active) {
  background: #334155;
  color: #cbd5e1;
}

/* Tab Content */
.tab-content {
  animation: fadeIn 0.3s ease;
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* ============================================
   CONTENT GRID
   ============================================ */
.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  height: 100%;
}

/* ============================================
   TIMESHEET TAB
   ============================================ */
.timesheet-container {
  background: transparent;
  border-radius: 16px;
  min-height: 500px;
  overflow: visible;
}

/* ============================================
   TIMELINE TAB
   ============================================ */
.timeline-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  min-height: 500px;
  overflow-x: hidden !important;
  width: 100%;
  max-width: 100%;
}

.dark .timeline-container {
  background: #1e293b;
  border-color: #334155;
}

/* ============================================
   TIMELINE MODAL
   ============================================ */
.timeline-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.dark .timeline-modal {
  background: #1e293b;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.modal-back-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  transform: translateX(-2px);
}

.dark .modal-back-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

/* ============================================
   MODAL STYLES (Team Members)
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.edit-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.dark .edit-modal {
  background: #1e293b;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
}

.dark .modal-header {
  border-bottom-color: #334155;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .modal-header h3 {
  color: #f1f5f9;
}

.close-btn {
  width: 32px;
  height: 32px;
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

.close-btn:hover {
  background: #f1f5f9;
}

.dark .close-btn:hover {
  background: #334155;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.dark .modal-footer {
  border-top-color: #334155;
}

/* Form Elements */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.dark .form-group label {
  color: #94a3b8;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* Buttons */
.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.dark .btn-secondary {
  border-color: #334155;
  color: #94a3b8;
}

.btn-secondary:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Team Members Modal Specific */
.current-members-section {
  margin-bottom: 24px;
}

.current-members-section label,
.add-member-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
}

.dark .current-members-section label,
.dark .add-member-section label {
  color: #94a3b8;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.dark .members-list {
  border-color: #334155;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s;
}

.dark .member-item {
  background: #0f172a;
}

.member-item:hover {
  transform: translateX(4px);
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
  font-size: 12px;
  flex-shrink: 0;
}

.member-details {
  flex: 1;
}

.member-details .member-name {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.dark .member-details .member-name {
  color: #f1f5f9;
}

.member-details .member-role {
  font-size: 12px;
  color: #64748b;
}

.remove-member-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  transition: all 0.2s;
}

.remove-member-btn:hover {
  background: #fee2e2;
  transform: rotate(90deg);
}

.dark .remove-member-btn:hover {
  background: #7f1d1d;
}

.empty-message-small {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 13px;
}

.add-member-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.dark .add-member-section {
  border-top-color: #334155;
}

.add-member-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

/* Custom Dropdown */
.custom-dropdown {
  position: relative;
  flex: 1;
  margin: 0;
  padding: 0;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 56px;
}

.dark .dropdown-trigger {
  background: #0f172a;
  border-color: #334155;
}

.dropdown-trigger:hover {
  border-color: #6366f1;
}

.selected-member {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.selected-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.selected-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selected-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.dark .selected-name {
  color: #f1f5f9;
}

.selected-role {
  font-size: 11px;
  color: #64748b;
}

.selected-placeholder {
  flex: 1;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 14px;
}

.dropdown-icon {
  font-size: 20px;
  color: #64748b;
  transition: transform 0.2s;
}

.custom-dropdown.is-open .dropdown-icon {
  transform: rotate(180deg);
}

/* Dropdown Menu Portal */
.dropdown-menu-portal {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
}

.dark .dropdown-menu-portal {
  background: #1e293b;
  border-color: #334155;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-search {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.dark .dropdown-search {
  border-bottom-color: #334155;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.dark .search-input {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.dropdown-options {
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-option:hover {
  background: #f8fafc;
}

.dark .dropdown-option:hover {
  background: #0f172a;
}

.dropdown-option.is-selected {
  background: #eef2ff;
}

.dark .dropdown-option.is-selected {
  background: #1e1b4b;
}

.option-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.dark .option-name {
  color: #f1f5f9;
}

.option-role {
  font-size: 11px;
  color: #64748b;
}

.check-icon {
  font-size: 18px;
  color: #10b981;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #64748b;
  text-align: center;
}

.no-results .material-symbols-outlined {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-results p {
  font-size: 13px;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Not Found State */
.not-found-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 20px;
  gap: 16px;
}

.not-found-state .material-symbols-outlined {
  font-size: 64px;
  color: #64748b;
}

.not-found-state h3 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .not-found-state h3 {
  color: #f1f5f9;
}

/* Responsive */
@media (max-width: 768px) {  
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .title-info {
    flex-wrap: wrap;
  }
  
  .detail-tabs {
    width: 100%;
    overflow-x: auto;
    justify-content: flex-start;
  }
  
  .tab-btn {
    white-space: nowrap;
  }
  
  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .edit-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .add-member-container {
    flex-direction: column;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .card-title {
    font-size: 16px;
  }
  
  .tab-btn {
    padding: 8px 12px;
    font-size: 12px;
  }
  
  .dropdown-trigger {
    min-height: 48px;
    padding: 8px 10px;
  }
  
  .selected-avatar,
  .option-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }
  
  .selected-name,
  .option-name {
    font-size: 12px;
  }
}
</style>