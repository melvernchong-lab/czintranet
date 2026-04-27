<template>
    <div class="project-timesheet">
        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="spinner"></div>
            <p>Loading timesheet data...</p>
        </div>

        <!-- Content -->
        <div v-else>
            <!-- Empty State -->
            <div v-if="!hasMilestones" class="empty-state">
                <div class="empty-state-content">
                    <span class="material-symbols-outlined empty-state-icon">schedule</span>
                    <h3>No Timesheet Data</h3>
                    <p>No workload data available for this project</p>
                </div>
            </div>

            <!-- Milestone Table -->
            <div v-else class="timesheet-table-wrapper" ref="tableWrapperRef">
                <table class="timesheet-table">
                    <thead>
                        <tr>
                            <th class="col-milestone">Milestone</th>
                            <th class="col-billing">Cust Billing %</th>
                            <th class="col-plan">
                                <div class="header-with-action">
                                    <span>Plan Mandays</span>
                                    <button class="edit-plan-btn" @click="openPlannedMandayModal" title="Edit Planned Mandays">
                                        <span class="material-symbols-outlined">edit</span>
                                    </button>
                                </div>
                            </th>
                            <th class="col-actual">Actual Mandays</th>
                            <th class="col-revenue">Revenue %</th>
                            <th class="col-status">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="milestone in paginatedSummaries" :key="milestone.id">
                            <td class="col-milestone">
                                <div class="milestone-cell">
                                    <strong>{{ milestone.name }}</strong>
                                    <span class="milestone-date">{{ milestone.date }}</span>
                                </div>
                            </td>
                            <td class="col-billing">
                                <span :class="['badge', getBillingClass(milestone.billingPercentage)]">
                                    {{ milestone.billingPercentage }}%
                                </span>
                            </td>
                            <td class="col-plan">
                                <span class="manday clickable" @click="openPlannedMandayModal">
                                    {{ milestone.planMandays }}
                                </span>
                            </td>
                            <td class="col-actual">
                                <span :class="['manday', { 'overage': milestone.actualMandays > milestone.planMandays, 'clickable': true }]"
                                      @click.stop="openMilestoneDetail(milestone)">
                                    {{ milestone.actualMandays }}
                                    <span v-if="milestone.variance && milestone.actualMandays > milestone.planMandays" class="variance">
                                        +{{ milestone.variance }}
                                    </span>
                                </span>
                            </td>
                            <td class="col-revenue">
                                <span :class="['badge', getRevenueClass(milestone.revenuePercentage)]">
                                    {{ milestone.revenuePercentage }}%
                                </span>
                            </td>
                            <td class="col-status">
                                <div class="modern-dropdown" :class="{ 'is-open': openDropdownId === milestone.id }">
                                    <button 
                                        class="dropdown-trigger"
                                        :class="getStatusButtonClass(milestone.statusDisplay)"
                                        @click.stop="toggleDropdown(milestone.id, $event)"
                                    >
                                        <span class="status-text">{{ milestone.statusDisplay }}</span>
                                        <span class="dropdown-icon material-symbols-outlined">expand_more</span>
                                    </button>
                                    
                                    <Teleport to="body">
                                        <div 
                                            class="dropdown-menu" 
                                            v-if="openDropdownId === milestone.id"
                                            :style="dropdownStyle"
                                        >
                                            <div class="dropdown-options">
                                                <div 
                                                    v-for="option in statusOptions" 
                                                    :key="option.value"
                                                    class="dropdown-option"
                                                    :class="{ 'is-selected': milestone.statusDisplay === option.label, [option.class]: true }"
                                                    @click.stop="updateMilestoneStatus(milestone.id, option.label)"
                                                >
                                                    <span class="option-icon">{{ option.icon }}</span>
                                                    <span class="option-label">{{ option.label }}</span>
                                                    <span class="check-icon material-symbols-outlined" v-if="milestone.statusDisplay === option.label">check</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Teleport>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot v-if="milestoneSummaries.length > 0">
                        <tr class="total-row">
                            <td class="col-milestone"><strong>Total</strong></td>
                            <td class="col-billing"><strong>{{ totalBillingPercentage }}%</strong></td>
                            <td class="col-plan"><strong>{{ totalPlanMandays }}</strong></td>
                            <td class="col-actual"><strong>{{ totalActualMandays }}</strong></td>
                            <td class="col-revenue"><strong>{{ totalRevenuePercentage }}%</strong></td>
                            <td class="col-status"></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <!-- Pagination -->
            <div class="pagination-wrapper" v-if="hasMilestones && milestoneSummaries.length > itemsPerPage">
                <span class="pagination-info">
                    Showing {{ paginationStart }}-{{ paginationEnd }} of {{ milestoneSummaries.length }} milestones
                </span>
                <div class="pagination-controls">
                    <button class="page-btn" @click="prevPage" :disabled="currentPage === 1">
                        <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                    <span class="page-number">Page {{ currentPage }} of {{ totalPages }}</span>
                    <button class="page-btn" @click="nextPage" :disabled="currentPage === totalPages">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Milestone Detail Modal (Actual Mandays) -->
        <MandayDetailModal :show="showMilestoneModal" :task="selectedMilestone" @close="closeMilestoneModal" />
        
        <!-- Planned Manday Modal - Only render when needed -->
        <PlannedMandayModal 
            v-if="showPlannedMandayModal"
            :show="showPlannedMandayModal"
            :milestones="propsMilestones"
            :team-members="propsTeamMembers"
            :project-id="propsProjectId"
            :initial-data="savedMandayAllocations"
            @close="closePlannedMandayModal"
            @save="handleMandaySave"
            @update:data="handleMandayUpdate"
        />
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import MandayDetailModal from './Manday/ActualMandayModal.vue';
import PlannedMandayModal from './Manday/PlannedMandayModal.vue';

