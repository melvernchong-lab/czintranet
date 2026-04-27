<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">Edit Application</h2>
        <button class="modal-close-btn" @click="closeModal" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content" v-if="application">
        <!-- Loading state -->
        <div v-if="isSaving" class="modal-saving">
          <span class="material-symbols-outlined spin">refresh</span>
          Saving changes...
        </div>

        <!-- Edit Form -->
        <form @submit.prevent="handleSubmit" class="edit-form">
          <!-- Application Type (Read-only) -->
          <div class="form-section">
            <div class="form-section-header">
              <span class="material-symbols-outlined">category</span>
              <h3>Application Type</h3>
            </div>
            <div class="form-group read-only">
              <label class="form-label">Leave Type</label>
              <div class="form-value">
                <div class="type-display" :class="getTypeClass(application.type)">
                  <span class="material-symbols-outlined">{{ getIcon(application.type) }}</span>
                  <span>{{ getApplicationTypeDisplay(application.type) }}</span>
                </div>
                <div class="type-info">{{ getLeaveCategory(application.type) }}</div>
              </div>
            </div>
          </div>

          <!-- Dates Section -->
          <div class="form-section">
            <div class="form-section-header">
              <span class="material-symbols-outlined">calendar_month</span>
              <h3>Dates & Duration</h3>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label required">Start Date</label>
                <input 
                  type="date" 
                  v-model="formData.startDate" 
                  :min="minDate"
                  :max="formData.endDate"
                  class="form-input"
                  required
                />
                <div v-if="errors.startDate" class="form-error">{{ errors.startDate }}</div>
              </div>

              <div class="form-group">
                <label class="form-label required">End Date</label>
                <input 
                  type="date" 
                  v-model="formData.endDate" 
                  :min="formData.startDate"
                  class="form-input"
                  required
                />
                <div v-if="errors.endDate" class="form-error">{{ errors.endDate }}</div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Duration</label>
              <div class="duration-display">
                <span class="duration-value">{{ calculatedDays }} day{{ calculatedDays > 1 ? 's' : '' }}</span>
                <span class="duration-info">({{ formatDateRange(formData.startDate, formData.endDate) }})</span>
              </div>
            </div>
          </div>

          <!-- Reason Section -->
          <div class="form-section">
            <div class="form-section-header">
              <span class="material-symbols-outlined">description</span>
              <h3>Reason & Details</h3>
            </div>
            
            <div class="form-group">
              <label class="form-label required">Reason</label>
              <textarea 
                v-model="formData.reason" 
                class="form-textarea"
                rows="3"
                placeholder="Enter the reason for your leave request..."
                required
              ></textarea>
              <div class="form-hint">Please provide a clear reason for your leave request</div>
              <div v-if="errors.reason" class="form-error">{{ errors.reason }}</div>
            </div>

            <!-- Additional Notes -->
            <div class="form-group">
              <label class="form-label">Additional Notes</label>
              <textarea 
                v-model="formData.notes" 
                class="form-textarea"
                rows="2"
                placeholder="Any additional information (optional)..."
              ></textarea>
              <div class="form-hint">Optional: Add any supporting information</div>
            </div>

            <!-- File Attachments -->
            <div class="form-group">
              <label class="form-label">Attachments</label>
              <div class="attachments-section">
                <!-- Existing Attachments -->
                <div v-if="existingAttachments.length" class="existing-attachments">
                  <div class="attachments-title">Current attachments:</div>
                  <div v-for="(attachment, index) in existingAttachments" :key="index" class="attachment-item">
                    <span class="material-symbols-outlined">description</span>
                    <span class="attachment-name">{{ attachment.name }}</span>
                    <button type="button" class="attachment-remove" @click="removeAttachment(index)">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                <!-- Add New Attachments -->
                <div class="file-upload-area" @click="triggerFileInput" @dragover.prevent @drop="handleFileDrop">
                  <input 
                    type="file" 
                    ref="fileInput" 
                    @change="handleFileSelect" 
                    multiple 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    style="display: none"
                  />
                  <span class="material-symbols-outlined">upload</span>
                  <div class="upload-text">
                    <strong>Click to upload</strong> or drag and drop
                  </div>
                  <div class="upload-hint">PDF, DOC, JPG, PNG up to 5MB each</div>
                </div>

                <!-- Selected Files Preview -->
                <div v-if="newAttachments.length" class="selected-files">
                  <div class="selected-title">Files to upload:</div>
                  <div v-for="(file, index) in newAttachments" :key="index" class="selected-file">
                    <span class="material-symbols-outlined">description</span>
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">({{ formatFileSize(file.size) }})</span>
                    <button type="button" class="file-remove" @click="removeNewFile(index)">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Impact & Validation -->
          <div class="form-section">
            <div class="form-section-header">
              <span class="material-symbols-outlined">info</span>
              <h3>Validation & Impact</h3>
            </div>

            <!-- Leave Balance Impact -->
            <div v-if="application.type === 'AL'" class="impact-card">
              <div class="impact-header">
                <span class="material-symbols-outlined">account_balance</span>
                <span>Annual Leave Balance Impact</span>
              </div>
              <div class="impact-content">
                <div class="balance-info">
                  <div class="balance-item">
                    <span class="balance-label">Current Balance:</span>
                    <span class="balance-value">{{ annualLeave.balance }} days</span>
                  </div>
                  <div class="balance-item">
                    <span class="balance-label">This Request:</span>
                    <span class="balance-value">{{ calculatedDays }} days</span>
                  </div>
                  <div class="balance-item total">
                    <span class="balance-label">New Balance:</span>
                    <span class="balance-value" :class="{ 'negative': newBalance < 0 }">
                      {{ newBalance }} days
                    </span>
                  </div>
                </div>
                <div v-if="newBalance < 0" class="balance-warning">
                  <span class="material-symbols-outlined">warning</span>
                  This request will exceed your annual leave balance
                </div>
              </div>
            </div>

            <!-- Date Conflicts -->
            <div class="conflicts-card" v-if="dateConflicts.length">
              <div class="conflicts-header">
                <span class="material-symbols-outlined">error</span>
                <span>Potential Date Conflicts</span>
              </div>
              <div class="conflicts-list">
                <div v-for="(conflict, index) in dateConflicts" :key="index" class="conflict-item">
                  <span class="material-symbols-outlined">calendar_month</span>
                  <div class="conflict-details">
                    <div class="conflict-type">{{ getApplicationTypeDisplay(conflict.type) }}</div>
                    <div class="conflict-dates">{{ formatDateRange(conflict.startDate, conflict.endDate) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="btn-secondary" @click="closeModal" :disabled="isSaving">
              Cancel
            </button>
            <button type="submit" class="btn-primary" :disabled="isSaving || hasErrors">
              <span v-if="isSaving" class="material-symbols-outlined spin">refresh</span>
              <span v-else class="material-symbols-outlined">save</span>
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Loading State -->
      <div v-else class="modal-loading">
        <span class="material-symbols-outlined spin">refresh</span>
        Loading application details...
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApplicationEditModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    application: {
      type: Object,
      default: null
    },
    annualLeave: {
      type: Object,
      default: () => ({ balance: 0 })
    },
    // Utility functions
    getApplicationTypeDisplay: {
      type: Function,
      default: (type) => type
    },
    getIcon: {
      type: Function,
      default: () => 'help'
    },
    getTypeClass: {
      type: Function,
      default: () => ''
    },
    getLeaveCategory: {
      type: Function,
      default: () => ''
    },
    formatDateRange: {
      type: Function,
      default: (start, end) => `${start} - ${end}`
    }
  },
  emits: ['close', 'save'],
  data() {
    return {
      isSaving: false,
      formData: {
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
        attachments: []
      },
      errors: {},
      existingAttachments: [],
      newAttachments: [],
      dateConflicts: []
    };
  },
  computed: {
    minDate() {
      // Can't edit to dates in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today.toISOString().split('T')[0];
    },
    
    calculatedDays() {
      if (!this.formData.startDate || !this.formData.endDate) return 0;
      const start = new Date(this.formData.startDate);
      const end = new Date(this.formData.endDate);
      const diffTime = Math.abs(end - start);
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    },
    
    newBalance() {
      if (this.application.type !== 'AL') return 0;
      return this.annualLeave.balance - this.calculatedDays;
    },
    
    hasErrors() {
      return Object.keys(this.errors).length > 0 || this.newBalance < 0;
    }
  },
  watch: {
    application: {
      immediate: true,
      handler(newVal) {
        if (newVal) {
          this.initializeFormData();
          this.checkForConflicts();
        }
      }
    },
    
    'formData.startDate': function(newVal) {
      this.validateDates();
      if (newVal && this.formData.endDate && newVal > this.formData.endDate) {
        this.formData.endDate = newVal;
      }
    },
    
    'formData.endDate': function(newVal) {
      this.validateDates();
    },
    
    'formData.reason': function(newVal) {
      this.validateReason(newVal);
    }
  },
  methods: {
    closeModal() {
      if (!this.isSaving) {
        this.$emit('close');
      }
    },
    
    initializeFormData() {
      this.formData = {
        startDate: this.application.startDate,
        endDate: this.application.endDate,
        reason: this.application.reason || '',
        notes: this.application.notes || '',
        attachments: []
      };
      
      // Initialize existing attachments
      this.existingAttachments = this.application.attachments || [];
      this.newAttachments = [];
      this.errors = {};
    },
    
    validateDates() {
      this.errors = {};
      
      if (!this.formData.startDate) {
        this.errors.startDate = 'Start date is required';
      } else if (new Date(this.formData.startDate) < new Date(this.minDate)) {
        this.errors.startDate = 'Cannot select a past date';
      }
      
      if (!this.formData.endDate) {
        this.errors.endDate = 'End date is required';
      } else if (new Date(this.formData.endDate) < new Date(this.formData.startDate)) {
        this.errors.endDate = 'End date cannot be before start date';
      }
    },
    
    validateReason(reason) {
      if (!reason || reason.trim().length === 0) {
        this.errors.reason = 'Reason is required';
      } else if (reason.trim().length < 10) {
        this.errors.reason = 'Please provide a more detailed reason (minimum 10 characters)';
      } else {
        delete this.errors.reason;
      }
    },
    
    checkForConflicts() {
      // This would typically check against other applications
      // For now, return an empty array
      this.dateConflicts = [];
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    handleFileSelect(event) {
      const files = Array.from(event.target.files);
      this.validateAndAddFiles(files);
      event.target.value = ''; // Reset input
    },
    
    handleFileDrop(event) {
      event.preventDefault();
      const files = Array.from(event.dataTransfer.files);
      this.validateAndAddFiles(files);
    },
    
    validateAndAddFiles(files) {
      const validTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'image/jpeg', 'image/jpg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      files.forEach(file => {
        if (!validTypes.includes(file.type)) {
          this.showError(`File type not supported: ${file.name}`);
          return;
        }
        
        if (file.size > maxSize) {
          this.showError(`File too large (max 5MB): ${file.name}`);
          return;
        }
        
        this.newAttachments.push(file);
      });
    },
    
    removeAttachment(index) {
      this.existingAttachments.splice(index, 1);
    },
    
    removeNewFile(index) {
      this.newAttachments.splice(index, 1);
    },
    
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    showError(message) {
      // In a real app, you'd use a toast notification
      alert(message);
    },
    
    async handleSubmit() {
      // Validate form
      this.validateDates();
      this.validateReason(this.formData.reason);
      
      if (Object.keys(this.errors).length > 0) {
        this.showError('Please fix the errors in the form');
        return;
      }
      
      if (this.newBalance < 0) {
        if (!confirm('This request will exceed your annual leave balance. Do you want to continue?')) {
          return;
        }
      }
      
      this.isSaving = true;
      
      try {
        // Prepare data for submission
        const formData = new FormData();
        
        // Add form fields
        Object.keys(this.formData).forEach(key => {
          if (key !== 'attachments') {
            formData.append(key, this.formData[key]);
          }
        });
        
        // Add existing attachments (as references)
        formData.append('existingAttachments', JSON.stringify(this.existingAttachments));
        
        // Add new files
        this.newAttachments.forEach(file => {
          formData.append('attachments', file);
        });
        
        // In a real app, you would upload formData to your API
        // For now, simulate API call
        await this.simulateSave(formData);
        
        // Emit save event with updated data
        const updatedApplication = {
          ...this.application,
          ...this.formData,
          days: this.calculatedDays,
          attachments: [...this.existingAttachments, ...this.newAttachments.map(f => ({ name: f.name, size: f.size }))]
        };
        
        this.$emit('save', updatedApplication);
        this.closeModal();
        
      } catch (error) {
        this.showError('Failed to save changes. Please try again.');
        console.error('Save error:', error);
      } finally {
        this.isSaving = false;
      }
    },
    
    simulateSave(formData) {
      return new Promise((resolve) => {
        setTimeout(() => {
          console.log('Saving form data:', Object.fromEntries(formData));
          resolve();
        }, 1500);
      });
    }
  }
};
</script>

