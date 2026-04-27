<template>
  <div class="user-wrapper">
    <!-- Main Layout Grid -->
    <div class="user-layout-grid">
      <!-- User Management Main Card -->
      <div class="user-main-card">
        <div class="user-card-header">
          <div class="user-header-left">
            <h2 class="user-card-title">User Management</h2>
          </div>
          <div class="user-header-right">
            <div class="user-search-wrapper">
              <span class="user-search-icon material-symbols-outlined">search</span>
              <input v-model="searchQuery" class="user-search-input" placeholder="Search users">
            </div>
            <button @click="showFilters = !showFilters" class="user-filter-btn" title="Filter">
              <span class="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        <div class="user-table-container">
          <table class="user-data-table">
            <thead>
              <tr class="user-table-header-row">
                <th class="user-col-user">User</th>
                <th class="user-col-role">Role</th>
                <th class="user-col-status">Status</th>
                <th class="user-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading" class="user-loading-row">
                <td colspan="4">
                  <div class="user-loading-state">
                    <div class="user-loading-spinner"></div>
                    <span>Loading users...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="paginatedUsers.length === 0" class="user-empty-row">
                <td colspan="4">
                  <div class="user-empty-state">
                    <span class="material-symbols-outlined">person_off</span>
                    <span>No users found</span>
                  </div>
                </td>
              </tr>
              <tr v-for="user in paginatedUsers" :key="user.id" class="user-data-row">
                <td class="user-col-user">
                  <div class="user-info-wrapper">
                    <div :class="['user-avatar-style', user.avatarColorClass]">
                      <span class="user-avatar-initials">{{ user.initials }}</span>
                    </div>
                    <div class="user-details-wrapper">
                      <span class="user-name-text">{{ user.name }}</span>
                      <span class="user-email-text">{{ user.email }}</span>
                    </div>
                  </div>
                </td>
                <td class="user-col-role">
                  <span :class="['user-role-badge', 'role-' + user.role.replace('_', '-')]">
                    {{ formatRole(user.role) }}
                  </span>
                </td>
                <td class="user-col-status">
                  <span :class="['user-status-badge', 'status-' + user.status]">
                    {{ formatStatus(user.status) }}
                  </span>
                </td>
                <td class="user-col-actions">
                  <div class="user-action-buttons">
                    <button v-if="user.status === 'pending'" @click="resendInvite(user)" class="user-action-btn user-resend-btn" title="Resend Invite">
                      <span class="material-symbols-outlined">send</span>
                    </button>
                    <button @click="editUser(user)" class="user-action-btn user-edit-btn" title="Edit">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button v-if="user.status === 'suspended'" @click="activateUser(user)" class="user-action-btn user-activate-btn" title="Activate">
                      <span class="material-symbols-outlined">check_circle</span>
                    </button>
                    <button v-else @click="suspendUser(user)" class="user-action-btn user-suspend-btn" title="Suspend">
                      <span class="material-symbols-outlined">lock</span>
                    </button>
                    <button @click="removeUser(user)" class="user-action-btn user-delete-btn" title="Remove">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="user-card-footer">
          <span class="user-footer-text">Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users</span>
          <div class="user-pagination">
            <button class="user-pagination-btn" @click="prevPage" :disabled="currentPage === 1">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="user-page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="user-pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column Sidebar -->
      <div class="user-sidebar">
        <!-- Quick Stats -->
        <div class="user-stats-card">
          <h3 class="user-stats-title">System Overview</h3>
          <div class="user-stats-grid">
            <div class="user-stat-item">
              <div class="user-stat-content">
                <div class="user-stat-icon user-primary-icon">
                  <span class="material-symbols-outlined">group</span>
                </div>
                <div class="user-stat-text">
                  <p class="user-stat-label">Total Users</p>
                  <p class="user-stat-value">{{ totalUsers }}</p>
                </div>
              </div>
              <span class="user-stat-change positive">+{{ newUsersThisMonth }}</span>
            </div>
            <div class="user-stat-item">
              <div class="user-stat-content">
                <div class="user-stat-icon user-secondary-icon">
                  <span class="material-symbols-outlined">badge</span>
                </div>
                <div class="user-stat-text">
                  <p class="user-stat-label">Active Roles</p>
                  <p class="user-stat-value">{{ totalRoles }}</p>
                </div>
              </div>
            </div>
            <div class="user-stat-item">
              <div class="user-stat-content">
                <div class="user-stat-icon user-warning-icon">
                  <span class="material-symbols-outlined">hourglass_top</span>
                </div>
                <div class="user-stat-text">
                  <p class="user-stat-label">Pending Invites</p>
                  <p class="user-stat-value">{{ pendingInvites }}</p>
                </div>
              </div>
              <button @click="openNewUserModal" class="user-stat-action">Action</button>
            </div>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="user-activity-card">
          <div class="user-activity-header">
            <h3 class="user-activity-title">Recent Activity</h3>
            <button @click="viewAllActivity" class="user-view-all-btn">View All</button>
          </div>
          <div class="user-activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="user-activity-item">
              <div :class="['user-activity-icon', getActivityIconClass(activity.action)]">
                <span class="material-symbols-outlined">{{ getActivityIcon(activity.action) }}</span>
              </div>
              <div class="user-activity-content">
                <p class="user-activity-text">{{ activity.details }}</p>
                <p class="user-activity-time">{{ formatRelativeTime(activity.timestamp) }}</p>
              </div>
            </div>
            <div v-if="recentActivities.length === 0" class="user-activity-empty">
              <span class="material-symbols-outlined">inbox</span>
              <p>No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useToast } from 'vue-toastification';

