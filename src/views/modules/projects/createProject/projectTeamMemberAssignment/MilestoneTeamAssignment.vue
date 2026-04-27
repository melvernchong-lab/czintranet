<template>
    <div class="milestone-team-section">
        <!-- Header -->
        <div class="team-section-header">
            <div class="header-title">
                <span class="material-symbols-outlined">group</span>
                <span>Project Timesheet Assignments</span>
            </div>
        </div>

        <!-- Assignment Table Header -->
        <div class="team-table-header">
            <span class="team-col">Team Member</span>
            <span class="role-col">Role</span>
            <span class="planned-col">Planned Days</span>
            <span class="action-col"></span>
        </div>

        <!-- Assignment Rows -->
        <div v-for="(assignment, assignIndex) in localAssignments" :key="assignIndex" class="team-assignment-row"
            :class="{ 'has-warning': hasWarning(assignment) }">

            <!-- Member Selection -->
            <div class="team-col">
                <select v-model="assignment.memberId" class="team-select" @change="handleAssignmentChange"
                    :class="{ 'error': !assignment.memberId && showValidation }">
                    <option value="">Select Member</option>
                    <template v-if="groupedMembers && groupedMembers.length > 0">
                        <optgroup v-for="group in groupedMembers" :key="group.role" :label="group.role">
                            <option v-for="member in group.members" :key="member.id" :value="member.id">
                                {{ member.name }}
                            </option>
                        </optgroup>
                    </template>
                    <option v-else disabled>No members available</option>
                </select>
            </div>

            <!-- Role Display -->
            <div class="role-col">
                <span class="member-role-tag">{{ getMemberRole(assignment.memberId) }}</span>
            </div>

            <!-- Planned Days Input -->
            <div class="planned-col">
                <div class="days-input-wrapper">
                    <input type="number" v-model.number="assignment.plannedMandays" class="days-input"
                        placeholder="Days" min="0" step="0.5" @input="handleAssignmentChange"
                        :class="{ 'warning': assignment.plannedMandays > maxDaysPerMember }" />
                    <span class="days-unit" v-if="assignment.plannedMandays">days</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-col">
                <button class="icon-btn remove-btn" @click="removeAssignment(assignIndex)" v-if="assignmentsLength > 1"
                    title="Remove" type="button">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>

        <!-- Add Assignment Button -->
        <div class="add-assignment-section">
            <button 
                class="add-assignment-btn" 
                @click="addAssignment" 
                type="button"
            >
                <span class="material-symbols-outlined">add</span>
                Add Team Member Assignment
            </button>
        </div>

        <!-- Validation Message -->
        <div v-if="validationMessage" class="validation-message" :class="{ 'error': validationType === 'error' }">
            <span class="material-symbols-outlined">{{ validationType === 'error' ? 'error' : 'warning' }}</span>
            {{ validationMessage }}
        </div>
    </div>
</template>

<script>
import { ref, computed, watch } from 'vue'

