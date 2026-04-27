<template>

    <!-- Summary Cards -->
    <div class="stats-grid">
        <div class="stat-card gradient-blue">
            <div class="stat-icon"><span class="material-symbols-outlined">receipt_long</span></div>
            <div class="stat-info"><span class="stat-value">{{ totalMilestones }}</span><span class="stat-label">Total
                    Milestones</span></div>
        </div>
        <div class="stat-card gradient-green">
            <div class="stat-icon"><span class="material-symbols-outlined">check_circle</span></div>
            <div class="stat-info"><span class="stat-value">{{ invoicedCount }}</span><span
                    class="stat-label">Invoiced</span></div>
        </div>
        <div class="stat-card gradient-red">
            <div class="stat-icon"><span class="material-symbols-outlined">pending</span></div>
            <div class="stat-info"><span class="stat-value">{{ outstandingCount }}</span><span
                    class="stat-label">Outstanding</span></div>
        </div>
        <div class="stat-card gradient-purple">
            <div class="stat-icon"><span class="material-symbols-outlined">payments</span></div>
            <div class="stat-info"><span class="stat-value">{{ totalBillingPercent }}%</span><span
                    class="stat-label">Avg Billing %</span></div>
        </div>
    </div>

    <!-- Grouped Table -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Project Invoices</h3>
            <div class="table-controls">
                <div class="search-box">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input v-model="searchQuery" type="text" placeholder="Search projects…" class="search-input" />
                </div>
                <select v-model="filterStatus" class="filter-select">
                    <option value="">All Statuses</option>
                    <option value="raised">Invoiced</option>
                    <option value="not-raised">Not Invoiced</option>
                </select>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="grouped-table">
                <thead>
                    <tr>
                        <th style="width: 40px;"></th>
                        <th>Project</th>
                        <th>Total</th>
                        <th>Invoiced</th>
                        <th>Outstanding</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="project in paginatedProjectGroups" :key="project.projectId">
                        <tr class="project-row" @click="toggleProject(project.projectId)">
                            <td class="expand-cell">
                                <span class="material-symbols-outlined expand-icon">
                                    {{ expandedProjects.has(project.projectId) ? 'expand_more' : 'chevron_right' }}
                                </span>
                            </td>
                            <td class="project-name-cell">{{ project.projectName }}</td>
                            <td>{{ project.totalMilestones }}</td>
                            <td><span class="count-badge invoiced">{{ project.invoicedCount }}</span></td>
                            <td><span class="count-badge outstanding">{{ project.outstandingCount }}</span></td>
                            <td>
                                <span :class="['status-badge', getProjectStatusClass(project)]">
                                    {{ getProjectStatusText(project) }}
                                </span>
                            </td>
                        </tr>

                        <tr v-if="expandedProjects.has(project.projectId)" class="expanded-detail-row">
                            <td colspan="6" class="expanded-detail-cell">
                                <div class="inner-table-container">
                                    <table class="inner-table">
                                        <thead>
                                            <tr>
                                                <th class="col-milestone">Milestone</th>
                                                <th class="col-plan">Plan Days</th>
                                                <th class="col-actual">Actual Days</th>
                                                <th class="col-billing">Billing %</th>
                                                <th class="col-status">Invoice Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-if="project.items.length === 0">
                                                <td colspan="5" class="no-milestones-message">
                                                    <span class="material-symbols-outlined">info</span>
                                                    No Milestone to be invoiced
                                                </td>
                                            </tr>
                                            <tr v-for="item in project.items" :key="item.milestoneId"
                                                class="milestone-row">
                                                <td class="col-milestone">{{ item.milestoneName }}</td>
                                                <td class="col-plan">{{ item.planDays }}</td>
                                                <td class="col-actual">{{ item.actualDays }}</td>
                                                <td class="col-billing">{{ item.billingPercent }}%</td>
                                                <td class="col-status">
                                                    <select v-model="item.invoiceStatus" class="status-select"
                                                        :class="item.invoiceStatus === 'raised' ? 'status-raised' : 'status-not-raised'"
                                                        @change="updateInvoiceStatus(item)">
                                                        <option value="not-raised">Not Raised</option>
                                                        <option value="raised">Raised</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-wrapper">
            <span class="pagination-info">
                Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredProjectGroups.length }} projects
            </span>
            <div class="pagination-controls">
                <button class="page-btn" @click="currentPage--" :disabled="currentPage === 1">
                    <span class="material-symbols-outlined">chevron_left</span>
                </button>
                <span class="page-number">Page {{ currentPage }} of {{ totalPages }}</span>
                <button class="page-btn" @click="currentPage++" :disabled="currentPage === totalPages">
                    <span class="material-symbols-outlined">chevron_right</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive } from 'vue'

