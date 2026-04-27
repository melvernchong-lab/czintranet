<template>
  <div class="saved-timeline-container">
    <!-- View Toggle -->
    <div class="view-toggle-container" v-if="hasTimelineData">
      <div class="view-toggle">
        <button @click="currentView = 'list'" :class="['view-btn', { active: currentView === 'list' }]">
          <span class="material-symbols-outlined">view_list</span>
          List View
        </button>
        <button @click="currentView = 'gantt'" :class="['view-btn', { active: currentView === 'gantt' }]">
          <span class="material-symbols-outlined">view_timeline</span>
          Gantt Chart
        </button>
        <button @click="currentView = 'calendar'" :class="['view-btn', { active: currentView === 'calendar' }]">
          <span class="material-symbols-outlined">calendar_month</span>
          Calendar View
        </button>
      </div>
    </div>

    <!-- Gantt Chart View -->
    <div v-if="currentView === 'gantt'" class="gantt-view-container">
      <div v-if="hasTimelineData && timelineGroups.length > 0" class="gantt-wrapper">
        <GanttChart :project-start-date="projectStartDate" :project-milestones="ganttMilestones"
          :team-members="teamMembers" :timeline-data="timelineDataForGantt" />
      </div>
      <div v-else class="no-data-message">
        <span class="material-symbols-outlined">timeline</span>
        <p>No timeline data available</p>
        <p class="hint">Create tasks in the Define Timeline view first</p>
      </div>
    </div>

    <!-- List View (Hierarchical) -->
    <div v-if="currentView === 'list' && hasTimelineData" class="list-view-hierarchical">
      <!-- Toolbar -->
      <div class="list-toolbar">
        <div class="toolbar-left">
          <span class="selection-count">{{ selectedItems.size }} of {{ totalItemsCount }} selected</span>
          <div class="view-filter">
            <label>View:</label>
            <select v-model="listFilterLevel" class="level-select">
              <option value="all">All Levels</option>
              <option value="1">Level 1 Outline</option>
              <option value="2">Level 2 Outline</option>
              <option value="3">Level 3 Outline</option>
              <option value="4">Level 4 Outline</option>
            </select>
          </div>
        </div>
        <div class="toolbar-right">
          <button class="action-btn-small" @click="toggleExpandAll">
            <span class="material-symbols-outlined">{{ isAllExpanded ? 'unfold_less' : 'unfold_more' }}</span>
            {{ isAllExpanded ? 'Collapse All' : 'Expand All' }}
          </button>
          <button class="action-btn-small primary" @click="applySelectionToGantt">
            <span class="material-symbols-outlined">checklist</span>
            Apply to Gantt
          </button>

          <template v-if="!isEditMode">
            <button class="action-btn-small" @click="enterEditMode">
              <span class="material-symbols-outlined">edit</span>
              Edit
            </button>
          </template>
          <template v-else>
            <button class="action-btn-small primary" @click="saveEditMode">
              <span class="material-symbols-outlined">save</span>
              Save
            </button>
            <button class="action-btn-small" @click="cancelEditMode">
              <span class="material-symbols-outlined">close</span>
              Cancel
            </button>
          </template>
        </div>
      </div>

      <!-- Hierarchical Table -->
      <div class="hierarchical-table-wrapper">
        <table class="hierarchical-table">
          <thead>
            <tr>
              <th class="col-checkbox"><input type="checkbox" :checked="areAllSelected" @change="toggleSelectAll" />
              </th>
              <th class="col-type">Type</th>
              <th class="col-title">Task/Milestone Title</th>
              <th class="col-start">Start Date</th>
              <th class="col-end">End Date</th>
              <th class="col-duration">Duration (days)</th>
              <th class="col-pred">Predecessors</th>
              <th class="col-progress">% Complete</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="group in filteredGroups" :key="group.id">
              <HierarchicalRow :node="group" :level="0" :expanded-state="expandedState" :selected-items="selectedItems"
                :all-tasks-map="allTasksMap" :is-edit-mode="isEditMode" :filter-level="listFilterLevel"
                :is-highlighted="isRowHighlighted(group)" @toggle-expand="toggleExpand" @toggle-select="toggleSelect"
                @toggle-select-group="toggleSelectGroup" @update-node="updateNode"
                @toggle-milestone="toggleMilestone" />
            </template>
          </tbody>
          <tfoot class="summary-footer">
            <tr>
              <td class="col-checkbox">
                <input type="checkbox" :checked="areAllSelected" @change="toggleSelectAll" />
              </td>
              <td class="col-type">
                <span class="type-badge summary-badge">Summary</span>
              </td>
              <td class="col-title" :style="{ paddingLeft: '12px' }">
                <span class="node-name" style="font-weight: 700;">{{ projectName || timelineName || 'Project Summary'
                  }}</span>
              </td>
              <td class="col-start">{{ formatDate(projectEarliestDate) }}</td>
              <td class="col-end">{{ formatDate(projectLatestDate) }}</td>
              <td class="col-duration">{{ projectTotalDuration }}</td>
              <td class="col-pred">—</td>
              <td class="col-progress">
                <div class="progress-wrapper">
                  <div class="progress-bar" :style="{ width: projectAverageProgress + '%' }"></div>
                  <span class="progress-text">{{ projectAverageProgress }}%</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Calendar View -->
    <div v-if="currentView === 'calendar' && hasTimelineData" class="calendar-view">
      <div class="calendar-header">
        <button @click="prevMonth" class="calendar-nav-btn">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <h3>{{ currentMonthName }} {{ currentYear }}</h3>
        <button @click="nextMonth" class="calendar-nav-btn">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
      <div class="calendar-grid">
        <div class="calendar-weekdays">
          <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
        </div>
        <div class="calendar-days">
          <div v-for="day in calendarDays" :key="day.date" class="calendar-day"
            :class="{ 'other-month': !day.isCurrentMonth, 'has-tasks': day.tasks?.length }">
            <span class="day-number">{{ day.day }}</span>
            <div class="day-tasks">
              <div v-for="task in day.tasks?.slice(0, 2)" :key="task.id" class="day-task" :title="task.name">
                {{ truncateText(task.name, 15) }}
              </div>
              <div v-if="day.tasks?.length > 2" class="more-tasks">+{{ day.tasks.length - 2 }} more</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading / Empty states -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading timeline data...</p>
    </div>
    <div v-if="!isLoading && !hasTimelineData" class="empty-state">
      <span class="material-symbols-outlined">timeline</span>
      <h3>No Timeline Data</h3>
      <p>No timeline has been created for this project yet.</p>
      <button class="create-timeline-btn" @click="$emit('create-timeline')">
        <span class="material-symbols-outlined">add</span>
        Create Timeline
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, reactive, h } from 'vue'
import GanttChart from '../../../../../components/GanttChart.vue'

