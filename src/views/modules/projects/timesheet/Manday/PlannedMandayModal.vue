<template>
  <Teleport to="body">
    <!-- Main Modal -->
    <div v-if="show" class="prmpt-modal-overlay" @click="closeModal">
      <div class="prmpt-modal-container planned-manday-modal-container" @click.stop>
        <!-- Modal Header -->
        <div class="prmpt-modal-header info">
          <span class="material-symbols-outlined prmpt-modal-icon">edit_calendar</span>
          <h3 class="prmpt-modal-title">Planned Mandays</h3>
          <button class="close-btn" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="prmpt-modal-body planned-manday-modal-body">
          <!-- Validation Summary -->
          <div v-if="hasAnyValidationError" class="validation-summary">
            <div class="validation-message warning">
              <span class="material-symbols-outlined">warning</span>
              <span>Total adjusted mandays must equal original planned total for each milestone. Please adjust the values below.</span>
            </div>
          </div>

          <!-- Team Member Manday Table for All Milestones -->
          <div class="manday-allocation-section">
            <h4 class="section-title">
              <span class="material-symbols-outlined">group</span>
              Team Member Allocation
            </h4>

            <!-- Member Manday Tables for Each Milestone -->
            <div v-for="milestone in milestones" :key="milestone.id" class="milestone-table-card">
              <div class="milestone-table-header">
                <h5>Milestone: {{ milestone.name }}</h5>
              </div>
              <div class="table-responsive">
                <table class="manday-table">
                  <thead>
                    <tr class="table-header-row">
                      <th class="col-member">Team Member</th>
                      <th class="col-role">Role</th>
                      <th class="col-original">Original Manday</th>
                      <th class="col-manday">Adjusted Manday</th>
                      <th class="col-variance">Different</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="member in teamMembers" :key="member.id" class="member-row">
                      <td class="col-member">
                        <div class="member-info">
                          <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                            {{ member.initials }}
                          </div>
                          <span class="member-name">{{ member.name }}</span>
                        </div>
                      </td>
                      <td class="col-role">
                        <span class="role-badge">{{ member.role || 'Team Member' }}</span>
                      </td>
                      <td class="col-original">
                        <span class="original-value">{{ getOriginalMandayValue(member.id, milestone.id) }}</span>
                      </td>
                      <td class="col-manday">
                        <div class="manday-input-wrapper">
                          <input 
                            type="number" 
                            :value="getMandayValue(member.id, milestone.id)"
                            @input="updateMandayWithValidation(member.id, milestone.id, $event.target.value)"
                            class="manday-input"
                            :class="{ 
                              'has-value': getMandayValue(member.id, milestone.id) > 0,
                              'error': getMilestoneTotal(milestone.id) !== getMilestoneOriginalTotal(milestone.id)
                            }"
                            min="0"
                            step="0.5"
                            placeholder="0"
                          />
                          <span class="manday-unit">days</span>
                        </div>
                      </td>
                      <td class="col-variance">
                        <span :class="['variance-badge', getVarianceClass(member.id, milestone.id)]">
                          {{ getVariance(member.id, milestone.id) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="total-row">
                      <td colspan="2" class="total-label">Total</td>
                      <td class="col-original">
                        <strong>{{ getMilestoneOriginalTotal(milestone.id) }}</strong>
                      </td>
                      <td class="col-manday">
                        <strong :class="{ 'text-warning': getMilestoneTotal(milestone.id) !== getMilestoneOriginalTotal(milestone.id) }">
                          {{ getMilestoneTotal(milestone.id) }}
                        </strong>
                      </td>
                      <td class="col-variance">
                        <strong :class="getMilestoneVarianceClass(milestone.id)">
                          {{ getMilestoneVariance(milestone.id) }}
                        </strong>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="action-buttons-section">
            <div class="action-buttons-group">
              <button class="plan-action-btn" @click="resetToOriginal">
                <span class="material-symbols-outlined">restore</span>
                Reset to Original
              </button>
              <button class="plan-action-btn" @click="distributeEqually">
                <span class="material-symbols-outlined">equalizer</span>
                Distribute Equally
              </button>
              <button class="plan-action-btn secondary" @click="resetAllMandays">
                <span class="material-symbols-outlined">restart_alt</span>
                Reset All to Zero
              </button>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="prmpt-modal-footer">
          <div class="footer-left">
            <span class="info-text">⚠️ Total adjusted mandays per milestone must equal the original total</span>
          </div>
          <div class="footer-right">
            <button class="prmpt-modal-btn prmpt-cancel-btn" @click="closeModal">
              Cancel
            </button>
            <button class="prmpt-modal-btn prmpt-save-btn" @click="saveAllMandays" :disabled="hasAnyValidationError">
              <span class="material-symbols-outlined">save</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Success/Error Toast - Separate Teleport to ensure it's on top -->
    <Teleport to="body">
      <div v-if="showToast" :class="['toast-notification', toastType]">
        <span class="material-symbols-outlined">{{ toastType === 'success' ? 'check_circle' : 'error' }}</span>
        <span>{{ toastMessage }}</span>
      </div>
    </Teleport>
  </Teleport>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue'

export default {
  name: 'PlannedMandayModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    milestones: {
      type: Array,
      required: true,
      default: () => []
    },
    teamMembers: {
      type: Array,
      required: true,
      default: () => []
    },
    projectId: {
      type: [String, Number],
      default: null
    },
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'update:data', 'save'],
  setup(props, { emit }) {
    // State declarations
    const allocations = ref({})
    const originalAllocations = ref({})
    const showToast = ref(false)
    const toastMessage = ref('')
    const toastType = ref('success')

    // Initialize empty allocations
    const initEmptyAllocations = () => {
      const newAllocations = {}
      const newOriginalAllocations = {}
      
      props.teamMembers.forEach(member => {
        newAllocations[member.id] = {}
        newOriginalAllocations[member.id] = {}
        props.milestones.forEach(milestone => {
          const existingAssignment = milestone.assignments?.find(a => a.memberId === member.id)
          const value = existingAssignment?.plannedMandays || 0
          newAllocations[member.id][milestone.id] = value
          newOriginalAllocations[member.id][milestone.id] = value
        })
      })
      allocations.value = newAllocations
      originalAllocations.value = newOriginalAllocations
    }

    // Load data from props or localStorage
    const loadData = () => {
      if (props.initialData && Object.keys(props.initialData).length > 0) {
        allocations.value = { ...props.initialData }
        // Store original allocations
        const newOriginal = {}
        props.teamMembers.forEach(member => {
          newOriginal[member.id] = {}
          props.milestones.forEach(milestone => {
            newOriginal[member.id][milestone.id] = allocations.value[member.id]?.[milestone.id] || 0
          })
        })
        originalAllocations.value = newOriginal
        return
      }

      if (props.projectId) {
        const saved = localStorage.getItem(`planned_mandays_${props.projectId}`)
        if (saved) {
          try {
            allocations.value = JSON.parse(saved)
            const newOriginal = {}
            props.teamMembers.forEach(member => {
              newOriginal[member.id] = {}
              props.milestones.forEach(milestone => {
                newOriginal[member.id][milestone.id] = allocations.value[member.id]?.[milestone.id] || 0
              })
            })
            originalAllocations.value = newOriginal
            return
          } catch (e) {
            console.error('Error loading saved mandays:', e)
          }
        }
      }

      initEmptyAllocations()
    }

    // Save to localStorage
    const saveToLocalStorage = () => {
      if (props.projectId) {
        localStorage.setItem(`planned_mandays_${props.projectId}`, JSON.stringify(allocations.value))
      }
    }

    // Get original manday value
    const getOriginalMandayValue = (memberId, milestoneId) => {
      return originalAllocations.value[memberId]?.[milestoneId] || 0
    }

    // Get current manday value
    const getMandayValue = (memberId, milestoneId) => {
      return allocations.value[memberId]?.[milestoneId] || 0
    }

    // Get total for a milestone (current)
    const getMilestoneTotal = (milestoneId) => {
      let total = 0
      Object.values(allocations.value).forEach(memberAlloc => {
        total += memberAlloc[milestoneId] || 0
      })
      return total
    }

    // Get original total for a milestone
    const getMilestoneOriginalTotal = (milestoneId) => {
      let total = 0
      Object.values(originalAllocations.value).forEach(memberAlloc => {
        total += memberAlloc[milestoneId] || 0
      })
      return total
    }

    // Get variance for a member-milestone
    const getVariance = (memberId, milestoneId) => {
      const current = getMandayValue(memberId, milestoneId)
      const original = getOriginalMandayValue(memberId, milestoneId)
      const diff = current - original
      if (diff > 0) return `+${diff}`
      if (diff < 0) return `${diff}`
      return '0'
    }

    // Get variance class
    const getVarianceClass = (memberId, milestoneId) => {
      const current = getMandayValue(memberId, milestoneId)
      const original = getOriginalMandayValue(memberId, milestoneId)
      if (current > original) return 'variance-positive'
      if (current < original) return 'variance-negative'
      return 'variance-zero'
    }

    // Get milestone variance
    const getMilestoneVariance = (milestoneId) => {
      const current = getMilestoneTotal(milestoneId)
      const original = getMilestoneOriginalTotal(milestoneId)
      const diff = current - original
      if (diff > 0) return `+${diff}`
      if (diff < 0) return `${diff}`
      return '0'
    }

    // Get milestone variance class
    const getMilestoneVarianceClass = (milestoneId) => {
      const current = getMilestoneTotal(milestoneId)
      const original = getMilestoneOriginalTotal(milestoneId)
      if (current > original) return 'text-warning'
      if (current < original) return 'text-info'
      return ''
    }

    // Check if any milestone has validation error
    const hasAnyValidationError = computed(() => {
      for (const milestone of props.milestones) {
        if (getMilestoneTotal(milestone.id) !== getMilestoneOriginalTotal(milestone.id)) {
          return true
        }
      }
      return false
    })

    // Update manday with validation - ensures total per milestone stays within original total
    const updateMandayWithValidation = (memberId, milestoneId, value) => {
      const numValue = parseFloat(value) || 0
      const originalTotal = getMilestoneOriginalTotal(milestoneId)
      const currentTotal = getMilestoneTotal(milestoneId)
      const oldValue = getMandayValue(memberId, milestoneId)
      
      // Calculate new total if this change is applied
      const newTotal = currentTotal - oldValue + numValue
      
      // Check if new total exceeds original total
      if (newTotal > originalTotal) {
        showToastMessage(`Cannot exceed original total of ${originalTotal} days for this milestone`, 'error')
        return
      }
      
      // Update the value
      if (!allocations.value[memberId]) {
        allocations.value[memberId] = {}
      }
      allocations.value[memberId][milestoneId] = Math.max(0, numValue)
      
      emit('change', {
        memberId,
        milestoneId,
        value: numValue,
        allocations: allocations.value
      })
    }

    // Reset to original values
    const resetToOriginal = () => {
      if (confirm('Reset all mandays to their original values?')) {
        const newAllocations = {}
        props.teamMembers.forEach(member => {
          newAllocations[member.id] = {}
          props.milestones.forEach(milestone => {
            newAllocations[member.id][milestone.id] = originalAllocations.value[member.id]?.[milestone.id] || 0
          })
        })
        allocations.value = newAllocations
        showToastMessage('Reset to original values', 'success')
        saveToLocalStorage()
      }
    }

    // Distribute equally across members for each milestone (keeping total same)
    const distributeEqually = () => {
      if (props.milestones.length === 0) {
        showToastMessage('No milestones to distribute', 'error')
        return
      }
      
      props.milestones.forEach(milestone => {
        const originalTotal = getMilestoneOriginalTotal(milestone.id)
        const memberCount = props.teamMembers.length
        if (memberCount > 0 && originalTotal > 0) {
          const perMember = Math.round((originalTotal / memberCount) * 10) / 10
          let sum = 0
          
          props.teamMembers.forEach((member, index) => {
            let value = perMember
            // Adjust the last member to account for rounding
            if (index === memberCount - 1) {
              value = originalTotal - sum
            }
            if (!allocations.value[member.id]) {
              allocations.value[member.id] = {}
            }
            allocations.value[member.id][milestone.id] = Math.max(0, value)
            sum += value
          })
        }
      })
      
      showToastMessage('Mandays distributed equally across team members', 'success')
      saveToLocalStorage()
      emit('update:data', allocations.value)
    }

    // Reset all mandays to zero
    const resetAllMandays = () => {
      if (confirm('Are you sure you want to reset ALL mandays to zero? This will clear all allocations.')) {
        props.teamMembers.forEach(member => {
          props.milestones.forEach(milestone => {
            if (!allocations.value[member.id]) {
              allocations.value[member.id] = {}
            }
            allocations.value[member.id][milestone.id] = 0
          })
        })
        showToastMessage('All mandays have been reset to zero', 'success')
        saveToLocalStorage()
        emit('update:data', allocations.value)
      }
    }

    // Save all changes and close modal
    const saveAllMandays = () => {
      // Final validation - ensure all milestones are balanced
      let hasError = false
      for (const milestone of props.milestones) {
        if (getMilestoneTotal(milestone.id) !== getMilestoneOriginalTotal(milestone.id)) {
          hasError = true
          break
        }
      }
      
      if (hasError) {
        showToastMessage('Please ensure all milestone totals match original values before saving', 'error')
        return
      }
      
      saveToLocalStorage()
      
      const saveData = {
        allocations: allocations.value,
        totalMandays: props.milestones.reduce((sum, m) => sum + getMilestoneTotal(m.id), 0),
        milestoneTotals: props.milestones.map(m => ({
          id: m.id,
          name: m.name,
          total: getMilestoneTotal(m.id),
          originalTotal: getMilestoneOriginalTotal(m.id)
        })),
        memberTotals: props.teamMembers.map(m => ({
          id: m.id,
          name: m.name,
          total: Object.values(allocations.value[m.id] || {}).reduce((sum, v) => sum + v, 0)
        }))
      }
      
      emit('save', saveData)
      emit('update:data', allocations.value)
      showToastMessage('Manday allocations saved successfully', 'success')
      closeModal()
    }

    // Close modal
    const closeModal = () => {
      emit('close')
    }

    // Show toast notification
    const showToastMessage = (message, type = 'success') => {
      toastMessage.value = message
      toastType.value = type
      showToast.value = true
      setTimeout(() => {
        showToast.value = false
      }, 3000)
    }

    // Get total for a member
    const getMemberTotal = (memberId) => {
      const memberAllocations = allocations.value[memberId] || {}
      return Object.values(memberAllocations).reduce((sum, val) => sum + (val || 0), 0)
    }

    // Watch for props changes
    watch(() => props.milestones, () => {
      loadData()
    }, { deep: true, immediate: true })

    watch(() => props.show, (newShow) => {
      if (newShow) {
        loadData()
      }
    })

    // Initialize on mount
    onMounted(() => {
      loadData()
    })

    return {
      allocations,
      showToast,
      toastMessage,
      toastType,
      getMandayValue,
      getOriginalMandayValue,
      getMilestoneTotal,
      getMilestoneOriginalTotal,
      getMemberTotal,
      getVariance,
      getVarianceClass,
      getMilestoneVariance,
      getMilestoneVarianceClass,
      hasAnyValidationError,
      updateMandayWithValidation,
      resetToOriginal,
      distributeEqually,
      resetAllMandays,
      saveAllMandays,
      closeModal
    }
  }
}
</script>

