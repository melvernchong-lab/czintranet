<template>
  <div class="timeline-definition">
    <!-- Enhanced Project Summary Header -->
    <div class="timeline-summary-header">
      <div class="timeline-summary-left">
        <div class="timeline-stat-card">
          <div class="timeline-stat-icon">📅</div>
          <div class="timeline-stat-info">
            <span class="timeline-stat-label">Total Duration</span>
            <span class="timeline-stat-value">{{ totalProjectDuration }} days</span>
          </div>
        </div>
        <div class="timeline-stat-card">
          <div class="timeline-stat-icon">🚀</div>
          <div class="timeline-stat-info">
            <span class="timeline-stat-label">Project Start</span>
            <span class="timeline-stat-value">{{ formatDate(projectStartDate) || '—' }}</span>
          </div>
        </div>
        <div class="timeline-stat-card">
          <div class="timeline-stat-icon">🏁</div>
          <div class="timeline-stat-info">
            <span class="timeline-stat-label">Project End</span>
            <span class="timeline-stat-value">{{ formatDate(projectEndDate) || '—' }}</span>
          </div>
        </div>
      </div>
      <div class="timeline-summary-right">
        <label class="weekend-toggle">
          <input type="checkbox" v-model="excludeWeekends" @change="onExcludeWeekendsChange" />
          <span class="toggle-label">🌙 Exclude Weekends</span>
        </label>
      </div>
    </div>

    <!-- Timeline Table Container with Auto Scroll -->
    <div 
      class="timeline-table-container" 
      ref="tableContainer"
      @wheel="handleWheelScroll"
      @mousemove="handleMouseMoveForAutoScroll"
      @mouseleave="handleMouseLeave"
      @mousedown="startDragScroll"
    >
      <!-- Scroll Hint -->
      <div v-if="isScrollingHint" class="scroll-hint">
        <span class="material-symbols-outlined">swap_horiz</span>
        <span>Move mouse to edges to scroll | Hold Ctrl + Drag to drag scroll</span>
      </div>

      <!-- Scroll Progress Bar -->
      <div class="scroll-progress-bar">
        <div class="scroll-progress-fill" :style="{ width: scrollPercent + '%' }"></div>
      </div>

      <table class="timeline-table" ref="timelineTable">
        <colgroup>
          <col class="col-move" />
          <col class="col-id" />
          <col class="col-task" />
          <col class="col-owner" />
          <col class="col-type" />
          <col class="col-rel" />
          <col class="col-start" />
          <col class="col-end" />
          <col class="col-dur" />
          <col class="col-prog" />
          <col class="col-actions" />
        </colgroup>

        <thead class="sticky-header">
          <tr>
            <th class="col-move" style="width: 45px;"></th>
            <th class="col-id" style="width: 70px;">ID</th>
            <th class="col-task" style="width: 320px;">TASK NAME <span class="required-star">*</span></th>
            <th class="col-owner" style="width: 140px;">OWNER <span class="required-star">*</span></th>
            <th class="col-type" style="width: 100px;">TYPE</th>
            <th class="col-rel" style="width: 180px;">RELATIONSHIPS</th>
            <th class="col-start" style="width: 110px;">START <span class="required-star">*</span></th>
            <th class="col-end" style="width: 110px;">END <span class="required-star">*</span></th>
            <th class="col-dur" style="width: 80px;">DUR</th>
            <th class="col-prog" style="width: 80px;">PROGRESS</th>
            <th class="col-actions" style="width: 50px;"></th>
          </tr>
        </thead>

        <tbody v-if="!timelineGroups || timelineGroups.length === 0">
          <tr class="empty-row">
            <td colspan="11">
              <div class="empty-state">
                <div class="empty-icon">📋</div>
                <h3>No Timeline Data</h3>
                <p>Get started by creating a new swimlane or importing a project.</p>
                <button class="btn-primary" @click="addSwimlane">+ Create Swimlane</button>
              </div>
            </td>
          </tr>
        </tbody>

        <template v-if="timelineGroups && timelineGroups.length > 0">
          <template v-for="(group, groupIndex) in timelineGroups" :key="group.id">
            <RenderGroupComponent
              :group="group"
              :group-index="groupIndex"
              :level="0"
              :get-group-short-id="getGroupShortId"
              :get-group-color="getGroupColor"
              :is-swimlane-name-empty="isSwimlaneNameEmpty"
              :editing-cell="editingCell"
              :edit-value="editValue"
              :format-date="formatDate"
              :get-task-full-id="getTaskFullId"
              :has-task-required-issues="hasTaskRequiredIssues"
              :is-task-name-empty="isTaskNameEmpty"
              :is-owner-empty="isOwnerEmpty"
              :is-start-date-empty="isStartDateEmpty"
              :is-end-date-empty="isEndDateEmpty"
              :get-task-relationships="getTaskRelationships"
              :get-relationship-icon="getRelationshipIcon"
              :get-relationship-tooltip="getRelationshipTooltip"
              :get-task-id-from-relationship="getTaskIdFromRelationship"
              :exclude-weekends="excludeWeekends"
              :get-min-date="getMinDate"
              :get-next-date="getNextDate"
              :on-duration-days-change="onDurationDaysChange"
              :on-progress-change="onProgressChange"
              :toggle-group="toggleGroup"
              :toggle-task-type="toggleTaskType"
              :start-editing="startEditing"
              :save-edit="saveEdit"
              :save-date-edit="saveDateEdit"
              :cancel-edit="cancelEdit"
              :remove-task="removeTask"
              :open-relationship-selector="openRelationshipSelector"
              :add-task="addTask"
              :add-sub-swimlane="addSubSwimlane"
              @update:data="emitUpdate"
              @select-item="handleSelectItem"
            />
          </template>
        </template>
      </table>
    </div>

    <!-- Fixed Bottom Action Bar - OUTSIDE scrolling container -->
    <div class="fixed-action-bar">
      <div class="action-bar-content">
        <button class="timeline-action-btn primary" @click="addSwimlane">
          <span class="material-symbols-outlined">add</span>
          Add Swimlane
        </button>
        <button class="timeline-action-btn secondary" @click="addSubSwimlaneToSelected" :disabled="!selectedSwimlaneId">
          <span class="material-symbols-outlined">create_new_folder</span>
          Add Sub-Swimlane
        </button>
        <button class="timeline-action-btn tertiary" @click="addTaskToSelected" :disabled="!selectedParentId">
          <span class="material-symbols-outlined">checklist</span>
          Add Task
        </button>
        <div v-if="selectedParentName || selectedSwimlaneName" class="selection-info">
          <span class="material-symbols-outlined">info</span>
          <span>Adding to: {{ selectedParentName || selectedSwimlaneName }}</span>
          <button class="clear-selection" @click="clearSelection">✕</button>
        </div>
      </div>
    </div>

    <RelationshipSelectorModal
      :show="showRelationshipModal"
      :current-task="currentTask"
      :available-tasks="availableTasks"
      :initial-dependencies="currentTask?.relationships?.filter(r => r.direction === 'incoming') || []"
      :initial-successors="currentTask?.relationships?.filter(r => r.direction === 'outgoing') || []"
      :exclude-weekends="excludeWeekends"
      @close="closeRelationshipSelector"
      @save="saveRelationships"
      @update-relationships="handleRealTimeRelationshipUpdate"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, h } from 'vue'
import RelationshipSelectorModal from './ProjectTaskRelationshipSelectorModal.vue'

