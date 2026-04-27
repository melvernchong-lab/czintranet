<template>
  <div class="milestone-item" :class="{ saved: isSaved, 'edit-mode': localEditMode }">
    <!-- Milestone Header -->
    <div class="milestone-header">
      <div class="milestone-title-section">
        <input type="text" v-model="localMilestone.name" class="milestone-name-input" placeholder="Milestone name"
          @input="updateMilestone" :disabled="isSaved && !localEditMode" :class="{ 'saved-field': isSaved }" />
      </div>
      
      <!-- Actions for saved milestone -->
      <div v-if="isSaved" class="header-actions">
        <button class="edit-toggle-btn" @click.stop="toggleEditMode" :title="localEditMode ? 'Cancel Edit' : 'Edit Milestone'">
          <span class="material-symbols-outlined">{{ localEditMode ? 'close' : 'edit' }}</span>
        </button>
        <button class="remove-btn" @click.stop="handleRemove" title="Remove Milestone">
          <span class="material-symbols-outlined">delete</span>
        </button>
        <div class="saved-badge">
          <span class="material-symbols-outlined">check_circle</span>
          <span>Saved</span>
        </div>
      </div>
      
      <!-- Actions for unsaved milestone -->
      <div v-else class="header-actions">
        <button class="remove-btn" @click.stop="handleRemove" title="Remove Milestone">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>

    <!-- Preview Section (when saved and not in edit mode) -->
    <div v-if="isSaved && !localEditMode" class="milestone-preview">
      <div class="preview-stats">
        <div class="preview-stat">
          <span class="stat-label">Team Members:</span>
          <span class="stat-value">{{ getAssignedMembersCount }} assigned</span>
        </div>
        <div class="preview-stat">
          <span class="stat-label">Total Mandays:</span>
          <span class="stat-value">{{ calculateTotal }} days</span>
        </div>
      </div>
      
      <!-- Expand/Collapse Button - only show if there are details to display -->
      <button 
        v-if="hasDetails" 
        class="expand-btn" 
        @click.stop="togglePreview">
        <span class="material-symbols-outlined">{{ showPreview ? 'expand_less' : 'expand_more' }}</span>
        {{ showPreview ? 'Show less' : 'Show details' }}
      </button>
    </div>

    <!-- Team Members Assignment Table - show when not saved OR in edit mode -->
    <div v-if="!isSaved || localEditMode">
      <MilestoneTeamAssignment 
        v-model="localMilestone" 
        :available-members="availableMembers" 
        :readonly="false"
        :show-validation="showValidation" />
    </div>

    <!-- Read-only summary when saved and not in edit mode -->
    <div v-else-if="isSaved && !localEditMode" class="saved-summary">
      <div class="summary-row">
        <span class="summary-label">Assigned Members:</span>
        <div class="member-chips">
          <span v-for="member in assignedMembersList" :key="member.id" class="member-chip">
            <span class="member-chip-avatar" :style="{ backgroundColor: member.avatarColor }">{{ member.initials }}</span>
            {{ member.name }}
          </span>
          <span v-if="assignedMembersList.length === 0" class="text-muted">No members assigned</span>
        </div>
      </div>
    </div>

    <!-- Expanded Details (only visible when saved, preview expanded, not in edit mode, and has details) -->
    <div v-if="isSaved && showPreview && !localEditMode && hasDetails" class="expanded-details">
      <!-- Milestone Dependencies -->
      <div v-if="localMilestone.dependencies?.length" class="detail-section">
        <h5 class="detail-title">Dependencies</h5>
        <div class="detail-items">
          <span v-for="depId in localMilestone.dependencies" :key="depId" class="detail-item">
            {{ getMilestoneName(depId) }}
          </span>
        </div>
      </div>

      <!-- Milestone Attachments -->
      <div v-if="localMilestone.attachments?.length" class="detail-section">
        <h5 class="detail-title">Attachments</h5>
        <div class="detail-items">
          <div v-for="attachment in localMilestone.attachments" :key="attachment.id" class="attachment-preview">
            <span class="material-symbols-outlined">attach_file</span>
            <span>{{ attachment.name }}</span>
            <span class="attachment-size">{{ formatFileSize(attachment.size) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state for details when expanded but no content -->
    <div v-else-if="isSaved && showPreview && !localEditMode && !hasDetails" class="expanded-details empty-details">
      <div class="empty-state small">
        <span class="material-symbols-outlined">info</span>
        <p>No dependencies or attachments</p>
      </div>
    </div>

    <!-- Milestone Summary with Save/Update Button -->
    <div class="milestone-summary">
      <div class="summary-item">
        <span class="summary-label">Total Planned Mandays:</span>
        <span class="summary-value">{{ calculateTotal }}</span>
      </div>
      
      <!-- Save/Update Button -->
      <button 
        v-if="!isSaved || localEditMode"
        class="primary-btn" 
        @click.stop="handleSaveClick" 
        :disabled="!isValid">
        <span class="material-symbols-outlined">{{ isSaved ? 'save' : 'add_task' }}</span>
        {{ isSaved ? 'Update Milestone' : 'Save Milestone' }}
      </button>
      
      <!-- Saved badge when saved and not in edit mode -->
      <div v-else class="saved-status">
        <span class="material-symbols-outlined">check_circle</span>
        <span>Saved to Project</span>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import MilestoneTeamAssignment from '../projectTeamMemberAssignment/MilestoneTeamAssignment.vue'

export default {
  name: 'MilestoneItem',
  components: {
    MilestoneTeamAssignment
  },
  props: {
    milestone: {
      type: Object,
      required: true
    },
    availableMembers: {
      type: Array,
      required: true
    },
    allMilestones: {
      type: Array,
      default: () => []
    },
    milestoneIndex: {
      type: Number,
      default: 0
    },
    totalMilestones: {
      type: Number,
      default: 0
    },
    isSaved: {
      type: Boolean,
      default: false
    },
    showValidation: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [String, Number],
      default: null
    },
    projectName: {
      type: String,
      default: ''
    }
  },
  emits: ['update:milestone', 'remove', 'save', 'save-project'],
  setup(props, { emit }) {
    const showPreview = ref(false)
    const localEditMode = ref(false)
    const isSavingProject = ref(false)
    
    // Create local copy of milestone with default values
    const localMilestone = ref({
      id: props.milestone.id || Date.now() + Math.random(),
      name: props.milestone.name || '',
      assignments: props.milestone.assignments ? [...props.milestone.assignments] : [],
      dependencies: props.milestone.dependencies ? [...props.milestone.dependencies] : [],
      attachments: props.milestone.attachments ? [...props.milestone.attachments] : []
    })

    // Watch for external changes
    watch(() => props.milestone, (newVal) => {
      if (newVal) {
        localMilestone.value = { 
          ...localMilestone.value, 
          ...newVal,
          assignments: newVal.assignments ? [...newVal.assignments] : [],
          dependencies: newVal.dependencies ? [...newVal.dependencies] : [],
          attachments: newVal.attachments ? [...newVal.attachments] : []
        }
      }
    }, { deep: true, immediate: true })

    // Computed properties
    const isValid = computed(() => {
      return localMilestone.value.name && localMilestone.value.name.trim() !== ''
    })

    const calculateTotal = computed(() => {
      if (!localMilestone.value.assignments) return 0
      return localMilestone.value.assignments.reduce((total, assignment) => {
        return total + (Number(assignment.plannedMandays) || 0)
      }, 0)
    })

    const getAssignedMembersCount = computed(() => {
      if (!localMilestone.value.assignments) return 0
      return localMilestone.value.assignments.filter(a => a.memberId).length
    })

    const assignedMembersList = computed(() => {
      if (!localMilestone.value.assignments) return []
      return localMilestone.value.assignments
        .filter(a => a.memberId)
        .map(a => {
          const member = props.availableMembers.find(m => m.id === a.memberId)
          return member || { id: a.memberId, name: 'Unknown', initials: '??', avatarColor: '#ccc' }
        })
    })

    // Check if there are any details to show
    const hasDetails = computed(() => {
      const hasDependencies = localMilestone.value.dependencies && localMilestone.value.dependencies.length > 0
      const hasAttachments = localMilestone.value.attachments && localMilestone.value.attachments.length > 0
      return hasDependencies || hasAttachments
    })

    // Methods
    const updateMilestone = () => {
      emit('update:milestone', { ...localMilestone.value })
    }

    const handleSaveClick = () => {
      if (!isValid.value) return
      
      // Ensure we have an ID
      if (!localMilestone.value.id) {
        localMilestone.value.id = Date.now() + Math.random()
      }
      
      // Emit save event with the milestone data
      emit('save', { 
        ...localMilestone.value,
        isSaved: true 
      })
      
      // Exit edit mode after saving
      localEditMode.value = false
    }

    const handleRemove = () => {
      emit('remove')
    }

    const toggleEditMode = () => {
      localEditMode.value = !localEditMode.value
      // Reset preview when entering edit mode
      if (localEditMode.value) {
        showPreview.value = false
      }
    }

    const togglePreview = () => {
      showPreview.value = !showPreview.value
    }

    const getMilestoneName = (milestoneId) => {
      const milestone = props.allMilestones.find(m => m.id === milestoneId)
      return milestone ? milestone.name : 'Unknown Milestone'
    }

    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    // Save project with all milestones (called from parent when needed)
    const saveProject = async () => {
      if (isSavingProject.value) return
      
      isSavingProject.value = true
      
      try {
        const allMilestones = props.allMilestones
        
        const projectData = {
          id: props.projectId,
          name: props.projectName,
          milestones: allMilestones.map(m => ({
            id: m.id,
            name: m.name,
            assignments: m.assignments || [],
            dependencies: m.dependencies || [],
            attachments: m.attachments || [],
            totalMandays: m.assignments?.reduce((sum, a) => sum + (Number(a.plannedMandays) || 0), 0) || 0,
            isSaved: m.isSaved || false
          })),
          totalMilestones: allMilestones.length,
          totalMandays: allMilestones.reduce((sum, m) => {
            return sum + (m.assignments?.reduce((s, a) => s + (Number(a.plannedMandays) || 0), 0) || 0)
          }, 0),
          lastUpdated: new Date().toISOString(),
          timelineCreated: false
        }
        
        emit('save-project', projectData)
        
        // Save to localStorage
        const savedProjects = JSON.parse(localStorage.getItem('saved_projects') || '[]')
        const existingIndex = savedProjects.findIndex(p => p.id === props.projectId)
        
        if (existingIndex !== -1) {
          savedProjects[existingIndex] = { ...savedProjects[existingIndex], ...projectData, updatedAt: new Date().toISOString() }
        } else {
          savedProjects.push({ ...projectData, createdAt: new Date().toISOString() })
        }
        
        localStorage.setItem('saved_projects', JSON.stringify(savedProjects))
        localStorage.setItem(`project_${props.projectId}`, JSON.stringify(projectData))
        
        console.log('Project saved successfully:', projectData)
        
      } catch (error) {
        console.error('Error saving project:', error)
      } finally {
        isSavingProject.value = false
      }
    }

    return {
      localMilestone,
      showPreview,
      localEditMode,
      calculateTotal,
      getAssignedMembersCount,
      assignedMembersList,
      isValid,
      hasDetails,
      updateMilestone,
      handleSaveClick,
      handleRemove,
      toggleEditMode,
      togglePreview,
      getMilestoneName,
      formatFileSize,
      saveProject
    }
  }
}
</script>

<style scoped>
@import "../../../../../styles/shared/globals.css";

/* Add animation for toast notification */
@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.milestone-item {
  padding: 20px;
  background-color: var(--bg-header);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  margin-bottom: 16px;
  transition: all 0.2s;
  position: relative;
  overflow: auto;
}

.dark .milestone-item {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.milestone-item:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  border-color: var(--primary-light);
}

.milestone-item.saved {
  border-color: #10b981;
  background: linear-gradient(135deg, var(--bg-header) 0%, rgba(16, 185, 129, 0.05) 100%);
}

.dark .milestone-item.saved {
  background: linear-gradient(135deg, var(--dark-bg-header) 0%, rgba(16, 185, 129, 0.1) 100%);
}

.milestone-item.edit-mode {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.milestone-title-section {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  flex: 1;
  align-items: center;
}

.milestone-name-input {
  font-size: 16px;
  font-weight: 600;
  padding: 10px 14px;
  border: 2px solid var(--border-light);
  border-radius: var(--border-radius-md);
  background-color: var(--card-light);
  color: var(--text-light);
  width: 300px;
  max-width: 100%;
  transition: all 0.2s;
}

.dark .milestone-name-input {
  background-color: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.milestone-name-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.milestone-name-input.saved-field {
  background-color: rgba(16, 185, 129, 0.05);
  border-color: #10b981;
  color: var(--text-light);
}

.milestone-name-input:disabled {
  opacity: 0.8;
  cursor: default;
  background-color: var(--bg-header);
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.edit-toggle-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dark .edit-toggle-btn {
  border-color: var(--border-dark);
  color: var(--muted-dark);
}

.edit-toggle-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: rotate(15deg);
  background-color: rgba(59, 130, 246, 0.05);
}

.remove-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid var(--border-light);
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.dark .remove-btn {
  border-color: var(--border-dark);
  color: var(--muted-dark);
}

.remove-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  transform: rotate(90deg);
  background-color: rgba(239, 68, 68, 0.05);
}

.saved-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-radius: 30px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.saved-badge .material-symbols-outlined {
  font-size: 18px;
}

/* Preview Section */
.milestone-preview {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.dark .milestone-preview {
  background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
  border-color: var(--border-dark);
}

.preview-stats {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.preview-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .stat-value {
  color: var(--text-dark);
}

.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid var(--border-light);
  border-radius: 30px;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.expand-btn:hover {
  border-color: var(--primary);
  background-color: rgba(59, 130, 246, 0.05);
  transform: translateY(-1px);
}

.expand-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Saved Summary */
.saved-summary {
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
}

.dark .saved-summary {
  background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
  border-color: var(--border-dark);
}

.summary-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.summary-row .summary-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted-light);
  min-width: 120px;
  padding-top: 4px;
}

.member-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

.member-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 4px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: 30px;
  font-size: 13px;
  color: var(--text-light);
  transition: all 0.2s;
}

.dark .member-chip {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.member-chip:hover {
  border-color: var(--primary);
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.member-chip-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: 600;
}

.text-muted {
  color: var(--muted-light);
  font-size: 13px;
  padding: 4px 0;
}

.dark .text-muted {
  color: var(--muted-dark);
}

/* Expanded Details */
.expanded-details {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--border-light);
  animation: slideDown 0.3s ease;
}

.empty-details {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
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

.dark .expanded-details {
  background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
  border-color: var(--border-dark);
}

.detail-section {
  margin-bottom: 16px;
}

.detail-section:last-child {
  margin-bottom: 0;
}

.detail-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px 0;
}

.detail-items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.detail-item {
  padding: 6px 12px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-light);
}

