<template>

    <!-- Stats Cards -->
    <div class="stats-grid">
        <div class="stat-card gradient-blue">
            <div class="stat-icon"><span class="material-symbols-outlined">group</span></div>
            <div class="stat-info"><span class="stat-value">{{ resourceSummaries.length }}</span><span
                    class="stat-label">Total Resources</span></div>
        </div>
        <div class="stat-card gradient-green">
            <div class="stat-icon"><span class="material-symbols-outlined">calendar_month</span></div>
            <div class="stat-info"><span class="stat-value">{{ avgPlanPerResource }}</span><span class="stat-label">Avg
                    Plan Days / Resource</span></div>
        </div>
        <div class="stat-card gradient-purple">
            <div class="stat-icon"><span class="material-symbols-outlined">assignment</span></div>
            <div class="stat-info"><span class="stat-value">{{ avgActualPerResource }}</span><span
                    class="stat-label">Avg Actual Days / Resource</span></div>
        </div>
        <div class="stat-card gradient-red">
            <div class="stat-icon"><span class="material-symbols-outlined">trending_up</span></div>
            <div class="stat-info"><span class="stat-value">{{ overAllocatedCount }}</span><span
                    class="stat-label">Over‑allocated</span></div>
        </div>
        <div class="stat-card gradient-orange">
            <div class="stat-icon"><span class="material-symbols-outlined">trending_down</span></div>
            <div class="stat-info"><span class="stat-value">{{ underAllocatedCount }}</span><span
                    class="stat-label">Under‑allocated</span></div>
        </div>
    </div>

    <!-- Resource Summary Table -->
    <div class="card">
        <div class="card-header">
            <h3 class="card-title">Resource Summary</h3>
            <div class="table-controls">
                <div class="search-box">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input v-model="searchQuery" type="text" placeholder="Search by name..." class="search-input" />
                </div>
                <button class="advanced-filter-btn" @click="showAdvancedFilters = !showAdvancedFilters">
                    <span class="material-symbols-outlined">filter_list</span>
                    <span class="material-symbols-outlined chevron"
                        :class="{ rotated: showAdvancedFilters }">expand_more</span>
                </button>
            </div>
        </div>

        <!-- Advanced Filters Card -->
        <div v-if="showAdvancedFilters" class="advanced-filters-card">
            <div class="filters-grid">
                <div class="filter-item">
                    <label class="filter-label">Title</label>
                    <select v-model="filterTitle" class="filter-select">
                        <option value="">All Titles</option>
                        <option v-for="title in uniqueTitles" :key="title" :value="title">{{ title }}</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">Department</label>
                    <select v-model="filterDepartment" class="filter-select">
                        <option value="">All Departments</option>
                        <option v-for="dept in uniqueDepartments" :key="dept" :value="dept">{{ dept }}</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">Status</label>
                    <select v-model="filterStatus" class="filter-select">
                        <option value="">All Statuses</option>
                        <option value="Over‑allocated">Over‑allocated</option>
                        <option value="Under‑allocated">Under‑allocated</option>
                        <option value="Not Started">Not Started</option>
                    </select>
                </div>
                <div class="filter-item">
                    <label class="filter-label">Projects / Tasks</label>
                    <input v-model.number="filterProjectCount" type="number" min="0" placeholder="e.g. 3"
                        class="filter-select" />
                </div>
            </div>
            <div class="filters-actions">
                <button class="btn-secondary" @click="clearFilters">Clear Filters</button>
            </div>
        </div>

        <div class="table-wrapper">
            <table class="resource-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Title</th>
                        <th>Department</th>
                        <th>Projects / Tasks</th>
                        <th>Plan Days</th>
                        <th>Actual Days</th>
                        <th>Allocation Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="res in paginatedSummaries" :key="res.resourceName">
                        <td>{{ res.resourceName }}</td>
                        <td>{{ res.resourceTitle || '—' }}</td>
                        <td>{{ res.department || '—' }}</td>
                        <td>
                            <button class="link-btn" @click="openProjectModal(res)"
                                :title="'View projects for ' + res.resourceName">
                                {{ res.projectCount }}
                            </button>
                        </td>
                        <td>{{ res.totalPlanDays }}</td>
                        <td>{{ res.totalActualDays }}</td>
                        <td>
                            <span :class="['status-badge', res.statusClass]">{{ res.status }}</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-wrapper">
            <span class="pagination-info">
                Showing {{ paginationStart }}–{{ paginationEnd }} of {{ filteredSummaries.length }} resources
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

    <!-- Modal for Project/Task Details -->
    <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
            <div class="modal-header">
                <h4>{{ selectedResource?.resourceName }} – Projects / Tasks</h4>
                <button class="modal-close-btn" @click="closeModal"><span
                        class="material-symbols-outlined">close</span></button>
            </div>
            <div class="modal-body">
                <table class="modal-table">
                    <thead>
                        <tr>
                            <th>Project / Task</th>
                            <th>Plan Days</th>
                            <th>Actual Days</th>
                            <th>Average WorkTime</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(item, idx) in selectedResourceProjects" :key="idx">
                            <td>{{ item.projectName }}</td>
                            <td>{{ item.planSum }}</td>
                            <td>{{ item.actualSum }}</td>
                            <td>{{ Math.round((item.planSum + item.actualSum) / 2) }}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr class="total-row">
                            <td><strong>Total</strong></td>
                            <td><strong>{{ selectedResourceTotalPlan }}</strong></td>
                            <td><strong>{{ selectedResourceTotalActual }}</strong></td>
                            <td><strong>{{ selectedResourceWorkTimeAvg }}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            <div class="modal-footer"><button class="btn-secondary" @click="closeModal">Close</button></div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'

