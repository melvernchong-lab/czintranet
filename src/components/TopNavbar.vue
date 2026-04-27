<template>
  <header class="topbar">
    <!-- Mobile menu toggle -->
    <button @click="toggleMobileMenu" class="mobile-menu-toggle">
      <span class="material-symbols-outlined">menu</span>
    </button>

    <div class="topbar-actions">

      <!-- Theme Quick Toggle -->
      <button @click="toggleTheme" class="topbar-button" title="Toggle theme">
        <span class="material-symbols-outlined">{{ themeIcon }}</span>
      </button>

      <!-- Notifications -->
      <button @click="openNotifications" class="topbar-button">
        <span class="material-symbols-outlined">notifications</span>
      </button>

      <!-- Divider -->
      <div class="topbar-divider"></div>

      <!-- User Info -->
      <div class="topbar-user">
        <div class="topbar-user-info">
          <p class="topbar-user-name">Alex Rivera</p>
          <p class="topbar-user-role role-admin">Super Admin</p>
        </div>

        <!-- Avatar -->
        <div
          @click="openProfile"
          class="topbar-user-avatar"
          :style="{
            backgroundImage:
              'url(https://lh3.googleusercontent.com/aida-public/AB6AXuAGAXe1JYcNgS8tSCtKFX-MOziWe0H6etylQrQSj1h-wRkJViT_vsKBfCQ-2GKLaNwLPZGpk2Dl5Wy6pvHR66Ap7ji_NL2yf833D3TM-PNoajCc4s-QgodJYBmwhq11OBxclJjiyMJIaRZRI8AhAIlwuIckGNarGRom6gmzJBhUkRdshcHL1-v1CmeJzFYcZZiMW1n2zcgMIbR2hwsrlZJSVqt9V2KYXttSvAVgi9ORfoQO13KcvZfxK4bn65-G1K1oK-Wccg5irk8)',
          }"
        ></div>
      </div>
    </div>
  </header>
</template>

<script>
import { ref } from "vue";
import { useTheme } from "../composables/useTheme";

export default {
  name: "TopNavbar",
  emits: ["open-profile-modal", "toggle-mobile-menu", "open-notifications"],
  setup(props, { emit }) {
    const searchQuery = ref("");
    const { themeIcon, toggleTheme } = useTheme();

    const onSearch = () => {
      if (searchQuery.value.trim()) {
        console.log("Searching for:", searchQuery.value);
      }
    };

    const openNotifications = () => {
      console.log("Open notifications");
      emit("open-notifications");
    };

    const openProfile = () => {
      console.log("Opening profile modal");
      emit("open-profile-modal");
    };

    const toggleMobileMenu = () => {
      emit("toggle-mobile-menu");
    };

    return {
      searchQuery,
      themeIcon,
      onSearch,
      toggleTheme,
      openNotifications,
      openProfile,
      toggleMobileMenu
    };
  },
};
</script>
