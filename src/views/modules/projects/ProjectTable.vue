<template>
    <div class="project-table-section">
        <!-- Card Header -->
        <div class="card-header">
            <div class="search-container">
                <span class="search-icon material-symbols-outlined">search</span>
                <input v-model="localSearchQuery" class="search-input" placeholder="Search" type="text"
                    @input="onSearchInput" @keyup.enter="onSearchEnter" />
            </div>
            <div class="header-right">
                <div class="filter-actions">
                    <select v-model="localSelectedPhase" class="filter-select" @change="onFilterChange">
                        <option value="all">All Phases</option>
                        <option value="discovery">Discovery</option>
                        <option value="development">Development</option>
                        <option value="uat">UAT</option>
                        <option value="deployment">Deployment</option>
                    </select>

                    <select v-model="localSelectedHealth" class="filter-select" @change="onFilterChange">
                        <option value="all">Health: All</option>
                        <option value="stable">Stable</option>
                        <option value="at-risk">At Risk</option>
                    </select>
                    
                    <button class="refresh-btn" @click="loadProjectsFromStorage" title="Refresh projects">
                        <span class="material-symbols-outlined">refresh</span>
                    </button>
                </div>
            </div>
        </div>

        <div class="table-container">
            <div class="compact-table">
                <div class="table-header-row-7">
                    <div class="table-header-cell">
                        <button class="sort-button" :class="{ 'active': sortField === 'name' }" @click="sort('name')">
                            Project Name
                            <span class="material-symbols-outlined sort-icon">
                                {{ sortField === 'name' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                            </span>
                        </button>
                    </div>
                    <div class="table-header-cell">Client</div>
                    <div class="table-header-cell">Phase/Status</div>
                    <div class="table-header-cell">
                        <button class="sort-button" :class="{ 'active': sortField === 'progress' }" @click="sort('progress')">
                            Progress
                            <span class="material-symbols-outlined sort-icon">
                                {{ sortField === 'progress' ? (sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward') : 'unfold_more' }}
                            </span>
                        </button>
                    </div>
                    <div class="table-header-cell text-center">Health</div>
                    <div class="table-header-cell">Next Milestone</div>
                    <div class="table-header-cell">Actions</div>
                </div>

                <!-- Table Body -->
                <div class="table-body">
                    <div v-for="project in paginatedProjects" :key="project.id"
                        :class="['table-row-7', { 'table-row-risk': project.health === 'at-risk' }]"
                        @click="onSelectProject(project)">

                        <!-- Project Name -->
                        <div class="table-cell">
                            <div class="project-name-wrapper">
                                <div :class="['project-icon', getProjectIconClass(project.type)]">
                                    <span class="material-symbols-outlined">{{ getProjectIcon(project.type) }}</span>
                                </div>
                                <div class="project-info">
                                    <span class="project-name">{{ project.name }}</span>
                                    <div v-if="project.code" class="project-code">{{ project.code }}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Client -->
                        <div class="table-cell">
                            <span class="client-name">{{ project.client || '—' }}</span>
                        </div>

                        <!-- Phase/Status -->
                        <div class="table-cell">
                            <span :class="['phase-badge', getPhaseClass(project.phase)]">{{ getPhaseDisplay(project.phase) }}</span>
                        </div>

                        <!-- Progress -->
                        <div class="table-cell">
                            <div class="progress-wrapper">
                                <div class="progress-track">
                                    <div :class="['progress-fill', getProgressFillClass(project)]"
                                        :style="{ width: `${getProjectProgress(project)}%` }"></div>
                                </div>
                                <span :class="['progress-percent', getProgressPercentClass(project)]">
                                    {{ getProjectProgress(project) }}%
                                </span>
                            </div>
                        </div>

                        <!-- Health -->
                        <div class="table-cell text-center">
                            <span :class="['health-icon', getHealthIconClass(project.health)]"
                                :title="getHealthTitle(project.health)" @click.stop="onShowProjectHealth(project)">
                                <span class="material-symbols-outlined">{{ getHealthIcon(project.health) }}</span>
                            </span>
                        </div>

                        <!-- Next Milestone -->
                        <div class="table-cell">
                            <div :class="['milestone-info', { 'milestone-delayed': project.nextMilestone?.status === 'delayed' }]">
                                <div class="milestone-title">{{ project.nextMilestone?.title || '—' }}</div>
                                <div class="milestone-date">{{ project.nextMilestone?.date || '—' }}</div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="table-cell">
                            <ActionButton 
                                :items="getActionMenuItems(project)" 
                                :contextData="project"
                                :dropdownPosition="'bottom-end'" 
                                :dropdownWidth="'200px'"
                                @action-click="handleActionClick" />
                        </div>
                    </div>

                    <!-- Empty State -->
                    <div v-if="paginatedProjects.length === 0" class="empty-state">
                        <div class="empty-state-content">
                            <span class="material-symbols-outlined empty-state-icon">search_off</span>
                            <h3>No projects found</h3>
                            <p v-if="searchQuery">No projects match your search "{{ searchQuery }}"</p>
                            <p v-else>Click "Create New Project" to get started</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination Footer -->
        <div class="card-footer">
            <span class="footer-text">
                Showing {{ paginationEnd }} of {{ filteredProjects.length }} projects
            </span>
            <div class="pagination">
                <button class="pagination-btn" @click="prevPage" :disabled="currentPage === 1">
                    <span class="material-symbols-outlined icon-xs">chevron_left</span>
                </button>
                <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
                <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
                    <span class="material-symbols-outlined icon-xs">chevron_right</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import ActionButton from "../../../../../components/ActionMenuBtn.vue";

export default {
    name: 'ProjectTable',
    components: {
        ActionButton
    },
    props: {
        projects: {
            type: Array,
            default: () => []
        },
        searchQuery: {
            type: String,
            default: ''
        },
        selectedPhase: {
            type: String,
            default: 'all'
        },
        selectedHealth: {
            type: String,
            default: 'all'
        },
        sortField: {
            type: String,
            default: 'name'
        },
        sortOrder: {
            type: String,
            default: 'asc'
        },
        itemsPerPage: {
            type: Number,
            default: 5
        }
    },
    emits: [
        'update:searchQuery',
        'update:selectedPhase',
        'update:selectedHealth',
        'update:sortField',
        'update:sortOrder',
        'search',
        'filter',
        'sort',
        'select-project',
        'show-health',
        'open-issue',
        'action-click',
        'projects-loaded'
    ],
    setup(props, { emit }) {
        // Local state
        const localSearchQuery = ref(props.searchQuery)
        const localSelectedPhase = ref(props.selectedPhase)
        const localSelectedHealth = ref(props.selectedHealth)
        const currentPage = ref(1)
        const localProjects = ref([])
        const router = useRouter()

        // Load projects from localStorage
        const loadProjectsFromStorage = () => {
            try {
                const savedProjects = localStorage.getItem('saved_projects')
                if (savedProjects) {
                    const projects = JSON.parse(savedProjects)
                    // Transform saved projects to match table format
                    localProjects.value = projects.map(project => transformProjectData(project))
                    console.log('Loaded projects from localStorage:', localProjects.value.length)
                    emit('projects-loaded', localProjects.value)
                } else {
                    // If no saved projects, use props projects
                    localProjects.value = [...props.projects]
                }
            } catch (error) {
                console.error('Error loading projects from localStorage:', error)
                localProjects.value = [...props.projects]
            }
        }

        // Transform saved project data to match table format
        const transformProjectData = (savedProject) => {
            // Calculate overall progress from milestones
            let overallProgress = 0
            let nextMilestone = null
            
            if (savedProject.milestones && savedProject.milestones.length > 0) {
                // Calculate average progress from milestones
                const totalProgress = savedProject.milestones.reduce((sum, m) => {
                    return sum + (m.totalMandays ? Math.min(100, (m.totalMandays / 100) * 100) : 0)
                }, 0)
                overallProgress = Math.round(totalProgress / savedProject.milestones.length)
                
                // Find next milestone (first unsaved or upcoming)
                const upcomingMilestone = savedProject.milestones.find(m => !m.isSaved)
                if (upcomingMilestone) {
                    nextMilestone = {
                        title: upcomingMilestone.name || 'Milestone',
                        date: upcomingMilestone.startDate || 'TBD',
                        status: 'upcoming'
                    }
                } else if (savedProject.milestones.length > 0) {
                    nextMilestone = {
                        title: savedProject.milestones[0].name || 'Complete',
                        date: savedProject.milestones[0].endDate || 'TBD',
                        status: 'completed'
                    }
                }
            }

            // Determine health based on progress and timeline
            let health = 'healthy'
            if (overallProgress < 30 && savedProject.createdAt) {
                const createdDate = new Date(savedProject.createdAt)
                const daysSinceCreation = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24))
                if (daysSinceCreation > 14 && overallProgress < 20) {
                    health = 'at-risk'
                } else if (daysSinceCreation > 7 && overallProgress < 10) {
                    health = 'caution'
                }
            }

            // Determine phase based on progress
            let phase = 'discovery'
            if (overallProgress >= 75) phase = 'deployment'
            else if (overallProgress >= 50) phase = 'uat'
            else if (overallProgress >= 25) phase = 'development'
            else phase = 'discovery'

            return {
                id: savedProject.id,
                name: savedProject.name,
                code: `PRJ-${String(savedProject.id).slice(-6)}`,
                client: savedProject.client || '—',
                type: savedProject.type || 'development',
                phase: phase,
                progress: overallProgress,
                health: health,
                icon: getProjectIconByType(savedProject.type),
                nextMilestone: nextMilestone,
                timelineCreated: savedProject.timelineCreated || false,
                createdAt: savedProject.createdAt,
                updatedAt: savedProject.updatedAt,
                rawData: savedProject // Keep original data for reference
            }
        }

        // Get project icon based on type
        const getProjectIconByType = (type) => {
            const icons = {
                development: 'code',
                maintenance: 'build',
                migration: 'sync_alt',
                research: 'science',
                crm: 'contacts',
                security: 'security'
            }
            return icons[type] || 'folder_special'
        }

        // Get project icon class
        const getProjectIconClass = (type) => {
            const classes = {
                crm: 'project-icon-primary',
                development: 'project-icon-primary',
                maintenance: 'project-icon-primary',
                migration: 'project-icon-migration',
                research: 'project-icon-primary',
                security: 'project-icon-security'
            }
            return classes[type] || 'project-icon-primary'
        }

        // Get project icon for display
        const getProjectIcon = (type) => {
            return getProjectIconByType(type)
        }

        // Get project progress
        const getProjectProgress = (project) => {
            return project.progress || 0
        }

        // Get phase display name
        const getPhaseDisplay = (phase) => {
            const display = {
                discovery: 'Discovery',
                development: 'Development',
                uat: 'UAT',
                deployment: 'Deployment'
            }
            return display[phase] || phase || 'Discovery'
        }

        // Get phase class
        const getPhaseClass = (phase) => {
            const classes = {
                'UAT': 'phase-uat',
                'uat': 'phase-uat',
                'Development': 'phase-development',
                'development': 'phase-development',
                'Deployment': 'phase-deployment',
                'deployment': 'phase-deployment',
                'Discovery': 'phase-discovery',
                'discovery': 'phase-discovery'
            }
            return classes[phase] || classes[phase?.toLowerCase()] || 'phase-discovery'
        }

        // Get progress fill class
        const getProgressFillClass = (project) => {
            if (project.health === 'at-risk') return 'progress-fill-risk'
            if (project.type === 'migration') return 'progress-fill-migration'
            if (project.type === 'security') return 'progress-fill-security'
            return 'progress-fill-primary'
        }

        // Get progress percent class
        const getProgressPercentClass = (project) => {
            return project.health === 'at-risk' ? 'progress-percent-risk' : 'progress-percent'
        }

        // Get health icon class
        const getHealthIconClass = (health) => {
            const classes = {
                healthy: 'health-healthy',
                'at-risk': 'health-risk health-pulse',
                caution: 'health-caution'
            }
            return classes[health] || 'health-healthy'
        }

        // Get health icon
        const getHealthIcon = (health) => {
            const icons = {
                healthy: 'check_circle',
                'at-risk': 'error',
                caution: 'pending'
            }
            return icons[health] || 'check_circle'
        }

        // Get health title
        const getHealthTitle = (health) => {
            const titles = {
                healthy: 'Healthy',
                'at-risk': 'At Risk',
                caution: 'Caution'
            }
            return titles[health] || 'Healthy'
        }

        // Watch for prop changes
        watch(() => props.projects, (newVal) => {
            if (newVal && newVal.length > 0 && localProjects.value.length === 0) {
                localProjects.value = [...newVal]
            }
        }, { deep: true })

        watch(() => props.searchQuery, (newVal) => {
            localSearchQuery.value = newVal
        })

        watch(() => props.selectedPhase, (newVal) => {
            localSelectedPhase.value = newVal
            currentPage.value = 1
        })

        watch(() => props.selectedHealth, (newVal) => {
            localSelectedHealth.value = newVal
            currentPage.value = 1
        })

        watch(localSearchQuery, () => {
            currentPage.value = 1
        })

        // Computed filtered projects
        const filteredProjects = computed(() => {
            let filtered = [...localProjects.value]

            // Apply search filter
            if (localSearchQuery.value) {
                const query = localSearchQuery.value.toLowerCase()
                filtered = filtered.filter(p =>
                    p.name?.toLowerCase().includes(query) ||
                    p.client?.toLowerCase().includes(query) ||
                    (p.code && p.code.toLowerCase().includes(query))
                )
            }

            // Apply phase filter
            if (localSelectedPhase.value !== 'all') {
                filtered = filtered.filter(p =>
                    p.phase?.toLowerCase() === localSelectedPhase.value.toLowerCase()
                )
            }

            // Apply health filter
            if (localSelectedHealth.value !== 'all') {
                filtered = filtered.filter(p => p.health === localSelectedHealth.value)
            }

            // Apply sorting
            filtered.sort((a, b) => {
                if (props.sortField === 'name') {
                    return props.sortOrder === 'asc'
                        ? (a.name || '').localeCompare(b.name || '')
                        : (b.name || '').localeCompare(a.name || '')
                } else if (props.sortField === 'progress') {
                    const aProgress = a.progress || 0
                    const bProgress = b.progress || 0
                    return props.sortOrder === 'asc' ? aProgress - bProgress : bProgress - aProgress
                }
                return 0
            })

            return filtered
        })

        // Pagination
        const totalPages = computed(() => {
            return Math.ceil(filteredProjects.value.length / props.itemsPerPage) || 1
        })

        const paginatedProjects = computed(() => {
            const start = (currentPage.value - 1) * props.itemsPerPage
            const end = start + props.itemsPerPage
            return filteredProjects.value.slice(start, end)
        })

        const paginationEnd = computed(() => {
            const end = currentPage.value * props.itemsPerPage
            return Math.min(end, filteredProjects.value.length)
        })

        // Pagination methods
        const prevPage = () => {
            if (currentPage.value > 1) {
                currentPage.value--
            }
        }

        const nextPage = () => {
            if (currentPage.value < totalPages.value) {
                currentPage.value++
            }
        }

        // Action Menu Items
        const getActionMenuItems = (project) => {
            return [
                {
                    label: 'View Details',
                    icon: 'visibility',
                    action: 'view_details',
                },
                {
                    label: 'Edit Project',
                    icon: 'edit',
                    action: 'edit',
                },
                {
                    label: project.rawData?.timelineCreated ? 'View Timeline' : 'Create Timeline',
                    icon: 'timeline',
                    action: 'manage_timeline',
                },
                { divider: true },
                {
                    label: 'Generate Report',
                    icon: 'assessment',
                    action: 'generate_report',
                },
                {
                    label: 'Archive',
                    icon: 'archive',
                    action: 'archive',
                    danger: true,
                }
            ];
        }

        // Event handlers
        const sort = (field) => {
            const order = props.sortField === field && props.sortOrder === 'asc' ? 'desc' : 'asc'
            emit('update:sortField', field)
            emit('update:sortOrder', order)
            emit('sort', { field, order })
            currentPage.value = 1
        }

        const onSearchInput = () => {
            emit('update:searchQuery', localSearchQuery.value)
        }

        const onSearchEnter = () => {
            emit('search', localSearchQuery.value)
        }

        const onFilterChange = () => {
            emit('update:selectedPhase', localSelectedPhase.value)
            emit('update:selectedHealth', localSelectedHealth.value)
            emit('filter', {
                phase: localSelectedPhase.value,
                health: localSelectedHealth.value
            })
            currentPage.value = 1
        }

        const onSelectProject = (project) => {
            emit('select-project', project)
        }

        const onShowProjectHealth = (project) => {
            emit('show-health', project)
        }

        const handleActionClick = (eventData) => {
            const { action, context } = eventData;
            
            switch (action) {
                case 'view_details':
                router.push(`/projects/${context.id}`)
                break
                case 'edit':
                router.push(`/projects/${context.id}/edit`)
                break
                case 'manage_timeline':
                if (context.timelineCreated) {
                    router.push(`/projects/${context.id}?tab=timeline`)
                } else {
                    router.push(`/projects/${context.id}/timeline/create`)
                }
                break
                default:
                console.log('Action:', action, 'for:', context.name);
            }
            
            emit('action-click', eventData);
        }

        // Refresh projects
        const refreshProjects = () => {
            loadProjectsFromStorage()
        }

        // Load projects on mount
        onMounted(() => {
            loadProjectsFromStorage()
            
            // Listen for storage events (when projects are saved from other tabs/windows)
            window.addEventListener('storage', (event) => {
                if (event.key === 'saved_projects') {
                    loadProjectsFromStorage()
                }
            })
        })

        return {
            // Local state
            localSearchQuery,
            localSelectedPhase,
            localSelectedHealth,
            currentPage,
            localProjects,

            // Props
            sortField: props.sortField,
            sortOrder: props.sortOrder,
            searchQuery: props.searchQuery,

            // Computed
            filteredProjects,
            paginatedProjects,
            totalPages,
            paginationEnd,

            // Methods
            getActionMenuItems,
            getProjectIconClass,
            getProjectIcon,
            getPhaseDisplay,
            getPhaseClass,
            getProjectProgress,
            getProgressFillClass,
            getProgressPercentClass,
            getHealthIconClass,
            getHealthIcon,
            getHealthTitle,
            sort,
            onSearchInput,
            onSearchEnter,
            onFilterChange,
            onSelectProject,
            onShowProjectHealth,
            handleActionClick,
            prevPage,
            nextPage,
            loadProjectsFromStorage,
            refreshProjects
        }
    }
}
</script>

<style scoped>
@import '../../../../../styles/views/projects/ProjectTable.css';
@import '../../../../../styles/shared/table.css';

.refresh-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border-light);
    background: var(--card-light);
    color: var(--muted-light);
    cursor: pointer;
    transition: all 0.2s ease;
}

.refresh-btn:hover {
    background: var(--bg-header);
    color: var(--primary);
    transform: rotate(180deg);
}

.dark .refresh-btn {
    background: var(--card-dark);
    border-color: var(--border-dark);
    color: var(--muted-dark);
}

.dark .refresh-btn:hover {
    background: var(--dark-bg-header);
    color: var(--primary);
}

.filter-actions {
    display: flex;
    gap: 12px;
    align-items: center;
}
</style>