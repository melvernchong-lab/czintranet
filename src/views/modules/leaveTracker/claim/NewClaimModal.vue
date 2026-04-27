<template>
  <div v-if="isVisible" class="modal-overlay" @click.self="close">
    <div class="modal-container">
      <div class="modal-header">
        <h2 class="modal-title">Submit New Claim</h2>
        <button class="modal-close" @click="close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      
      <div class="modal-content">
        <form @submit.prevent="submitClaim">
          <!-- Claim Type -->
          <div class="form-section">
            <label class="form-label">Claim Type</label>
            <div class="claim-type-grid">
              <button 
                v-for="type in claimTypes" 
                :key="type.id"
                type="button"
                :class="['claim-type-btn', { active: formData.type === type.id }]"
                @click="formData.type = type.id"
              >
                <span class="material-symbols-outlined">{{ type.icon }}</span>
                <span class="type-name">{{ type.name }}</span>
              </button>
            </div>
          </div>
          
          <!-- Claim Details -->
          <div class="form-section">
            <label class="form-label">Claim Details</label>
            <div class="form-grid">
              <div class="form-group">
                <label class="input-label">Title</label>
                <input 
                  v-model="formData.title"
                  type="text" 
                  class="form-input"
                  placeholder="e.g., Client Meeting Expenses"
                  required
                />
              </div>
              <div class="form-group">
                <label class="input-label">Date</label>
                <input 
                  v-model="formData.date"
                  type="date" 
                  class="form-input"
                  required
                />
              </div>
              <div class="form-group">
                <label class="input-label">Amount ($)</label>
                <input 
                  v-model="formData.amount"
                  type="number" 
                  class="form-input"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>
          </div>
          
          <!-- Description -->
          <div class="form-section">
            <label class="form-label">Description</label>
            <textarea 
              v-model="formData.description"
              class="form-textarea"
              placeholder="Provide details about your claim..."
              rows="3"
            ></textarea>
          </div>
          
          <!-- Receipt Upload -->
          <div class="form-section">
            <label class="form-label">Receipt Attachment</label>
            <div class="upload-area" @click="triggerFileInput">
              <input 
                ref="fileInput"
                type="file"
                @change="handleFileUpload"
                accept=".pdf,.jpg,.jpeg,.png"
                class="file-input"
              />
              <span class="material-symbols-outlined upload-icon">upload</span>
              <p class="upload-text">
                {{ formData.receipt ? formData.receipt.name : 'Click to upload receipt (PDF, JPG, PNG)' }}
              </p>
              <p class="upload-hint">Max file size: 5MB</p>
            </div>
            <div v-if="formData.receipt" class="upload-preview">
              <span class="material-symbols-outlined">description</span>
              <span class="file-name">{{ formData.receipt.name }}</span>
              <button type="button" @click="removeFile" class="remove-file">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
          
          <!-- Action Buttons -->
          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="saveDraft">
              Save as Draft
            </button>
            <button type="submit" class="btn btn-primary">
              Submit Claim
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewClaimModal',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      formData: {
        type: 'travel',
        title: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        receipt: null
      },
      claimTypes: [
        { id: 'travel', name: 'Travel', icon: 'flight' },
        { id: 'meal', name: 'Meal', icon: 'restaurant' },
        { id: 'supplies', name: 'Supplies', icon: 'inventory_2' },
        { id: 'onsite', name: 'Onsite', icon: 'business_center' },
        { id: 'medical', name: 'Medical', icon: 'medical_services' },
        { id: 'other', name: 'Other', icon: 'receipt_long' }
      ]
    };
  },
  methods: {
    close() {
      this.resetForm();
      this.$emit('close');
    },
    
    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert('File size must be less than 5MB');
          return;
        }
        
        // Validate file type
        const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!validTypes.includes(file.type)) {
          alert('Please upload PDF, JPG, or PNG files only');
          return;
        }
        
        this.formData.receipt = file;
      }
    },
    
    removeFile() {
      this.formData.receipt = null;
      this.$refs.fileInput.value = '';
    },
    
    saveDraft() {
      const draftData = {
        ...this.formData,
        status: 'draft',
        submittedDate: new Date().toISOString()
      };
      this.$emit('submit', draftData);
    },
    
    submitClaim() {
      if (!this.validateForm()) return;
      
      const claimData = {
        ...this.formData,
        status: 'submitted',
        submittedDate: new Date().toISOString()
      };
      this.$emit('submit', claimData);
    },
    
    validateForm() {
      if (!this.formData.type) {
        alert('Please select a claim type');
        return false;
      }
      
      if (!this.formData.title.trim()) {
        alert('Please enter a title');
        return false;
      }
      
      if (!this.formData.amount || parseFloat(this.formData.amount) <= 0) {
        alert('Please enter a valid amount');
        return false;
      }
      
      return true;
    },
    
    resetForm() {
      this.formData = {
        type: 'travel',
        title: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: '',
        receipt: null
      };
      this.$refs.fileInput.value = '';
    }
  }
};
</script>

