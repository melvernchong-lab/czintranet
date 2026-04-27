<template>
  <div class="timeline-planner">
    <div class="planner-header">
      <div class="view-toggle-container">
        <div class="view-toggle">
          <button 
            class="toggle-btn" 
            :class="{ active: currentView === 'definition' }" 
            @click="switchToView('definition')"
          >
            <span class="material-symbols-outlined">edit_note</span>
            Define Timeline
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: currentView === 'gantt' }" 
            @click="switchToView('gantt')" 
            :disabled="!hasData"
          >
            <span class="material-symbols-outlined">timeline</span>
            View Gantt
          </button>
        </div>

        <div class="action-buttons">
          <button class="btn-import" @click="openImportModal">
            <span class="material-symbols-outlined">upload_file</span>
            Import
          </button>
          <button class="btn-export" @click="openExportModal">
            <span class="material-symbols-outlined">download</span>
            Export
          </button>
        </div>
        
        <div v-if="hasData" class="data-badge">
          <span class="material-symbols-outlined">check_circle</span>
          <span>{{ totalSwimlanes }} swimlane{{ totalSwimlanes !== 1 ? 's' : '' }}</span>
        </div>
        <div v-else class="data-badge empty">
          <span class="material-symbols-outlined">info</span>
          <span>No data yet</span>
        </div>
      </div>
    </div>

    <div class="planner-content">
      <div v-if="currentView === 'definition'" class="definition-view">
        <TimelineDefinition
          ref="timelineDefRef"
          :project-milestones="localMilestones"
          :initial-data="timelineData"
          @update:data="handleDataUpdate"
        />
      </div>

      <div v-else-if="currentView === 'gantt'" class="gantt-view">
        <GanttChart
          v-if="hasData"
          :project-start-date="projectStartDate"
          :project-milestones="processedMilestones"
          :team-members="teamMembers"
          :timeline-data="timelineData"
        />
        <div v-else class="no-data-message">
          <span class="material-symbols-outlined">info</span>
          <h3>No Timeline Data</h3>
          <p>Please create swimlanes and tasks in the Define Timeline view first.</p>
          <button class="btn-primary" @click="switchToView('definition')">
            <span class="material-symbols-outlined">edit_note</span>
            Go to Define Timeline
          </button>
        </div>
      </div>
    </div>

    <!-- Import Modal -->
    <ImportModal
      :show="showImportModal"
      @close="showImportModal = false"
      @import-complete="handleImportComplete"
    />

    <!-- Export Modal -->
    <ExportModal
      :show="showExportModal"
      :timeline-data="timelineDataForExport"
      @close="showExportModal = false"
      @export="handleExport"
    />

    <!-- Timeline Question Modal -->
    <TimelineQuestionModal
      v-if="showTimelineQuestionModal"
      :visible="showTimelineQuestionModal"
      :project-id="tempProjectId"
      :project-name="projectName"
      @close="closeTimelineQuestionModal"
      @create-now="handleCreateTimelineNow"
      @create-later="handleCreateTimelineLater"
      @update:dont-show-again="handleDontShowAgain"
    />
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, nextTick, defineAsyncComponent } from 'vue'
import TimelineDefinition from './TimelineData.vue'
import GanttChart from '../../../../../components/GanttChart.vue'
import ImportModal from './ImportProjectTimelineModal.vue'
import ExportModal from './ExportProjectTimelineModal.vue'

// Dynamic import to avoid circular dependency
const TimelineQuestionModal = defineAsyncComponent(() => import('./TimelineQuestionModal.vue'))

