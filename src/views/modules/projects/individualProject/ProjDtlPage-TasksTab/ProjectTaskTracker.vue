<template>
  <div class="task-tracker-container">
    <div class="task-header">
      <div class="task-header-left">
        <h3>Task Board</h3>
        <div class="task-stats">
          <span class="task-stat">Total: {{ allTasks.length }}</span>
          <span class="task-stat completed">Completed: {{ completedTasksCount }}</span>
          <span class="task-stat in-progress">In Progress: {{ inProgressTasksCount }}</span>
        </div>
      </div>
      <div class="task-header-right">
        <button class="settings-btn" @click="openStatusSettings" title="Customize Statuses">
          <span class="material-symbols-outlined">settings</span>
        </button>
        <div class="view-toggle">
          <button @click="taskView = 'kanban'" :class="['view-btn', { active: taskView === 'kanban' }]">
            <span class="material-symbols-outlined">view_column</span>
          </button>
          <button @click="taskView = 'list'" :class="['view-btn', { active: taskView === 'list' }]">
            <span class="material-symbols-outlined">view_list</span>
          </button>
        </div>
        <button class="add-task-btn" @click="openAddTaskModal">
          <span class="material-symbols-outlined">add</span>
          Add Task
        </button>
      </div>
    </div>

    <!-- Kanban Board View -->
    <div v-if="taskView === 'kanban'" class="kanban-board">
      <div 
        v-for="status in taskStatuses" 
        :key="status.id" 
        class="kanban-column"
        @dragover.prevent
        @drop="onDrop($event, status.id)">
        <div class="kanban-column-header" :style="{ borderBottomColor: status.color }">
          <span class="status-icon material-symbols-outlined">{{ status.icon }}</span>
          <span class="status-title">{{ status.name }}</span>
          <span class="task-count">{{ getTasksByStatus(status.id).length }}</span>
        </div>
        <div class="kanban-tasks">
          <div 
            v-for="task in getTasksByStatus(status.id)" 
            :key="task.id"
            class="kanban-task"
            draggable="true"
            @dragstart="onDragStart($event, task)"
            @click="openTaskDetail(task)">
            <div class="task-priority" :class="'priority-' + task.priority">
              {{ task.priority }}
            </div>
            <h4 class="task-title">{{ task.title }}</h4>
            <p class="task-description">{{ truncateText(task.description, 60) }}</p>
            <div class="task-meta">
              <div class="task-assignee" v-if="task.assignee">
                <div class="assignee-avatar" :style="{ backgroundColor: getAssigneeColor(task.assignee) }">
                  {{ getAssigneeInitials(task.assignee) }}
                </div>
                <span>{{ task.assignee }}</span>
              </div>
              <div class="task-bucket" v-if="task.bucket">
                <span class="material-symbols-outlined">folder</span>
                <span>{{ task.bucket }}</span>
              </div>
              <div class="task-due-date" :class="{ overdue: isOverdue(task.dueDate) }">
                <span class="material-symbols-outlined">calendar_today</span>
                {{ formatDate(task.dueDate) }}
              </div>
            </div>
          </div>
          <div v-if="getTasksByStatus(status.id).length === 0" class="empty-column">
            <span class="material-symbols-outlined">inbox</span>
            <p>No tasks</p>
          </div>
        </div>
      </div>
    </div>

    <!-- List View -->
    <div v-else-if="taskView === 'list'" class="list-view">
      <table class="task-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Bucket</th>
            <th>Assignee</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in allTasks" :key="task.id">
            <td>
              <div class="task-title-cell">
                <span class="task-title-text">{{ task.title }}</span>
                <span class="task-desc-preview">{{ truncateText(task.description, 40) }}</span>
              </div>
            </td>
            <td><span :class="['priority-badge', 'priority-' + task.priority]">{{ task.priority }}</span></td>
            <td>
              <select v-model="task.status" @change="updateTaskStatus(task)" class="status-select">
                <option v-for="status in taskStatuses" :key="status.id" :value="status.id">{{ status.name }}</option>
              </select>
            </td>
            <td>{{ task.bucket || '—' }}</td>
            <td>{{ task.assignee || 'Unassigned' }}</td>
            <td :class="{ 'overdue-date': isOverdue(task.dueDate) }">{{ formatDate(task.dueDate) }}</td>
            <td>
              <div class="task-actions">
                <button @click="openTaskDetail(task)" class="task-action-btn view-task" title="View Details">
                  <span class="material-symbols-outlined">visibility</span>
                </button>
                <button @click="deleteTask(task)" class="task-action-btn delete-task" title="Delete">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Task Detail Modal -->
    <div v-if="showTaskDetailModal" class="modal-overlay" @click.self="closeTaskDetailModal">
      <div class="task-detail-modal">
        <div class="modal-header">
          <h3>{{ selectedTask?.title }}</h3>
          <button class="close-btn" @click="closeTaskDetailModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body" v-if="selectedTask">
          <div class="task-detail-section">
            <div class="task-detail-row">
              <span class="detail-label">Priority:</span>
              <span :class="['priority-badge', 'priority-' + selectedTask.priority]">{{ selectedTask.priority }}</span>
            </div>
            <div class="task-detail-row">
              <span class="detail-label">Status:</span>
              <select v-model="selectedTask.status" @change="updateTaskStatus(selectedTask)" class="status-select">
                <option v-for="status in taskStatuses" :key="status.id" :value="status.id">{{ status.name }}</option>
              </select>
            </div>
            <div class="task-detail-row">
              <span class="detail-label">Bucket:</span>
              <select v-model="selectedTask.bucket" class="bucket-select">
                <option value="">No Bucket</option>
                <option v-for="bucket in taskBuckets" :key="bucket" :value="bucket">{{ bucket }}</option>
              </select>
              <button class="add-bucket-btn" @click="openAddBucketModal">+ New</button>
            </div>
            <div class="task-detail-row">
              <span class="detail-label">Assignee:</span>
              <select v-model="selectedTask.assignee" class="assignee-select">
                <option value="">Unassigned</option>
                <option v-for="member in teamMembers" :key="member.id" :value="member.name">{{ member.name }}</option>
              </select>
            </div>
            <div class="task-detail-row">
              <span class="detail-label">Due Date:</span>
              <input type="date" v-model="selectedTask.dueDate" class="date-input">
            </div>
            <div class="task-detail-row">
              <span class="detail-label">Description:</span>
              <textarea v-model="selectedTask.description" class="description-textarea" rows="4"></textarea>
            </div>
          </div>

          <!-- Comments Section -->
          <div class="comments-section">
            <h4>Comments</h4>
            <div class="comment-list">
              <div v-for="comment in selectedTask.comments" :key="comment.id" class="comment-item">
                <div class="comment-avatar">{{ getInitials(comment.author) }}</div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.author }}</span>
                    <span class="comment-time">{{ formatRelativeTime(comment.createdAt) }}</span>
                  </div>
                  <p class="comment-text">{{ comment.text }}</p>
                </div>
              </div>
              <div v-if="!selectedTask.comments?.length" class="no-comments">No comments yet</div>
            </div>
            <div class="add-comment">
              <textarea v-model="newComment" placeholder="Write a comment..." rows="2" class="comment-input"></textarea>
              <button @click="addComment" class="submit-comment-btn">Post Comment</button>
            </div>
          </div>

          <!-- Attachments Section -->
          <div class="attachments-section">
            <h4>Attachments</h4>
            <div class="attachment-list">
              <div v-for="attachment in selectedTask.attachments" :key="attachment.id" class="attachment-item">
                <span class="material-symbols-outlined">attach_file</span>
                <a :href="attachment.url" target="_blank" class="attachment-name">{{ attachment.name }}</a>
                <button @click="removeAttachment(attachment.id)" class="remove-attachment">×</button>
              </div>
            </div>
            <div class="add-attachment">
              <input type="file" ref="fileInput" @change="handleFileUpload" style="display: none" multiple>
              <button @click="$refs.fileInput.click()" class="upload-btn">
                <span class="material-symbols-outlined">cloud_upload</span>
                Upload Files
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTaskDetailModal">Close</button>
          <button class="btn-primary" @click="saveTaskDetail">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Task Modal -->
    <div v-if="showTaskModal" class="modal-overlay" @click.self="closeTaskModal">
      <div class="task-modal">
        <div class="modal-header">
          <h3>{{ isEditingTask ? 'Edit Task' : 'Add New Task' }}</h3>
          <button class="close-btn" @click="closeTaskModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Task Title *</label>
            <input type="text" v-model="taskForm.title" class="form-input" placeholder="Enter task title">
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="taskForm.description" class="form-textarea" rows="3" placeholder="Enter task description"></textarea>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Priority</label>
              <select v-model="taskForm.priority" class="form-select">
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select v-model="taskForm.status" class="form-select">
                <option v-for="status in taskStatuses" :key="status.id" :value="status.id">{{ status.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Bucket</label>
              <select v-model="taskForm.bucket" class="form-select">
                <option value="">No Bucket</option>
                <option v-for="bucket in taskBuckets" :key="bucket" :value="bucket">{{ bucket }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>Assignee</label>
              <select v-model="taskForm.assignee" class="form-select">
                <option value="">Unassigned</option>
                <option v-for="member in teamMembers" :key="member.id" :value="member.name">{{ member.name }}</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>Due Date</label>
            <input type="date" v-model="taskForm.dueDate" class="form-input">
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeTaskModal">Cancel</button>
          <button class="btn-primary" @click="saveTask">Save Task</button>
        </div>
      </div>
    </div>

    <!-- Status Settings Modal -->
    <div v-if="showStatusSettings" class="modal-overlay" @click.self="closeStatusSettings">
      <div class="settings-modal">
        <div class="modal-header">
          <h3>Customize Task Statuses</h3>
          <button class="close-btn" @click="closeStatusSettings">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="status-list">
            <div v-for="(status, index) in taskStatuses" :key="status.id" class="status-editor-item">
              <input type="text" v-model="status.name" class="status-name-input" placeholder="Status name">
              <input type="color" v-model="status.color" class="status-color-picker">
              <button @click="removeStatus(index)" class="remove-status-btn" :disabled="taskStatuses.length <= 1">×</button>
            </div>
          </div>
          <button @click="addNewStatus" class="add-status-btn">
            <span class="material-symbols-outlined">add</span>
            Add New Status
          </button>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeStatusSettings">Cancel</button>
          <button class="btn-primary" @click="saveStatusSettings">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Add Bucket Modal -->
    <div v-if="showAddBucketModal" class="modal-overlay" @click.self="closeAddBucketModal">
      <div class="simple-modal">
        <div class="modal-header">
          <h3>Add New Bucket</h3>
          <button class="close-btn" @click="closeAddBucketModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <input type="text" v-model="newBucketName" class="form-input" placeholder="Bucket name" @keyup.enter="addBucket">
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeAddBucketModal">Cancel</button>
          <button class="btn-primary" @click="addBucket">Add</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'

export default {
  name: 'ProjectTaskTracker',
  props: {
    projectId: {
      type: [String, Number],
      required: true
    },
    teamMembers: {
      type: Array,
      default: () => []
    }
  },
  emits: ['task-updated'],
  setup(props) {
    const route = useRoute()
    const toast = useToast()
    
    // Task Management
    const allTasks = ref([])
    const taskView = ref('kanban')
    const showTaskModal = ref(false)
    const showTaskDetailModal = ref(false)
    const isEditingTask = ref(false)
    const currentTaskId = ref(null)
    const selectedTask = ref(null)
    const newComment = ref('')
    const fileInput = ref(null)
    
    // Task Buckets
    const taskBuckets = ref(['Development', 'Design', 'Testing', 'Documentation', 'Research'])
    const showAddBucketModal = ref(false)
    const newBucketName = ref('')
    
    // Customizable Statuses
    const defaultStatuses = [
      { id: 'todo', name: 'To Do', icon: 'radio_button_unchecked', color: '#64748b' },
      { id: 'in_progress', name: 'In Progress', icon: 'progress_activity', color: '#3b82f6' },
      { id: 'review', name: 'Review', icon: 'rate_review', color: '#f59e0b' },
      { id: 'done', name: 'Done', icon: 'check_circle', color: '#10b981' }
    ]
    const taskStatuses = ref([...defaultStatuses])
    const showStatusSettings = ref(false)
    
    const taskForm = ref({
      title: '',
      description: '',
      priority: 'Medium',
      status: 'todo',
      bucket: '',
      assignee: '',
      dueDate: ''
    })
    
    const draggedTask = ref(null)
    const availableMembers = ref([
      { id: 1, name: 'John Smith', role: 'Senior Developer', initials: 'JS', avatarColor: '#3b82f6' },
      { id: 2, name: 'Sarah Johnson', role: 'UI/UX Designer', initials: 'SJ', avatarColor: '#10b981' },
      { id: 3, name: 'Michael Chen', role: 'Backend Developer', initials: 'MC', avatarColor: '#f59e0b' },
      { id: 4, name: 'Emily Davis', role: 'QA Engineer', initials: 'ED', avatarColor: '#8b5cf6' },
      { id: 5, name: 'Robert Wilson', role: 'DevOps', initials: 'RW', avatarColor: '#ec4899' },
      { id: 6, name: 'Lisa Wang', role: 'Frontend Dev', initials: 'LW', avatarColor: '#06b6d4' }
    ])

    const completedTasksCount = computed(() => allTasks.value.filter(t => t.status === 'done').length)
    const inProgressTasksCount = computed(() => allTasks.value.filter(t => t.status === 'in_progress').length)

    // Load tasks from localStorage
    const loadTasks = () => {
      const storedTasks = localStorage.getItem(`project_tasks_${props.projectId}`)
      if (storedTasks) {
        allTasks.value = JSON.parse(storedTasks)
      } else {
        allTasks.value = []
        saveTasks()
      }
    }

    const saveTasks = () => {
      localStorage.setItem(`project_tasks_${props.projectId}`, JSON.stringify(allTasks.value))
    }

    // Load statuses from localStorage
    const loadStatuses = () => {
      const saved = localStorage.getItem(`project_statuses_${props.projectId}`)
      if (saved) {
        taskStatuses.value = JSON.parse(saved)
      } else {
        taskStatuses.value = [...defaultStatuses]
      }
    }

    const saveStatuses = () => {
      localStorage.setItem(`project_statuses_${props.projectId}`, JSON.stringify(taskStatuses.value))
    }

    // Load buckets from localStorage
    const loadBuckets = () => {
      const saved = localStorage.getItem(`project_buckets_${props.projectId}`)
      if (saved) {
        taskBuckets.value = JSON.parse(saved)
      }
    }

    const saveBuckets = () => {
      localStorage.setItem(`project_buckets_${props.projectId}`, JSON.stringify(taskBuckets.value))
    }

    // Task Management Methods
    const openAddTaskModal = () => {
      isEditingTask.value = false
      currentTaskId.value = null
      taskForm.value = {
        title: '',
        description: '',
        priority: 'Medium',
        status: taskStatuses.value[0]?.id || 'todo',
        bucket: '',
        assignee: '',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      }
      showTaskModal.value = true
    }

    const openTaskDetail = (task) => {
      selectedTask.value = JSON.parse(JSON.stringify(task))
      showTaskDetailModal.value = true
    }

    const closeTaskDetailModal = () => {
      showTaskDetailModal.value = false
      selectedTask.value = null
      newComment.value = ''
    }

    const saveTaskDetail = () => {
      if (selectedTask.value) {
        const index = allTasks.value.findIndex(t => t.id === selectedTask.value.id)
        if (index !== -1) {
          allTasks.value[index] = { ...selectedTask.value }
          saveTasks()
          toast.success('Task updated successfully')
        }
        closeTaskDetailModal()
      }
    }

    const addComment = () => {
      if (!newComment.value.trim() || !selectedTask.value) return
      
      const comment = {
        id: Date.now(),
        text: newComment.value.trim(),
        author: 'Current User',
        createdAt: new Date().toISOString()
      }
      
      if (!selectedTask.value.comments) selectedTask.value.comments = []
      selectedTask.value.comments.push(comment)
      newComment.value = ''
    }

    const handleFileUpload = (event) => {
      const files = event.target.files
      if (!selectedTask.value) return
      if (!selectedTask.value.attachments) selectedTask.value.attachments = []
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()
        reader.onload = (e) => {
          selectedTask.value.attachments.push({
            id: Date.now() + i,
            name: file.name,
            size: file.size,
            type: file.type,
            url: e.target.result,
            uploadedAt: new Date().toISOString()
          })
        }
        reader.readAsDataURL(file)
      }
      event.target.value = ''
    }

    const removeAttachment = (attachmentId) => {
      if (selectedTask.value && selectedTask.value.attachments) {
        selectedTask.value.attachments = selectedTask.value.attachments.filter(a => a.id !== attachmentId)
      }
    }

    const saveTask = () => {
      if (!taskForm.value.title.trim()) {
        toast.error('Task title is required')
        return
      }

      if (isEditingTask.value) {
        const index = allTasks.value.findIndex(t => t.id === currentTaskId.value)
        if (index !== -1) {
          allTasks.value[index] = { ...allTasks.value[index], ...taskForm.value, updatedAt: new Date().toISOString() }
          toast.success('Task updated successfully')
        }
      } else {
        const newTask = {
          id: Date.now(),
          ...taskForm.value,
          comments: [],
          attachments: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        allTasks.value.push(newTask)
        toast.success('Task created successfully')
      }
      saveTasks()
      closeTaskModal()
    }

    const deleteTask = async (task) => {
      const confirmed = await window.globalModal?.confirm(`Delete task "${task.title}"?`, 'Delete Task',
        { confirmText: 'Delete', cancelText: 'Cancel', icon: 'delete' })
      if (confirmed) {
        allTasks.value = allTasks.value.filter(t => t.id !== task.id)
        saveTasks()
        toast.success('Task deleted successfully')
      }
    }

    const updateTaskStatus = (task) => {
      saveTasks()
      toast.info(`Task updated`)
    }

    const closeTaskModal = () => {
      showTaskModal.value = false
      isEditingTask.value = false
      currentTaskId.value = null
    }

    // Drag and drop
    const onDragStart = (event, task) => {
      draggedTask.value = task
      event.dataTransfer.effectAllowed = 'move'
    }

    const onDrop = (event, newStatus) => {
      event.preventDefault()
      if (draggedTask.value) {
        draggedTask.value.status = newStatus
        saveTasks()
        toast.info(`Task moved to ${taskStatuses.value.find(s => s.id === newStatus)?.name}`)
        draggedTask.value = null
      }
    }

    // Status management
    const openStatusSettings = () => {
      showStatusSettings.value = true
    }

    const closeStatusSettings = () => {
      showStatusSettings.value = false
    }

    const addNewStatus = () => {
      const newId = `status_${Date.now()}`
      taskStatuses.value.push({
        id: newId,
        name: 'New Status',
        icon: 'label',
        color: '#6366f1'
      })
    }

    const removeStatus = (index) => {
      if (taskStatuses.value.length > 1) {
        const removed = taskStatuses.value.splice(index, 1)[0]
        allTasks.value.forEach(task => {
          if (task.status === removed.id) {
            task.status = taskStatuses.value[0].id
          }
        })
        saveTasks()
      }
    }

    const saveStatusSettings = () => {
      saveStatuses()
      closeStatusSettings()
      toast.success('Statuses updated successfully')
    }

    // Bucket management
    const openAddBucketModal = () => {
      newBucketName.value = ''
      showAddBucketModal.value = true
    }

    const closeAddBucketModal = () => {
      showAddBucketModal.value = false
      newBucketName.value = ''
    }

    const addBucket = () => {
      if (newBucketName.value.trim() && !taskBuckets.value.includes(newBucketName.value.trim())) {
        taskBuckets.value.push(newBucketName.value.trim())
        saveBuckets()
        if (selectedTask.value) {
          selectedTask.value.bucket = newBucketName.value.trim()
        }
        toast.success(`Bucket "${newBucketName.value}" added`)
      }
      closeAddBucketModal()
    }

    // Helper functions for task display
    const getTasksByStatus = (status) => {
      return allTasks.value.filter(task => task.status === status)
    }

    const getAssigneeInitials = (name) => {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const getAssigneeColor = (name) => {
      const member = availableMembers.value.find(m => m.name === name)
      return member?.avatarColor || '#6366f1'
    }

    const getInitials = (name) => {
      if (!name) return '?'
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }

    const isOverdue = (dueDate) => {
      if (!dueDate) return false
      return new Date(dueDate) < new Date() && new Date(dueDate).setHours(0,0,0,0) !== new Date().setHours(0,0,0,0)
    }

    const truncateText = (text, maxLength) => {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }

    const formatDate = (date) => {
      if (!date) return '—'
      const d = new Date(date)
      if (isNaN(d.getTime())) return '—'
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }

    const formatRelativeTime = (timestamp) => {
      if (!timestamp) return ''
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now - date
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
      return date.toLocaleDateString()
    }

    onMounted(() => {
      loadTasks()
      loadStatuses()
      loadBuckets()
    })

    return {
      allTasks,
      taskView,
      showTaskModal,
      showTaskDetailModal,
      isEditingTask,
      taskForm,
      selectedTask,
      newComment,
      taskStatuses,
      taskBuckets,
      showStatusSettings,
      showAddBucketModal,
      completedTasksCount,
      inProgressTasksCount,
      getTasksByStatus,
      openAddTaskModal,
      openTaskDetail,
      closeTaskDetailModal,
      saveTaskDetail,
      addComment,
      handleFileUpload,
      removeAttachment,
      saveTask,
      deleteTask,
      updateTaskStatus,
      closeTaskModal,
      onDragStart,
      onDrop,
      getAssigneeInitials,
      getAssigneeColor,
      getInitials,
      isOverdue,
      truncateText,
      formatDate,
      formatRelativeTime,
      openStatusSettings,
      closeStatusSettings,
      addNewStatus,
      removeStatus,
      saveStatusSettings,
      openAddBucketModal,
      closeAddBucketModal,
      addBucket
    }
  }
}
</script>

<style scoped>
/* ============================================
   PROJECT TASK TRACKER - COMPLETE STYLES
   ============================================ */

.task-tracker-container {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}

.dark .task-tracker-container {
  background: #1e293b;
  border-color: #334155;
}

/* Task Header */
.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 16px;
}

.dark .task-header {
  border-bottom-color: #334155;
}

.task-header-left h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.dark .task-header-left h3 {
  color: #f1f5f9;
}

.task-stats {
  display: flex;
  gap: 16px;
}

.task-stat {
  font-size: 13px;
  color: #64748b;
}

.task-stat.completed {
  color: #10b981;
}

.task-stat.in-progress {
  color: #3b82f6;
}

.task-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.settings-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .settings-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.settings-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.view-toggle {
  display: flex;
  gap: 4px;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
}

.dark .view-toggle {
  background: #0f172a;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.view-btn.active {
  background: #6366f1;
  color: white;
}

.view-btn:hover:not(.active) {
  background: #e2e8f0;
}

.add-task-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* Kanban Board */
.kanban-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 24px;
  overflow-x: auto;
  min-width: 800px;
}

.kanban-column {
  background: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 600px;
}

.dark .kanban-column {
  background: #0f172a;
  border-color: #334155;
}

.kanban-column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: white;
  border-bottom: 2px solid;
}

.dark .kanban-column-header {
  background: #1e293b;
}

.status-icon {
  font-size: 20px;
}

.status-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.task-count {
  background: #e2e8f0;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.dark .task-count {
  background: #334155;
}

.kanban-tasks {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

.kanban-task {
  background: white;
  border-radius: 10px;
  padding: 12px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .kanban-task {
  background: #1e293b;
  border-color: #334155;
}

.kanban-task:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #6366f1;
}

.task-priority {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-bottom: 8px;
}

.priority-Low {
  background: #d1fae5;
  color: #059669;
}

.priority-Medium {
  background: #fef3c7;
  color: #d97706;
}

.priority-High {
  background: #fee2e2;
  color: #dc2626;
}

.priority-Urgent {
  background: #fecaca;
  color: #b91c1c;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1e293b;
}

.dark .task-title {
  color: #f1f5f9;
}

.task-description {
  font-size: 12px;
  color: #64748b;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #64748b;
  flex-wrap: wrap;
  gap: 8px;
}

.task-assignee {
  display: flex;
  align-items: center;
  gap: 6px;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: white;
}

.task-bucket {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-bucket .material-symbols-outlined {
  font-size: 14px;
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-due-date .material-symbols-outlined {
  font-size: 14px;
}

.task-due-date.overdue {
  color: #ef4444;
}

.empty-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #64748b;
  text-align: center;
}

.empty-column .material-symbols-outlined {
  font-size: 32px;
  opacity: 0.5;
  margin-bottom: 8px;
}

/* List View */
.list-view {
  padding: 20px;
  overflow-x: auto;
}

.task-table {
  width: 100%;
  border-collapse: collapse;
}

.task-table th,
.task-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.dark .task-table th,
.dark .task-table td {
  border-bottom-color: #334155;
}

.task-table th {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  background: #f8fafc;
}

.dark .task-table th {
  background: #0f172a;
  color: #94a3b8;
}

.task-title-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.task-title-text {
  font-weight: 600;
  font-size: 14px;
}

.task-desc-preview {
  font-size: 11px;
  color: #64748b;
}

.priority-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 12px;
}

.dark .status-select {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.overdue-date {
  color: #ef4444;
  font-weight: 600;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.task-action-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
}

.task-action-btn:hover {
  background: #f1f5f9;
}

.dark .task-action-btn:hover {
  background: #334155;
}

.view-task:hover {
  color: #3b82f6;
}

.delete-task:hover {
  color: #ef4444;
  background: #fee2e2;
}

/* ============================================
   MODAL STYLES
   ============================================ */
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

.task-detail-modal,
.task-modal,
.settings-modal,
.simple-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 700px;
  max-height: 85vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.dark .task-detail-modal,
.dark .task-modal,
.dark .settings-modal,
.dark .simple-modal {
  background: #1e293b;
}

@keyframes modalSlideIn {
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

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .modal-header h3 {
  color: #f1f5f9;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f1f5f9;
}

.dark .close-btn:hover {
  background: #334155;
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
}

.dark .modal-footer {
  border-top-color: #334155;
}

/* Task Detail Section */
.task-detail-section {
  margin-bottom: 24px;
}

.task-detail-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.detail-label {
  width: 80px;
  font-weight: 600;
  color: #64748b;
}

.bucket-select,
.assignee-select,
.date-input {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  min-width: 150px;
}

.dark .bucket-select,
.dark .assignee-select,
.dark .date-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.add-bucket-btn {
  padding: 6px 12px;
  border: 1px dashed #6366f1;
  border-radius: 6px;
  background: transparent;
  color: #6366f1;
  cursor: pointer;
  font-size: 12px;
}

.description-textarea {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

/* Comments Section */
.comments-section {
  margin-bottom: 24px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.comments-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.comment-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  margin-bottom: 12px;
}

.dark .comment-item {
  background: #0f172a;
}

.comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
}

.comment-time {
  font-size: 11px;
  color: #64748b;
}

.comment-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
}

.no-comments {
  text-align: center;
  padding: 20px;
  color: #64748b;
}

.add-comment {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.comment-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-family: inherit;
  resize: vertical;
}

.dark .comment-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.submit-comment-btn {
  align-self: flex-end;
  padding: 8px 20px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

/* Attachments Section */
.attachments-section {
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.attachments-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
}

.attachment-list {
  margin-bottom: 16px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 8px;
}

.dark .attachment-item {
  background: #0f172a;
}

.attachment-name {
  flex: 1;
  color: #3b82f6;
  text-decoration: none;
}

.attachment-name:hover {
  text-decoration: underline;
}

.remove-attachment {
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #ef4444;
  cursor: pointer;
  font-size: 18px;
}

.remove-attachment:hover {
  background: #fee2e2;
}

.upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}

.dark .upload-btn {
  border-color: #334155;
}

.upload-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* Status Settings Modal */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.status-editor-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-name-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.dark .status-name-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.status-color-picker {
  width: 40px;
  height: 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
}

.remove-status-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: #fee2e2;
  color: #ef4444;
  cursor: pointer;
  font-size: 18px;
}

.remove-status-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-status-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px dashed #6366f1;
  border-radius: 8px;
  background: transparent;
  color: #6366f1;
  cursor: pointer;
  width: 100%;
  justify-content: center;
}

/* Form Elements */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
}