<style scoped>
/* Reuse modal styles from ClaimDetailsModal and add specific form styles */
.claim-type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.claim-type-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #cfd3e7;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.claim-type-btn:hover {
  border-color: #0d47a1;
  background: #f8f9fc;
}

.claim-type-btn.active {
  border-color: #0d47a1;
  background: rgba(13, 71, 161, 0.05);
}

.claim-type-btn .material-symbols-outlined {
  font-size: 1.5rem;
  color: #4c599a;
}

.claim-type-btn.active .material-symbols-outlined {
  color: #0d47a1;
}

.type-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: #4c599a;
}

.claim-type-btn.active .type-name {
  color: #0d47a1;
  font-weight: 600;
}

.form-section {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0d101b;
  margin-bottom: 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.input-label {
  font-size: 0.75rem;
  color: #4c599a;
  margin-bottom: 0.25rem;
}

.form-input,
.form-textarea {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cfd3e7;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #0d47a1;
  box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.2);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.upload-area {
  border: 2px dashed #cfd3e7;
  border-radius: 0.75rem;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.upload-area:hover {
  border-color: #0d47a1;
  background: rgba(13, 71, 161, 0.02);
}

.file-input {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-icon {
  font-size: 2rem;
  color: #4c599a;
  margin-bottom: 0.5rem;
}

.upload-text {
  font-size: 0.875rem;
  color: #0d101b;
  margin: 0 0 0.25rem 0;
}

.upload-hint {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0;
}

.upload-preview {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8f9fc;
  border-radius: 0.5rem;
  margin-top: 0.75rem;
}

.upload-preview .material-symbols-outlined {
  color: #4c599a;
}

.file-name {
  flex: 1;
  font-size: 0.875rem;
  color: #0d101b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file {
  background: transparent;
  border: none;
  color: #ef4444;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.remove-file:hover {
  background: rgba(239, 68, 68, 0.1);
}

.dark .claim-type-btn {
  background: #1a1d2e;
  border-color: #2d324a;
}

.dark .claim-type-btn:hover {
  border-color: #0d47a1;
  background: #2d324a;
}

.dark .claim-type-btn.active {
  background: rgba(13, 71, 161, 0.1);
}

.dark .claim-type-btn .material-symbols-outlined {
  color: #8b95c9;
}

.dark .type-name {
  color: #8b95c9;
}

.dark .form-label {
  color: white;
}

.dark .input-label {
  color: #8b95c9;
}

.dark .form-input,
.dark .form-textarea {
  background: #2d324a;
  border-color: #2d324a;
  color: white;
}

.dark .form-input:focus,
.dark .form-textarea:focus {
  border-color: #0d47a1;
}

.dark .upload-area {
  border-color: #2d324a;
}

.dark .upload-area:hover {
  border-color: #0d47a1;
  background: rgba(13, 71, 161, 0.05);
}

.dark .upload-icon {
  color: #8b95c9;
}

.dark .upload-text {
  color: white;
}

.dark .upload-hint {
  color: #9ca3af;
}

.dark .upload-preview {
  background: #2d324a;
}

.dark .upload-preview .material-symbols-outlined {
  color: #8b95c9;
}

.dark .file-name {
  color: white;
}
</style>