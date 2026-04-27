<template>
  <div v-if="isVisible" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">Application Details</h2>
        <button class="modal-close-btn" @click="closeModal" aria-label="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content" v-if="application">
        <!-- Application Overview -->
        <div class="detail-section">
          <div class="detail-header">
            <div class="application-type-badge" :class="getTypeClass(application.type)">
              <span class="material-symbols-outlined">{{ getIcon(application.type) }}</span>
              <span>{{ getApplicationTypeDisplay(application.type) }}</span>
            </div>
            <span class="status-badge" :class="getStatusClass(application.status)">
              {{ getStatusDisplay(application.status) }}
            </span>
          </div>
          
          <div class="detail-grid">
            <!-- Dates Section -->
            <div class="detail-item">
              <span class="detail-label">
                <span class="material-symbols-outlined">calendar_month</span>
                Dates
              </span>
              <span class="detail-value">{{ formatDateRange(application.startDate, application.endDate) }}</span>
            </div>

            <!-- Duration -->
            <div class="detail-item">
              <span class="detail-label">
                <span class="material-symbols-outlined">schedule</span>
                Duration
              </span>
              <span class="detail-value">{{ application.days }} day{{ application.days > 1 ? 's' : '' }}</span>
            </div>

            <!-- Applied On -->
            <div class="detail-item">
              <span class="detail-label">
                <span class="material-symbols-outlined">event_available</span>
                Applied On
              </span>
              <span class="detail-value">{{ formatDate(application.createdDate || application.startDate) }}</span>
            </div>

            <!-- Category -->
            <div class="detail-item">
              <span class="detail-label">
                <span class="material-symbols-outlined">category</span>
                Category
              </span>
              <span class="detail-value">{{ getLeaveCategory(application.type) }}</span>
            </div>

            <!-- Reason -->
            <div class="detail-item full-width">
              <span class="detail-label">
                <span class="material-symbols-outlined">description</span>
                Reason
              </span>
              <div class="detail-value reason-text">{{ application.reason || 'No reason provided' }}</div>
            </div>

            <!-- Notes (if any) -->
            <div v-if="application.notes" class="detail-item full-width">
              <span class="detail-label">
                <span class="material-symbols-outlined">note</span>
                Additional Notes
              </span>
              <div class="detail-value notes-text">{{ application.notes }}</div>
            </div>

            <!-- Approver/Comments (if any) -->
            <div v-if="application.approver || application.comments" class="detail-item full-width">
              <span class="detail-label">
                <span class="material-symbols-outlined">person</span>
                Approval Details
              </span>
              <div class="approval-details">
                <div v-if="application.approver" class="approver-info">
                  <span>Approved by: {{ application.approver }}</span>
                  <span v-if="application.approvedDate">on {{ formatDate(application.approvedDate) }}</span>
                </div>
                <div v-if="application.comments" class="approver-comments">
                  <strong>Comments:</strong> {{ application.comments }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-section" v-if="application.timeline && application.timeline.length">
          <h3 class="timeline-title">Application Timeline</h3>
          <div class="timeline">
            <div v-for="(event, index) in application.timeline" :key="index" class="timeline-event">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-date">{{ formatDate(event.date) }}</div>
                <div class="timeline-action">{{ event.action }}</div>
                <div v-if="event.by" class="timeline-by">by {{ event.by }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeModal">Close</button>
          <button v-if="application.status === 'pending'" 
                  class="btn-primary" 
                  @click="editApplication">
            <span class="material-symbols-outlined">edit</span>
            Edit Application
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else class="modal-loading">
        <span class="material-symbols-outlined spin">refresh</span>
        Loading details...
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ApplicationDetailsModal',
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    application: {
      type: Object,
      default: null
    },
    // Optional utility functions
    getApplicationTypeDisplay: {
      type: Function,
      default: (type) => type
    },
    getStatusDisplay: {
      type: Function,
      default: (status) => status
    },
    getIcon: {
      type: Function,
      default: () => 'help'
    },
    getTypeClass: {
      type: Function,
      default: () => ''
    },
    getStatusClass: {
      type: Function,
      default: () => ''
    },
    getLeaveCategory: {
      type: Function,
      default: () => ''
    },
    formatDate: {
      type: Function,
      default: (date) => date
    },
    formatDateRange: {
      type: Function,
      default: (start, end) => `${start} - ${end}`
    }
  },
  emits: ['close', 'edit'],
  methods: {
    closeModal() {
      this.$emit('close');
    },
    editApplication() {
      this.$emit('edit', this.application);
      this.closeModal();
    }
  },
  watch: {
    isVisible(newVal) {
      if (newVal) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }
};
</script>

<style scoped>
/* Modal Overlay */
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

/* Modal Container */
.modal-container {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
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

.detail-section {
  padding: 24px;
}

.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.application-type-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  border-radius: 20px;
  font-weight: 500;
  color: #334155;
}

.application-type-badge .material-symbols-outlined {
  font-size: 18px;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.approved {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-badge.cancelled {
  background: #f1f5f9;
  color: #475569;
}

/* Detail Grid */
.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.detail-item.full-width {
  grid-column: 1 / -1;
}

.detail-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
}

.detail-label .material-symbols-outlined {
  font-size: 16px;
  color: #94a3b8;
}

.detail-value {
  font-size: 15px;
  color: #1e293b;
  font-weight: 400;
  line-height: 1.5;
}

.reason-text,
.notes-text {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 4px;
  white-space: pre-line;
}

/* Approval Details */
.approval-details {
  background: #f8fafc;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  margin-top: 8px;
}

.approver-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #475569;
  margin-bottom: 8px;
}

.approver-comments {
  font-size: 14px;
  color: #475569;
  line-height: 1.5;
}

/* Timeline */
.timeline-section {
  padding: 24px;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.timeline-title {
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  margin-bottom: 16px;
}

.timeline {
  position: relative;
  padding-left: 20px;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #cbd5e1;
}

.timeline-event {
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.timeline-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid white;
  position: absolute;
  left: -22px;
  top: 2px;
  z-index: 1;
}

.timeline-content {
  flex: 1;
}

.timeline-date {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
}

.timeline-action {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

.timeline-by {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Modal Actions */
.modal-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  background: white;
}

.modal-actions button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
}

.btn-secondary:hover {
  background: #e2e8f0;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-outline {
  background: white;
  color: #3b82f6;
  border: 1px solid #3b82f6 !important;
}

.btn-outline:hover {
  background: #eff6ff;
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

.spin {
  animation: spin 1s linear infinite;
  font-size: 32px;
  color: #3b82f6;
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
  
  .modal-actions {
    flex-direction: column;
  }
  
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>