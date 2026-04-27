<template>
  <div class="recent-activity">
    <div class="recent-activity__card">
      <!-- Header -->
      <div class="recent-activity__header">
        <div class="recent-activity__header-left">
          <h2 class="recent-activity__title">Recent Activity</h2>
          <span class="recent-activity__subtitle">Latest system events and user actions</span>
        </div>
        <div class="recent-activity__header-right">
          <button class="recent-activity__action-btn recent-activity__action-btn--refresh" @click="refreshActivities"
            :disabled="isLoading" title="Refresh activities">
            <span class="material-symbols-outlined" :class="{ 'spin-animation': isLoading }">
              refresh
            </span>
          </button>
          <button class="recent-activity__action-btn recent-activity__action-btn--view-all" @click="viewAllActivities">
            View All
          </button>
          <div class="recent-activity__filter">
            <select v-model="selectedFilter" class="recent-activity__filter-select" @change="applyFilter">
              <option value="all">All Activities</option>
              <option value="user">User Actions</option>
              <option value="system">System Events</option>
              <option value="security">Security</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Activity Timeline -->
      <div class="recent-activity__timeline">
        <div v-if="isLoading" class="recent-activity__loading">
          <div class="recent-activity__loading-spinner"></div>
          <div class="recent-activity__loading-text">Loading activities...</div>
        </div>

        <div v-else-if="filteredActivities.length === 0" class="recent-activity__empty">
          <div class="recent-activity__empty-icon">
            <span class="material-symbols-outlined">history</span>
          </div>
          <div class="recent-activity__empty-title">No activities found</div>
          <div class="recent-activity__empty-text">
            {{ selectedFilter === 'all'
              ? 'No activities recorded yet'
              : `No ${selectedFilter} activities found`
            }}
          </div>
        </div>

        <div v-else class="recent-activity__list">
          <div v-for="(activity, index) in filteredActivities" :key="activity.id" class="recent-activity__item" :class="{
            'recent-activity__item--highlight': isRecent(activity.timestamp),
            'recent-activity__item--unread': !activity.read
          }" @click="markAsRead(activity)">
            <!-- Timeline line -->
            <div class="recent-activity__timeline-line" v-if="index < filteredActivities.length - 1"></div>

            <!-- Activity icon -->
            <div class="recent-activity__icon-wrapper" :class="`recent-activity__icon-wrapper--${activity.type}`">
              <span class="material-symbols-outlined recent-activity__icon">
                {{ getActivityIcon(activity.action) }}
              </span>
            </div>

            <!-- Activity content -->
            <div class="recent-activity__content">
              <div class="recent-activity__content-header">
                <div class="recent-activity__user">
                  <div v-if="activity.user" class="recent-activity__user-info">
                    <div class="recent-activity__user-avatar">
                      {{ getUserInitials(activity.user) }}
                    </div>
                    <div class="recent-activity__user-details">
                      <div class="recent-activity__user-name">{{ activity.user.name }}</div>
                      <div class="recent-activity__user-role">{{ activity.user.role }}</div>
                    </div>
                  </div>
                  <div v-else class="recent-activity__system-label">
                    System Event
                  </div>
                </div>
                <div class="recent-activity__time">
                  {{ formatTimeAgo(activity.timestamp) }}
                  <span v-if="isRecent(activity.timestamp)" class="recent-activity__time-badge">
                    New
                  </span>
                </div>
              </div>

              <div class="recent-activity__message">
                <span class="recent-activity__action" :class="`recent-activity__action--${activity.type}`">
                  {{ activity.action }}
                </span>
                <span class="recent-activity__description">{{ activity.description }}</span>
              </div>

              <div v-if="activity.details" class="recent-activity__details">
                <div class="recent-activity__details-title">Details:</div>
                <div class="recent-activity__details-content">
                  {{ activity.details }}
                </div>
              </div>

              <div v-if="activity.ip || activity.location" class="recent-activity__meta">
                <div v-if="activity.ip" class="recent-activity__meta-item">
                  <span class="material-symbols-outlined recent-activity__meta-icon">public</span>
                  <span class="recent-activity__meta-text">{{ activity.ip }}</span>
                </div>
                <div v-if="activity.location" class="recent-activity__meta-item">
                  <span class="material-symbols-outlined recent-activity__meta-icon">location_on</span>
                  <span class="recent-activity__meta-text">{{ activity.location }}</span>
                </div>
              </div>
            </div>

            <!-- Action buttons -->
            <div class="recent-activity__actions">
              <button v-if="activity.action === 'login_failed'"
                class="recent-activity__quick-action recent-activity__quick-action--security"
                @click.stop="investigateSecurity(activity)" title="Investigate security event">
                <span class="material-symbols-outlined">shield</span>
              </button>
              <button v-if="activity.action === 'user_added' || activity.action === 'role_assigned'"
                class="recent-activity__quick-action recent-activity__quick-action--view"
                @click.stop="viewDetails(activity)" title="View details">
                <span class="material-symbols-outlined">visibility</span>
              </button>
              <button class="recent-activity__quick-action recent-activity__quick-action--dismiss"
                @click.stop="dismissActivity(activity)" title="Dismiss">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="recent-activity__footer">
        <div class="recent-activity__stats">
          <div class="recent-activity__stat">
            <span class="recent-activity__stat-value">{{ totalActivities }}</span>
            <span class="recent-activity__stat-label">Total</span>
          </div>
          <div class="recent-activity__stat">
            <span class="recent-activity__stat-value recent-activity__stat-value--warning">{{ unreadActivities }}</span>
            <span class="recent-activity__stat-label">Unread</span>
          </div>
          <div class="recent-activity__stat">
            <span class="recent-activity__stat-value recent-activity__stat-value--danger">{{ securityActivities
              }}</span>
            <span class="recent-activity__stat-label">Security</span>
          </div>
        </div>
        <button class="recent-activity__export-btn" @click="exportActivities" title="Export activities to CSV">
          <span class="material-symbols-outlined">download</span>
          Export
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';