<style scoped>
@import "../../../../../styles/shared/globals.css";

/* Modal Container */
.planned-manday-modal-container {
  max-width: 1000px !important;
  width: 90% !important;
  max-height: 85vh !important;
}

.planned-manday-modal-body {
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px 24px !important;
}

/* Custom close button positioning */
.prmpt-modal-header {
  position: relative;
  padding-right: 60px !important;
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--muted-light);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 1;
}

.close-btn:hover {
  background-color: var(--border-light);
  color: var(--text-light);
}

.dark .close-btn:hover {
  background-color: var(--border-dark);
  color: var(--text-dark);
}

/* Section Title */
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  margin: 0 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.dark .section-title {
  color: var(--text-dark);
  border-bottom-color: var(--border-dark);
}

.section-title .material-symbols-outlined {
  font-size: 18px;
  color: var(--primary);
}

/* Validation Summary */
.validation-summary {
  margin-bottom: 20px;
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fef3c7;
  border-radius: var(--border-radius-md);
  font-size: 13px;
  color: #d97706;
  border: 1px solid #fef3c7;
}

.dark .validation-message {
  background: #5c3d00;
  border-color: #5c3d00;
  color: #fbbf24;
}

.validation-message .material-symbols-outlined {
  font-size: 20px;
}

/* Milestone Table Card */
.milestone-table-card {
  margin-bottom: 20px;
  border: 1px solid var(--border-light);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.dark .milestone-table-card {
  border-color: var(--border-dark);
}

.milestone-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background-color: var(--bg-header);
  flex-wrap: wrap;
  gap: 12px;
}

