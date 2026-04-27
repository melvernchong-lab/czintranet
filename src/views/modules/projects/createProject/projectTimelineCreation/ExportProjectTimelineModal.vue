<!-- ExportModal.vue -->
<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Export Timeline</h3>
        <button class="close-btn" @click="handleClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">
          Choose how you want to export your timeline data and Gantt chart
        </p>
        
        <!-- Export Options -->
        <div class="export-options">
          <div class="export-section">
            <h4>Format</h4>
            <div class="format-options">
              <label class="radio-option">
                <input type="radio" v-model="exportFormat" value="pdf">
                <div class="radio-content">
                  <span class="material-symbols-outlined">picture_as_pdf</span>
                  <div>
                    <strong>PDF Document</strong>
                    <p>Export as PDF with Gantt chart</p>
                  </div>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="exportFormat" value="excel">
                <div class="radio-content">
                  <span class="material-symbols-outlined">table_chart</span>
                  <div>
                    <strong>Excel</strong>
                    <p>Export as Excel spreadsheet</p>
                  </div>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="exportFormat" value="csv">
                <div class="radio-content">
                  <span class="material-symbols-outlined">data_table</span>
                  <div>
                    <strong>CSV</strong>
                    <p>Export as CSV file</p>
                  </div>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="exportFormat" value="json">
                <div class="radio-content">
                  <span class="material-symbols-outlined">code</span>
                  <div>
                    <strong>JSON</strong>
                    <p>Export as JSON data</p>
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <div v-if="exportFormat === 'pdf'" class="export-section">
            <h4>PDF Options</h4>
            <div class="pdf-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="pdfOptions.includeGantt">
                <span>Include Gantt Chart</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="pdfOptions.includeTimeline">
                <span>Include Timeline Table</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="pdfOptions.includeSummary">
                <span>Include Summary Statistics</span>
              </label>
              
              <div class="select-option">
                <label>Paper Size</label>
                <select v-model="pdfOptions.paperSize">
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                </select>
              </div>
              
              <div class="select-option">
                <label>Orientation</label>
                <select v-model="pdfOptions.orientation">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>
            </div>
          </div>
          
          <div class="export-section">
            <h4>Data Range</h4>
            <div class="date-range-options">
              <label class="radio-option">
                <input type="radio" v-model="dataRange" value="all">
                <div class="radio-content">
                  <strong>All Tasks</strong>
                  <p>Export all tasks in the timeline</p>
                </div>
              </label>
              
              <label class="radio-option">
                <input type="radio" v-model="dataRange" value="selected">
                <div class="radio-content">
                  <strong>Selected Range</strong>
                  <p>Export tasks within date range</p>
                </div>
              </label>
            </div>
            
            <div v-if="dataRange === 'selected'" class="date-pickers">
              <div class="date-picker">
                <label>Start Date</label>
                <input type="date" v-model="customStartDate">
              </div>
              <div class="date-picker">
                <label>End Date</label>
                <input type="date" v-model="customEndDate">
              </div>
            </div>
          </div>
          
          <div class="export-section">
            <h4>Include Fields</h4>
            <div class="fields-options">
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.id">
                <span>Task ID</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.name">
                <span>Task Name</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.owner">
                <span>Owner</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.type">
                <span>Task Type</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.startDate">
                <span>Start Date</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.endDate">
                <span>End Date</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.duration">
                <span>Duration</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.progress">
                <span>Progress</span>
              </label>
              
              <label class="checkbox-option">
                <input type="checkbox" v-model="includeFields.relationships">
                <span>Relationships</span>
              </label>
            </div>
          </div>
        </div>
        
        <!-- Export Preview -->
        <div v-if="exportFormat === 'pdf'" class="export-preview">
          <h4>Export Preview</h4>
          <div class="preview-info">
            <p>Total tasks to export: <strong>{{ totalTasks }}</strong></p>
            <p>Estimated file size: <strong>{{ estimatedFileSize }}</strong></p>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">Cancel</button>
        <button class="btn-primary" @click="handleExport" :disabled="!canExport">
          <span class="material-symbols-outlined">download</span>
          Export {{ getExportFormatName() }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
  name: 'ExportModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    timelineData: {
      type: Object,
      default: () => ({ groups: [], summary: {} })
    }
  },
  emits: ['close', 'export'],
  setup(props, { emit }) {
    const exportFormat = ref('pdf')
    const dataRange = ref('all')
    const customStartDate = ref('')
    const customEndDate = ref('')
    
    const pdfOptions = ref({
      includeGantt: true,
      includeTimeline: true,
      includeSummary: true,
      paperSize: 'A4',
      orientation: 'landscape'
    })
    
    const includeFields = ref({
      id: true,
      name: true,
      owner: true,
      type: true,
      startDate: true,
      endDate: true,
      duration: true,
      progress: true,
      relationships: true
    })
    
    const totalTasks = computed(() => {
      let count = 0
      const processGroup = (group) => {
        count += group.tasks?.length || 0
        if (group.subGroups) {
          group.subGroups.forEach(processGroup)
        }
      }
      props.timelineData.groups?.forEach(processGroup)
      return count
    })
    
    const estimatedFileSize = computed(() => {
      const baseSize = totalTasks.value * 2
      if (exportFormat.value === 'pdf') {
        return `${Math.max(100, baseSize * 5)} KB`
      } else if (exportFormat.value === 'excel') {
        return `${Math.max(50, baseSize * 3)} KB`
      } else {
        return `${Math.max(10, baseSize)} KB`
      }
    })
    
    const canExport = computed(() => {
      if (dataRange.value === 'selected') {
        return customStartDate.value && customEndDate.value
      }
      return totalTasks.value > 0
    })
    
    const getExportFormatName = () => {
      const formats = {
        pdf: 'PDF',
        excel: 'Excel',
        csv: 'CSV',
        json: 'JSON'
      }
      return formats[exportFormat.value] || 'PDF'
    }
    
    const handleExport = () => {
      const exportData = {
        format: exportFormat.value,
        dataRange: dataRange.value,
        startDate: customStartDate.value,
        endDate: customEndDate.value,
        pdfOptions: pdfOptions.value,
        includeFields: includeFields.value,
        timelineData: props.timelineData,
        totalTasks: totalTasks.value
      }
      
      emit('export', exportData)
      handleClose()
    }
    
    const handleClose = () => {
      // Reset form
      exportFormat.value = 'pdf'
      dataRange.value = 'all'
      customStartDate.value = ''
      customEndDate.value = ''
      pdfOptions.value = {
        includeGantt: true,
        includeTimeline: true,
        includeSummary: true,
        paperSize: 'A4',
        orientation: 'landscape'
      }
      includeFields.value = {
        id: true,
        name: true,
        owner: true,
        type: true,
        startDate: true,
        endDate: true,
        duration: true,
        progress: true,
        relationships: true
      }
      emit('close')
    }
    
    watch(() => props.show, (newVal) => {
      if (!newVal) {
        handleClose()
      }
    })
    
    return {
      exportFormat,
      dataRange,
      customStartDate,
      customEndDate,
      pdfOptions,
      includeFields,
      totalTasks,
      estimatedFileSize,
      canExport,
      getExportFormatName,
      handleExport,
      handleClose
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
  max-width: 700px;
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

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  margin: 0 0 24px 0;
  font-size: 14px;
  color: #64748b;
}

.dark .modal-description {
  color: #94a3b8;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.export-section {
  border-top: 1px solid #e2e8f0;
  padding-top: 20px;
}

.dark .export-section {
  border-top-color: #334155;
}

.export-section:first-child {
  border-top: none;
  padding-top: 0;
}

.export-section h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.dark .export-section h4 {
  color: #f1f5f9;
}

.format-options {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.radio-option, .checkbox-option {
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  transition: all 0.2s;
  flex: 1;
  min-width: 150px;
}

.dark .radio-option, .dark .checkbox-option {
  border-color: #334155;
}

.radio-option:hover, .checkbox-option:hover {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.radio-option input, .checkbox-option input {
  margin-right: 12px;
  accent-color: #4361ee;
}

.radio-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.radio-content .material-symbols-outlined {
  font-size: 24px;
  color: #4361ee;
}

.radio-content strong {
  display: block;
  font-size: 13px;
  color: #0f172a;
}

.dark .radio-content strong {
  color: #f1f5f9;
}

.radio-content p {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #64748b;
}

.dark .radio-content p {
  color: #94a3b8;
}

.pdf-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.select-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.select-option label {
  min-width: 100px;
  font-size: 13px;
  color: #475569;
}

.dark .select-option label {
  color: #94a3b8;
}

.select-option select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 13px;
}

.dark .select-option select {
  background: #2d3448;
  border-color: #475569;
  color: #e2e8f0;
}

.date-range-options {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.date-pickers {
  display: flex;
  gap: 16px;
  margin-top: 12px;
}

.date-picker {
  flex: 1;
}

.date-picker label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.date-picker input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
}

.dark .date-picker input {
  background: #2d3448;
  border-color: #475569;
  color: #e2e8f0;
}

.fields-options {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.checkbox-option {
  padding: 8px 12px;
  margin: 0;
}

.export-preview {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.dark .export-preview {
  border-top-color: #334155;
}

.export-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.dark .export-preview h4 {
  color: #f1f5f9;
}

.preview-info {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.dark .preview-info {
  background: #242b3f;
}

.preview-info p {
  margin: 8px 0;
  font-size: 13px;
  color: #475569;
}

.dark .preview-info p {
  color: #94a3b8;
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
  display: flex;
  align-items: center;
  gap: 8px;
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>