<style scoped>
/* Reuse modal styles from view details modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.modal-close-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  padding: 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.modal-close-btn:hover {
  background: #e2e8f0;
  color: #334155;
}

.modal-close-btn .material-symbols-outlined {
  font-size: 20px;
}

/* Modal Content */
.modal-content {
  padding: 0;
  overflow-y: auto;
  flex: 1;
}

.modal-saving {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  color: #64748b;
  font-size: 14px;
  gap: 12px;
}

/* Edit Form */
.edit-form {
  padding: 24px;
}

/* Form Sections */
.form-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e2e8f0;
}

.form-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.form-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.form-section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin: 0;
}

.form-section-header .material-symbols-outlined {
  font-size: 20px;
  color: #64748b;
}

/* Form Layout */
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

/* Form Groups */
.form-group {
  margin-bottom: 20px;
}

.form-group.read-only {
  opacity: 0.7;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
  margin-bottom: 8px;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

/* Type Display */
.type-display {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px;
  font-weight: 500;
  color: #334155;
}

.type-display .material-symbols-outlined {
  font-size: 18px;
}

.type-info {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

/* Form Inputs */
.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input[type="date"] {
  padding: 9px 12px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

/* Form Hints & Errors */
.form-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 4px;
}

.form-error {
  font-size: 12px;
  color: #dc2626;
  margin-top: 4px;
}

/* Duration Display */
.duration-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.duration-value {
  font-size: 16px;
  font-weight: 600;
  color: #3b82f6;
}

.duration-info {
  font-size: 13px;
  color: #64748b;
}

/* Attachments */
.attachments-section {
  margin-top: 8px;
}

.existing-attachments,
.selected-files {
  margin-bottom: 16px;
}

.attachments-title,
.selected-title {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
  margin-bottom: 8px;
}

.attachment-item,
.selected-file {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  margin-bottom: 8px;
}

.attachment-item .material-symbols-outlined,
.selected-file .material-symbols-outlined {
  font-size: 18px;
  color: #64748b;
}

.attachment-name,
.file-name {
  flex: 1;
  font-size: 14px;
  color: #334155;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-size {
  font-size: 12px;
  color: #94a3b8;
}

.attachment-remove,
.file-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #94a3b8;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.attachment-remove:hover {
  background: #fee2e2;
  color: #dc2626;
}

.file-remove:hover {
  background: #f1f5f9;
  color: #64748b;
}

/* File Upload Area */
.file-upload-area {
  border: 2px dashed #cbd5e1;
  border-radius: 8px;
  padding: 32px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fafc;
}

.file-upload-area:hover {
  border-color: #3b82f6;
  background: #eff6ff;
}

.file-upload-area .material-symbols-outlined {
  font-size: 40px;
  color: #94a3b8;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #475569;
  margin-bottom: 4px;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
}

/* Impact Cards */
.impact-card,
.conflicts-card {
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  margin-bottom: 16px;
}

.impact-header,
.conflicts-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.impact-header .material-symbols-outlined,
.conflicts-header .material-symbols-outlined {
  font-size: 18px;
}

.impact-content {
  padding: 16px;
}

.balance-info {
  display: grid;
  gap: 12px;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.balance-item:last-child {
  border-bottom: none;
}

.balance-item.total {
  font-weight: 600;
  padding-top: 12px;
  border-top: 2px solid #e2e8f0;
}

.balance-label {
  font-size: 14px;
  color: #475569;
}

.balance-value {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.balance-value.negative {
  color: #dc2626;
}

.balance-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  margin-top: 12px;
  font-size: 13px;
  color: #92400e;
}

.balance-warning .material-symbols-outlined {
  font-size: 18px;
  color: #92400e;
}

/* Conflicts */
.conflicts-list {
  padding: 8px 0;
}

.conflict-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.conflict-item:last-child {
  border-bottom: none;
}

.conflict-item .material-symbols-outlined {
  font-size: 18px;
  color: #ef4444;
}

.conflict-details {
  flex: 1;
}

.conflict-type {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.conflict-dates {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid #e2e8f0;
  margin-top: 24px;
}

.btn-primary,
.btn-secondary {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover:not(:disabled) {
  background: #e2e8f0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading State */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 24px;
  color: #64748b;
  font-size: 14px;
  gap: 12px;
}

/* Spinner Animation */
.spin {
  animation: spin 1s linear infinite;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 640px) {
  .modal-container {
    width: 95%;
    max-height: 85vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .duration-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>