export default {
    name: 'ProjectTimesheet',
    components: {
        MandayDetailModal,
        PlannedMandayModal
    },
    props: {
        milestones: {
            type: Array,
            default: () => []
        },
        projectId: {
            type: [String, Number],
            default: null
        },
        projectName: {
            type: String,
            default: ''
        },
        teamMembers: {
            type: Array,
            default: () => []
        }
    },
    emits: ['task-select', 'milestone-select', 'status-updated', 'mandays-updated'],
    setup(props, { emit }) {
        const isLoading = ref(false);
        const currentPage = ref(1);
        const itemsPerPage = ref(10);
        const showMilestoneModal = ref(false);
        const selectedMilestone = ref(null);
        const showPlannedMandayModal = ref(false);
        const openDropdownId = ref(null);
        const dropdownStyle = ref({});
        const tableWrapperRef = ref(null);
        const savedMandayAllocations = ref({});
        
        // Create safe references for props
        const propsMilestones = computed(() => props.milestones || []);
        const propsTeamMembers = computed(() => props.teamMembers || []);
        const propsProjectId = computed(() => props.projectId);
        
        // Store for milestone statuses
        const milestoneStatuses = ref(new Map());

        // Status options configuration
        const statusOptions = [
            { value: 'NEW', label: 'NEW', icon: '🟢', class: 'status-new-option' },
            { value: 'PROGRESS', label: 'PROGRESS', icon: '🟠', class: 'status-progress-option' },
            { value: 'ON HOLD', label: 'ON HOLD', icon: '🔴', class: 'status-onhold-option' },
            { value: 'CLOSE', label: 'CLOSE', icon: '✅', class: 'status-close-option' }
        ];

        // Load saved statuses from localStorage
        const loadSavedStatuses = () => {
            if (!props.projectId) return;
            const saved = localStorage.getItem(`milestone_statuses_${props.projectId}`);
            if (saved) {
                try {
                    const statusMap = JSON.parse(saved);
                    milestoneStatuses.value = new Map(Object.entries(statusMap));
                } catch (e) {
                    console.error('Error loading milestone statuses:', e);
                }
            }
        };

        // Load saved manday allocations
        const loadSavedMandayAllocations = () => {
            if (!props.projectId) return;
            const saved = localStorage.getItem(`planned_mandays_${props.projectId}`);
            if (saved) {
                try {
                    savedMandayAllocations.value = JSON.parse(saved);
                } catch (e) {
                    console.error('Error loading manday allocations:', e);
                }
            }
        };

        // Save statuses to localStorage
        const saveStatuses = () => {
            if (!props.projectId) return;
            const statusMap = Object.fromEntries(milestoneStatuses.value);
            localStorage.setItem(`milestone_statuses_${props.projectId}`, JSON.stringify(statusMap));
            updateMilestoneInParent();
        };

        // Update milestone in parent component
        const updateMilestoneInParent = () => {
            if (!props.projectId) return;
            
            const savedProject = localStorage.getItem(`project_${props.projectId}`);
            if (savedProject) {
                const project = JSON.parse(savedProject);
                if (project.milestones) {
                    let updated = false;
                    project.milestones.forEach(milestone => {
                        const savedStatus = milestoneStatuses.value.get(milestone.id);
                        if (savedStatus && milestone.statusDisplay !== savedStatus) {
                            milestone.statusDisplay = savedStatus;
                            milestone.status = mapStatusToKey(savedStatus);
                            updated = true;
                        }
                    });
                    
                    if (updated) {
                        localStorage.setItem(`project_${props.projectId}`, JSON.stringify(project));
                        
                        const savedProjects = localStorage.getItem('saved_projects');
                        if (savedProjects) {
                            const projects = JSON.parse(savedProjects);
                            const index = projects.findIndex(p => p.id == props.projectId);
                            if (index !== -1) {
                                projects[index] = project;
                                localStorage.setItem('saved_projects', JSON.stringify(projects));
                            }
                        }
                        
                        emit('status-updated', { projectId: props.projectId, milestones: project.milestones });
                    }
                }
            }
        };

        // Map status display to internal status key
        const mapStatusToKey = (statusDisplay) => {
            const map = {
                'NEW': 'pending',
                'PROGRESS': 'in-progress',
                'ON HOLD': 'on-hold',
                'CLOSE': 'completed'
            };
            return map[statusDisplay] || 'pending';
        };

        // Map internal status key to display
        const mapStatusToDisplay = (statusKey) => {
            const map = {
                'pending': 'NEW',
                'in-progress': 'PROGRESS',
                'on-hold': 'ON HOLD',
                'completed': 'CLOSE'
            };
            return map[statusKey] || 'NEW';
        };

        // Calculate dropdown position
        const calculateDropdownPosition = (triggerElement) => {
            if (!triggerElement) return;
            
            const rect = triggerElement.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const dropdownWidth = 140;
            const dropdownHeight = 180;
            
            let left = rect.left;
            let top = rect.bottom + 4;
            
            if (left + dropdownWidth > viewportWidth) {
                left = viewportWidth - dropdownWidth - 10;
            }
            
            if (left < 10) {
                left = 10;
            }
            
            if (top + dropdownHeight > viewportHeight) {
                top = rect.top - dropdownHeight - 4;
            }
            
            dropdownStyle.value = {
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                width: `${dropdownWidth}px`
            };
        };

        // Toggle dropdown
        const toggleDropdown = async (id, event) => {
            if (openDropdownId.value === id) {
                openDropdownId.value = null;
            } else {
                openDropdownId.value = id;
                await nextTick();
                const trigger = event?.currentTarget;
                if (trigger) {
                    calculateDropdownPosition(trigger);
                }
            }
        };

        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (openDropdownId.value) {
                const dropdown = event.target.closest('.modern-dropdown');
                if (!dropdown) {
                    openDropdownId.value = null;
                }
            }
        };

        // Handle scroll to close dropdown
        const handleScroll = () => {
            if (openDropdownId.value) {
                openDropdownId.value = null;
            }
        };

        // Update milestone status
        const updateMilestoneStatus = (milestoneId, newStatus) => {
            milestoneStatuses.value.set(milestoneId, newStatus);
            saveStatuses();
            
            const milestone = milestoneSummaries.value.find(m => m.id === milestoneId);
            if (milestone) {
                milestone.statusDisplay = newStatus;
                milestone.status = mapStatusToKey(newStatus);
            }
            openDropdownId.value = null;
        };

        // Get status button class
        const getStatusButtonClass = (status) => {
            const classes = {
                'NEW': 'status-new-btn',
                'PROGRESS': 'status-progress-btn',
                'ON HOLD': 'status-onhold-btn',
                'CLOSE': 'status-close-btn'
            };
            return classes[status] || 'status-new-btn';
        };

        // Open planned manday modal
        const openPlannedMandayModal = () => {
            if (propsMilestones.value.length === 0) {
                console.warn('No milestones available to edit');
                return;
            }
            if (propsTeamMembers.value.length === 0) {
                console.warn('No team members available to edit');
                return;
            }
            showPlannedMandayModal.value = true;
        };

        // Close planned manday modal
        const closePlannedMandayModal = () => {
            showPlannedMandayModal.value = false;
        };

        // Handle manday save
        const handleMandaySave = (data) => {
            console.log('Mandays saved:', data);
            loadSavedMandayAllocations();
            emit('mandays-updated', data);
        };

        // Handle manday update
        const handleMandayUpdate = (allocations) => {
            savedMandayAllocations.value = allocations;
            if (props.projectId) {
                localStorage.setItem(`planned_mandays_${props.projectId}`, JSON.stringify(allocations));
            }
        };

        watch(() => props.milestones, () => {
            currentPage.value = 1;
            loadSavedStatuses();
            loadSavedMandayAllocations();
        }, { deep: true, immediate: true });

        onMounted(() => {
            loadSavedStatuses();
            loadSavedMandayAllocations();
            document.addEventListener('click', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', () => {
                if (openDropdownId.value) {
                    openDropdownId.value = null;
                }
            });
        });

        onUnmounted(() => {
            document.removeEventListener('click', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
        });

        const milestoneSummaries = computed(() => {
            const milestonesList = props.milestones || [];
            if (!milestonesList.length) return [];

            return milestonesList.map((milestone, index) => {
                let planMandays = 0;
                let actualMandays = 0;
                let billingTotal = 0;
                let assignmentCount = 0;

                // Check for saved allocations first
                const savedAllocations = savedMandayAllocations.value;
                const teamMembersList = props.teamMembers || [];
                
                if (savedAllocations && Object.keys(savedAllocations).length > 0 && teamMembersList.length > 0) {
                    // Calculate plan mandays from saved allocations
                    teamMembersList.forEach(member => {
                        planMandays += savedAllocations[member.id]?.[milestone.id] || 0;
                    });
                } else if (milestone.assignments?.length > 0) {
                    milestone.assignments.forEach(assignment => {
                        planMandays += Number(assignment.plannedMandays) || 0;
                        actualMandays += Number(assignment.actualMandays) || 0;
                        if (assignment.billingPercentage) {
                            billingTotal += Number(assignment.billingPercentage);
                            assignmentCount++;
                        }
                    });
                } else {
                    planMandays = milestone.totalMandays || 0;
                    actualMandays = milestone.actualMandays || 0;
                }
                
                const variance = actualMandays - planMandays;
                
                let billingPercentage = 0;
                if (assignmentCount > 0) {
                    billingPercentage = Math.round(billingTotal / assignmentCount);
                } else if (milestone.billingPercentage) {
                    billingPercentage = milestone.billingPercentage;
                } else {
                    billingPercentage = milestone.isSaved ? 100 : 0;
                }
                
                let revenuePercentage = 0;
                if (planMandays > 0) {
                    revenuePercentage = Math.round((actualMandays / planMandays) * 100);
                    if (revenuePercentage > 100) revenuePercentage = 100;
                }
                
                let savedStatusDisplay = milestoneStatuses.value.get(milestone.id);
                let statusDisplay = savedStatusDisplay || mapStatusToDisplay(milestone.status) || 'NEW';
                let status = mapStatusToKey(statusDisplay);
                
                let date = 'TBD';
                if (milestone.endDate) {
                    try {
                        date = new Date(milestone.endDate).toLocaleDateString('en-US', { 
                            year: 'numeric', month: 'short', day: 'numeric' 
                        });
                    } catch (e) {
                        date = milestone.endDate;
                    }
                }
                
                return {
                    id: milestone.id || `milestone-${index}`,
                    name: milestone.name || `Milestone ${index + 1}`,
                    date: date,
                    planMandays: planMandays,
                    actualMandays: actualMandays,
                    variance: variance,
                    billingPercentage: billingPercentage,
                    revenuePercentage: revenuePercentage,
                    status: status,
                    statusDisplay: statusDisplay,
                    isSaved: milestone.isSaved || false
                };
            });
        });

        const hasMilestones = computed(() => {
            const summaries = milestoneSummaries.value;
            return summaries && summaries.length > 0;
        });

        const totalPlanMandays = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            return summaries.reduce((sum, m) => sum + (m.planMandays || 0), 0);
        });

        const totalActualMandays = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            return summaries.reduce((sum, m) => sum + (m.actualMandays || 0), 0);
        });

        const totalBillingPercentage = computed(() => {
            const totalPlan = totalPlanMandays.value;
            if (totalPlan === 0) return 0;
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            const weightedSum = summaries.reduce((sum, m) => {
                return sum + ((m.billingPercentage || 0) * (m.planMandays || 0));
            }, 0);
            return Math.round(weightedSum / totalPlan);
        });

        const totalRevenuePercentage = computed(() => {
            const totalPlan = totalPlanMandays.value;
            if (totalPlan === 0) return 0;
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            const weightedSum = summaries.reduce((sum, m) => {
                return sum + ((m.revenuePercentage || 0) * (m.planMandays || 0));
            }, 0);
            return Math.round(weightedSum / totalPlan);
        });

        const totalPages = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 1;
            return Math.ceil(summaries.length / itemsPerPage.value) || 1;
        });
        
        const paginatedSummaries = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return [];
            const start = (currentPage.value - 1) * itemsPerPage.value;
            const end = start + itemsPerPage.value;
            return summaries.slice(start, end);
        });
        
        const paginationStart = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            return ((currentPage.value - 1) * itemsPerPage.value) + 1;
        });
        
        const paginationEnd = computed(() => {
            const summaries = milestoneSummaries.value;
            if (!summaries || !summaries.length) return 0;
            return Math.min(currentPage.value * itemsPerPage.value, summaries.length);
        });

        const prevPage = () => {
            if (currentPage.value > 1) currentPage.value--;
        }

        const nextPage = () => {
            if (currentPage.value < totalPages.value) currentPage.value++;
        }

        const openMilestoneDetail = (milestone) => {
            selectedMilestone.value = milestone;
            showMilestoneModal.value = true;
        }

        const closeMilestoneModal = () => {
            showMilestoneModal.value = false;
            selectedMilestone.value = null;
        }

        const onSelectMilestone = (milestone) => {
            emit('milestone-select', milestone);
            emit('task-select', milestone);
        }

        const getBillingClass = (percentage) => {
            if (percentage >= 80) return 'billing-high';
            if (percentage >= 50) return 'billing-medium';
            if (percentage > 0) return 'billing-low';
            return 'billing-zero';
        }

        const getRevenueClass = (percentage) => {
            if (percentage >= 100) return 'revenue-high';
            if (percentage >= 80) return 'revenue-medium';
            if (percentage >= 50) return 'revenue-low';
            return 'revenue-zero';
        }

        return {
            isLoading,
            currentPage,
            milestoneSummaries,
            paginatedSummaries,
            totalPages,
            paginationStart,
            paginationEnd,
            totalPlanMandays,
            totalActualMandays,
            totalBillingPercentage,
            totalRevenuePercentage,
            showMilestoneModal,
            selectedMilestone,
            showPlannedMandayModal,
            hasMilestones,
            itemsPerPage,
            statusOptions,
            openDropdownId,
            dropdownStyle,
            tableWrapperRef,
            savedMandayAllocations,
            propsMilestones,
            propsTeamMembers,
            propsProjectId,
            prevPage,
            nextPage,
            openMilestoneDetail,
            closeMilestoneModal,
            openPlannedMandayModal,
            closePlannedMandayModal,
            handleMandaySave,
            handleMandayUpdate,
            onSelectMilestone,
            toggleDropdown,
            updateMilestoneStatus,
            getStatusButtonClass,
            getBillingClass,
            getRevenueClass
        };
    }
}
</script>

