<template>
    <!-- Role Creation Modal -->
    <div v-if="show" class="modal-role-creation" @keydown.esc="closeModal" tabindex="0" ref="modalRef">
        <div class="modal-overlay" @click="closeModal"></div>

        <div class="modal-container">
            <!-- Modal Header -->
            <div class="modal-header">
                <div class="modal-header-content">
                    <span class="modal-header-icon material-symbols-outlined">badge</span>
                    <div class="modal-header-text">
                        <h3 class="modal-title">{{ isEditing ? 'Edit Role' : 'Create New Role' }}</h3>
                        <p class="modal-subtitle">
                            {{ isEditing ? 'Update role details and permissions' : 'Define a new role with specific permissions' }}
                        </p>
                    </div>
                </div>
                <button class="modal-close-btn" @click="closeModal" aria-label="Close modal">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>

            <!-- Modal Content -->
            <div class="modal-content">
                <!-- Basic Information Grid -->
                <div class="form-section basic-info-grid">
                    <!-- Role Name -->
                    <div class="form-field">
                        <div class="field-header">
                            <label class="field-label">Role Name</label>
                            <span class="field-required">*</span>
                        </div>
                        <div class="field-input-wrapper">
                            <span class="field-icon material-symbols-outlined">badge</span>
                            <input 
                                v-model="roleForm.name" 
                                class="field-input" 
                                placeholder="e.g., Administrator"
                                :class="{ 'input-error': validationErrors.name }"
                                @keyup.enter="saveRole"
                                autocomplete="off"
                            >
                        </div>
                        <div v-if="validationErrors.name" class="field-error">{{ validationErrors.name }}</div>
                        <div class="field-hint">Unique identifier for this role</div>
                    </div>

                    <!-- Description -->
                    <div class="form-field">
                        <div class="field-header">
                            <label class="field-label">Description</label>
                            <span class="field-optional">Optional</span>
                        </div>
                        <div class="field-input-wrapper">
                            <span class="field-icon material-symbols-outlined">description</span>
                            <input 
                                v-model="roleForm.description" 
                                class="field-input" 
                                placeholder="Brief description"
                                @keyup.enter="saveRole"
                                autocomplete="off"
                            >
                        </div>
                        <div class="field-hint">Short description of the role's purpose</div>
                    </div>
                </div>

                <!-- Color Selection -->
                <div class="form-section">
                    <div class="section-header">
                        <label class="section-label">Role Color</label>
                        <span class="section-optional">Optional</span>
                    </div>
                    
                    <!-- Color Picker -->
                    <div class="color-picker-container">
                        <!-- Quick Color Palette -->
                        <div class="color-palette-section">
                            <div class="color-palette-title">Quick Colors</div>
                            <div class="color-palette-grid">
                                <button 
                                    v-for="color in presetColors" 
                                    :key="color" 
                                    class="color-swatch"
                                    :class="{ 'selected': roleForm.color === color }"
                                    :style="{ backgroundColor: color }"
                                    @click="roleForm.color = color"
                                    :title="getColorName(color)"
                                    :aria-label="`Select ${getColorName(color)} color`"
                                >
                                    <span v-if="roleForm.color === color" class="material-symbols-outlined color-check">
                                        check
                                    </span>
                                </button>
                            </div>
                        </div>

                        <!-- Custom Color Input -->
                        <div class="color-custom-section">
                            <div class="color-custom-header">
                                <span class="color-custom-label">Custom Color</span>
                                <div class="color-current" :style="{ backgroundColor: roleForm.color }"></div>
                            </div>
                            <div class="color-custom-inputs">
                                <div class="color-picker-wrapper">
                                    <input 
                                        type="color" 
                                        v-model="roleForm.color" 
                                        class="color-picker"
                                        title="Pick a custom color"
                                        aria-label="Custom color picker"
                                    >
                                    <span class="color-picker-label">Picker</span>
                                </div>
                                <div class="color-hex-wrapper">
                                    <div class="color-hex-label">HEX Code</div>
                                    <div class="color-hex-input-group">
                                        <span class="color-hex-prefix">#</span>
                                        <input 
                                            type="text" 
                                            v-model="roleForm.color" 
                                            class="color-hex-input"
                                            placeholder="000000"
                                            @input="validateHexColor"
                                            @focus="selectAllText"
                                            maxlength="7"
                                        >
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Permissions Selection -->
                <div class="form-section">
                    <div class="section-header">
                        <label class="section-label">Permissions</label>
                        <span class="section-required">*</span>
                    </div>
                    <div class="permissions-section">
                        <div class="permissions-header">
                            <div class="permissions-icon-wrapper">
                                <span class="material-symbols-outlined">lock</span>
                            </div>
                            <div class="permissions-info">
                                <div class="permissions-count">
                                    {{ roleForm.permissions.length }} permission{{ roleForm.permissions.length !== 1 ? 's' : '' }} selected
                                </div>
                                <div class="permissions-hint">
                                    Select the permissions this role should have
                                </div>
                            </div>
                            <button 
                                v-if="roleForm.permissions.length > 0"
                                @click="roleForm.permissions = []"
                                class="clear-permissions-btn"
                                type="button"
                                title="Clear all permissions"
                            >
                                <span class="material-symbols-outlined">close</span>
                                Clear All
                            </button>
                        </div>
                        <PermissionSelector v-model="roleForm.permissions" />
                    </div>
                    <div v-if="validationErrors.permissions" class="field-error">{{ validationErrors.permissions }}</div>
                </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
                <div class="modal-footer-content">
                    <button @click="cancel" class="modal-btn modal-btn-secondary">
                        <span class="material-symbols-outlined btn-icon">close</span>
                        Cancel
                    </button>
                    <button @click="saveRole" class="modal-btn modal-btn-primary">
                        <span class="material-symbols-outlined btn-icon">
                            {{ isEditing ? 'save' : 'add_circle' }}
                        </span>
                        {{ isEditing ? 'Update Role' : 'Create Role' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, reactive, onMounted, onUnmounted } from 'vue';
import { useToast } from 'vue-toastification';
import PermissionSelector from './PermissionSelector.vue'

export default {
    name: 'ModalRoleCreation',
    components: {
        PermissionSelector
    },
    props: {
        show: {
            type: Boolean,
            default: false
        },
        editingRole: {
            type: Object,
            default: null
        }
    },
    emits: ['update:show', 'close', 'cancel', 'save', 'role-saved'],
    setup(props, { emit }) {
        const toast = useToast();
        const modalRef = ref(null);
        const isEditing = computed(() => !!props.editingRole);

        const roleForm = reactive({
            name: '',
            description: '',
            color: '#3b82f6',
            permissions: [],
            icon: 'security'
        });

        const validationErrors = reactive({
            name: '',
            permissions: ''
        });

        // Preset color options
        const presetColors = ref([
            '#3b82f6', // Blue (Primary)
            '#8b5cf6', // Purple
            '#10b981', // Green
            '#f59e0b', // Amber
            '#ef4444', // Red
            '#ec4899', // Pink
            '#0ea5e9', // Sky
            '#84cc16', // Lime
            '#14b8a6', // Teal
            '#f97316', // Orange
            '#6366f1', // Indigo
            '#64748b', // Slate
        ]);

        // Helper functions
        const clearValidationErrors = () => {
            validationErrors.name = '';
            validationErrors.permissions = '';
        };

        const resetForm = () => {
            roleForm.name = '';
            roleForm.description = '';
            roleForm.color = '#3b82f6';
            roleForm.permissions = [];
            roleForm.icon = 'security';
        };

        const hexToRgba = (hex, alpha) => {
            if (!hex.startsWith('#')) return `rgba(59, 130, 246, ${alpha})`;
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };

        const getColorName = (hex) => {
            const colorNames = {
                '#3b82f6': 'Blue',
                '#8b5cf6': 'Purple',
                '#10b981': 'Green',
                '#f59e0b': 'Amber',
                '#ef4444': 'Red',
                '#ec4899': 'Pink',
                '#0ea5e9': 'Sky',
                '#84cc16': 'Lime',
                '#14b8a6': 'Teal',
                '#f97316': 'Orange',
                '#6366f1': 'Indigo',
                '#64748b': 'Slate'
            };
            return colorNames[hex] || 'Custom';
        };

        const validateHexColor = (event) => {
            let value = event.target.value;
            if (!value.startsWith('#')) {
                value = '#' + value;
            }
            // Remove any non-hex characters
            value = value.replace(/[^#a-fA-F0-9]/g, '');
            
            if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) {
                roleForm.color = value;
            }
        };

        const selectAllText = (event) => {
            event.target.select();
        };

        const validateForm = () => {
            let isValid = true;
            clearValidationErrors();

            if (!roleForm.name.trim()) {
                validationErrors.name = 'Role name is required';
                isValid = false;
            } else if (roleForm.name.length > 50) {
                validationErrors.name = 'Role name cannot exceed 50 characters';
                isValid = false;
            }

            // Check for duplicate role name (when creating new)
            if (!isEditing.value) {
                const existingRoles = JSON.parse(localStorage.getItem('access_roles') || '[]');
                const isDuplicate = existingRoles.some(role => 
                    role.name.toLowerCase() === roleForm.name.trim().toLowerCase()
                );
                if (isDuplicate) {
                    validationErrors.name = 'A role with this name already exists';
                    isValid = false;
                }
            } else {
                // When editing, check if name conflicts with other roles (excluding current)
                const existingRoles = JSON.parse(localStorage.getItem('access_roles') || '[]');
                const isDuplicate = existingRoles.some(role => 
                    role.id !== props.editingRole.id && 
                    role.name.toLowerCase() === roleForm.name.trim().toLowerCase()
                );
                if (isDuplicate) {
                    validationErrors.name = 'A role with this name already exists';
                    isValid = false;
                }
            }

            if (roleForm.permissions.length === 0) {
                validationErrors.permissions = 'Please select at least one permission';
                isValid = false;
            }

            return isValid;
        };

        // Log audit event
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
            const trimmedLog = auditLog.slice(0, 1000);
            localStorage.setItem('access_audit', JSON.stringify(trimmedLog));
            console.log(`[AUDIT] ${action} - ${details}`);
        };

        // Save role to localStorage
        const saveRoleToStorage = (roleData) => {
            const existingRoles = JSON.parse(localStorage.getItem('access_roles') || '[]');
            
            if (isEditing.value) {
                // Update existing role
                const index = existingRoles.findIndex(r => r.id === props.editingRole.id);
                if (index !== -1) {
                    const updatedRole = {
                        ...existingRoles[index],
                        name: roleData.name,
                        description: roleData.description,
                        color: roleData.color,
                        icon: roleData.icon,
                        permissions: roleData.permissions.length,
                        updatedAt: new Date().toISOString()
                    };
                    existingRoles[index] = updatedRole;
                    localStorage.setItem('access_roles', JSON.stringify(existingRoles));
                    logAuditEvent('Role Updated', `Role "${roleData.name}" was updated`);
                    toast.success(`Role "${roleData.name}" updated successfully!`);
                }
            } else {
                // Create new role
                const newId = existingRoles.length > 0 ? Math.max(...existingRoles.map(r => r.id)) + 1 : 1;
                const newRole = {
                    id: newId,
                    name: roleData.name,
                    description: roleData.description || '',
                    color: roleData.color,
                    icon: roleData.icon,
                    permissions: roleData.permissions.length,
                    users: 0,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                existingRoles.push(newRole);
                localStorage.setItem('access_roles', JSON.stringify(existingRoles));
                logAuditEvent('Role Created', `New role "${roleData.name}" was created with ${roleData.permissions.length} permissions`);
                toast.success(`Role "${roleData.name}" created successfully!`);
            }
            
            // Dispatch event to refresh role list
            window.dispatchEvent(new CustomEvent('role-saved', { 
                detail: { ...roleData, isEditing: isEditing.value }
            }));
            
            return true;
        };

        const saveRole = () => {
        if (!validateForm()) {
            return;
        }

        const roleData = {
            name: roleForm.name.trim(),
            description: roleForm.description.trim(),
            color: roleForm.color,
            icon: getIconFromName(roleForm.name),
            permissions: roleForm.permissions,
            slug: roleForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        };

        // Emit only once
        emit('role-saved', roleData);
        emit('save', roleData);
        closeModal();
        };
        
        const getIconFromName = (name) => {
            const iconMap = {
                'admin': 'admin_panel_settings',
                'manager': 'folder_managed',
                'developer': 'code',
                'viewer': 'visibility',
                'auditor': 'fact_check',
                'support': 'support_agent',
                'contributor': 'edit_note'
            };
            
            const lowerName = name.toLowerCase();
            for (const [key, icon] of Object.entries(iconMap)) {
                if (lowerName.includes(key)) {
                    return icon;
                }
            }
            return 'security';
        };

        // Preview styles
        const previewBadgeStyle = computed(() => ({
            '--role-color': roleForm.color,
            '--role-bg-color': hexToRgba(roleForm.color, 0.1),
            backgroundColor: hexToRgba(roleForm.color, 0.1),
            color: roleForm.color,
            borderColor: roleForm.color
        }));

        // Initialize form if editing
        watch(() => props.editingRole, (role) => {
            if (role) {
                roleForm.name = role.name || '';
                roleForm.description = role.description || '';
                roleForm.color = role.color || '#3b82f6';
                // Convert permissions count back to array of permission names if needed
                roleForm.permissions = Array.isArray(role.permissions) ? [...role.permissions] : 
                    (typeof role.permissions === 'number' ? getDefaultPermissionsForRole(role.name) : []);
                roleForm.icon = role.icon || getIconFromName(role.name);
            } else {
                resetForm();
            }
            clearValidationErrors();
        }, { immediate: true });

        const getDefaultPermissionsForRole = (roleName) => {
            // Return default permissions based on role name
            const defaultPermissions = {
                'Super Admin': ['all'],
                'System Admin': ['manage_users', 'manage_roles', 'view_audit'],
                'Project Manager': ['create_projects', 'edit_projects', 'view_projects', 'assign_tasks'],
                'Contributor': ['view_projects', 'edit_tasks', 'add_comments'],
                'Viewer': ['view_projects'],
                'Auditor': ['view_audit', 'view_reports'],
                'Developer': ['view_projects', 'edit_code', 'submit_pr'],
                'Support Agent': ['view_tickets', 'reply_tickets']
            };
            return defaultPermissions[roleName] || ['view_projects'];
        };

        const closeModal = () => {
            emit('update:show', false);
            emit('close');
            resetForm();
        };

        const cancel = () => {
            closeModal();
        };

        // Keyboard event handling
        const handleKeydown = (event) => {
            if (event.key === 'Escape' && props.show) {
                closeModal();
            }
        };

        // Auto-focus modal when shown
        watch(() => props.show, (show) => {
            if (show) {
                window.addEventListener('keydown', handleKeydown);
                setTimeout(() => {
                    const firstInput = modalRef.value?.querySelector('input, textarea, button');
                    if (firstInput) firstInput.focus();
                }, 100);
            } else {
                window.removeEventListener('keydown', handleKeydown);
            }
        });

        onUnmounted(() => {
            window.removeEventListener('keydown', handleKeydown);
        });

        return {
            modalRef,
            roleForm,
            presetColors,
            isEditing,
            previewBadgeStyle,
            saveRole,
            cancel,
            closeModal,
            getColorName,
            validateHexColor,
            selectAllText,
            validationErrors
        };
    }
};
</script>

<style scoped>
@import"../../styles/accessControl/ModalRoleCreation.css"
</style>