const RenderGroupComponent = {
  name: 'RenderGroup',
  props: {
    group: Object, 
    groupIndex: Number, 
    level: Number,
    getGroupShortId: Function, 
    getGroupColor: Function, 
    isSwimlaneNameEmpty: Function,
    editingCell: String, 
    editValue: String, 
    formatDate: Function,
    getTaskFullId: Function, 
    hasTaskRequiredIssues: Function,
    isTaskNameEmpty: Function, 
    isOwnerEmpty: Function,
    isStartDateEmpty: Function, 
    isEndDateEmpty: Function,
    getTaskRelationships: Function, 
    getRelationshipIcon: Function,
    getRelationshipTooltip: Function, 
    getTaskIdFromRelationship: Function,
    excludeWeekends: Boolean, 
    getMinDate: Function, 
    getNextDate: Function,
    onDurationDaysChange: Function, 
    onProgressChange: Function,
    toggleGroup: Function, 
    toggleTaskType: Function,
    startEditing: Function, 
    saveEdit: Function, 
    saveDateEdit: Function, 
    cancelEdit: Function,
    removeTask: Function, 
    openRelationshipSelector: Function,
    addTask: Function, 
    addSubSwimlane: Function,
  },
  emits: ['update:data', 'select-item'],
  setup(props, { emit }) {
    const dragStartTask = ref(null);
    const dragOverTaskId = ref(null);
    
    const indent = (level) => ({ paddingLeft: `${level * 20 + 8}px` })

    const handleDragStart = (task, event) => {
      dragStartTask.value = task;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', JSON.stringify({ id: task.id, parentId: task.parentId || null }));
      if (event.target) {
        event.target.style.opacity = '0.5';
      }
    }

    const handleDragEnd = (event) => {
      if (event.target) {
        event.target.style.opacity = '';
      }
      dragStartTask.value = null;
      dragOverTaskId.value = null;
    }

    const handleDragOver = (taskId, event) => {
      event.preventDefault();
      dragOverTaskId.value = taskId;
      event.dataTransfer.dropEffect = 'move';
    }

    const handleDrop = (targetTask, targetParentId, event) => {
      event.preventDefault();
      const sourceTask = dragStartTask.value;
      
      if (!sourceTask || sourceTask.id === targetTask.id) {
        dragStartTask.value = null;
        dragOverTaskId.value = null;
        return;
      }
      
      const swimlane = props.group;
      
      const findTaskAndParent = (tasks, taskId, parent = null) => {
        for (let i = 0; i < tasks.length; i++) {
          if (tasks[i].id === taskId) {
            return { task: tasks[i], parent, index: i };
          }
          if (tasks[i].children && tasks[i].children.length > 0) {
            const found = findTaskAndParent(tasks[i].children, taskId, tasks[i]);
            if (found) return found;
          }
        }
        return null;
      };
      
      const sourceInfo = findTaskAndParent(swimlane.tasks, sourceTask.id);
      const targetInfo = findTaskAndParent(swimlane.tasks, targetTask.id);
      
      if (!sourceInfo || !targetInfo) {
        dragStartTask.value = null;
        dragOverTaskId.value = null;
        return;
      }
      
      const sourceParent = sourceInfo.parent;
      const sourceIndex = sourceInfo.index;
      
      if (sourceParent) {
        sourceParent.children.splice(sourceIndex, 1);
      } else {
        swimlane.tasks.splice(sourceIndex, 1);
      }
      
      const targetParent = targetInfo.parent;
      const targetIndex = targetInfo.index;
      
      if (targetParent) {
        targetParent.children.splice(targetIndex, 0, sourceTask);
      } else {
        swimlane.tasks.splice(targetIndex, 0, sourceTask);
      }
      
      sourceTask.parentId = targetParent ? targetParent.id : null;
      
      emit('update:data');
      
      dragStartTask.value = null;
      dragOverTaskId.value = null;
    }

    const handleSelectItem = (itemId, itemName, itemType) => {
      emit('select-item', { id: itemId, name: itemName, type: itemType });
    }

    const renderTaskRow = (task, taskIndex, groupId, level = 0, parentTask = null) => {
      const rels = props.getTaskRelationships(task) || []
      const hasChildren = task.children && task.children.length > 0
      const isExpanded = task.expanded !== false
      const isDragging = dragStartTask.value?.id === task.id
      const isDragOver = dragOverTaskId.value === task.id
      
      const rows = []
      
      rows.push(h('tr', {
        class: [
          'task-row', 
          task.isParent && 'parent-task', 
          task.isMilestone && 'milestone', 
          props.hasTaskRequiredIssues(task) && 'has-errors',
          isDragging && 'dragging-source',
          isDragOver && 'drag-over'
        ],
        key: task.id,
        style: { 
          backgroundColor: task.isParent ? 'rgba(99, 102, 241, 0.03)' : 'transparent',
          opacity: isDragging ? 0.5 : 1
        },
        draggable: true,
        onDragstart: (e) => handleDragStart(task, e),
        onDragend: handleDragEnd,
        onDragover: (e) => handleDragOver(task.id, e),
        onDrop: (e) => handleDrop(task, null, e),
      }, [
        h('td', { class: 'col-move', style: 'width: 45px;' }, [
          h('div', { class: 'task-drag-handle', title: 'Drag to reorder' }, [
            h('span', { class: 'material-symbols-outlined' }, 'drag_indicator')
          ])
        ]),
        h('td', { class: 'col-id', style: 'width: 70px;' }, [
          h('span', { 
            class: 'task-id-badge',
            onClick: (e) => {
              e.stopPropagation();
              handleSelectItem(task.id, task.name, 'task');
            },
            style: { cursor: 'pointer' }
          }, props.getTaskFullId(task, { id: groupId, name: props.group?.name || 'Group' }, taskIndex))
        ]),
        h('td', { class: 'col-task', style: 'width: 320px;' }, [
          h('div', { class: 'task-cell', style: 'display: flex; flex-direction: row; align-items: center; gap: 8px;' }, [
            hasChildren && h('button', {
              class: 'expand-task-btn',
              onClick: (e) => {
                e.stopPropagation();
                task.expanded = !task.expanded;
                emit('update:data');
              }
            }, [
              h('span', { class: 'material-symbols-outlined' }, isExpanded ? 'expand_more' : 'chevron_right')
            ]),
            h('div', {
              class: ['editable-text', !task.name && 'empty', props.isTaskNameEmpty(task) && 'error', task.isParent && 'parent-task-name'],
              onClick: (e) => {
                e.stopPropagation();
                if (props.editingCell !== `task-name-${groupId}-${task.id}`) {
                  props.startEditing('task-name', groupId, task.id, task.name || '');
                }
              }
            }, [
              props.editingCell === `task-name-${groupId}-${task.id}`
                ? h('input', { 
                    modelValue: props.editValue, 
                    onKeyupEnter: props.saveEdit, 
                    onKeyupEscape: props.cancelEdit, 
                    onBlur: props.saveEdit, 
                    class: 'inline-input', 
                    placeholder: 'Enter task name...',
                    autofocus: true
                  })
                : h('span', { 
                    class: ['text-truncate', !task.name && 'placeholder-text']
                  }, task.name || 'Enter task name...')
            ])
          ])
        ]),
        h('td', { class: 'col-owner', style: 'width: 140px;' }, [
          h('div', {
            class: ['editable-text', !task.owner && 'empty', props.isOwnerEmpty(task) && 'error'],
            onClick: (e) => {
              e.stopPropagation();
              if (props.editingCell !== `owner-${groupId}-${task.id}`) {
                props.startEditing('owner', groupId, task.id, task.owner || '');
              }
            }
          }, [
            props.editingCell !== `owner-${groupId}-${task.id}`
              ? h('span', { 
                  class: ['text-truncate', !task.owner && 'placeholder-text']
                }, task.owner || 'Enter owner...')
              : h('input', { 
                  modelValue: props.editValue, 
                  onKeyupEnter: props.saveEdit, 
                  onKeyupEscape: props.cancelEdit, 
                  onBlur: props.saveEdit, 
                  class: 'inline-input', 
                  placeholder: 'Enter owner...',
                  autofocus: true
                })
          ])
        ]),
        h('td', { class: 'col-type', style: 'width: 100px;' }, [
          h('button', {
            class: ['type-btn', task.isMilestone && 'milestone'],
            onClick: (e) => {
              e.stopPropagation();
              props.toggleTaskType(groupId, task.id);
            },
            title: task.isMilestone ? 'Switch to Task' : 'Switch to Milestone'
          }, [
            h('span', { class: 'material-symbols-outlined' }, task.isMilestone ? 'diamond' : task.isParent ? 'folder' : 'checklist'),
            h('span', { class: 'type-label' }, task.isMilestone ? 'Milestone' : task.isParent ? 'Parent' : 'Task')
          ])
        ]),
        h('td', { class: 'col-rel', style: 'width: 180px;' }, [
          h('div', { class: 'relationship-container' }, [
            h('button', {
              class: ['rel-btn', rels && rels.length > 0 && 'has-relationships'],
              onClick: (e) => { 
                e.stopPropagation(); 
                props.openRelationshipSelector(groupId, task);
              },
              title: rels && rels.length > 0 ? `View ${rels.length} relationship(s)` : 'Click to add relationship'
            }, [
              h('div', { class: 'relationship-display' }, [
                !rels || rels.length === 0
                  ? h('span', { class: 'relationship-placeholder' }, '➕ Add relationship')
                  : h('div', { class: 'relationship-badges-wrapper' }, [
                      h('div', { class: 'relationship-badges' }, [
                        ...rels.slice(0, 3).map(rel => {
                          const relType = rel.type || 'fs'
                          const directionIcon = rel.direction === 'incoming' ? '←' : '→'
                          return h('div', { 
                            class: ['relationship-badge', relType], 
                            title: props.getRelationshipTooltip(rel) 
                          }, [
                            h('span', { class: 'direction-icon' }, directionIcon),
                            h('span', { class: 'rel-task-id' }, props.getTaskIdFromRelationship(rel)),
                            h('span', { class: 'rel-type-icon' }, props.getRelationshipIcon(relType))
                          ])
                        }),
                        rels.length > 2 && h('div', { class: 'relationship-more' }, `+${rels.length - 2}`)
                      ]),
                      h('span', { class: 'edit-icon material-symbols-outlined' }, 'edit')
                    ])
              ])
            ])
          ])
        ]),
        h('td', { class: 'col-start', style: 'width: 110px;' }, [
          h('div', {
            class: ['editable-text', 'date', !task.startDate && 'empty', props.isStartDateEmpty(task) && 'error'],
            onClick: (e) => {
              e.stopPropagation();
              if (props.editingCell !== `start-date-${groupId}-${task.id}`) {
                props.startEditing('start-date', groupId, task.id, task.startDate || '');
              }
            }
          }, [
            props.editingCell !== `start-date-${groupId}-${task.id}`
              ? h('span', { class: ['text-truncate', !task.startDate && 'placeholder-text'] }, props.formatDate(task.startDate) || 'Select date')
              : h('input', { 
                  type: 'date', 
                  modelValue: props.editValue, 
                  onChange: props.saveDateEdit, 
                  class: 'date-input', 
                  min: props.getMinDate(),
                  autofocus: true
                })
          ])
        ]),
        h('td', { class: 'col-end', style: 'width: 110px;' }, [
          h('div', {
            class: ['editable-text', 'date', !task.endDate && 'empty', props.isEndDateEmpty(task) && 'error'],
            onClick: (e) => {
              e.stopPropagation();
              if (props.editingCell !== `end-date-${groupId}-${task.id}`) {
                props.startEditing('end-date', groupId, task.id, task.endDate || '');
              }
            }
          }, [
            props.editingCell !== `end-date-${groupId}-${task.id}`
              ? h('span', { class: ['text-truncate', !task.endDate && 'placeholder-text'] }, props.formatDate(task.endDate) || 'Select date')
              : h('input', { 
                  type: 'date', 
                  modelValue: props.editValue, 
                  onChange: props.saveDateEdit, 
                  class: 'date-input', 
                  min: task.startDate ? props.getNextDate(task.startDate) : props.getMinDate(),
                  autofocus: true
                })
          ])
        ]),
        h('td', { class: 'col-dur', style: 'width: 80px;' }, [
          h('div', { class: 'duration-container' }, [
            h('input', {
              type: 'number',
              modelValue: task.durationDays,
              onUpdateModelValue: (val) => { 
                task.durationDays = val;
                props.onDurationDaysChange(groupId, task.id, { target: { value: val } });
              },
              class: 'duration-number-input',
              placeholder: '0',
              min: '0',
              step: '1'
            }),
            h('span', { class: 'duration-label' }, 'd')
          ])
        ]),
        h('td', { class: 'col-prog', style: 'width: 80px;' }, [
          !task.isMilestone
            ? h('div', { class: 'progress-container' }, [
                h('input', {
                  type: 'number',
                  modelValue: task.progress,
                  onUpdateModelValue: (val) => {
                    task.progress = val;
                    props.onProgressChange(groupId, task.id, { target: { value: val } });
                  },
                  min: '0',
                  max: '100',
                  step: '1',
                  class: 'progress-input',
                  placeholder: '0'
                }),
                h('span', { class: 'progress-percent' }, '%')
              ])
            : h('span', { class: 'milestone-progress' }, '—')
        ]),
        h('td', { class: 'col-actions', style: 'width: 50px;' }, [
          h('button', {
            class: 'icon-btn delete',
            onClick: (e) => {
              e.stopPropagation();
              props.removeTask(groupId, task.id);
            },
            title: 'Delete task'
          }, [
            h('span', { class: 'material-symbols-outlined' }, 'close')
          ])
        ])
      ]))
      
      if (hasChildren && isExpanded) {
        task.children.forEach((child, childIndex) => {
          rows.push(...renderTaskRow(child, childIndex, groupId, level + 1, task))
        })
      }
      
      return rows
    }

    return () => {
      const { group, level } = props
      if (!group) return null
      
      const isSubSwimlane = level > 0
      const hasSubGroups = group.subGroups && group.subGroups.length > 0
      const nodes = []
      
      const swimlaneColor = props.getGroupColor(props.groupIndex)

      nodes.push(h('tbody', {
        class: ['swimlane-group', isSubSwimlane && 'sub-swimlane'],
        key: `hdr-${group.id}`,
      }, [
        h('tr', { class: ['swimlane-header', isSubSwimlane && 'sub-swimlane-header'] }, [
          h('td', { class: 'col-move', style: 'width: 45px;' }, [
            h('div', { class: 'swimlane-drag-handle', title: 'Drag to reorder' }, [
              h('span', { class: 'material-symbols-outlined' }, 'drag_indicator')
            ])
          ]),
          h('td', { class: 'col-id', style: 'width: 70px;' }, [
            h('span', { class: ['group-id-badge', isSubSwimlane && 'sub-group-badge'] }, props.getGroupShortId(group, props.groupIndex))
          ]),
          h('td', { class: 'col-task', colspan: 9, style: 'width: auto;' }, [
            h('div', { class: 'swimlane-header-content', style: { paddingLeft: `${level * 24 + 8}px` } }, [
              h('button', { 
                class: 'expand-btn', 
                onClick: (e) => {
                  e.stopPropagation();
                  props.toggleGroup(group.id);
                }, 
                title: group.expanded ? 'Collapse' : 'Expand' 
              }, [
                h('span', { class: 'material-symbols-outlined' }, group.expanded ? 'expand_more' : 'chevron_right')
              ]),
              h('div', { 
                class: ['swimlane-color', isSubSwimlane && 'sub-swimlane-color'], 
                style: { 
                  backgroundColor: swimlaneColor,
                  width: '4px',
                  height: '28px',
                  borderRadius: '4px',
                  display: 'inline-block',
                  flexShrink: 0
                } 
              }),
              h('div', {
                class: ['editable-text', 'swimlane-name', !group.name && 'empty', props.isSwimlaneNameEmpty(group) && 'error', isSubSwimlane && 'sub-swimlane-name'],
                onClick: (e) => {
                  e.stopPropagation();
                  props.startEditing('swimlane', group.id, null, group.name || '');
                }
              }, [
                props.editingCell === `swimlane-${group.id}`
                  ? h('input', { 
                      modelValue: props.editValue, 
                      onKeyupEnter: props.saveEdit, 
                      onKeyupEscape: props.cancelEdit, 
                      onBlur: props.saveEdit, 
                      class: 'inline-input', 
                      placeholder: 'Enter swimlane name...',
                      autofocus: true
                    })
                  : h('span', { class: ['text-truncate', !group.name && 'placeholder-text'] }, group.name || 'Enter swimlane name...')
              ]),
              !isSubSwimlane && h('button', { 
                class: 'icon-btn add-sub-swimlane', 
                onClick: (e) => {
                  e.stopPropagation();
                  props.addSubSwimlane(group.id);
                }, 
                title: 'Add Sub-swimlane' 
              }, [
                h('span', { class: 'material-symbols-outlined' }, 'create_new_folder')
              ]),
            ]),
          ]),
        ]),
      ]))

      if (group.expanded) {
        if (group.tasks && group.tasks.length > 0) {
          const allRows = []
          group.tasks.forEach((task, idx) => {
            allRows.push(...renderTaskRow(task, idx, group.id, 0, null))
          })
          nodes.push(h('tbody', { key: `tasks-${group.id}` }, allRows))
        } else {
          nodes.push(h('tbody', { key: `empty-tasks-${group.id}` }, [
            h('tr', { class: 'empty-tasks-row' }, [
              h('td', { colspan: 11, class: 'empty-tasks-message' }, [
                h('div', { class: 'empty-tasks-placeholder' }, 'No tasks yet. Click "Add New Task" to get started.')
              ])
            ])
          ]))
        }

        if (hasSubGroups) {
          group.subGroups.forEach((sg, si) => {
            nodes.push(h(RenderGroupComponent, {
              key: sg.id,
              group: sg,
              groupIndex: si,
              level: level + 1,
              getGroupShortId: props.getGroupShortId,
              getGroupColor: props.getGroupColor,
              isSwimlaneNameEmpty: props.isSwimlaneNameEmpty,
              editingCell: props.editingCell,
              editValue: props.editValue,
              formatDate: props.formatDate,
              getTaskFullId: props.getTaskFullId,
              hasTaskRequiredIssues: props.hasTaskRequiredIssues,
              isTaskNameEmpty: props.isTaskNameEmpty,
              isOwnerEmpty: props.isOwnerEmpty,
              isStartDateEmpty: props.isStartDateEmpty,
              isEndDateEmpty: props.isEndDateEmpty,
              getTaskRelationships: props.getTaskRelationships,
              getRelationshipIcon: props.getRelationshipIcon,
              getRelationshipTooltip: props.getRelationshipTooltip,
              getTaskIdFromRelationship: props.getTaskIdFromRelationship,
              excludeWeekends: props.excludeWeekends,
              getMinDate: props.getMinDate,
              getNextDate: props.getNextDate,
              onDurationDaysChange: props.onDurationDaysChange,
              onProgressChange: props.onProgressChange,
              toggleGroup: props.toggleGroup,
              toggleTaskType: props.toggleTaskType,
              startEditing: props.startEditing,
              saveEdit: props.saveEdit,
              saveDateEdit: props.saveDateEdit,
              cancelEdit: props.cancelEdit,
              removeTask: props.removeTask,
              openRelationshipSelector: props.openRelationshipSelector,
              addTask: props.addTask,
              addSubSwimlane: props.addSubSwimlane,
              onUpdateData: () => emit('update:data'),
            }))
          })
        }
      }

      return nodes
    }
  },
}

