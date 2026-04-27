<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click.self="closeModal">
      <div class="edit-modal team-modal">
        <div class="modal-header">
          <h3>Manage Team Members</h3>
          <button class="close-btn" @click="closeModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-body">
          <div class="current-members-section">
            <label>Current Team Members</label>
            <div class="members-list">
              <div v-for="member in localTeamMembers" :key="member.id" class="member-item">
                <div class="member-info">
                  <div class="member-avatar-small" :style="{ backgroundColor: member.avatarColor }">
                    {{ member.initials }}
                  </div>
                  <div class="member-details">
                    <span class="member-name">{{ member.name }}</span>
                    <span class="member-role">{{ member.role }}</span>
                  </div>
                </div>
                <button class="remove-member-btn" @click="removeMember(member.id)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
              <div v-if="localTeamMembers.length === 0" class="empty-message-small">
                No team members assigned
              </div>
            </div>
          </div>
          <div class="add-member-section">
            <label>Add New Team Member</label>
            <div class="add-member-container">
              <div class="custom-dropdown" :class="{ 'is-open': isDropdownOpen }">
                <div class="dropdown-trigger" @click="toggleDropdown">
                  <div class="selected-member" v-if="selectedMemberId">
                    <div class="selected-avatar" :style="{ backgroundColor: getSelectedMemberAvatarColor() }">
                      {{ getSelectedMemberInitials() }}
                    </div>
                    <div class="selected-info">
                      <span class="selected-name">{{ getSelectedMemberName() }}</span>
                      <span class="selected-role">{{ getSelectedMemberRole() }}</span>
                    </div>
                  </div>
                  <div class="selected-placeholder" v-else>
                    <span class="placeholder-text">Select a team member...</span>
                  </div>
                  <span class="dropdown-icon material-symbols-outlined">expand_more</span>
                </div>
              </div>
              <button class="add-btn" @click="addMember" :disabled="!selectedMemberId">
                <span class="material-symbols-outlined">person_add</span>
                Add Member
              </button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Cancel</button>
          <button class="btn-primary" @click="saveChanges">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Dropdown Menu Portal -->
    <div class="dropdown-menu-portal" v-if="isDropdownOpen" :style="dropdownMenuStyle" @click.stop>
      <div class="dropdown-search">
        <span class="search-icon material-symbols-outlined">search</span>
        <input
          type="text"
          v-model="memberSearch"
          placeholder="Search members..."
          class="search-input"
          @click.stop
        />
      </div>
      <div class="dropdown-options">
        <div
          v-for="member in filteredAvailableMembers"
          :key="member.id"
          class="dropdown-option"
          :class="{ 'is-selected': selectedMemberId === member.id }"
          @click="selectMember(member.id)"
        >
          <div class="option-avatar" :style="{ backgroundColor: member.avatarColor }">
            {{ member.initials }}
          </div>
          <div class="option-info">
            <span class="option-name">{{ member.name }}</span>
            <span class="option-role">{{ member.role }}</span>
          </div>
          <span class="check-icon material-symbols-outlined" v-if="selectedMemberId === member.id">
            check
          </span>
        </div>
        <div v-if="filteredAvailableMembers.length === 0" class="no-results">
          <span class="material-symbols-outlined">search_off</span>
          <p>No members found</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

