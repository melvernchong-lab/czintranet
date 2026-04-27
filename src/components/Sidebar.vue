<template>
  <!-- Sidebar Component -->
  <aside id="sidebar" class="sidebar" :class="{
    'sidebar-collapsed': isCollapsed && !isMobile,
    'sidebar-open': isMobileOpen,
  }" @click="handleSidebarClick">
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-brand">
        <div class="sidebar-logo">
          <span class="material-symbols-outlined sidebar-logo-icon">admin_panel_settings</span>
        </div>
        <div class="sidebar-text">
          <h1 class="sidebar-title">Admin Console</h1>
        </div>
      </div>
      <button v-if="!isMobile" id="sidebarToggle" class="sidebar-toggle" @click="toggleSidebar"
        aria-label="Toggle sidebar">
        <span class="material-symbols-outlined sidebar-toggle-icon">
          {{ isCollapsed ? "chevron_right" : "chevron_left" }}
        </span>
      </button>
      <button v-else-if="isMobileOpen" id="sidebarClose" class="sidebar-toggle" @click="closeMobileSidebar"
        aria-label="Close sidebar">
        <span class="material-symbols-outlined sidebar-toggle-icon">close</span>
      </button>
    </div>

    <!-- Sidebar Navigation -->
    <nav class="sidebar-nav">
      <router-link to="/dashboard" class="sidebar-item"
        :class="{ 'sidebar-item-active': currentRoute === '/dashboard' }" @click="closeAllDropdowns">
        <span class="material-symbols-outlined sidebar-item-icon">dashboard</span>
        <span class="sidebar-item-text">Dashboard</span>
      </router-link>

      <router-link to="/access-management" class="sidebar-item"
        :class="{ 'sidebar-item-active': currentRoute === '/access-management' }" @click="closeAllDropdowns">
        <span class="material-symbols-outlined sidebar-item-icon">group</span>
        <span class="sidebar-item-text">Access Control</span>
      </router-link>

      <router-link to="/Wiki" class="sidebar-item" :class="{ 'sidebar-item-active': currentRoute === '/Wiki' }"
        @click="closeAllDropdowns">
        <span class="material-symbols-outlined sidebar-item-icon">hub</span>
        <span class="sidebar-item-text">Wiki</span>
      </router-link>

      <!-- Projects Dropdown - UPDATED WITH SIMPLIFIED ROUTES -->
      <div class="sidebar-group">
        <div class="sidebar-group-header" :class="{ 'sidebar-group-open': isProjectsOpen }"
          @click="toggleProjectsDropdown">
          <span class="material-symbols-outlined sidebar-item-icon">work</span>
          <span class="sidebar-item-text">My Workspace</span>
          <span class="material-symbols-outlined sidebar-group-arrow">
            {{ isProjectsOpen ? "expand_less" : "chevron_right" }}
          </span>
        </div>

        <!-- Projects Submenu -->
        <div v-show="isProjectsOpen" class="sidebar-submenu">
          <!-- My Workspace (pmo dashboard view) -->
          <router-link to="/pmo-dashboard" class="sidebar-submenu-item" :class="{
            'sidebar-submenu-item-active': $route.path === '/pmo-dashboard' || 
              $route.path.startsWith('/pmo-dashboard/'),
          }" >
            <span class="material-symbols-outlined sidebar-submenu-icon"> dashboard</span>
            <span class="sidebar-submenu-text">PMO Dashboard</span>
          </router-link>
        </div>

        <div v-show="isProjectsOpen" class="sidebar-submenu">
          <!-- My Workspace (Main projects view) -->
          <router-link to="/projects" class="sidebar-submenu-item" :class="{
            'sidebar-submenu-item-active': $route.path === '/projects' || 
              $route.path.startsWith('/projects/'),
          }" >
            <span class="material-symbols-outlined sidebar-submenu-icon">folder_open</span>
            <span class="sidebar-submenu-text">My Projects</span>
          </router-link>
        </div>
      </div>

      <!-- Leave -->
      <router-link to="/leave" class="sidebar-item" :class="{ 'sidebar-item-active': currentRoute === '/leave' }"
        @click="closeAllDropdowns">
        <span class="material-symbols-outlined sidebar-item-icon">event_available</span>
        <span class="sidebar-item-text">My Schedule & Claim</span>
      </router-link>

      <router-link to="/analytics" class="sidebar-item"
        :class="{ 'sidebar-item-active': currentRoute === '/analytics' }" @click="closeAllDropdowns">
        <span class="material-symbols-outlined sidebar-item-icon">analytics</span>
        <span class="sidebar-item-text">Analytic Report</span>
      </router-link>
    </nav>

    <!-- Sidebar Footer -->
    <div class="sidebar-footer">
      <button id="logoutButton" class="sidebar-logout" @click="logout" aria-label="Logout">
        <span class="material-symbols-outlined sidebar-logout-icon">logout</span>
        <span class="sidebar-logout-text">Logout</span>
      </button>
    </div>
  </aside>

  <!-- Mobile Backdrop (only visible on mobile when sidebar is open) -->
  <div v-if="isMobile && isMobileOpen" class="sidebar-backdrop" @click="closeMobileSidebar"></div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, computed } from "vue"