export default {
  name: 'TimelineData',
  components: { RelationshipSelectorModal, RenderGroupComponent },
  props: {
    projectMilestones: { type: Array, default: () => [] },
    initialData: { type: Object, default: () => ({ groups: [], summary: {} }) },
    teamMembers: { type: Array, default: () => [] },
  },
  emits: ['update:data', 'generate'],
  setup(props, { emit }) {
    const timelineGroups = ref([])
    const tableContainer = ref(null)
    const timelineTable = ref(null)
    const editingCell = ref(null)
    const editValue = ref(null)
    const currentEditContext = ref({ type: null, groupId: null, taskId: null })
    const isInitialized = ref(false)
    const excludeWeekends = ref(localStorage.getItem('excludeWeekends') === 'true' || false)
    const showRelationshipModal = ref(false)
    const currentTask = ref(null)
    const currentGroupId = ref(null)
    
    const columnWidths = ref({})
    const totalTableWidth = ref(0)
    
    // Selection state for adding items
    const selectedSwimlaneId = ref(null)
    const selectedSwimlaneName = ref('')
    const selectedParentId = ref(null)
    const selectedParentName = ref('')
    
    // Auto scroll state
    const isDraggingScroll = ref(false)
    const lastMouseX = ref(0)
    const scrollStartPosition = ref(0)
    const isScrollingHint = ref(true)
    const scrollPercent = ref(0)
    let autoScrollInterval = null
    let hintTimeout = null
    let selectionTimeout = null

    const groupColors = [
      '#6366f1', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', 
      '#ec489a', '#06b6d4', '#84cc16', '#f97316', '#14b8a6'
    ]

    // Handle selection from RenderGroupComponent
    const handleSelectItem = ({ id, name, type }) => {
      if (selectionTimeout) clearTimeout(selectionTimeout)
      
      if (type === 'task') {
        selectedParentId.value = id
        selectedParentName.value = name
        selectedSwimlaneId.value = null
        selectedSwimlaneName.value = ''
      } else if (type === 'swimlane') {
        selectedSwimlaneId.value = id
        selectedSwimlaneName.value = name
        selectedParentId.value = null
        selectedParentName.value = ''
      }
      
      selectionTimeout = setTimeout(() => {
        clearSelection()
      }, 5000)
    }

    const clearSelection = () => {
      selectedSwimlaneId.value = null
      selectedSwimlaneName.value = ''
      selectedParentId.value = null
      selectedParentName.value = ''
      if (selectionTimeout) {
        clearTimeout(selectionTimeout)
        selectionTimeout = null
      }
    }

    const addSubSwimlaneToSelected = () => {
      if (selectedSwimlaneId.value) {
        addSubSwimlane(selectedSwimlaneId.value)
        clearSelection()
      }
    }

    const addTaskToSelected = () => {
      if (selectedParentId.value) {
        addTask(selectedParentId.value)
        clearSelection()
      }
    }

    // Handle wheel scroll for horizontal scrolling
    const handleWheelScroll = (event) => {
      if (event.shiftKey) {
        event.preventDefault()
        if (tableContainer.value) {
          tableContainer.value.scrollLeft += event.deltaY
          updateScrollPercent()
        }
      } else if (event.ctrlKey) {
        event.preventDefault()
        if (tableContainer.value) {
          tableContainer.value.scrollLeft += event.deltaY * 2
          updateScrollPercent()
        }
      }
    }

    // Auto scroll based on mouse position near edges
    const handleMouseMoveForAutoScroll = (event) => {
      if (!tableContainer.value || isDraggingScroll.value) return
      
      const container = tableContainer.value
      const rect = container.getBoundingClientRect()
      const mouseX = event.clientX
      const edgeThreshold = 80
      const scrollSpeed = 15
      
      if (mouseX - rect.left < edgeThreshold && mouseX - rect.left > 0) {
        const distance = edgeThreshold - (mouseX - rect.left)
        const speed = Math.min(scrollSpeed, scrollSpeed * (distance / edgeThreshold) * 2)
        startAutoScroll(-speed)
      }
      else if (rect.right - mouseX < edgeThreshold && rect.right - mouseX > 0) {
        const distance = edgeThreshold - (rect.right - mouseX)
        const speed = Math.min(scrollSpeed, scrollSpeed * (distance / edgeThreshold) * 2)
        startAutoScroll(speed)
      }
      else {
        stopAutoScroll()
      }
    }
    
    const startAutoScroll = (speed) => {
      if (autoScrollInterval) return
      
      autoScrollInterval = setInterval(() => {
        if (tableContainer.value) {
          const container = tableContainer.value
          const newScrollLeft = container.scrollLeft + speed
          
          if (newScrollLeft >= 0 && newScrollLeft <= container.scrollWidth - container.clientWidth) {
            container.scrollLeft = newScrollLeft
            updateScrollPercent()
          } else {
            stopAutoScroll()
          }
        }
      }, 16)
    }
    
    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval)
        autoScrollInterval = null
      }
    }
    
    const handleMouseMove = (event) => {
      if (isDraggingScroll.value && tableContainer.value) {
        const deltaX = event.clientX - lastMouseX.value
        if (deltaX !== 0) {
          tableContainer.value.scrollLeft = scrollStartPosition.value - deltaX
          updateScrollPercent()
        }
      }
    }

    const startDragScroll = (event) => {
      if (event.button === 1 || event.ctrlKey) {
        event.preventDefault()
        isDraggingScroll.value = true
        lastMouseX.value = event.clientX
        scrollStartPosition.value = tableContainer.value?.scrollLeft || 0
        document.body.style.cursor = 'grabbing'
        if (tableContainer.value) {
          tableContainer.value.style.cursor = 'grabbing'
        }
        stopAutoScroll()
        
        if (isScrollingHint.value) {
          isScrollingHint.value = false
          if (hintTimeout) clearTimeout(hintTimeout)
        }
      }
    }

    const endDragScroll = () => {
      isDraggingScroll.value = false
      document.body.style.cursor = ''
      if (tableContainer.value) {
        tableContainer.value.style.cursor = ''
      }
    }

    const handleMouseLeave = () => {
      endDragScroll()
      stopAutoScroll()
    }

    const updateScrollPercent = () => {
      if (tableContainer.value) {
        const container = tableContainer.value
        const maxScroll = container.scrollWidth - container.clientWidth
        const currentScroll = container.scrollLeft
        if (maxScroll > 0) {
          scrollPercent.value = (currentScroll / maxScroll) * 100
        } else {
          scrollPercent.value = 0
        }
      }
    }

    const setupScrollListener = () => {
      if (tableContainer.value) {
        tableContainer.value.addEventListener('scroll', updateScrollPercent)
      }
    }

    const setupMouseScrollListeners = () => {
      if (tableContainer.value) {
        window.addEventListener('mouseup', endDragScroll)
        window.addEventListener('mousemove', handleMouseMove)
        
        hintTimeout = setTimeout(() => {
          isScrollingHint.value = false
        }, 5000)
      }
    }

    const cleanupMouseScrollListeners = () => {
      if (tableContainer.value) {
        tableContainer.value.removeEventListener('scroll', updateScrollPercent)
      }
      window.removeEventListener('mouseup', endDragScroll)
      window.removeEventListener('mousemove', handleMouseMove)
      if (hintTimeout) clearTimeout(hintTimeout)
      stopAutoScroll()
    }

    const ensureParentTasksExpanded = (groups) => {
      groups.forEach(group => {
        const processTasks = (tasks) => {
          tasks?.forEach(task => {
            if (task.children && task.children.length > 0) {
              task.isParent = true;
              if (task.expanded === undefined) {
                task.expanded = true;
              }
              processTasks(task.children);
            }
          });
        };
        processTasks(group.tasks);
        if (group.subGroups) ensureParentTasksExpanded(group.subGroups);
      });
    };

    const totalSubSwimlanes = computed(() => {
      let count = 0
      const walk = (groups) => {
        groups?.forEach(g => {
          if (g.subGroups && g.subGroups.length > 0) {
            count += g.subGroups.length
            walk(g.subGroups)
          }
        })
      }
      walk(timelineGroups.value)
      return count
    })
    
    const totalRelationships = computed(() => {
      let count = 0
      const walk = (groups) => {
        groups?.forEach(g => {
          const processTasks = (tasks) => {
            tasks?.forEach(t => {
              if (t.relationships && t.relationships.length > 0) {
                count += t.relationships.length
              }
              if (t.children) processTasks(t.children)
            })
          }
          processTasks(g.tasks)
          if (g.subGroups) walk(g.subGroups)
        })
      }
      walk(timelineGroups.value)
      return count
    })

    const projectStartDate = computed(() => {
      let earliestDate = null
      const walk = (groups) => {
        groups?.forEach(g => {
          const processTasks = (tasks) => {
            tasks?.forEach(t => {
              if (t.startDate) {
                const date = new Date(t.startDate)
                if (!isNaN(date.getTime()) && (!earliestDate || date < earliestDate)) {
                  earliestDate = date
                }
              }
              if (t.children) processTasks(t.children)
            })
          }
          processTasks(g.tasks)
          if (g.subGroups) walk(g.subGroups)
        })
      }
      walk(timelineGroups.value)
      const _ = excludeWeekends.value
      return earliestDate ? earliestDate.toISOString().split('T')[0] : null
    })

    const projectEndDate = computed(() => {
      let latestDate = null
      const walk = (groups) => {
        groups?.forEach(g => {
          const processTasks = (tasks) => {
            tasks?.forEach(t => {
              if (t.endDate) {
                const date = new Date(t.endDate)
                if (!isNaN(date.getTime()) && (!latestDate || date > latestDate)) {
                  latestDate = date
                }
              }
              if (t.children) processTasks(t.children)
            })
          }
          processTasks(g.tasks)
          if (g.subGroups) walk(g.subGroups)
        })
      }
      walk(timelineGroups.value)
      const _ = excludeWeekends.value
      return latestDate ? latestDate.toISOString().split('T')[0] : null
    })

    const totalProjectDuration = computed(() => {
      if (!projectStartDate.value || !projectEndDate.value) return 0
      
      if (excludeWeekends.value) {
        return calculateWorkingDays(projectStartDate.value, projectEndDate.value)
      } else {
        return calculateCalendarDays(projectStartDate.value, projectEndDate.value)
      }
    })

    const measureAllColumnWidths = () => {
      if (!timelineTable.value) return
      const columns = ['col-move', 'col-id', 'col-task', 'col-owner', 'col-type', 'col-rel', 'col-start', 'col-end', 'col-dur', 'col-prog', 'col-actions']
      for (const col of columns) {
        const cells = timelineTable.value.querySelectorAll(`th.${col}, td.${col}`)
        if (cells.length > 0) {
          columnWidths.value[col] = cells[0].offsetWidth
        }
      }
      totalTableWidth.value = timelineTable.value.offsetWidth
    }

    const isWeekend = (date) => { 
      if (!excludeWeekends.value) return false
      if (!date) return false
      const d = new Date(date)
      if (isNaN(d.getTime())) return false
      const day = d.getDay()
      return day === 0 || day === 6
    }
    
    const toYMD = (d) => {
      if (!d || isNaN(d.getTime())) return ''
      return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
    }
    
    const getNextWeekday = (dateStr) => { 
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr
      d.setDate(d.getDate() + 1)
      while (isWeekend(d)) d.setDate(d.getDate() + 1)
      return toYMD(d)
    }
    
    const getNextDate = (dateStr) => excludeWeekends.value ? getNextWeekday(dateStr) : dateStr
    const getMinDate = () => toYMD(new Date())
    
    const formatDate = (date) => {
      if (!date) return ''
      const d = new Date(date)
      if (isNaN(d.getTime())) return ''
      return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear().toString().slice(-2)}`
    }

    const getGroupColor = (index) => groupColors[index % groupColors.length]
    
    const generateAcronym = (text) => { 
      if (!text?.trim()) return ''
      const w = text.trim().split(/\s+/)
      return w.length === 1 ? w[0].substring(0, 2).toUpperCase() : w.map(x => x[0].toUpperCase()).join('')
    }
    
    const getGroupShortId = (group, index) => { 
      if (!group.shortId) {
        group.shortId = group.name?.trim() ? generateAcronym(group.name) : `G${index + 1}`
      }
      return group.shortId 
    }
    
    const getTaskFullId = (task, group, taskIndex) => { 
      if (task.fullId) return task.fullId
      const gId = getGroupShortId(group, taskIndex)
      task.fullId = `${gId}-${(taskIndex + 1).toString().padStart(2, '0')}`
      return task.fullId 
    }
    
    const findGroupAndParent = (groupId, groups = timelineGroups.value, parent = null) => {
      if (!groups) return null
      for (const g of groups) {
        if (g.id === groupId) return { group: g, parent }
        if (g.subGroups?.length) {
          const r = findGroupAndParent(groupId, g.subGroups, g)
          if (r) return r
        }
      }
      return null
    }
    
    const findTaskInGroup = (groupId, taskId) => {
      const res = findGroupAndParent(groupId)
      if (!res?.group.tasks) return null
      
      const findTask = (tasks) => {
        for (const t of tasks) {
          if (t.id === taskId) return t
          if (t.children) {
            const found = findTask(t.children)
            if (found) return found
          }
        }
        return null
      }
      
      return findTask(res.group.tasks)
    }

    const allTasks = computed(() => {
      const tasks = []
      const walk = (groups) => {
        groups?.forEach(g => {
          const processTasks = (taskList, parentId = null) => {
            taskList?.forEach(t => {
              tasks.push({
                ...t,
                groupId: g.id,
                groupName: g.name,
                parentId
              })
              if (t.children) processTasks(t.children, t.id)
            })
          }
          processTasks(g.tasks)
          if (g.subGroups) walk(g.subGroups)
        })
      }
      walk(timelineGroups.value)
      return tasks
    })

    const availableTasks = computed(() => allTasks.value.filter(t => t.id !== currentTask.value?.id))

    const getTaskRelationships = (task) => {
      if (!task?.relationships) return []
      return task.relationships
    }
    
    const getRelationshipTooltip = (rel) => {
      const typeNames = { fs: 'Finish-to-Start', ss: 'Start-to-Start', ff: 'Finish-to-Finish', sf: 'Start-to-Finish' }
      const direction = rel.direction === 'incoming' ? 'Depends on' : 'Predecessor to'
      return `${direction}: ${rel.taskId} (${typeNames[rel.type] || 'FS'})`
    }

    const getRelationshipIcon = (type) => {
      const icons = {
        'fs': '→',
        'ss': '⇢',
        'ff': '⇥',
        'sf': '↛'
      }
      return icons[type] || '→'
    }
    
    const getTaskIdFromRelationship = (rel) => {
      const task = allTasks.value.find(t => t.id === rel.taskId || t.fullId === rel.taskId)
      return task?.fullId || task?.shortId || rel.taskId?.slice(-8) || '??'
    }

    const isSwimlaneNameEmpty = (group) => !group?.name?.trim()
    const isTaskNameEmpty = (task) => !task?.name?.trim()
    const isOwnerEmpty = (task) => !task?.owner?.trim()
    const isStartDateEmpty = (task) => !task?.startDate?.trim()
    const isEndDateEmpty = (task) => !task?.endDate?.trim()
    const hasTaskRequiredIssues = (task) => isTaskNameEmpty(task) || isOwnerEmpty(task) || isStartDateEmpty(task) || isEndDateEmpty(task)
    const hasRequiredIssues = computed(() => false)

    // FIXED: Updated startEditing function with proper Enter key handling
    const startEditing = (type, groupId, taskId = null, currentValue = '') => {
      console.log(`[EDIT] Starting edit - Type: ${type}, Current Value: "${currentValue}"`)
      
      if (editingCell.value) {
        editingCell.value = null
      }
      
      editValue.value = currentValue || ''
      currentEditContext.value = { type, groupId, taskId }
      editingCell.value = taskId ? `${type}-${groupId}-${taskId}` : `${type}-${groupId}`
      
      nextTick(() => {
        const input = document.querySelector('.inline-input, .date-input')
        if (input) {
          input.value = currentValue || ''
          input.focus()
          
          if (currentValue && currentValue.trim() && 
              currentValue !== 'Enter task name...' && 
              currentValue !== 'Enter owner...' &&
              currentValue !== 'Enter swimlane name...') {
            input.select()
          } else if (input.setSelectionRange) {
            input.setSelectionRange(0, 0)
          }
          
          const handleKeyDown = (e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              if (input.type === 'date') {
                saveDateEdit()
              } else {
                saveEdit()
              }
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              cancelEdit()
            }
          }
          
          input.removeEventListener('keydown', handleKeyDown)
          input.addEventListener('keydown', handleKeyDown)
          input._keydownHandler = handleKeyDown
        }
      })
    }

    const saveEdit = () => {
      console.log(`[EDIT] saveEdit called, editingCell: ${editingCell.value}`)
      
      if (!editingCell.value) {
        return
      }
      
      const { type, groupId, taskId } = currentEditContext.value
      const newValue = editValue.value
      console.log(`[EDIT] Saving edit - Type: ${type}, New Value: "${newValue}"`)
      
      const res = findGroupAndParent(groupId)
      if (!res) {
        console.log(`[EDIT] Group not found: ${groupId}`)
        stopEditing()
        return
      }
      
      if (type === 'swimlane') {
        if (newValue && newValue.trim()) {
          res.group.name = newValue
        } else {
          res.group.name = ''
        }
        delete res.group.shortId
        console.log(`[EDIT] Swimlane name saved to: "${res.group.name}"`)
      } else {
        const task = findTaskInGroup(groupId, taskId)
        if (!task) {
          console.log(`[EDIT] Task not found: ${taskId}`)
          stopEditing()
          return
        }
        if (type === 'task-name') {
          task.name = newValue || ''
          console.log(`[EDIT] Task name saved to: "${task.name}"`)
        } else if (type === 'owner') {
          task.owner = newValue || ''
          console.log(`[EDIT] Owner saved to: "${task.owner}"`)
        }
      }
      stopEditing()
    }

    const saveDateEdit = () => {
      console.log(`[EDIT] saveDateEdit called, editingCell: ${editingCell.value}`)
      
      if (!editingCell.value) return
      const { type, groupId, taskId } = currentEditContext.value
      const task = findTaskInGroup(groupId, taskId)
      if (!task) return
      let d = editValue.value
      console.log(`[EDIT] Saving date - Type: ${type}, New Value: "${d}"`)
      
      if (d && excludeWeekends.value && isWeekend(d)) d = getNextWeekday(d)
      if (type === 'start-date') {
        task.startDate = d || ''
        console.log(`[EDIT] Start date saved to: "${task.startDate}"`)
        if (task.durationDays > 0 && d) {
          let currentDate = new Date(d)
          let daysAdded = 0
          let days = task.durationDays
          
          if (excludeWeekends.value) {
            while (daysAdded < days) {
              currentDate.setDate(currentDate.getDate() + 1)
              const dayOfWeek = currentDate.getDay()
              if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                daysAdded++
              }
            }
          } else {
            currentDate.setDate(currentDate.getDate() + days)
          }
          
          task.endDate = toYMD(currentDate)
          console.log(`[EDIT] End date auto-calculated to: "${task.endDate}"`)
        }
      } else if (type === 'end-date') {
        task.endDate = d || ''
        console.log(`[EDIT] End date saved to: "${task.endDate}"`)
        if (task.startDate && d) {
          if (excludeWeekends.value) {
            task.durationDays = calculateWorkingDays(task.startDate, d)
          } else {
            task.durationDays = calculateCalendarDays(task.startDate, d)
          }
          console.log(`[EDIT] Duration recalculated to: ${task.durationDays} days`)
        }
      }
      stopEditing()
    }

    const cancelEdit = () => { 
      console.log(`[EDIT] Edit cancelled`)
      stopEditing() 
    }
    
    const stopEditing = () => {
      // Clean up any keydown handlers
      const input = document.querySelector('.inline-input, .date-input')
      if (input && input._keydownHandler) {
        input.removeEventListener('keydown', input._keydownHandler)
        delete input._keydownHandler
      }
      
      editingCell.value = null
      editValue.value = null
      currentEditContext.value = { type: null, groupId: null, taskId: null }
      emitUpdate()
    }

    const onProgressChange = (groupId, taskId, event) => {
      const task = findTaskInGroup(groupId, taskId)
      if (!task) return
      let v = parseInt(event.target.value)
      if (isNaN(v)) v = 0
      task.progress = Math.min(100, Math.max(0, v))
      emitUpdate()
    }

    const onDurationDaysChange = (groupId, taskId, event) => {
      const task = findTaskInGroup(groupId, taskId)
      if (!task) return
      let days = parseInt(event.target.value)
      if (isNaN(days)) days = 0
      task.durationDays = days
      
      if (days > 0 && task.startDate) {
        let currentDate = new Date(task.startDate)
        let daysAdded = 0
        
        if (excludeWeekends.value) {
          while (daysAdded < days) {
            currentDate.setDate(currentDate.getDate() + 1)
            const dayOfWeek = currentDate.getDay()
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              daysAdded++
            }
          }
        } else {
          currentDate.setDate(currentDate.getDate() + days)
        }
        
        task.endDate = toYMD(currentDate)
      } else if (task.startDate && task.endDate && excludeWeekends.value) {
        task.durationDays = calculateWorkingDays(task.startDate, task.endDate)
      }
      
      emitUpdate()
    }

    const addSwimlane = () => {
      const newGroup = {
        id: `swimlane-${Date.now()}`,
        name: 'New Swimlane',
        expanded: true,
        subGroups: [],
        tasks: []
      }
      timelineGroups.value = [...timelineGroups.value, newGroup]
      emitUpdate()
      nextTick(() => startEditing('swimlane', newGroup.id, null, ''))
    }

    const addSubSwimlane = (parentId) => {
      const res = findGroupAndParent(parentId)
      if (!res) return
      const newSubGroup = {
        id: `subswimlane-${Date.now()}`,
        name: 'New Sub-swimlane',
        expanded: true,
        subGroups: [],
        tasks: []
      }
      if (!res.group.subGroups) res.group.subGroups = []
      res.group.subGroups.push(newSubGroup)
      res.group.expanded = true
      emitUpdate()
      nextTick(() => startEditing('swimlane', newSubGroup.id, null, ''))
    }

    const addTask = (groupId) => {
      const res = findGroupAndParent(groupId)
      if (!res) return
      if (!res.group.tasks) res.group.tasks = []
      const newTask = {
        id: `task-${Date.now()}`,
        name: '',
        startDate: '',
        endDate: '',
        durationDays: 0,
        progress: 0,
        isMilestone: false,
        isParent: false,
        owner: '',
        relationships: [],
        children: [],
        expanded: true
      }
      res.group.tasks.push(newTask)
      emitUpdate()
      nextTick(() => startEditing('task-name', groupId, newTask.id, ''))
    }

    const removeTask = (groupId, taskId) => {
      if (!confirm('Delete this task?')) return
      const res = findGroupAndParent(groupId)
      if (!res?.group.tasks) return
      
      const removeFromList = (tasks) => {
        const index = tasks.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.splice(index, 1)
          return true
        }
        for (const t of tasks) {
          if (t.children && removeFromList(t.children)) return true
        }
        return false
      }
      
      removeFromList(res.group.tasks)
      emitUpdate()
    }

    const toggleGroup = (groupId) => {
      const res = findGroupAndParent(groupId);
      if (res) {
        res.group.expanded = !res.group.expanded;
        emitUpdate();
        nextTick(() => measureAllColumnWidths());
      }
    }

    const toggleTaskType = (groupId, taskId) => {
      const task = findTaskInGroup(groupId, taskId)
      if (!task) return
      task.isMilestone = !task.isMilestone
      if (task.isMilestone) task.progress = 0
      emitUpdate()
    }

    const openRelationshipSelector = (groupId, task) => {
      currentGroupId.value = groupId
      currentTask.value = task
      showRelationshipModal.value = true
    }

    const closeRelationshipSelector = () => {
      showRelationshipModal.value = false
      currentTask.value = null
      currentGroupId.value = null
    }

    const saveRelationships = () => {
      closeRelationshipSelector()
      emitUpdate()
    }

    const handleRealTimeRelationshipUpdate = (relationships) => {
      if (!currentTask.value || !currentGroupId.value) return
      const task = findTaskInGroup(currentGroupId.value, currentTask.value.id)
      if (!task) return
      task.relationships = [...relationships.dependencies, ...relationships.successors]
      emitUpdate()
    }

    const calculateWorkingDays = (startDate, endDate) => {
      if (!startDate || !endDate) return 0
      
      let start = new Date(startDate)
      let end = new Date(endDate)
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0
      
      let workingDays = 0
      let current = new Date(start)
      
      while (current <= end) {
        const dayOfWeek = current.getDay()
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++
        }
        current.setDate(current.getDate() + 1)
      }
      
      return workingDays
    }

    const calculateCalendarDays = (startDate, endDate) => {
      if (!startDate || !endDate) return 0
      const start = new Date(startDate)
      const end = new Date(endDate)
      const diffTime = Math.abs(end - start)
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    }

    const onExcludeWeekendsChange = () => {
      localStorage.setItem('excludeWeekends', excludeWeekends.value)
      
      const recalculateAllTasks = (groups) => {
        groups?.forEach(g => {
          const processTasks = (tasks) => {
            tasks?.forEach(t => {
              if (t.startDate && t.endDate) {
                if (excludeWeekends.value) {
                  t.durationDays = calculateWorkingDays(t.startDate, t.endDate)
                } else {
                  const start = new Date(t.startDate)
                  const end = new Date(t.endDate)
                  const diffTime = Math.abs(end - start)
                  t.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
                }
              }
              if (t.children) processTasks(t.children)
            })
          }
          processTasks(g.tasks)
          if (g.subGroups) recalculateAllTasks(g.subGroups)
        })
      }
      
      recalculateAllTasks(timelineGroups.value)
      emitUpdate()
    }

    watch(excludeWeekends, () => {
      onExcludeWeekendsChange()
    })

    const emitUpdate = () => {
      emit('update:data', {
        groups: timelineGroups.value || [],
        summary: { totalTasks: totalTasksCount.value }
      })
    }

    const totalTasksCount = computed(() => {
      let count = 0
      const walk = (groups) => {
        groups?.forEach(g => {
          const countTasks = (tasks) => {
            tasks?.forEach(t => {
              count++
              if (t.children) countTasks(t.children)
            })
          }
          countTasks(g.tasks)
          if (g.subGroups) walk(g.subGroups)
        })
      }
      walk(timelineGroups.value)
      return count
    })

    const initializeFromMilestones = () => {
      if (isInitialized.value) return
      if (props.initialData?.groups?.length > 0) {
        timelineGroups.value = JSON.parse(JSON.stringify(props.initialData.groups))
        ensureParentTasksExpanded(timelineGroups.value)
        isInitialized.value = true
        nextTick(() => setTimeout(() => measureAllColumnWidths(), 200))
      } else if (props.projectMilestones?.length > 0) {
        const group = {
          id: 'default-group',
          name: 'Project Timeline',
          expanded: true,
          subGroups: [],
          tasks: buildHierarchy(props.projectMilestones)
        }
        timelineGroups.value = [group]
        ensureParentTasksExpanded(timelineGroups.value)
        isInitialized.value = true
        nextTick(() => setTimeout(() => measureAllColumnWidths(), 200))
      }
    }
    
    const buildHierarchy = (items) => {
      const taskMap = new Map()
      const roots = []
      
      items.forEach(item => {
        const task = {
          id: `task-${Date.now()}-${Math.random()}`,
          name: item.name || item['TASK NAME'] || 'Unnamed',
          startDate: item.startDate || item.START || '',
          endDate: item.endDate || item.END || '',
          durationDays: parseInt(item.duration) || 0,
          progress: parseInt(item.progress) || 0,
          isMilestone: item.type === 'Milestone' || false,
          isParent: !!item.children || !!item.subtasks,
          owner: item.owner || item.OWNER || '',
          relationships: [],
          children: [],
          expanded: true
        }
        taskMap.set(item.id || item.name, task)
      })
      
      items.forEach(item => {
        const task = taskMap.get(item.id || item.name)
        const parentId = item.parentId || item.parent
        if (parentId && taskMap.has(parentId)) {
          const parent = taskMap.get(parentId)
          parent.children.push(task)
          parent.isParent = true
        } else {
          roots.push(task)
        }
      })
      
      return roots
    }

    watch(timelineGroups, () => {
      nextTick(() => {
        onExcludeWeekendsChange()
      })
    }, { deep: true })

    watch(() => props.initialData, (newData) => {
      if (newData?.groups?.length > 0 && (!timelineGroups.value || timelineGroups.value.length === 0)) {
        timelineGroups.value = JSON.parse(JSON.stringify(newData.groups))
        ensureParentTasksExpanded(timelineGroups.value)
        nextTick(() => setTimeout(() => measureAllColumnWidths(), 200))
      }
    }, { deep: true, immediate: true })

    onMounted(() => {
      initializeFromMilestones()
      nextTick(() => {
        setTimeout(() => {
          measureAllColumnWidths()
          setupMouseScrollListeners()
          setupScrollListener()
          updateScrollPercent()
        }, 300)
      })
    })

    onUnmounted(() => {
      cleanupMouseScrollListeners()
      if (selectionTimeout) clearTimeout(selectionTimeout)
    })

    return {
      timelineGroups,
      tableContainer,
      timelineTable,
      editingCell,
      editValue,
      hasRequiredIssues,
      formatDate,
      getGroupColor,
      getGroupShortId,
      getTaskFullId,
      getTaskRelationships,
      getRelationshipIcon,
      getRelationshipTooltip,
      getTaskIdFromRelationship,
      isSwimlaneNameEmpty,
      isTaskNameEmpty,
      isOwnerEmpty,
      isStartDateEmpty,
      isEndDateEmpty,
      hasTaskRequiredIssues,
      startEditing,
      saveEdit,
      saveDateEdit,
      cancelEdit,
      onProgressChange,
      onDurationDaysChange,
      addSwimlane,
      addSubSwimlane,
      addTask,
      removeTask,
      toggleGroup,
      toggleTaskType,
      openRelationshipSelector,
      closeRelationshipSelector,
      saveRelationships,
      handleRealTimeRelationshipUpdate,
      excludeWeekends,
      onExcludeWeekendsChange,
      getMinDate,
      getNextDate,
      availableTasks,
      showRelationshipModal,
      currentTask,
      totalSubSwimlanes,
      totalRelationships,
      totalTasksCount,
      columnWidths,
      totalTableWidth,
      emitUpdate,
      projectStartDate,
      projectEndDate,
      totalProjectDuration,
      handleSelectItem,
      addSubSwimlaneToSelected,
      addTaskToSelected,
      clearSelection,
      selectedSwimlaneId,
      selectedSwimlaneName,
      selectedParentId,
      selectedParentName,
      handleWheelScroll,
      handleMouseMoveForAutoScroll,
      handleMouseLeave,
      startDragScroll,
      isScrollingHint,
      scrollPercent,
    }
  },
}
</script>

<style>
/* ============================================
   TIMELINE DEFINITION - MAIN CONTAINER
   ============================================ */
.timeline-definition {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
  border-radius: 24px;
  overflow: hidden;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.dark .timeline-definition {
  background: #0f172a;
}

/* ============================================
   TIMELINE SUMMARY HEADER
   ============================================ */

.timeline-summary-header {
  padding: 16px 24px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dark .timeline-summary-header {
  background: #1e293b;
  border-bottom-color: #334155;
}

.timeline-summary-left {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.timeline-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  transition: all 0.2s ease;
  cursor: default;
}

.dark .timeline-stat-card {
  background: #0f172a;
  border-color: #334155;
}

.timeline-stat-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-color: #cbd5e1;
}

.dark .timeline-stat-card:hover {
  border-color: #475569;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.timeline-stat-icon {
  font-size: 20px;
  opacity: 0.8;
}

.timeline-stat-info {
  display: flex;
  flex-direction: column;
}

.timeline-stat-label {
  font-size: 10px;
  font-weight: 500;
  opacity: 0.6;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.timeline-stat-value {
  font-size: 16px;
  font-weight: 700;
  line-height: 1.3;
  color: #1e293b;
}

.dark .timeline-stat-value {
  color: #f1f5f9;
}

/* Weekend Toggle */
.weekend-toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  padding: 8px 16px;
  border-radius: 12px;
  transition: all 0.2s ease;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
}

.dark .weekend-toggle {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.weekend-toggle:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.dark .weekend-toggle:hover {
  background: #334155;
  color: #e2e8f0;
}

.weekend-toggle input {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

.toggle-label {
  font-size: 12px;
  font-weight: 500;
}

/* ============================================
   SCROLL HINT
   ============================================ */

.scroll-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  color: white;
  padding: 12px 24px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
  font-weight: 500;
  z-index: 100;
  pointer-events: none;
  animation: fadeInOut 5s ease forwards;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.dark .scroll-hint {
  background: rgba(255, 255, 255, 0.9);
  color: #1e293b;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
  }
  10% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  80% {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.9);
    visibility: hidden;
  }
}

.scroll-hint .material-symbols-outlined {
  font-size: 20px;
}

/* ============================================
   SCROLL PROGRESS BAR
   ============================================ */

.scroll-progress-bar {
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #e2e8f0;
  z-index: 45;
  overflow: hidden;
}

.dark .scroll-progress-bar {
  background: #334155;
}

.scroll-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #4f46e5);
  width: 0%;
  transition: width 0.1s ease-out;
  position: relative;
}

.scroll-progress-fill::after {
  content: '';
  position: absolute;
  right: 0;
  top: -2px;
  width: 6px;
  height: 7px;
  background: #6366f1;
  border-radius: 50%;
  box-shadow: 0 0 6px #6366f1;
}

/* ============================================
   TABLE CONTAINER - FIXED HEIGHT WITH SCROLL
   ============================================ */

.timeline-table-container {
  overflow-x: auto;
  overflow-y: auto;
  background: #ffffff;
  position: relative;
  width: 100%;
  scroll-behavior: smooth;
  cursor: auto;
  max-height: 350px;
}

.dark .timeline-table-container {
  background: #0f172a;
}

.timeline-table-container:active {
  cursor: grabbing;
}

/* Ensure the table itself doesn't cause extra scrolling */
.timeline-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
  min-width: 1350px;
  font-size: 13px;
}

/* Column Widths */
.col-move { width: 45px; }
.col-id { width: 70px; }
.col-task { width: 320px; }
.col-owner { width: 140px; }
.col-type { width: 100px; }
.col-rel { width: 180px; }
.col-start { width: 110px; }
.col-end { width: 110px; }
.col-dur { width: 80px; }
.col-prog { width: 80px; }
.col-actions { width: 50px; }

/* ============================================
   STICKY HEADER
   ============================================ */

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
}

.dark .sticky-header {
  background: #0f172a;
}

.timeline-table th {
  padding: 14px 12px;
  background: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  text-align: left;
  white-space: nowrap;
}

.dark .timeline-table th {
  background: #1e293b;
  border-bottom-color: #334155;
  color: #94a3b8;
}

.required-star {
  color: #ef4444;
  margin-left: 3px;
  font-size: 11px;
}

.timeline-table td {
  padding: 10px 10px;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.dark .timeline-table td {
  border-bottom-color: #1e293b;
}

/* ============================================
   FIXED ACTION BAR - Stays at bottom of viewport
   ============================================ */

.fixed-action-bar {
  flex-shrink: 0;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border-top: 1px solid #e2e8f0;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
  z-index: 100;
  padding: 12px 24px;
  position: sticky;
  bottom: 0;
}

.dark .fixed-action-bar {
  background: linear-gradient(135deg, #1e293b, #0f172a);
  border-top-color: #334155;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
}

.action-bar-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.timeline-action-btn {
  justify-content: flex-start;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.timeline-action-btn.primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.timeline-action-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.timeline-action-btn.secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.dark .timeline-action-btn.secondary {
  background: #1e293b;
  color: #94a3b8;
  border-color: #334155;
}

.timeline-action-btn.secondary:hover:not(:disabled) {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.dark .timeline-action-btn.secondary:hover:not(:disabled) {
  background: #334155;
}

.timeline-action-btn.tertiary {
  background: #eef2ff;
  color: #4f46e5;
  border: 1px solid #c7d2fe;
}

.dark .timeline-action-btn.tertiary {
  background: #1e1b4b;
  color: #a5b4fc;
  border-color: #312e81;
}

.timeline-action-btn.tertiary:hover:not(:disabled) {
  background: #e0e7ff;
  transform: translateY(-1px);
}

.dark .timeline-action-btn.tertiary:hover:not(:disabled) {
  background: #2e2b5e;
}

.timeline-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.timeline-action-btn .material-symbols-outlined {
  font-size: 18px;
}

.selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #e0e7ff;
  border-radius: 40px;
  font-size: 12px;
  color: #4f46e5;
}

.dark .selection-info {
  background: #1e1b4b;
  color: #a5b4fc;
}

.clear-selection {
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  font-size: 14px;
  padding: 0 4px;
  border-radius: 50%;
}

.clear-selection:hover {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}

/* ============================================
   ID BADGES
   ============================================ */

.group-id-badge {
  display: inline-flex;
  padding: 5px 10px;
  background: linear-gradient(135deg, #6366f115, #4f46e515);
  border-radius: 20px;
  font-family: monospace;
  font-size: 10px;
  font-weight: 700;
  color: #4f46e5;
  border: 1px solid #6366f130;
  white-space: nowrap;
}

.task-id-badge {
  display: inline-flex;
  padding: 4px 10px;
  background: #f1f5f9;
  border-radius: 20px;
  font-family: monospace;
  font-size: 10px;
  font-weight: 600;
  color: #4f46e5;
  white-space: nowrap;
}

.dark .task-id-badge {
  background: #1e293b;
  color: #a5b4fc;
  border: 1px solid #334155;
}

/* ============================================
   TASK CELL - FIXED FOR HORIZONTAL LAYOUT
   ============================================ */

.task-cell {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
  flex-wrap: nowrap !important;
  width: 100%;
}

.expand-task-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  flex-shrink: 0 !important;
}

.expand-task-btn:hover {
  background: #e2e8f0;
}

.task-cell .editable-text {
  flex: 1 !important;
  min-width: 0 !important;
  display: inline-block !important;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============================================
   EDITABLE TEXT
   ============================================ */

.editable-text {
  cursor: text;
  padding: 6px 10px;
  border: 2px solid transparent;
  border-radius: 8px;
  font-size: 12px;
  transition: all 0.2s ease;
  display: block;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editable-text:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.dark .editable-text:hover {
  background: #1e293b;
  border-color: #334155;
}

.editable-text.error {
  border-color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.05) !important;
}

.editable-text.date {
  font-family: monospace;
  font-size: 12px;
}

.placeholder-text {
  color: #94a3b8;
  font-style: italic;
}

.text-truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

/* ============================================
   TYPE BUTTON
   ============================================ */

.type-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  border-radius: 32px;
  background: #f1f5f9;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 11px;
  font-weight: 600;
  color: #475569;
  white-space: nowrap;
  min-width: 80px;
}

.dark .type-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
}

.type-btn:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.type-btn.milestone {
  background: #fef3c7;
  color: #d97706;
}

.type-btn.milestone:hover {
  background: #fde68a;
}

.type-btn .material-symbols-outlined {
  font-size: 16px;
  flex-shrink: 0;
}

.type-label {
  font-size: 10px;
  font-weight: 600;
}

/* ============================================
   RELATIONSHIP BUTTON
   ============================================ */

.rel-btn {
  width: 100%;
  min-width: 160px;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .rel-btn {
  background: #0f172a;
  border-color: #334155;
}

.rel-btn:hover {
  border-color: #6366f1;
  background: #f8fafc;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
}

.rel-btn.has-relationships {
  border-color: #6366f1;
  background: #eef2ff;
}

.dark .rel-btn.has-relationships {
  background: #1e293b;
}

.relationship-display {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.relationship-badges-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.relationship-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.relationship-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 24px;
  font-size: 10px;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
  cursor: default;
}

.relationship-badge.fs {
  background: #e0e7ff;
  color: #4f46e5;
  border-left: 3px solid #4f46e5;
}

.relationship-badge.ss {
  background: #d1fae5;
  color: #059669;
  border-left: 3px solid #059669;
}

.relationship-badge.ff {
  background: #fed7aa;
  color: #d97706;
  border-left: 3px solid #d97706;
}

.relationship-badge.sf {
  background: #fecaca;
  color: #dc2626;
  border-left: 3px solid #dc2626;
}

.relationship-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.direction-icon {
  font-size: 10px;
  font-weight: 700;
}

.rel-task-id {
  font-family: monospace;
  font-weight: 700;
  font-size: 9px;
}

.rel-type-icon {
  font-size: 10px;
  font-weight: 600;
}

.relationship-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 3px 8px;
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  background: #f1f5f9;
  color: #4f46e5;
}

.dark .relationship-more {
  background: #1e293b;
  color: #a5b4fc;
}

.relationship-placeholder {
  color: #94a3b8;
  font-size: 11px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
}

.edit-icon {
  font-size: 14px !important;
  color: #94a3b8;
  opacity: 0.5;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.rel-btn:hover .edit-icon {
  opacity: 1;
  color: #6366f1;
  transform: rotate(15deg);
}

/* ============================================
   DURATION & PROGRESS
   ============================================ */

.duration-container {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  width: fit-content;
  min-width: 80px;
}

.dark .duration-container {
  background: #1e293b;
  border-color: #334155;
}

.duration-number-input {
  width: 45px;
  padding: 5px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  background: white;
}

.dark .duration-number-input {
  background: #0f172a;
  border-color: #475569;
  color: #e2e8f0;
}

.duration-number-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.duration-label {
  font-size: 9px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
}

.dark .duration-label {
  color: #94a3b8;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 4px;
  background: #f8fafc;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  width: fit-content;
  min-width: 75px;
}

.dark .progress-container {
  background: #1e293b;
  border-color: #334155;
}

.progress-input {
  width: 42px;
  padding: 5px 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  background: white;
}

.dark .progress-input {
  background: #0f172a;
  border-color: #475569;
  color: #e2e8f0;
}

.progress-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.1);
}

.progress-percent {
  font-size: 10px;
  font-weight: 700;
  color: #10b981;
}

.milestone-progress {
  color: #94a3b8;
  font-size: 11px;
  font-style: italic;
  text-align: center;
  display: block;
}

/* ============================================
   ICON BUTTONS
   ============================================ */

.icon-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f1f5f9;
  color: #6366f1;
}

.icon-btn.delete:hover {
  background: #fef2f2;
  color: #ef4444;
}

/* ============================================
   DRAG HANDLES
   ============================================ */

.task-drag-handle,
.swimlane-drag-handle {
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  color: #cbd5e1;
}

.task-drag-handle:hover,
.swimlane-drag-handle:hover {
  background: #f1f5f9;
  color: #6366f1;
}

.task-drag-handle:active,
.swimlane-drag-handle:active {
  cursor: grabbing;
}

/* ============================================
   SWIMLANE HEADER
   ============================================ */

.swimlane-header td {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  border-bottom: 1px solid #e2e8f0;
}

.dark .swimlane-header td {
  background: #1e293b;
  border-color: #334155;
}

.swimlane-header-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.expand-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
  transition: all 0.2s ease;
}

.expand-btn:hover {
  background: #e2e8f0;
}

.swimlane-color {
  width: 4px;
  height: 28px;
  border-radius: 4px;
  display: inline-block;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.swimlane-header:hover .swimlane-color {
  width: 6px;
}

.swimlane-name {
  font-weight: 700;
  font-size: 13px;
  flex: 1;
  color: #1e293b;
}

.dark .swimlane-name {
  color: #f1f5f9;
}

/* ============================================
   ADD TASK BUTTON
   ============================================ */

.add-task-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1.5px dashed #cbd5e1;
  border-radius: 32px;
  background: transparent;
  color: #6366f1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-task-btn:hover {
  border-color: #6366f1;
  background: #eef2ff;
  transform: translateX(4px);
}

.add-task-btn .material-symbols-outlined {
  font-size: 16px;
}

/* ============================================
   ADD SECTION
   ============================================ */

.add-section {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  background: #ffffff;
}

.dark .add-section {
  background: #0f172a;
  border-top-color: #1e293b;
}

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  flex: 1;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
}

/* ============================================
   EMPTY STATE
   ============================================ */

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 40px;
  text-align: center;
}

.empty-icon {
  font-size: 56px;
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dark .empty-state h3 {
  color: #f1f5f9;
}

.empty-state p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 24px 0;
}

.empty-tasks-placeholder {
  text-align: center;
  padding: 24px;
  color: #94a3b8;
  font-size: 12px;
  font-style: italic;
}

/* ============================================
   SUB-SWIMLANE
   ============================================ */

.swimlane-group.sub-swimlane {
  border-left: 3px solid rgba(99, 102, 241, 0.25);
  margin-left: 16px;
  position: relative;
}

.swimlane-group.sub-swimlane::before {
  content: '';
  position: absolute;
  left: -3px;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, #6366f1, #4f46e5);
  border-radius: 3px;
  opacity: 0.7;
}

.sub-swimlane .swimlane-header td {
  background: #f1f5f9;
}

.dark .sub-swimlane .swimlane-header td {
  background: #1a1f2e;
}

/* ============================================
   SCROLLBAR STYLING
   ============================================ */

.timeline-table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.timeline-table-container::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 10px;
}

.timeline-table-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.timeline-table-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.dark .timeline-table-container::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark .timeline-table-container::-webkit-scrollbar-thumb {
  background: #334155;
}

.dark .timeline-table-container::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* Native drag and drop styling */
.task-row[draggable="true"] {
  cursor: grab;
  user-select: none;
}

.task-row[draggable="true"]:active {
  cursor: grabbing;
}

.dragging-source {
  opacity: 0.5 !important;
}

.drag-over {
  border-top: 2px solid #6366f1 !important;
  background: rgba(99, 102, 241, 0.05) !important;
}

.task-drag-handle {
  cursor: grab;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 6px;
  color: #cbd5e1;
  transition: all 0.2s ease;
}

.task-drag-handle:active {
  cursor: grabbing;
}

.task-drag-handle:hover {
  background: #e2e8f0;
  color: #6366f1;
}

.task-row .col-move {
  cursor: grab;
  width: 45px;
}

.task-row .col-move:active {
  cursor: grabbing;
}

/* ============================================
   CHILD TASK SPECIFIC STYLES
   ============================================ */

.child-task .task-cell {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
}

.child-task .expand-task-btn {
  margin-left: 0 !important;
}

/* ============================================
   RESPONSIVE DESIGN
   ============================================ */

@media (max-width: 1200px) {
  .timeline-table {
    min-width: 1200px;
  }
}

@media (max-width: 768px) {
  .timeline-summary-header {
    padding: 12px 16px;
    flex-direction: column;
    align-items: stretch;
  }
  
  .timeline-summary-left {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .timeline-stat-card {
    padding: 6px 12px;
  }
  
  .timeline-stat-value {
    font-size: 14px;
  }
  
  .add-section {
    padding: 12px 16px;
  }
  
  .btn-primary {
    padding: 10px 16px;
    font-size: 12px;
  }
  
  .scroll-hint {
    font-size: 11px;
    padding: 8px 16px;
    white-space: nowrap;
  }
  
  .scroll-hint .material-symbols-outlined {
    font-size: 16px;
  }

  .task-cell {
    gap: 4px !important;
  }

  .expand-task-btn {
    width: 18px;
    height: 18px;
  }

  .expand-task-btn .material-symbols-outlined {
    font-size: 14px;
  }
  
  .action-bar-content {
    gap: 10px;
  }
  
  .timeline-action-btn {
    padding: 8px 14px;
    font-size: 11px;
  }
  
  .timeline-action-btn .material-symbols-outlined {
    font-size: 16px;
  }
  
  .timeline-table-container {
    max-height: calc(100vh - 180px);
  }
}

@media (max-width: 480px) {
  .timeline-table {
    min-width: 1100px;
  }
  
  .timeline-table th,
  .timeline-table td {
    padding: 8px 6px;
  }
  
  .type-label {
    display: none;
  }
  
  .type-btn .material-symbols-outlined {
    font-size: 14px;
  }
  
  .timeline-summary-left {
    flex-direction: column;
  }
  
  .timeline-stat-card {
    width: 100%;
  }
  
  .weekend-toggle {
    justify-content: center;
  }
  
  .scroll-hint {
    font-size: 10px;
    padding: 6px 12px;
  }
  
  .action-bar-content {
    flex-direction: column;
    width: 100%;
  }
  
  .timeline-action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .selection-info {
    width: 100%;
    justify-content: center;
  }
  
  .timeline-table-container {
    max-height: calc(100vh - 220px);
  }
}
</style>