export default {
    name: 'PMOResourcesList',
    setup() {
        const allProjects = ref([])
        const plannedMandayStore = ref({})
        const searchQuery = ref('')
        const filterTitle = ref('')
        const filterDepartment = ref('')
        const filterStatus = ref('')
        const filterProjectCount = ref(null)
        const currentPage = ref(1)
        const itemsPerPage = 10
        const showAdvancedFilters = ref(false)
        const showModal = ref(false)
        const selectedResource = ref(null)

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
                console.error('Error loading resource data:', e)
            }
        }

        const resourceRawEntries = computed(() => {
            const entries = []
            allProjects.value.forEach(project => {
                const team = project.teamMembers || []
                const timeline = project.timeline
                if (!team.length) return
                const planned = plannedMandayStore.value[project.id] || {}

                team.forEach(member => {
                    const memberId = member.id || member.email || member.name
                    const memberName = member.name || member.email || 'Unknown'
                    const department = member.department || '—'
                    const title = member.title || member.role || '—'

                    let planSum = 0
                    let actualSum = 0

                    if (timeline && timeline.groups) {
                        timeline.groups.forEach(group => {
                            const subs = group.subMilestones || group.subGroups || []
                            subs.forEach(sub => {
                                planSum += planned[memberId]?.[sub.id] || 0
                                if (sub.tasks) {
                                    sub.tasks.forEach(task => {
                                        if (task.assignments) {
                                            const assignment = task.assignments.find(a => a.memberId === memberId || a.email === member.email)
                                            if (assignment) actualSum += Number(assignment.actualMandays) || 0
                                        } else if (task.actualMandays) {
                                            actualSum += Number(task.actualMandays)
                                        }
                                    })
                                }
                                if (sub.actualMandays) actualSum += Number(sub.actualMandays)
                            })

                            if (group.tasks && subs.length === 0) {
                                group.tasks.forEach(task => {
                                    planSum += planned[memberId]?.[task.id] || 0
                                    if (task.assignments) {
                                        const assignment = task.assignments.find(a => a.memberId === memberId || a.email === member.email)
                                        if (assignment) actualSum += Number(assignment.actualMandays) || 0
                                    } else if (task.actualMandays) {
                                        actualSum += Number(task.actualMandays)
                                    }
                                })
                            }
                        })
                    }

                    entries.push({
                        resourceName: memberName,
                        resourceTitle: title,
                        department,
                        projectId: project.id,
                        projectName: project.name || 'Unnamed',
                        planSum,
                        actualSum
                    })
                })
            })
            return entries
        })

        const resourceSummaries = computed(() => {
            const map = new Map()
            resourceRawEntries.value.forEach(entry => {
                const key = entry.resourceName
                if (!map.has(key)) {
                    map.set(key, {
                        resourceName: entry.resourceName,
                        resourceTitle: entry.resourceTitle,
                        department: entry.department,
                        projectIds: new Set(),
                        totalPlanDays: 0,
                        totalActualDays: 0,
                        rawEntries: []
                    })
                }
                const summary = map.get(key)
                summary.projectIds.add(entry.projectId)
                summary.totalPlanDays += entry.planSum
                summary.totalActualDays += entry.actualSum
                summary.rawEntries.push({
                    projectName: entry.projectName,
                    planSum: entry.planSum,
                    actualSum: entry.actualSum
                })
            })

            const result = []
            for (const [name, s] of map) {
                const projectCount = s.projectIds.size
                let status = 'New'
                let statusClass = 'status-not-started'
                if (projectCount > 3) {
                    status = 'Over‑allocated'
                    statusClass = 'status-over'
                } else if (projectCount > 0) {
                    status = 'Under‑allocated'
                    statusClass = 'status-under'
                }
                result.push({
                    resourceName: s.resourceName,
                    resourceTitle: s.resourceTitle,
                    department: s.department,
                    projectCount,
                    totalPlanDays: s.totalPlanDays,
                    totalActualDays: s.totalActualDays,
                    status,
                    statusClass,
                    rawEntries: s.rawEntries
                })
            }
            return result
        })

        const selectedResourceWorkTimeAvg = computed(() => {
            const res = selectedResource.value
            if (!res || res.projectCount === 0) return 0
            // Overall average worktime = (avgPlan + avgActual) / 2
            return Math.round((selectedResourceAvgPlan.value + selectedResourceAvgActual.value) / 2)
        })

        const uniqueTitles = computed(() => {
            const titles = new Set(resourceSummaries.value.map(r => r.resourceTitle).filter(Boolean))
            return Array.from(titles).sort()
        })
        const uniqueDepartments = computed(() => {
            const depts = new Set(resourceSummaries.value.map(r => r.department).filter(Boolean))
            return Array.from(depts).sort()
        })

        const filteredSummaries = computed(() => {
            let result = resourceSummaries.value
            const query = searchQuery.value.toLowerCase().trim()
            if (query) result = result.filter(r => r.resourceName.toLowerCase().includes(query))
            if (filterTitle.value) result = result.filter(r => r.resourceTitle === filterTitle.value)
            if (filterDepartment.value) result = result.filter(r => r.department === filterDepartment.value)
            if (filterStatus.value) result = result.filter(r => r.status === filterStatus.value)
            if (filterProjectCount.value !== null && filterProjectCount.value !== '') {
                const num = Number(filterProjectCount.value)
                if (!isNaN(num)) result = result.filter(r => r.projectCount === num)
            }
            return result
        })

        const totalPages = computed(() => Math.ceil(filteredSummaries.value.length / itemsPerPage) || 1)
        const paginatedSummaries = computed(() => {
            const start = (currentPage.value - 1) * itemsPerPage
            return filteredSummaries.value.slice(start, start + itemsPerPage)
        })
        const paginationStart = computed(() => (currentPage.value - 1) * itemsPerPage + 1)
        const paginationEnd = computed(() => Math.min(currentPage.value * itemsPerPage, filteredSummaries.value.length))

        const totalPlanMandays = computed(() => resourceSummaries.value.reduce((s, r) => s + r.totalPlanDays, 0))
        const totalActualMandays = computed(() => resourceSummaries.value.reduce((s, r) => s + r.totalActualDays, 0))
        const avgPlanPerResource = computed(() => {
            const count = resourceSummaries.value.length
            return count ? Math.round(totalPlanMandays.value / count) : 0
        })
        const avgActualPerResource = computed(() => {
            const count = resourceSummaries.value.length
            return count ? Math.round(totalActualMandays.value / count) : 0
        })
        const overAllocatedCount = computed(() => resourceSummaries.value.filter(r => r.status === 'Over‑allocated').length)
        const underAllocatedCount = computed(() => resourceSummaries.value.filter(r => r.status === 'Under‑allocated').length)

        // Modal logic
        const openProjectModal = (resource) => {
            selectedResource.value = resource
            showModal.value = true
        }
        const closeModal = () => {
            showModal.value = false
            selectedResource.value = null
        }
        const selectedResourceProjects = computed(() => selectedResource.value?.rawEntries || [])

        const selectedResourceTotalPlan = computed(() => selectedResource.value?.totalPlanDays || 0)
        const selectedResourceTotalActual = computed(() => selectedResource.value?.totalActualDays || 0)
        const selectedResourceAvgPlan = computed(() => {
            const res = selectedResource.value
            if (!res || res.projectCount === 0) return 0
            return Math.round(res.totalPlanDays / res.projectCount)
        })
        const selectedResourceAvgActual = computed(() => {
            const res = selectedResource.value
            if (!res || res.projectCount === 0) return 0
            return Math.round(res.totalActualDays / res.projectCount)
        })

        const clearFilters = () => {
            searchQuery.value = ''
            filterTitle.value = ''
            filterDepartment.value = ''
            filterStatus.value = ''
            filterProjectCount.value = null
        }

        watch([searchQuery, filterTitle, filterDepartment, filterStatus, filterProjectCount], () => {
            currentPage.value = 1
        })

        onMounted(() => loadData())

        return {
            allProjects,
            resourceSummaries, filteredSummaries, paginatedSummaries,
            totalPages, paginationStart, paginationEnd, currentPage,
            searchQuery, filterTitle, filterDepartment, filterStatus, filterProjectCount,
            uniqueTitles, uniqueDepartments, showAdvancedFilters, clearFilters,
            totalPlanMandays, totalActualMandays, avgPlanPerResource, avgActualPerResource,
            overAllocatedCount, underAllocatedCount,
            openProjectModal, closeModal, showModal, selectedResource,
            selectedResourceProjects,
            selectedResourceTotalPlan, selectedResourceTotalActual,
            selectedResourceAvgPlan, selectedResourceAvgActual, selectedResourceWorkTimeAvg,
        }
    }
}
</script>