export default {
  name: 'RecentActivity',
  setup() {
    // Data
    const activities = ref([
      {
        id: 1,
        type: 'success',
        action: 'user_added',
        description: 'Added new user to the system',
        user: { name: 'Michael Chen', role: 'Administrator' },
        timestamp: new Date(Date.now() - 5 * 60000), // 5 minutes ago
        read: false,
        details: 'User assigned to Development team',
        ip: '192.168.1.105',
        location: 'San Francisco, US'
      },
      {
        id: 2,
        type: 'info',
        action: 'permission_updated',
        description: 'Updated user permissions',
        user: { name: 'Sarah Wilson', role: 'System Admin' },
        timestamp: new Date(Date.now() - 30 * 60000), // 30 minutes ago
        read: true,
        details: 'Added write access to Projects module',
        ip: '192.168.1.102',
        location: 'New York, US'
      },
      {
        id: 3,
        type: 'warning',
        action: 'login_failed',
        description: 'Failed login attempt detected',
        user: null, // System event
        timestamp: new Date(Date.now() - 2 * 3600000), // 2 hours ago
        read: false,
        details: '3 consecutive failed attempts',
        ip: '203.0.113.45',
        location: 'Unknown'
      },
      {
        id: 4,
        type: 'success',
        action: 'role_assigned',
        description: 'Assigned new role to user',
        user: { name: 'David Miller', role: 'Manager' },
        timestamp: new Date(Date.now() - 4 * 3600000), // 4 hours ago
        read: true,
        details: 'Changed from Contributor to Manager',
        ip: '192.168.1.110',
        location: 'London, UK'
      },
      {
        id: 5,
        type: 'danger',
        action: 'api_limit_exceeded',
        description: 'API rate limit exceeded',
        user: { name: 'API Service', role: 'System' },
        timestamp: new Date(Date.now() - 6 * 3600000), // 6 hours ago
        read: true,
        details: 'Exceeded 1000 requests/minute limit',
        ip: '192.168.1.201',
        location: 'Data Center'
      },
      {
        id: 6,
        type: 'info',
        action: 'backup_completed',
        description: 'System backup completed successfully',
        user: null,
        timestamp: new Date(Date.now() - 8 * 3600000), // 8 hours ago
        read: true,
        details: 'Backup size: 45.2 GB, Duration: 12m 34s',
        ip: '192.168.1.250',
        location: 'Backup Server'
      },
      {
        id: 7,
        type: 'success',
        action: 'integration_connected',
        description: 'New integration connected',
        user: { name: 'Jennifer Lee', role: 'Developer' },
        timestamp: new Date(Date.now() - 1 * 86400000), // 1 day ago
        read: true,
        details: 'Connected Slack workspace: TechTeam',
        ip: '192.168.1.115',
        location: 'Toronto, CA'
      },
      {
        id: 8,
        type: 'warning',
        action: 'storage_warning',
        description: 'Storage usage warning',
        user: null,
        timestamp: new Date(Date.now() - 1.5 * 86400000), // 1.5 days ago
        read: true,
        details: 'Storage usage at 85% - Consider cleaning up',
        ip: '192.168.1.210',
        location: 'Storage Server'
      }
    ]);

    const selectedFilter = ref('all');
    const isLoading = ref(false);
    const showAll = ref(false);

    // Computed Properties
    const filteredActivities = computed(() => {
      let filtered = activities.value;

      // Apply filter
      if (selectedFilter.value !== 'all') {
        const filterMap = {
          user: ['user_added', 'permission_updated', 'role_assigned', 'integration_connected'],
          system: ['backup_completed', 'storage_warning', 'api_limit_exceeded'],
          security: ['login_failed', 'access_denied', 'security_alert']
        };

        filtered = filtered.filter(activity =>
          filterMap[selectedFilter.value]?.includes(activity.action)
        );
      }

      // Sort by timestamp (newest first)
      filtered = filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit if not showing all
      if (!showAll.value) {
        filtered = filtered.slice(0, 6);
      }

      return filtered;
    });

    const totalActivities = computed(() => activities.value.length);
    const unreadActivities = computed(() =>
      activities.value.filter(activity => !activity.read).length
    );
    const securityActivities = computed(() =>
      activities.value.filter(activity => activity.type === 'danger' || activity.action === 'login_failed').length
    );

    // Methods
    const refreshActivities = async () => {
      isLoading.value = true;
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      isLoading.value = false;
    };

    const viewAllActivities = () => {
      showAll.value = !showAll.value;
    };

    const applyFilter = () => {
      // Filter is already applied through computed property
      console.log('Filter applied:', selectedFilter.value);
    };

    const getActivityIcon = (action) => {
      const iconMap = {
        user_added: 'person_add',
        permission_updated: 'security',
        login_failed: 'warning',
        role_assigned: 'badge',
        api_limit_exceeded: 'speed',
        backup_completed: 'backup',
        integration_connected: 'link',
        storage_warning: 'database'
      };
      return iconMap[action] || 'history';
    };

    const formatTimeAgo = (timestamp) => {
      const now = new Date();
      const diffMs = now - new Date(timestamp);
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(timestamp).toLocaleDateString();
    };

    const isRecent = (timestamp) => {
      const diffMs = new Date() - new Date(timestamp);
      return diffMs < 15 * 60000; // 15 minutes
    };

    const getUserInitials = (user) => {
      return user.name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    const markAsRead = (activity) => {
      activity.read = true;
    };

    const investigateSecurity = (activity) => {
      console.log('Investigating security event:', activity);
      // Navigate to security dashboard or show details
    };

    const viewDetails = (activity) => {
      console.log('Viewing activity details:', activity);
      // Show modal with detailed information
    };

    const dismissActivity = (activity) => {
      const index = activities.value.findIndex(a => a.id === activity.id);
      if (index !== -1) {
        activities.value.splice(index, 1);
      }
    };

    const exportActivities = async () => {
      console.log('Exporting activities...');
      // Implement CSV/PDF export logic
      await window.globalModal?.success(
        'Activities exported successfully!',
        'Export Complete',
        { confirmText: 'Download', icon: 'download' }
      );
    };

    // Auto-mark activities as read when component mounts
    onMounted(() => {
      // Mark activities older than 1 hour as read
      const oneHourAgo = new Date(Date.now() - 3600000);
      activities.value.forEach(activity => {
        if (new Date(activity.timestamp) < oneHourAgo) {
          activity.read = true;
        }
      });
    });

    return {
      activities,
      selectedFilter,
      isLoading,
      filteredActivities,
      totalActivities,
      unreadActivities,
      securityActivities,
      refreshActivities,
      viewAllActivities,
      applyFilter,
      getActivityIcon,
      formatTimeAgo,
      isRecent,
      getUserInitials,
      markAsRead,
      investigateSecurity,
      viewDetails,
      dismissActivity,
      exportActivities
    };
  }
};
</script>

<style scoped>
/* Recent Activities - Enhanced Design */

/* Main Container */
.recent-activity {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow: 0 8px 32px rgba(67, 97, 238, 0.08);
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.recent-activity:hover {
  box-shadow: 0 12px 48px rgba(67, 97, 238, 0.12);
  transform: translateY(-2px);
}

/* Header */
.recent-activity__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 2px solid rgba(226, 232, 240, 0.5);
}

.recent-activity__header-left {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-activity__title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  display: flex;
  align-items: center;
  gap: 12px;
}

.recent-activity__title::before {
  content: '';
  width: 4px;
  height: 24px;
  background: linear-gradient(135deg, #4361ee, #3a56d4);
  border-radius: 4px;
}

.recent-activity__subtitle {
  font-size: 14px;
  color: #64748b;
  font-weight: 500;
}

.recent-activity__header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recent-activity__action-btn {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 16px;
  color: #64748b;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-activity__action-btn:hover {
  background: #4361ee;
  color: white;
  border-color: #4361ee;
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.2);
}

.recent-activity__action-btn:active {
  transform: translateY(0);
}

.recent-activity__action-btn--refresh .material-symbols-outlined {
  font-size: 20px;
}

.recent-activity__filter {
  position: relative;
}

.recent-activity__filter-select {
  padding: 10px 40px 10px 16px;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  font-weight: 500;
  appearance: none;
  cursor: pointer;
  min-width: 160px;
  transition: all 0.3s ease;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 18px;
}

.recent-activity__filter-select:focus {
  outline: none;
  border-color: #4361ee;
  box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

/* Timeline Container */
.recent-activity__timeline {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  margin-bottom: 24px;
  position: relative;
}

.recent-activity__timeline::before {
  content: '';
  position: absolute;
  left: 36px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #4361ee, rgba(67, 97, 238, 0.1));
  z-index: 1;
}

/* Loading State */
.recent-activity__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.recent-activity__loading-spinner {
  width: 48px;
  height: 48px;
  border: 3px solid rgba(226, 232, 240, 0.5);
  border-top-color: #4361ee;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.recent-activity__loading-text {
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
}

/* Empty State */
.recent-activity__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
  text-align: center;
}

.recent-activity__empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.recent-activity__empty-icon .material-symbols-outlined {
  font-size: 36px;
}

.recent-activity__empty-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.recent-activity__empty-text {
  color: #64748b;
  font-size: 14px;
  max-width: 280px;
  line-height: 1.6;
}

/* Activity Items */
.recent-activity__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.recent-activity__item {
  display: flex;
  gap: 20px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.6);
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
  cursor: pointer;
}

