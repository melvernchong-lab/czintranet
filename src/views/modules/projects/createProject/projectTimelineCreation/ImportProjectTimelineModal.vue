<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <div class="modal-header">
        <h3>Import Timeline Data</h3>
        <button class="close-btn" @click="handleClose">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div class="modal-body">
        <p class="modal-description">
          Choose a file format to import your timeline data
        </p>
        
        <div class="import-options">
          <div 
            class="import-option"
            @click="selectImportType('ms-project')"
            :class="{ 'selected': selectedType === 'ms-project' }"
          >
            <div class="option-icon ms-project">
              <span class="material-symbols-outlined">folder_shared</span>
            </div>
            <div class="option-info">
              <h4>Microsoft Project</h4>
              <p>Import .xml files exported from MS Project</p>
              <small class="format-note">XML format only</small>
            </div>
            <span class="option-arrow material-symbols-outlined">chevron_right</span>
          </div>
          
          <div 
            class="import-option"
            @click="selectImportType('excel')"
            :class="{ 'selected': selectedType === 'excel' }"
          >
            <div class="option-icon excel">
              <span class="material-symbols-outlined">table_chart</span>
            </div>
            <div class="option-info">
              <h4>Excel</h4>
              <p>Import .xlsx, .xls files</p>
            </div>
            <span class="option-arrow material-symbols-outlined">chevron_right</span>
          </div>
          
          <div 
            class="import-option"
            @click="selectImportType('csv')"
            :class="{ 'selected': selectedType === 'csv' }"
          >
            <div class="option-icon csv">
              <span class="material-symbols-outlined">data_table</span>
            </div>
            <div class="option-info">
              <h4>CSV</h4>
              <p>Import comma-separated values</p>
            </div>
            <span class="option-arrow material-symbols-outlined">chevron_right</span>
          </div>
          
          <div 
            class="import-option"
            @click="selectImportType('json')"
            :class="{ 'selected': selectedType === 'json' }"
          >
            <div class="option-icon json">
              <span class="material-symbols-outlined">code</span>
            </div>
            <div class="option-info">
              <h4>JSON</h4>
              <p>Import JSON format</p>
            </div>
            <span class="option-arrow material-symbols-outlined">chevron_right</span>
          </div>
        </div>
        
        <!-- File Upload Area -->
        <div v-if="selectedType" class="file-upload-area">
          <div class="upload-header">
            <span class="material-symbols-outlined">cloud_upload</span>
            <h4>Upload {{ getTypeName() }} File</h4>
          </div>
          
          <div 
            class="drop-zone"
            @dragover.prevent
            @drop.prevent="handleDrop"
            @click="triggerFileInput"
          >
            <input 
              type="file"
              ref="fileInput"
              :accept="getAcceptTypes()"
              @change="handleFileSelect"
              style="display: none"
            />
            <div class="drop-zone-content">
              <span class="material-symbols-outlined upload-icon">upload_file</span>
              <p>Drag and drop your file here or click to browse</p>
              <small>Supported formats: {{ getAcceptTypes() }}</small>
            </div>
          </div>
          
          <div v-if="isParsing" class="parsing-status">
            <span class="material-symbols-outlined spinning">sync</span>
            <span>Parsing file...</span>
          </div>
          
          <div v-if="parseError" class="error-message">
            <span class="material-symbols-outlined">error</span>
            <span>{{ parseError }}</span>
          </div>
          
          <div v-if="selectedFile && !isParsing && !parseError" class="selected-file">
            <span class="material-symbols-outlined">insert_drive_file</span>
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
            <button class="remove-file" @click="clearFile">
              <span class="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
        
        <!-- Import Preview -->
        <div v-if="importPreview" class="import-preview">
          <h4>Preview</h4>
          <div class="preview-content">
            <p>Found {{ importPreview.taskCount }} tasks in {{ importPreview.swimlaneCount }} swimlanes</p>
            <div class="preview-stats">
              <div class="stat">
                <span class="stat-value">{{ importPreview.milestoneCount }}</span>
                <span class="stat-label">Milestones</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ importPreview.totalDuration }}</span>
                <span class="stat-label">Total Days</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ importPreview.dateRange?.start || 'N/A' }}</span>
                <span class="stat-label">Start</span>
              </div>
              <div class="stat">
                <span class="stat-value">{{ importPreview.dateRange?.end || 'N/A' }}</span>
                <span class="stat-label">End</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" @click="handleClose">Cancel</button>
        <button 
          class="btn-primary" 
          @click="handleImport" 
          :disabled="!selectedFile || !importPreview || isParsing"
        >
          <span class="material-symbols-outlined">import_export</span>
          Import
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'
import { ParserFactory } from '../../../../../utils/parsers/index.js'