<style scoped>
/* ... keep all existing styles ... */
.project-timesheet {
    width: 100%;
}

/* Loading State */
.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
}

.spinner {
    width: 48px;
    height: 48px;
    border: 3px solid #e2e8f0;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-state p {
    margin-top: 16px;
    color: #64748b;
    font-size: 14px;
}

/* Empty State */
.empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
}

.dark .empty-state {
    background: #1e293b;
    border-color: #334155;
}

.empty-state-content {
    max-width: 300px;
}

.empty-state-icon {
    font-size: 64px;
    color: #64748b;
    margin-bottom: 16px;
    opacity: 0.5;
}

.empty-state h3 {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.dark .empty-state h3 {
    color: #f1f5f9;
}

.empty-state p {
    font-size: 14px;
    color: #64748b;
    margin: 0;
}

/* Table Wrapper */
.timesheet-table-wrapper {
    overflow-x: auto;
    overflow-y: visible;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    background: white;
}

.dark .timesheet-table-wrapper {
    background: #1e293b;
    border-color: #334155;
}

/* Table Styles */
.timesheet-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
}

/* Column Widths */
.col-milestone { width: 25%; }
.col-billing { width: 14%; }
.col-plan { width: 14%; }
.col-actual { width: 14%; }
.col-revenue { width: 12%; }
.col-status { width: 21%; }

