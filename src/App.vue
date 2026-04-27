<template>
  <div class="app-container">
    <!-- Global Prompt Alert / Warning -->
    <GlobalPromptAlert ref="globalPromptAlert" />

    <!-- Profile Modal -->
    <ProfileModal ref="profileModal" />

    <!-- Conditionally show layout based on route -->
    <template v-if="showLayout">
      <!-- Main Layout with Sidebar and Topbar -->
      <div class="app-layout">
        <!-- Sidebar Navigation -->
        <Sidebar />

        <!-- Main Content Area -->
        <div class="main-content-wrapper">
          <!-- Top Navbar -->
          <TopNavbar @open-profile-modal="openProfileModal" @toggle-mobile-menu="toggleMobileMenu"
            @open-notifications="openNotificationsModal" />

          <!-- ROUTER VIEW -->
          <router-view @open-request-leave="openRequestLeaveModal"></router-view>
        </div>
      </div>
    </template>

    <!-- Full-page layout for login (no sidebar/topbar) -->
    <template v-else>
      <router-view></router-view>
    </template>

    <!-- Modals (these can stay outside since they're overlay components) -->
    <ModalUserCreation ref="newUserModal" :show="showUserModal" :editing-user="editingUserData" @close="closeUserModal"
      @save="handleUserSave" />

    <ModalRoleCreation ref="newRoleModal" :show="showRoleModal" :editing-role="editingRoleData" @close="closeRoleModal"
      @save="handleRoleSave" />

    <ModalNotifications ref="notificationsModalRef" />

    <!-- Request Leave Modal -->
    <RequestLeaveModal v-if="showRequestLeaveModal" :show="showRequestLeaveModal" :annual-balance="annualLeaveBalance"
      @close="closeRequestLeaveModal" @submit="handleGlobalLeaveRequest" />

    <!-- New Claim Modal - Moved from LeaveDashboard to be global -->
    <NewClaimModal v-if="showNewClaimModal" :is-visible="showNewClaimModal" :claim-types="globalClaimTypes"
      @close="closeNewClaimModal" @submit="handleNewClaimSubmit" />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from "vue";
import { useRoute } from "vue-router";
import { useToast } from "vue-toastification";
import ProfileModal from "./components/ProfileModal.vue";
import Sidebar from "./components/Sidebar.vue";
import TopNavbar from "./components/TopNavbar.vue";
import ModalUserCreation from "./components/accessControl/ModalUserCreation.vue";
import ModalRoleCreation from "./components/accessControl/ModalRoleCreation.vue";
import ModalNotifications from "./components/ModalNotifications.vue";
import { useTheme } from "./composables/useTheme";
import GlobalPromptAlert from "./components/GlobalPromptAlert.vue";
import RequestLeaveModal from './views/modules/leaveTracker/RequestLeaveModal.vue';
import NewClaimModal from "./views/modules/leaveTracker/claim/NewClaimModal.vue";
import { generateLeaveTypeCSS } from './utils/leaveTypes';

export default {
  name: "App",
  components: {
    ProfileModal,
    Sidebar,
    TopNavbar,
    ModalUserCreation,
    ModalRoleCreation,
    ModalNotifications,
    GlobalPromptAlert,
    RequestLeaveModal,
    NewClaimModal,
  },

  setup() {
    const route = useRoute();
    const toast = useToast();

    // Refs for modal visibility and data
    const showUserModal = ref(false);
    const showRoleModal = ref(false);
    const showRequestLeaveModal = ref(false);
    const showNewClaimModal = ref(false);
    const editingRoleData = ref(null);
    const editingUserData = ref(null);
    const annualLeaveBalance = ref(18); // Initial balance

    // Global claim types configuration
    const globalClaimTypes = ref({
      TRV: { name: 'Transportation', icon: 'directions_car', category: 'Travel', color: 'blue' },
      MEAL: { name: 'Meal Allowance', icon: 'restaurant', category: 'Food', color: 'green' },
      MED: { name: 'Medical', icon: 'medical_services', category: 'Healthcare', color: 'red' },
      OFF: { name: 'Office Supplies', icon: 'inventory_2', category: 'Supplies', color: 'orange' },
      TEL: { name: 'Telephone', icon: 'phone', category: 'Communication', color: 'purple' }
    });

    // Template refs
    const profileModal = ref(null);
    const newUserModal = ref(null);
    const newRoleModal = ref(null);
    const notificationsModalRef = ref(null);
    const globalPromptAlert = ref(null);

    const { initTheme } = useTheme();

    // COMPUTED: Determine if layout should be shown
    const showLayout = computed(() => {
      return route.meta.requiresLayout !== false &&
        route.meta.hideLayout !== true;
    });

    const style = document.createElement('style');
    style.textContent = generateLeaveTypeCSS();
    document.head.appendChild(style);

    // Methods for opening modals
    const openProfileModal = () => {
      console.log("openProfileModal called in App.vue");
      if (profileModal.value) {
        console.log("profileModal ref found, calling open()");
        profileModal.value.open();
      } else {
        console.error("profileModal ref is null!");
      }
    };

    const toggleMobileMenu = () => {
      console.log("Toggle mobile menu");
    };

    // Open request leave modal
    const openRequestLeaveModal = () => {
      console.log('Opening request leave modal');
      showRequestLeaveModal.value = true;
    };

    // Open new claim modal - now global
    const openNewClaimModal = (event) => {
      console.log('Opening new claim modal from event:', event);
      showNewClaimModal.value = true;
    };

    const openNotificationsModal = () => {
      if (notificationsModalRef.value) {
        notificationsModalRef.value.open();
      }
    };

    // Close modals
    const closeUserModal = () => {
      showUserModal.value = false;
      editingUserData.value = null;
    };

    const closeRoleModal = () => {
      showRoleModal.value = false;
      editingRoleData.value = null;
    };

    const closeRequestLeaveModal = () => {
      showRequestLeaveModal.value = false;
    };

    const closeNewClaimModal = () => {
      showNewClaimModal.value = false;
    };

    // Create a toast with title and message
    const showToast = (type, title, message, duration = 4000) => {
      const htmlContent = `<div class="toast-title">${title}</div>
                           <div class="toast-message">${message}</div>`;
      
      const options = {
        timeout: duration,
        icon: false // We use custom icons from CSS
      };

      switch(type) {
        case 'success':
          toast.success(htmlContent, options);
          break;
        case 'error':
          toast.error(htmlContent, { ...options, timeout: 5000 });
          break;
        case 'warning':
          toast.warning(htmlContent, { ...options, timeout: 4500 });
          break;
        case 'info':
          toast.info(htmlContent, options);
          break;
        default:
          toast(htmlContent, options);
      }
    };

    // Handle user save from modal
    const handleUserSave = async (userData) => {
      try {
        console.log('User saved from modal in App.vue:', userData);
        
        // Show loading toast
        const loadingToast = toast.info('Saving user data...', {
          timeout: false,
          closeButton: false
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove loading toast
        toast.dismiss(loadingToast);
        
        // Show success toast
        if (editingUserData.value) {
          showToast('success', 'User Updated', `User "${userData.name}" updated successfully`);
        } else {
          showToast('success', 'User Created', `User "${userData.name}" created successfully`);
        }
        
        showUserModal.value = false;
        editingUserData.value = null;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('user-saved', { detail: userData }));
        
      } catch (error) {
        showToast('error', 'Error', `Failed to save user: ${error.message || 'Unknown error'}`);
      }
    };

    // Handle role save from modal
    const handleRoleSave = async (roleData) => {
      try {
        console.log('Role saved from modal in App.vue:', roleData);
        
        // Show loading toast
        const loadingToast = toast.info('Saving role data...', {
          timeout: false,
          closeButton: false
        });
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Remove loading toast
        toast.dismiss(loadingToast);
        
        // Show success toast
        if (editingRoleData.value) {
          showToast('success', 'Role Updated', `Role "${roleData.name}" updated successfully`);
        } else {
          showToast('success', 'Role Created', `Role "${roleData.name}" created successfully`);
        }
        
        showRoleModal.value = false;
        editingRoleData.value = null;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('role-saved', { detail: roleData }));
        
      } catch (error) {
        showToast('error', 'Error', `Failed to save role: ${error.message || 'Unknown error'}`);
      }
    };

    // Handle global leave request submission
    const handleGlobalLeaveRequest = async (requestData) => {
      try {
        console.log('Global leave request submitted:', requestData);

        // Use toast.promise for loading state
        await toast.promise(
          new Promise(resolve => {
            // Simulate API call
            setTimeout(() => {
              if (requestData.type === 'annual') {
                annualLeaveBalance.value -= requestData.duration;
              }
              resolve();
            }, 1500);
          }),
          {
            pending: {
              render() {
                return `<div class="toast-title">Processing</div>
                        <div class="toast-message">Submitting leave request...</div>`;
              },
              icon: false
            },
            success: {
              render() {
                return `<div class="toast-title">Success</div>
                        <div class="toast-message">Leave request submitted for ${requestData.duration} day(s)</div>`;
              },
              icon: false
            },
            error: {
              render() {
                return `<div class="toast-title">Error</div>
                        <div class="toast-message">Failed to submit leave request</div>`;
              },
              icon: false
            }
          }
        );

        showRequestLeaveModal.value = false;
        
        // Dispatch event
        window.dispatchEvent(new CustomEvent('leave-request-submitted', { detail: requestData }));

      } catch (error) {
        showToast('error', 'Error', `Failed to submit leave request: ${error.message || 'Unknown error'}`);
      }
    };

    // Handle global claim submission
    const handleNewClaimSubmit = async (claimData) => {
      try {
        console.log('Global claim submitted:', claimData);
        
        // Use toast.promise for loading state
        await toast.promise(
          new Promise(resolve => {
            // Simulate API call
            setTimeout(() => {
              resolve();
            }, 1500);
          }),
          {
            pending: {
              render() {
                return `<div class="toast-title">Processing</div>
                        <div class="toast-message">Submitting claim...</div>`;
              },
              icon: false
            },
            success: {
              render() {
                return `<div class="toast-title">Success</div>
                        <div class="toast-message">Claim for ${claimData.amount} submitted</div>`;
              },
              icon: false
            },
            error: {
              render() {
                return `<div class="toast-title">Error</div>
                        <div class="toast-message">Failed to submit claim</div>`;
              },
              icon: false
            }
          }
        );
        
        showNewClaimModal.value = false;

        // Dispatch global event
        window.dispatchEvent(new CustomEvent('claim-submitted', {
          detail: claimData
        }));

      } catch (error) {
        showToast('error', 'Error', `Failed to submit claim: ${error.message || 'Unknown error'}`);
      }
    };

    // Handle global events from child components
    const handleGlobalEvents = () => {
      // New user modal events
      window.addEventListener('open-new-user-modal', openNewUserModal);
      window.addEventListener('edit-user', openNewUserModal);

      // New role modal events
      window.addEventListener('open-new-role-modal', openNewRoleModal);
      window.addEventListener('edit-role', openNewRoleModal);

      // Request leave modal event
      window.addEventListener('open-request-leave-modal', openRequestLeaveModal);

      // New claim modal event - now global
      window.addEventListener('open-new-claim-modal', openNewClaimModal);

      // Notifications modal event
      window.addEventListener('open-notifications-modal', openNotificationsModal);
      
      // Global toast events (for child components)
      window.addEventListener('show-toast', (event) => {
        const { type = 'info', title = '', message = '', duration = 4000 } = event.detail || {};
        showToast(type, title, message, duration);
      });
      
      window.addEventListener('show-success-toast', (event) => {
        const { title = 'Success', message = '', duration = 4000 } = event.detail || {};
        showToast('success', title, message, duration);
      });
      
      window.addEventListener('show-error-toast', (event) => {
        const { title = 'Error', message = '', duration = 5000 } = event.detail || {};
        showToast('error', title, message, duration);
      });
      
      window.addEventListener('show-warning-toast', (event) => {
        const { title = 'Warning', message = '', duration = 4500 } = event.detail || {};
        showToast('warning', title, message, duration);
      });
      
      window.addEventListener('show-info-toast', (event) => {
        const { title = 'Info', message = '', duration = 3500 } = event.detail || {};
        showToast('info', title, message, duration);
      });
    };

    // Helper methods for opening modals (needed for event listeners)
    const openNewUserModal = (event) => {
      console.log('Opening user modal from event:', event);
      const userData = event?.detail || null;
      editingUserData.value = userData;
      showUserModal.value = true;
    };

    const openNewRoleModal = (event) => {
      console.log('Opening role modal from event:', event);
      const roleData = event?.detail || null;
      editingRoleData.value = roleData;
      showRoleModal.value = true;
    };

    const cleanupGlobalEvents = () => {
      window.removeEventListener('open-new-user-modal', openNewUserModal);
      window.removeEventListener('edit-user', openNewUserModal);
      window.removeEventListener('open-new-role-modal', openNewRoleModal);
      window.removeEventListener('edit-role', openNewRoleModal);
      window.removeEventListener('open-request-leave-modal', openRequestLeaveModal);
      window.removeEventListener('open-new-claim-modal', openNewClaimModal);
      window.removeEventListener('open-notifications-modal', openNotificationsModal);
      window.removeEventListener('show-toast');
      window.removeEventListener('show-success-toast');
      window.removeEventListener('show-error-toast');
      window.removeEventListener('show-warning-toast');
      window.removeEventListener('show-info-toast');
    };

    onMounted(() => {
      initTheme();
      handleGlobalEvents();

      // Show welcome toast
      setTimeout(() => {
        showToast('info', 'System Ready', 'Welcome to PMO Management System', 4000);
      }, 1500);

      // Keyboard shortcuts
      document.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "t") {
          e.preventDefault();
          window.themeManager?.toggleTheme();
        }

        // Add Esc key to close modals
        if (e.key === "Escape") {
          if (showUserModal.value) closeUserModal();
          if (showRoleModal.value) closeRoleModal();
          if (showRequestLeaveModal.value) closeRequestLeaveModal();
          if (showNewClaimModal.value) closeNewClaimModal();
          
          // Clear all toasts on double Escape
          if (e.repeat) {
            toast.clear();
          }
        }
      });
    });

    onUnmounted(() => {
      cleanupGlobalEvents();
    });

    // Expose toast globally for debugging
    window.$toast = toast;

    // Expose methods to template
    return {
      // Computed
      showLayout,

      // Template refs
      profileModal,
      newUserModal,
      newRoleModal,
      notificationsModalRef,
      globalPromptAlert,

      // Modal states
      showUserModal,
      showRoleModal,
      showRequestLeaveModal,
      showNewClaimModal,
      editingUserData,
      editingRoleData,
      annualLeaveBalance,
      globalClaimTypes,

      // Methods
      openProfileModal,
      toggleMobileMenu,
      openNewClaimModal,
      openNotificationsModal,
      closeUserModal,
      closeRoleModal,
      closeRequestLeaveModal,
      closeNewClaimModal,
      handleUserSave,
      handleRoleSave,
      handleGlobalLeaveRequest,
      handleNewClaimSubmit,
    };
  },
};
</script>

<style>
@import "./styles/shared/globals.css";
@import "./styles/shared/tailwind.css";

/* Optional: Add backdrop for modal */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>