export default {
  name: 'ImportModal',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'import', 'import-complete'],
  setup(props, { emit }) {
    const selectedType = ref(null)
    const selectedFile = ref(null)
    const fileInput = ref(null)
    const importPreview = ref(null)
    const isParsing = ref(false)
    const parseError = ref(null)
    
    const getTypeName = () => {
      const types = {
        'ms-project': 'Microsoft Project',
        'excel': 'Excel',
        'csv': 'CSV',
        'json': 'JSON'
      }
      return types[selectedType.value] || ''
    }
    
    const getAcceptTypes = () => {
      const types = {
        'ms-project': '.xml',  // Only accept XML for MS Project
        'excel': '.xlsx,.xls',
        'csv': '.csv',
        'json': '.json'
      }
      return types[selectedType.value] || '*'
    }
    
    const formatFileSize = (bytes) => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    const selectImportType = (type) => {
      selectedType.value = type
      clearFile()
      parseError.value = null
    }
    
    const triggerFileInput = () => {
      fileInput.value?.click()
    }
    
    const clearFile = () => {
      selectedFile.value = null
      importPreview.value = null
      parseError.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }
    
    const handleFileSelect = async (event) => {
      const file = event.target.files[0]
      if (file) {
        console.log('File selected:', file.name)
        selectedFile.value = file
        await parseFilePreview(file)
      }
    }
    
    const handleDrop = async (event) => {
      const file = event.dataTransfer.files[0]
      if (file) {
        console.log('File dropped:', file.name)
        selectedFile.value = file
        await parseFilePreview(file)
      }
    }
    
    const getDateRange = (groups) => {
      let minStart = null
      let maxEnd = null
      
      groups.forEach(group => {
        if (group.tasks && Array.isArray(group.tasks)) {
          group.tasks.forEach(task => {
            if (task.startDate) {
              const start = new Date(task.startDate)
              if (!isNaN(start.getTime())) {
                if (!minStart || start < minStart) minStart = start
              }
            }
            if (task.endDate) {
              const end = new Date(task.endDate)
              if (!isNaN(end.getTime())) {
                if (!maxEnd || end > maxEnd) maxEnd = end
              }
            }
          })
        }
      })
      
      const formatDate = (date) => {
        if (!date) return 'N/A'
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }
      
      return {
        start: formatDate(minStart),
        end: formatDate(maxEnd)
      }
    }
    
    const parseFilePreview = async (file) => {
      if (!selectedType.value) return
      
      console.log('=== PARSING FILE ===')
      console.log('Type:', selectedType.value)
      console.log('File:', file.name)
      
      isParsing.value = true
      parseError.value = null
      importPreview.value = null
      
      try {
        const parsedData = await ParserFactory.parseFile(selectedType.value, file)
        
        console.log('Parsed data received:', {
          groupsCount: parsedData.groups?.length,
          tasksCount: parsedData.summary?.totalTasks,
          firstGroup: parsedData.groups?.[0]?.name,
          firstTask: parsedData.groups?.[0]?.tasks?.[0]?.name
        })
        
        if (!parsedData.groups || parsedData.groups.length === 0) {
          throw new Error('No groups found in the parsed data')
        }
        
        // Calculate date range
        const dateRange = getDateRange(parsedData.groups)
        
        // Store preview data
        importPreview.value = {
          taskCount: parsedData.summary.totalTasks,
          swimlaneCount: parsedData.groups.length,
          milestoneCount: parsedData.summary.milestoneCount,
          totalDuration: parsedData.summary.totalDuration,
          dateRange: dateRange
        }
        
        // Store the actual parsed data for import
        selectedFile.value = {
          ...selectedFile.value,
          parsedData
        }
        
        console.log('Preview created:', importPreview.value)
      } catch (error) {
        console.error('Parse error:', error)
        parseError.value = error.message || 'Failed to parse file. Please check the file format.'
        importPreview.value = null
        selectedFile.value = null
      } finally {
        isParsing.value = false
      }
    }
    
    const handleImport = () => {
      if (!selectedFile.value?.parsedData) {
        parseError.value = 'No valid data to import'
        return
      }
      
      console.log('=== IMPORTING DATA ===')
      console.log('Data to import:', {
        groupsCount: selectedFile.value.parsedData.groups?.length,
        tasksCount: selectedFile.value.parsedData.summary?.totalTasks
      })
      
      // Emit the parsed data
      emit('import-complete', {
        type: selectedType.value,
        data: selectedFile.value.parsedData,
        fileName: selectedFile.value.name
      })
      
      handleClose()
    }
    
    const handleClose = () => {
      selectedType.value = null
      clearFile()
      parseError.value = null
      isParsing.value = false
      emit('close')
    }
    
    // Reset when modal closes
    watch(() => props.show, (newVal) => {
      if (!newVal) {
        handleClose()
      }
    })
    
    return {
      selectedType,
      selectedFile,
      fileInput,
      importPreview,
      isParsing,
      parseError,
      getTypeName,
      getAcceptTypes,
      formatFileSize,
      selectImportType,
      triggerFileInput,
      handleFileSelect,
      handleDrop,
      handleImport,
      handleClose,
      clearFile
    }
  }
}
</script>