.dark .form-group label {
  color: #94a3b8;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  background: white;
  transition: all 0.2s;
}

.dark .form-input,
.dark .form-select,
.dark .form-textarea {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Buttons */
.btn-primary,
.btn-secondary {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.dark .btn-secondary {
  border-color: #334155;
  color: #94a3b8;
}

.btn-secondary:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Responsive */
@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
    min-width: auto;
  }
  
  .task-table {
    font-size: 12px;
  }
  
  .task-table th,
  .task-table td {
    padding: 8px;
  }
  
  .task-actions {
    flex-direction: column;
    gap: 4px;
  }
  
  .task-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .task-header-right {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 480px) {
  .task-header {
    padding: 16px;
  }
  
  .task-header-left h3 {
    font-size: 16px;
  }
  
  .task-stats {
    gap: 12px;
  }
  
  .task-stat {
    font-size: 11px;
  }
  
  .view-btn {
    width: 32px;
    height: 32px;
  }
  
  .add-task-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .kanban-board {
    padding: 16px;
  }
  
  .kanban-task {
    padding: 10px;
  }
  
  .list-view {
    padding: 12px;
  }
  
  .task-table th,
  .task-table td {
    padding: 8px;
  }
  
  .task-title-text {
    font-size: 13px;
  }
  
  .priority-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
  
  .status-select {
    font-size: 11px;
    padding: 4px 8px;
  }
  
  .task-action-btn {
    width: 26px;
    height: 26px;
  }
  
  .task-action-btn .material-symbols-outlined {
    font-size: 18px;
  }
}
</style>