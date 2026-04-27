<template>
  <div v-if="hasData && flatRows.length > 0" class="gantt-chart">
    <!-- Toolbar -->
    <div class="gantt-toolbar">
      <div class="toolbar-left">
        <div class="view-toggle">
          <button v-for="view in viewModes" :key="view.value" class="view-btn"
            :class="{ active: currentView === view.value }" @click="changeView(view.value)">
            <span class="material-symbols-outlined">{{ view.icon }}</span>
            {{ view.label }}
          </button>
        </div>
      </div>

      <div class="toolbar-right">
        <button class="export-btn" @click="exportPDF">
          <span class="material-symbols-outlined">picture_as_pdf</span>
          <span>Export PDF</span>
        </button>
        <button class="critical-btn" @click="toggleCriticalPath" :class="{ active: showCriticalPath }">
          <span class="material-symbols-outlined">timeline</span>
          <span>Critical Path</span>
        </button>
        <button class="debug-btn" @click="showDebugPanel = !showDebugPanel" :class="{ active: showDebugPanel }">
          <span class="material-symbols-outlined">bug_report</span>
          <span>Debug</span>
        </button>
      </div>
    </div>

    <!-- Debug Panel (enhanced) -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <span class="material-symbols-outlined">bug_report</span>
        <span>Gantt Chart Debug</span>
        <button class="debug-close" @click="showDebugPanel = false">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="debug-content">
        <div class="debug-section">
          <h4>Summary</h4>
          <p>Groups: {{ normalizedGroups.length }} | Rows: {{ flatRows.length }} | Leaf tasks: {{ allLeaves.length }}</p>
          <p>Expanded rows: {{ expandedRows.size }}</p>
          <p>Today Position: {{ todayPosition ? todayPosition.toFixed(0) + 'px' : 'N/A' }}</p>
          <p>Canvas scrollLeft: {{ canvasScrollLeft }}px</p>
          <p>Total canvas width: {{ totalWidth }}px</p>
        </div>

        <div class="debug-section">
          <h4>All Leaf Tasks (first 10)</h4>
          <div v-if="debugLeafSamples.length">
            <div v-for="(item, idx) in debugLeafSamples" :key="idx" style="font-size:11px; margin-bottom:8px; border-bottom:1px solid #eee; padding-bottom:4px;">
              <div><strong>{{ item.name }}</strong></div>
              <div>Start: {{ item.startDate || '—' }} → End: {{ item.endDate || '—' }}</div>
              <div>Bar: left={{ item.barLeft }}, width={{ item.barWidth }}</div>
            </div>
          </div>
          <div v-else>No leaf tasks found.</div>
        </div>

        <div class="debug-actions">
          <button @click="logFlatRows" class="debug-action-btn">Log flatRows</button>
          <button @click="scrollToFirst" class="debug-action-btn">Scroll to first</button>
        </div>
      </div>
    </div>

    <!-- Gantt Container -->
    <div class="gantt-container">
      <!-- Left Pane -->
      <div class="left-pane" :style="{ width: leftPanelWidth + 'px' }">
        <div class="task-header" ref="leftHeaderRef">
          <div v-if="anyGroupHasSubMilestones" class="task-header-grid two-columns">
            <span>Milestone</span>
            <span>Sub‑milestones</span>
          </div>
          <div v-else class="task-header-grid single-column">
            <span>Task Name</span>
          </div>
        </div>

        <div class="task-list" ref="taskListRef" @scroll="syncVerticalScroll">
          <template v-for="row in flatRows" :key="row.id">
            <!-- Header rows (group / sub‑milestone / task with children) -->
            <div v-if="row.type !== 'leaf'" class="phase-row" :class="{ 'first-group': row.level === 0 }"
              @click="toggleRow(row.id)" :style="{ paddingLeft: row.indent + 'px' }">
              <div class="phase-row-content">
                <span class="material-symbols-outlined expand-icon" @click.stop="toggleRow(row.id)">
                  {{ expandedRows.has(row.id) ? 'expand_more' : 'chevron_right' }}
                </span>
                <span class="phase-name">{{ row.name }}</span>
              </div>
            </div>
            <!-- Leaf task (no children) -->
            <div v-else class="task-row" :style="{ paddingLeft: row.indent + 'px' }">
              <div class="task-row-content">
                <span class="task-name">{{ row.name }}</span>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Divider -->
      <div class="panel-divider" @mousedown="startResize" :class="{ 'resizing': isResizing }">
        <div class="divider-line"></div>
      </div>

      <!-- Right Pane – Canvas -->
      <div class="right-pane" ref="rightPaneRef">
        <div class="timeline-header-wrapper" ref="timelineHeaderWrapper" @scroll="syncHeaderScroll">
          <div class="timeline-header" ref="rightHeaderRef">
            <div class="year-headers">
              <div v-for="(yh, idx) in yearHeaders" :key="idx" class="year-header" :style="{ width: yh.width + 'px' }">
                {{
                  yh.label }}</div>
            </div>
            <div class="month-headers">
              <div v-for="(mh, idx) in monthHeaders" :key="idx" class="month-header"
                :style="{ width: mh.width + 'px' }">{{
                mh.label }}</div>
            </div>
            <div class="day-headers" v-if="currentView === 'day'">
              <div v-for="(cell, idx) in timelineCells" :key="idx" class="day-header"
                :style="{ width: cell.width + 'px' }">{{
                cell.label }}</div>
            </div>
            <div class="week-headers" v-else>
              <div v-for="(cell, idx) in timelineCells" :key="idx" class="week-header"
                :style="{ width: cell.width + 'px' }">
                {{ cell.label }}</div>
            </div>
          </div>
        </div>

        <div class="timeline-canvas-container" :key="refreshKey" ref="timelineCanvasContainer"
          @scroll="syncCanvasScroll">
          <div class="timeline-canvas" ref="timelineCanvasRef" :style="{ width: totalWidth + 'px' }">
            <div v-for="row in flatRows" :key="row.id" class="timeline-row" :style="{ height: '48px' }">
              <!-- Leaf task bar -->
              <div v-if="row.type === 'leaf' && row.barStyle" class="gantt-bar task-bar" :class="{
                completed: row.progress >= 100,
                'critical-path': showCriticalPath && isTaskOnCriticalPath(row.task)
              }" :style="row.barStyle">
                <span class="bar-label">{{ row.name }}</span>
              </div>
              <!-- Sub‑milestone summary bar -->
              <div v-else-if="row.type === 'submilestone' && row.barStyle" class="gantt-bar submilestone-bar"
                :style="row.barStyle">
                <span class="bar-label">{{ row.name }} ({{ row.duration }}d)</span>
              </div>
              <!-- Group summary bar (collapsed) -->
              <div v-else-if="row.barStyle" class="gantt-bar group-bar" :style="row.barStyle">
                <span class="bar-label">{{ row.name }}</span>
              </div>
            </div>
          </div>

          <div v-if="todayPosition" class="today-indicator" :style="{ left: todayPosition + 'px' }">
            <div class="today-dot" ref="todayDotRef"></div>
            <div class="today-line"></div>
            <div class="today-label" ref="todayLabelRef">Today</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="gantt-footer">
      <div class="legend">
        <div class="legend-item">
          <div class="legend-color in-progress"></div><span class="legend-text">In Progress</span>
        </div>
        <div class="legend-item">
          <div class="legend-color completed"></div><span class="legend-text">Completed</span>
        </div>
        <div class="legend-item">
          <div class="legend-color backlog"></div><span class="legend-text">Backlog</span>
        </div>
        <div class="legend-item">
          <div class="legend-color critical-path"></div><span class="legend-text">Critical Path</span>
        </div>
        <div class="legend-item"><span class="material-symbols-outlined text-amber-500 text-sm">diamond</span><span
            class="legend-text">Milestone</span></div>
      </div>
      <div class="hint-text">← Scroll horizontally to see more →</div>
    </div>

    <div v-if="isResizing" class="resize-overlay" @mousemove="onResize" @mouseup="stopResize" @mouseleave="stopResize">
    </div>
  </div>

  <div v-else class="gantt-chart-empty">
    <span class="material-symbols-outlined">timeline</span>
    <p>No timeline data available for Gantt view</p>
    <p class="hint">Please create tasks in the Define Timeline view first</p>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export default {
  name: 'GanttChart',
  props: {
    projectStartDate: { type: String, default: null },
    projectMilestones: { type: Array, default: () => [] },
    teamMembers: { type: Array, default: () => [] },
    timelineData: { type: Object, default: () => ({ groups: [], summary: {} }) }
  },
  setup(props) {
    const currentView = ref('day')
    const leftPanelWidth = ref(380)
    const minPanelWidth = 200
    const maxPanelWidth = 600
    const isResizing = ref(false)
    const startX = ref(0)
    const startWidth = ref(0)
    const showCriticalPath = ref(false)
    const timelineHeaderWrapper = ref(null)
    const timelineCanvasContainer = ref(null)
    const timelineCanvasRef = ref(null)
    const rightPaneRef = ref(null)
    const taskListRef = ref(null)
    const leftHeaderRef = ref(null)
    const rightHeaderRef = ref(null)
    const todayDotRef = ref(null)
    const todayLabelRef = ref(null)
    const refreshKey = ref(0)
    const showDebugPanel = ref(false)
    const canvasScrollLeft = ref(0)
    const hasScrolledToFirst = ref(false)   // ensure one‑time scroll

    const viewModes = [
      { value: 'day', label: 'Day', icon: 'view_day' },
      { value: 'week', label: 'Week', icon: 'view_week' }
    ]

    const toLocalMidnight = (input) => {
      if (!input) return null
      const d = input instanceof Date ? new Date(input) : new Date(input)
      if (isNaN(d.getTime())) return null
      d.setHours(0, 0, 0, 0)
      return d
    }

    const normalizedGroups = computed(() => {
      const rawGroups = props.timelineData?.groups || []
      return rawGroups.map(group => ({
        ...group,
        subMilestones: group.subMilestones || group.subGroups || [],
        tasks: group.tasks || []
      }))
    })

    const hasData = computed(() => normalizedGroups.value.length > 0)
    const anyGroupHasSubMilestones = computed(() => normalizedGroups.value.some(g => g.subMilestones.length > 0))

    // ---------- Leaf collection ----------
    const collectLeaves = (node) => {
      let leaves = []
      if (node.tasks) {
        node.tasks.forEach(t => {
          if (!t.children || t.children.length === 0) leaves.push(t)
          else leaves.push(...collectLeaves(t))
        })
      }
      if (node.subMilestones) {
        node.subMilestones.forEach(sub => leaves.push(...collectLeaves(sub)))
      }
      return leaves
    }

    const allLeaves = computed(() => {
      const leaves = []
      normalizedGroups.value.forEach(g => {
        leaves.push(...collectLeaves(g))
        if (g.tasks) {
          g.tasks.forEach(t => {
            if (!t.children || t.children.length === 0) leaves.push(t)
            else leaves.push(...collectLeaves(t))
          })
        }
      })
      return leaves
    })

    // ---------- Date range, cells, headers, getBarPosition ----------
    const dateRange = computed(() => {
      try {
        const tasks = allLeaves.value
        let start, end
        if (!tasks.length) {
          start = props.projectStartDate ? toLocalMidnight(props.projectStartDate) : toLocalMidnight(new Date())
          end = new Date(start)
          end.setMonth(end.getMonth() + 3)
        } else {
          let minDate = null, maxDate = null
          tasks.forEach(task => {
            if (task.startDate) {
              const s = toLocalMidnight(task.startDate)
              if (s && (!minDate || s < minDate)) minDate = s
            }
            if (task.endDate) {
              const e = toLocalMidnight(task.endDate)
              if (e && (!maxDate || e > maxDate)) maxDate = e
            }
          })
          start = minDate ? new Date(minDate) : toLocalMidnight(new Date())
          end = maxDate ? new Date(maxDate) : new Date(start)
          if (!maxDate) end.setMonth(end.getMonth() + 3)
        }
        const padDays = currentView.value === 'day' ? 3 : 7
        const paddedStart = new Date(start); paddedStart.setDate(paddedStart.getDate() - padDays)
        const paddedEnd = new Date(end); paddedEnd.setDate(paddedEnd.getDate() + padDays)
        return { start: paddedStart, end: paddedEnd }
      } catch (e) {
        const fallback = toLocalMidnight(new Date())
        return { start: fallback, end: new Date(fallback.setMonth(fallback.getMonth() + 3)) }
      }
    })

    const timelineCells = computed(() => {
      try {
        const range = dateRange.value
        if (!range?.start || !range?.end) return []
        const start = toLocalMidnight(range.start)
        const end = toLocalMidnight(range.end)
        if (!start || !end) return []
        const cells = []
        const current = new Date(start)
        if (currentView.value === 'day') {
          while (current <= end) {
            const cellStart = new Date(current)
            const cellEnd = new Date(current); cellEnd.setHours(23, 59, 59, 999)
            cells.push({ label: current.getDate().toString(), width: 30, start: new Date(current), end: cellEnd })
            current.setDate(current.getDate() + 1)
          }
        } else {
          while (current <= end) {
            const weekStart = new Date(current)
            const weekEnd = new Date(current); weekEnd.setDate(weekEnd.getDate() + 6); weekEnd.setHours(23, 59, 59, 999)
            const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1)
            const weekNum = Math.ceil((current.getDate() + firstDayOfMonth.getDay()) / 7)
            cells.push({ label: `Week ${weekNum}`, width: 7 * 30, start: new Date(weekStart), end: weekEnd })
            current.setDate(current.getDate() + 7)
          }
        }
        return cells
      } catch (e) { return [] }
    })

    const monthHeaders = computed(() => {
      const cells = timelineCells.value
      if (!cells.length) return []
      const headers = []
      let currentMonthKey = null, width = 0, monthLabel = ''
      cells.forEach(cell => {
        const date = cell.start
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`
        if (currentMonthKey !== monthKey) {
          if (currentMonthKey) headers.push({ label: monthLabel, width })
          currentMonthKey = monthKey
          monthLabel = date.toLocaleDateString('en-US', { month: 'short' })
          width = cell.width
        } else { width += cell.width }
      })
      if (currentMonthKey) headers.push({ label: monthLabel, width })
      return headers
    })

    const yearHeaders = computed(() => {
      const cells = timelineCells.value
      const months = monthHeaders.value
      if (!cells.length || !months.length) return []
      const headers = []
      let currentYear = null, width = 0, cellIdx = 0
      months.forEach(month => {
        while (cellIdx < cells.length && !cells[cellIdx]?.start) cellIdx++
        const firstCell = cells[cellIdx]
        if (!firstCell) return
        const year = firstCell.start.getFullYear().toString()
        if (currentYear !== year) {
          if (currentYear) headers.push({ label: currentYear, width })
          currentYear = year
          width = month.width
        } else { width += month.width }
        cellIdx += Math.round(month.width / 30)
      })
      if (currentYear) headers.push({ label: currentYear, width })
      return headers
    })

    const totalWidth = computed(() => timelineCells.value.reduce((s, c) => s + (c?.width || 0), 0))

    const getBarPosition = (startDate, endDate) => {
      if (!startDate || !endDate) return { left: 0, width: 0 }
      const start = toLocalMidnight(startDate), end = toLocalMidnight(endDate)
      if (!start || !end) return { left: 0, width: 0 }
      const cells = timelineCells.value
      let left = 0, right = 0, found = false
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (!cell) continue
        const cellStart = cell.start, cellEnd = cell.end
        const dur = cellEnd - cellStart
        if (!found) {
          if (start <= cellEnd) {
            found = true
            const overlap = new Date(Math.max(start, cellStart))
            left += ((overlap - cellStart) / dur) * cell.width
          } else { left += cell.width }
        }
        if (found) {
          if (end < cellStart) break
          const overlap = new Date(Math.min(end, cellEnd))
          right += ((overlap - cellStart) / dur) * cell.width
        }
      }
      return { left: isFinite(left) ? left : 0, width: Math.max(isFinite(right) ? right : 2) }
    }

    // ---------- Expand/collapse and flat rows ----------
    const expandedRows = ref(new Set())

    const getSummaryDates = (node) => {
      const leaves = collectLeaves(node)
      if (!leaves.length) return null
      let earliest = leaves[0].startDate
      let latest = leaves[0].endDate
      leaves.forEach(t => {
        if (t.startDate && (!earliest || t.startDate < earliest)) earliest = t.startDate
        if (t.endDate && (!latest || t.endDate > latest)) latest = t.endDate
      })
      return { start: earliest, end: latest }
    }

    const buildFlatRows = (nodes, level) => {
      const rows = []
      if (!nodes) return rows
      nodes.forEach(node => {
        const hasChildren = (node.subMilestones && node.subMilestones.length > 0) ||
                           (node.tasks && node.tasks.length > 0) ||
                           (node.children && node.children.length > 0)
        const isExpanded = expandedRows.value.has(node.id)
        const type = node.subMilestones ? 'group' : (node.tasks ? 'submilestone' : 'task')

        let barStyle = null
        if (hasChildren) {
          if (!isExpanded) {
            const summary = getSummaryDates(node)
            if (summary && summary.start && summary.end) {
              const pos = getBarPosition(summary.start, summary.end)
              barStyle = { left: pos.left + 'px', width: Math.max(pos.width, 10) + 'px' }
            }
          }
        } else {
          if (node.startDate && node.endDate) {
            const pos = getBarPosition(node.startDate, node.endDate)
            barStyle = { left: pos.left + 'px', width: Math.max(pos.width, 2) + 'px' }
          }
        }

        if (hasChildren || type === 'group' || type === 'submilestone') {
          rows.push({
            id: node.id,
            name: node.name || 'Unnamed',
            type,
            level,
            indent: level * 20 + 8,
            progress: hasChildren
              ? Math.round(collectLeaves(node).reduce((s, t) => s + (t.progress || 0), 0) / (collectLeaves(node).length || 1))
              : (node.progress || 0),
            hasChildren,
            barStyle
          })
        } else {
          rows.push({
            id: node.id,
            name: node.name || 'Unnamed Task',
            type: 'leaf',
            level,
            indent: level * 20 + 8,
            progress: node.progress || 0,
            task: node,
            barStyle
          })
        }

        if (isExpanded && hasChildren) {
          if (node.subMilestones) rows.push(...buildFlatRows(node.subMilestones, level + 1))
          if (node.tasks) node.tasks.forEach(task => rows.push(...buildFlatRows([task], level + 1)))
          if (node.children) rows.push(...buildFlatRows(node.children, level + 1))
        }
      })
      return rows
    }

    const flatRows = computed(() => {
      const rows = []
      normalizedGroups.value.forEach(group => rows.push(...buildFlatRows([group], 0)))
      return rows
    })

    const toggleRow = (id) => {
      if (expandedRows.value.has(id)) expandedRows.value.delete(id)
      else expandedRows.value.add(id)
      expandedRows.value = new Set(expandedRows.value)
    }
    const toggleGroup = (groupId) => toggleRow(groupId)

    // ---------- Today indicator ----------
    const todayPosition = computed(() => {
      const today = new Date()
      const cells = timelineCells.value
      let left = 0
      for (let cell of cells) {
        if (!cell) continue
        if (today >= cell.start && today <= cell.end) {
          return left + ((today - cell.start) / (cell.end - cell.start)) * cell.width
        }
        left += cell.width
      }
      return null
    })

    // ---------- Debug ----------
    const debugLeafSamples = computed(() => {
      const leafRows = flatRows.value.filter(r => r.type === 'leaf').slice(0, 10)
      return leafRows.map(r => ({
        name: r.name,
        startDate: r.task?.startDate,
        endDate: r.task?.endDate,
        barLeft: r.barStyle?.left,
        barWidth: r.barStyle?.width
      }))
    })
    const logFlatRows = () => {
      console.log('flatRows:', flatRows.value.map(r => ({
        id: r.id, name: r.name, type: r.type, barStyle: r.barStyle,
        startDate: r.task?.startDate, endDate: r.task?.endDate
      })))
    }
    const scrollToFirst = () => {
      const container = timelineCanvasContainer.value
      if (!container) return
      const firstLeaf = flatRows.value.find(r => r.type === 'leaf' && r.barStyle)
      if (firstLeaf && firstLeaf.barStyle.left) {
        const leftPos = parseFloat(firstLeaf.barStyle.left) - 40
        container.scrollLeft = Math.max(0, leftPos)
        canvasScrollLeft.value = container.scrollLeft
      }
    }

    // ---------- Scroll sync ----------
    const syncHeaderScroll = (e) => {
      if (timelineCanvasContainer.value) timelineCanvasContainer.value.scrollLeft = e.target.scrollLeft
    }
    const syncCanvasScroll = (e) => {
      if (timelineHeaderWrapper.value) timelineHeaderWrapper.value.scrollLeft = e.target.scrollLeft
      if (taskListRef.value) taskListRef.value.scrollTop = e.target.scrollTop
      canvasScrollLeft.value = e.target.scrollLeft
    }
    const syncVerticalScroll = (e) => {
      if (timelineCanvasContainer.value) timelineCanvasContainer.value.scrollTop = e.target.scrollTop
    }

    const changeView = (view) => {
      currentView.value = view
      nextTick(() => {
        refreshKey.value++
        if (timelineCanvasContainer.value) {
          timelineCanvasContainer.value.scrollLeft = 0
          if (timelineHeaderWrapper.value) timelineHeaderWrapper.value.scrollLeft = 0
        }
      })
    }

    const startResize = (e) => {
      e.preventDefault()
      isResizing.value = true
      startX.value = e.clientX
      startWidth.value = leftPanelWidth.value
      document.addEventListener('mousemove', onResize)
      document.addEventListener('mouseup', stopResize)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }
    const onResize = (e) => {
      if (!isResizing.value) return
      leftPanelWidth.value = Math.max(minPanelWidth, Math.min(maxPanelWidth, startWidth.value + (e.clientX - startX.value)))
    }
    const stopResize = () => {
      isResizing.value = false
      document.removeEventListener('mousemove', onResize)
      document.removeEventListener('mouseup', stopResize)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    const exportPDF = async () => {
      const container = document.querySelector('.gantt-container')
      if (!container) return alert('No chart to export')
      const original = container.style.overflow
      container.style.overflow = 'visible'
      try {
        const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#fff', logging: false, windowWidth: container.scrollWidth, windowHeight: container.scrollHeight })
        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth(), pageHeight = pdf.internal.pageSize.getHeight()
        const scale = pageWidth / canvas.width
        let heightLeft = canvas.height * scale
        let pos = 0
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pageWidth, heightLeft)
        while ((heightLeft -= pageHeight) > 0) {
          pos -= pageHeight
          pdf.addPage()
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, pos, pageWidth, canvas.height * scale)
        }
        pdf.save(`gantt-${new Date().toISOString().slice(0,10)}.pdf`)
      } catch (e) {
        console.error('PDF error:', e)
        alert('Export failed.')
      } finally { container.style.overflow = original }
    }

    const isTaskOnCriticalPath = (task) => false
    const toggleCriticalPath = () => {
      showCriticalPath.value = !showCriticalPath.value
    }

    const expandAll = () => {
      const initExpand = (node) => {
        if (node.subMilestones || node.tasks) {
          expandedRows.value.add(node.id)
          if (node.subMilestones) node.subMilestones.forEach(initExpand)
          if (node.tasks) node.tasks.forEach(initExpand)
        }
      }
      expandedRows.value.clear()
      normalizedGroups.value.forEach(g => initExpand(g))
      expandedRows.value = new Set(expandedRows.value)
    }

    onMounted(() => {
      expandAll()
    })

    // Watcher: once flatRows are ready and the container exists, scroll to first bar
    watch(
      [flatRows, () => timelineCanvasContainer.value],
      ([rows, container]) => {
        if (rows.length && container && !hasScrolledToFirst.value) {
          nextTick(() => {
            setTimeout(() => {
              scrollToFirst()
              hasScrolledToFirst.value = true
            }, 50)
          })
        }
      },
      { immediate: true }
    )

    watch(() => props.timelineData, () => {
      expandAll()
      hasScrolledToFirst.value = false   // reset so it scrolls again
    }, { deep: true })

    return {
      currentView, viewModes, leftPanelWidth, isResizing, showCriticalPath, hasData,
      normalizedGroups, anyGroupHasSubMilestones,
      flatRows, expandedRows, toggleRow, toggleGroup,
      timelineCells, monthHeaders, yearHeaders, totalWidth, todayPosition,
      timelineHeaderWrapper, timelineCanvasContainer, rightPaneRef, taskListRef,
      leftHeaderRef, rightHeaderRef, todayDotRef, todayLabelRef, refreshKey, showDebugPanel,
      allLeaves, debugLeafSamples, logFlatRows, canvasScrollLeft, scrollToFirst,
      changeView, startResize, onResize, stopResize,
      syncHeaderScroll, syncCanvasScroll, syncVerticalScroll,
      exportPDF, toggleCriticalPath, isTaskOnCriticalPath
    }
  }
}
</script>

<style scoped>
/* (Use the same style block as provided earlier; it remains unchanged) */
*,
*::before,
*::after {
  box-sizing: border-box;
}

.gantt-chart {
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  height: 500px;
  flex: none;
}

.dark .gantt-chart {
  background: #1e293b;
}

.gantt-chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 500px;
  padding: 40px;
  text-align: center;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 12px;
}

.gantt-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #e2e8f0;
  background: white;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: 12px;
}

.dark .gantt-toolbar {
  background: #1e293b;
  border-bottom-color: #334155;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  padding: 4px;
  border-radius: 8px;
}

.dark .view-toggle {
  background: #0f172a;
}

.view-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 16px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.dark .view-btn {
  color: #94a3b8;
}

.view-btn.active {
  background: white;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .view-btn.active {
  background: #1e293b;
  color: #818cf8;
}

.export-btn,
.critical-btn,
.debug-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.export-btn {
  background: #f1f5f9;
  color: #1e293b;
}

.dark .export-btn {
  background: #0f172a;
  color: #cbd5e1;
}

.critical-btn {
  background: #fee2e2;
  color: #dc2626;
}

.critical-btn.active {
  background: #dc2626;
  color: white;
}

.debug-btn {
  background: #e0e7ff;
  color: #4f46e5;
}

.debug-btn.active {
  background: #4f46e5;
  color: white;
}

.debug-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  width: 300px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 100;
  padding: 16px;
}

.dark .debug-panel {
  background: #1e293b;
}

.debug-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-weight: 600;
}

.debug-content ul {
  margin: 4px 0;
  padding-left: 20px;
  font-size: 12px;
}

.gantt-container {
  flex: 1 1 0;
  display: flex;
  overflow: hidden;
  min-height: 0;
  width: 100%;
  position: relative;
}

.left-pane {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-right: 1px solid #e2e8f0;
  height: 100%;
  overflow: hidden;
}

.dark .left-pane {
  background: #1e293b;
  border-right-color: #334155;
}

.task-header {
  display: flex;
  align-items: center;
  padding: 0 16px;
  height: 83px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  color: #1e293b;
}

.task-header-grid.two-columns {
  display: grid;
  grid-template-columns: 1fr 200px;
  width: 100%;
}

.task-header-grid.single-column {
  width: 100%;
}

.task-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.phase-row {
  height: 40px;
  display: flex;
  align-items: center;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(99, 102, 241, 0.04);
}

.phase-row-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 16px;
}

.expand-icon {
  font-size: 18px;
  color: #64748b;
  flex-shrink: 0;
}

.phase-name {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.dark .phase-name {
  color: #f1f5f9;
}

.task-row {
  height: 40px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.task-row-content {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 16px;
}

.task-name {
  font-size: 13px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-progress,
.task-progress {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
}

.progress-text.small {
  font-size: 10px;
  color: #475569;
}

.panel-divider {
  width: 8px;
  height: 100%;
  cursor: col-resize;
  background: #e2e8f0;
  flex-shrink: 0;
}

.dark .panel-divider {
  background: #334155;
}

.divider-line {
  width: 2px;
  height: 40px;
  background: #94a3b8;
  border-radius: 1px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.panel-divider:hover {
  background: #6366f1;
}

.panel-divider.resizing {
  background: #ef4444;
}

.right-pane {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  min-width: 0;
  width: 0;
  overflow: hidden;
}

.dark .right-pane {
  background: #0f172a;
}

.timeline-header-wrapper {
  flex-shrink: 0;
  overflow-x: auto;
  overflow-y: hidden;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dark .timeline-header-wrapper {
  background: #0f172a;
  border-bottom-color: #334155;
}

.timeline-header {
  display: inline-block;
  min-width: 100%;
}

.year-headers {
  display: flex;
  height: 28px;
  border-bottom: 1px solid #e2e8f0;
}

.year-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e2e8f0;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  background: #f1f5f9;
  white-space: nowrap;
}

.month-headers {
  display: flex;
  height: 28px;
  border-bottom: 1px solid #e2e8f0;
}

.month-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  background: #f8fafc;
  white-space: nowrap;
}

.day-headers,
.week-headers {
  display: flex;
  height: 24px;
}

.day-header,
.week-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  color: #64748b;
  background: white;
  border-right: 1px solid #f1f5f9;
}

.dark .year-header {
  background: #1e293b;
  color: #f1f5f9;
  border-right-color: #334155;
}

.dark .month-header {
  background: #0f172a;
  color: #cbd5e1;
  border-right-color: #334155;
}

.dark .day-header,
.dark .week-header {
  background: #0f172a;
  color: #94a3b8;
  border-right-color: #1e293b;
}

.timeline-canvas-container {
  flex: 1;
  overflow: auto;
  position: relative;
  width: 100%;
}

.timeline-canvas {
  position: relative;
  width: fit-content;
  min-width: 100%;
}

.timeline-row {
  position: relative;
  border-bottom: 1px solid #f1f5f9;
  background: rgba(241, 245, 249, 0.3);
}

.gantt-bar {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  white-space: nowrap;
}

.submilestone-bar {
  background: linear-gradient(135deg, #a5b4fc, #818cf8);
  height: 24px;
}

.task-bar {
  height: 20px;
  background: #3b82f6;
}

.task-bar.completed {
  background: #10b981;
}

.gantt-bar.critical-path {
  background: linear-gradient(135deg, #ef4444, #dc2626) !important;
  border: 1px solid #ff6b6b;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
}

.bar-label {
  color: white;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.today-indicator {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  z-index: 20;
  pointer-events: none;
}

.today-line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #dc2626;
}

.today-dot {
  position: absolute;
  left: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #dc2626;
}

.today-label {
  position: absolute;
  left: 6px;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
}

.gantt-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  flex-shrink: 0;
  background: white;
  border-top: 1px solid #e2e8f0;
}

.dark .gantt-footer {
  background: #1e293b;
  border-top-color: #334155;
}

.legend {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-color.in-progress {
  background: #3b82f6;
}

.legend-color.completed {
  background: #10b981;
}

.legend-color.backlog {
  background: #cbd5e1;
}

.legend-color.critical-path {
  background: #ef4444;
}

.legend-text {
  font-size: 11px;
  color: #64748b;
}

.hint-text {
  font-size: 11px;
  color: #94a3b8;
  font-style: italic;
}

.resize-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  cursor: col-resize;
  z-index: 9999;
}

.text-amber-500 {
  color: #f59e0b;
}

.text-sm {
  font-size: 14px;
}
</style>