export default {
    name: 'InvoiceTracking',
    setup() {
        const allProjects = ref([])
        const plannedMandayStore = ref({})
        const searchQuery = ref('')
        const filterStatus = ref('')
        const currentPage = ref(1)
        const itemsPerPage = 10
        const expandedProjects = reactive(new Set())

        const loadData = () => {
            try {
                const data = localStorage.getItem('saved_projects')
                if (data) {
                    allProjects.value = JSON.parse(data)
                } else {
                    allProjects.value = []
                }

                allProjects.value.forEach(project => {
                    const saved = localStorage.getItem(`planned_mandays_${project.id}`)
                    if (saved) {
                        plannedMandayStore.value[project.id] = JSON.parse(saved)
                    }
                })
            } catch (e) {
                console.error('Error loading data:', e)
            }
        }

        const saveProjects = () => {
            localStorage.setItem('saved_projects', JSON.stringify(allProjects.value))
        }

        const milestoneItems = computed(() => {
            const items = []
            allProjects.value.forEach(project => {
                const timeline = project.timeline
                if (!timeline || !timeline.groups) return

                const team = project.teamMembers || []
                const plannedAllocations = plannedMandayStore.value[project.id] || {}

                timeline.groups.forEach(group => {
                    const subs = group.subMilestones || group.subGroups || []

                    subs.forEach(sub => {
                        const invoiceStatus = sub.invoiceStatus || 'not-raised'
                        let planDays = 0
                        let actualDays = 0
                        let billingPercent = sub.billingPercentage || 0

                        team.forEach(member => {
                            const memberId = member.id || member.email || member.name
                            planDays += plannedAllocations[memberId]?.[sub.id] || 0
                        })

                        if (sub.tasks) {
                            sub.tasks.forEach(task => {
                                if (task.assignments) {
                                    team.forEach(member => {
                                        const memberId = member.id || member.email || member.name
                                        const assignment = task.assignments.find(a => a.memberId === memberId || a.email === member.email)
                                        if (assignment) actualDays += Number(assignment.actualMandays) || 0
                                    })
                                } else if (task.actualMandays) {
                                    actualDays += Number(task.actualMandays)
                                }
                            })
                        }
                        if (sub.actualMandays) actualDays += Number(sub.actualMandays)

                        if (!billingPercent && planDays > 0) {
                            billingPercent = Math.round((actualDays / planDays) * 100)
                        }

                        items.push({
                            projectId: project.id,
                            projectName: project.name || 'Unnamed',
                            milestoneId: sub.id,
                            milestoneName: sub.name || 'Unnamed Milestone',
                            planDays,
                            actualDays,
                            billingPercent,
                            invoiceStatus,
                            _sub: sub
                        })
                    })

                    if (group.tasks && group.tasks.length > 0) {
                        group.tasks.forEach(task => {
                            if (task.isMilestone) {
                                const invoiceStatus = task.invoiceStatus || 'not-raised'
                                let planDays = 0
                                let actualDays = 0
                                let billingPercent = task.billingPercentage || 0

                                team.forEach(member => {
                                    const memberId = member.id || member.email || member.name
                                    planDays += plannedAllocations[memberId]?.[task.id] || 0
                                })

                                if (task.assignments) {
                                    team.forEach(member => {
                                        const memberId = member.id || member.email || member.name
                                        const assignment = task.assignments.find(a => a.memberId === memberId || a.email === member.email)
                                        if (assignment) actualDays += Number(assignment.actualMandays) || 0
                                    })
                                } else if (task.actualMandays) {
                                    actualDays += Number(task.actualMandays)
                                }

                                if (!billingPercent && planDays > 0) {
                                    billingPercent = Math.round((actualDays / planDays) * 100)
                                }

                                items.push({
                                    projectId: project.id,
                                    projectName: project.name || 'Unnamed',
                                    milestoneId: task.id,
                                    milestoneName: task.name || 'Task',
                                    planDays,
                                    actualDays,
                                    billingPercent,
                                    invoiceStatus,
                                    _sub: task
                                })
                            }
                        })
                    }
                })
            })
            return items
        })

        const projectGroups = computed(() => {
            const map = new Map()

            allProjects.value.forEach(project => {
                map.set(project.id, {
                    projectId: project.id,
                    projectName: project.name || 'Unnamed',
                    items: [],
                    totalMilestones: 0,
                    invoicedCount: 0,
                    outstandingCount: 0
                })
            })

            milestoneItems.value.forEach(item => {
                const group = map.get(item.projectId)
                if (group) {
                    group.items.push(item)
                    group.totalMilestones++
                    if (item.invoiceStatus === 'raised') group.invoicedCount++
                    else group.outstandingCount++
                }
            })

            return Array.from(map.values())
        })

        const filteredProjectGroups = computed(() => {
            let groups = projectGroups.value
            const query = searchQuery.value.toLowerCase().trim()
            if (query) {
                groups = groups.filter(g => g.projectName.toLowerCase().includes(query))
            }
            if (filterStatus.value) {
                groups = groups.filter(g => {
                    if (g.items.length === 0) {
                        return filterStatus.value === 'not-raised'
                    }
                    return g.items.some(item => item.invoiceStatus === filterStatus.value)
                })
            }
            return groups
        })

        const totalPages = computed(() => Math.ceil(filteredProjectGroups.value.length / itemsPerPage) || 1)
        const paginatedProjectGroups = computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage
            return filteredProjectGroups.value.slice(start, start + itemsPerPage)
        })
        const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
        const paginationEnd = computed(() => Math.min(currentPage.value * itemsPerPage, filteredProjectGroups.value.length))

        const totalMilestones = computed(() => milestoneItems.value.length)
        const invoicedCount = computed(() => milestoneItems.value.filter(i => i.invoiceStatus === 'raised').length)
        const outstandingCount = computed(() => totalMilestones.value - invoicedCount.value)
        const totalBillingPercent = computed(() => {
            if (totalMilestones.value === 0) return 0
            const sum = milestoneItems.value.reduce((s, i) => s + (i.billingPercent || 0), 0)
            return Math.round(sum / totalMilestones.value)
        })

        const toggleProject = (projectId) => {
            if (expandedProjects.has(projectId)) {
                expandedProjects.delete(projectId)
            } else {
                expandedProjects.add(projectId)
            }
        }

        const updateInvoiceStatus = (item) => {
            item._sub.invoiceStatus = item.invoiceStatus
            saveProjects()
        }

        const getProjectStatusText = (project) => {
            if (project.totalMilestones === 0) return 'No Milestones'
            if (project.invoicedCount === project.totalMilestones) return 'All Invoiced'
            if (project.invoicedCount > 0) return 'Partial'
            return 'Not Invoiced'
        }
        const getProjectStatusClass = (project) => {
            if (project.totalMilestones === 0) return 'status-no-milestones'
            if (project.invoicedCount === project.totalMilestones) return 'status-invoiced'
            if (project.invoicedCount > 0) return 'status-partial'
            return 'status-not-invoiced'
        }

        watch([searchQuery, filterStatus], () => { currentPage.value = 1 })
        onMounted(() => loadData())

        return {
            allProjects, searchQuery, filterStatus, currentPage,
            milestoneItems, projectGroups, filteredProjectGroups, paginatedProjectGroups,
            totalPages, paginationStart, paginationEnd,
            totalMilestones, invoicedCount, outstandingCount, totalBillingPercent,
            expandedProjects, toggleProject,
            updateInvoiceStatus, getProjectStatusText, getProjectStatusClass,
        }
    }
}
</script>

