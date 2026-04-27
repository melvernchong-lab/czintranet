<template>
  <div>
    <!-- Modal Backdrop -->
    <div v-if="isOpen" class="modal-backdrop" @click="close"></div>

    <!-- Profile Modal -->
    <div v-if="isOpen" ref="modal" class="profile-modal">
      <div class="profile-modal-content">
        <!-- Profile Header -->
        <div class="profile-header">
          <div class="profile-avatar-large" :style="{ backgroundImage: `url(${profile.avatar})` }"></div>
          <div class="profile-info">
            <h3 class="profile-name">{{ profile.name }}</h3>
            <p class="profile-role role-admin">{{ profile.role }}</p>
            <p class="profile-email">{{ profile.email }}</p>
          </div>
        </div>

        <!-- Profile Details -->
        <div class="profile-details">
          <div class="detail-item">
            <span class="detail-icon material-symbols-outlined">badge</span>
            <div class="detail-text">
              <p class="detail-label">Employee ID</p>
              <p class="detail-value">{{ profile.employeeId }}</p>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-icon material-symbols-outlined">business</span>
            <div class="detail-text">
              <p class="detail-label">Department</p>
              <p class="detail-value">{{ profile.department }}</p>
            </div>
          </div>
          <div class="detail-item">
            <span class="detail-icon material-symbols-outlined">calendar_month</span>
            <div class="detail-text">
              <p class="detail-label">Last Active</p>
              <p class="detail-value">{{ profile.lastActive }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="profile-actions">
          <button @click="onViewProfile" class="profile-action-btn">
            <span class="action-icon material-symbols-outlined">person</span>
            <span class="action-text">View Profile</span>
          </button>
          <button @click="onSettings" class="profile-action-btn">
            <span class="action-icon material-symbols-outlined">settings</span>
            <span class="action-text">Account Settings</span>
          </button>
          <button @click="onSecurity" class="profile-action-btn">
            <span class="action-icon material-symbols-outlined">shield</span>
            <span class="action-text">Security</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'ProfileModal',
  
  props: {
    show: {
      type: Boolean,
      default: false
    }
  },
  
  setup(props, { emit }) {
    const isOpen = ref(props.show)
    const modal = ref(null)
    
    const profile = ref({
      name: 'Alex Rivera',
      role: 'Super Admin',
      email: 'alex.rivera@company.com',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAGAXe1JYcNgS8tSCtKFX-MOziWe0H6etylQrQSj1h-wRkJViT_vsKBfCQ-2GKLaNwLPZGpk2Dl5Wy6pvHR66Ap7ji_NL2yf833D3TM-PNoajCc4s-QgodJYBmwhq11OBxclJjiyMJIaRZRI8AhAIlwuIckGNarGRom6gmzJBhUkRdshcHL1-v1CmeJzFYcZZiMW1n2zcgMIbR2hwsrlZJSVqt9V2KYXttSvAVgi9ORfoQO13KcvZfxK4bn65-G1K1oK-Wccg5irk8',
      employeeId: 'ADM-00145',
      department: 'IT Administration',
      lastActive: 'Just now'
    })
    
    const open = () => {
      console.log('ProfileModal.open() called');
      isOpen.value = true
      document.addEventListener('click', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
      emit('open')
    }
    
    const close = () => {
      isOpen.value = false
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      emit('close')
    }
    
    const handleClickOutside = (event) => {
      if (modal.value && !modal.value.contains(event.target) && 
          !event.target.closest('.user-avatar')) {
        close()
      }
    }
    
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen.value) {
        close()
      }
    }
    
    const onViewProfile = () => {
      emit('view-profile')
      close()
    }
    
    const onSettings = () => {
      emit('account-settings')
      close()
    }
    
    const onSecurity = () => {
      emit('security')
      close()
    }
    
    // Watch for prop changes
    onMounted(() => {
      if (props.show) {
        open()
      }
    })
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    })
    
    return {
      isOpen,
      modal,
      profile,
      open,
      close,
      onViewProfile,
      onSettings,
      onSecurity
    }
  },
  
  watch: {
    show(newVal) {
      if (newVal) {
        this.open()
      } else {
        this.close()
      }
    }
  }
}
</script>