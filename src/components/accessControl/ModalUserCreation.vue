<template>
  <div class="modal-overlay" v-if="isVisible" @click.self="closeModal">
    <div class="modal-content" :class="{ 'modal-wide': isEditing }">
      <!-- Modal Header -->
      <div class="modal-header">
        <div class="header-left">
          <h2 class="modal-title">
            <span class="material-symbols-outlined icon-large">
              {{ isEditing ? 'edit' : 'person_add' }}
            </span>
            {{ isEditing ? 'Edit User' : 'Add New User' }}
          </h2>
          <p class="modal-subtitle">
            {{ isEditing ? 'Update user information and permissions' : 'Invite a new user to the system' }}
          </p>
        </div>
        <button class="close-btn" @click="closeModal">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>

      <!-- Form Content -->
      <div class="modal-body">
        <form @submit.prevent="handleSubmit">
          <!-- Basic Information Section -->
          <div class="form-section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">person</span>
              Basic Information
            </h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="firstName">First Name *</label>
                <input id="firstName" v-model="formData.firstName" type="text" placeholder="Enter first name" required
                  :class="{ 'error': errors.firstName }" />
                <span v-if="errors.firstName" class="error-message">{{ errors.firstName }}</span>
              </div>
              <div class="form-group">
                <label for="lastName">Last Name *</label>
                <input id="lastName" v-model="formData.lastName" type="text" placeholder="Enter last name" required
                  :class="{ 'error': errors.lastName }" />
                <span v-if="errors.lastName" class="error-message">{{ errors.lastName }}</span>
              </div>
              <div class="form-group">
                <label for="email">Email Address *</label>
                <input id="email" v-model="formData.email" type="email" placeholder="user@company.com" required
                  :class="{ 'error': errors.email }" />
                <span v-if="errors.email" class="error-message">{{ errors.email }}</span>
              </div>
              <div class="form-group">
                <label for="phone">Phone Number</label>
                <input id="phone" v-model="formData.phone" type="tel" placeholder="+1 (555) 123-4567" />
              </div>
            </div>
          </div>

          <!-- Role Assignment Section -->
          <div class="form-section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">badge</span>
              Role Assignment
            </h3>
            <div class="form-group">
              <label for="role">Select Role *</label>
              <div class="role-selector">
                <div v-for="role in availableRoles" :key="role.id" class="role-option"
                  :class="{ 'selected': formData.roleId === role.id }" @click="formData.roleId = role.id">
                  <div class="role-option-content">
                    <div class="role-icon" :style="{ backgroundColor: role.color + '20', color: role.color }">
                      <span class="material-symbols-outlined">{{ role.icon }}</span>
                    </div>
                    <div class="role-info">
                      <span class="role-name">{{ role.name }}</span>
                      <span class="role-description">{{ role.description }}</span>
                    </div>
                    <div class="role-permissions">
                      <span class="permissions-count">{{ role.permissions }} permissions</span>
                    </div>
                  </div>
                </div>
              </div>
              <span v-if="errors.roleId" class="error-message">{{ errors.roleId }}</span>
            </div>
          </div>

          <!-- Additional Settings -->
          <div class="form-section">
            <h3 class="section-title">
              <span class="material-symbols-outlined">settings</span>
              Additional Settings
            </h3>
            <div class="settings-grid">
              <div class="setting-item">
                <div class="setting-header">
                  <div class="setting-icon">
                    <span class="material-symbols-outlined">mail</span>
                  </div>
                  <div class="setting-info">
                    <span class="setting-title">Send Invitation Email</span>
                    <span class="setting-description">User will receive an email invitation to join</span>
                  </div>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="sendEmail" v-model="formData.sendEmail" />
                  <label for="sendEmail" class="toggle-label"></label>
                </div>
              </div>

              <div class="setting-item">
                <div class="setting-header">
                  <div class="setting-icon">
                    <span class="material-symbols-outlined">notifications</span>
                  </div>
                  <div class="setting-info">
                    <span class="setting-title">Require Password Reset</span>
                    <span class="setting-description">User must reset password on first login</span>
                  </div>
                </div>
                <div class="toggle-switch">
                  <input type="checkbox" id="requirePasswordReset" v-model="formData.requirePasswordReset" />
                  <label for="requirePasswordReset" class="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>

          <!-- Two-Factor Authentication -->
          <div class="form-section" v-if="isEditing">
            <h3 class="section-title">
              <span class="material-symbols-outlined">shield</span>
              Security Settings
            </h3>
            <div class="form-group">
              <label for="twoFactorStatus">Two-Factor Authentication</label>
              <div class="select-wrapper">
                <select id="twoFactorStatus" v-model="formData.twoFactorStatus">
                  <option value="enabled">Enabled</option>
                  <option value="disabled">Disabled</option>
                  <option value="required">Required</option>
                </select>
                <span class="material-symbols-outlined select-arrow">expand_more</span>
              </div>
            </div>
          </div>

          <!-- Form Actions -->
          <div class="form-actions">
            <button type="button" class="cancel-btn" @click="closeModal">
              Cancel
            </button>
            <button type="submit" class="submit-btn" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner"></span>
              <span v-else>
                {{ isEditing ? 'Update User' : 'Invite User' }}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';