// Helper: collect all leaf tasks under a node (used for aggregation and summary)
const collectAllTasks = (node) => {
  const tasks = []
  const traverse = (n) => {
    if (!n.subMilestones && !n.tasks) {
      if (n.startDate && n.endDate) tasks.push(n)
    }
    if (n.subMilestones) n.subMilestones.forEach(traverse)
    if (n.tasks) n.tasks.forEach(traverse)
    if (n.children) n.children.forEach(traverse)
  }
  traverse(node)
  return tasks
}

// Helper: get level text (internal use)
const getLevelText = (level) => {
  return `Outline ${level}`
}

// -----------------------------------------------------------------
// Recursive component (Level column removed from UI)
// -----------------------------------------------------------------
const HierarchicalRow = {
  name: 'HierarchicalRow',
  props: {
    node: { type: Object, required: true },
    level: { type: Number, default: 0 },
    expandedState: { type: Object, required: true },
    selectedItems: { type: Set, required: true },
    allTasksMap: { type: Map, required: true },
    isEditMode: { type: Boolean, default: false },
    filterLevel: { type: String, default: 'all' },
    isHighlighted: { type: Boolean, default: false }
  },
  emits: ['toggle-expand', 'toggle-select', 'toggle-select-group', 'update-node', 'toggle-milestone', 'show-notification'],
  setup(props, { emit }) {
    const isExpanded = computed(() => props.expandedState[props.node.id] !== false)
    const isSelected = computed(() => props.selectedItems.has(props.node.id))

    const isGroup = computed(() => {
      return props.node.subMilestones !== undefined || props.node.tasks !== undefined
    })

    const hasSubMilestones = computed(() => props.node.subMilestones?.length > 0)
    const hasTasks = computed(() => props.node.tasks?.length > 0)
    const hasChildren = computed(() => props.node.children?.length > 0)

    const indentStyle = computed(() => ({ paddingLeft: `${props.level * 24 + 12}px` }))

    const predecessorString = computed(() => {
      if (!props.node.relationships?.length) return '—'
      const incoming = props.node.relationships.filter(r => r.direction === 'incoming')
      if (!incoming.length) return '—'
      return incoming.map(r => {
        const pred = props.allTasksMap.get(r.taskId)
        return pred?.displayId || r.taskId?.slice(-8) || '?'
      }).join(', ')
    })

    const formatDate = (date) => {
      if (!date) return '—'
      const d = new Date(date)
      return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    }

    // --- Aggregation helpers for group rows ---
    const getEarliestStart = (node) => {
      const tasks = collectAllTasks(node)
      if (tasks.length === 0) return null
      let earliest = tasks[0].startDate
      tasks.forEach(t => {
        if (t.startDate && (!earliest || t.startDate < earliest)) earliest = t.startDate
      })
      return earliest
    }

    const getLatestEnd = (node) => {
      const tasks = collectAllTasks(node)
      if (tasks.length === 0) return null
      let latest = tasks[0].endDate
      tasks.forEach(t => {
        if (t.endDate && (!latest || t.endDate > latest)) latest = t.endDate
      })
      return latest
    }

    const getDurationDays = (start, end) => {
      if (!start || !end) return 0
      const s = new Date(start)
      const e = new Date(end)
      if (isNaN(s) || isNaN(e)) return 0
      const diff = e - s
      return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
    }

    const getAggregatedProgress = (node) => {
      const tasks = collectAllTasks(node)
      if (tasks.length === 0) return 0
      const total = tasks.reduce((sum, t) => sum + (t.progress || 0), 0)
      return Math.round(total / tasks.length)
    }

    // --- Group type (Phase / Milestone) ---
    const groupType = computed(() => props.node.groupType || 'phase')
    const groupTypeLabel = computed(() => groupType.value === 'phase' ? 'Phase' : 'Milestone')

    const toggleGroupType = () => {
      if (props.isEditMode) {
        const newType = groupType.value === 'phase' ? 'milestone' : 'phase'
        const updated = { ...props.node, groupType: newType }
        emit('update-node', updated)
      }
    }

    const toggleExpand = () => emit('toggle-expand', props.node.id)
    const toggleSelect = () => emit('toggle-select', props.node.id)
    const toggleMilestone = () => {
      if (!props.isEditMode) emit('toggle-milestone', props.node.id)
    }

    const updateField = (field, value) => {
      const updated = { ...props.node, [field]: value }
      emit('update-node', updated)
    }

    const isVisibleByFilter = computed(() => {
      if (props.filterLevel === 'all') return true
      const maxLevel = parseInt(props.filterLevel)
      return props.level + 1 <= maxLevel
    })

    return {
      isExpanded, isSelected, isGroup, hasSubMilestones, hasTasks, hasChildren,
      indentStyle, predecessorString, formatDate,
      toggleExpand, toggleSelect, toggleMilestone, updateField,
      isVisibleByFilter,
      getEarliestStart, getLatestEnd, getDurationDays, getAggregatedProgress,
      groupType, groupTypeLabel, toggleGroupType
    }
  },
  render() {
    const { node, level } = this
    const displayLevel = level + 1

    if (!this.isVisibleByFilter) {
      return null
    }

    const renderGroupRow = () => {
      const earliest = this.getEarliestStart(node)
      const latest = this.getLatestEnd(node)
      const duration = this.getDurationDays(earliest, latest)
      const progress = this.getAggregatedProgress(node)

      const nameCell = this.isEditMode
        ? h('input', {
          class: 'inline-input',
          value: node.name || '',
          onInput: (e) => this.updateField('name', e.target.value),
          placeholder: 'Outline name'
        })
        : [
          h('span', { class: 'expand-icon', onClick: this.toggleExpand }, [
            h('span', { class: 'material-symbols-outlined' }, this.isExpanded ? 'expand_more' : 'chevron_right')
          ]),
          h('span', { class: 'node-name' }, node.name || 'Unnamed')
        ]

      const typeCell = h('span', {
        class: ['type-badge', this.groupType],
        onClick: this.toggleGroupType,
        style: { cursor: 'pointer' }
      }, this.groupTypeLabel)

      const startCell = this.isEditMode
        ? h('input', {
          type: 'date',
          class: 'date-input',
          value: node.startDate || earliest || '',
          onChange: (e) => this.updateField('startDate', e.target.value)
        })
        : this.formatDate(node.startDate || earliest)

      const endCell = this.isEditMode
        ? h('input', {
          type: 'date',
          class: 'date-input',
          value: node.endDate || latest || '',
          onChange: (e) => this.updateField('endDate', e.target.value)
        })
        : this.formatDate(node.endDate || latest)

      const durationCell = this.isEditMode
        ? h('input', {
          type: 'number',
          class: 'duration-input',
          value: node.durationDays ?? duration,
          min: 0,
          onChange: (e) => this.updateField('durationDays', parseInt(e.target.value) || 0)
        })
        : (node.durationDays ?? duration)

      const progressCell = this.isEditMode
        ? h('input', {
          type: 'number',
          class: 'progress-input',
          value: node.progress ?? progress,
          min: 0,
          max: 100,
          onChange: (e) => this.updateField('progress', parseInt(e.target.value) || 0)
        })
        : h('div', { class: 'progress-wrapper' }, [
          h('div', { class: 'progress-bar', style: { width: (node.progress ?? progress) + '%' } }),
          h('span', { class: 'progress-text' }, (node.progress ?? progress) + '%')
        ])

      return h('tr', {
        class: [
          'group-row',
          `level-${displayLevel}`,
          { 'highlight-row': this.isHighlighted }
        ],
        key: node.id
      }, [
        h('td', { class: 'col-checkbox' }, [
          h('input', { type: 'checkbox', checked: this.isSelected, onChange: this.toggleSelect })
        ]),
        h('td', { class: 'col-type' }, typeCell),
        h('td', { class: 'col-title', style: this.indentStyle }, nameCell),
        h('td', { class: 'col-start' }, startCell),
        h('td', { class: 'col-end' }, endCell),
        h('td', { class: 'col-duration' }, durationCell),
        h('td', { class: 'col-pred' }, '—'),
        h('td', { class: 'col-progress' }, progressCell)
      ])
    }

    const renderTaskRow = () => {
      const progress = node.progress || 0
      const typeLabel = node.isMilestone ? 'Milestone' : 'Task'

      const titleCell = this.isEditMode
        ? h('input', {
          class: 'inline-input',
          value: node.name || '',
          onInput: (e) => this.updateField('name', e.target.value),
          placeholder: 'Task name'
        })
        : [
          this.hasChildren && h('span', { class: 'expand-icon', onClick: this.toggleExpand }, [
            h('span', { class: 'material-symbols-outlined' }, this.isExpanded ? 'expand_more' : 'chevron_right')
          ]),
          !this.hasChildren && h('span', { class: 'expand-icon-placeholder' }),
          h('span', { class: 'node-name' }, node.name || 'Unnamed Task')
        ]

      const startCell = this.isEditMode
        ? h('input', {
          type: 'date',
          class: 'date-input',
          value: node.startDate || '',
          onChange: (e) => this.updateField('startDate', e.target.value)
        })
        : this.formatDate(node.startDate)

      const endCell = this.isEditMode
        ? h('input', {
          type: 'date',
          class: 'date-input',
          value: node.endDate || '',
          onChange: (e) => this.updateField('endDate', e.target.value)
        })
        : this.formatDate(node.endDate)

      const durationCell = this.isEditMode
        ? h('input', {
          type: 'number',
          class: 'duration-input',
          value: node.durationDays || node.duration || 0,
          min: 0,
          onChange: (e) => this.updateField('durationDays', parseInt(e.target.value) || 0)
        })
        : (node.durationDays || node.duration || 0)

      const progressCell = this.isEditMode
        ? h('input', {
          type: 'number',
          class: 'progress-input',
          value: progress,
          min: 0,
          max: 100,
          onChange: (e) => this.updateField('progress', parseInt(e.target.value) || 0)
        })
        : h('div', { class: 'progress-wrapper' }, [
          h('div', { class: 'progress-bar', style: { width: progress + '%' } }),
          h('span', { class: 'progress-text' }, progress + '%')
        ])

      const typeCell = h('span', {
        class: ['type-badge', node.isMilestone ? 'milestone' : 'task'],
        onClick: this.toggleMilestone,
        style: { cursor: 'pointer' }
      }, typeLabel)

      return h('tr', {
        class: [
          'task-row',
          node.isMilestone ? 'milestone' : '',
          { 'highlight-row': this.isHighlighted }
        ],
        key: node.id
      }, [
        h('td', { class: 'col-checkbox' }, [
          h('input', { type: 'checkbox', checked: this.isSelected, onChange: this.toggleSelect })
        ]),
        h('td', { class: 'col-type' }, typeCell),
        h('td', { class: 'col-title', style: this.indentStyle }, titleCell),
        h('td', { class: 'col-start' }, startCell),
        h('td', { class: 'col-end' }, endCell),
        h('td', { class: 'col-duration' }, durationCell),
        h('td', { class: 'col-pred' }, this.predecessorString),
        h('td', { class: 'col-progress' }, progressCell)
      ])
    }

    const children = []
    if (this.isGroup) {
      children.push(renderGroupRow())
      if (this.isExpanded) {
        if (node.subMilestones) {
          node.subMilestones.forEach(sub => {
            const row = h(HierarchicalRow, {
              key: sub.id,
              node: sub,
              level: level + 1,
              expandedState: this.expandedState,
              selectedItems: this.selectedItems,
              allTasksMap: this.allTasksMap,
              isEditMode: this.isEditMode,
              filterLevel: this.filterLevel,
              isHighlighted: this.isHighlighted,
              onToggleExpand: (id) => this.$emit('toggle-expand', id),
              onToggleSelect: (id) => this.$emit('toggle-select', id),
              onToggleSelectGroup: (node) => this.$emit('toggle-select-group', node),
              onUpdateNode: (node) => this.$emit('update-node', node),
              onToggleMilestone: (id) => this.$emit('toggle-milestone', id)
            })
            if (row !== null) children.push(row)
          })
        }
        if (node.tasks) {
          node.tasks.forEach(task => {
            const row = h(HierarchicalRow, {
              key: task.id,
              node: task,
              level: level + 1,
              expandedState: this.expandedState,
              selectedItems: this.selectedItems,
              allTasksMap: this.allTasksMap,
              isEditMode: this.isEditMode,
              filterLevel: this.filterLevel,
              isHighlighted: this.isHighlighted,
              onToggleExpand: (id) => this.$emit('toggle-expand', id),
              onToggleSelect: (id) => this.$emit('toggle-select', id),
              onToggleSelectGroup: (node) => this.$emit('toggle-select-group', node),
              onUpdateNode: (node) => this.$emit('update-node', node),
              onToggleMilestone: (id) => this.$emit('toggle-milestone', id)
            })
            if (row !== null) children.push(row)
          })
        }
      }
    } else {
      children.push(renderTaskRow())
      if (this.isExpanded && node.children && node.children.length) {
        node.children.forEach(child => {
          const row = h(HierarchicalRow, {
            key: child.id,
            node: child,
            level: level + 1,
            expandedState: this.expandedState,
            selectedItems: this.selectedItems,
            allTasksMap: this.allTasksMap,
            isEditMode: this.isEditMode,
            filterLevel: this.filterLevel,
            isHighlighted: this.isHighlighted,
            onToggleExpand: (id) => this.$emit('toggle-expand', id),
            onToggleSelect: (id) => this.$emit('toggle-select', id),
            onToggleSelectGroup: (node) => this.$emit('toggle-select-group', node),
            onUpdateNode: (node) => this.$emit('update-node', node),
            onToggleMilestone: (id) => this.$emit('toggle-milestone', id)
          })
          if (row !== null) children.push(row)
        })
      }
    }

    return children
  }
}