<style scoped>
/* Add the format-note style */
.format-note {
  display: block;
  font-size: 10px;
  color: #f59e0b;
  margin-top: 2px;
}

.dark .format-note {
  color: #fbbf24;
}

/* Rest of your existing styles remain the same */
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
  max-width: 600px;
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

.import-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.import-option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .import-option {
  background: #242b3f;
  border-color: #334155;
}

.import-option:hover {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
  transform: translateX(4px);
}

.import-option.selected {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.08);
}

.option-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: white;
}

.dark .option-icon {
  background: #1a1f2e;
}

.option-icon.ms-project {
  color: #2e7d32;
  background: rgba(46, 125, 50, 0.1);
}

.option-icon.excel {
  color: #1e88e5;
  background: rgba(30, 136, 229, 0.1);
}

.option-icon.csv {
  color: #f57c00;
  background: rgba(245, 124, 0, 0.1);
}

.option-icon.json {
  color: #7b1fa2;
  background: rgba(123, 31, 162, 0.1);
}

.option-icon .material-symbols-outlined {
  font-size: 28px;
}

.option-info {
  flex: 1;
}

.option-info h4 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
  color: #0f172a;
}

.dark .option-info h4 {
  color: #f1f5f9;
}

.option-info p {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.dark .option-info p {
  color: #94a3b8;
}

.option-arrow {
  color: #94a3b8;
  font-size: 20px;
}

.file-upload-area {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.dark .file-upload-area {
  border-top-color: #334155;
}

.upload-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.upload-header .material-symbols-outlined {
  color: #4361ee;
  font-size: 24px;
}

.upload-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.dark .upload-header h4 {
  color: #f1f5f9;
}

.drop-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fafcff;
}

.dark .drop-zone {
  background: #1e293b;
  border-color: #475569;
}

.drop-zone:hover {
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.05);
}

.drop-zone-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 48px !important;
  color: #94a3b8;
}

.drop-zone p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
}

.drop-zone small {
  font-size: 12px;
  color: #94a3b8;
}

.dark .drop-zone p {
  color: #94a3b8;
}

.parsing-status {
  margin-top: 16px;
  padding: 12px;
  background: #e0f2fe;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #0284c7;
}

.dark .parsing-status {
  background: #0c4a6e;
  color: #7dd3fc;
}

.parsing-status .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  margin-top: 16px;
  padding: 12px;
  background: #fee2e2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #dc2626;
}

.dark .error-message {
  background: #7f1a1a;
  color: #fecaca;
}

.selected-file {
  margin-top: 16px;
  padding: 12px;
  background: #f1f5f9;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.dark .selected-file {
  background: #2d3448;
}

.selected-file .material-symbols-outlined {
  color: #4361ee;
  font-size: 20px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: #0f172a;
}

.dark .file-name {
  color: #f1f5f9;
}

.file-size {
  font-size: 12px;
  color: #64748b;
}

.remove-file {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-file:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.remove-file .material-symbols-outlined {
  font-size: 16px;
}

.import-preview {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
}

.dark .import-preview {
  border-top-color: #334155;
}

.import-preview h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}

.dark .import-preview h4 {
  color: #f1f5f9;
}

.preview-content {
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
}

.dark .preview-content {
  background: #242b3f;
}

.preview-content p {
  margin: 0 0 12px 0;
  font-size: 13px;
  color: #475569;
}

.dark .preview-content p {
  color: #94a3b8;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #4361ee;
}

.stat-label {
  font-size: 11px;
  color: #64748b;
  margin-top: 4px;
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