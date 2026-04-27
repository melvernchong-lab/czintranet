<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Task Relationships</h3>
        <button class="close-btn" @click="handleClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-context">
          Setting relationships for: <strong>{{ currentTask?.name || 'Unnamed Task' }}</strong>
          <span class="task-id-context">{{ getCurrentTaskId() }}</span>
        </p>
        
        <!-- Current Task Info -->
        <div class="current-task-info">
          <div class="info-row">
            <span class="info-label">Current Dates:</span>
            <span class="info-value">
              {{ formatDate(currentTask?.startDate) || 'Not set' }} → 
              {{ formatDate(currentTask?.endDate) || 'Not set' }}
              <span v-if="currentTask?.durationDays > 0" class="duration-chip">({{ currentTask.durationDays }} days)</span>
            </span>
          </div>
          <div class="info-row" v-if="previewStartDate || previewEndDate">
            <span class="info-label preview">Preview After Save:</span>
            <span class="info-value preview">
              {{ previewStartDate || 'Not set' }} → 
              {{ previewEndDate || 'Not set' }}
            </span>
          </div>
        </div>
        
        <div class="tab-buttons">
          <button 
            class="tab-btn" 
            :class="{ active: relationshipTab === 'dependencies' }"
            @click="switchTab('dependencies')"
          >
            <span class="tab-icon material-symbols-outlined">input</span>
            Dependencies
            <span v-if="tempRelationships.dependencies.length > 0" class="tab-count">{{ tempRelationships.dependencies.length }}</span>
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: relationshipTab === 'successors' }"
            @click="switchTab('successors')"
          >
            <span class="tab-icon material-symbols-outlined">output</span>
            Successors
            <span v-if="tempRelationships.successors.length > 0" class="tab-count">{{ tempRelationships.successors.length }}</span>
          </button>
        </div>
        
        <!-- Dependency Type Selection Panel - Push down from tabs -->
        <div v-if="selectedTaskForType" class="type-selection-panel">
          <div class="type-selection-header">
            <div class="type-selection-title">
              <span class="material-symbols-outlined">link</span>
              <span>Set relationship for <strong>{{ getSelectedTaskName() }}</strong></span>
            </div>
            <button class="close-type-panel" @click="cancelTypeSelection">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
          <div class="type-selection-grid">
            <div 
              v-for="type in relationshipTypes" 
              :key="type.value"
              class="type-selection-card"
              :class="{ 'selected': pendingType === type.value }"
              @click="selectType(type.value)"
            >
              <div class="type-card-icon" :class="type.value">
                {{ type.icon }}
              </div>
              <div class="type-card-info">
                <div class="type-card-code">{{ type.value.toUpperCase() }}</div>
                <div class="type-card-name">{{ type.name }}</div>
                <div class="type-card-desc">{{ type.description }}</div>
              </div>
            </div>
          </div>
          <div class="type-selection-actions">
            <button class="btn-secondary small" @click="cancelTypeSelection">Cancel</button>
            <button class="btn-primary small" @click="applyTypeSelection" :disabled="!pendingType">
              Apply Relationship
            </button>
          </div>
        </div>
        
        <div class="task-list">
          <div v-if="availableTasks.length === 0" class="no-tasks">
            <span class="material-symbols-outlined">info</span>
            <p>No other tasks available</p>
          </div>
          
          <div 
            v-for="task in availableTasks" 
            :key="task.id"
            class="task-item"
            :class="{ 
              'selected': isTaskSelected(task.id, relationshipTab),
              'disabled': task.id === currentTask?.id,
              'pending-selection': pendingTaskId === task.id && relationshipTab === pendingTab
            }"
            @click="handleTaskClick(task.id, relationshipTab)"
          >
            <div class="task-item-selector">
              <span class="checkbox-icon material-symbols-outlined">
                {{ isTaskSelected(task.id, relationshipTab) ? 'check_circle' : 'radio_button_unchecked' }}
              </span>
            </div>
            <span class="task-item-id">{{ getTaskFullId(task) }}</span>
            <span class="task-item-name text-truncate">{{ task.name || 'Unnamed' }}</span>
            <div class="task-item-dates">
              <span class="date-badge">{{ formatDate(task.startDate) || '?' }}</span>
              <span class="date-arrow">→</span>
              <span class="date-badge">{{ formatDate(task.endDate) || '?' }}</span>
            </div>
            <div class="task-item-relationship" v-if="isTaskSelected(task.id, relationshipTab)">
              <div class="relationship-badge" :class="getRelationshipTypeClass(task.id, relationshipTab)">
                <span class="relationship-code">{{ getRelationshipTypeCode(task.id, relationshipTab) }}</span>
                <span class="relationship-name">{{ getRelationshipTypeName(task.id, relationshipTab) }}</span>
                <button 
                  class="edit-relationship-btn"
                  @click.stop="editRelationship(task.id, relationshipTab)"
                  title="Change relationship type"
                >
                  <span class="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
            <span class="task-item-type" :class="{ 'milestone': task.isMilestone }">
              {{ task.isMilestone ? 'M' : 'T' }}
            </span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">Cancel</button>
        <button class="btn-primary" @click="handleSave">Save Changes</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue';

