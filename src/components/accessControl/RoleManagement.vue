<template>
  <div class="role-wrapper">
    <!-- Main Layout Grid -->
    <div class="role-layout-grid">
      <!-- Role Management Main Card -->
      <div class="role-main-card">
        <div class="role-card-header">
          <div class="role-header-left">
            <h2 class="role-card-title">Role Management</h2>
          </div>
          <div class="role-header-right">
            <div class="role-search-wrapper">
              <span class="role-search-icon material-symbols-outlined">search</span>
              <input v-model="roleSearchQuery" class="role-search-input" placeholder="Search roles">
            </div>
            <button @click="showRoleFilters = !showRoleFilters" class="role-filter-btn" title="Filter">
              <span class="material-symbols-outlined">filter_list</span>
            </button>
          </div>
        </div>

        <div class="role-table-container">
          <table class="role-data-table">
            <thead>
              <tr class="role-table-header-row">
                <th class="role-col-role">Role</th>
                <th class="role-col-description">Description</th>
                <th class="role-col-permissions">Permissions</th>
                <th class="role-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="isLoading" class="role-loading-row">
                <td colspan="4">
                  <div class="role-loading-state">
                    <div class="role-loading-spinner"></div>
                    <span>Loading roles...</span>
                  </div>
                </td>
              </tr>
              <tr v-else-if="paginatedRoles.length === 0" class="role-empty-row">
                <td colspan="4">
                  <div class="role-empty-state">
                    <span class="material-symbols-outlined">badge</span>
                    <span>No roles found</span>
                  </div>
                </td>
              </tr>
              <tr v-for="role in paginatedRoles" :key="role.id" class="role-data-row">
                <td class="role-col-role">
                  <span class="role-badge-style" :style="getRoleBadgeStyle(role)">
                    {{ role.name }}
                  </span>
                </td>
                <td class="role-col-description">
                  <span class="role-description-text">{{ role.description }}</span>
                </td>
                <td class="role-col-permissions">
                  <span class="role-permission-count">{{ role.permissions }} permissions</span>
                </td>
                <td class="role-col-actions">
                  <div class="role-action-buttons">
                    <button @click="editRole(role)" class="role-action-btn role-edit-btn" title="Edit Role">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button @click="cloneRole(role)" class="role-action-btn role-clone-btn" title="Clone Role">
                      <span class="material-symbols-outlined">content_copy</span>
                    </button>
                    <button @click="deleteRole(role)" class="role-action-btn role-delete-btn" 
                      :disabled="isProtectedRole(role)"
                      :title="getDeleteButtonTitle(role)">
                      <span class="material-symbols-outlined">
                        {{ isProtectedRole(role) ? 'do_not_disturb_on' : 'delete' }}
                      </span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="role-card-footer">
          <span class="role-footer-text">Showing {{ paginatedRoles.length }} of {{ filteredRoles.length }} roles</span>
          <div class="role-pagination">
            <button class="role-pagination-btn" @click="prevPage" :disabled="currentPage === 1">
              <span class="material-symbols-outlined">chevron_left</span>
            </button>
            <span class="role-page-info">Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="role-pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Right Column Sidebar -->
      <div class="role-sidebar">
        <div class="role-quick-actions">
          <h3 class="role-actions-title">Quick Actions</h3>
          <div class="role-actions-grid">
            <button @click="openNewRoleModal" class="role-action-item">
              <span class="material-symbols-outlined role-action-icon">add_circle</span>
              <span class="role-action-text">Create Role</span>
            </button>
            <button @click="exportRoles" class="role-action-item">
              <span class="material-symbols-outlined role-action-icon">download</span>
              <span class="role-action-text">Export Roles</span>
            </button>
          </div>
        </div>

        <div class="role-insights">
          <h3 class="role-insights-title">Usage Insights</h3>
          <div class="role-insights-list">
            <div class="role-insight-item">
              <div class="role-insight-icon">
                <span class="material-symbols-outlined">group</span>
              </div>
              <div class="role-insight-content">
                <p class="role-insight-text">Most Used Role</p>
                <p class="role-insight-value">{{ mostUsedRole.name }} ({{ mostUsedRole.users }} users)</p>
              </div>
            </div>
            <div class="role-insight-item">
              <div class="role-insight-icon">
                <span class="material-symbols-outlined">security</span>
              </div>
              <div class="role-insight-content">
                <p class="role-insight-text">Most Permissions</p>
                <p class="role-insight-value">{{ maxPermissionsRole.name }} ({{ maxPermissionsRole.permissions }} perms)</p>
              </div>
            </div>
            <div class="role-insight-item">
              <div class="role-insight-icon role-warning-icon">
                <span class="material-symbols-outlined">warning</span>
              </div>
              <div class="role-insight-content">
                <p class="role-insight-text">Unassigned Roles</p>
                <p class="role-insight-value">{{ unassignedRolesCount }}</p>
              </div>
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
  name: 'RoleManagement',
  setup() {
    const toast = useToast();
    const isLoading = ref(true);
    const roles = ref([]);
    const users = ref([]);
    const roleSearchQuery = ref('');
    const showRoleFilters = ref(false);
    const currentPage = ref(1);
    const itemsPerPage = 5;
    
    // Add a flag to prevent duplicate processing
    let isProcessingRoleSave = false;

    const loadRoles = () => {
      isLoading.value = true;
      try {
        const storedRoles = localStorage.getItem('access_roles');
        if (storedRoles) {
          roles.value = JSON.parse(storedRoles);
        } else {
          initializeDefaultRoles();
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        toast.error('Failed to load roles');
      } finally {
        isLoading.value = false;
      }
    };

    const loadUsers = () => {
      try {
        const storedUsers = localStorage.getItem('access_users');
        if (storedUsers) {
          users.value = JSON.parse(storedUsers);
          updateRoleUserCounts();
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    const updateRoleUserCounts = () => {
      roles.value.forEach(role => {
        const roleName = role.name.toLowerCase().replace(/ /g, '_');
        const userCount = users.value.filter(user => user.role === roleName).length;
        role.users = userCount;
      });
      saveRoles();
    };

    const initializeDefaultRoles = () => {
      const defaultRoles = [
        {
          id: 1,
          name: 'Super Admin',
          description: 'Full system access with all permissions',
          permissions: 12,
          users: 1,
          icon: 'security',
          color: '#8b5cf6',
          isProtected: true,
          createdAt: new Date().toISOString()
        }
      ];
      roles.value = defaultRoles;
      localStorage.setItem('access_roles', JSON.stringify(defaultRoles));
    };

    const saveRoles = () => {
      localStorage.setItem('access_roles', JSON.stringify(roles.value));
    };

    const logAuditEvent = (action, details) => {
      const auditLog = JSON.parse(localStorage.getItem('access_audit') || '[]');
      const newEvent = {
        id: Date.now(),
        action,
        user: 'System',
        details,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1'
      };
      auditLog.unshift(newEvent);
      localStorage.setItem('access_audit', JSON.stringify(auditLog.slice(0, 1000)));
    };

    const filteredRoles = computed(() => {
      if (!roleSearchQuery.value) return roles.value;
      const query = roleSearchQuery.value.toLowerCase();
      return roles.value.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query) ||
        role.permissions.toString().includes(query)
      );
    });

    const totalPages = computed(() => Math.ceil(filteredRoles.value.length / itemsPerPage) || 1);
    
    const paginatedRoles = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      return filteredRoles.value.slice(start, start + itemsPerPage);
    });

    const maxPermissionsRole = computed(() => {
      if (roles.value.length === 0) return { permissions: 0, name: 'None' };
      return roles.value.reduce((max, role) => role.permissions > max.permissions ? role : max);
    });

    const mostUsedRole = computed(() => {
      if (roles.value.length === 0) return { users: 0, name: 'None' };
      return roles.value.reduce((max, role) => role.users > max.users ? role : max);
    });

    const unassignedRolesCount = computed(() => roles.value.filter(role => role.users === 0).length);

    const hexToRgba = (hex, alpha = 1) => {
      if (!hex) return `rgba(59, 130, 246, ${alpha})`;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return `rgba(59, 130, 246, ${alpha})`;
      return `rgba(${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}, ${alpha})`;
    };

    const getRoleBadgeStyle = (role) => {
      const color = role.color || '#3b82f6';
      return {
        backgroundColor: hexToRgba(color, 0.1),
        color: color,
        borderColor: hexToRgba(color, 0.3)
      };
    };

    const isProtectedRole = (role) => role.name === 'Super Admin';

    const getDeleteButtonTitle = (role) => {
      if (isProtectedRole(role)) return 'Protected role cannot be deleted';
      if (role.users > 0) return `Delete role (assigned to ${role.users} users)`;
      return 'Delete role';
    };

    const openNewRoleModal = () => {
      window.dispatchEvent(new CustomEvent('open-new-role-modal', { detail: null }));
    };

    const editRole = (role) => {
      window.dispatchEvent(new CustomEvent('open-new-role-modal', { detail: role }));
    };

    const deleteRole = async (role) => {
      if (isProtectedRole(role)) {
        await window.globalModal?.error(
          `Cannot delete <strong>${role.name}</strong><br>This is a protected system role.`,
          'Protected Role',
          { confirmText: 'OK', icon: 'shield' }
        );
        return;
      }

      const confirmed = await window.globalModal?.confirm(
        `Delete role <strong>"${role.name}"</strong>?`,
        'Delete Role',
        { confirmText: 'Delete', cancelText: 'Cancel', icon: 'delete' }
      );

      if (!confirmed) return;

      roles.value = roles.value.filter(r => r.id !== role.id);
      saveRoles();
      logAuditEvent('Role Deleted', `Role "${role.name}" was deleted`);
      toast.success(`Role "${role.name}" deleted`);

      if (paginatedRoles.value.length === 0 && currentPage.value > 1) currentPage.value--;
    };

    const cloneRole = async (role) => {
      const confirmed = await window.globalModal?.confirm(
        `Clone role <strong>${role.name}</strong>?`,
        'Clone Role',
        { confirmText: 'Copy', cancelText: 'Cancel', icon: 'content_copy' }
      );
      if (!confirmed) return;

      const newId = Math.max(...roles.value.map(r => r.id), 0) + 1;
      const newRole = {
        id: newId,
        name: `${role.name} (Copy)`,
        description: role.description,
        permissions: role.permissions,
        users: 0,
        icon: role.icon,
        color: role.color,
        isProtected: false,
        createdAt: new Date().toISOString()
      };
      roles.value.push(newRole);
      saveRoles();
      logAuditEvent('Role Cloned', `Role "${role.name}" cloned as "${newRole.name}"`);
      toast.success(`Role cloned successfully!`);
    };

    // FIXED: Prevent duplicate role creation
    const handleRoleSaved = (event) => {
      // Prevent duplicate processing
      if (isProcessingRoleSave) {
        console.log('Already processing role save, skipping...');
        return;
      }
      
      isProcessingRoleSave = true;
      
      try {
        const roleData = event.detail;
        console.log('Role saved event received:', roleData);
        
        if (!roleData) {
          console.error('No role data received');
          return;
        }
        
        const permissionsCount = Array.isArray(roleData.permissions) 
          ? roleData.permissions.length 
          : (roleData.permissions || 0);

        if (roleData.id && roles.value.some(r => r.id === roleData.id)) {
          // Update existing role
          const index = roles.value.findIndex(r => r.id === roleData.id);
          if (index !== -1) {
            // Check if role already has the same data to avoid unnecessary updates
            const existingRole = roles.value[index];
            if (existingRole.name === roleData.name && 
                existingRole.description === roleData.description &&
                existingRole.permissions === permissionsCount) {
              console.log('Role already up to date, skipping update');
              return;
            }
            
            roles.value[index] = { 
              ...existingRole, 
              ...roleData, 
              permissions: permissionsCount, 
              updatedAt: new Date().toISOString() 
            };
            saveRoles();
            logAuditEvent('Role Updated', `Role "${roleData.name}" was updated`);
            toast.success(`Role "${roleData.name}" updated!`);
          }
        } else {
          // Check if role with same name already exists
          const existingRole = roles.value.find(r => r.name.toLowerCase() === roleData.name.toLowerCase());
          if (existingRole) {
            toast.error(`Role "${roleData.name}" already exists!`);
            return;
          }
          
          // Create new role
          const newId = Math.max(...roles.value.map(r => r.id), 0) + 1;
          const newRole = {
            id: newId,
            name: roleData.name,
            description: roleData.description || '',
            color: roleData.color || '#3b82f6',
            icon: roleData.icon || 'security',
            permissions: permissionsCount,
            users: 0,
            isProtected: false,
            createdAt: new Date().toISOString()
          };
          roles.value.push(newRole);
          saveRoles();
          logAuditEvent('Role Created', `New role "${roleData.name}" created`);
          toast.success(`Role "${roleData.name}" created!`);
        }
      } catch (error) {
        console.error('Error handling role save:', error);
        toast.error('Failed to save role');
      } finally {
        // Reset flag after processing
        setTimeout(() => {
          isProcessingRoleSave = false;
        }, 500);
      }
    };

    const exportRoles = async () => {
      const confirmed = await window.globalModal?.confirm('Export all roles?', 'Export Roles', 
        { confirmText: 'Export', cancelText: 'Cancel', icon: 'download' });
      if (!confirmed) return;
      console.log('Roles exported:', roles.value);
      toast.success(`${roles.value.length} roles exported`);
    };

    const prevPage = () => { if (currentPage.value > 1) currentPage.value--; };
    const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++; };

    const refreshData = () => { loadRoles(); loadUsers(); };

    watch(roleSearchQuery, () => { currentPage.value = 1; });

    onMounted(() => {
      loadRoles();
      loadUsers();
      window.addEventListener('role-saved', handleRoleSaved);
      window.addEventListener('user-saved', refreshData);
    });

    onUnmounted(() => {
      window.removeEventListener('role-saved', handleRoleSaved);
      window.removeEventListener('user-saved', refreshData);
    });

    return {
      isLoading, roles, roleSearchQuery, showRoleFilters, currentPage,
      filteredRoles, paginatedRoles, totalPages,
      maxPermissionsRole, mostUsedRole, unassignedRolesCount,
      openNewRoleModal, editRole, deleteRole, cloneRole, exportRoles,
      prevPage, nextPage, getRoleBadgeStyle, isProtectedRole, getDeleteButtonTitle, handleRoleSaved
    };
  }
}
</script>

