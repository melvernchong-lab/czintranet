<template>
  <Teleport to="body">
    <div v-if="isVisible" class="prmpt-modal-overlay" @click.self="handleOverlayClick">
      <div class="prmpt-modal-container project-create-modal">
        <!-- Modal Header -->
        <div class="prmpt-modal-header info">
          <span class="material-symbols-outlined prmpt-modal-icon">add</span>
          <h3 class="prmpt-modal-title">Create New Project</h3>
          <button class="close-btn" @click.stop="handleCloseClick">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="prmpt-modal-body project-create-body">
          <!-- Progress Bar -->
          <div class="creation-progress">
            <div class="progress-steps">
              <div v-for="(step, index) in creationSteps" :key="step.id" class="progress-step"
                :class="{ active: currentStep === index, completed: currentStep > index }">
                <div class="step-indicator">
                  <span class="material-symbols-outlined" v-if="currentStep > index">check</span>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-label">{{ step.label }}</div>
              </div>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
            </div>
          </div>

          <!-- Step 0: Project Info -->
          <div v-if="currentStep === 0" class="step-content" @click.stop>
            <h4 class="step-title">Project Information</h4>

            <div class="info-grid">
              <div class="form-group">
                <label class="form-label">Project Name <span class="required">*</span></label>
                <input type="text" v-model="newProject.name" class="form-input" placeholder="Enter project name"
                  :class="{ error: validationErrors.name }" />
                <span v-if="validationErrors.name" class="error-message">{{ validationErrors.name }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Project Type <span class="required">*</span></label>
                <select v-model="newProject.type" class="form-select" :class="{ error: validationErrors.type }">
                  <option value="">Select Type</option>
                  <option value="development">Development</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="migration">Migration</option>
                  <option value="research">Research</option>
                </select>
                <span v-if="validationErrors.type" class="error-message">{{ validationErrors.type }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Client</label>
                <input type="text" v-model="newProject.client" class="form-input" placeholder="Enter client name" />
              </div>
            </div>

            <div class="management-grid">
              <div class="form-group">
                <label class="form-label">Project Director</label>
                <select v-model="newProject.directorId" class="form-select">
                  <option value="">Select Director</option>
                  <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                    {{ manager.name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Project Manager <span class="required">*</span></label>
                <select v-model="newProject.managerId" class="form-select"
                  :class="{ error: validationErrors.managerId }">
                  <option value="">Select Manager</option>
                  <option v-for="manager in availableManagers" :key="manager.id" :value="manager.id">
                    {{ manager.name }}
                  </option>
                </select>
                <span v-if="validationErrors.managerId" class="error-message">{{ validationErrors.managerId }}</span>
              </div>

              <div class="form-group">
                <label class="form-label">Start Date <span class="required">*</span></label>
                <input type="date" v-model="newProject.startDate" class="form-input"
                  :class="{ error: validationErrors.startDate }" />
                <span v-if="validationErrors.startDate" class="error-message">{{ validationErrors.startDate }}</span>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Project Description</label>
              <textarea v-model="newProject.description" class="form-textarea" rows="3"
                placeholder="Enter project description"></textarea>
            </div>
          </div>

          <!-- Step 1: Team -->
          <div v-if="currentStep === 1" class="step-content" @click.stop>
            <div class="step-header">
              <h4 class="step-title">Team Members <span class="required">*</span></h4>
              <button class="add-btn" @click.stop="toggleMemberSelector" :class="{ 'active': showMemberSelector }">
                <span class="material-symbols-outlined">{{ showMemberSelector ? 'close' : 'person_add' }}</span>
                {{ showMemberSelector ? 'Close' : 'Add Member' }}
              </button>
            </div>

            <!-- Selected Team Members List -->
            <div class="team-members-list">
              <div v-for="member in newTeamMembers" :key="member.id" class="team-member-item">
                <div class="member-info">
                  <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                    {{ member.initials }}
                  </div>
                  <div class="member-details">
                    <span class="member-name">{{ member.name }}</span>
                    <span class="member-role">{{ member.role }}</span>
                  </div>
                </div>
                <button class="remove-member-btn" @click.stop="removeTeamMember(member.id)">
                  <span class="material-symbols-outlined">person_remove</span>
                </button>
              </div>

              <!-- Empty State -->
              <div v-if="newTeamMembers.length === 0" class="empty-state">
                <span class="material-symbols-outlined">group</span>
                <p>No team members added yet</p>
                <p class="empty-hint">Click "Add Member" to add team members</p>
              </div>
            </div>

            <div v-if="validationErrors.teamMembers" class="error-message team-error">
              {{ validationErrors.teamMembers }}
            </div>

            <!-- Inline Member Selector (slides down) -->
            <transition name="slide">
              <div v-if="showMemberSelector" class="inline-member-selector">
                <div class="selector-header">
                  <h5>Available Team Members</h5>
                  <span class="selected-count">{{ selectedNewMembers.length }} selected</span>
                </div>

                <div class="selector-search">
                  <span class="material-symbols-outlined search-icon">search</span>
                  <input type="text" v-model="memberSearch" class="search-input"
                    placeholder="Search members by name or role..." @click.stop />
                </div>

                <div class="selector-grid">
                  <div v-for="member in filteredAvailableMembers" :key="member.id" class="member-card"
                    :class="{ selected: isMemberSelected(member) }" @click.stop="toggleMember(member)">
                    <div class="member-avatar" :style="{ backgroundColor: member.avatarColor }">
                      {{ member.initials }}
                    </div>
                    <div class="member-info">
                      <span class="member-name">{{ member.name }}</span>
                      <span class="member-role">{{ member.role }}</span>
                    </div>
                    <div class="member-select-indicator">
                      <span class="material-symbols-outlined" v-if="isMemberSelected(member)">
                        check_circle
                      </span>
                      <span class="material-symbols-outlined" v-else>
                        radio_button_unchecked
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="filteredAvailableMembers.length === 0" class="no-results">
                  <span class="material-symbols-outlined">search_off</span>
                  <p>No members found</p>
                </div>

                <div class="selector-footer">
                  <div class="footer-left">
                    <button class="select-all-btn" @click.stop="selectAll" v-if="!allSelected">
                      Select All
                    </button>
                    <button class="select-all-btn" @click.stop="deselectAll" v-else>
                      Deselect All
                    </button>
                  </div>
                  <div class="footer-right">
                    <button class="cancel-btn" @click.stop="showMemberSelector = false">Cancel</button>
                    <button class="add-selected-btn" @click.stop="addSelectedMembers"
                      :disabled="selectedNewMembers.length === 0">
                      <span class="material-symbols-outlined">person_add</span>
                      Add {{ selectedNewMembers.length }} Member{{ selectedNewMembers.length !== 1 ? 's' : '' }}
                    </button>
                  </div>
                </div>
              </div>
            </transition>
          </div>

          <!-- Step 2: Milestones -->
          <div v-if="currentStep === 2" class="step-content" @click.stop>
            <div class="step-header">
              <h4 class="step-title">Project Milestones</h4>
              <button class="add-btn" @click.stop="addMilestone">
                <span class="material-symbols-outlined">add</span>
                Add Milestone
              </button>
            </div>

            <div class="milestones-list">
              <MilestoneItem 
                v-for="(milestone, index) in newMilestones" 
                :key="milestone.id" 
                :milestone="milestone"
                :available-members="newTeamMembers" 
                :all-milestones="newMilestones" 
                :milestone-index="index"
                :total-milestones="newMilestones.length" 
                :is-saved="milestone.isSaved || false"
                :project-id="tempProjectId"
                :project-name="newProject.name"
                @update:milestone="updateMilestone(index, $event)" 
                @remove="removeMilestone(index)"
                @save="saveMilestone(index, $event)"
                @save-project="handleSaveProject" />
            </div>

            <!-- Empty State for Milestones -->
            <div v-if="newMilestones.length === 0" class="empty-state milestones-empty">
              <span class="material-symbols-outlined">flag</span>
              <p>No milestones added yet</p>
              <p class="empty-hint">Click "Add Milestone" to create project milestones</p>
            </div>

            <!-- Validation Message for Milestones -->
            <div v-if="milestoneValidationMessage" class="validation-message warning">
              <span class="material-symbols-outlined">info</span>
              {{ milestoneValidationMessage }}
            </div>
          </div>

          <!-- Step 3: Timeline -->
          <div v-if="currentStep === 3" class="step-content timeline-step" @click.stop>
            <ProjectTimelinePlanner 
              ref="timelinePlannerRef"
              :key="'timeline-planner'" 
              :project-start-date="newProject.startDate"
              :milestones="newMilestones" 
              :team-members="newTeamMembers" 
              :show-timeline-prompt="showTimelinePrompt"
              :project-id="tempProjectId"
              :project-name="newProject.name"
              @update:timeline="updateTimelineData"
              @update:milestones="handleMilestonesUpdate"
              @generate-timesheet="showTimesheetGenerator = true"
              @create-project="handleCreateProject"
              @close-prompt="showTimelinePrompt = false" />

            <!-- Timesheet Generator Modal (inside parent modal) -->
            <div v-if="showTimesheetGenerator" class="timesheet-modal-inline">
              <div class="timesheet-header">
                <div class="header-title">
                  <span class="material-symbols-outlined">description</span>
                  <h3>Generate Timesheets</h3>
                </div>
                <button class="close-btn-small" @click.stop="showTimesheetGenerator = false">
                  <span class="material-symbols-outlined">close</span>
                </button>
              </div>
              <div class="timesheet-content">
                <TimesheetGenerator :project-data="projectData" :timeline-data="timelineData"
                  :team-members="newTeamMembers" @generate="handleTimesheetGeneration" />
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer with Navigation -->
        <div class="prmpt-modal-footer">
          <div class="footer-left">
            <span class="required-fields-note"><span class="required">*</span> Required fields</span>
          </div>
          <div class="footer-right">
            <!-- Previous Button (hidden on first step) -->
            <button v-if="currentStep > 0" class="prmpt-modal-btn prmpt-prev-btn" @click.stop="prevStep">
              <span class="material-symbols-outlined">arrow_back</span>
              Previous
            </button>

            <!-- Next Button (visible on steps 0,1,2 - not on last step) -->
            <button v-if="currentStep < 3" class="prmpt-modal-btn prmpt-next-btn" @click.stop="nextStep"
              :disabled="!isStepValid">
              Next
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>

            <!-- Create Button (visible only on step 3 - last step) -->
            <button v-if="currentStep === 3" class="prmpt-modal-btn prmpt-create-btn" @click.stop="createProject"
              :disabled="!isFormValid">
              <span class="material-symbols-outlined">check</span>
              Create Project
            </button>

            <!-- Cancel Button -->
            <button class="prmpt-modal-btn prmpt-cancel-btn" @click.stop="handleCancelClick">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Custom Confirmation Modal -->
    <div v-if="showConfirmDialog" class="confirm-modal-overlay" @click.self="closeConfirmDialog">
      <div class="confirm-modal-container">
        <div class="confirm-modal-header">
          <span class="material-symbols-outlined confirm-icon">warning</span>
          <h3 class="confirm-modal-title">Unsaved Changes</h3>
        </div>
        <div class="confirm-modal-body">
          <p>You have unsaved changes. Are you sure you want to close?</p>
          <p class="confirm-hint">All entered data will be lost.</p>
        </div>
        <div class="confirm-modal-footer">
          <button class="confirm-btn cancel-btn" @click="closeConfirmDialog">
            <span class="material-symbols-outlined">close</span>
            Stay
          </button>
          <button class="confirm-btn confirm-btn-danger" @click="confirmClose">
            <span class="material-symbols-outlined">check</span>
            Close Anyway
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, computed } from 'vue'
import MilestoneItem from './projectMilestoneCreation/ProjectMilestoneItem.vue'
import ProjectTimelinePlanner from './projectTimelineCreation/ProjectTimelinePlanner.vue'
import TimesheetGenerator from '../timesheet/TimesheetGenerator.vue'

export default {
  name: 'CreateProjectModal',
  components: {
    MilestoneItem,
    ProjectTimelinePlanner,
    TimesheetGenerator
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'create', 'update:milestones'],
  setup(props, { emit }) {
    const currentStep = ref(0)
    const memberSearch = ref('')
    const allSelected = ref(false)
    const showMemberSelector = ref(false)
    const showTimesheetGenerator = ref(false)
    const selectedNewMembers = ref([])
    const timelineData = ref(null)
    const showConfirmDialog = ref(false)
    const pendingCloseAction = ref(null)
    const tempProjectId = ref(Date.now() + Math.random())
    const showTimelinePrompt = ref(false)
    const timelinePlannerRef = ref(null)

    // New project data
    const newProject = ref({
      name: '',
      type: '',
      client: '',
      directorId: '',
      managerId: '',
      startDate: '',
      description: '',
      status: 'planned'
    })

    const newMilestones = ref([])
    const newTeamMembers = ref([])
    const validationErrors = ref({})

    const creationSteps = [
      { id: 'info', label: 'Project Info' },
      { id: 'team', label: 'Team' },
      { id: 'milestones', label: 'Milestones' },
      { id: 'timeline', label: 'Timeline' }
    ]

    // Mock available managers
    const availableManagers = [
      { id: 1, name: 'John Smith' },
      { id: 2, name: 'Sarah Johnson' },
      { id: 3, name: 'Michael Chen' }
    ]

    // Mock available members
    const availableMembers = [
      { id: 1, name: 'John Smith', role: 'Senior Developer', initials: 'JS', avatarColor: '#3b82f6' },
      { id: 2, name: 'Sarah Johnson', role: 'UI/UX Designer', initials: 'SJ', avatarColor: '#10b981' },
      { id: 3, name: 'Michael Chen', role: 'Backend Developer', initials: 'MC', avatarColor: '#f59e0b' },
      { id: 4, name: 'Emily Davis', role: 'QA Engineer', initials: 'ED', avatarColor: '#8b5cf6' },
      { id: 5, name: 'Robert Wilson', role: 'DevOps', initials: 'RW', avatarColor: '#ec4899' },
      { id: 6, name: 'Lisa Wang', role: 'Frontend Dev', initials: 'LW', avatarColor: '#06b6d4' }
    ]

    // Check if form has any data entered
    const hasFormData = computed(() => {
      if (newProject.value.name || 
          newProject.value.type || 
          newProject.value.client || 
          newProject.value.directorId || 
          newProject.value.managerId || 
          newProject.value.startDate || 
          newProject.value.description) {
        return true
      }
      
      if (newTeamMembers.value.length > 0) {
        return true
      }
      
      if (newMilestones.value.length > 0) {
        return true
      }
      
      if (timelineData.value && timelineData.value.groups && timelineData.value.groups.length > 0) {
        return true
      }
      
      return false
    })

    // Computed properties for validation
    const isProjectInfoValid = computed(() => {
      return newProject.value.name &&
        newProject.value.type &&
        newProject.value.managerId &&
        newProject.value.startDate
    })

    const isTeamValid = computed(() => {
      return newTeamMembers.value.length > 0
    })

    const hasMilestones = computed(() => {
      return newMilestones.value.length > 0
    })

    const allMilestonesSaved = computed(() => {
      if (newMilestones.value.length === 0) return false
      return newMilestones.value.every(m => m.isSaved === true)
    })

    const isStepValid = computed(() => {
      if (currentStep.value === 0) return isProjectInfoValid.value
      if (currentStep.value === 1) return isTeamValid.value
      if (currentStep.value === 2) {
        return hasMilestones.value && allMilestonesSaved.value
      }
      if (currentStep.value === 3) return true
      return false
    })

    const isFormValid = computed(() => {
      return isProjectInfoValid.value &&
        isTeamValid.value &&
        hasMilestones.value &&
        allMilestonesSaved.value
    })

    const progressPercentage = computed(() => {
      return ((currentStep.value) / (creationSteps.length - 1)) * 100
    })

    const projectData = computed(() => ({
      project: newProject.value,
      milestones: newMilestones.value,
      teamMembers: newTeamMembers.value
    }))

    // Filtered members for search
    const filteredAvailableMembers = computed(() => {
      if (!memberSearch.value) return availableMembers
      const search = memberSearch.value.toLowerCase()
      return availableMembers.filter(member =>
        member.name.toLowerCase().includes(search) ||
        member.role.toLowerCase().includes(search)
      )
    })

    // Milestone validation message
    const milestoneValidationMessage = computed(() => {
      if (newMilestones.value.length === 0) {
        return 'At least one milestone must be added'
      }
      if (!allMilestonesSaved.value) {
        const unsavedCount = newMilestones.value.filter(m => !m.isSaved).length
        return `Please save all milestones before proceeding (${unsavedCount} unsaved)`
      }
      return ''
    })

    // Validation
    function validateProjectInfo() {
      const errors = {}
      if (!newProject.value.name) errors.name = 'Project name is required'
      if (!newProject.value.type) errors.type = 'Project type is required'
      if (!newProject.value.managerId) errors.managerId = 'Project manager is required'
      if (!newProject.value.startDate) errors.startDate = 'Start date is required'

      validationErrors.value = errors
      return Object.keys(errors).length === 0
    }

    function validateTeam() {
      const errors = {}
      if (newTeamMembers.value.length === 0) {
        errors.teamMembers = 'At least one team member is required'
      }
      validationErrors.value = errors
      return Object.keys(errors).length === 0
    }

    function nextStep() {
      if (currentStep.value === 0) {
        if (!validateProjectInfo()) return
      }
      
      if (currentStep.value === 1) {
        if (!validateTeam()) return
      }
      
      if (currentStep.value === 2) {
        if (newMilestones.value.length === 0) {
          validationErrors.value = {
            ...validationErrors.value,
            milestones: 'At least one milestone must be added'
          }
          return
        }
        if (!allMilestonesSaved.value) {
          validationErrors.value = {
            ...validationErrors.value,
            milestones: 'All milestones must be saved before proceeding'
          }
          return
        }
        // First move to timeline step, then show the prompt
        currentStep.value = 3
        validationErrors.value = {}
        // Show timeline prompt after a short delay to ensure component is mounted
        setTimeout(() => {
          showTimelinePrompt.value = true
        }, 100)
        return
      }
      
      if (currentStep.value < creationSteps.length - 1) {
        currentStep.value++
        validationErrors.value = {}
      }
    }

    function prevStep() {
      if (currentStep.value > 0) {
        currentStep.value--
        validationErrors.value = {}
      }
    }

    // Handle overlay click
    const handleOverlayClick = () => {
      if (hasFormData.value) {
        showConfirmDialog.value = true
        pendingCloseAction.value = 'close'
      } else {
        closeModal()
      }
    }

    // Handle close button click
    const handleCloseClick = () => {
      if (hasFormData.value) {
        showConfirmDialog.value = true
        pendingCloseAction.value = 'close'
      } else {
        closeModal()
      }
    }

    // Handle cancel button click
    const handleCancelClick = () => {
      if (hasFormData.value) {
        showConfirmDialog.value = true
        pendingCloseAction.value = 'cancel'
      } else {
        closeModal()
      }
    }

    // Close confirmation dialog
    const closeConfirmDialog = () => {
      showConfirmDialog.value = false
      pendingCloseAction.value = null
    }

    // Confirm close/cancel
    const confirmClose = () => {
      showConfirmDialog.value = false
      if (pendingCloseAction.value === 'close' || pendingCloseAction.value === 'cancel') {
        closeModal()
      }
      pendingCloseAction.value = null
    }

    const closeModal = () => {
      emit('close')
      // Reset form
      newProject.value = {
        name: '',
        type: '',
        client: '',
        directorId: '',
        managerId: '',
        startDate: '',
        description: '',
        status: 'planned'
      }
      newMilestones.value = []
      newTeamMembers.value = []
      currentStep.value = 0
      validationErrors.value = {}
      timelineData.value = null
      showMemberSelector.value = false
      selectedNewMembers.value = []
      memberSearch.value = ''
      tempProjectId.value = Date.now() + Math.random()
      showTimelinePrompt.value = false
    }

    // Save project to localStorage
    const saveProjectToLocalStorage = (projectData) => {
      try {
        // Get existing projects from localStorage
        const existingProjects = localStorage.getItem('saved_projects')
        let projects = existingProjects ? JSON.parse(existingProjects) : []
        
        // Check if project already exists
        const existingIndex = projects.findIndex(p => p.id === projectData.id)
        
        if (existingIndex !== -1) {
          // Update existing project
          projects[existingIndex] = {
            ...projects[existingIndex],
            ...projectData,
            updatedAt: new Date().toISOString()
          }
        } else {
          // Add new project
          projects.push({
            ...projectData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          })
        }
        
        // Save back to localStorage
        localStorage.setItem('saved_projects', JSON.stringify(projects))
        
        // Also save individual project for easy access
        localStorage.setItem(`project_${projectData.id}`, JSON.stringify(projectData))
        
        console.log('Project saved to localStorage:', projectData)
        return true
      } catch (error) {
        console.error('Error saving project to localStorage:', error)
        return false
      }
    }

    // Create project (when user clicks Create button on last step)
    const createProject = () => {
      if (!isFormValid.value) return

      const finalProjectData = {
        id: tempProjectId.value,
        name: newProject.value.name,
        type: newProject.value.type,
        client: newProject.value.client,
        directorId: newProject.value.directorId,
        managerId: newProject.value.managerId,
        startDate: newProject.value.startDate,
        description: newProject.value.description,
        status: 'active',
        teamMembers: newTeamMembers.value,
        milestones: newMilestones.value,
        timeline: timelineData.value,
        timelineCreated: true
      }

      // Save to localStorage
      saveProjectToLocalStorage(finalProjectData)

      emit('create', finalProjectData)
      closeModal()
    }

    // Handle create project from timeline planner (when user chooses "Create Later")
    const handleCreateProject = ({ projectId, projectName, milestones, timelineData: timeline, action }) => {
      console.log('Creating project from timeline planner with action:', action)
      
      const projectData = {
        id: projectId,
        name: projectName,
        type: newProject.value.type,
        client: newProject.value.client,
        directorId: newProject.value.directorId,
        managerId: newProject.value.managerId,
        startDate: newProject.value.startDate,
        description: newProject.value.description,
        status: 'active',
        teamMembers: newTeamMembers.value,
        milestones: milestones,
        timeline: timeline,
        timelineCreated: action === 'now' ? true : false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      // Save to localStorage
      const saved = saveProjectToLocalStorage(projectData)
      
      if (saved) {
        // Show success notification
        showNotification('Project saved successfully!', 'success')
      } else {
        showNotification('Error saving project. Please try again.', 'error')
      }

      emit('create', projectData)
      closeModal()
    }

    // Handle save project from milestone (autosave)
    const handleSaveProject = (projectData) => {
      console.log('Auto-saving project from milestone:', projectData)
      saveProjectToLocalStorage(projectData)
    }

    // Show notification
    const showNotification = (message, type = 'info') => {
      const toast = document.createElement('div')
      toast.textContent = message
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 3000)
    }

    // Milestone methods
    const addMilestone = () => {
      newMilestones.value.push({
        id: Date.now() + Math.random(),
        name: '',
        assignments: [],
        dependencies: [],
        attachments: [],
        isSaved: false
      })
    }

    const updateMilestone = (index, updatedMilestone) => {
      if (index >= 0 && index < newMilestones.value.length) {
        newMilestones.value[index] = {
          ...updatedMilestone,
          isSaved: newMilestones.value[index]?.isSaved || false
        }
        emit('update:milestones', newMilestones.value)
      }
    }

    const saveMilestone = (index, savedMilestone) => {
      if (index >= 0 && index < newMilestones.value.length) {
        newMilestones.value[index] = {
          ...savedMilestone,
          isSaved: true
        }
        emit('update:milestones', newMilestones.value)
      }
    }

    const removeMilestone = (index) => {
      if (index >= 0 && index < newMilestones.value.length) {
        if (confirm('Are you sure you want to remove this milestone?')) {
          newMilestones.value.splice(index, 1)
          emit('update:milestones', newMilestones.value)
        }
      }
    }

    // Team member methods
    const toggleMemberSelector = () => {
      showMemberSelector.value = !showMemberSelector.value
      if (!showMemberSelector.value) {
        memberSearch.value = ''
      }
    }

    const isMemberSelected = (member) => {
      return selectedNewMembers.value.some(m => m.id === member.id)
    }

    const toggleMember = (member) => {
      const index = selectedNewMembers.value.findIndex(m => m.id === member.id)
      if (index === -1) {
        selectedNewMembers.value.push(member)
      } else {
        selectedNewMembers.value.splice(index, 1)
      }
      allSelected.value = selectedNewMembers.value.length === availableMembers.length
    }

    const selectAll = () => {
      selectedNewMembers.value = [...availableMembers]
      allSelected.value = true
    }

    const deselectAll = () => {
      selectedNewMembers.value = []
      allSelected.value = false
    }

    const addSelectedMembers = () => {
      const newMembers = selectedNewMembers.value.filter(
        selected => !newTeamMembers.value.some(existing => existing.id === selected.id)
      )
      newTeamMembers.value.push(...newMembers)
      selectedNewMembers.value = []
      showMemberSelector.value = false
      memberSearch.value = ''
    }

    const removeTeamMember = (memberId) => {
      const index = newTeamMembers.value.findIndex(m => m.id === memberId)
      if (index > -1) {
        newTeamMembers.value.splice(index, 1)
      }
    }

    const updateTimelineData = (data) => {
      timelineData.value = data
    }

    const handleTimesheetGeneration = (timesheetData) => {
      console.log('Generating timesheets:', timesheetData)
      showTimesheetGenerator.value = false
    }

    const handleMilestonesUpdate = (updatedMilestones) => {
      console.log('Milestones updated from timeline:', updatedMilestones)
      newMilestones.value = updatedMilestones
    }

    return {
      currentStep,
      creationSteps,
      progressPercentage,
      showMemberSelector,
      showTimesheetGenerator,
      showConfirmDialog,
      showTimelinePrompt,
      selectedNewMembers,
      newProject,
      newMilestones,
      newTeamMembers,
      timelineData,
      availableManagers,
      availableMembers,
      validationErrors,
      isProjectInfoValid,
      isTeamValid,
      hasMilestones,
      allMilestonesSaved,
      isStepValid,
      isFormValid,
      projectData,
      memberSearch,
      allSelected,
      filteredAvailableMembers,
      milestoneValidationMessage,
      tempProjectId,
      timelinePlannerRef,
      handleOverlayClick,
      handleCloseClick,
      handleCancelClick,
      closeConfirmDialog,
      confirmClose,
      createProject,
      nextStep,
      prevStep,
      addMilestone,
      updateMilestone,
      saveMilestone,
      removeMilestone,
      toggleMemberSelector,
      isMemberSelected,
      toggleMember,
      selectAll,
      deselectAll,
      addSelectedMembers,
      removeTeamMember,
      updateTimelineData,
      handleTimesheetGeneration,
      handleMilestonesUpdate,
      handleCreateProject,
      handleSaveProject
    }
  }
}
</script>

<style scoped>
@import "../../../../styles/shared/globals.css";

/* ============================================
   PROJECT CREATE MODAL - FREELY ADJUSTABLE
   ============================================ */

.project-create-modal {
  max-width: 900px !important;
  width: 95% !important;
  max-height: 90vh !important;
  display: flex !important;
  flex-direction: column !important;
  margin: 20px auto !important;
}

/* Modal Container - Flex Layout */
.prmpt-modal-container {
  display: flex !important;
  flex-direction: column !important;
  max-height: 90vh !important;
  overflow: hidden !important;
  border-radius: var(--border-radius-lg);
  background-color: var(--card-light);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.dark .prmpt-modal-container {
  background-color: var(--card-dark);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

/* Modal Body - Scrollable Content */
.prmpt-modal-body {
  flex: 1 1 auto !important;
  overflow-y: auto !important;
  padding: 0 !important;
  scroll-behavior: smooth;
  position: relative;
  min-height: 0 !important;
  max-height: none !important;
}

.project-create-body {
  composes: prmpt-modal-body;
}

/* Custom Scrollbar */
.project-create-body::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.project-create-body::-webkit-scrollbar-track {
  background: var(--bg-header);
  border-radius: 4px;
}

.project-create-body::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 4px;
}

.project-create-body::-webkit-scrollbar-thumb:hover {
  background: var(--muted-light);
}

.dark .project-create-body::-webkit-scrollbar-track {
  background: var(--dark-bg-header);
}

.dark .project-create-body::-webkit-scrollbar-thumb {
  background: var(--border-dark);
}

/* ============================================
   MODAL HEADER - Fixed at top
   ============================================ */

.prmpt-modal-header {
  position: relative;
  padding: 20px 60px 20px 24px !important;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0 !important;
  border-top-left-radius: var(--border-radius-lg);
  border-top-right-radius: var(--border-radius-lg);
}

.dark .prmpt-modal-header {
  background: linear-gradient(135deg, var(--primary-dark) 0%, #1e3a8a 100%);
  border-bottom-color: var(--border-dark);
}

.prmpt-modal-icon {
  background: rgba(255, 255, 255, 0.2);
  padding: 8px;
  border-radius: 50%;
}

.prmpt-modal-title {
  font-size: clamp(18px, 4vw, 20px);
  font-weight: 600;
  margin: 0;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* ============================================
   PROGRESS BAR - Fixed section
   ============================================ */

.creation-progress {
  padding: 20px 24px 0;
  background-color: var(--bg-header);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0 !important;
}

.dark .creation-progress {
  background-color: var(--dark-bg-header);
  border-bottom-color: var(--border-dark);
}

.progress-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  position: relative;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;
  z-index: 2;
}

.progress-step .step-indicator {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: var(--card-light);
  border: 2px solid var(--border-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted-light);
  transition: all 0.3s ease;
}

.dark .progress-step .step-indicator {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
}

.progress-step.active .step-indicator {
  background-color: var(--primary);
  border-color: var(--primary);
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.progress-step.completed .step-indicator {
  background-color: #10b981;
  border-color: #10b981;
  color: white;
}

.progress-step .step-label {
  font-size: clamp(10px, 2.5vw, 12px);
  font-weight: 500;
  color: var(--muted-light);
  text-align: center;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.progress-step.active .step-label {
  color: var(--primary);
  font-weight: 600;
}

.progress-step.completed .step-label {
  color: #10b981;
}

.progress-bar {
  height: 4px;
  background-color: var(--border-light);
  border-radius: 2px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
}

.dark .progress-bar {
  background-color: var(--border-dark);
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary) 0%, #60a5fa 100%);
  border-radius: 2px;
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ============================================
   STEP CONTENT - Flexible height
   ============================================ */

.step-content {
  padding: clamp(16px, 4vw, 24px);
  animation: fadeIn 0.3s ease;
  position: relative;
  height: auto !important;
  min-height: min-content !important;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Timeline step specific */
.step-content.timeline-step {
  display: flex;
  flex-direction: column;
  min-height: min-content;
  padding-bottom: 30px;
}

.step-title {
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 24px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--border-light);
  position: relative;
}

.step-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: var(--primary);
}

.dark .step-title {
  color: var(--text-dark);
  border-bottom-color: var(--border-dark);
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}

/* ============================================
   FORM ELEMENTS
   ============================================ */

.info-grid,
.management-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
  position: relative;
}

.form-group.half {
  flex: 1;
}

.form-label {
  display: block;
  font-size: clamp(11px, 2.5vw, 12px);
  font-weight: 600;
  color: var(--muted-light);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .form-label {
  color: var(--muted-dark);
}

.required {
  color: #ef4444;
  margin-left: 4px;
  font-size: 14px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: clamp(10px, 3vw, 12px) clamp(12px, 3vw, 16px);
  border: 2px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background-color: var(--card-light);
  color: var(--text-light);
  font-size: clamp(13px, 3vw, 14px);
  transition: all 0.2s;
  font-family: inherit;
}

.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: var(--primary-light);
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  transform: translateY(-1px);
}

.form-input.error,
.form-select.error {
  border-color: #ef4444;
  background-color: rgba(239, 68, 68, 0.05);
}

.form-input.error:focus,
.form-select.error:focus {
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: clamp(10px, 2.5vw, 11px);
  color: #ef4444;
  margin-top: 6px;
  display: block;
  animation: shake 0.3s ease;
}

@keyframes shake {

  0%,
  100% {
    transform: translateX(0);
  }

  25% {
    transform: translateX(-5px);
  }

  75% {
    transform: translateX(5px);
  }
}

/* ============================================
   BUTTONS
   ============================================ */

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: clamp(8px, 2vw, 10px) clamp(16px, 4vw, 20px);
  border-radius: var(--border-radius-md);
  border: 2px solid var(--border-light);
  background-color: transparent;
  color: var(--primary);
  font-size: clamp(12px, 3vw, 13px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.add-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.add-btn:hover::before {
  width: 200px;
  height: 200px;
}

.add-btn:hover {
  background-color: var(--primary);
  color: white;
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.add-btn .material-symbols-outlined {
  font-size: 18px;
  transition: transform 0.2s;
}

.add-btn:hover .material-symbols-outlined {
  transform: rotate(90deg);
}

.add-btn.active {
  background-color: #ef4444;
  color: white;
  border-color: #ef4444;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.add-btn.active::before {
  background: rgba(255, 255, 255, 0.2);
}

.add-btn.active:hover {
  background-color: #dc2626;
  border-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
}

.add-btn.active .material-symbols-outlined {
  transform: rotate(90deg);
}

/* ============================================
   MODAL FOOTER - Fixed at bottom
   ============================================ */

.prmpt-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(16px, 4vw, 20px) clamp(20px, 5vw, 24px);
  border-top: 2px solid var(--border-light);
  background-color: var(--bg-header);
  flex-wrap: wrap;
  gap: 16px;
  flex-shrink: 0 !important;
  margin-top: auto !important;
  position: relative;
  z-index: 10;
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.03);
  border-bottom-left-radius: var(--border-radius-lg);
  border-bottom-right-radius: var(--border-radius-lg);
}

.dark .prmpt-modal-footer {
  border-top-color: var(--border-dark);
  background-color: var(--dark-bg-header);
  box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.2);
}

.footer-left {
  flex: 1 1 auto;
  min-width: min(200px, 100%);
}

.required-fields-note {
  font-size: clamp(11px, 2.5vw, 12px);
  color: var(--muted-light);
  padding: 6px 12px;
  background-color: var(--card-light);
  border-radius: 20px;
  display: inline-block;
}

.dark .required-fields-note {
  color: var(--muted-dark);
  background-color: var(--card-dark);
}

.footer-right {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: 0 1 auto;
}

.prmpt-modal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: clamp(8px, 2vw, 10px) clamp(16px, 4vw, 24px);
  border-radius: var(--border-radius-md);
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: none;
  white-space: nowrap;
}

.prmpt-prev-btn,
.prmpt-next-btn {
  background-color: transparent;
  color: var(--text-light);
  border: 2px solid var(--border-light);
}

.dark .prmpt-prev-btn,
.dark .prmpt-next-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.prmpt-prev-btn:hover:not(:disabled),
.prmpt-next-btn:hover:not(:disabled) {
  background-color: var(--bg-header);
  border-color: var(--primary);
  color: var(--primary);
  transform: translateX(-4px);
}

.prmpt-next-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prmpt-create-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.prmpt-create-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.prmpt-create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.prmpt-cancel-btn {
  background-color: transparent;
  color: var(--text-light);
  border: 2px solid var(--border-light);
}

.dark .prmpt-cancel-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.prmpt-cancel-btn:hover {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
  color: #ef4444;
  transform: translateY(-2px);
}

/* ============================================
   TEAM MEMBERS SECTION
   ============================================ */

.team-members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.team-members-list::-webkit-scrollbar {
  width: 6px;
}

.team-members-list::-webkit-scrollbar-track {
  background: var(--bg-header);
  border-radius: 3px;
}

.team-members-list::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

.team-member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(12px, 3vw, 16px);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  transition: all 0.2s;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dark .team-member-item {
  background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
  border-color: var(--border-dark);
}

.team-member-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--primary);
}

.member-info {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16px);
  flex: 1;
  min-width: 0;
}