export default {
  name: 'TeamMembersEditModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    teamMembers: {
      type: Array,
      required: true
    }
  },
  emits: ['update:visible', 'save'],
  setup(props, { emit }) {
    // Local copy of team members for editing
    const localTeamMembers = ref([])
    
    // Dropdown state
    const selectedMemberId = ref('')
    const isDropdownOpen = ref(false)
    const memberSearch = ref('')
    const dropdownMenuStyle = ref({})

    // Available members (hardcoded for now, could be passed as prop)
    const availableMembers = ref([
      { id: 1, name: 'John Smith', role: 'Senior Developer', initials: 'JS', avatarColor: '#3b82f6' },
      { id: 2, name: 'Sarah Johnson', role: 'UI/UX Designer', initials: 'SJ', avatarColor: '#10b981' },
      { id: 3, name: 'Michael Chen', role: 'Backend Developer', initials: 'MC', avatarColor: '#f59e0b' },
      { id: 4, name: 'Emily Davis', role: 'QA Engineer', initials: 'ED', avatarColor: '#8b5cf6' },
      { id: 5, name: 'Robert Wilson', role: 'DevOps', initials: 'RW', avatarColor: '#ec4899' },
      { id: 6, name: 'Lisa Wang', role: 'Frontend Dev', initials: 'LW', avatarColor: '#06b6d4' }
    ])

    // Watch for prop changes to initialize local copy
    watch(() => props.teamMembers, (newVal) => {
      localTeamMembers.value = [...newVal]
    }, { immediate: true, deep: true })

    // Reset state when modal opens
    watch(() => props.visible, (newVal) => {
      if (newVal) {
        selectedMemberId.value = ''
        memberSearch.value = ''
        isDropdownOpen.value = false
      }
    })

    // Filtered available members (excluding already added)
    const filteredAvailableMembers = computed(() => {
      const addedIds = localTeamMembers.value.map(m => m.id)
      let filtered = availableMembers.value.filter(m => !addedIds.includes(m.id))
      
      if (memberSearch.value) {
        const search = memberSearch.value.toLowerCase()
        filtered = filtered.filter(member =>
          member.name.toLowerCase().includes(search) ||
          member.role.toLowerCase().includes(search)
        )
      }
      return filtered
    })

    // Helper functions for selected member display
    const getSelectedMember = () => {
      return availableMembers.value.find(m => m.id === selectedMemberId.value)
    }

    const getSelectedMemberName = () => getSelectedMember()?.name || ''
    const getSelectedMemberRole = () => getSelectedMember()?.role || ''
    const getSelectedMemberInitials = () => getSelectedMember()?.initials || ''
    const getSelectedMemberAvatarColor = () => getSelectedMember()?.avatarColor || '#6366f1'

    // Actions
    const closeModal = () => {
      emit('update:visible', false)
    }

    const addMember = () => {
      if (!selectedMemberId.value) return
      const memberToAdd = availableMembers.value.find(m => m.id === selectedMemberId.value)
      if (memberToAdd && !localTeamMembers.value.some(m => m.id === memberToAdd.id)) {
        localTeamMembers.value.push({ ...memberToAdd })
      }
      selectedMemberId.value = ''
    }

    const removeMember = (memberId) => {
      const index = localTeamMembers.value.findIndex(m => m.id === memberId)
      if (index !== -1) localTeamMembers.value.splice(index, 1)
    }

    const saveChanges = () => {
      emit('save', localTeamMembers.value)
      closeModal()
    }

    // Dropdown positioning
    const calculateDropdownPosition = async () => {
      await nextTick()
      const trigger = document.querySelector('.dropdown-trigger')
      if (trigger) {
        const rect = trigger.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        const dropdownWidth = 380
        const dropdownHeight = 310
        
        let left = rect.left
        let top = rect.bottom
        
        if (left + dropdownWidth > viewportWidth) left = viewportWidth - dropdownWidth - 10
        if (left < 10) left = 10
        if (top + dropdownHeight > viewportHeight) top = rect.top - dropdownHeight
        
        dropdownMenuStyle.value = {
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${dropdownWidth}px`,
          zIndex: 10000,
          margin: 0,
          padding: 0
        }
      }
    }

    const toggleDropdown = async () => {
      if (!isDropdownOpen.value) {
        isDropdownOpen.value = true
        await calculateDropdownPosition()
      } else {
        isDropdownOpen.value = false
        memberSearch.value = ''
      }
    }

    const selectMember = (memberId) => {
      selectedMemberId.value = memberId
      isDropdownOpen.value = false
      memberSearch.value = ''
    }

    // Click outside handling
    const handleClickOutside = (event) => {
      const dropdown = event.target.closest('.custom-dropdown')
      const dropdownMenu = event.target.closest('.dropdown-menu-portal')
      const addButton = event.target.closest('.add-btn')
      
      if (dropdown || dropdownMenu || addButton) return
      
      if (isDropdownOpen.value) {
        isDropdownOpen.value = false
        memberSearch.value = ''
      }
    }

    const handleScroll = (event) => {
      const dropdownMenu = document.querySelector('.dropdown-menu-portal')
      if (dropdownMenu && dropdownMenu.contains(event.target)) return
      if (isDropdownOpen.value) {
        isDropdownOpen.value = false
        memberSearch.value = ''
      }
    }

    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', () => { if (isDropdownOpen.value) calculateDropdownPosition() })
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
    })

    return {
      localTeamMembers,
      selectedMemberId,
      isDropdownOpen,
      memberSearch,
      dropdownMenuStyle,
      filteredAvailableMembers,
      getSelectedMemberName,
      getSelectedMemberRole,
      getSelectedMemberInitials,
      getSelectedMemberAvatarColor,
      closeModal,
      addMember,
      removeMember,
      saveChanges,
      toggleDropdown,
      selectMember
    }
  }
}
</script>

<style scoped>
/* Copy all modal-related styles from ProjectDetailPage here */
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

.edit-modal {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 550px;
  max-height: 85vh;
  overflow: hidden;
  animation: modalSlideIn 0.3s ease;
}

.dark .edit-modal {
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

.current-members-section {
  margin-bottom: 24px;
}

.current-members-section label,
.add-member-section label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  margin-bottom: 12px;
}

.dark .current-members-section label,
.dark .add-member-section label {
  color: #94a3b8;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.dark .members-list {
  border-color: #334155;
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s;
}

.dark .member-item {
  background: #0f172a;
}

.member-item:hover {
  transform: translateX(4px);
}

.member-avatar-small {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.member-details {
  flex: 1;
}

.member-details .member-name {
  display: block;
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.dark .member-details .member-name {
  color: #f1f5f9;
}

.member-details .member-role {
  font-size: 12px;
  color: #64748b;
}

.remove-member-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  transition: all 0.2s;
}

.remove-member-btn:hover {
  background: #fee2e2;
  transform: rotate(90deg);
}

.dark .remove-member-btn:hover {
  background: #7f1d1d;
}

.empty-message-small {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-size: 13px;
}

.add-member-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e2e8f0;
}

.dark .add-member-section {
  border-top-color: #334155;
}

.add-member-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.custom-dropdown {
  position: relative;
  flex: 1;
  margin: 0;
  padding: 0;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 56px;
}

.dark .dropdown-trigger {
  background: #0f172a;
  border-color: #334155;
}

.dropdown-trigger:hover {
  border-color: #6366f1;
}

.selected-member {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.selected-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.selected-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.selected-name {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
}

.dark .selected-name {
  color: #f1f5f9;
}

.selected-role {
  font-size: 11px;
  color: #64748b;
}

.selected-placeholder {
  flex: 1;
}

.placeholder-text {
  color: #94a3b8;
  font-size: 14px;
}

.dropdown-icon {
  font-size: 20px;
  color: #64748b;
  transition: transform 0.2s;
}

.custom-dropdown.is-open .dropdown-icon {
  transform: rotate(180deg);
}

/* Dropdown Menu Portal */
.dropdown-menu-portal {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: dropdownFadeIn 0.2s ease;
  position: fixed;
  z-index: 10001;
}

.dark .dropdown-menu-portal {
  background: #1e293b;
  border-color: #334155;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-search {
  position: relative;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.dark .dropdown-search {
  border-bottom-color: #334155;
}

.search-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #64748b;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13px;
  background: white;
}

.dark .search-input {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

.search-input:focus {
  outline: none;
  border-color: #6366f1;
}

.dropdown-options {
  max-height: 250px;
  overflow-y: auto;
}

.dropdown-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.dropdown-option:hover {
  background: #f8fafc;
}

.dark .dropdown-option:hover {
  background: #0f172a;
}

.dropdown-option.is-selected {
  background: #eef2ff;
}

.dark .dropdown-option.is-selected {
  background: #1e1b4b;
}

.option-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  flex-shrink: 0;
}

.option-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.option-name {
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.dark .option-name {
  color: #f1f5f9;
}

.option-role {
  font-size: 11px;
  color: #64748b;
}

.check-icon {
  font-size: 18px;
  color: #10b981;
}

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px 20px;
  color: #64748b;
  text-align: center;
}

.no-results .material-symbols-outlined {
  font-size: 32px;
  margin-bottom: 8px;
  opacity: 0.5;
}

.no-results p {
  font-size: 13px;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.add-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .edit-modal {
    width: 95%;
    max-height: 90vh;
  }
  
  .add-member-container {
    flex-direction: column;
  }
  
  .add-btn {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .dropdown-trigger {
    min-height: 48px;
    padding: 8px 10px;
  }
  
  .selected-avatar,
  .option-avatar {
    width: 28px;
    height: 28px;
    font-size: 10px;
  }
  
  .selected-name,
  .option-name {
    font-size: 12px;
  }
}
</style>