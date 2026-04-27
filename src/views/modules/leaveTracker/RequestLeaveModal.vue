<template>
  <!-- Modal Overlay -->
  <div v-if="show" class="modal-overlay" @click="closeModal">
    <div class="modal-container" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="flex items-center gap-4">
            <h1 class="modal-title">Create New Request</h1>
        </div>
        <button @click="closeModal" class="close-btn">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <div class="request-form-grid">
          <!-- Left Column - Main Form -->
          <div class="form-main-column">
            <div class="request-form-card">
              <!-- 1. Request Type -->
              <div class="form-section">
                <label class="section-label">1. Request Type</label>
                <div class="type-grid">
                  <div v-for="type in leaveTypes" :key="type.id" 
                       class="type-tile" 
                       :class="{ 'type-tile-active': selectedType === type.id, 'type-tile-inactive': selectedType !== type.id }"
                       @click="selectType(type.id)">
                    <span class="material-symbols-outlined">{{ type.icon }}</span>
                    <span class="type-name">{{ type.name }}</span>
                  </div>
                </div>
              </div>

              <!-- 2. Period Selection -->
              <div class="form-section">
                <label class="section-label">2. Period Selection</label>
                
                <!-- Leave Duration Type -->
                <div class="duration-type-selector">
                  <div class="duration-type-options">
                    <div v-for="durationType in durationTypes" :key="durationType.id"
                         class="duration-type-option"
                         :class="{ 'duration-type-active': leaveDurationType === durationType.id }"
                         @click="selectDurationType(durationType.id)">
                      <span class="duration-type-icon">{{ durationType.icon }}</span>
                      <span class="duration-type-label">{{ durationType.label }}</span>
                    </div>
                  </div>
                </div>

                <!-- Date Selection - Show for Full Day -->
                <div v-if="leaveDurationType === 'full-day'" class="date-selection-grid">
                  <div class="date-field">
                    <label class="field-label">Start Date</label>
                    <div class="date-input-wrapper">
                      <span class="material-symbols-outlined">calendar_today</span>
                      <input v-model="startDate" type="date" class="date-input" @change="calculateDuration" />
                    </div>
                  </div>
                  <div class="date-field">
                    <label class="field-label">End Date</label>
                    <div class="date-input-wrapper">
                      <span class="material-symbols-outlined">calendar_today</span>
                      <input v-model="endDate" type="date" class="date-input" @change="calculateDuration" />
                    </div>
                  </div>
                </div>

                <!-- Single Date Selection - Show for Half Day -->
                <div v-if="leaveDurationType === 'half-day'" class="date-selection-single">
                  <div class="date-field">
                    <label class="field-label">Date</label>
                    <div class="date-input-wrapper">
                      <span class="material-symbols-outlined">calendar_today</span>
                      <input v-model="startDate" type="date" class="date-input" @change="calculateDuration" />
                    </div>
                  </div>
                  
                  <!-- Half Day Session Selection -->
                  <div class="half-day-session">
                    <label class="field-label">Session</label>
                    <div class="session-options">
                      <div class="session-option"
                           :class="{ 'session-active': selectedSession === 'morning' }"
                           @click="selectSession('morning')">
                        <span class="material-symbols-outlined">brightness_5</span>
                        <span>Morning</span>
                        <span class="session-time">(8am - 12pm)</span>
                      </div>
                      <div class="session-option"
                           :class="{ 'session-active': selectedSession === 'afternoon' }"
                           @click="selectSession('afternoon')">
                        <span class="material-symbols-outlined">brightness_6</span>
                        <span>Afternoon</span>
                        <span class="session-time">(1pm - 5pm)</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Duration Summary -->
                <div v-if="durationValue > 0" class="duration-summary">
                  <div class="duration-info">
                    <span class="material-symbols-outlined">info</span>
                    <span>Duration Summary</span>
                  </div>
                  <span class="duration-value">
                    Total: {{ durationValue }} {{ leaveDurationType === 'half-day' ? 'Half Day' : 'Business Day' }}{{ durationValue !== 1 ? 's' : '' }}
                  </span>
                </div>
              </div>

              <!-- 3. Project Context -->
              <div class="form-section">
                <label class="section-label">3. Project Context</label>
                <select v-model="selectedProject" class="project-select">
                  <option value="">Select related project (Optional)</option>
                  <option v-for="project in projects" :key="project" :value="project">{{ project }}</option>
                </select>
              </div>

              <!-- 4. Notes / Reason -->
              <div class="form-section">
                <label class="section-label">4. Notes / Reason</label>
                <div class="notes-editor">
                  <div class="editor-toolbar">
                    <button class="toolbar-btn"><span class="material-symbols-outlined">format_bold</span></button>
                    <button class="toolbar-btn"><span class="material-symbols-outlined">format_italic</span></button>
                    <button class="toolbar-btn"><span class="material-symbols-outlined">format_list_bulleted</span></button>
                  </div>
                  <textarea v-model="notes" class="notes-textarea" placeholder="Provide details about your leave request..."></textarea>
                </div>
              </div>

              <!-- 5. Notify Colleagues -->
              <div class="form-section">
                <label class="section-label">5. Notify Colleagues</label>
                <div class="team-tags">
                  <span v-for="member in selectedMembers" :key="member.id" class="team-tag">
                    {{ member.name }} <button @click="removeMember(member.id)" class="tag-remove-btn">
                      <span class="material-symbols-outlined">close</span>
                    </button>
                  </span>
                  <button @click="showMemberSelector = true" class="add-member-btn">
                    <span class="material-symbols-outlined">add</span> Add Team Member
                  </button>
                </div>
                <p class="notification-note">Automated OOO alerts will be sent to selected members upon approval.</p>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="form-actions">
              <button @click="closeModal" class="cancel-btn">Cancel</button>
              <button @click="submitRequest" :disabled="!isFormValid" class="submit-btn" :class="{ 'btn-disabled': !isFormValid }">
                Submit Request
              </button>
            </div>
          </div>

          <!-- Right Column - Sidebar -->
          <div class="form-sidebar">
            <!-- Balance Check -->
            <div class="sidebar-card balance-card">
              <h4 class="sidebar-card-title">Balance Check</h4>
              <div class="balance-details">
                <div class="balance-row">
                  <span>Current Balance</span>
                  <span>{{ annualBalance }} Days</span>
                </div>
                <div v-if="durationDays > 0" class="balance-row deduction-row">
                  <span class="italic">This Request</span>
                  <span>- {{ formattedDeduction }}</span>
                </div>
                <div class="balance-row total-row">
                  <span>Projected After</span>
                  <span class="total-value">{{ projectedBalance }} Days</span>
                </div>
              </div>
            </div>

            <!-- Team Overlap -->
            <div v-if="teamConflicts.length > 0" class="sidebar-card conflict-card">
              <div class="conflict-header">
                <h4 class="sidebar-card-title">Team Overlap</h4>
                <span class="conflict-badge">Conflict Warning</span>
              </div>
              <p class="conflict-subtitle">Colleagues away during {{ formattedDateRange }}:</p>
              <div class="conflict-list">
                <div v-for="conflict in teamConflicts" :key="conflict.id" class="conflict-item">
                  <div class="conflict-member">
                    <div class="member-avatar" :style="{ backgroundImage: `url('${conflict.avatar}')` }"></div>
                    <div class="member-info">
                      <p class="member-name">{{ conflict.name }}</p>
                      <p class="member-leave-type">{{ conflict.leaveType }}</p>
                    </div>
                  </div>
                  <span class="conflict-duration">{{ conflict.duration }}</span>
                </div>
              </div>
            </div>

            <!-- Request Guidelines -->
            <div class="sidebar-card guidelines-card">
              <div class="guidelines-header">
                <span class="material-symbols-outlined">menu_book</span>
                <h4 class="sidebar-card-title">Request Guidelines</h4>
              </div>
              <ul class="guidelines-list">
                <li v-for="guideline in guidelines" :key="guideline" class="guideline-item">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>{{ guideline }}</span>
                </li>
                <li class="guideline-item">
                  <span class="material-symbols-outlined">check_circle</span>
                  <span>Half-day leave must be requested before 10am for morning session or before 2pm for afternoon session.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Team Member Selector Modal (nested) -->
    <div v-if="showMemberSelector" class="modal-overlay" @click="showMemberSelector = false">
      <div class="member-selector-modal" @click.stop>
        <div class="member-selector-header">
          <h3>Select Team Members</h3>
          <button @click="showMemberSelector = false" class="close-btn">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="member-list">
          <div v-for="member in availableMembers" :key="member.id" 
               class="member-selector-item"
               @click="toggleMemberSelection(member.id)">
            <div class="member-selector-info">
              <div class="member-avatar" :style="{ backgroundImage: `url('${member.avatar}')` }"></div>
              <div>
                <p class="member-name">{{ member.name }}</p>
                <p class="member-role">{{ member.role }}</p>
              </div>
            </div>
            <span v-if="isMemberSelected(member.id)" class="material-symbols-outlined selected-icon">check_circle</span>
          </div>
        </div>
        <div class="member-selector-actions">
          <button @click="showMemberSelector = false" class="cancel-btn">Cancel</button>
          <button @click="saveSelectedMembers" class="submit-btn">Add Selected</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RequestLeaveModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    annualBalance: {
      type: Number,
      default: 18
    },
    teamMembers: {
      type: Array,
      default: () => []
    },
    leaveTypeOptions: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      selectedType: 'annual',
      startDate: this.getDefaultStartDate(),
      endDate: this.getDefaultEndDate(),
      leaveDurationType: 'full-day',
      selectedSession: 'morning',
      durationValue: 1,
      selectedProject: '',
      notes: '',
      selectedMembers: [
        { id: 1, name: 'Sarah L.' },
        { id: 2, name: 'Jordan S.' }
      ],
      showMemberSelector: false,
      tempSelectedMembers: [],
      
      // 如果没有从父组件传入，使用默认配置
      leaveTypes: this.leaveTypeOptions.length > 0 ? this.leaveTypeOptions : [
        { id: 'annual', name: 'Annual Leave', icon: 'beach_access' },
        { id: 'medical', name: 'Medical Leave', icon: 'medical_services' },
        { id: 'compassionate', name: 'Compassionate Leave', icon: 'favorite' },
        { id: 'onsite', name: 'Onsite Plan', icon: 'location_on' },
        { id: 'wfh', name: 'Work From Home', icon: 'home' },
        { id: 'emergency', name: 'Emergency Leave', icon: 'warning' },
        { id: 'brought-forward', name: 'Brought Forward', icon: 'event_available' },
        { id: 'maternity', name: 'Maternity Leave', icon: 'pregnant_woman' },
        { id: 'parental', name: 'Parental Leave', icon: 'family_restroom' }
      ],
      
      // Duration types
      durationTypes: [
        { id: 'full-day', label: 'Full Day', icon: 'event' },
        { id: 'half-day', label: 'Half Day', icon: 'schedule' }
      ],
      
      // Projects
      projects: [
        'Internal Admin Tasks',
        'Global Expansion Q2',
        'Client: TechFlow Pro'
      ],
      
      // Team conflicts
      teamConflicts: [
        {
          id: 1,
          name: 'Jordan S.',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBYa098ZgA87OaTfpXOaaF_dNwKSFPH3hXned3X8tVSd6godLcNOJ6FiropkoRUzjTpUz8M9vXP0_aajI8Ws_yyVAZ8b_LyzEb3BYZTmlk0vlKwLEx9IR2Szm945ASuNZeWLDpSFecD6X6dJ1ljpvtLjWcn3gUM-IyqQY_Mx7Ajkq-GcsTCcWGZyNntxPhBXlVQubeicdeoAwt7K4vR4yTWGakOOdQ-IxckYqNHY1DwYaUR_PsmmMO9QvEfWO_rvQmGXqLAdzXAoOg',
          leaveType: 'Annual Leave',
          duration: 'Full Period'
        },
        {
          id: 2,
          name: 'Sarah L.',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAgd5-czZRdAL-cxmeFilWrUqm9HOtKSQTZyy7oslrvmQyVshiDPeGtQE6Lzm-UYsvq231_mY5Q2KBVsmT12HsG25DrHeTbRhxhF8tE9PQCzb2pchfk_ntsUL7h9jdXxrxHdLmZunjyAn_QBuHj_5mjRa9bvkcEa5LgnBQSEfl4ktcLq0hmmGFmS8svbpEk6AzULMmzHgP4BWzyUGtR4clCX-Tt9axGqSeuFVsBajqrw2Ni_aCavHq3AZwMQSE3hMk3kNYT7kH1UY4',
          leaveType: 'Onsite: London',
          duration: 'Apr 12 Only'
        }
      ],
      
      // Guidelines
      guidelines: [
        'Submit requests 7 days in advance for team planning.',
        'Annual leave over 5 days requires manager 1:1.',
        'Emergency leave requires immediate manager notification.',
        'WFH requests should include project justification.'
      ],
      
      // Available team members
      availableMembers: [
        { id: 1, name: 'Sarah L.', role: 'Project Manager', avatar: 'https://randomuser.me/api/portraits/women/44.jpg' },
        { id: 2, name: 'Jordan S.', role: 'Senior Developer', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
        { id: 3, name: 'Alex R.', role: 'UX Designer', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
        { id: 4, name: 'Emma W.', role: 'Product Owner', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
        { id: 5, name: 'David K.', role: 'QA Engineer', avatar: 'https://randomuser.me/api/portraits/men/45.jpg' }
      ]
    }
  },
  computed: {
    isFormValid() {
      if (this.leaveDurationType === 'half-day') {
        return this.selectedType && this.startDate && this.selectedSession;
      } else {
        return this.selectedType && this.startDate && this.endDate && this.durationValue > 0;
      }
    },
    
    // Calculate actual days for balance calculation (half-day = 0.5 days)
    durationDays() {
      if (this.leaveDurationType === 'half-day') {
        return 0.5;
      } else {
        return this.durationValue;
      }
    },
    
    projectedBalance() {
      return Math.max(0, this.annualBalance - this.durationDays);
    },
    
    formattedDateRange() {
      if (!this.startDate) return '';
      
      if (this.leaveDurationType === 'half-day') {
        const date = new Date(this.startDate);
        const sessionText = this.selectedSession === 'morning' ? 'Morning' : 'Afternoon';
        return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${sessionText})`;
      } else {
        if (!this.endDate) return '';
        const start = new Date(this.startDate);
        const end = new Date(this.endDate);
        return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      }
    },
    
    formattedDeduction() {
      if (this.leaveDurationType === 'half-day') {
        return '0.5 Day';
      } else {
        return `${this.durationValue} Day${this.durationValue !== 1 ? 's' : ''}`;
      }
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        document.body.style.overflow = 'hidden';
        this.tempSelectedMembers = [...this.selectedMembers.map(m => m.id)];
      } else {
        document.body.style.overflow = '';
      }
    },
    
    // 监听 leaveTypeOptions 变化
    leaveTypeOptions: {
      handler(newOptions) {
        if (newOptions && newOptions.length > 0) {
          this.leaveTypes = newOptions;
        }
      },
      immediate: true
    },
    
    leaveDurationType(newType) {
      if (newType === 'half-day') {
        this.endDate = this.startDate;
        this.durationValue = 1;
      } else {
        this.calculateDuration();
      }
    },
    
    startDate() {
      this.calculateDuration();
    },
    
    endDate() {
      this.calculateDuration();
    }
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },
    
    getDefaultStartDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },
    
    getDefaultEndDate() {
      const today = new Date();
      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(today.getDate() + 3);
      return threeDaysLater.toISOString().split('T')[0];
    },
    
    selectType(typeId) {
      this.selectedType = typeId;
    },
    
    selectDurationType(durationType) {
      this.leaveDurationType = durationType;
    },
    
    selectSession(session) {
      this.selectedSession = session;
    },
    
    calculateDuration() {
      if (this.leaveDurationType === 'half-day') {
        this.durationValue = 1;
        return;
      }
      
      if (!this.startDate || !this.endDate) {
        this.durationValue = 0;
        return;
      }
      
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      
      if (end < start) {
        this.endDate = this.startDate;
        this.durationValue = 1;
        return;
      }
      
      // Calculate business days (excluding weekends)
      let count = 0;
      const current = new Date(start);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      this.durationValue = Math.max(1, count);
    },
    
    toggleMemberSelection(memberId) {
      const index = this.tempSelectedMembers.indexOf(memberId);
      if (index === -1) {
        this.tempSelectedMembers.push(memberId);
      } else {
        this.tempSelectedMembers.splice(index, 1);
      }
    },
    
    isMemberSelected(memberId) {
      return this.tempSelectedMembers.includes(memberId);
    },
    
    saveSelectedMembers() {
      this.selectedMembers = this.availableMembers
        .filter(member => this.tempSelectedMembers.includes(member.id))
        .map(member => ({ id: member.id, name: member.name }));
      this.showMemberSelector = false;
    },
    
    removeMember(memberId) {
      this.selectedMembers = this.selectedMembers.filter(m => m.id !== memberId);
    },
    
    submitRequest() {
      if (!this.isFormValid) return;
      
      const requestData = {
        type: this.selectedType,
        startDate: this.startDate,
        endDate: this.leaveDurationType === 'half-day' ? this.startDate : this.endDate,
        durationType: this.leaveDurationType,
        duration: this.durationDays, // Actual days (0.5 for half-day)
        displayDuration: this.durationValue, // Display value (1 for half-day)
        session: this.leaveDurationType === 'half-day' ? this.selectedSession : null,
        project: this.selectedProject,
        notes: this.notes,
        notifyMembers: this.selectedMembers.map(m => m.id),
        submittedAt: new Date().toISOString()
      };
      
      console.log('Submitting leave request:', requestData);
      
      // 发出标准化的事件，让 LeaveDashboard 可以处理
      window.dispatchEvent(new CustomEvent('leave-request-submitted', {
        detail: requestData
      }));
      
      this.$emit('submit', requestData);
      this.closeModal();
      
      // Reset form
      this.selectedType = 'annual';
      this.startDate = this.getDefaultStartDate();
      this.endDate = this.getDefaultEndDate();
      this.leaveDurationType = 'full-day';
      this.selectedSession = 'morning';
      this.durationValue = 1;
      this.selectedProject = '';
      this.notes = '';
    }
  },
  mounted() {
    this.calculateDuration();
    this.tempSelectedMembers = [...this.selectedMembers.map(m => m.id)];
  }
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-container {
  background: #f8fafc;
  width: 100%;
  max-width: 1200px;
  max-height: 90vh;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Modal Header */
.modal-header {
  background: white;
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.modal-title {
  font-size: 28px;
  font-weight: 900;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.close-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f1f5f9;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* Modal Content */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
}

.request-form-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
}

/* Form Main Column */
.form-main-column {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.request-form-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  padding: 32px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 10px -2px rgba(0, 0, 0, 0.03);
}

/* Form Sections */
.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-label {
  font-size: 12px;
  font-weight: 900;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  display: block;
  margin-bottom: 16px;
}

/* Type Grid */
.type-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.type-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid;
  transition: all 0.2s;
  cursor: pointer;
  text-align: center;
  gap: 8px;
}

.type-tile-inactive {
  border-color: #f1f5f9;
  background: white;
  color: #64748b;
}

.type-tile-inactive:hover {
  border-color: #e2e8f0;
  color: #475569;
}

.type-tile-active {
  border-color: #0f2cbd;
  background: rgba(15, 44, 189, 0.05);
  color: #0f2cbd;
}

.type-tile .material-symbols-outlined {
  font-size: 24px;
}

.type-name {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Date Selection */
.date-selection-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.date-input-wrapper {
  position: relative;
}

.date-input-wrapper .material-symbols-outlined {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
  pointer-events: none;
}

.date-input {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px 12px 40px;
  height: 48px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #0f2cbd;
  box-shadow: 0 0 0 3px rgba(15, 44, 189, 0.1);
}

/* Duration Summary */
.duration-summary {
  padding: 16px;
  background: rgba(15, 44, 189, 0.05);
  border: 1px solid rgba(15, 44, 189, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.duration-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.duration-info .material-symbols-outlined {
  color: #0f2cbd;
}

.duration-value {
  font-size: 14px;
  font-weight: 900;
  color: #0f2cbd;
}

/* Project Select */
.project-select {
  width: 100%;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px 16px;
  height: 48px;
  font-size: 14px;
  color: #1e293b;
  transition: all 0.2s;
}

.project-select:focus {
  outline: none;
  border-color: #0f2cbd;
  box-shadow: 0 0 0 3px rgba(15, 44, 189, 0.1);
}

/* Notes Editor */
.notes-editor {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.editor-toolbar {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  padding: 8px;
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: #e2e8f0;
  color: #475569;
}

.notes-textarea {
  width: 100%;
  background: white;
  border: none;
  padding: 16px;
  min-height: 120px;
  font-size: 14px;
  color: #1e293b;
  resize: vertical;
  font-family: 'Inter', sans-serif;
}

.notes-textarea:focus {
  outline: none;
}

.notes-textarea::placeholder {
  color: #94a3b8;
}

/* Team Tags */
.team-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;
}

.team-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f1f5f9;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid #e2e8f0;
}

.tag-remove-btn {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
}

.tag-remove-btn:hover {
  background: #e2e8f0;
}

.add-member-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px dashed #cbd5e1;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.add-member-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

.notification-note {
  font-size: 10px;
  color: #94a3b8;
  font-style: italic;
  margin: 0;
}

/* Form Actions */
.form-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  padding: 16px 0;
}

.cancel-btn {
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #64748b;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  color: #1e293b;
}

.submit-btn {
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  background: #1e293b;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(30, 41, 59, 0.1);
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #0f172a;
  box-shadow: 0 6px 20px rgba(30, 41, 59, 0.15);
  transform: translateY(-1px);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Sidebar */
.form-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.sidebar-card-title {
  font-size: 12px;
  font-weight: 900;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  margin: 0 0 16px 0;
}

/* Balance Card */
.balance-card {
  background: rgba(15, 44, 189, 0.05);
  border-color: rgba(15, 44, 189, 0.1);
}

.balance-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #334155;
}

.deduction-row {
  color: #f43f5e;
  font-weight: 700;
}

.total-row {
  padding-top: 16px;
  border-top: 1px solid rgba(15, 44, 189, 0.1);
  font-weight: 700;
  text-transform: uppercase;
  color: #1e293b;
}

.total-value {
  font-size: 18px;
  font-weight: 900;
  color: #0f2cbd;
}

/* Conflict Card */
.conflict-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.conflict-badge {
  padding: 2px 8px;
  border-radius: 9999px;
  background: #fef3c7;
  color: #92400e;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid #fde68a;
}

.conflict-subtitle {
  font-size: 10px;
  color: #64748b;
  margin: 0 0 16px 0;
}

.conflict-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conflict-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.conflict-member {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #e2e8f0;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.member-leave-type {
  font-size: 10px;
  color: #94a3b8;
  margin: 2px 0 0 0;
}

.conflict-duration {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  font-style: italic;
}

/* Guidelines Card */
.guidelines-card {
  background: #f8fafc;
}

.guidelines-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.guidelines-header .material-symbols-outlined {
  color: #0f2cbd;
  font-size: 20px;
}

.guidelines-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
}

.guideline-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  font-size: 12px;
  color: #475569;
}

.guideline-item .material-symbols-outlined {
  color: #3b82f6;
  font-size: 12px;
  flex-shrink: 0;
  margin-top: 2px;
}

/* Member Selector Modal */
.member-selector-modal {
  background: white;
  width: 90%;
  max-width: 400px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.member-selector-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.member-selector-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.member-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
}

.member-selector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.member-selector-item:hover {
  background: #f8fafc;
}

.member-selector-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-role {
  font-size: 11px;
  color: #64748b;
  margin: 2px 0 0 0;
}

.selected-icon {
  color: #0f2cbd;
  font-size: 20px;
}

.member-selector-actions {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

/* Duration Type Selector */
.duration-type-selector {
  margin-bottom: 20px;
}

.duration-type-options {
  display: flex;
  gap: 12px;
}

.duration-type-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.duration-type-option:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.duration-type-active {
  border-color: #0f2cbd !important;
  background: rgba(15, 44, 189, 0.05) !important;
  color: #0f2cbd;
}

.duration-type-icon {
  font-size: 20px;
  margin-bottom: 6px;
  display: block;
}

.duration-type-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Single Date Selection for Half Day */
.date-selection-single {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Half Day Session Options */
.half-day-session {
  margin-top: 8px;
}

.session-options {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.session-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 12px;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.session-option:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.session-active {
  border-color: #0f2cbd !important;
  background: rgba(15, 44, 189, 0.05) !important;
  color: #0f2cbd;
}

.session-option .material-symbols-outlined {
  font-size: 20px;
  margin-bottom: 6px;
  display: block;
}

.session-time {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
  font-weight: 500;
}

/* Update existing styles for better spacing */
.duration-summary {
  margin-top: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .duration-type-options {
    flex-direction: column;
  }
  
  .session-options {
    flex-direction: column;
  }
  
  .date-selection-single {
    gap: 16px;
  }
}

/* Responsive Design */
@media (max-width: 1024px) {
  .request-form-grid {
    grid-template-columns: 1fr;
  }
  
  .type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .modal-container {
    max-height: 95vh;
  }
  
  .modal-header {
    padding: 16px 20px;
  }
  
  .modal-content {
    padding: 20px;
  }
  
  .date-selection-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    align-items: stretch;
  }
  
  .cancel-btn,
  .submit-btn {
    width: 100%;
    text-align: center;
  }
}

@media (max-width: 480px) {
  .modal-overlay {
    padding: 10px;
  }
  
  .request-form-card {
    padding: 20px;
  }
  
  .type-grid {
    grid-template-columns: 1fr;
  }
}
</style>