<style scoped>

/* ============================================
   PMO RESOURCES LIST - COMPLETE STYLES
   ============================================ */

/* Stats cards */
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
    transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
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

.gradient-purple {
    background: linear-gradient(135deg, #7c3aed, #a78bfa);
}

.gradient-red {
    background: linear-gradient(135deg, #dc2626, #f87171);
}

.gradient-orange {
    background: linear-gradient(135deg, #d97706, #fbbf24);
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
    transition: border-color 0.2s, box-shadow 0.2s;
}

.dark .search-input {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.advanced-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.dark .advanced-filter-btn {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.advanced-filter-btn:hover {
    border-color: #6366f1;
    color: #6366f1;
    background: #f8fafc;
}

.dark .advanced-filter-btn:hover {
    background: #0f172a;
}

.chevron {
    font-size: 18px;
    transition: transform 0.2s ease;
}

.chevron.rotated {
    transform: rotate(180deg);
}

.advanced-filters-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    animation: slideDown 0.2s ease;
}

.dark .advanced-filters-card {
    background: #0f172a;
    border-color: #334155;
}

@keyframes slideDown {
    from {
        opacity: 0;
        transform: translateY(-8px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 16px;
    margin-bottom: 16px;
}

.filter-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.filter-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.dark .filter-label {
    color: #94a3b8;
}

.filter-select {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 13px;
    background: white;
    color: #1e293b;
    min-width: 120px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.dark .filter-select {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.filter-select:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.filters-actions {
    display: flex;
    justify-content: flex-end;
}

.table-wrapper {
    overflow-x: auto;
}

.resource-table {
    width: 100%;
    border-collapse: collapse;
    min-width: 700px;
}

.resource-table th {
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

.dark .resource-table th {
    background: #0f172a;
    border-bottom-color: #334155;
    color: #94a3b8;
}

.resource-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
    vertical-align: middle;
}

.dark .resource-table td {
    border-bottom-color: #1e293b;
    color: #cbd5e1;
}

.resource-table tbody tr:hover {
    background: #f8fafc;
}

.dark .resource-table tbody tr:hover {
    background: #1e293b;
}

.link-btn {
    background: none;
    border: none;
    color: #4f46e5;
    font-weight: 600;
    cursor: pointer;
    text-decoration: underline;
    font-size: 13px;
    padding: 0;
    transition: color 0.2s;
}

.link-btn:hover {
    color: #4338ca;
}

.status-badge {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
}

.status-over {
    background: #fee2e2;
    color: #dc2626;
}

.dark .status-over {
    background: #7f1d1d;
    color: #fca5a5;
}

.status-under {
    background: #d1fae5;
    color: #059669;
}

.dark .status-under {
    background: #064e3b;
    color: #34d399;
}

.status-not-started {
    background: #f1f5f9;
    color: #64748b;
}

.dark .status-not-started {
    background: #334155;
    color: #94a3b8;
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
    background: #f8fafc;
}

.dark .page-btn:hover:not(:disabled) {
    background: #0f172a;
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

/* Modal */
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
}

.modal-content {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalFadeIn 0.2s ease;
}

.dark .modal-content {
    background: #1e293b;
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: scale(0.95);
    }

    to {
        opacity: 1;
        transform: scale(1);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
}

.dark .modal-header {
    border-bottom-color: #334155;
}

.modal-header h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
}

.dark .modal-header h4 {
    color: #f1f5f9;
}

.modal-close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 6px;
    color: #64748b;
    transition: background 0.2s;
}

.modal-close-btn:hover {
    background: #f1f5f9;
}

.dark .modal-close-btn:hover {
    background: #334155;
}

.modal-body {
    padding: 20px 24px;
    overflow-y: auto;
    flex: 1;
}

.modal-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: #f8fafc;
    border-radius: 8px;
}

.dark .modal-stat-item {
    background: #0f172a;
}

.modal-stat-label {
    font-size: 11px;
    color: #64748b;
    font-weight: 500;
}

.dark .modal-stat-label {
    color: #94a3b8;
}

.modal-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: #1e293b;
}

.dark .modal-stat-value {
    color: #f1f5f9;
}

.modal-footer {
    padding: 16px 24px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: flex-end;
}

.dark .modal-footer {
    border-top-color: #334155;
}

.modal-table {
    width: 100%;
    border-collapse: collapse;
}

.modal-table th {
    padding: 8px 12px;
    background: #f8fafc;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    color: #64748b;
    border-bottom: 1px solid #e2e8f0;
}

.dark .modal-table th {
    background: #0f172a;
    color: #94a3b8;
    border-bottom-color: #334155;
}

.modal-table td {
    padding: 8px 12px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
    color: #1e293b;
}

.dark .modal-table td {
    border-bottom-color: #1e293b;
    color: #cbd5e1;
}

/* Total row in modal table */
.modal-table tfoot tr.total-row {
    background: #f8fafc;
    border-top: 2px solid #e2e8f0;
}

.dark .modal-table tfoot tr.total-row {
    background: #0f172a;
    border-top-color: #334155;
}

.btn-secondary {
    padding: 8px 16px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    color: #475569;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.dark .btn-secondary {
    background: #1e293b;
    border-color: #334155;
    color: #cbd5e1;
}

.btn-secondary:hover {
    background: #f8fafc;
    border-color: #cbd5e1;
}

.dark .btn-secondary:hover {
    background: #0f172a;
    border-color: #475569;
}

@media (max-width: 768px) {
    .pmo-resources {
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

    .advanced-filter-btn {
        justify-content: center;
        width: 100%;
    }

    .filters-grid {
        grid-template-columns: 1fr;
    }

    .pagination-wrapper {
        flex-direction: column;
        gap: 12px;
    }

    .pagination-controls {
        width: 100%;
        justify-content: center;
    }

    .modal-content {
        width: 95%;
        max-width: 95vw;
    }

}
</style>