// -----------------------------------------------------------------
// Main component
// -----------------------------------------------------------------
export default {
  name: 'IndividualProjectTimelineView',
  components: { GanttChart, HierarchicalRow },
  props: {
    projectId: { type: [String, Number], required: true },
    timelineData: { type: Object, default: null },
    teamMembers: { type: Array, default: () => [] },
    projectName: { type: String, default: '' }
  },
  emits: ['edit-timeline', 'create-timeline', 'timeline-updated'],
  setup(props, { emit }) {
    const isLoading = ref(false)
    const currentView = ref('list')
    const timelineGroups = ref([])
    const timelineName = ref('Project Timeline')
    const projectStartDate = ref(null)
    const projectEndDate = ref(null)

    const expandedState = reactive({})
    const selectedItems = ref(new Set())
    const listFilterLevel = ref('all')

    const currentDate = ref(new Date())
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const isEditMode = ref(false)
    const originalGroups = ref(null)

    const hasTimelineData = computed(() => timelineGroups.value?.length > 0)

    // Map of all tasks for predecessor lookup
    const allTasksMap = computed(() => {
      const map = new Map()
      const process = (node) => {
        if (!node.subMilestones && !node.tasks) {
          map.set(node.id, {
            ...node,
            displayId: node.fullId || node.id?.slice(-8) || node.id
          })
        }
        if (node.subMilestones) node.subMilestones.forEach(process)
        if (node.tasks) node.tasks.forEach(process)
        if (node.children) node.children.forEach(process)
      }
      timelineGroups.value.forEach(process)
      return map
    })

    const totalItemsCount = computed(() => {
      let count = 0
      const countNodes = (node) => {
        count++
        if (node.subMilestones) node.subMilestones.forEach(countNodes)
        if (node.tasks) node.tasks.forEach(countNodes)
        if (node.children) node.children.forEach(countNodes)
      }
      timelineGroups.value.forEach(countNodes)
      return count
    })

    const filteredGroups = computed(() => timelineGroups.value)

    const areAllSelected = computed(() => {
      return totalItemsCount.value > 0 && selectedItems.value.size === totalItemsCount.value
    })

    const isAllExpanded = computed(() => {
      let allExpanded = true
      const check = (node) => {
        if (expandedState[node.id] === false) allExpanded = false
        if (node.subMilestones) node.subMilestones.forEach(check)
        if (node.tasks) node.tasks.forEach(check)
        if (node.children) node.children.forEach(check)
      }
      timelineGroups.value.forEach(check)
      return allExpanded
    })

    const allFlatTasks = computed(() => {
      const tasks = []
      const flatten = (node) => {
        if (!node.subMilestones && !node.tasks) tasks.push(node)
        if (node.subMilestones) node.subMilestones.forEach(flatten)
        if (node.tasks) node.tasks.forEach(flatten)
        if (node.children) node.children.forEach(flatten)
      }
      timelineGroups.value.forEach(flatten)
      return tasks
    })

    // Summary computed values
    const projectEarliestDate = computed(() => {
      const tasks = allFlatTasks.value.filter(t => t.startDate)
      if (!tasks.length) return null
      return tasks.reduce((earliest, t) => t.startDate < earliest ? t.startDate : earliest, tasks[0].startDate)
    })

    const projectLatestDate = computed(() => {
      const tasks = allFlatTasks.value.filter(t => t.endDate)
      if (!tasks.length) return null
      return tasks.reduce((latest, t) => t.endDate > latest ? t.endDate : latest, tasks[0].endDate)
    })

    const projectTotalDuration = computed(() => {
      return allFlatTasks.value.reduce((sum, t) => sum + (t.durationDays || t.duration || 0), 0)
    })

    const projectAverageProgress = computed(() => {
      const topGroups = timelineGroups.value
      if (!topGroups.length) return 0
      const progresses = topGroups.map(g => {
        const tasks = collectAllTasks(g)
        if (!tasks.length) return 0
        const sum = tasks.reduce((s, t) => s + (t.progress || 0), 0)
        return Math.round(sum / tasks.length)
      })
      const avg = progresses.reduce((s, p) => s + p, 0) / progresses.length
      return Math.round(avg) || 0
    })

    // Highlight condition
    const isRowHighlighted = (node) => {
      const name = (node.name || '').toLowerCase()
      return name.includes('go live') || name.includes('cutover')
    }

    const calendarDays = computed(() => {
      const year = currentDate.value.getFullYear()
      const month = currentDate.value.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const startDay = firstDay.getDay()
      const daysInMonth = lastDay.getDate()
      const days = []

      const prevMonthLastDay = new Date(year, month, 0).getDate()
      for (let i = startDay - 1; i >= 0; i--) {
        const date = new Date(year, month - 1, prevMonthLastDay - i)
        days.push({ date, day: prevMonthLastDay - i, isCurrentMonth: false, tasks: getTasksForDate(date) })
      }
      for (let i = 1; i <= daysInMonth; i++) {
        const date = new Date(year, month, i)
        days.push({ date, day: i, isCurrentMonth: true, tasks: getTasksForDate(date) })
      }
      const remaining = 42 - days.length
      for (let i = 1; i <= remaining; i++) {
        const date = new Date(year, month + 1, i)
        days.push({ date, day: i, isCurrentMonth: false, tasks: getTasksForDate(date) })
      }
      return days
    })

    const getTasksForDate = (date) => {
      return allFlatTasks.value.filter(task => {
        if (!task.startDate || !task.endDate) return false
        const s = new Date(task.startDate); s.setHours(0, 0, 0, 0)
        const e = new Date(task.endDate); e.setHours(0, 0, 0, 0)
        const d = new Date(date); d.setHours(0, 0, 0, 0)
        return d >= s && d <= e
      })
    }

    const truncateText = (text, max) => text?.length > max ? text.slice(0, max) + '...' : text || ''
    const formatDate = (date) => {
      if (!date) return '—'
      const d = new Date(date)
      return isNaN(d) ? '—' : d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    }

    const parseTimelineData = (data) => {
      timelineName.value = data.name || 'Project Timeline'

      const normalizeGroups = (groups) => {
        return groups.map(g => ({
          ...g,
          subMilestones: (g.subMilestones || g.subGroups || []).map(s => ({
            ...s,
            subMilestones: s.subMilestones || s.subGroups || [],
            tasks: s.tasks || []
          })),
          tasks: g.tasks || []   // keep direct tasks if present
        }))
      }

      if (data.groups?.length) {
        timelineGroups.value = normalizeGroups(data.groups)
      } else if (data.tasks?.length) {
        timelineGroups.value = [{
          id: 'default-group',
          name: 'Project Timeline',
          expanded: true,
          subMilestones: [{ id: 'default-sub', name: 'Tasks', tasks: data.tasks }]
        }]
      } else {
        timelineGroups.value = []
      }

      projectStartDate.value = data.startDate || data.projectStartDate || null
      projectEndDate.value = data.endDate || data.projectEndDate || null

      // Initialize expanded state
      const initExpand = (node) => {
        expandedState[node.id] = true
        if (node.subMilestones) node.subMilestones.forEach(initExpand)
        if (node.tasks) node.tasks.forEach(initExpand)
        if (node.children) node.children.forEach(initExpand)
      }
      timelineGroups.value.forEach(initExpand)
    }

    const loadTimelineData = () => {
      isLoading.value = true
      try {
        if (props.timelineData?.groups) {
          parseTimelineData(props.timelineData)
        } else {
          const saved = localStorage.getItem(`project_timeline_${props.projectId}`)
          if (saved) parseTimelineData(JSON.parse(saved))
          else timelineGroups.value = []
        }
      } catch (e) {
        console.error('Load error:', e)
        timelineGroups.value = []
      } finally {
        isLoading.value = false
      }
    }

    const toggleExpand = (id) => { expandedState[id] = !expandedState[id] }
    const toggleExpandAll = () => {
      const newState = !isAllExpanded.value
      const set = (node, val) => {
        expandedState[node.id] = val
        if (node.subMilestones) node.subMilestones.forEach(n => set(n, val))
        if (node.tasks) node.tasks.forEach(n => set(n, val))
        if (node.children) node.children.forEach(n => set(n, val))
      }
      timelineGroups.value.forEach(g => set(g, newState))
    }

    const toggleSelect = (id) => {
      if (selectedItems.value.has(id)) selectedItems.value.delete(id)
      else selectedItems.value.add(id)
      selectedItems.value = new Set(selectedItems.value)
    }

    const toggleSelectGroup = (node) => {
      const selectRecursive = (n, select) => {
        if (select) selectedItems.value.add(n.id)
        else selectedItems.value.delete(n.id)
        if (n.subMilestones) n.subMilestones.forEach(s => selectRecursive(s, select))
        if (n.tasks) n.tasks.forEach(t => selectRecursive(t, select))
        if (n.children) n.children.forEach(c => selectRecursive(c, select))
      }
      const newState = !selectedItems.value.has(node.id)
      selectRecursive(node, newState)
      selectedItems.value = new Set(selectedItems.value)
    }

    const toggleSelectAll = () => {
      if (areAllSelected.value) {
        selectedItems.value.clear()
      } else {
        const addAll = (node) => {
          selectedItems.value.add(node.id)
          if (node.subMilestones) node.subMilestones.forEach(addAll)
          if (node.tasks) node.tasks.forEach(addAll)
          if (node.children) node.children.forEach(addAll)
        }
        timelineGroups.value.forEach(addAll)
      }
      selectedItems.value = new Set(selectedItems.value)
    }

    const applySelectionToGantt = () => {
      if (selectedItems.value.size === 0) {
        emit('show-notification', { type: 'warning', message: 'No items selected to apply to Gantt.' })
        return
      }
      useGanttFilter.value = true
      currentView.value = 'gantt'
      emit('show-notification', { type: 'success', message: `Applied ${selectedItems.value.size} item(s) to Gantt chart.` })
    }

    const toggleMilestone = (taskId) => {
      const findAndToggle = (nodes) => {
        for (let n of nodes) {
          if (n.id === taskId) {
            n.isMilestone = !n.isMilestone
            return true
          }
          if (n.subMilestones && findAndToggle(n.subMilestones)) return true
          if (n.tasks && findAndToggle(n.tasks)) return true
          if (n.children && findAndToggle(n.children)) return true
        }
        return false
      }
      findAndToggle(timelineGroups.value)
    }

    const enterEditMode = () => {
      originalGroups.value = JSON.parse(JSON.stringify(timelineGroups.value))
      isEditMode.value = true
    }

    const saveEditMode = () => {
      isEditMode.value = false
      originalGroups.value = null
      emit('timeline-updated', { groups: timelineGroups.value })
    }

    const cancelEditMode = () => {
      if (originalGroups.value) {
        timelineGroups.value = JSON.parse(JSON.stringify(originalGroups.value))
      }
      isEditMode.value = false
      originalGroups.value = null
    }

    const updateNode = (updatedNode) => {
      const updateInTree = (nodes) => {
        for (let i = 0; i < nodes.length; i++) {
          if (nodes[i].id === updatedNode.id) {
            nodes[i] = { ...nodes[i], ...updatedNode }
            return true
          }
          if (nodes[i].subMilestones && updateInTree(nodes[i].subMilestones)) return true
          if (nodes[i].tasks && updateInTree(nodes[i].tasks)) return true
          if (nodes[i].children && updateInTree(nodes[i].children)) return true
        }
        return false
      }
      updateInTree(timelineGroups.value)
    }

    const ganttMilestones = computed(() => [])
    const timelineDataForGantt = computed(() => ({
      groups: timelineGroups.value,
      startDate: projectStartDate.value,
      endDate: projectEndDate.value
    }))

    const currentMonthName = computed(() => currentDate.value.toLocaleString('default', { month: 'long' }))
    const currentYear = computed(() => currentDate.value.getFullYear())
    const prevMonth = () => currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1)
    const nextMonth = () => currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1)

    watch(() => props.projectId, loadTimelineData, { immediate: true })
    watch(() => props.timelineData, (v) => { if (v) parseTimelineData(v) }, { deep: true })
    onMounted(loadTimelineData)

    return {
      isLoading, currentView, hasTimelineData, timelineGroups, projectStartDate, projectEndDate,
      ganttMilestones, timelineDataForGantt,
      expandedState, selectedItems, listFilterLevel, filteredGroups, allTasksMap,
      totalItemsCount, areAllSelected, isAllExpanded,
      toggleExpand, toggleExpandAll, toggleSelect, toggleSelectGroup, toggleSelectAll,
      applySelectionToGantt, toggleMilestone,
      currentDate, weekdays, calendarDays, currentMonthName, currentYear, prevMonth, nextMonth,
      truncateText, formatDate,
      timelineName,
      projectEarliestDate,
      projectLatestDate,
      projectTotalDuration,
      projectAverageProgress,
      isRowHighlighted,
      isEditMode, enterEditMode, saveEditMode, cancelEditMode, updateNode,
      projectName: props.projectName
    }
  }
}
</script>