import { useRoute } from "vue-router"
import "./../styles/shared/topbar-sidebar.css"

export default {
  name: "Sidebar",

  props: {
    mobileOpen: {
      type: Boolean,
      default: false,
    },
  },

  emits: ["update:mobileOpen"],

  setup(props, { emit }) {
    const route = useRoute();
    const isCollapsed = ref(localStorage.getItem("sidebar-collapsed") === "true");
    const isMobile = ref(false);
    const isMobileOpen = ref(false);
    const isProjectsOpen = ref(false);

    // Computed property for current route
    const currentRoute = computed(() => route.path);

    // Initialize sidebar state
    onMounted(() => {
      console.log("📱 Sidebar mounted");
      console.log("📍 Current route:", route.path);

      checkMobile();
      window.addEventListener("resize", checkMobile);

      // Load saved state
      const savedState = localStorage.getItem("sidebar-collapsed");
      if (savedState !== null) {
        isCollapsed.value = savedState === "true";
      }
    });

    onUnmounted(() => {
      window.removeEventListener("resize", checkMobile);
    });

    // Watch for mobileOpen prop changes
    watch(
      () => props.mobileOpen,
      (newVal) => {
        console.log("📱 Mobile open prop changed:", newVal);
        isMobileOpen.value = newVal;
      }
    );

    // Watch for route changes on mobile
    watch(
      () => route.path,
      () => {
        console.log("🔄 Route changed to:", route.path);
        if (isMobile.value) {
          closeMobileSidebar();
        }
      }
    );

    // Auto-open projects dropdown when on any projects route
    watch(
      () => route.path,
      (newPath) => {
        console.log("📍 Watching route path:", newPath);
        if (newPath.startsWith("/projects")) {
          console.log("🚀 Auto-opening Projects dropdown (projects route detected)");
          isProjectsOpen.value = true;
        }
      },
      { immediate: true }
    );

    // Close all dropdowns
    const closeAllDropdowns = () => {
      console.log("🗂️ Closing all dropdowns");

      // Close Projects dropdown if it's open
      if (isProjectsOpen.value) {
        isProjectsOpen.value = false;
        console.log("📂 Projects dropdown closed");
      }

      // Close mobile sidebar if on mobile
      if (isMobile.value) {
        closeMobileSidebar();
      }
    };

    const toggleProjectsDropdown = (event) => {
      console.log("🖱️ Projects dropdown clicked!");

      // Stop propagation to prevent closeAllDropdowns from being called
      event.stopPropagation();

      isProjectsOpen.value = !isProjectsOpen.value;
      console.log("📊 After toggle - isProjectsOpen:", isProjectsOpen.value);
    };

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      console.log("📱 Checking mobile:", mobile, "Width:", window.innerWidth);
      isMobile.value = mobile;
      if (!isMobile.value) {
        isMobileOpen.value = false;
        emit("update:mobileOpen", false);
      }
    };

    const toggleSidebar = () => {
      console.log("🔄 Toggling sidebar");

      if (isMobile.value) {
        // On mobile, toggle the mobile sidebar
        isMobileOpen.value = !isMobileOpen.value;
        emit("update:mobileOpen", isMobileOpen.value);
      } else {
        // On desktop, toggle collapsed state
        isCollapsed.value = !isCollapsed.value;
        localStorage.setItem("sidebar-collapsed", isCollapsed.value);

        // Dispatch event for other components (like main content)
        window.dispatchEvent(
          new CustomEvent("sidebar-toggle", {
            detail: { collapsed: isCollapsed.value },
          })
        );
      }
    };

    const closeMobileSidebar = () => {
      console.log("📱 Closing mobile sidebar");
      if (isMobile.value) {
        isMobileOpen.value = false;
        emit("update:mobileOpen", false);
      }
    };

    const handleSidebarClick = (event) => {
      // Prevent click from bubbling to backdrop on mobile
      event.stopPropagation();
    };

    const logout = async () => {
      try {
        const confirmed = await window.globalModal.confirm(
          "Are you sure you want to logout?",
          "Confirm Logout",
          {
            confirmText: "Logout",
            cancelText: "Cancel",
            icon: "logout",
          }
        );

        if (confirmed) {
          localStorage.clear();
          window.location.href = "/login";
        }
      } catch (error) {
        console.error("Logout error:", error);
      }
    };

    return {
      isProjectsOpen,
      isCollapsed,
      isMobile,
      isMobileOpen,
      currentRoute,
      toggleSidebar,
      toggleProjectsDropdown,
      closeAllDropdowns,
      closeMobileSidebar,
      handleSidebarClick,
      logout,
    };
  },
};
</script>