.member-avatar-small {
  width: clamp(36px, 8vw, 44px);
  height: clamp(36px, 8vw, 44px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: clamp(14px, 3vw, 16px);
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.2s;
}

.team-member-item:hover .member-avatar-small {
  transform: scale(1.1);
}

.member-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.member-name {
  font-size: clamp(14px, 3vw, 15px);
  font-weight: 600;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .member-name {
  color: var(--text-dark);
}

.member-role {
  font-size: clamp(11px, 2.5vw, 12px);
  color: var(--muted-light);
  padding: 2px 8px;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 12px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .member-role {
  color: var(--muted-dark);
}

.remove-member-btn {
  width: clamp(32px, 7vw, 36px);
  height: clamp(32px, 7vw, 36px);
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.remove-member-btn:hover {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  transform: rotate(90deg);
}

.team-error {
  margin-top: 16px;
  padding: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-radius: var(--border-radius-md);
  text-align: center;
  border: 1px solid #ef4444;
  font-size: clamp(12px, 3vw, 13px);
}

/* ============================================
   INLINE MEMBER SELECTOR
   ============================================ */

.inline-member-selector {
  margin-top: 24px;
  padding: clamp(16px, 4vw, 24px);
  background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--primary);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease;
  position: relative;
  overflow: hidden;
}

.dark .inline-member-selector {
  background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
  border-color: var(--primary-dark);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  max-height: 600px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  margin-top: 0;
  padding-top: 0;
  padding-bottom: 0;
  transform: translateY(-20px);
}

/* Selector Header */
.inline-member-selector .selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid var(--border-light);
  flex-wrap: wrap;
  gap: 12px;
}

.dark .inline-member-selector .selector-header {
  border-bottom-color: var(--border-dark);
}

.inline-member-selector .selector-header h5 {
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
  color: var(--text-light);
  margin: 0;
  position: relative;
  padding-left: 12px;
}

.inline-member-selector .selector-header h5::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: var(--primary);
  border-radius: 2px;
}

.dark .inline-member-selector .selector-header h5 {
  color: var(--text-dark);
}

.selected-count {
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  color: var(--primary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.2) 100%);
  padding: clamp(4px, 1.5vw, 6px) clamp(12px, 3vw, 16px);
  border-radius: 30px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
  white-space: nowrap;
}