export default {
  name: 'ProjectTimelinePlanner',
  components: { 
    TimelineDefinition, 
    GanttChart,
    ImportModal,
    ExportModal,
    TimelineQuestionModal
  },
  props: {
    projectStartDate: {
      type: String,
      required: true
    },
    milestones: {
      type: Array,
      default: () => []
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    showTimelinePrompt: {
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
  emits: ['update:timeline', 'generate-timesheet', 'update:milestones', 'import-data', 'export-data', 'save-project', 'close-prompt', 'create-project'],
  setup(props, { emit }) {
    const currentView = ref('definition')
    const timelineData = ref({ groups: [], summary: {} })
    const processedMilestones = ref([])
    const timelineDefRef = ref(null)
    const isUpdating = ref(false)
    const updateTimeout = ref(null)
    
    // Modal states
    const showImportModal = ref(false)
    const showExportModal = ref(false)
    const showTimelineQuestionModal = ref(false)
    const tempProjectId = ref(props.projectId || Date.now() + Math.random())
    const pendingMilestonesData = ref(null)
    const promptShown = ref(false)
    
    // Local copy of milestones to track changes
    const localMilestones = ref([...props.milestones])

    // Watch for showTimelinePrompt prop - triggers when clicking Next from milestones
    watch(() => props.showTimelinePrompt, (shouldShow) => {
      if (shouldShow && !showTimelineQuestionModal.value && !promptShown.value) {
        promptShown.value = true
        // Save current milestones data before showing prompt
        pendingMilestonesData.value = [...localMilestones.value]
        // Show the modal after a short delay to ensure component is ready
        setTimeout(() => {
          showTimelineQuestionModal.value = true
          emit('close-prompt')
        }, 100)
      }
    })

    // Timeline data for export
    const timelineDataForExport = computed(() => ({
      groups: timelineData.value.groups,
      summary: {
        totalTasks: timelineData.value.summary?.totalTasks || 0,
        totalDuration: timelineData.value.summary?.totalDuration || 0,
        overallProgress: timelineData.value.summary?.overallProgress || 0,
        milestoneCount: timelineData.value.summary?.milestoneCount || 0
      }
    }))

    // Watch for external milestone changes
    watch(() => props.milestones, (newMilestones) => {
      console.log('ProjectTimelinePlanner received milestone update:', newMilestones)
      localMilestones.value = [...newMilestones]
    }, { deep: true, immediate: true })

    // Check if we have any data to display
    const hasData = computed(() => {
      if (timelineData.value?.groups?.length > 0) {
        const hasAnyTasks = timelineData.value.groups.some(group => 
          group.tasks && group.tasks.length > 0
        )
        return hasAnyTasks
      }
      return false
    })

    // Total swimlanes count
    const totalSwimlanes = computed(() => {
      return timelineData.value?.groups?.length || 0
    })

    // Handle data updates from TimelineDefinition
    const handleDataUpdate = (data) => {
      if (isUpdating.value) {
        console.log('Skipping recursive update')
        return
      }
      
      console.log('Timeline data updated:', data)
      isUpdating.value = true
      
      timelineData.value = data

      if (props.projectId) {
        localStorage.setItem(`project_timeline_${props.projectId}`, JSON.stringify(data))
        localStorage.setItem(`timeline_groups_${props.projectId}`, JSON.stringify(data.groups || []))
      }
      
      if (data.groups) {
        processedMilestones.value = data.groups.flatMap(group => 
          group.tasks?.map(task => ({
            id: task.id,
            name: task.name,
            startDate: task.startDate,
            endDate: task.endDate,
            progress: task.progress || 0,
            isMilestone: task.isMilestone || false,
            assignments: task.assignments || []
          })) || []
        )
      }
      
      emit('update:timeline', data)
      
      if (updateTimeout.value) clearTimeout(updateTimeout.value)
      updateTimeout.value = setTimeout(() => {
        isUpdating.value = false
        updateTimeout.value = null
      }, 100)
    }

    const saveTimelineData = () => {
      return new Promise((resolve) => {
        if (timelineDefRef.value && !isUpdating.value) {
          let latestData = null
          
          if (typeof timelineDefRef.value.getData === 'function') {
            latestData = timelineDefRef.value.getData()
          } else if (timelineDefRef.value.timelineGroups) {
            latestData = {
              groups: timelineDefRef.value.timelineGroups || [],
              summary: {
                totalTasks: timelineDefRef.value.totalTasks || 0,
                totalDuration: timelineDefRef.value.totalDuration || 0,
                overallProgress: timelineDefRef.value.overallProgress || 0,
                milestoneCount: timelineDefRef.value.milestoneCount || 0
              }
            }
          }
          
          if (latestData && latestData.groups) {
            console.log('Saving timeline data:', latestData)
            timelineData.value = latestData
            
            if (latestData.groups.length > 0) {
              processedMilestones.value = latestData.groups.flatMap(group => 
                group.tasks?.map(task => ({
                  id: task.id,
                  name: task.name,
                  startDate: task.startDate,
                  endDate: task.endDate,
                  progress: task.progress || 0,
                  isMilestone: task.isMilestone || false,
                  assignments: task.assignments || []
                })) || []
              )
            }
          }
        }
        resolve()
      })
    }

    const switchToView = async (view) => {
      console.log('Switching to view:', view)
      
      if (view === 'gantt') {
        await saveTimelineData()
        
        if (hasData.value) {
          currentView.value = view
        } else {
          console.log('No data available for Gantt view')
        }
      } else if (view === 'definition') {
        currentView.value = view
      }
    }

    // Timeline Question Modal Handlers
    const closeTimelineQuestionModal = () => {
      showTimelineQuestionModal.value = false
      promptShown.value = false
      pendingMilestonesData.value = null
    }

    const handleCreateTimelineNow = () => {
      console.log('User chose to create timeline now')
      showTimelineQuestionModal.value = false
      promptShown.value = false
      // Stay on definition view to create timeline
      currentView.value = 'definition'
      pendingMilestonesData.value = null
    }

    const handleCreateTimelineLater = async () => {
      console.log('User chose to create timeline later - creating project')
      showTimelineQuestionModal.value = false
      promptShown.value = false
      
      // Emit that project should be created with the milestones
      emit('create-project', {
        projectId: tempProjectId.value,
        projectName: props.projectName,
        milestones: pendingMilestonesData.value || localMilestones.value,
        timelineData: timelineData.value,
        action: 'later'
      })
      
      pendingMilestonesData.value = null
    }

    const handleDontShowAgain = ({ projectId, value, choice }) => {
      console.log(`User chose not to show again. Choice: ${choice}`)
      localStorage.setItem(`timeline_creation_preference_${projectId}`, choice)
    }

    // IMPORT MODAL HANDLERS
    const openImportModal = () => {
      showImportModal.value = true
    }

    const handleImportComplete = (importData) => {
      console.log('=== IMPORT COMPLETE HANDLER CALLED ===')
      console.log('Import data received:', importData)
      
      const { groups, summary } = importData.data
      
      if (!groups || groups.length === 0) {
        console.error('No groups found in imported data')
        alert('No valid data found in the imported file.')
        return
      }
      
      console.log(`Importing ${groups.length} groups with ${summary.totalTasks} tasks`)
      
      if (timelineDefRef.value && typeof timelineDefRef.value.updateDataDirectly === 'function') {
        console.log('Using direct update method on TimelineDefinition')
        const success = timelineDefRef.value.updateDataDirectly({ groups, summary })
        if (success) {
          console.log('Direct update successful')
          alert(`Successfully imported ${importData.fileName}\n\n${summary.totalTasks} tasks imported across ${groups.length} swimlanes`)
          return
        } else {
          console.warn('Direct update failed, using fallback')
        }
      }
      
      console.log('Updating timelineData directly')
      timelineData.value = { groups, summary }
      
      if (groups) {
        processedMilestones.value = groups.flatMap(group => 
          group.tasks?.map(task => ({
            id: task.id,
            name: task.name,
            startDate: task.startDate,
            endDate: task.endDate,
            progress: task.progress || 0,
            isMilestone: task.isMilestone || false,
            assignments: task.assignments || []
          })) || []
        )
      }
      
      emit('update:timeline', { groups, summary })
      
      alert(`Successfully imported ${importData.fileName}\n\n${summary.totalTasks} tasks imported across ${groups.length} swimlanes`)
      
      nextTick(() => {
        console.log('Forcing view refresh...')
        const currentViewValue = currentView.value
        currentView.value = 'gantt'
        setTimeout(() => {
          currentView.value = currentViewValue
        }, 100)
      })
    }

    // Export modal handlers
    const openExportModal = () => {
      showExportModal.value = true
    }

    const handleExport = async (exportData) => {
      console.log('Exporting data:', exportData)
      emit('export-data', exportData)
      
      switch (exportData.format) {
        case 'pdf':
          await exportToPDF(exportData)
          break
        case 'excel':
          exportToExcel(exportData)
          break
        case 'csv':
          exportToCSV(exportData)
          break
        case 'json':
          exportToJSON(exportData)
          break
        default:
          console.warn('Unknown export format:', exportData.format)
      }
    }

    const exportToPDF = async (exportData) => {
      console.log('Exporting to PDF with options:', exportData.pdfOptions)
      alert(`Exporting to PDF with ${exportData.totalTasks} tasks...\n\nThis would generate a professional PDF with:\n- ${exportData.pdfOptions.includeGantt ? '✓ Gantt Chart\n' : '✗ Gantt Chart\n'}- ${exportData.pdfOptions.includeTimeline ? '✓ Timeline Table\n' : '✗ Timeline Table\n'}- ${exportData.pdfOptions.includeSummary ? '✓ Summary Statistics' : '✗ Summary Statistics'}`)
    }

    const exportToExcel = (exportData) => {
      console.log('Exporting to Excel with fields:', exportData.includeFields)
      const exportRows = []
      const processGroup = (group) => {
        group.tasks?.forEach(task => {
          const row = {}
          if (exportData.includeFields.id) row['Task ID'] = task.fullId || task.shortId
          if (exportData.includeFields.name) row['Task Name'] = task.name
          if (exportData.includeFields.owner) row['Owner'] = task.owner
          if (exportData.includeFields.type) row['Type'] = task.isMilestone ? 'Milestone' : 'Task'
          if (exportData.includeFields.startDate) row['Start Date'] = task.startDate
          if (exportData.includeFields.endDate) row['End Date'] = task.endDate
          if (exportData.includeFields.duration) row['Duration (days)'] = task.durationDays
          if (exportData.includeFields.progress) row['Progress (%)'] = task.progress
          if (exportData.includeFields.relationships) {
            row['Relationships'] = task.relationships?.map(r => `${r.taskId}:${r.type}`).join(', ') || ''
          }
          exportRows.push(row)
        })
        if (group.subGroups) {
          group.subGroups.forEach(processGroup)
        }
      }
      exportData.timelineData.groups?.forEach(processGroup)
      alert(`Exporting ${exportRows.length} tasks to Excel...\n\nThis would generate an Excel file with the selected fields.`)
    }

    const exportToCSV = (exportData) => {
      const headers = []
      if (exportData.includeFields.id) headers.push('Task ID')
      if (exportData.includeFields.name) headers.push('Task Name')
      if (exportData.includeFields.owner) headers.push('Owner')
      if (exportData.includeFields.type) headers.push('Type')
      if (exportData.includeFields.startDate) headers.push('Start Date')
      if (exportData.includeFields.endDate) headers.push('End Date')
      if (exportData.includeFields.duration) headers.push('Duration (days)')
      if (exportData.includeFields.progress) headers.push('Progress (%)')
      if (exportData.includeFields.relationships) headers.push('Relationships')
      
      const rows = [headers]
      const processGroup = (group) => {
        group.tasks?.forEach(task => {
          const row = []
          if (exportData.includeFields.id) row.push(task.fullId || task.shortId || '')
          if (exportData.includeFields.name) row.push(task.name || '')
          if (exportData.includeFields.owner) row.push(task.owner || '')
          if (exportData.includeFields.type) row.push(task.isMilestone ? 'Milestone' : 'Task')
          if (exportData.includeFields.startDate) row.push(task.startDate || '')
          if (exportData.includeFields.endDate) row.push(task.endDate || '')
          if (exportData.includeFields.duration) row.push(task.durationDays || 0)
          if (exportData.includeFields.progress) row.push(task.progress || 0)
          if (exportData.includeFields.relationships) {
            row.push(task.relationships?.map(r => `${r.taskId}:${r.type}`).join(';') || '')
          }
          rows.push(row)
        })
        if (group.subGroups) {
          group.subGroups.forEach(processGroup)
        }
      }
      exportData.timelineData.groups?.forEach(processGroup)
      
      const csvContent = rows.map(row => 
        row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `timeline_export_${new Date().toISOString().split('T')[0]}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    const exportToJSON = (exportData) => {
      const exportJson = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: exportData.timelineData
      }
      
      const jsonStr = JSON.stringify(exportJson, null, 2)
      const blob = new Blob([jsonStr], { type: 'application/json' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.href = url
      link.setAttribute('download', `timeline_export_${new Date().toISOString().split('T')[0]}.json`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    watch(timelineData, (newData) => {
      console.log('timelineData changed:', newData.groups?.length, 'groups, hasData:', hasData.value)
    }, { deep: true })

    onMounted(() => {
      console.log('ProjectTimelinePlanner mounted')
      const savedMilestones = props.milestones?.filter(m => m.isSaved === true) || []
      if (savedMilestones.length > 0 && timelineData.value.groups?.length === 0) {
        console.log('Saved milestones available, waiting for TimelineDefinition to initialize')
      }
    })

    return {
      currentView,
      hasData,
      totalSwimlanes,
      timelineData,
      processedMilestones,
      localMilestones,
      handleDataUpdate,
      switchToView,
      timelineDefRef,
      showImportModal,
      showExportModal,
      showTimelineQuestionModal,
      timelineDataForExport,
      tempProjectId,
      projectName: props.projectName,
      openImportModal,
      openExportModal,
      handleImportComplete,
      handleExport,
      closeTimelineQuestionModal,
      handleCreateTimelineNow,
      handleCreateTimelineLater,
      handleDontShowAgain
    }
  }
}
</script>

<style scoped>
/* Your existing styles here - same as before */
@import "../../../../../styles/shared/globals.css";

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

/* Rest of your existing CSS styles remain exactly the same */
.timeline-planner {
  width: 100%;
  height: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid var(--border-light);
  position: relative;
}

.dark .timeline-planner {
  background: linear-gradient(135deg, var(--card-dark) 0%, #1a1f2e 100%);
  border-color: var(--border-dark);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

/* Header Section */
.planner-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 2px solid var(--border-light);
  position: sticky;
  top: 0;
  z-index: 50;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.dark .planner-header {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom-color: var(--border-dark);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.view-toggle-container {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.view-toggle {
  display: flex;
  gap: 6px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  padding: 4px;
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.5);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.dark .view-toggle {
  background: rgba(15, 23, 42, 0.6);
  border-color: rgba(51, 65, 85, 0.5);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-light);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  white-space: nowrap;
}

.dark .toggle-btn {
  color: var(--text-dark);
}

.toggle-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: var(--primary);
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
  opacity: 0.1;
  z-index: 0;
}

.toggle-btn:hover::before {
  width: 150px;
  height: 150px;
}

.toggle-btn span {
  position: relative;
  z-index: 1;
}

.toggle-btn .material-symbols-outlined {
  font-size: 20px;
  transition: transform 0.3s;
}

.toggle-btn:hover .material-symbols-outlined {
  transform: scale(1.1);
}

.toggle-btn:hover {
  color: var(--primary);
  background: rgba(255, 255, 255, 0.8);
}

.dark .toggle-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.toggle-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.dark .toggle-btn.active {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.toggle-btn.active .material-symbols-outlined {
  color: var(--primary);
}

.dark .toggle-btn.active .material-symbols-outlined {
  color: white;
}

.toggle-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 12px;
}

.btn-import,
.btn-export {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid;
  background: white;
}

.dark .btn-import,
.dark .btn-export {
  background: #1a1f2e;
}

.btn-import {
  border-color: #10b981;
  color: #10b981;
}

.dark .btn-import {
  border-color: #34d399;
  color: #34d399;
}

.btn-import:hover {
  background: #10b981;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-export {
  border-color: #4361ee;
  color: #4361ee;
}

.dark .btn-export {
  border-color: #a5b4fc;
  color: #a5b4fc;
}

.btn-export:hover {
  background: #4361ee;
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
}

.btn-import .material-symbols-outlined,
.btn-export .material-symbols-outlined {
  font-size: 18px;
}

.data-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%);
  border-radius: 40px;
  border: 1px solid #10b981;
  color: #10b981;
  font-size: 13px;
  font-weight: 600;
  animation: slideInRight 0.3s ease;
  white-space: nowrap;
}

.data-badge.empty {
  background: linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.15) 100%);
  border-color: #64748b;
  color: #64748b;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.data-badge .material-symbols-outlined {
  font-size: 18px;
}

/* Content Area */
.planner-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  position: relative;
  background: var(--bg-light);
  display: flex;
  flex-direction: column;
}

.dark .planner-content {
  background: var(--bg-dark);
}

.definition-view,
.gantt-view {
  width: 100%;
  height: 100%;
  overflow: auto;
  animation: fadeIn 0.4s ease;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  flex: 1;
  min-height: 0;
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

/* No Data Message */
.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 40px 20px;
  text-align: center;
  background: white;
  border-radius: 12px;
  margin: 20px;
}

.dark .no-data-message {
  background: var(--card-dark);
}

.no-data-message .material-symbols-outlined {
  font-size: 64px;
  color: var(--muted-light);
  margin-bottom: 16px;
  opacity: 0.5;
}

.no-data-message h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 8px 0;
}

.dark .no-data-message h3 {
  color: var(--text-dark);
}

.no-data-message p {
  font-size: 14px;
  color: var(--muted-light);
  margin: 0 0 24px 0;
  max-width: 400px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
}

/* Responsive */
@media (max-width: 1024px) {
  .planner-header {
    padding: 16px 20px;
  }
  .view-toggle-container {
    gap: 12px;
  }
  .toggle-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
  .toggle-btn .material-symbols-outlined {
    font-size: 18px;
  }
  .btn-import,
  .btn-export {
    padding: 6px 12px;
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .timeline-planner {
    min-height: 500px;
  }
  .planner-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
    padding: 16px;
  }
  .view-toggle-container {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .view-toggle {
    width: 100%;
    justify-content: stretch;
  }
  .toggle-btn {
    flex: 1;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
  }
  .action-buttons {
    width: 100%;
    justify-content: stretch;
  }
  .btn-import,
  .btn-export {
    flex: 1;
    justify-content: center;
  }
  .data-badge {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
  }
}

@media (max-width: 480px) {
  .timeline-planner {
    min-height: 400px;
    border-radius: var(--border-radius-md);
  }
  .planner-header {
    padding: 12px;
    gap: 12px;
  }
  .view-toggle {
    flex-direction: column;
    gap: 4px;
    background: transparent;
    backdrop-filter: none;
    padding: 0;
    border: none;
  }
  .toggle-btn {
    width: 100%;
    justify-content: center;
    padding: 10px 12px;
    font-size: 13px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid var(--border-light);
  }
  .dark .toggle-btn {
    background: rgba(15, 23, 42, 0.8);
    border-color: var(--border-dark);
  }
  .toggle-btn .material-symbols-outlined {
    font-size: 18px;
  }
  .data-badge {
    font-size: 12px;
    padding: 6px 10px;
  }
  .data-badge .material-symbols-outlined {
    font-size: 16px;
  }
}

@media (max-width: 320px) {
  .planner-header {
    padding: 10px;
  }
  .toggle-btn {
    padding: 8px 10px;
    font-size: 12px;
  }
  .toggle-btn .material-symbols-outlined {
    font-size: 16px;
  }
  .data-badge {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* Safe area insets */
@supports (padding: max(0px)) {
  @media (max-width: 768px) {
    .planner-header {
      padding-top: max(16px, env(safe-area-inset-top));
      padding-left: max(16px, env(safe-area-inset-left));
      padding-right: max(16px, env(safe-area-inset-right));
    }
    .planner-content {
      padding-bottom: env(safe-area-inset-bottom);
    }
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .toggle-btn,
  .view-enter-active,
  .view-leave-active,
  .data-badge {
    transition: none;
    animation: none;
  }
  .toggle-btn::before {
    transition: none;
  }
}

/* Focus visible */
.toggle-btn:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}

/* Landscape orientation */
@media (max-height: 500px) and (orientation: landscape) {
  .timeline-planner {
    min-height: 300px;
  }
  .planner-header {
    padding: 8px 16px;
  }
  .toggle-btn {
    padding: 6px 12px;
  }
}

/* Touch devices */
@media (hover: none) and (pointer: coarse) {
  .toggle-btn {
    min-height: 44px;
  }
  .toggle-btn .material-symbols-outlined {
    font-size: 20px;
  }
  .data-badge {
    padding: 8px 12px;
  }
  .toggle-btn:hover {
    transform: none;
  }
  .toggle-btn:hover::before {
    display: none;
  }
}
</style>