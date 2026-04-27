<template>
  <div class="project-info-card">
    <div class="card-header">
      <h2 class="card-title">Project Information</h2>
      <div class="header-actions">
        <button v-if="!isEditing" class="edit-btn" @click="startEditing">
          <span class="material-symbols-outlined">edit</span>
          Edit
        </button>
        <template v-else>
          <button class="save-btn" @click="saveChanges">
            <span class="material-symbols-outlined">check</span>
            Save
          </button>
          <button class="cancel-btn" @click="cancelEditing">
            <span class="material-symbols-outlined">close</span>
            Cancel
          </button>
        </template>
      </div>
    </div>
    
    <!-- Edit Mode -->
    <div v-if="isEditing" class="edit-mode">
      <div class="edit-grid">
        <div class="form-group full-width">
          <label>Project Name</label>
          <input type="text" v-model="editableProject.name" class="form-input">
        </div>
        
        <div class="form-group full-width">
          <label>Description</label>
          <textarea v-model="editableProject.description" class="form-textarea" rows="3"></textarea>
        </div>
        
        <div class="form-group">
          <label>Client</label>
          <input type="text" v-model="editableProject.client" class="form-input">
        </div>
        
        <div class="form-group">
          <label>Project Type</label>
          <select v-model="editableProject.type" class="form-select">
            <option value="development">Development</option>
            <option value="maintenance">Maintenance</option>
            <option value="migration">Migration</option>
            <option value="research">Research</option>
            <option value="crm">CRM</option>
            <option value="security">Security</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Status</label>
          <select v-model="editableProject.status" class="form-select">
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        
        <div class="form-group">
          <label>Start Date</label>
          <input type="date" v-model="editableProject.startDate" class="form-input">
        </div>
        
        <div class="form-group">
          <label>End Date</label>
          <input type="date" v-model="editableProject.endDate" class="form-input">
        </div>
        
        <div class="form-group">
          <label>Budget</label>
          <input type="number" v-model="editableProject.budget" class="form-input" placeholder="Enter budget amount">
        </div>
      </div>
    </div>

    <!-- Display Mode -->
    <div v-else>
      <!-- Top Row - Project Name & Code -->
      <div class="top-row">
        <div class="info-field">
          <div class="field-label">PROJECT NAME</div>
          <div class="field-value">{{ project.name }}</div>
        </div>
        <div class="info-field">
          <div class="field-label">PROJECT CODE</div>
          <div class="field-value">{{ project.code }}</div>
        </div>
      </div>

      <!-- Description Section - Standalone -->
      <div class="description-section">
        <div class="field-label">DESCRIPTION</div>
        <div class="field-value description-text">{{ project.description || 'No description provided.' }}</div>
      </div>

      <!-- Bottom Grid - Two Columns -->
      <div class="info-grid">
        <!-- Left Column -->
        <div class="info-column">
          <div class="info-field">
            <div class="field-label">CLIENT</div>
            <div class="field-value client-name">{{ project.client || '—' }}</div>
          </div>
          
          <div class="info-field">
            <div class="field-label">CURRENT PHASE</div>
            <div class="field-value phase-value">
              <span class="phase-bullet" :class="getPhaseClass(project.phase)"></span>
              {{ getPhaseDisplay(project.phase) }}
            </div>
          </div>
          
          <div class="info-field">
            <div class="field-label">START DATE</div>
            <div class="field-value">{{ formatDate(project.startDate) }}</div>
          </div>

          <div class="info-field">
            <div class="field-label">LAST UPDATED</div>
            <div class="field-value">{{ formatDate(project.updatedAt) }}</div>
          </div>
        </div>
        
        <!-- Right Column -->
        <div class="info-column">
          <div class="info-field">
            <div class="field-label">PROJECT TYPE</div>
            <div class="field-value">{{ capitalize(project.type) }}</div>
          </div>
          
          <div class="info-field">
            <div class="field-label">PROJECT HEALTH</div>
            <div class="field-value">
              <span class="health-status" :class="getHealthIconClass(project.health)">
                <span class="material-symbols-outlined health-icon">{{ getHealthIcon(project.health) }}</span>
                {{ getHealthTitle(project.health) }}
              </span>
            </div>
          </div>
          
          <div class="info-field">
            <div class="field-label">END DATE</div>
            <div class="field-value">{{ formatDate(project.endDate) || '—' }}</div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProjectInfoCard',
  props: {
    project: {
      type: Object,
      required: true
    }
  },
  emits: ['update-project'],
  data() {
    return {
      isEditing: false,
      editableProject: {}
    }
  },
  methods: {
    startEditing() {
      // Create a deep copy of the project for editing
      this.editableProject = { ...this.project }
      this.isEditing = true
    },
    cancelEditing() {
      this.isEditing = false
      this.editableProject = {}
    },
    saveChanges() {
      // Emit the updated project data to parent
      this.$emit('update-project', this.editableProject)
      this.isEditing = false
    },
    formatDate(date) {
      if (!date) return '—'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    },
    formatBudget(budget) {
      if (!budget) return '—'
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget)
    },
    capitalize(str) {
      if (!str) return ''
      return str.charAt(0).toUpperCase() + str.slice(1)
    },
    getPhaseDisplay(phase) {
      const display = { discovery: 'Discovery & Mapping', development: 'Development', uat: 'UAT', deployment: 'Deployment' }
      return display[phase] || phase || 'Discovery & Mapping'
    },
    getPhaseClass(phase) {
      const classes = { discovery: 'phase-discovery', development: 'phase-development', uat: 'phase-uat', deployment: 'phase-deployment' }
      return classes[phase] || 'phase-discovery'
    },
    getHealthIconClass(health) {
      const classes = { healthy: 'health-healthy', 'at-risk': 'health-risk', caution: 'health-caution' }
      return classes[health] || 'health-healthy'
    },
    getHealthIcon(health) {
      const icons = { healthy: 'check_circle', 'at-risk': 'error', caution: 'pending' }
      return icons[health] || 'check_circle'
    },
    getHealthTitle(health) {
      const titles = { healthy: 'ON TRACK', 'at-risk': 'AT RISK', caution: 'CAUTION' }
      return titles[health] || 'ON TRACK'
    },
    getProjectStatusText(status) {
      const statusMap = {
        'active': 'Active',
        'pending': 'Pending',
        'on_hold': 'On Hold',
        'completed': 'Completed',
        'cancelled': 'Cancelled',
        'archived': 'Archived'
      }
      return statusMap[status] || 'Active'
    },
    getProjectStatusClass(status) {
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
  }
}
</script>