.dark .milestone-table-header {
  background-color: var(--dark-bg-header);
}

.milestone-table-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
}

.dark .milestone-table-header h5 {
  color: var(--text-dark);
}

/* Table Responsive */
.table-responsive {
  overflow-x: auto;
}

/* Manday Table */
.manday-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

/* Fixed Column Widths */
.manday-table .col-member {
  width: 28%;
  min-width: 200px;
}

.manday-table .col-role {
  width: 22%;
  min-width: 140px;
}

.manday-table .col-original {
  width: 15%;
  min-width: 100px;
  text-align: center;
}

.manday-table .col-manday {
  width: 20%;
  min-width: 120px;
}

.manday-table .col-variance {
  width: 15%;
  min-width: 90px;
  text-align: center;
}

/* Table Header */
.manday-table th {
  padding: 12px 8px;
  background-color: var(--bg-header);
  color: var(--muted-light);
  font-weight: 600;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid var(--border-light);
  text-align: left;
}

.dark .manday-table th {
  background-color: var(--dark-bg-header);
  color: var(--muted-dark);
  border-bottom-color: var(--border-dark);
}

/* Center align for numeric columns */
.manday-table th.col-original,
.manday-table th.col-manday,
.manday-table th.col-variance,
.manday-table td.col-original,
.manday-table td.col-manday,
.manday-table td.col-variance {
  text-align: center;
}