/* Search Bar */
.selector-search {
  position: relative;
  margin-bottom: 24px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted-light);
  font-size: 22px;
  transition: color 0.2s;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: clamp(12px, 3vw, 14px) clamp(12px, 3vw, 14px) clamp(12px, 3vw, 14px) 48px;
  border: 2px solid var(--border-light);
  border-radius: 40px;
  background-color: var(--card-light);
  color: var(--text-light);
  font-size: clamp(14px, 3vw, 15px);
  transition: all 0.3s;
  font-family: inherit;
}

.dark .search-input {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.search-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  transform: translateY(-1px);
}

.search-input:focus+.search-icon {
  color: var(--primary);
}

/* Member Grid */
.selector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 16px;
  max-height: min(400px, 50vh);
  overflow-y: auto;
  padding: 8px 4px;
  margin-bottom: 24px;
}

.selector-grid::-webkit-scrollbar {
  width: 8px;
}

.selector-grid::-webkit-scrollbar-track {
  background: var(--bg-header);
  border-radius: 10px;
}

.selector-grid::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 10px;
  border: 2px solid var(--bg-header);
}

.selector-grid::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

/* Member Card */
.member-card {
  display: flex;
  align-items: center;
  gap: clamp(12px, 3vw, 16px);
  padding: clamp(12px, 3vw, 16px);
  background-color: var(--bg-header);
  border: 2px solid var(--border-light);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}