export default {
  name: 'ModalUserCreation',
  props: {
    user: {
      type: Object,
      default: null
    }
  },
  setup(props, { emit }) {
    const toast = useToast();
    const isVisible = ref(false);
    const isSubmitting = ref(false);
    const formData = ref({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      roleId: null,
      sendEmail: true,
      requirePasswordReset: false,
      twoFactorStatus: 'disabled'
    });

    const errors = ref({});
    const availableRoles = ref([]);
    const allRoles = ref([]);
    const existingUsers = ref([]);

    const isEditing = computed(() => props.user !== null);

    // Load existing users from localStorage
    const loadExistingUsers = () => {
      try {
        const storedUsers = localStorage.getItem('access_users');
        if (storedUsers) {
          existingUsers.value = JSON.parse(storedUsers);
        }
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    // Check for duplicate email
    const isDuplicateEmail = (email, excludeUserId = null) => {
      return existingUsers.value.some(user => 
        user.email.toLowerCase() === email.toLowerCase() && 
        user.id !== excludeUserId
      );
    };

    // Check for duplicate name
    const isDuplicateName = (name, excludeUserId = null) => {
      return existingUsers.value.some(user => 
        user.name.toLowerCase() === name.toLowerCase() && 
        user.id !== excludeUserId
      );
    };

    // Load roles from localStorage
    const loadRolesFromStorage = () => {
      try {
        const storedRoles = localStorage.getItem('access_roles');
        if (storedRoles) {
          allRoles.value = JSON.parse(storedRoles);
          // Transform roles for display
          availableRoles.value = allRoles.value.map(role => ({
            id: role.id,
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            icon: role.icon || getIconForRole(role.name),
            color: role.color || getColorForRole(role.name)
          }));
        } else {
          // If no roles exist, create default Super Admin
          availableRoles.value = [
            {
              id: 1,
              name: 'Super Admin',
              description: 'Full system access with all permissions',
              permissions: 12,
              icon: 'security',
              color: '#8b5cf6'
            }
          ];
        }
      } catch (error) {
        console.error('Error loading roles:', error);
        availableRoles.value = [
          {
            id: 1,
            name: 'Super Admin',
            description: 'Full system access with all permissions',
            permissions: 12,
            icon: 'security',
            color: '#8b5cf6'
          }
        ];
      }
    };

    // Helper function to get icon based on role name
    const getIconForRole = (roleName) => {
      const iconMap = {
        'Super Admin': 'security',
        'System Admin': 'admin_panel_settings',
        'Project Manager': 'folder_managed',
        'Contributor': 'edit_note',
        'Viewer': 'visibility',
        'Auditor': 'fact_check',
        'Developer': 'code',
        'Support Agent': 'support_agent'
      };
      return iconMap[roleName] || 'badge';
    };

    // Helper function to get color based on role name
    const getColorForRole = (roleName) => {
      const colorMap = {
        'Super Admin': '#8b5cf6',
        'System Admin': '#ef4444',
        'Project Manager': '#3b82f6',
        'Contributor': '#10b981',
        'Viewer': '#f59e0b',
        'Auditor': '#ec4899',
        'Developer': '#0ea5e9',
        'Support Agent': '#84cc16'
      };
      return colorMap[roleName] || '#6366f1';
    };

    // Listen for role updates
    const handleRoleSaved = () => {
      loadRolesFromStorage();
    };

    // Listen for events from UserManagement
    onMounted(() => {
      loadExistingUsers();
      loadRolesFromStorage();
      window.addEventListener('open-new-user-modal', openModal);
      window.addEventListener('edit-user', handleEditUser);
      window.addEventListener('role-saved', handleRoleSaved);
    });

    onUnmounted(() => {
      window.removeEventListener('open-new-user-modal', openModal);
      window.removeEventListener('edit-user', handleEditUser);
      window.removeEventListener('role-saved', handleRoleSaved);
    });

    const handleEditUser = (event) => {
      if (event.detail) {
        openModal(event.detail);
      }
    };

    const openModal = (userData = null) => {
      // Reload users and roles to ensure latest data
      loadExistingUsers();
      loadRolesFromStorage();
      
      if (userData) {
        // Safely extract name parts
        const nameParts = (userData.name || '').split(' ');

        // Populate form with existing user data for editing
        formData.value = {
          firstName: userData.firstName || nameParts[0] || '',
          lastName: userData.lastName || nameParts.slice(1).join(' ') || '',
          email: userData.email || '',
          phone: userData.phone || '',
          roleId: userData.roleId || getRoleIdByName(userData.role) || null,
          sendEmail: false,
          requirePasswordReset: userData.requirePasswordReset || false,
          twoFactorStatus: userData.twoFactorStatus || 'disabled'
        };
      } else {
        // Reset form for new user
        formData.value = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          roleId: null,
          sendEmail: true,
          requirePasswordReset: false,
          twoFactorStatus: 'disabled'
        };
      }
      errors.value = {};
      isVisible.value = true;
    };

    const getRoleIdByName = (roleName) => {
      if (!roleName) return null;

      // Clean up the role name
      const cleanRoleName = String(roleName).toLowerCase().replace(/_/g, ' ').trim();
      
      // First try exact match
      let role = availableRoles.value.find(r => 
        r.name.toLowerCase() === cleanRoleName
      );
      
      // If not found, try partial match
      if (!role) {
        role = availableRoles.value.find(r => 
          cleanRoleName.includes(r.name.toLowerCase()) || 
          r.name.toLowerCase().includes(cleanRoleName)
        );
      }
      
      return role ? role.id : (availableRoles.value[0]?.id || null);
    };

    const validateForm = () => {
      errors.value = {};
      let isValid = true;

      if (!formData.value.firstName.trim()) {
        errors.value.firstName = 'First name is required';
        isValid = false;
      }

      if (!formData.value.lastName.trim()) {
        errors.value.lastName = 'Last name is required';
        isValid = false;
      }

      if (!formData.value.email.trim()) {
        errors.value.email = 'Email is required';
        isValid = false;
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email)) {
        errors.value.email = 'Please enter a valid email address';
        isValid = false;
      }

      // Check for duplicate email (excluding current user when editing)
      const excludeId = isEditing.value ? props.user?.id : null;
      if (isDuplicateEmail(formData.value.email, excludeId)) {
        errors.value.email = 'A user with this email already exists';
        isValid = false;
        // Show toast notification for duplicate email
        toast.error(`User with email "${formData.value.email}" already exists!`);
      }

      // Check for duplicate name (excluding current user when editing)
      const fullName = `${formData.value.firstName} ${formData.value.lastName}`.trim();
      if (isDuplicateName(fullName, excludeId)) {
        errors.value.firstName = 'A user with this name already exists';
        errors.value.lastName = 'A user with this name already exists';
        isValid = false;
        // Show toast notification for duplicate name
        toast.error(`User with name "${fullName}" already exists!`);
      }

      if (!formData.value.roleId) {
        errors.value.roleId = 'Please select a role';
        isValid = false;
      }

      return isValid;
    };

    const getRoleNameById = (roleId) => {
      const role = availableRoles.value.find(r => r.id === roleId);
      return role ? role.name.toLowerCase().replace(/ /g, '_') : 'contributor';
    };

    const getRandomAvatarColor = () => {
      const colors = ['avatar-blue', 'avatar-green', 'avatar-amber', 'avatar-purple', 'avatar-pink', 'avatar-indigo'];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    // Handle submit with duplicate validation
    const handleSubmit = async () => {
      if (!validateForm()) return;

      isSubmitting.value = true;

      try {
        const selectedRole = availableRoles.value.find(r => r.id === formData.value.roleId);
        
        const userPayload = {
          id: props.user?.id || Date.now(),
          firstName: formData.value.firstName,
          lastName: formData.value.lastName,
          name: `${formData.value.firstName} ${formData.value.lastName}`,
          email: formData.value.email,
          phone: formData.value.phone || '',
          roleId: formData.value.roleId,
          role: getRoleNameById(formData.value.roleId),
          roleDisplayName: selectedRole?.name || 'Contributor',
          status: props.user?.status || 'pending',
          requirePasswordReset: formData.value.requirePasswordReset,
          twoFactorStatus: formData.value.twoFactorStatus,
          avatarColorClass: props.user?.avatarColorClass || getRandomAvatarColor(),
          createdAt: props.user?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // Dispatch event to save user
        window.dispatchEvent(new CustomEvent('user-saved', {
          detail: userPayload
        }));

        // Show success toast notification
        toast.success(
          isEditing.value
            ? `User "${userPayload.name}" has been updated successfully!`
            : `User "${userPayload.name}" has been invited successfully!`
        );

        closeModal();
      } catch (error) {
        console.error('Error saving user:', error);
        toast.error('Failed to save user. Please try again.');
      } finally {
        isSubmitting.value = false;
      }
    };

    const closeModal = () => {
      isVisible.value = false;
      formData.value = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        roleId: null,
        sendEmail: true,
        requirePasswordReset: false,
        twoFactorStatus: 'disabled'
      };
      errors.value = {};
      isSubmitting.value = false;
    };

    return {
      isVisible,
      isSubmitting,
      formData,
      errors,
      availableRoles,
      isEditing,
      openModal,
      closeModal,
      handleSubmit
    };
  }
};
</script>

<style scoped>
/* Modal Overlay */
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
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* Modal Content */
.modal-content {
  background: #ffffff;
  border-radius: 1rem;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

.dark .modal-content {
  background: #1e293b;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-wide {
  max-width: 900px;
}

/* Modal Header */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.5rem 1.5rem 0.75rem;
  border-bottom: 1px solid #e2e8f0;
}

.dark .modal-header {
  border-bottom-color: #334155;
}

.header-left {
  flex: 1;
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dark .modal-title {
  color: #f1f5f9;
}

.modal-title .icon-large {
  font-size: 1.75rem;
  color: #6366f1;
}

.modal-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
  color: #64748b;
}

.dark .modal-subtitle {
  color: #94a3b8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.05);
  color: #1e293b;
}

.dark .close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
}