/* Header with Action */
.header-with-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.edit-plan-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 6px;
    border: none;
    background: transparent;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s;
}

.edit-plan-btn:hover {
    background: #e2e8f0;
    color: #6366f1;
}

.dark .edit-plan-btn:hover {
    background: #334155;
}

.edit-plan-btn .material-symbols-outlined {
    font-size: 16px;
}

/* Table Header */
.timesheet-table th {
    padding: 14px 16px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #475569;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
}

.dark .timesheet-table th {
    color: #94a3b8;
    background: #0f172a;
    border-bottom-color: #334155;
}

.timesheet-table th.col-billing,
.timesheet-table th.col-plan,
.timesheet-table th.col-actual,
.timesheet-table th.col-revenue,
.timesheet-table th.col-status {
    text-align: center;
}

/* Table Body Cells */
.timesheet-table td {
    padding: 14px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
}

.dark .timesheet-table td {
    color: #cbd5e1;
    border-bottom-color: #334155;
}

.timesheet-table td.col-billing,
.timesheet-table td.col-plan,
.timesheet-table td.col-actual,
.timesheet-table td.col-revenue,
.timesheet-table td.col-status {
    text-align: center;
}

/* Table Row Hover */
.timesheet-table tbody tr {
    cursor: pointer;
    transition: background 0.2s;
}