.dark .detail-item {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.attachment-preview {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: var(--bg-header);
  border: 1px solid var(--border-light);
  border-radius: 20px;
  font-size: 12px;
  color: var(--text-light);
}

.dark .attachment-preview {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.attachment-preview .material-symbols-outlined {
  font-size: 16px;
  color: var(--primary);
}

.attachment-size {
  font-size: 10px;
  color: var(--muted-light);
  margin-left: 4px;
}

/* Empty State */
.empty-state.small {
  padding: 20px;
  margin: 0;
  border: none;
  background: transparent;
}

.empty-state.small .material-symbols-outlined {
  font-size: 32px;
  margin-bottom: 8px;
}

.empty-state.small p {
  font-size: 13px;
}

/* Milestone Summary */
.milestone-summary {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
  border-radius: var(--border-radius-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  border: 1px solid var(--border-light);
}

.dark .milestone-summary {
  background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
  border-color: var(--border-dark);
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  background-color: var(--bg-header);
  border-radius: 40px;
  border: 1px solid var(--border-light);
}

.dark .summary-item {
  background-color: var(--dark-bg-header);
  border-color: var(--border-dark);
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted-light);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-value {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-light);
}

.dark .summary-value {
  color: var(--text-dark);
}

/* Primary Button */
.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 24px;
  border: none;
  border-radius: 40px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.primary-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transform: translate(-50%, -50%);
  transition: width 0.4s, height 0.4s;
}

.primary-btn:hover:not(:disabled)::before {
  width: 200px;
  height: 200px;
}

.primary-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
}

.primary-btn:active:not(:disabled) {
  transform: translateY(0);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  box-shadow: none;
}

/* Saved Status */
.saved-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.2) 100%);
  color: #10b981;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 600;
  border: 1px solid #10b981;
}

.saved-status .material-symbols-outlined {
  font-size: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .milestone-header {
    flex-direction: column;
    gap: 12px;
  }

  .milestone-title-section {
    width: 100%;
  }

  .milestone-name-input {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .milestone-preview {
    flex-direction: column;
    align-items: flex-start;
  }

  .preview-stats {
    width: 100%;
    flex-direction: column;
    gap: 8px;
  }

  .expand-btn {
    width: 100%;
    justify-content: center;
  }

  .summary-row {
    flex-direction: column;
    gap: 8px;
  }

  .summary-row .summary-label {
    min-width: auto;
  }

  .milestone-summary {
    flex-direction: column;
    align-items: stretch;
  }

  .summary-item {
    width: 100%;
    justify-content: space-between;
  }

  .primary-btn,
  .saved-status {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .milestone-item {
    padding: 16px;
  }

  .milestone-name-input {
    font-size: 14px;
  }

  .summary-value {
    font-size: 14px;
  }

  .member-chip {
    width: 100%;
  }
}
</style>