export default {
    name: 'MilestoneTeamAssignment',
    props: {
        modelValue: {
            type: Object,
            required: true
        },
        availableMembers: {
            type: Array,
            default: () => []
        },
        maxDaysPerMember: {
            type: Number,
            default: 40
        },
        showValidation: {
            type: Boolean,
            default: false
        }
    },
    emits: ['update:modelValue', 'validation'],
    setup(props, { emit }) {
        // Local state
        const localAssignments = ref([])
        const validationMessage = ref('')
        const validationType = ref('warning')
        const isUpdating = ref(false) // Flag to prevent recursive updates

        // Safe access to available members
        const safeAvailableMembers = computed(() => {
            return props.availableMembers || []
        })

        // Initialize assignments from props - only when props change
        watch(() => props.modelValue?.assignments, (newAssignments) => {
            if (isUpdating.value) return // Prevent recursive updates
            
            if (newAssignments && newAssignments.length > 0) {
                localAssignments.value = JSON.parse(JSON.stringify(newAssignments))
            } else {
                localAssignments.value = [{ memberId: '', plannedMandays: 0 }]
            }
        }, { immediate: true, deep: true })

        // Assignments length
        const assignmentsLength = computed(() => {
            return localAssignments.value?.length || 0
        })

        // Group members by role
        const groupedMembers = computed(() => {
            const groups = {}
            
            if (safeAvailableMembers.value && Array.isArray(safeAvailableMembers.value) && safeAvailableMembers.value.length > 0) {
                safeAvailableMembers.value.forEach(member => {
                    if (!member || !member.role) return
                    
                    if (!groups[member.role]) {
                        groups[member.role] = []
                    }
                    groups[member.role].push(member)
                })
            }
            
            return Object.entries(groups).map(([role, members]) => ({ 
                role, 
                members 
            }))
        })

        // Helper functions
        const getMemberRole = (memberId) => {
            if (!memberId) return 'Unknown'
            const member = safeAvailableMembers.value.find(m => m.id === memberId)
            return member?.role || 'Unknown'
        }

        const hasWarning = (assignment) => {
            return assignment?.plannedMandays > props.maxDaysPerMember
        }

        // Validate assignments
        const validateAssignments = () => {
            const validAssignments = (localAssignments.value || []).filter(a => a.memberId)
            const overworked = validAssignments.filter(a => a.plannedMandays > props.maxDaysPerMember)

            if (overworked.length > 0) {
                validationMessage.value = `${overworked.length} member(s) exceed recommended workload`
                validationType.value = 'warning'
                emit('validation', { valid: false, message: validationMessage.value })
            } else {
                validationMessage.value = ''
                emit('validation', { valid: true })
            }
        }

        // Update assignment and emit changes
        const updateParent = () => {
            if (isUpdating.value) return // Prevent recursive updates
            
            isUpdating.value = true
            
            try {
                // Filter out completely empty rows (no member and no days)
                const filtered = (localAssignments.value || []).filter(a => a.memberId || a.plannedMandays > 0)

                // Always keep at least one empty row for adding new assignments
                if (filtered.length === 0) {
                    filtered.push({ memberId: '', plannedMandays: 0 })
                }

                const updatedMilestone = {
                    ...props.modelValue,
                    assignments: filtered
                }

                emit('update:modelValue', updatedMilestone)
                validateAssignments()
            } finally {
                // Use next tick to avoid immediate recursive triggers
                setTimeout(() => {
                    isUpdating.value = false
                }, 0)
            }
        }

        // Handle assignment changes (select or input)
        const handleAssignmentChange = () => {
            updateParent()
        }

        // Add new assignment
        const addAssignment = () => {
            localAssignments.value.push({
                memberId: '',
                plannedMandays: 0
            })
            // Don't call updateParent here - let the watch handle it
        }

        // Remove assignment
        const removeAssignment = (index) => {
            localAssignments.value.splice(index, 1)
            updateParent()
        }

        // Watch for changes to localAssignments and update parent
        watch(localAssignments, () => {
            updateParent()
        }, { deep: true })

        // Watch for validation prop
        watch(() => props.showValidation, () => {
            if (props.showValidation) {
                validateAssignments()
            }
        })

        return {
            localAssignments,
            groupedMembers,
            assignmentsLength,
            getMemberRole,
            hasWarning,
            handleAssignmentChange,
            addAssignment,
            removeAssignment,
            validationMessage,
            validationType
        }
    }
}
</script>

<style scoped>
@import "../../../../../styles/shared/globals.css";

/* ============================================
   MILESTONE TEAM ASSIGNMENT
   ============================================ */

.milestone-team-section {
    margin-top: 20px;
    padding: 20px;
    background: linear-gradient(135deg, var(--card-light) 0%, var(--bg-header) 100%);
    border-radius: var(--border-radius-lg);
    border: 1px solid var(--border-light);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
}

.dark .milestone-team-section {
    background: linear-gradient(135deg, var(--card-dark) 0%, var(--dark-bg-header) 100%);
    border-color: var(--border-dark);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* ============================================
   HEADER STYLES
   ============================================ */

.team-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--border-light);
    position: relative;
}

.dark .team-section-header {
    border-bottom-color: var(--border-dark);
}

.team-section-header::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: var(--primary);
    border-radius: 2px;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.dark .header-title {
    color: var(--text-dark);
}

.header-title .material-symbols-outlined {
    font-size: 24px;
    color: var(--primary);
    background: rgba(59, 130, 246, 0.1);
    padding: 6px;
    border-radius: 10px;
}

/* ============================================
   TABLE HEADER
   ============================================ */

.team-table-header {
    display: grid;
    grid-template-columns: 1fr 100px 100px 40px;
    gap: 12px;
    padding: 12px 8px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%);
    border-radius: var(--border-radius-md);
    font-size: 12px;
    font-weight: 700;
    color: var(--muted-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border: 1px solid var(--border-light);
}

.dark .team-table-header {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%);
    color: var(--muted-dark);
    border-color: var(--border-dark);
}

.team-col {
    grid-column: span 1;
    padding-left: 8px;
}

.role-col,
.planned-col {
    text-align: center;
}

.action-col {
    text-align: center;
}

/* ============================================
   ASSIGNMENT ROWS
   ============================================ */

.team-assignment-row {
    display: grid;
    grid-template-columns: 1fr 100px 100px 40px;
    gap: 20px;
    align-items: center;
    margin-bottom: 8px;
    padding: 12px 8px;
    border-radius: var(--border-radius-md);
    background-color: var(--bg-header);
    border: 1px solid var(--border-light);
    transition: all 0.2s;
    animation: slideInRow 0.3s ease;
}

@keyframes slideInRow {
    from {
        opacity: 0;
        transform: translateX(-10px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.dark .team-assignment-row {
    background-color: var(--dark-bg-header);
    border-color: var(--border-dark);
}

.team-assignment-row:hover {
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border-color: var(--primary);
}

.team-assignment-row.has-warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(245, 158, 11, 0.1) 100%);
    border-left: 4px solid #f59e0b;
}

.dark .team-assignment-row.has-warning {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.2) 100%);
}