/* Table Body Cells */
.manday-table td {
  padding: 10px 8px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-light);
  vertical-align: middle;
}

.dark .manday-table td {
  border-bottom-color: var(--border-dark);
  color: var(--text-dark);
}

.manday-table tbody tr:hover {
  background-color: var(--bg-header);
}

.dark .manday-table tbody tr:hover {
  background-color: var(--dark-bg-header);
}

/* Member Info */
.member-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.member-avatar-small {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 11px;
  flex-shrink: 0;
}

.member-name {
  font-weight: 500;
  color: var(--text-light);
}

.dark .member-name {
  color: var(--text-dark);
}

/* Role Badge */
.role-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #eef2ff;
  color: #4f46e5;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
}

.dark .role-badge {
  background: #1e1b4b;
  color: #a5b4fc;
}

/* Original Value */
.original-value {
  display: inline-block;
  font-weight: 500;
  color: var(--muted-light);
}

/* Manday Input */
.manday-input-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.manday-input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid var(--border-light);
  border-radius: 6px;
  font-size: 12px;
  text-align: center;
  background: white;
  transition: all 0.2s;
}

.dark .manday-input {
  background: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.manday-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.manday-input.has-value {
  border-color: #10b981;
  background: #f0fdf4;
}

.dark .manday-input.has-value {
  background: #064e3b;
  border-color: #34d399;
}

.manday-input.error {
  border-color: #ef4444;
  background: #fee2e2;
}

.dark .manday-input.error {
  background: #7f1d1d;
  border-color: #f87171;
}

.manday-unit {
  font-size: 10px;
  color: var(--muted-light);
}

/* Variance Badge */
.variance-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
}

