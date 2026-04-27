<template>
  <div class="user-management-table">
    <!-- User Management Card -->
    <div class="ac-card-section">
      <div class="card-header">
        <div class="header-left">
          <h2 class="card-title" style="font-size: 1.2rem;">User Management</h2>
        </div>
        <div class="header-right">
          <div class="search-container">
            <span class="material-symbols-outlined search-icon">search</span>
            <input v-model="searchQuery" class="search-input" placeholder="Search users">
          </div>
          <button @click="showFilters = !showFilters" class="filter-btn" title="Filter">
            <span class="material-symbols-outlined icon-xs">filter_list</span>
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="compact-table">
          <!-- HEADERS | DEFINE THE COLUMN STRUCTURE HERE-->
          <div class="table-header-row"
            style="display: grid;grid-template-columns: 2fr 1.5fr 1fr 2fr;padding: 0.785rem 1.5rem;">
            <div class="table-header-cell">User</div>
            <div class="table-header-cell" style="margin-left: 1rem;">Role</div>
            <div class="table-header-cell" style="margin-left: 1rem;">Status</div>
            <div class="table-header-cell" style="margin-left: 1rem;">Actions</div>
          </div>

          <!-- BODY ROWS -->
          <div class="table-body">
            <div v-for="user in paginatedUsers" :key="user.id" class="table-row-s">
              <div class="table-cell">
                <div class="user-info-combined">
                  <div :class="['user-avatar', user.avatarColorClass]">
                    <span class="avatar-initials">{{ user.initials }}</span>
                  </div>
                  <div class="user-details">
                    <p class="user-name">{{ user.name }}</p>
                    <p class="user-email">{{ user.email }}</p>
                  </div>
                </div>
              </div>

              <div class="table-cell">
                <span :class="['role-badge', 'role-' + user.role.replace('_', '-')]">
                  {{ formatRole(user.role) }}
                </span>
              </div>

              <div class="table-cell">
                <span :class="['status-badge', 'status-' + user.status]">
                  {{ formatStatus(user.status) }}
                </span>
              </div>

              <div class="table-cell text-right">
                <div class="action-buttons">
                  <button v-if="user.status === 'pending'" @click="resendInvite(user)" class="action-btn"
                    title="Resend Invite">
                    <span class="material-symbols-outlined icon-medium">send</span>
                  </button>
                  <button @click="editUser(user)" class="action-btn" title="Edit">
                    <span class="material-symbols-outlined icon-medium">edit</span>
                  </button>
                  <button v-if="user.status === 'suspended'" @click="activateUser(user)" class="action-btn"
                    title="Activate">
                    <span class="material-symbols-outlined icon-medium">check_circle</span>
                  </button>
                  <button v-else @click="suspendUser(user)" class="action-btn" title="Suspend">
                    <span class="material-symbols-outlined icon-medium">lock</span>
                  </button>
                  <button @click="removeUser(user)" class="action-btn" title="Remove">
                    <span class="material-symbols-outlined icon-medium">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card-footer">
        <div class="footer-content">
          <span class="footer-text">Showing {{ paginatedUsers.length }} of {{ filteredUsers.length }} users</span>
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
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';

export default {
  name: 'UserManagementTable',
  setup() {
    // Data
    const users = ref([
      {
        id: 1,
        initials: 'SR',
        name: 'Sarah Rogers',
        email: 'sarah.rogers@company.com',
        role: 'super_admin',
        status: 'active',
        avatarColorClass: 'avatar-blue'
      },
      {
        id: 2,
        initials: 'MT',
        name: 'Michael Thompson',
        email: 'm.thompson@company.com',
        role: 'system_admin',
        status: 'active',
        avatarColorClass: 'avatar-green'
      },
      {
        id: 3,
        initials: 'JD',
        name: 'Jennifer Davis',
        email: 'j.davis@company.com',
        role: 'project_manager',
        status: 'pending',
        avatarColorClass: 'avatar-amber'
      },
      {
        id: 4,
        initials: 'RK',
        name: 'Robert Kim',
        email: 'r.kim@company.com',
        role: 'contributor',
        status: 'suspended',
        avatarColorClass: 'avatar-blue'
      },
      {
        id: 5,
        initials: 'AL',
        name: 'Amanda Lee',
        email: 'a.lee@company.com',
        role: 'contributor',
        status: 'active',
        avatarColorClass: 'avatar-purple'
      }
    ]);

    const searchQuery = ref('');
    const showFilters = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = 5;

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

    const totalPages = computed(() => {
      return Math.ceil(filteredUsers.value.length / itemsPerPage);
    });

    const paginatedUsers = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return filteredUsers.value.slice(start, end);
    });

    // Methods
    const formatRole = (role) => {
      return role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const formatStatus = (status) => {
      return status.charAt(0).toUpperCase() + status.slice(1);
    };

    const resendInvite = async (user) => {
      const confirmed = await window.globalModal?.confirm(`Resend invitation to <strong>${user.email}</strong>?`, 'Resend Invitation', {
        confirmText: 'Resend',
        cancelText: 'Cancel',
        icon: 'email'
      });

      if (!confirmed) return;
    };

    const editUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(`Edit user info: <strong>${user.name}</strong>?`, 'Edit User', {
        confirmText: 'Edit',
        cancelText: 'Cancel',
        icon: 'edit'
      });

      if (!confirmed) return;
    };

    const activateUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(`Activate ${user.name}?`, 'Activate User', {
        confirmText: 'Activate',
        cancelText: 'Cancel',
        icon: 'check_circle'
      });

      if (!confirmed) return;
      user.status = 'active';
    };

    const removeUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(
        `Remove <strong>${user.name}</strong> from the system?`,
        'Remove User',
        {
          confirmText: 'Remove',
          cancelText: 'Cancel',
          icon: 'Delete'
        }
      );

      if (!confirmed) return;

      users.value = users.value.filter(u => u.id !== user.id);

      await window.globalModal?.success(
        `<strong>${user.name}</strong> has been removed from the system.`,
        'User Removed',
        {
          confirmText: 'OK',
          icon: 'check_circle'
        }
      );
    };

    const prevPage = () => {
      if (currentPage.value > 1) {
        currentPage.value--;
      }
    };

    const nextPage = () => {
      if (currentPage.value < totalPages.value) {
        currentPage.value++;
      }
    };

    const suspendUser = async (user) => {
      const confirmed = await window.globalModal?.confirm(`Suspend ${user.name}?`, 'Suspend User', {
        confirmText: 'Suspend',
        cancelText: 'Cancel',
        icon: 'block'
      });

      if (!confirmed) return;
      user.status = 'suspended';
    };

    return {
      users,
      searchQuery,
      showFilters,
      currentPage,
      filteredUsers,
      paginatedUsers,
      totalPages,
      formatRole,
      formatStatus,
      resendInvite,
      editUser,
      activateUser,
      removeUser,
      prevPage,
      nextPage,
      suspendUser
    };
  }
}
</script>

<style scoped>
.user-management-table {
  width: 100%;
}

@import '../../styles/accessControl/UserManagement.css';
@import '../../styles/shared/table.css';
@import '../../styles/shared/utilities.css';

/* EVEN MORE AGGRESSIVE - IF STILL NOT WORKING */
.ac-card-section>.card-header {
  border-bottom: none !important;
}

.table-header-row {
  border-top: 1px solid var(--border-light) !important;
}

.dark .table-header-row {
  border-top: 1px solid var(--border-dark) !important;
}
</style>