<style scoped>

/* Stats */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
}

.stat-card {
    border-radius: 16px;
    padding: 20px;
    text-align: center;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: transform 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-icon {
    font-size: 28px;
    opacity: 0.9;
}

.stat-info {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.stat-value {
    font-size: 28px;
    font-weight: 700;
}

.stat-label {
    font-size: 13px;
    opacity: 0.9;
}

.gradient-blue {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
}

.gradient-green {
    background: linear-gradient(135deg, #059669, #10b981);
}

.gradient-red {
    background: linear-gradient(135deg, #dc2626, #f87171);
}

.gradient-purple {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
}

/* Card & Table */
.card {
    background: white;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
    padding: 24px;
}

.dark .card {
    background: #1e293b;
    border-color: #334155;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 16px;
}

.card-title {
    font-size: 18px;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
}

.dark .card-title {
    color: #f1f5f9;
}

.table-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
}

.search-icon {
    position: absolute;
    left: 10px;
    font-size: 18px;
    color: #64748b;
}

.search-input {
    padding: 8px 12px 8px 36px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    background: white;
    color: #1e293b;
    width: 220px;
    transition: border-color 0.2s;
}

.dark .search-input {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.search-input:focus {
    outline: none;
    border-color: #6366f1;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    background: white;
    color: #1e293b;
    min-width: 140px;
    transition: border-color 0.2s;
}

.dark .filter-select {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.filter-select:focus {
    outline: none;
    border-color: #6366f1;
}

.table-wrapper {
    overflow-x: auto;
}

.grouped-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
}

.grouped-table th {
    padding: 12px 16px;
    background: #f8fafc;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
    white-space: nowrap;
}

.dark .grouped-table th {
    background: #0f172a;
    border-bottom-color: #334155;
    color: #94a3b8;
}

.grouped-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
    vertical-align: middle;
}

.dark .grouped-table td {
    border-bottom-color: #1e293b;
    color: #cbd5e1;
}

.project-row {
    cursor: pointer;
    background: #f8fafc;
    transition: background 0.2s;
}

.dark .project-row {
    background: #0f172a;
}

.project-row:hover {
    background: #f1f5f9;
}

.dark .project-row:hover {
    background: #1e293b;
}

.project-name-cell {
    font-weight: 600;
}

.expand-cell {
    text-align: center;
    width: 40px;
}

.expand-icon {
    font-size: 18px;
    color: #64748b;
}

.count-badge {
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
}

.count-badge.invoiced {
    background: #d1fae5;
    color: #059669;
}

.count-badge.outstanding {
    background: #fee2e2;
    color: #dc2626;
}

.dark .count-badge.invoiced {
    background: #064e3b;
    color: #34d399;
}

.dark .count-badge.outstanding {
    background: #7f1d1d;
    color: #fca5a5;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}

.status-invoiced {
    background: #d1fae5;
    color: #059669;
}

.status-partial {
    background: #fef3c7;
    color: #d97706;
}

.status-not-invoiced {
    background: #fee2e2;
    color: #dc2626;
}

.status-no-milestones {
    background: #f1f5f9;
    color: #64748b;
}

.dark .status-invoiced {
    background: #064e3b;
    color: #34d399;
}

.dark .status-partial {
    background: #78350f;
    color: #fbbf24;
}

.dark .status-not-invoiced {
    background: #7f1d1d;
    color: #fca5a5;
}

.dark .status-no-milestones {
    background: #334155;
    color: #94a3b8;
}

/* Expanded detail area */
.expanded-detail-row td {
    padding: 0;
}

.expanded-detail-cell {
    padding: 0 !important;
    background: #fafbfc;
    border-left: 4px solid #6366f1;
}

.dark .expanded-detail-cell {
    background: #0f172a;
    border-left-color: #818cf8;
}

.inner-table-container {
    padding: 16px 24px 16px 40px;
}

.inner-table {
    width: 100%;
    border-collapse: collapse;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.dark .inner-table {
    background: #1e293b;
}

.inner-table th {
    padding: 10px 16px;
    background: #f1f5f9;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
}

.dark .inner-table th {
    background: #1e293b;
    border-bottom-color: #334155;
    color: #94a3b8;
}

.inner-table td {
    padding: 10px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
}

.dark .inner-table td {
    border-bottom-color: #1e293b;
    color: #cbd5e1;
}

.milestone-row:hover {
    background: #f8fafc;
}

.dark .milestone-row:hover {
    background: #0f172a;
}

/* Fixed column widths for alignment */
.col-milestone {
    width: 40%;
}

.col-plan {
    width: 15%;
}

.col-actual {
    width: 15%;
}

.col-billing {
    width: 10%;
}

.col-status {
    width: 20%;
}

.no-milestones-message {
    text-align: center;
    padding: 20px;
    color: #64748b;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
}

.no-milestones-message .material-symbols-outlined {
    font-size: 18px;
    opacity: 0.7;
}

.dark .no-milestones-message {
    color: #94a3b8;
}

.status-select {
    padding: 6px 10px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    background: white;
    color: #1e293b;
    min-width: 120px;
    cursor: pointer;
}

.dark .status-select {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.status-select:focus {
    outline: none;
    border-color: #6366f1;
}

.status-select.status-raised {
    border-color: #10b981;
    background: #d1fae5;
    color: #059669;
}

.status-select.status-not-raised {
    border-color: #ef4444;
    background: #fee2e2;
    color: #dc2626;
}

.dark .status-select.status-raised {
    background: #064e3b;
    color: #34d399;
    border-color: #059669;
}

.dark .status-select.status-not-raised {
    background: #7f1d1d;
    color: #fca5a5;
    border-color: #dc2626;
}

/* Pagination */
.pagination-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid #f1f5f9;
}

.dark .pagination-wrapper {
    border-top-color: #334155;
}

.pagination-info {
    font-size: 13px;
    color: #64748b;
}

.dark .pagination-info {
    color: #94a3b8;
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
    opacity: 0.4;
    cursor: not-allowed;
}

.page-number {
    font-size: 13px;
    color: #475569;
    font-weight: 500;
}

.dark .page-number {
    color: #94a3b8;
}

@media (max-width: 768px) {
    .invoice-tracking {
        padding: 16px 12px;
    }

    .card-header {
        flex-direction: column;
        align-items: stretch;
    }

    .table-controls {
        flex-direction: column;
        align-items: stretch;
        width: 100%;
    }

    .search-input {
        width: 100%;
    }

    .pagination-wrapper {
        flex-direction: column;
        gap: 12px;
    }
}
</style>