.variance-positive {
  background: #fee2e2;
  color: #dc2626;
}

.variance-negative {
  background: #d1fae5;
  color: #059669;
}

.variance-zero {
  background: #f1f5f9;
  color: #64748b;
}

.dark .variance-positive {
  background: #7f1d1d;
  color: #f87171;
}

.dark .variance-negative {
  background: #064e3b;
  color: #34d399;
}

.dark .variance-zero {
  background: #334155;
  color: #94a3b8;
}

/* Total Row */
.total-row {
  background-color: var(--bg-header);
  font-weight: 600;
  border-top: 1px solid var(--border-light);
}

.dark .total-row {
  background-color: var(--dark-bg-header);
  border-top-color: var(--border-dark);
}

.total-label {
  text-align: right;
}

.total-row td {
  padding: 10px 8px;
}

.total-row .col-original,
.total-row .col-manday,
.total-row .col-variance {
  text-align: center;
}

.text-warning {
  color: #dc2626;
}

.text-info {
  color: #10b981;
}

/* Action Buttons Section */
.action-buttons-group {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
}

.plan-action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid var(--border-light);
  background: white;
  color: var(--text-light);
}

.dark .plan-action-btn {
  background: var(--card-dark);
  border-color: var(--border-dark);
  color: var(--text-dark);
}