export default {
  name: 'UserManagement',
  setup() {
    const toast = useToast();
    const isLoading = ref(true);
    const users = ref([]);
    const roles = ref([]);
    const searchQuery = ref('');
    const showFilters = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = 5;
    const recentActivities = ref([]);

    // Load users from localStorage
    const loadUsers = () => {
      isLoading.value = true;
      try {
        const storedUsers = localStorage.getItem('access_users');
        if (storedUsers) {
          users.value = JSON.parse(storedUsers);
        } else {
          initializeDefaultUsers();
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        isLoading.value = false;
      }
    };

    // Load roles from localStorage
    const loadRoles = () => {
      try {
        const storedRoles = localStorage.getItem('access_roles');
        if (storedRoles) {
          roles.value = JSON.parse(storedRoles);
        }
      } catch (error) {
        console.error('Error loading roles:', error);
      }
    };

    // Load activities
    const loadActivities = () => {
      try {
        const storedAudit = localStorage.getItem('access_audit');
        if (storedAudit) {
          const audit = JSON.parse(storedAudit);
          recentActivities.value = audit.slice(0, 5);
        }
      } catch (error) {
        console.error('Error loading activities:', error);
      }
    };

    // Initialize default users (only Super Admin)
    const initializeDefaultUsers = () => {
      const defaultUsers = [
        {
          id: 1,
          initials: 'SA',
          name: 'Super Admin',
          email: 'super.admin@company.com',
          role: 'super_admin',
          status: 'active',
          department: 'IT',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          avatarColorClass: 'avatar-purple'
        }
      ];
      users.value = defaultUsers;
      localStorage.setItem('access_users', JSON.stringify(defaultUsers));
    };

    // Save users to localStorage
    const saveUsers = () => {
      localStorage.setItem('access_users', JSON.stringify(users.value));
    };

    // Log audit event
    const logAuditEvent = (action, user, details) => {
      const auditLog = JSON.parse(localStorage.getItem('access_audit') || '[]');
      const newEvent = {
        id: Date.now(),
        action,
        user: user || 'System',
        details,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
      };
      auditLog.unshift(newEvent);
      localStorage.setItem('access_audit', JSON.stringify(auditLog.slice(0, 1000)));
      loadActivities();
    };

    // Computed Properties
    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value;
      const query = searchQuery.value.toLowerCase();
      return users.value.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.status.toLowerCase().includes(query)
      );
    });

    const totalPages = computed(() => Math.ceil(filteredUsers.value.length / itemsPerPage) || 1);
    
    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      return filteredUsers.value.slice(start, start + itemsPerPage);
    });

    const totalUsers = computed(() => users.value.length);
    const totalRoles = computed(() => roles.value.length);
    const pendingInvites = computed(() => users.value.filter(u => u.status === 'pending').length);
    const newUsersThisMonth = computed(() => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      return users.value.filter(u => new Date(u.createdAt) > oneMonthAgo).length;
    });

    // Helper functions
    const formatRole = (role) => {
      return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const formatRelativeTime = (timestamp) => {
      if (!timestamp) return 'Unknown';
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString();
    };

    const getActivityIcon = (action) => {
      const icons = {
        'User Created': 'person_add',
        'User Updated': 'edit',
        'User Deleted': 'delete',
        'User Activated': 'check_circle',
        'User Suspended': 'block',
        'Invitation Sent': 'send'
      };
      return icons[action] || 'info';
    };

    const getActivityIconClass = (action) => {
      if (action.includes('Created')) return 'success-icon';
      if (action.includes('Updated')) return 'info-icon';
      if (action.includes('Deleted') || action.includes('Suspended')) return 'danger-icon';
      if (action.includes('Activated')) return 'success-icon';
      if (action.includes('Sent')) return 'primary-icon';
      return 'info-icon';
    };

    // Methods
    const openNewUserModal = () => {
      window.dispatchEvent(new CustomEvent('open-new-user-modal'));
    };

    const editUser = (user) => {
      window.dispatchEvent(new CustomEvent('edit-user', {
        detail: {
          id: user.id,
          firstName: user.name.split(' ')[0],
          lastName: user.name.split(' ').slice(1).join(' ') || '',
          email: user.email,
          role: user.role,
          status: user.status
        }
      }));
    };

    const resendInvite = async (user) => {
      const confirmed = await window.globalModal?.confirm(
        `Resend invitation to <strong>${user.email}</strong>?`,
        'Resend Invitation',
        { confirmText: 'Resend', cancelText: 'Cancel', icon: 'email' }
      );
      if (!confirmed) return;
      
      logAuditEvent('Invitation Sent', user.name, `Invitation resent to ${user.email}`);
      toast.success(`Invitation resent to ${user.email}`);
    };

    const activateUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(
        `Activate ${user.name}?`,
        'Activate User',
        { confirmText: 'Activate', cancelText: 'Cancel', icon: 'check_circle' }
      );
      if (!confirmed) return;
      
      user.status = 'active';
      saveUsers();
      logAuditEvent('User Activated', user.name, `User ${user.name} was activated`);
      toast.success(`${user.name} has been activated`);
    };

    const suspendUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(
        `Suspend ${user.name}?`,
        'Suspend User',
        { confirmText: 'Suspend', cancelText: 'Cancel', icon: 'block' }
      );
      if (!confirmed) return;
      
      user.status = 'suspended';
      saveUsers();
      logAuditEvent('User Suspended', user.name, `User ${user.name} was suspended`);
      toast.success(`${user.name} has been suspended`);
    };

    const removeUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(
        `Remove <strong>${user.name}</strong> from the system?`,
        'Remove User',
        { confirmText: 'Remove', cancelText: 'Cancel', icon: 'delete' }
      );
      if (!confirmed) return;

      users.value = users.value.filter(u => u.id !== user.id);
      saveUsers();
      logAuditEvent('User Deleted', user.name, `User ${user.name} was removed`);
      toast.success(`${user.name} has been removed`);
      
      if (paginatedUsers.value.length === 0 && currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
    const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };
    const viewAllActivity = () => { toast.info('View all activity feature coming soon'); };

    // Handle user saved event
    const handleUserSaved = (event) => {
      const userData = event.detail;
      console.log('User saved event received:', userData);

      if (userData.id && users.value.some(u => u.id === userData.id)) {
        const index = users.value.findIndex(u => u.id === userData.id);
        if (index !== -1) {
          users.value[index] = {
            ...users.value[index],
            name: userData.name,
            email: userData.email,
            role: userData.role,
            status: userData.status || users.value[index].status,
            initials: (userData.firstName?.charAt(0) || '') + (userData.lastName?.charAt(0) || ''),
            updatedAt: new Date().toISOString()
          };
          saveUsers();
          logAuditEvent('User Updated', userData.name, `User ${userData.name} was updated`);
          toast.success(`User "${userData.name}" updated!`);
        }
      } else {
        const newId = Math.max(...users.value.map(u => u.id), 0) + 1;
        const newUser = {
          id: newId,
          initials: (userData.firstName?.charAt(0) || '') + (userData.lastName?.charAt(0) || ''),
          name: userData.name,
          email: userData.email,
          role: userData.role,
          status: 'pending',
          department: userData.department || '—',
          lastLogin: null,
          createdAt: new Date().toISOString(),
          avatarColorClass: getRandomAvatarColor()
        };
        users.value.push(newUser);
        saveUsers();
        logAuditEvent('User Created', userData.name, `New user ${userData.name} was created`);
        toast.success(`User "${userData.name}" created!`);
      }
    };

    const getRandomAvatarColor = () => {
      const colors = ['avatar-blue', 'avatar-green', 'avatar-amber', 'avatar-purple', 'avatar-pink', 'avatar-indigo'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Refresh data
    const refreshData = () => {
      loadUsers();
      loadRoles();
      loadActivities();
    };

    watch(searchQuery, () => { currentPage.value = 1; });

    onMounted(() => {
      loadUsers();
      loadRoles();
      loadActivities();
      window.addEventListener('user-saved', handleUserSaved);
      window.addEventListener('role-saved', refreshData);
      window.addEventListener('refresh-access-data', refreshData);
    });

    onUnmounted(() => {
      window.removeEventListener('user-saved', handleUserSaved);
      window.removeEventListener('role-saved', refreshData);
      window.removeEventListener('refresh-access-data', refreshData);
    });

    return {
      isLoading,
      searchQuery,
      showFilters,
      currentPage,
      filteredUsers,
      paginatedUsers,
      totalPages,
      totalUsers,
      totalRoles,
      pendingInvites,
      newUsersThisMonth,
      recentActivities,
      formatRole,
      formatStatus,
      formatRelativeTime,
      getActivityIcon,
      getActivityIconClass,
      openNewUserModal,
      editUser,
      resendInvite,
      activateUser,
      suspendUser,
      removeUser,
      prevPage,
      nextPage,
      viewAllActivity
    };
  }
}
</script>