<style scoped>
/* Existing styles from original ProjectInfoCard, plus new edit mode styles */
.project-info-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
}

.dark .project-info-card {
  background: #1e293b;
  border-color: #334155;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.dark .card-header {
  border-bottom-color: #334155;
}

.card-title {
  font-size: 18px;
  font-weight: 900;
  color: #1e293b;
  margin: 0;
}

.dark .card-title {
  color: #f1f5f9;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .save-btn, .cancel-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.dark .edit-btn, .dark .save-btn, .dark .cancel-btn {
  border-color: #334155;
  color: #94a3b8;
}

.edit-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
  background: #f8fafc;
}

.save-btn {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.save-btn:hover {
  background: #059669;
  border-color: #059669;
}

.cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fef2f2;
}

.dark .edit-btn:hover {
  background: #0f172a;
}

.dark .save-btn {
  background: #059669;
  border-color: #059669;
}

.dark .save-btn:hover {
  background: #047857;
}

.dark .cancel-btn:hover {
  background: #7f1d1d;
  border-color: #ef4444;
  color: #fca5a5;
}

.edit-btn .material-symbols-outlined,
.save-btn .material-symbols-outlined,
.cancel-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Edit Mode Styles */
.edit-mode {
  padding: 20px 24px;
}

.edit-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group.full-width {
  grid-column: span 2;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* Display Mode Styles (unchanged from original) */
.top-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 20px 24px;
}

.dark .top-row {
  border-bottom-color: #334155;
}

.description-section {
  padding: 20px 24px;
}

.dark .description-section {
  border-bottom-color: #334155;
}

.description-text {
  line-height: 1.5;
  color: #475569;
  margin-top: 8px;
}

.dark .description-text {
  color: #94a3b8;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 20px 24px;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.info-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #94a3b8;
}

.dark .field-label {
  color: #64748b;
}

.field-value {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.4;
}

.dark .field-value {
  color: #cbd5e1;
}

.client-name {
  font-weight: 600;
}

.phase-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.phase-bullet {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.phase-discovery { background: #4f46e5; }
.phase-development { background: #059669; }
.phase-uat { background: #d97706; }
.phase-deployment { background: #db2777; }

.health-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.health-icon {
  font-size: 16px;
}

.health-healthy { color: #10b981; }
.health-risk { color: #ef4444; }
.health-caution { color: #f59e0b; }

.status-active { background: #d1fae5; color: #059669; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-on-hold { background: #fee2e2; color: #dc2626; }
.status-completed { background: #dbeafe; color: #2563eb; }
.status-cancelled { background: #f1f5f9; color: #64748b; }
.status-archived { background: #f3e8ff; color: #9333ea; }

.dark .status-active { background: #064e3b; color: #34d399; }
.dark .status-pending { background: #78350f; color: #fbbf24; }
.dark .status-on-hold { background: #7f1d1d; color: #fca5a5; }
.dark .status-completed { background: #1e3a8a; color: #60a5fa; }
.dark .status-cancelled { background: #1e293b; color: #94a3b8; }
.dark .status-archived { background: #4c1d95; color: #c084fc; }

/* Responsive */
@media (max-width: 992px) {
  .top-row, .info-grid {
    gap: 30px;
  }
}

@media (max-width: 768px) {
  .top-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .card-header {
    padding: 16px 20px;
  }
  
  .top-row, .description-section, .info-grid, .edit-mode {
    padding: 16px 20px;
  }
  
  .edit-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .form-group.full-width {
    grid-column: span 1;
  }
}

@media (max-width: 576px) {
  .card-title {
    font-size: 16px;
  }
  
  .edit-btn, .save-btn, .cancel-btn {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .field-label {
    font-size: 10px;
  }
  
  .field-value {
    font-size: 13px;
  }
  
  .info-column {
    gap: 16px;
  }
}
</style>