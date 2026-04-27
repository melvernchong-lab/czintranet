<template>
  <div class="modal-backdrop" v-if="show" @click.self="close">
    <div class="modal-content bg-white dark:bg-card-dark rounded-xl border border-border-light dark:border-border-dark shadow-xl max-w-md w-full mx-4">
      <!-- Modal Header -->
      <div class="p-4 border-b border-border-light dark:border-border-dark">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary">notifications</span>
            <div>
              <h2 class="text-lg font-bold">Notifications</h2>
              <p class="text-xs text-muted-light dark:text-muted-dark">{{ unreadCount }} unread</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button 
              @click="markAllAsRead"
              class="text-xs text-primary hover:underline px-2 py-1"
              :disabled="unreadCount === 0"
            >
              Mark all as read
            </button>
            <button @click="close" class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#232948] transition-colors">
              <span class="material-symbols-outlined text-lg">close</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Notification List -->
      <div class="max-h-[60vh] overflow-y-auto">
        <div v-if="notifications.length === 0" class="p-8 text-center">
          <span class="material-symbols-outlined text-4xl text-gray-300 dark:text-gray-600 mb-4">notifications_off</span>
          <p class="text-muted-light dark:text-muted-dark">No notifications yet</p>
        </div>

        <div v-else>
          <!-- Today -->
          <div v-if="hasTodayNotifications">
            <div class="px-4 pt-4 pb-2">
              <p class="text-xs font-medium text-muted-light dark:text-muted-dark">Today</p>
            </div>
            <div class="space-y-1">
              <div 
                v-for="notification in todayNotifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'px-4 py-3 cursor-pointer transition-colors',
                  notification.read ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-900/10'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div :class="[
                    'p-2 rounded-lg flex-shrink-0',
                    getNotificationColor(notification.type)
                  ]">
                    <span class="material-symbols-outlined text-sm">
                      {{ getNotificationIcon(notification.type) }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium mb-1">{{ notification.title }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark line-clamp-2">{{ notification.message }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark mt-2">{{ formatTime(notification.timestamp) }}</p>
                  </div>
                  <div v-if="!notification.read" class="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Yesterday -->
          <div v-if="hasYesterdayNotifications">
            <div class="px-4 pt-4 pb-2">
              <p class="text-xs font-medium text-muted-light dark:text-muted-dark">Yesterday</p>
            </div>
            <div class="space-y-1">
              <div 
                v-for="notification in yesterdayNotifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                :class="[
                  'px-4 py-3 cursor-pointer transition-colors',
                  notification.read ? 'bg-transparent' : 'bg-blue-50 dark:bg-blue-900/10'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div :class="[
                    'p-2 rounded-lg flex-shrink-0',
                    getNotificationColor(notification.type)
                  ]">
                    <span class="material-symbols-outlined text-sm">
                      {{ getNotificationIcon(notification.type) }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium mb-1">{{ notification.title }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark">{{ notification.message }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark mt-2">{{ formatTime(notification.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- This Week -->
          <div v-if="hasThisWeekNotifications">
            <div class="px-4 pt-4 pb-2">
              <p class="text-xs font-medium text-muted-light dark:text-muted-dark">This Week</p>
            </div>
            <div class="space-y-1">
              <div 
                v-for="notification in thisWeekNotifications" 
                :key="notification.id"
                @click="handleNotificationClick(notification)"
                class="px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#232948] transition-colors"
              >
                <div class="flex items-start gap-3">
                  <div :class="[
                    'p-2 rounded-lg flex-shrink-0',
                    getNotificationColor(notification.type)
                  ]">
                    <span class="material-symbols-outlined text-sm">
                      {{ getNotificationIcon(notification.type) }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium mb-1">{{ notification.title }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark">{{ notification.message }}</p>
                    <p class="text-xs text-muted-light dark:text-muted-dark mt-2">{{ formatTime(notification.timestamp) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-border-light dark:border-border-dark">
        <div class="flex justify-between items-center">
          <button 
            @click="viewAll"
            class="text-sm text-primary hover:underline"
          >
            View all notifications
          </button>
          <button 
            @click="clearAll"
            class="text-sm text-red-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ModalNotifications',
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      notifications: [
        {
          id: 1,
          title: 'New User Registration',
          message: 'Jane Doe has registered as a Project Lead',
          type: 'user',
          read: false,
          timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
          action: '/users'
        },
        {
          id: 2,
          title: 'System Alert',
          message: 'Database backup completed successfully',
          type: 'system',
          read: false,
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          action: '/system'
        },
        {
          id: 3,
          title: 'Security Warning',
          message: 'Unauthorized login attempt blocked from IP 192.168.1.1',
          type: 'security',
          read: true,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
          action: '/security'
        },
        {
          id: 4,
          title: 'API Integration',
          message: 'Timesheet API key has been regenerated',
          type: 'integration',
          read: true,
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          action: '/integrations'
        },
        {
          id: 5,
          title: 'Storage Warning',
          message: 'Storage utilization reached 74.2%',
          type: 'storage',
          read: true,
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          action: '/storage'
        },
        {
          id: 6,
          title: 'New Role Created',
          message: 'Reviewer role has been created with custom permissions',
          type: 'role',
          read: true,
          timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          action: '/roles'
        }
      ]
    }
  },
  computed: {
    unreadCount() {
      return this.notifications.filter(n => !n.read).length
    },
    todayNotifications() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return this.notifications.filter(n => new Date(n.timestamp) >= today)
    },
    yesterdayNotifications() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      return this.notifications.filter(n => {
        const date = new Date(n.timestamp)
        return date >= yesterday && date < today
      })
    },
    thisWeekNotifications() {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - 6) // Last 7 days
      return this.notifications.filter(n => {
        const date = new Date(n.timestamp)
        return date >= weekStart && date < today
      })
    },
    hasTodayNotifications() {
      return this.todayNotifications.length > 0
    },
    hasYesterdayNotifications() {
      return this.yesterdayNotifications.length > 0
    },
    hasThisWeekNotifications() {
      return this.thisWeekNotifications.length > 0
    }
  },
  methods: {
    close() {
      this.$emit('close')
    },
    markAllAsRead() {
      this.notifications.forEach(n => n.read = true)
      this.$emit('markAllRead')
    },
    handleNotificationClick(notification) {
      notification.read = true
      if (notification.action) {
        // Navigate to action or emit event
        this.$emit('notificationClick', notification)
        this.close()
      }
    },
    viewAll() {
      this.$emit('viewAll')
      this.close()
    },
    clearAll() {
      if (confirm('Are you sure you want to clear all notifications?')) {
        this.notifications = []
        this.$emit('clearAll')
      }
    },
    getNotificationIcon(type) {
      const icons = {
        user: 'person_add',
        system: 'settings',
        security: 'security',
        integration: 'api',
        storage: 'storage',
        role: 'badge',
        default: 'notifications'
      }
      return icons[type] || icons.default
    },
    getNotificationColor(type) {
      const colors = {
        user: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
        system: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
        security: 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400',
        integration: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
        storage: 'bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
        role: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400',
        default: 'bg-gray-100 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400'
      }
      return colors[type] || colors.default
    },
    formatTime(date) {
      const now = new Date()
      const diffMs = now - new Date(date)
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      
      return new Date(date).toLocaleDateString()
    }
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  animation: slideIn 0.2s ease-out;
  max-height: 90vh;
  overflow-y: auto;
}

.line-clamp-2 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { 
    opacity: 0;
    transform: translateY(-10px) scale(0.98);
  }
  to { 
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>