<style scoped>
.user-wrapper {
  min-height: 100vh;
}

.dark .user-wrapper {
  background: #0f172a;
}

/* Layout Grid */
.user-layout-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1200px) {
  .user-layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Main Card */
.user-main-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.dark .user-main-card {
  background: #1e293b;
  border-color: #334155;
}

/* Card Header */
.user-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
  background: white;
}

.dark .user-card-header {
  border-bottom-color: #334155;
  background: #1e293b;
}

.user-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .user-card-title {
  color: #f1f5f9;
}

/* Header Right */
.user-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Search Wrapper */
.user-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.user-search-icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: #94a3b8;
}

.user-search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  width: 240px;
  background: white;
  color: #1e293b;
  transition: all 0.2s;
}

.dark .user-search-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.user-search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.user-filter-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .user-filter-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.user-filter-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* Table Container */
.user-table-container {
  overflow-x: auto;
  width: 100%;
  flex: 0 1 auto;
}

/* Data Table */
.user-data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  margin-bottom: 0;
}

/* Column Widths */
.user-col-user { width: 35%; }
.user-col-role { width: 20%; }
.user-col-status { width: 20%; }
.user-col-actions { width: 25%; }

/* Table Header */
.user-table-header-row {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dark .user-table-header-row {
  background: #0f172a;
  border-bottom-color: #334155;
}

.user-table-header-row th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.dark .user-table-header-row th {
  color: #94a3b8;
}

/* Data Rows */
.user-data-row {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.dark .user-data-row {
  border-bottom-color: #334155;
}

.user-data-row:hover {
  background: rgba(99, 102, 241, 0.04);
}

.user-data-row td {
  padding: 1rem 1.25rem;
  vertical-align: middle;
}

/* User Info Wrapper */
.user-info-wrapper {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar-style {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  color: white;
  flex-shrink: 0;
}

.user-avatar-style.avatar-blue { background: #3b82f6; }
.user-avatar-style.avatar-green { background: #10b981; }
.user-avatar-style.avatar-amber { background: #f59e0b; }
.user-avatar-style.avatar-purple { background: #8b5cf6; }
.user-avatar-style.avatar-pink { background: #ec4899; }
.user-avatar-style.avatar-indigo { background: #6366f1; }

.user-details-wrapper {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.user-name-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
}

.dark .user-name-text {
  color: #f1f5f9;
}

.user-email-text {
  font-size: 0.75rem;
  color: #64748b;
}

.dark .user-email-text {
  color: #94a3b8;
}

/* Role Badge */
.user-role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.role-super-admin { background: #f3e8ff; color: #9333ea; }
.role-system-admin { background: #fee2e2; color: #dc2626; }
.role-project-manager { background: #dbeafe; color: #2563eb; }
.role-contributor { background: #d1fae5; color: #059669; }

.dark .role-super-admin { background: #3b0764; color: #d8b4fe; }
.dark .role-system-admin { background: #7f1d1d; color: #fca5a5; }
.dark .role-project-manager { background: #1e3a8a; color: #93c5fd; }
.dark .role-contributor { background: #064e3b; color: #6ee7b7; }

/* Status Badge */
.user-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-active { background: #d1fae5; color: #059669; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-suspended { background: #fee2e2; color: #dc2626; }

.dark .status-active { background: #064e3b; color: #6ee7b7; }
.dark .status-pending { background: #78350f; color: #fcd34d; }
.dark .status-suspended { background: #7f1d1d; color: #fca5a5; }

/* Action Buttons */
.user-action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
}

.user-action-btn .material-symbols-outlined {
  font-size: 18px;
}

.user-action-btn:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.dark .user-action-btn:hover {
  background: #334155;
}

.user-edit-btn:hover { color: #3b82f6; }
.user-delete-btn:hover { color: #ef4444; background: #fee2e2; }
.user-activate-btn:hover { color: #10b981; }
.user-suspend-btn:hover { color: #f59e0b; }
.user-resend-btn:hover { color: #6366f1; }

.dark .user-delete-btn:hover { background: #7f1d1d; }

/* Loading & Empty States */
.user-loading-row td,
.user-empty-row td {
  padding: 60px 20px !important;
}

.user-loading-state,
.user-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  text-align: center;
}

.user-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.dark .user-loading-spinner {
  border-color: #334155;
  border-top-color: #6366f1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.user-empty-state .material-symbols-outlined {
  font-size: 48px;
  opacity: 0.5;
}

/* Card Footer */
.user-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
}

.dark .user-card-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.user-footer-text {
  font-size: 0.75rem;
  color: #64748b;
}

.dark .user-footer-text {
  color: #94a3b8;
}

/* Pagination */
.user-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.user-pagination-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .user-pagination-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.user-pagination-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.user-pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.user-page-info {
  font-size: 0.75rem;
  color: #64748b;
}

.dark .user-page-info {
  color: #94a3b8;
}

/* Sidebar */
.user-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats Card */
.user-stats-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
}

.dark .user-stats-card {
  background: #1e293b;
  border-color: #334155;
}

.user-stats-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
}

.dark .user-stats-title {
  color: #f1f5f9;
}

.user-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 12px;
}

.dark .user-stat-item {
  background: #0f172a;
}

.user-stat-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-primary-icon {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.user-secondary-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.user-warning-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.user-stat-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  margin: 0;
}

.user-stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .user-stat-value {
  color: #f1f5f9;
}

.user-stat-change {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 12px;
}

.user-stat-change.positive {
  background: #d1fae5;
  color: #059669;
}

.user-stat-action {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  background: #e2e8f0;
  border: none;
  cursor: pointer;
}

.dark .user-stat-action {
  background: #334155;
  color: #f1f5f9;
}

/* Activity Card */
.user-activity-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
}

.dark .user-activity-card {
  background: #1e293b;
  border-color: #334155;
}

.user-activity-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.user-activity-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .user-activity-title {
  color: #f1f5f9;
}

.user-view-all-btn {
  font-size: 0.75rem;
  color: #6366f1;
  background: none;
  border: none;
  cursor: pointer;
}

.user-activity-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  transition: background 0.2s;
}

.user-activity-item:hover {
  background: #f8fafc;
}

.dark .user-activity-item:hover {
  background: #0f172a;
}

.user-activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-activity-icon.success-icon {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.user-activity-icon.info-icon {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.user-activity-icon.primary-icon {
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
}

.user-activity-icon.danger-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.user-activity-content {
  flex: 1;
}

.user-activity-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
}

.dark .user-activity-text {
  color: #f1f5f9;
}

.user-activity-time {
  font-size: 0.625rem;
  color: #64748b;
  margin: 0;
}

.user-activity-empty {
  text-align: center;
  padding: 20px;
  color: #64748b;
}

/* Responsive */
@media (max-width: 768px) {
  .user-wrapper {
    padding: 12px;
  }
  
  .user-card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .user-search-input {
    width: 100%;
  }
  
  .user-card-footer {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>