.dark .member-card {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.member-card:hover {
  transform: translateY(-4px) scale(1.02);
  border-color: var(--primary);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.15);
}

.member-card.selected {
  border-color: var(--primary);
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.1) 100%);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
}

/* Member Avatar */
.member-avatar {
  width: clamp(44px, 10vw, 52px);
  height: clamp(44px, 10vw, 52px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: clamp(16px, 4vw, 18px);
  flex-shrink: 0;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.member-card:hover .member-avatar {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

/* Member Info */
.member-card .member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.member-card .member-name {
  font-size: clamp(14px, 3.5vw, 16px);
  font-weight: 700;
  color: var(--text-light);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .member-card .member-name {
  color: var(--text-dark);
}

.member-card .member-role {
  font-size: clamp(11px, 2.8vw, 13px);
  color: var(--muted-light);
  padding: 4px 8px;
  background-color: rgba(59, 130, 246, 0.08);
  border-radius: 20px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Selection Indicator */
.member-select-indicator {
  color: var(--muted-light);
  transition: all 0.2s;
  flex-shrink: 0;
}

.member-card.selected .member-select-indicator {
  color: var(--primary);
  transform: scale(1.1);
}

.member-select-indicator .material-symbols-outlined {
  font-size: clamp(24px, 5vw, 28px);
}

/* No Results */
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(32px, 8vw, 48px) clamp(16px, 4vw, 24px);
  color: var(--muted-light);
  text-align: center;
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
  border-radius: 20px;
  border: 2px dashed var(--border-light);
  margin: 16px 0;
}

.dark .no-results {
  background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
  border-color: var(--border-dark);
}

.no-results .material-symbols-outlined {
  font-size: clamp(40px, 10vw, 48px);
  margin-bottom: 12px;
}

.no-results p {
  font-size: clamp(14px, 3.5vw, 16px);
  margin: 0;
}

/* Selector Footer */
.inline-member-selector .selector-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 20px;
  border-top: 2px solid var(--border-light);
  margin-top: 8px;
  flex-wrap: wrap;
  gap: 16px;
}

.dark .inline-member-selector .selector-footer {
  border-top-color: var(--border-dark);
}

.select-all-btn {
  padding: clamp(8px, 2vw, 10px) clamp(16px, 4vw, 24px);
  border: 2px solid var(--border-light);
  border-radius: 40px;
  background: transparent;
  color: var(--primary);
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.select-all-btn:hover {
  background-color: var(--bg-header);
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
}

.cancel-btn {
  padding: clamp(10px, 2.5vw, 12px) clamp(20px, 5vw, 28px);
  border-radius: 40px;
  border: 2px solid var(--border-light);
  background-color: transparent;
  color: var(--text-light);
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.dark .cancel-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.cancel-btn:hover {
  background-color: rgba(239, 68, 68, 0.05);
  border-color: #ef4444;
  color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
}

.add-selected-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: clamp(10px, 2.5vw, 12px) clamp(24px, 6vw, 32px);
  border-radius: 40px;
  border: none;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  font-size: clamp(12px, 3vw, 14px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.add-selected-btn:hover:not(:disabled) {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 28px rgba(59, 130, 246, 0.4);
}

.add-selected-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
}

.add-selected-btn .material-symbols-outlined {
  font-size: 18px;
}

/* ============================================
   MILESTONES SECTION
   ============================================ */

.milestones-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-height: 500px;
  overflow-y: auto;
  padding-right: 8px;
}

.milestones-list::-webkit-scrollbar {
  width: 6px;
}

.milestones-list::-webkit-scrollbar-track {
  background: var(--bg-header);
}

.milestones-list::-webkit-scrollbar-thumb {
  background: var(--border-light);
  border-radius: 3px;
}

/* Milestones Empty State */
.milestones-empty {
  margin: 40px 0;
  padding: clamp(40px, 10vw, 60px) clamp(16px, 4vw, 24px);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
  border: 3px dashed var(--border-light);
}

.dark .milestones-empty {
  background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
  border-color: var(--border-dark);
}

/* ============================================
   TIMESHEET MODAL (INLINE) - FIXED POSITIONING
   ============================================ */

.timesheet-modal-inline {
  position: relative !important;
  top: 0 !important;
  left: 0 !important;
  transform: none !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-top: 20px !important;
  margin-bottom: 20px !important;
  max-height: none !important;
  background-color: var(--card-light);
  border-radius: var(--border-radius-lg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  z-index: 5;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.dark .timesheet-modal-inline {
  background-color: var(--card-dark);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.timesheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: clamp(12px, 3vw, 16px) clamp(16px, 4vw, 20px);
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
}

.timesheet-header .header-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.timesheet-header h3 {
  font-size: clamp(14px, 3.5vw, 16px);
  font-weight: 600;
  margin: 0;
}

.timesheet-content {
  max-height: 500px;
  overflow-y: auto;
  padding: clamp(16px, 4vw, 20px);
}

.close-btn-small {
  width: clamp(28px, 6vw, 32px);
  height: clamp(28px, 6vw, 32px);
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn-small:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* ============================================
   VALIDATION MESSAGE
   ============================================ */

.validation-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  padding: clamp(12px, 3vw, 14px) clamp(14px, 3.5vw, 18px);
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%);
  border-radius: var(--border-radius-md);
  font-size: clamp(12px, 3vw, 13px);
  font-weight: 500;
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.validation-message.warning {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.3);
}

.validation-message .material-symbols-outlined {
  font-size: clamp(20px, 5vw, 22px);
}

/* ============================================
   EMPTY STATE
   ============================================ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(40px, 10vw, 60px) clamp(16px, 4vw, 24px);
  background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
  border-radius: 24px;
  border: 3px dashed var(--border-light);
  color: var(--muted-light);
  text-align: center;
  margin: 20px 0;
  transition: all 0.3s;
}

.dark .empty-state {
  background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
  border-color: var(--border-dark);
}

.empty-state:hover {
  border-color: var(--primary);
  transform: scale(1.02);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.empty-state .material-symbols-outlined {
  font-size: clamp(48px, 12vw, 72px);
  margin-bottom: 16px;
  color: var(--muted-light);
  opacity: 0.5;
  transition: all 0.3s;
}

.empty-state:hover .material-symbols-outlined {
  color: var(--primary);
  opacity: 1;
  transform: scale(1.1);
}

.empty-state p {
  font-size: clamp(16px, 4vw, 18px);
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--text-light);
}

.dark .empty-state p {
  color: var(--text-dark);
}

.empty-hint {
  font-size: clamp(12px, 3vw, 14px) !important;
  opacity: 0.7;
  font-weight: normal !important;
}

/* ============================================
   DEEP COMPONENT STYLES
   ============================================ */

/* Timeline planner container */
:deep(.timeline-planner) {
  display: flex;
  flex-direction: column;
  height: auto !important;
  min-height: 300px;
  max-height: none !important;
  width: 100% !important;
}

:deep(.timeline-definition) {
  max-height: none !important;
  overflow: visible !important;
}

:deep(.gantt-view),
:deep(.definition-view) {
  max-height: none !important;
  overflow: visible !important;
}

/* ============================================
   CONFIRMATION MODAL
   ============================================ */

.confirm-modal-overlay {
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
  z-index: 1100;
  animation: fadeIn 0.2s ease;
}

.confirm-modal-container {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: slideUp 0.3s ease;
}

.dark .confirm-modal-container {
  background: var(--card-dark);
  border: 1px solid var(--border-dark);
}

.confirm-modal-header {
  padding: 24px 24px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.confirm-icon {
  font-size: 32px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
  padding: 8px;
  border-radius: 50%;
}

.confirm-modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-light);
  margin: 0;
}

.dark .confirm-modal-title {
  color: var(--text-dark);
}

.confirm-modal-body {
  padding: 0 24px 24px;
}

.confirm-modal-body p {
  font-size: 15px;
  color: var(--text-light);
  margin: 0 0 8px 0;
  line-height: 1.5;
}

.dark .confirm-modal-body p {
  color: var(--text-dark);
}

.confirm-hint {
  font-size: 13px !important;
  color: var(--muted-light) !important;
  font-weight: 500;
}

.dark .confirm-hint {
  color: var(--muted-dark) !important;
}

.confirm-modal-footer {
  padding: 16px 24px 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  border-top: 1px solid var(--border-light);
}

.dark .confirm-modal-footer {
  border-top-color: var(--border-dark);
}

.confirm-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  flex: 1;
  justify-content: center;
}

.confirm-btn .material-symbols-outlined {
  font-size: 18px;
}

.confirm-btn.cancel-btn {
  background: transparent;
  color: var(--text-light);
  border: 1px solid var(--border-light);
}

.dark .confirm-btn.cancel-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.confirm-btn.cancel-btn:hover {
  background: var(--bg-header);
  border-color: var(--primary);
  color: var(--primary);
}

.confirm-btn-danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.confirm-btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
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

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Large Desktop (1200px and above) */
@media (min-width: 1200px) {
  .project-create-modal {
    max-width: 1000px !important;
  }

  .prmpt-modal-container {
    max-height: 85vh !important;
  }
}

/* Desktop (1024px to 1199px) */
@media (max-width: 1199px) and (min-width: 1025px) {
  .project-create-modal {
    max-width: 950px !important;
  }
}

/* Small Desktop / Tablet Landscape (768px to 1024px) */
@media (max-width: 1024px) {
  .project-create-modal {
    width: 95% !important;
    max-height: 95vh !important;
  }

  .info-grid,
  .management-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .progress-step .step-label {
    font-size: 11px;
  }
}

/* Tablet Portrait (481px to 768px) - FOOTER FIXES */
@media (max-width: 768px) {
  .project-create-modal {
    width: 100% !important;
    max-height: 100vh !important;
    margin: 0 !important;
  }

  .prmpt-modal-container {
    max-height: 100vh !important;
    border-radius: 0 !important;
  }

  .prmpt-modal-header {
    border-radius: 0 !important;
    padding: 16px 50px 16px 16px !important;
  }

  .prmpt-modal-footer {
    padding: 16px !important;
    position: sticky !important;
    bottom: 0 !important;
    background-color: var(--bg-header);
    border-top: 2px solid var(--border-light);
    box-shadow: 0 -4px 10px rgba(0, 0, 0, 0.1);
    border-radius: 0 !important;
  }

  .dark .prmpt-modal-footer {
    background-color: var(--dark-bg-header);
    border-top-color: var(--border-dark);
  }

  .footer-right {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .prmpt-modal-btn {
    width: 100%;
    justify-content: center;
    padding: 12px !important;
    min-height: 48px;
  }

  .progress-steps {
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }

  .progress-step {
    min-width: 70px;
    flex: 0 1 auto;
  }

  .progress-step .step-label {
    font-size: 10px;
    white-space: normal;
    word-break: break-word;
  }

  .step-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .add-btn {
    width: 100%;
    justify-content: center;
  }

  .info-grid,
  .management-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .inline-member-selector {
    padding: 20px;
  }

  .inline-member-selector .selector-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .selector-grid {
    grid-template-columns: 1fr;
    max-height: 350px;
  }

  .inline-member-selector .selector-footer {
    flex-direction: column;
    gap: 16px;
  }

  .inline-member-selector .footer-left,
  .inline-member-selector .footer-right {
    width: 100%;
  }

  .select-all-btn,
  .cancel-btn,
  .add-selected-btn {
    width: 100%;
    justify-content: center;
  }

  .inline-member-selector .footer-right {
    flex-direction: column-reverse;
    gap: 12px;
  }

  .confirm-modal-container {
    width: 95%;
    margin: 20px;
  }
}

/* Mobile Landscape (321px to 480px) */
@media (max-width: 480px) {
  .project-create-modal {
    width: 100% !important;
    max-height: 100vh !important;
    border-radius: 0 !important;
  }

  .prmpt-modal-header {
    padding: 12px 45px 12px 12px !important;
  }

  .prmpt-modal-title {
    font-size: 16px;
  }

  .close-btn {
    top: 10px;
    right: 10px;
    width: 36px;
    height: 36px;
  }

  .creation-progress {
    padding: 12px 12px 0;
  }

  .progress-step {
    min-width: 60px;
  }

  .progress-step .step-indicator {
    width: 30px;
    height: 30px;
    font-size: 12px;
  }

  .progress-step .step-label {
    font-size: 9px;
  }

  .step-content {
    padding: 12px;
  }

  .step-title {
    font-size: 16px;
    margin-bottom: 12px;
  }

  .form-input,
  .form-select,
  .form-textarea {
    padding: 10px 12px;
    font-size: 14px;
  }

  .prmpt-modal-footer {
    padding: 12px !important;
    flex-direction: column;
    gap: 12px;
  }

  .footer-left {
    width: 100%;
    text-align: center;
  }

  .required-fields-note {
    width: 100%;
    text-align: center;
  }

  .footer-right {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
    grid-template-columns: none;
  }

  .prmpt-modal-btn {
    width: 100%;
    justify-content: center;
    padding: 14px !important;
    font-size: 14px;
    min-height: 48px;
  }

  .team-member-item {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .member-info {
    width: 100%;
  }

  .member-avatar-small {
    width: 40px;
    height: 40px;
    font-size: 15px;
  }

  .remove-member-btn {
    align-self: flex-end;
  }

  .inline-member-selector {
    padding: 12px;
    margin-top: 12px;
  }

  .selector-header h5 {
    font-size: 16px;
  }

  .selected-count {
    width: 100%;
    text-align: center;
  }

  .member-card {
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
  }

  .member-avatar {
    width: 48px;
    height: 48px;
    font-size: 16px;
  }

  .member-select-indicator {
    position: absolute;
    top: 12px;
    right: 12px;
  }

  .member-card .member-info {
    padding-right: 32px;
  }

  .timesheet-modal-inline {
    margin-top: 12px;
    margin-bottom: 12px;
  }

  .timesheet-header {
    padding: 10px 12px;
  }

  .timesheet-content {
    padding: 12px;
    max-height: 400px;
  }

  .empty-state {
    padding: 30px 12px;
    margin: 12px 0;
  }

  .empty-state .material-symbols-outlined {
    font-size: 48px;
  }

  .empty-state p {
    font-size: 16px;
  }

  .empty-hint {
    font-size: 13px;
  }

  .validation-message {
    flex-direction: column;
    text-align: center;
    gap: 8px;
    padding: 12px;
  }

  .confirm-modal-footer {
    flex-direction: column-reverse;
  }

  .confirm-btn {
    width: 100%;
  }
}

/* Mobile Portrait (320px and below) */
@media (max-width: 320px) {
  .progress-step {
    min-width: 50px;
  }

  .progress-step .step-indicator {
    width: 26px;
    height: 26px;
    font-size: 11px;
    border-width: 1px;
  }

  .progress-step .step-label {
    font-size: 8px;
  }

  .prmpt-modal-footer {
    padding: 8px !important;
  }

  .prmpt-modal-btn {
    padding: 10px !important;
    font-size: 12px;
    min-height: 44px;
  }

  .member-avatar-small {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .member-name {
    font-size: 13px;
  }

  .member-role {
    font-size: 10px;
  }

  .select-all-btn,
  .cancel-btn,
  .add-selected-btn {
    padding: 8px 12px;
    font-size: 12px;
  }

  .confirm-modal-title {
    font-size: 18px;
  }
}

/* ============================================
   SAFE AREA INSETS FOR MODERN DEVICES
   ============================================ */

@supports (padding: max(0px)) {
  @media (max-width: 768px) {
    .prmpt-modal-footer {
      padding-bottom: max(16px, env(safe-area-inset-bottom)) !important;
      padding-left: max(16px, env(safe-area-inset-left)) !important;
      padding-right: max(16px, env(safe-area-inset-right)) !important;
    }

    .prmpt-modal-header {
      padding-top: max(16px, env(safe-area-inset-top)) !important;
      padding-left: max(16px, env(safe-area-inset-left)) !important;
      padding-right: max(60px, env(safe-area-inset-right)) !important;
    }

    .project-create-body {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}

/* ============================================
   HIGH-DPI / RETINA DISPLAYS
   ============================================ */

@media (-webkit-min-device-pixel-ratio: 2),
(min-resolution: 192dpi) {

  .member-avatar,
  .member-avatar-small,
  .step-indicator {
    border-width: 1px;
  }
}

/* ============================================
   DARK MODE SUPPORT FOR ALL BREAKPOINTS
   ============================================ */

@media (prefers-color-scheme: dark) {
  .dark .member-card {
    border-color: var(--border-dark);
  }

  .dark .member-card:hover {
    border-color: var(--primary);
  }
}

/* ============================================
   PRINT STYLES
   ============================================ */

@media print {
  .prmpt-modal-overlay {
    position: static;
    background: none;
  }

  .project-create-modal {
    box-shadow: none;
    border: 1px solid #000;
    max-height: none !important;
    overflow: visible !important;
  }

  .prmpt-modal-container {
    max-height: none !important;
    overflow: visible !important;
  }

  .close-btn,
  .add-btn,
  .remove-member-btn,
  .prmpt-modal-btn,
  .select-all-btn,
  .cancel-btn,
  .add-selected-btn,
  .confirm-btn {
    display: none !important;
  }

  .progress-bar,
  .progress-fill {
    border: 1px solid #000;
    background: none !important;
  }

  .member-avatar,
  .member-avatar-small {
    border: 1px solid #000;
    background: #f0f0f0 !important;
    color: #000 !important;
  }

  .step-content {
    page-break-inside: avoid;
  }
}

/* ============================================
   ACCESSIBILITY - REDUCED MOTION
   ============================================ */

@media (prefers-reduced-motion: reduce) {

  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }

  .close-btn:hover,
  .add-btn:hover,
  .member-card:hover,
  .empty-state:hover {
    transform: none !important;
  }

  .progress-fill {
    transition: none !important;
  }
}

/* ============================================
   TOUCH DEVICE OPTIMIZATIONS
   ============================================ */

@media (hover: none) and (pointer: coarse) {

  .add-btn,
  .prmpt-modal-btn,
  .member-card,
  .select-all-btn,
  .cancel-btn,
  .add-selected-btn,
  .confirm-btn {
    min-height: 48px;
  }

  .member-avatar-small,
  .member-avatar {
    width: 48px;
    height: 48px;
  }

  .remove-member-btn,
  .close-btn,
  .close-btn-small {
    width: 44px;
    height: 44px;
  }

  .search-input {
    font-size: 16px;
  }

  select,
  input[type="date"],
  input[type="text"],
  textarea {
    font-size: 16px;
  }
}

/* ============================================
   LANDSCAPE ORIENTATION FIXES
   ============================================ */

@media (max-height: 500px) and (orientation: landscape) {
  .project-create-modal {
    max-height: 100vh !important;
  }

  .prmpt-modal-container {
    max-height: 100vh !important;
  }

  .project-create-body {
    max-height: calc(100vh - 120px) !important;
  }

  .creation-progress {
    padding: 10px 16px 0;
  }

  .progress-step {
    flex-direction: row;
    gap: 4px;
  }

  .progress-step .step-indicator {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .progress-step .step-label {
    font-size: 10px;
  }

  .confirm-modal-container {
    max-width: 500px;
  }
}
</style>