<style>
/* ============================================
   GLOBAL STYLES FOR HIERARCHICAL TABLE
   ============================================ */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.hierarchical-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1200px;
  table-layout: fixed;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.hierarchical-table th,
.hierarchical-table td {
  padding: 8px 8px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
  text-align: left;
  font-size: 13px;
  overflow: visible;
  text-overflow: clip;
  white-space: normal;
}

.hierarchical-table th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  padding: 12px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  border-bottom: 1px solid #e2e8f0;
  z-index: 2;
  white-space: nowrap;
}

/* Column widths */
.hierarchical-table .col-checkbox { width: 5%;text-align: center; }
.hierarchical-table .col-type { width: 7% }
.hierarchical-table .col-title { width: 50%; }
.hierarchical-table .col-start { width: 10%; color: #475569; white-space: nowrap; }
.hierarchical-table .col-end { width: 10%; color: #475569; white-space: nowrap; }
.hierarchical-table .col-duration { width: 10%; text-align: center; color: #475569; white-space: nowrap; }
.hierarchical-table .col-pred { width: 13%; color: #475569; white-space: nowrap; }
.hierarchical-table .col-progress { width: 14%; }

/* Row styling */
.hierarchical-table .group-row {
  background: #fafbfc;
}

.hierarchical-table .task-row:hover {
  background: #f8fafc;
}

/* Outline 1 bold */
.hierarchical-table .group-row.level-1 {
  font-weight: 800;
}

/* Expand icon */
.hierarchical-table .expand-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 4px;
  cursor: pointer;
  color: #64748b;
  border-radius: 4px;
  transition: background 0.2s;
}

.hierarchical-table .expand-icon:hover {
  background: #e2e8f0;
}

.hierarchical-table .expand-icon-placeholder {
  display: inline-block;
  width: 24px;
  height: 24px;
  margin-right: 4px;
}

/* Node name */
.hierarchical-table .node-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  margin-right: 8px;
  white-space: normal;
  word-break: break-word;
}

/* Type badge */
.type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.type-badge:hover {
  opacity: 0.8;
}

.type-badge.task {
  background: #e2e8f0;
  color: #475569;
}

.type-badge.milestone {
  background: #fef3c7;
  color: #d97706;
}

.type-badge.phase {
  background: #dbeafe;
  color: #1e40af;
}

/* Progress */
.hierarchical-table .progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #e2e8f0;
  border-radius: 8px;
  height: 13px;
  width: 100%;
  min-width: 40px;
}

.hierarchical-table .progress-bar {
  height: 6px;
  background: #6366f1;
  border-radius: 3px;
  min-width: 2px;
  transition: width 0.3s;
}

.hierarchical-table .progress-text {
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  min-width: 35px;
  flex-shrink: 0;
}

/* Inline editing inputs */
.inline-input,
.date-input,
.duration-input,
.progress-input {
  width: 100%;
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  font-family: inherit;
  background: white;
  color: #1e293b;
  box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.inline-input:focus,
.date-input:focus,
.duration-input:focus,
.progress-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.hierarchical-table td .inline-input,
.hierarchical-table td .date-input,
.hierarchical-table td .duration-input,
.hierarchical-table td .progress-input {
  margin: -2px 0;
  vertical-align: middle;
}

.hierarchical-table .group-row .col-title .inline-input {
  max-width: calc(100% - 20px);
  margin-left: 4px;
}

/* Footer summary */
.hierarchical-table tfoot.summary-footer tr {
  background: #f1f5f9;
  border-top: 2px solid #cbd5e1;
  font-weight: 600;
}

.dark .hierarchical-table tfoot.summary-footer tr {
  background: #1e293b;
  border-top-color: #475569;
}

.hierarchical-table tfoot td {
  padding: 10px 8px;
}

.summary-badge {
  background: #cbd5e1 !important;
  color: #1e293b !important;
}

.dark .summary-badge {
  background: #475569 !important;
  color: #f1f5f9 !important;
}

/* Dark mode overrides */
.dark .hierarchical-table th {
  background: #0f172a;
  color: #94a3b8;
}

.dark .hierarchical-table td {
  border-bottom-color: #334155;
}

.dark .hierarchical-table .col-start,
.dark .hierarchical-table .col-end,
.dark .hierarchical-table .col-duration,
.dark .hierarchical-table .col-pred {
  color: #cbd5e1;
}

.dark .hierarchical-table .group-row {
  background: #1e293b;
}

.dark .hierarchical-table .task-row:hover {
  background: #1e293b;
}

.dark .hierarchical-table .expand-icon {
  color: #94a3b8;
}

.dark .hierarchical-table .expand-icon:hover {
  background: #334155;
}

.dark .hierarchical-table .node-name {
  color: #f1f5f9;
}

.dark .type-badge.task {
  background: #334155;
  color: #cbd5e1;
}

.dark .type-badge.milestone {
  background: #78350f;
  color: #fbbf24;
}

.dark .type-badge.phase {
  background: #1e3a8a;
  color: #bfdbfe;
}

.dark .hierarchical-table .progress-wrapper {
  background: #334155;
}

.dark .hierarchical-table .progress-text {
  color: #cbd5e1;
}

.dark .inline-input,
.dark .date-input,
.dark .duration-input,
.dark .progress-input {
  background: #0f172a;
  border-color: #475569;
  color: #f1f5f9;
}

.dark .inline-input:focus,
.dark .date-input:focus,
.dark .duration-input:focus,
.dark .progress-input:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
}
</style>

<style scoped>
/* ============================================
   SCOPED STYLES FOR CONTAINER & STATIC ELEMENTS
   ============================================ */
.saved-timeline-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.dark .saved-timeline-container {
  background: #1e293b;
  border-color: #334155;
}

.view-toggle-container {
  padding: 12px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.view-toggle {
  display: inline-flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 3px;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
}

.view-btn.active {
  background: #6366f1;
  color: white;
}

.view-btn:hover:not(.active) {
  background: #e2e8f0;
}

.gantt-view-container {
  flex: 1;
  overflow: auto;
}

.gantt-wrapper {
  display: block;
  width: 100%;
  min-width: 100%;
  height: 100%;
}

.list-view-hierarchical {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.dark .list-view-hierarchical {
  background: #1e293b;
}

.list-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.selection-count {
  font-size: 13px;
  color: #64748b;
}

.view-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-filter label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}

.dark .view-filter label {
  color: #94a3b8;
}

.level-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  background: white;
  color: #1e293b;
  cursor: pointer;
  outline: none;
}

.level-select:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.dark .level-select {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.action-btn-small {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 12px;
  cursor: pointer;
  color: #475569;
  transition: all 0.2s;
}

.action-btn-small:hover {
  background: #f8fafc;
}

.dark .action-btn-small {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}

.dark .action-btn-small:hover {
  background: #334155;
}

.action-btn-small.primary {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
}

.action-btn-small.primary:hover {
  background: #4f46e5;
}

.hierarchical-table-wrapper {
  flex: 1;
  overflow: auto;
}

/* Calendar View */
.calendar-view {
  padding: 20px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.calendar-nav-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.calendar-grid {
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  min-width: 700px;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.weekday {
  padding: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 11px;
  color: #64748b;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 80px;
  padding: 6px;
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
  background: white;
}

.calendar-day.other-month {
  background: #f8fafc;
}

.calendar-day.has-tasks {
  background: #eef2ff;
}

.day-number {
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.day-tasks {
  display: flex;
  flex-direction: column;
  gap: 3px;
  margin-top: 4px;
}

.day-task {
  font-size: 9px;
  padding: 2px 4px;
  background: #6366f1;
  color: white;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}

.more-tasks {
  font-size: 8px;
  color: #64748b;
  padding: 2px 4px;
}

/* Loading & Empty States */
.loading-state,
.empty-state,
.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  gap: 12px;
  flex: 1;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.create-timeline-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dark .view-toggle {
  background: #0f172a;
}

.dark .view-btn {
  color: #94a3b8;
}

.dark .view-btn:hover:not(.active) {
  background: #334155;
}

.dark .calendar-day {
  background: #1e293b;
  border-color: #334155;
}

.dark .calendar-day.other-month {
  background: #0f172a;
}

.dark .calendar-day.has-tasks {
  background: #1e1b4b;
}

.dark .day-number {
  color: #cbd5e1;
}

.no-data-message .material-symbols-outlined,
.empty-state .material-symbols-outlined {
  font-size: 48px;
  color: #64748b;
  opacity: 0.5;
}

.no-data-message p,
.empty-state p {
  font-size: 13px;
  color: #64748b;
  margin: 0;
}

.hint {
  font-size: 12px;
  margin-top: 8px;
  opacity: 0.7;
}

.material-symbols-outlined {
  font-size: 20px;
}
</style>