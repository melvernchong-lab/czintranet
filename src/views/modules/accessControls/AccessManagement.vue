<template>
  <div class="page-content">
    <!-- Header Section -->
    <div class="header-container">
      <div class="header-main">
        <div class="header-title-section">
          <div class="title-wrapper">
            <h1 class="page-title">Access Control</h1>
          </div>
          <p class="page-subtitle">
            Manage user permissions, roles, and system access
          </p>
        </div>
        <div class="header-actions">
          <button @click="openNewUserModal" class="quick-action primary-btn">
            <span class="material-symbols-outlined icon-medium">person_add</span>
            <span>Add User</span>
          </button>
          <button @click="openNewRoleModal" class="quick-action secondary-btn">
            <span class="material-symbols-outlined icon-medium">badge</span>
            <span>New Role</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="tabs-container">
      <div class="tabs-inner">
        <button @click="activeTab = 'users'" :class="['tab', activeTab === 'users' ? 'tab-active' : '']">
          <span class="material-symbols-outlined icon-medium">group</span>
          Users
        </button>
        <button @click="activeTab = 'roles'" :class="['tab', activeTab === 'roles' ? 'tab-active' : '']">
          <span class="material-symbols-outlined icon-medium">badge</span>
          Roles
        </button>
        <button @click="activeTab = 'audit'" :class="['tab', activeTab === 'audit' ? 'tab-active' : '']">
          <span class="material-symbols-outlined icon-medium">security</span>
          Audit Log
        </button>
      </div>
    </div>

    <component 
      :is="activeTabComponent" 
      :active-tab="activeTab"
      @refresh-data="refreshData"
    />
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import UserManagment from '../../../components/accessControl/UserManagement.vue';
import RoleManagement from '../../../components/accessControl/RoleManagement.vue';
// import AuditLog from './AuditLog.vue';