<style scoped>

.role-wrapper {
  min-height: 100vh;
}

.dark .role-wrapper {
  background: #0f172a;
}

/* Layout Grid - align-items: start prevents card stretching */
.role-layout-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

@media (max-width: 1200px) {
  .role-layout-grid {
    grid-template-columns: 1fr;
  }
}

/* Main Card - height: fit-content prevents extra white space */
.role-main-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  height: fit-content;
}

.dark .role-main-card {
  background: #1e293b;
  border-color: #334155;
}

/* Card Header */
.role-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 1rem;
  background: white;
}

.dark .role-card-header {
  border-bottom-color: #334155;
  background: #1e293b;
}

.role-card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .role-card-title {
  color: #f1f5f9;
}

/* Header Right */
.role-header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Search Wrapper */
.role-search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.role-search-icon {
  position: absolute;
  left: 12px;
  font-size: 18px;
  color: #94a3b8;
}

.role-search-input {
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.875rem;
  width: 240px;
  background: white;
  color: #1e293b;
  transition: all 0.2s;
}

.dark .role-search-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.role-search-input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.role-filter-btn {
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

.dark .role-filter-btn {
  background: #0f172a;
  border-color: #334155;
  color: #94a3b8;
}

.role-filter-btn:hover {
  border-color: #6366f1;
  color: #6366f1;
}

/* Table Container - prevents flex stretching */
.role-table-container {
  overflow-x: auto;
  width: 100%;
  flex: 0 1 auto;
}

/* Data Table */
.role-data-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  margin-bottom: 0;
}