.recent-activity__item:hover {
  transform: translateX(4px);
  box-shadow: 0 8px 24px rgba(67, 97, 238, 0.1);
  border-color: #4361ee;
}

.recent-activity__item--highlight {
  background: linear-gradient(135deg, rgba(67, 97, 238, 0.05), rgba(67, 97, 238, 0.02));
  border: 2px solid #4361ee;
  box-shadow: 0 8px 24px rgba(67, 97, 238, 0.15);
}

.recent-activity__item--unread {
  border-left: 4px solid #f59e0b;
}

/* Activity Icon */
.recent-activity__icon-wrapper {
  position: relative;
  z-index: 3;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.recent-activity__icon-wrapper--success {
  background: linear-gradient(135deg, #10b981, #059669);
}

.recent-activity__icon-wrapper--info {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
}

.recent-activity__icon-wrapper--warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.recent-activity__icon-wrapper--danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.recent-activity__icon {
  font-size: 24px;
  color: white;
}

/* Activity Content */
.recent-activity__content {
  flex: 1;
  min-width: 0;
}

.recent-activity__content-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 12px;
}

.recent-activity__user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recent-activity__user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.recent-activity__user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4361ee, #3a56d4);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 8px rgba(67, 97, 238, 0.3);
}

.recent-activity__user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.recent-activity__user-name {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.recent-activity__user-role {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 10px;
  border-radius: 20px;
  display: inline-block;
  font-weight: 500;
}

.recent-activity__system-label {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  padding: 6px 12px;
  background: #f1f5f9;
  border-radius: 12px;
}

.recent-activity__time {
  font-size: 13px;
  color: #94a3b8;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-activity__time-badge {
  font-size: 11px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #4361ee, #3a56d4);
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  box-shadow: 0 4px 8px rgba(67, 97, 238, 0.3);
}

/* Activity Message */
.recent-activity__message {
  margin-bottom: 12px;
  line-height: 1.6;
  font-size: 15px;
  color: #334155;
}

.recent-activity__action {
  font-weight: 700;
  margin-right: 8px;
  display: inline-block;
}

.recent-activity__action--success {
  color: #10b981;
}

.recent-activity__action--info {
  color: #3b82f6;
}

.recent-activity__action--warning {
  color: #f59e0b;
}

.recent-activity__action--danger {
  color: #ef4444;
}

.recent-activity__description {
  color: #475569;
}

/* Activity Details */
.recent-activity__details {
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid rgba(226, 232, 240, 0.8);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  transition: all 0.3s ease;
}

.recent-activity__details:hover {
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
}

.recent-activity__details-title {
  font-size: 13px;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.recent-activity__details-title::before {
  content: '';
  width: 4px;
  height: 4px;
  background: #64748b;
  border-radius: 50%;
}

.recent-activity__details-content {
  font-size: 14px;
  color: #1e293b;
  line-height: 1.5;
}

/* Activity Meta */
.recent-activity__meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.recent-activity__meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.recent-activity__meta-item:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.recent-activity__meta-icon {
  font-size: 16px;
  color: #94a3b8;
}

/* Activity Actions */
.recent-activity__actions {
  display: flex;
  gap: 8px;
  align-self: flex-start;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.recent-activity__item:hover .recent-activity__actions {
  opacity: 1;
}

.recent-activity__quick-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: white;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s ease;
}

.recent-activity__quick-action:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.recent-activity__quick-action--security:hover {
  color: #ef4444;
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

.recent-activity__quick-action--view:hover {
  color: #4361ee;
  border-color: #4361ee;
  background: rgba(67, 97, 238, 0.1);
}

.recent-activity__quick-action--dismiss:hover {
  color: #64748b;
  border-color: #94a3b8;
  background: #f1f5f9;
}

/* Footer */
.recent-activity__footer {
  padding-top: 20px;
  border-top: 2px solid rgba(226, 232, 240, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.recent-activity__stats {
  display: flex;
  gap: 32px;
}

.recent-activity__stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.recent-activity__stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  font-feature-settings: 'tnum' on, 'lnum' on;
}

.recent-activity__stat-value--warning {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.recent-activity__stat-value--danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.recent-activity__stat-label {
  font-size: 12px;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
}

.recent-activity__export-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #4361ee, #3a56d4);
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(67, 97, 238, 0.3);
}

.recent-activity__export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(67, 97, 238, 0.4);
}

.recent-activity__export-btn:active {
  transform: translateY(0);
}

.recent-activity__export-btn .material-symbols-outlined {
  font-size: 20px;
}

/* Animations */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.recent-activity__item {
  animation: fadeIn 0.4s ease-out;
}

.spin-animation {
  animation: spin 1s linear infinite;
}

/* Scrollbar Styling */
.recent-activity__timeline::-webkit-scrollbar {
  width: 8px;
}

.recent-activity__timeline::-webkit-scrollbar-track {
  background: rgba(226, 232, 240, 0.3);
  border-radius: 4px;
}

.recent-activity__timeline::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #cbd5e1, #94a3b8);
  border-radius: 4px;
}

.recent-activity__timeline::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #94a3b8, #64748b);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .recent-activity__header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .recent-activity__header-right {
    justify-content: space-between;
  }

  .recent-activity__item {
    flex-direction: column;
    gap: 16px;
  }

  .recent-activity__actions {
    align-self: flex-end;
    opacity: 1;
  }

  .recent-activity__footer {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
  }

  .recent-activity__stats {
    justify-content: space-around;
  }
}