export default {
  name: 'RelationshipSelectorModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    currentTask: {
      type: Object,
      default: null
    },
    availableTasks: {
      type: Array,
      default: () => []
    },
    initialDependencies: {
      type: Array,
      default: () => []
    },
    initialSuccessors: {
      type: Array,
      default: () => []
    },
    excludeWeekends: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'save', 'update-relationships'],
  setup(props, { emit }) {
    const relationshipTab = ref('dependencies')
    const tempRelationships = ref({ 
      dependencies: [], 
      successors: [] 
    })
    
    // Type selection state
    const selectedTaskForType = ref(null)
    const pendingTaskId = ref(null)
    const pendingTab = ref(null)
    const pendingType = ref(null)
    
    const previewStartDate = ref(null)
    const previewEndDate = ref(null)
    
    const relationshipTypes = [
      {
        value: 'fs',
        icon: '→',
        name: 'Finish-to-Start',
        description: 'Task starts after predecessor finishes',
        code: 'FS'
      },
      {
        value: 'ss',
        icon: '⇢',
        name: 'Start-to-Start',
        description: 'Task starts when predecessor starts',
        code: 'SS'
      },
      {
        value: 'ff',
        icon: '⇥',
        name: 'Finish-to-Finish',
        description: 'Task finishes when predecessor finishes',
        code: 'FF'
      },
      {
        value: 'sf',
        icon: '↛',
        name: 'Start-to-Finish',
        description: 'Task finishes when predecessor starts',
        code: 'SF'
      }
    ]
    
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      return `${d.getDate().toString().padStart(2, '0')}-${months[d.getMonth()]}-${d.getFullYear()}`
    }
    
    const isWeekend = (date) => {
      if (!props.excludeWeekends) return false
      const d = new Date(date)
      const day = d.getDay()
      return day === 0 || day === 6
    }
    
    const addWorkingDays = (date, days) => {
      if (!date) return null
      let current = new Date(date)
      let remainingDays = days
      
      while (remainingDays > 0) {
        current.setDate(current.getDate() + 1)
        if (!isWeekend(current)) {
          remainingDays--
        }
      }
      
      const year = current.getFullYear()
      const month = (current.getMonth() + 1).toString().padStart(2, '0')
      const day = current.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const calculateDependentDates = (sourceTask, dependencyType) => {
      if (!sourceTask.startDate && !sourceTask.endDate) return { startDate: null, endDate: null }
      
      let newStartDate = null
      let newEndDate = null
      
      switch(dependencyType) {
        case 'fs':
          if (sourceTask.endDate) {
            newStartDate = addWorkingDays(sourceTask.endDate, 1)
          }
          break
        case 'ss':
          if (sourceTask.startDate) {
            newStartDate = sourceTask.startDate
          }
          break
        case 'ff':
          if (sourceTask.endDate) {
            newEndDate = sourceTask.endDate
          }
          break
        case 'sf':
          if (sourceTask.startDate) {
            newEndDate = sourceTask.startDate
          }
          break
      }
      
      return { startDate: newStartDate, endDate: newEndDate }
    }
    
    const calculatePreviewDates = () => {
      if (!props.currentTask) return
      
      const allDependencies = [...tempRelationships.value.dependencies]
      if (allDependencies.length === 0) {
        previewStartDate.value = null
        previewEndDate.value = null
        return
      }
      
      let finalStartDate = null
      let finalEndDate = null
      
      allDependencies.forEach(dep => {
        const sourceTask = props.availableTasks.find(t => t.id === dep.taskId)
        if (!sourceTask) return
        
        const { startDate, endDate } = calculateDependentDates(sourceTask, dep.type)
        
        if (startDate) {
          if (!finalStartDate || new Date(startDate) > new Date(finalStartDate)) {
            finalStartDate = startDate
          }
        }
        
        if (endDate) {
          if (!finalEndDate || new Date(endDate) > new Date(finalEndDate)) {
            finalEndDate = endDate
          }
        }
      })
      
      const durationDays = props.currentTask.durationDays || 0
      
      if (finalStartDate && !finalEndDate && durationDays > 0) {
        finalEndDate = addWorkingDays(finalStartDate, durationDays)
      } else if (finalEndDate && !finalStartDate && durationDays > 0) {
        let current = new Date(finalEndDate)
        let remainingDays = durationDays
        while (remainingDays > 0) {
          current.setDate(current.getDate() - 1)
          if (!isWeekend(current)) {
            remainingDays--
          }
        }
        const year = current.getFullYear()
        const month = (current.getMonth() + 1).toString().padStart(2, '0')
        const day = current.getDate().toString().padStart(2, '0')
        finalStartDate = `${year}-${month}-${day}`
      }
      
      previewStartDate.value = finalStartDate ? formatDate(finalStartDate) : null
      previewEndDate.value = finalEndDate ? formatDate(finalEndDate) : null
    }
    
    const getCurrentTaskId = () => {
      return props.currentTask?.fullId || props.currentTask?.shortId || ''
    }
    
    const getTaskFullId = (task) => {
      return task.fullId || task.shortId || '??'
    }
    
    const getRelationshipType = (taskId, tab) => {
      const list = tab === 'dependencies' ? 'dependencies' : 'successors'
      const relationship = tempRelationships.value[list].find(r => r.taskId === taskId)
      return relationship?.type || 'fs'
    }
    
    const getRelationshipTypeCode = (taskId, tab) => {
      const type = getRelationshipType(taskId, tab)
      const found = relationshipTypes.find(t => t.value === type)
      return found ? found.code : 'FS'
    }
    
    const getRelationshipTypeName = (taskId, tab) => {
      const type = getRelationshipType(taskId, tab)
      const found = relationshipTypes.find(t => t.value === type)
      return found ? found.name : 'Finish-to-Start'
    }
    
    const getRelationshipTypeClass = (taskId, tab) => {
      const type = getRelationshipType(taskId, tab)
      return `relationship-${type}`
    }
    
    const getSelectedTaskName = () => {
      const task = props.availableTasks.find(t => t.id === selectedTaskForType.value?.taskId)
      return task ? (task.name || 'Unnamed Task') : 'Task'
    }
    
    // Helper function to emit real-time updates
    const emitRealTimeUpdate = () => {
      const relationships = {
        dependencies: tempRelationships.value.dependencies,
        successors: tempRelationships.value.successors
      }
      emit('update-relationships', relationships)
    }
    
    const handleTaskClick = (taskId, tab) => {
      if (taskId === props.currentTask?.id) return
      
      const isSelected = isTaskSelected(taskId, tab)
      
      if (isSelected) {
        // If already selected, remove the relationship
        removeRelationship(taskId, tab)
      } else {
        // If not selected, show type selection panel
        selectedTaskForType.value = { taskId, tab }
        pendingTaskId.value = taskId
        pendingTab.value = tab
        pendingType.value = null
      }
    }
    
    const selectType = (type) => {
      pendingType.value = type
    }
    
    const applyTypeSelection = () => {
      if (!pendingType.value || !selectedTaskForType.value) return
      
      const { taskId, tab } = selectedTaskForType.value
      const list = tab === 'dependencies' ? 'dependencies' : 'successors'
      const direction = tab === 'dependencies' ? 'incoming' : 'outgoing'
      
      tempRelationships.value[list].push({
        taskId,
        type: pendingType.value,
        direction
      })
      
      cancelTypeSelection()
      calculatePreviewDates()
      
      // Emit real-time update immediately
      emitRealTimeUpdate()
    }
    
    const cancelTypeSelection = () => {
      selectedTaskForType.value = null
      pendingTaskId.value = null
      pendingTab.value = null
      pendingType.value = null
    }
    
    const editRelationship = (taskId, tab) => {
      selectedTaskForType.value = { taskId, tab }
      pendingTaskId.value = taskId
      pendingTab.value = tab
      
      const currentType = getRelationshipType(taskId, tab)
      pendingType.value = currentType
    }
    
    const removeRelationship = (taskId, tab) => {
      const list = tab === 'dependencies' ? 'dependencies' : 'successors'
      const index = tempRelationships.value[list].findIndex(r => r.taskId === taskId)
      if (index !== -1) {
        tempRelationships.value[list].splice(index, 1)
        calculatePreviewDates()
        
        // Emit real-time update immediately
        emitRealTimeUpdate()
      }
    }
    
    const switchTab = (tab) => {
      relationshipTab.value = tab
      cancelTypeSelection()
    }
    
    const initializeRelationships = () => {
      tempRelationships.value = {
        dependencies: [...(props.initialDependencies || [])].map(dep => ({...dep})),
        successors: [...(props.initialSuccessors || [])].map(succ => ({...succ}))
      }
      calculatePreviewDates()
      cancelTypeSelection()
    }
    
    watch(() => props.show, (newVal) => {
      if (newVal) {
        initializeRelationships()
        relationshipTab.value = 'dependencies'
      }
    })
    
    watch(tempRelationships, () => {
      calculatePreviewDates()
    }, { deep: true })
    
    const isTaskSelected = (taskId, tab) => {
      if (tab === 'dependencies') {
        return tempRelationships.value.dependencies.some(dep => dep.taskId === taskId)
      } else {
        return tempRelationships.value.successors.some(succ => succ.taskId === taskId)
      }
    }
    
    const handleClose = () => {
      cancelTypeSelection()
      emit('close')
    }
    
    const handleSave = () => {
      // Emit both save and update-relationships events
      const relationships = {
        dependencies: tempRelationships.value.dependencies,
        successors: tempRelationships.value.successors
      }
      emit('save', relationships)
      emit('update-relationships', relationships)
    }
    
    return {
      relationshipTab,
      tempRelationships,
      previewStartDate,
      previewEndDate,
      relationshipTypes,
      selectedTaskForType,
      pendingTaskId,
      pendingTab,
      pendingType,
      formatDate,
      getCurrentTaskId,
      getTaskFullId,
      getRelationshipType,
      getRelationshipTypeCode,
      getRelationshipTypeName,
      getRelationshipTypeClass,
      getSelectedTaskName,
      handleTaskClick,
      selectType,
      applyTypeSelection,
      cancelTypeSelection,
      editRelationship,
      removeRelationship,
      switchTab,
      isTaskSelected,
      handleClose,
      handleSave
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
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  background: white;
  border-radius: 24px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}

.dark .modal-content {
  background: #1a1f2e;
  border: 1px solid #334155;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
}

.dark .modal-header {
  background: linear-gradient(135deg, #1e293b 0%, #1a1f2e 100%);
  border-bottom-color: #334155;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dark .modal-header h3 {
  color: #f1f5f9;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  color: #64748b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #0f172a;
  transform: rotate(90deg);
}

.dark .close-btn:hover {
  background: #2d3448;
  color: #f1f5f9;
}

.close-btn .material-symbols-outlined {
  font-size: 20px;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-context {
  margin: 0 0 20px 0;
  font-size: 14px;
  color: #475569;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.dark .modal-context {
  background: #242b3f;
  color: #94a3b8;
  border-color: #334155;
}

.task-id-context {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #4361ee;
  border-radius: 20px;
  font-family: monospace;
  font-size: 11px;
  color: white;
}

.current-task-info {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 1px solid #bae6fd;
  border-radius: 12px;
  padding: 14px 16px;
  margin-bottom: 24px;
}

.dark .current-task-info {
  background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
  border-color: #0284c7;
}

.info-row {
  display: flex;
  gap: 12px;
  font-size: 13px;
  align-items: baseline;
}

.info-row + .info-row {
  margin-top: 10px;
}

.info-label {
  font-weight: 600;
  color: #0f172a;
  min-width: 120px;
  font-size: 13px;
}

.dark .info-label {
  color: #f1f5f9;
}

.info-label.preview {
  color: #059669;
}

.info-value {
  color: #334155;
  font-family: monospace;
  font-weight: 500;
}

.dark .info-value {
  color: #cbd5e1;
}

.info-value.preview {
  color: #059669;
  font-weight: 600;
}

.duration-chip {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  background: #e2e8f0;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  color: #475569;
}

.dark .duration-chip {
  background: #334155;
  color: #94a3b8;
}

.tab-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 0;
  position: relative;
}

.dark .tab-buttons {
  border-bottom-color: #334155;
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border-radius: 12px 12px 0 0;
  transition: all 0.2s;
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tab-icon {
  font-size: 18px;
}

.tab-btn:hover {
  color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.tab-btn.active {
  color: #4361ee;
  background: rgba(67, 97, 238, 0.08);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 2px;
  background: #4361ee;
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  background: #4361ee;
  color: white;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.type-selection-panel {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
  animation: slideDown 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dark .type-selection-panel {
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  border-color: #f59e0b;
}

.type-selection-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(245, 158, 11, 0.3);
}

.type-selection-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-selection-title .material-symbols-outlined {
  color: #f59e0b;
  font-size: 24px;
}

.type-selection-title span {
  font-size: 15px;
  font-weight: 500;
  color: #78350f;
}

.dark .type-selection-title span {
  color: #fed7aa;
}

.type-selection-title strong {
  color: #f59e0b;
  font-weight: 700;
}

.close-type-panel {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(245, 158, 11, 0.2);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-type-panel:hover {
  background: rgba(245, 158, 11, 0.4);
  transform: rotate(90deg);
}

.close-type-panel .material-symbols-outlined {
  font-size: 20px;
  color: #78350f;
}

.type-selection-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.type-selection-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: white;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .type-selection-card {
  background: #1a1f2e;
}

.type-selection-card:hover {
  transform: translateX(4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.9);
}

.dark .type-selection-card:hover {
  background: #242b3f;
}

.type-selection-card.selected {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.type-card-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: bold;
  border-radius: 12px;
}

.type-card-icon.fs {
  color: #4361ee;
  background: rgba(67, 97, 238, 0.1);
}

.type-card-icon.ss {
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.type-card-icon.ff {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.type-card-icon.sf {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.type-card-info {
  flex: 1;
}

.type-card-code {
  font-weight: 800;
  font-size: 14px;
  font-family: monospace;
  color: #0f172a;
}

.dark .type-card-code {
  color: #f1f5f9;
}

.type-card-name {
  font-size: 12px;
  font-weight: 600;
  color: #4361ee;
  margin-top: 2px;
}

.type-card-desc {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.dark .type-card-desc {
  color: #94a3b8;
}

.type-selection-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid rgba(245, 158, 11, 0.3);
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 400px;
  overflow-y: auto;
  padding: 2px;
}

.no-tasks {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border-radius: 16px;
}

.dark .no-tasks {
  background: #242b3f;
}

.no-tasks .material-symbols-outlined {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
}

.dark .task-item {
  background: #242b3f;
  border-color: #334155;
}

.task-item:hover:not(.disabled) {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.03);
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.task-item.selected {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.08);
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.1);
}

.task-item.pending-selection {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.08);
  animation: pulse 1s ease;
}

.task-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #f8fafc;
}

.dark .task-item.disabled {
  background: #1e293b;
}

.task-item-selector {
  flex-shrink: 0;
}

.checkbox-icon {
  font-size: 22px;
  color: #94a3b8;
  transition: all 0.2s;
}

.task-item.selected .checkbox-icon {
  color: #4361ee;
}

.task-item-id {
  min-width: 65px;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #4361ee;
  background: rgba(67, 97, 238, 0.1);
  padding: 4px 10px;
  border-radius: 20px;
  text-align: center;
  letter-spacing: 0.5px;
}

.dark .task-item-id {
  background: rgba(67, 97, 238, 0.2);
  color: #a5b4fc;
}

.task-item-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #0f172a;
  font-weight: 500;
  font-size: 14px;
}

.dark .task-item-name {
  color: #f1f5f9;
}

.task-item-dates {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-family: monospace;
  background: #f8fafc;
  padding: 5px 10px;
  border-radius: 20px;
  white-space: nowrap;
}

.dark .task-item-dates {
  background: #1e293b;
}

.date-badge {
  color: #4361ee;
  font-weight: 600;
}

.date-arrow {
  color: #94a3b8;
  font-size: 10px;
}

.task-item-relationship {
  margin: 0 4px;
}

.relationship-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
  transition: all 0.2s;
  position: relative;
}

.relationship-badge.relationship-fs {
  background: rgba(67, 97, 238, 0.15);
  color: #4361ee;
  border: 1px solid rgba(67, 97, 238, 0.3);
}

.relationship-badge.relationship-ss {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.relationship-badge.relationship-ff {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.relationship-badge.relationship-sf {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.relationship-code {
  font-weight: 800;
  font-size: 12px;
}

.relationship-name {
  font-size: 10px;
  font-weight: 500;
}

.edit-relationship-btn {
  margin-left: 4px;
  padding: 2px 6px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  opacity: 0;
}

.relationship-badge:hover .edit-relationship-btn {
  opacity: 1;
}

.edit-relationship-btn:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.05);
}

.edit-relationship-btn .material-symbols-outlined {
  font-size: 14px;
}

.task-item-type {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e2e8f0;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 700;
  color: #475569;
  flex-shrink: 0;
}

.dark .task-item-type {
  background: #2d3448;
  color: #94a3b8;
}

.task-item-type.milestone {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  border-radius: 0 0 24px 24px;
}

.dark .modal-footer {
  background: #1e293b;
  border-top-color: #334155;
}

.btn-primary,
.btn-secondary {
  padding: 10px 24px;
  border-radius: 40px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #4361ee, #3a56d4);
  color: white;
  box-shadow: 0 2px 8px rgba(67, 97, 238, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #3a56d4, #2e4ac8);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.4);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #0f172a;
}

.dark .btn-secondary {
  border-color: #334155;
  color: #f1f5f9;
}

.btn-secondary:hover {
  border-color: #4361ee;
  color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.btn-primary.small,
.btn-secondary.small {
  padding: 6px 16px;
  font-size: 12px;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  display: block;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    border-color: #f59e0b;
  }
  50% {
    border-color: #fbbf24;
  }
}

.task-list::-webkit-scrollbar {
  width: 6px;
}

.task-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.task-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.task-list::-webkit-scrollbar-thumb:hover {
  background: #4361ee;
}

.dark .task-list::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark .task-list::-webkit-scrollbar-thumb {
  background: #475569;
}

@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-width: 95%;
    border-radius: 20px;
  }
  
  .task-item {
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .task-item-dates {
    order: 2;
    width: auto;
    margin-left: 40px;
  }
  
  .task-item-relationship {
    order: 3;
    width: 100%;
    margin-left: 40px;
  }
  
  .relationship-badge {
    width: 100%;
    justify-content: space-between;
  }
  
  .type-selection-grid {
    grid-template-columns: 1fr;
  }
}
</style>