/* Column Widths */
.role-col-role {
  width: 22%;
}
.role-col-description {
  width: 45%;
}
.role-col-permissions {
  width: 18%;
}
.role-col-actions {
  width: 15%;
}

/* Table Header */
.role-table-header-row {
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.dark .role-table-header-row {
  background: #0f172a;
  border-bottom-color: #334155;
}

.role-table-header-row th {
  padding: 1rem 1.25rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}

.dark .role-table-header-row th {
  color: #94a3b8;
}

/* Data Rows */
.role-data-row {
  border-bottom: 1px solid #e2e8f0;
  transition: background 0.2s;
}

.dark .role-data-row {
  border-bottom-color: #334155;
}

.role-data-row:hover {
  background: rgba(99, 102, 241, 0.04);
}

.role-data-row td {
  padding: 1rem 1.25rem;
  vertical-align: middle;
}

/* Role Badge */
.role-badge-style {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.813rem;
  font-weight: 600;
  border: 1px solid;
  white-space: nowrap;
}

/* Description */
.role-description-text {
  font-size: 0.875rem;
  color: #1e293b;
  line-height: 1.4;
  display: block;
}

.dark .role-description-text {
  color: #cbd5e1;
}

/* Permission Count */
.role-permission-count {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #6366f1;
}

.dark .role-permission-count {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

/* Action Buttons */
.role-action-buttons {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-action-btn {
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

.role-action-btn .material-symbols-outlined {
  font-size: 18px;
}

.role-action-btn:hover:not(:disabled) {
  background: #f1f5f9;
  transform: translateY(-1px);
}

.dark .role-action-btn:hover:not(:disabled) {
  background: #334155;
}

.role-edit-btn:hover:not(:disabled) {
  color: #3b82f6;
}

.role-clone-btn:hover:not(:disabled) {
  color: #10b981;
}

.role-delete-btn:hover:not(:disabled) {
  color: #ef4444;
  background: #fee2e2;
}

.dark .role-delete-btn:hover:not(:disabled) {
  background: #7f1d1d;
}

.role-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Loading & Empty States */
.role-loading-row td,
.role-empty-row td {
  padding: 60px 20px !important;
}

.role-loading-state,
.role-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #64748b;
  text-align: center;
}

.role-loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.dark .role-loading-spinner {
  border-color: #334155;
  border-top-color: #6366f1;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.role-empty-state .material-symbols-outlined {
  font-size: 48px;
  opacity: 0.5;
}

/* Card Footer - no extra margin */
.role-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  margin-top: 0;
}

.dark .role-card-footer {
  background: #0f172a;
  border-top-color: #334155;
}

.role-footer-text {
  font-size: 0.75rem;
  color: #64748b;
}

.dark .role-footer-text {
  color: #94a3b8;
}

/* Pagination */
.role-pagination {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.role-pagination-btn {
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

.dark .role-pagination-btn {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.role-pagination-btn:hover:not(:disabled) {
  border-color: #6366f1;
  color: #6366f1;
}

.role-pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.role-page-info {
  font-size: 0.75rem;
  color: #64748b;
}

.dark .role-page-info {
  color: #94a3b8;
}

/* Sidebar */
.role-sidebar {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Quick Actions Card */
.role-quick-actions {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
}

.dark .role-quick-actions {
  background: #1e293b;
  border-color: #334155;
}

.role-actions-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark .role-actions-title {
  color: #f1f5f9;
}

.role-actions-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: #6366f1;
  border-radius: 2px;
}

.role-actions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.role-action-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: rgba(243, 244, 246, 0.5);
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #1e293b;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.dark .role-action-item {
  background: rgba(30, 41, 59, 0.3);
  border-color: #334155;
  color: #f1f5f9;
}

.role-action-item:hover {
  background: #6366f1;
  color: white;
  border-color: #6366f1;
  transform: translateY(-2px);
}

.role-action-icon {
  font-size: 20px;
}

.role-action-text {
  flex: 1;
  text-align: left;
}

/* Insights Card */
.role-insights {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
}

.dark .role-insights {
  background: #1e293b;
  border-color: #334155;
}

.role-insights-title {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dark .role-insights-title {
  color: #f1f5f9;
}

.role-insights-title::before {
  content: '';
  display: inline-block;
  width: 4px;
  height: 16px;
  background: #10b981;
  border-radius: 2px;
}

.role-insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.role-insight-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(243, 244, 246, 0.3);
  border-radius: 10px;
  transition: all 0.2s;
}

.dark .role-insight-item {
  background: rgba(30, 41, 59, 0.2);
}

.role-insight-item:hover {
  background: rgba(99, 102, 241, 0.05);
  transform: translateX(2px);
}

.role-insight-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .role-insight-icon {
  background: rgba(99, 102, 241, 0.2);
  color: #a5b4fc;
}

.role-warning-icon {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.dark .role-warning-icon {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.role-insight-content {
  flex: 1;
}

.role-insight-text {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 0.125rem 0;
}

.dark .role-insight-text {
  color: #94a3b8;
}

.role-insight-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .role-insight-value {
  color: #f1f5f9;
}

/* Responsive */
@media (max-width: 768px) {
  .role-wrapper {
    padding: 12px;
  }
  
  .role-card-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .role-search-input {
    width: 100%;
  }
  
  .role-card-footer {
    flex-direction: column;
    gap: 0.75rem;
    text-align: center;
  }
  
  .role-data-table {
    font-size: 0.875rem;
  }
  
  .role-table-header-row th,
  .role-data-row td {
    padding: 0.75rem 1rem;
  }
  
  .role-badge-style {
    padding: 0.25rem 0.625rem;
    font-size: 0.75rem;
  }
  
  .role-permission-count {
    padding: 0.188rem 0.5rem;
    font-size: 0.688rem;
  }
  
  .role-pagination {
    justify-content: center;
  }
}

@media (max-width: 576px) {
  .role-layout-grid {
    gap: 16px;
  }
  
  .role-card-header {
    padding: 1rem;
  }
  
  .role-card-footer {
    padding: 0.75rem 1rem;
  }
  
  .role-table-header-row th,
  .role-data-row td {
    padding: 0.5rem 0.75rem;
  }
}

/* Print styles */
@media print {
  .role-wrapper {
    background: white;
    padding: 0;
  }
  
  .role-filter-btn,
  .role-action-btn,
  .role-pagination-btn {
    display: none;
  }
  
  .role-quick-actions,
  .role-insights {
    break-inside: avoid;
  }
}
</style>