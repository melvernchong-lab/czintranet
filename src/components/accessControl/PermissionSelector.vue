<template>
  <div class="permission-selector">
    <div class="permission-groups">
      <div v-for="group in permissionGroups" :key="group.name" class="permission-group">
        <h4>{{ group.name }}</h4>
        <div class="permission-list">
          <label v-for="permission in group.permissions" :key="permission.id" class="permission-item">
            <input
              type="checkbox"
              :value="permission.id"
              v-model="selectedPermissions"
            />
            <div class="permission-info">
              <span class="permission-name">{{ permission.name }}</span>
              <span class="permission-desc">{{ permission.description }}</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'PermissionSelector',
  props: {
    modelValue: {
      type: Array,
      default: () => []
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const selectedPermissions = ref([...props.modelValue])
    
    // Mock permission data
    const permissionGroups = ref([
      {
        name: 'User Management',
        permissions: [
          { id: 'user:read', name: 'View Users', description: 'Can view user list and profiles' },
          { id: 'user:create', name: 'Create Users', description: 'Can create new users' },
          { id: 'user:edit', name: 'Edit Users', description: 'Can edit user information' },
          { id: 'user:delete', name: 'Delete Users', description: 'Can remove users from system' }
        ]
      },
      {
        name: 'Role Management',
        permissions: [
          { id: 'role:read', name: 'View Roles', description: 'Can view role list and details' },
          { id: 'role:create', name: 'Create Roles', description: 'Can create new roles' },
          { id: 'role:edit', name: 'Edit Roles', description: 'Can modify role permissions' },
          { id: 'role:delete', name: 'Delete Roles', description: 'Can remove roles from system' }
        ]
      },
      {
        name: 'Content Management',
        permissions: [
          { id: 'content:read', name: 'View Content', description: 'Can view all content' },
          { id: 'content:create', name: 'Create Content', description: 'Can create new content' },
          { id: 'content:edit', name: 'Edit Content', description: 'Can modify existing content' },
          { id: 'content:delete', name: 'Delete Content', description: 'Can remove content' }
        ]
      },
      {
        name: 'System Settings',
        permissions: [
          { id: 'settings:read', name: 'View Settings', description: 'Can view system settings' },
          { id: 'settings:edit', name: 'Edit Settings', description: 'Can modify system settings' }
        ]
      }
    ])
    
    // Watch for changes and emit to parent
    watch(selectedPermissions, (newValue) => {
      emit('update:modelValue', newValue)
    })
    
    // Watch for external changes
    watch(() => props.modelValue, (newValue) => {
      selectedPermissions.value = [...newValue]
    })
    
    return {
      selectedPermissions,
      permissionGroups
    }
  }
}
</script>

<style scoped>
.permission-selector {
  border: 1px solid var(--border-light, #e2e8f0);
  border-radius: 0.5rem;
  background: var(--background-light, #f8fafc);
  padding: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.dark .permission-selector {
  background: var(--background-dark, #1e293b);
  border-color: var(--border-dark, #334155);
}

.permission-group {
  margin-bottom: 1.5rem;
}

.permission-group:last-child {
  margin-bottom: 0;
}

.permission-group h4 {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-light, #1e293b);
}

.dark .permission-group h4 {
  color: var(--text-dark, #f1f5f9);
}

.permission-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.permission-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.permission-item:hover {
  background: var(--hover-light, #f1f5f9);
}

.dark .permission-item:hover {
  background: var(--hover-dark, #334155);
}

.permission-item input[type="checkbox"] {
  margin-top: 2px;
  cursor: pointer;
}

.permission-info {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.permission-name {
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-light, #1e293b);
}

.dark .permission-name {
  color: var(--text-dark, #f1f5f9);
}

.permission-desc {
  font-size: 0.75rem;
  color: var(--text-muted-light, #64748b);
}

.dark .permission-desc {
  color: var(--text-muted-dark, #94a3b8);
}
</style>