.plan-action-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
  transform: translateY(-1px);
}

.plan-action-btn.secondary:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.plan-action-btn .material-symbols-outlined {
  font-size: 16px;
}

/* Modal Footer */
.prmpt-modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-light);
  background-color: var(--bg-header);
}

.dark .prmpt-modal-footer {
  border-top-color: var(--border-dark);
  background-color: var(--dark-bg-header);
}

.footer-left .info-text {
  font-size: 12px;
  color: var(--muted-light);
}

.footer-right {
  display: flex;
  gap: 12px;
}

.prmpt-modal-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.prmpt-cancel-btn {
  background: transparent;
  color: var(--text-light);
  border: 1px solid var(--border-light);
}

.dark .prmpt-cancel-btn {
  color: var(--text-dark);
  border-color: var(--border-dark);
}

.prmpt-cancel-btn:hover {
  border-color: #ef4444;
  color: #ef4444;
}

.prmpt-save-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
}

.prmpt-save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.prmpt-save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Toast Notification - High z-index to appear above modal */
.toast-notification {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  z-index: 10000;
  animation: slideIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
}

.toast-notification.success {
  background: #10b981;
  color: white;
}

.toast-notification.error {
  background: #ef4444;
  color: white;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .milestone-table-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-buttons-group {
    flex-direction: column;
  }
  
  .plan-action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .prmpt-modal-footer {
    flex-direction: column;
    gap: 12px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: center;
  }
  
  .planned-manday-modal-container {
    width: 95% !important;
  }
  
  /* Adjust table for mobile */
  .manday-table .col-member {
    min-width: 160px;
  }
  
  .manday-table .col-role {
    min-width: 100px;
  }
  
  .manday-table .col-original,
  .manday-table .col-manday,
  .manday-table .col-variance {
    min-width: 80px;
  }
}

@media (max-width: 480px) {
  .planned-manday-modal-body {
    padding: 16px !important;
  }
  
  .manday-input {
    width: 55px;
    padding: 4px;
    font-size: 11px;
  }
  
  .member-avatar-small {
    width: 24px;
    height: 24px;
    font-size: 9px;
  }
  
  .member-name {
    font-size: 12px;
  }
  
  .manday-table .col-member {
    min-width: 140px;
  }
}
</style>