/* Modal Body */
.modal-body {
  padding: 1rem 1.5rem 1.5rem;
}

/* Form Sections */
.form-section {
  margin-bottom: 1.75rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e2e8f0;
}

.dark .section-title {
  color: #f1f5f9;
  border-bottom-color: #334155;
}

.section-title .material-symbols-outlined {
  color: #6366f1;
  font-size: 1.25rem;
}

/* Form Grid */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

/* Form Groups */
.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 0.375rem;
}

.dark .form-group label {
  color: #f1f5f9;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
  color: #1e293b;
  transition: all 0.2s ease;
}

.dark .form-group input,
.dark .form-group select {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input.error {
  border-color: #ef4444;
}

.error-message {
  display: block;
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
}

/* Role Selector */
.role-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
}

.dark .role-selector {
  background: #0f172a;
  border-color: #334155;
}

.role-option {
  padding: 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.dark .role-option {
  background: #0f172a;
  border-color: #334155;
}

.role-option:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
  transform: translateX(2px);
}

.role-option.selected {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.1);
}

.role-option-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.role-icon {
  width: 40px;
  height: 40px;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.role-info {
  flex: 1;
  min-width: 0;
}

.role-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.dark .role-name {
  color: #f1f5f9;
}

.role-description {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.dark .role-description {
  color: #94a3b8;
}

.role-permissions {
  flex-shrink: 0;
}

.permissions-count {
  font-size: 0.75rem;
  font-weight: 500;
  color: #64748b;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 0.25rem;
}

.dark .permissions-count {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
}

/* Settings Grid */
.settings-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  background: #ffffff;
  transition: all 0.2s ease;
}

.dark .setting-item {
  background: #0f172a;
  border-color: #334155;
}

.setting-item:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
}