@media (max-width: 768px) {
  .recent-activity {
    padding: 20px;
  }

  .recent-activity__header {
    margin-bottom: 20px;
  }

  .recent-activity__title {
    font-size: 20px;
  }

  .recent-activity__filter-select {
    min-width: 140px;
  }

  .recent-activity__timeline::before {
    left: 28px;
  }

  .recent-activity__icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 12px;
  }
}

@media (max-width: 480px) {
  .recent-activity {
    padding: 16px;
  }

  .recent-activity__timeline::before {
    display: none;
  }

  .recent-activity__icon-wrapper {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .recent-activity__icon {
    font-size: 20px;
  }

  .recent-activity__user-avatar {
    width: 36px;
    height: 36px;
    border-radius: 10px;
  }

  .recent-activity__stat-value {
    font-size: 24px;
  }
}

/* Dark Mode Support */
@media (prefers-color-scheme: dark) {
  .recent-activity {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .recent-activity__title {
    color: #f1f5f9;
  }

  .recent-activity__subtitle {
    color: #94a3b8;
  }

  .recent-activity__action-btn {
    background: #334155;
    border-color: #475569;
    color: #cbd5e1;
  }

  .recent-activity__item {
    background: #1e293b;
    border-color: rgba(51, 65, 85, 0.8);
  }

  .recent-activity__user-name {
    color: #f1f5f9;
  }

  .recent-activity__user-role {
    background: #334155;
    color: #94a3b8;
  }

  .recent-activity__message {
    color: #cbd5e1;
  }

  .recent-activity__description {
    color: #94a3b8;
  }

  .recent-activity__details {
    background: linear-gradient(135deg, #0f172a, #1e293b);
    border-color: rgba(51, 65, 85, 0.8);
  }

  .recent-activity__meta-item {
    background: #0f172a;
    color: #94a3b8;
  }

  .recent-activity__timeline::-webkit-scrollbar-track {
    background: rgba(30, 41, 59, 0.5);
  }

  .recent-activity__timeline::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #475569, #334155);
  }
}
</style>