/* ============================================
   MEMBER SELECT
   ============================================ */
.team-select {
    flex: 1;
    padding: 10px 12px;
    border: 2px solid var(--border-light);
    border-radius: var(--border-radius-md);
    background-color: var(--card-light);
    color: var(--text-light);
    font-size: 13px;
    font-weight: 500;
    min-width: 0;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
    background-repeat: no-repeat;
    background-position: right 12px center;
    background-size: 16px;
    padding-right: 40px;
}

.dark .team-select {
    background-color: var(--card-dark);
    border-color: var(--border-dark);
    color: var(--text-dark);
    background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
}

.team-select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.team-select.error {
    border-color: #ef4444;
    background-color: rgba(239, 68, 68, 0.05);
}

.team-select.error:focus {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15);
}

/* ============================================
   ROLE TAG
   ============================================ */

.member-role-tag {
    display: inline-block;
    padding: 6px 12px;
    background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
    border-radius: 30px;
    font-size: 11px;
    font-weight: 600;
    color: var(--text-light);
    border: 1px solid var(--border-light);
    white-space: nowrap;
    transition: all 0.2s;
}

.dark .member-role-tag {
    background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
    color: var(--text-dark);
    border-color: var(--border-dark);
}

/* ============================================
   DAYS INPUT
   ============================================ */

.days-input-wrapper {
    display: flex;
    align-items: center;
    gap: 6px;
}

.days-input {
    width: 100%;
    padding: 10px 12px;
    border: 2px solid var(--border-light);
    border-radius: var(--border-radius-md);
    background-color: var(--card-light);
    color: var(--text-light);
    font-size: 13px;
    font-weight: 500;
    text-align: right;
    transition: all 0.2s;
}

.dark .days-input {
    background-color: var(--card-dark);
    border-color: var(--border-dark);
    color: var(--text-dark);
}

.days-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.days-input.warning {
    border-color: #f59e0b;
    background-color: rgba(245, 158, 11, 0.05);
}

.days-unit {
    font-size: 11px;
    font-weight: 600;
    color: var(--muted-light);
    white-space: nowrap;
}

.dark .days-unit {
    color: var(--muted-dark);
}

/* ============================================
   ICON BUTTONS
   ============================================ */

.icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: transparent;
    color: var(--muted-light);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.icon-btn:hover {
    background-color: var(--bg-header);
    color: var(--primary);
}

.icon-btn.remove-btn:hover {
    color: #ef4444;
}

.icon-btn .material-symbols-outlined {
    font-size: 18px;
}

/* ============================================
   ADD ASSIGNMENT BUTTON
   ============================================ */

.add-assignment-section {
    margin-top: 20px;
}

.add-assignment-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 14px;
    width: 100%;
    border-radius: var(--border-radius-md);
    border: 2px dashed var(--border-light);
    background: linear-gradient(135deg, var(--bg-header) 0%, var(--card-light) 100%);
    color: var(--primary);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.dark .add-assignment-btn {
    background: linear-gradient(135deg, var(--dark-bg-header) 0%, var(--card-dark) 100%);
    border-color: var(--border-dark);
}

.add-assignment-btn:hover {
    border-color: var(--primary);
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
}

.add-assignment-btn .material-symbols-outlined {
    font-size: 20px;
    transition: transform 0.3s;
}

.add-assignment-btn:hover .material-symbols-outlined {
    transform: rotate(90deg);
}

/* ============================================
   VALIDATION MESSAGE
   ============================================ */

.validation-message {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 20px;
    padding: 14px 18px;
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.15) 100%);
    border-radius: var(--border-radius-md);
    font-size: 13px;
    font-weight: 500;
    color: #f59e0b;
    border: 1px solid rgba(245, 158, 11, 0.3);
}

.validation-message.error {
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.15) 100%);
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 768px) {
    .team-table-header {
        display: none;
    }

    .team-assignment-row {
        grid-template-columns: 1fr;
        gap: 12px;
        padding: 16px;
    }

    .team-col,
    .role-col,
    .planned-col,
    .action-col {
        grid-column: 1 / -1;
        padding-left: 0;
    }

    .role-col {
        text-align: left;
        margin-top: 8px;
    }

    .action-col {
        display: flex;
        justify-content: flex-end;
        margin-top: 8px;
    }

    .team-select {
        width: 100%;
    }

    .days-input-wrapper {
        width: 100%;
    }

    .days-input {
        width: 100%;
    }
}

@media (max-width: 480px) {
    .milestone-team-section {
        padding: 16px;
    }

    .header-title {
        font-size: 14px;
    }

    .team-assignment-row {
        padding: 16px 12px;
    }

    .add-assignment-btn {
        padding: 12px;
        font-size: 13px;
    }
}
</style>