.setting-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.setting-icon {
  width: 36px;
  height: 36px;
  border-radius: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.setting-info {
  flex: 1;
}

.setting-title {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
}

.dark .setting-title {
  color: #f1f5f9;
}

.setting-description {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.dark .setting-description {
  color: #94a3b8;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
}

.toggle-switch input {
  display: none;
}

.toggle-label {
  display: block;
  width: 44px;
  height: 24px;
  background: #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
}

.dark .toggle-label {
  background: #4b5563;
}

.toggle-label::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.toggle-switch input:checked+.toggle-label {
  background: #6366f1;
}

.toggle-switch input:checked+.toggle-label::after {
  transform: translateX(20px);
}

/* Select Wrapper */
.select-wrapper {
  position: relative;
}

.select-wrapper select {
  appearance: none;
  padding-right: 2.5rem;
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: #64748b;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 1.5rem;
}

.dark .form-actions {
  border-top-color: #334155;
}

.cancel-btn,
.submit-btn {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.cancel-btn {
  background: transparent;
  border-color: #e2e8f0;
  color: #1e293b;
}

.dark .cancel-btn {
  border-color: #334155;
  color: #f1f5f9;
}

.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dark .cancel-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.submit-btn {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
  border-color: transparent;
  min-width: 120px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar Styling */
.role-selector::-webkit-scrollbar {
  width: 6px;
}

.role-selector::-webkit-scrollbar-track {
  background: transparent;
}

.role-selector::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 3px;
}

.dark .role-selector::-webkit-scrollbar-thumb {
  background: #334155;
}

.role-selector::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}

.dark .role-selector::-webkit-scrollbar-thumb:hover {
  background: #475569;
}
</style>