export default {
  name: "AccessManagement",
  components: {
    UserManagment,
    RoleManagement,
    // AuditLog
  },
  setup() {
    const toast = useToast();
    const activeTab = ref('users');

    // Initialize localStorage with default data
    const initializeLocalStorage = () => {
      // Initialize users
      const existingUsers = localStorage.getItem('access_users');
      if (!existingUsers) {
        const defaultUsers = [
          {
            id: 1,
            name: 'Sarah Rogers',
            email: 'sarah.rogers@company.com',
            role: 'super_admin',
            status: 'active',
            department: 'IT',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'SR',
            avatarColorClass: 'avatar-purple'
          },
          {
            id: 2,
            name: 'Michael Thompson',
            email: 'm.thompson@company.com',
            role: 'system_admin',
            status: 'active',
            department: 'Infrastructure',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'MT',
            avatarColorClass: 'avatar-blue'
          },
          {
            id: 3,
            name: 'Jennifer Davis',
            email: 'j.davis@company.com',
            role: 'project_manager',
            status: 'pending',
            department: 'Project Management',
            lastLogin: null,
            createdAt: new Date().toISOString(),
            initials: 'JD',
            avatarColorClass: 'avatar-amber'
          },
          {
            id: 4,
            name: 'Robert Kim',
            email: 'r.kim@company.com',
            role: 'contributor',
            status: 'suspended',
            department: 'Engineering',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'RK',
            avatarColorClass: 'avatar-blue'
          },
          {
            id: 5,
            name: 'Amanda Lee',
            email: 'a.lee@company.com',
            role: 'contributor',
            status: 'active',
            department: 'Design',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'AL',
            avatarColorClass: 'avatar-green'
          },
          {
            id: 6,
            name: 'Chris Smith',
            email: 'c.smith@company.com',
            role: 'project_manager',
            status: 'active',
            department: 'Project Management',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'CS',
            avatarColorClass: 'avatar-green'
          },
          {
            id: 7,
            name: 'Emma Martinez',
            email: 'e.martinez@company.com',
            role: 'contributor',
            status: 'active',
            department: 'Engineering',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'EM',
            avatarColorClass: 'avatar-pink'
          },
          {
            id: 8,
            name: 'David Johnson',
            email: 'd.johnson@company.com',
            role: 'system_admin',
            status: 'active',
            department: 'IT',
            lastLogin: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            initials: 'DJ',
            avatarColorClass: 'avatar-indigo'
          }
        ];
        localStorage.setItem('access_users', JSON.stringify(defaultUsers));
      }

      // Initialize roles
      const existingRoles = localStorage.getItem('access_roles');
      if (!existingRoles) {
        const defaultRoles = [
          {
            id: 1,
            name: 'Super Admin',
            description: 'Full system access with all permissions',
            permissions: 12,
            users: 1,
            color: '#8b5cf6',
            icon: 'security',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            name: 'System Admin',
            description: 'System configuration and management',
            permissions: 8,
            users: 2,
            color: '#ef4444',
            icon: 'admin_panel_settings',
            createdAt: new Date().toISOString()
          },
          {
            id: 3,
            name: 'Project Manager',
            description: 'Project management and team coordination',
            permissions: 10,
            users: 2,
            color: '#3b82f6',
            icon: 'folder_managed',
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            name: 'Contributor',
            description: 'Create and edit content, limited access',
            permissions: 6,
            users: 3,
            color: '#10b981',
            icon: 'edit_note',
            createdAt: new Date().toISOString()
          },
          {
            id: 5,
            name: 'Viewer',
            description: 'Read-only access to view content',
            permissions: 4,
            users: 0,
            color: '#f59e0b',
            icon: 'visibility',
            createdAt: new Date().toISOString()
          },
          {
            id: 6,
            name: 'Auditor',
            description: 'Audit and reporting access',
            permissions: 5,
            users: 0,
            color: '#ec4899',
            icon: 'fact_check',
            createdAt: new Date().toISOString()
          },
          {
            id: 7,
            name: 'Developer',
            description: 'Development system access',
            permissions: 7,
            users: 0,
            color: '#0ea5e9',
            icon: 'code',
            createdAt: new Date().toISOString()
          },
          {
            id: 8,
            name: 'Support Agent',
            description: 'Customer support access',
            permissions: 5,
            users: 0,
            color: '#84cc16',
            icon: 'support_agent',
            createdAt: new Date().toISOString()
          }
        ];
        localStorage.setItem('access_roles', JSON.stringify(defaultRoles));
      }

      // Initialize audit log
      const existingAudit = localStorage.getItem('access_audit');
      if (!existingAudit) {
        const defaultAudit = [
          {
            id: 1,
            action: 'System Initialized',
            user: 'System',
            details: 'Access control system initialized with default data',
            timestamp: new Date().toISOString(),
            ip: '127.0.0.1'
          }
        ];
        localStorage.setItem('access_audit', JSON.stringify(defaultAudit));
      }
    };

    // Log audit events
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
      // Keep only last 1000 entries
      const trimmedLog = auditLog.slice(0, 1000);
      localStorage.setItem('access_audit', JSON.stringify(trimmedLog));
      
      // Also log to console for debugging
      console.log(`[AUDIT] ${action} - ${details}`);
    };

    const openNewUserModal = () => {
      console.log('Open new user modal from AccessManagement');
      window.dispatchEvent(new CustomEvent('open-new-user-modal'));
    };

    const openNewRoleModal = () => {
      console.log('Open new role modal from AccessManagement');
      window.dispatchEvent(new CustomEvent('open-new-role-modal'));
    };

    const refreshData = () => {
      // Force refresh of child components
      window.dispatchEvent(new CustomEvent('refresh-access-data'));
    };

    const activeTabComponent = computed(() => {
      const components = {
        'users': 'UserManagment',
        'roles': 'RoleManagement',
        'audit': 'UserManagment'  // Change to 'AuditLog' when created
      };
      return components[activeTab.value] || 'UserManagment';
    });

    onMounted(() => {
      initializeLocalStorage();
      
      // Listen for data refresh events
      window.addEventListener('refresh-access-data', () => {
        // Child components will handle their own refresh
      });
    });

    return {
      activeTab,
      openNewUserModal,
      openNewRoleModal,
      activeTabComponent,
      refreshData
    };
  }
};
</script>

<style scoped>
@import '../../../styles/shared/tabs.css';
@import '../../../styles/shared/pages.css';
</style>