.timesheet-table tbody tr:hover {
    background: #f8fafc;
}

.dark .timesheet-table tbody tr:hover {
    background: #0f172a;
}

/* Milestone Cell */
.milestone-cell {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.milestone-cell strong {
    font-weight: 600;
    color: #1e293b;
}

.dark .milestone-cell strong {
    color: #f1f5f9;
}

.milestone-date {
    font-size: 11px;
    color: #64748b;
}

/* Badge Styles */
.badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 12px;
    min-width: 55px;
}

.billing-high { background: #d1fae5; color: #059669; }
.billing-medium { background: #fef3c7; color: #d97706; }
.billing-low { background: #fee2e2; color: #dc2626; }
.billing-zero { background: #f1f5f9; color: #64748b; }

.revenue-high { background: #d1fae5; color: #059669; }
.revenue-medium { background: #fef3c7; color: #d97706; }
.revenue-low { background: #fee2e2; color: #dc2626; }
.revenue-zero { background: #f1f5f9; color: #64748b; }

.dark .billing-zero,
.dark .revenue-zero {
    background: #334155;
    color: #94a3b8;
}

/* Manday Styles */
.manday {
    font-weight: 600;
    font-size: 14px;
    color: #1e293b;
}

.dark .manday {
    color: #cbd5e1;
}

.manday.clickable {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 6px;
    transition: background 0.2s;
    display: inline-block;
}

.manday.clickable:hover {
    background: #e2e8f0;
}

.dark .manday.clickable:hover {
    background: #334155;
}

.manday.overage {
    color: #dc2626;
}

.variance {
    font-size: 10px;
    color: #dc2626;
    margin-left: 4px;
    font-weight: 600;
}

/* Modern Dropdown Styles */
.modern-dropdown {
    position: relative;
    display: inline-block;
    width: 120px;
}

.dropdown-trigger {
    width: 100%;
    padding: 6px 28px 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 4px;
    transition: all 0.2s ease;
    background: transparent;
    font-family: inherit;
}

.dropdown-trigger:hover {
    transform: translateY(-1px);
    filter: brightness(0.95);
}

.dropdown-icon {
    font-size: 18px;
    transition: transform 0.2s ease;
}

.modern-dropdown.is-open .dropdown-icon {
    transform: rotate(180deg);
}

/* Status Button Colors */
.status-new-btn {
    background: #dbeafe;
    color: #2563eb;
}

.status-progress-btn {
    background: #fef3c7;
    color: #d97706;
}

.status-onhold-btn {
    background: #f1f5f9;
    color: #64748b;
}

.status-close-btn {
    background: #d1fae5;
    color: #059669;
}

.dark .status-new-btn {
    background: #1e3a5f;
    color: #60a5fa;
}

.dark .status-progress-btn {
    background: #5c3d00;
    color: #fbbf24;
}

.dark .status-onhold-btn {
    background: #334155;
    color: #94a3b8;
}

.dark .status-close-btn {
    background: #064e3b;
    color: #34d399;
}

/* Dropdown Menu */
.dropdown-menu {
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
    border: 1px solid #e2e8f0;
    z-index: 9999;
    overflow: hidden;
    animation: dropdownFadeIn 0.2s ease;
}

.dark .dropdown-menu {
    background: #1e293b;
    border-color: #334155;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

@keyframes dropdownFadeIn {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.dropdown-options {
    display: flex;
    flex-direction: column;
}

.dropdown-option {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    font-weight: 500;
}

.dropdown-option:hover {
    background: #f1f5f9;
}

.dark .dropdown-option:hover {
    background: #0f172a;
}

.dropdown-option.is-selected {
    background: #eef2ff;
}

.dark .dropdown-option.is-selected {
    background: #1e1b4b;
}

.option-icon {
    font-size: 14px;
}

.option-label {
    flex: 1;
    text-align: left;
}

.check-icon {
    font-size: 16px;
    color: #10b981;
}

/* Dropdown option colors */
.dropdown-option.status-new-option {
    color: #2563eb;
}

.dropdown-option.status-progress-option {
    color: #d97706;
}

.dropdown-option.status-onhold-option {
    color: #64748b;
}

.dropdown-option.status-close-option {
    color: #059669;
}

.dark .dropdown-option.status-new-option {
    color: #60a5fa;
}

.dark .dropdown-option.status-progress-option {
    color: #fbbf24;
}

.dark .dropdown-option.status-onhold-option {
    color: #94a3b8;
}

.dark .dropdown-option.status-close-option {
    color: #34d399;
}

/* Total Row */
.total-row {
    background: #f8fafc;
    border-top: 1px solid #f1f5f9;
    font-weight: 600;
}

.dark .total-row {
    background: #0f172a;
    border-top-color: #334155;
}

.total-row td {
    padding: 12px 16px;
}

.total-row td.col-milestone strong {
    color: #4f46e5;
}

.dark .total-row td.col-milestone strong {
    color: #a5b4fc;
}

/* Pagination */
.pagination-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    margin-top: 20px;
    background: #f8fafc;
    border-radius: 12px;
}

.dark .pagination-wrapper {
    background: #0f172a;
}

.pagination-info {
    font-size: 13px;
    color: #64748b;
}

.pagination-controls {
    display: flex;
    align-items: center;
    gap: 12px;
}

.page-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: #475569;
}

.dark .page-btn {
    background: #1e293b;
    border-color: #334155;
    color: #94a3b8;
}

.page-btn:hover:not(:disabled) {
    border-color: #6366f1;
    color: #6366f1;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-number {
    font-size: 13px;
    color: #475569;
}

.dark .page-number {
    color: #94a3b8;
}

/* Responsive */
@media (max-width: 768px) {
    .pagination-wrapper {
        flex-direction: column;
        gap: 12px;
    }
    
    .pagination-controls {
        width: 100%;
        justify-content: center;
    }
    
    .modern-dropdown {
        width: 100px;
    }
    
    .dropdown-trigger {
        padding: 4px 24px 4px 8px;
        font-size: 11px;
    }
}

@media (max-width: 640px) {
    .timesheet-table th,
    .timesheet-table td {
        padding: 10px 12px;
    }
    
    .badge {
        min-width: 45px;
        font-size: 11px;
        padding: 3px 8px;
    }
    
    .modern-dropdown {
        width: 85px;
    }
    
    .dropdown-trigger {
        font-size: 10px;
        padding: 3px 20px 3px 6px;
    }
    
    .dropdown-icon {
        font-size: 14px;
    }
}
</style>