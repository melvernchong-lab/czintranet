<template>
  <div class="admin-dashboard">
    <!-- Stats Grid -->
    <div class="dashboard-stats-grid">
      <DashboardCard
        title="Total Active Users"
        value="12,458"
        icon="groups"
        icon-color="text-primary"
        trend="+12%"
        trend-positive="true"
      />

      <APICard 
        api-usage="85%"
        api-calls="245,892"
      />

      <DashboardCard
        title="Storage Utilization"
        value="74.2%"
        icon="database"
        icon-color="text-amber-500"
        :show-progress="true"
        progress-width="74%"
        subtext="1.4 TB of 2.0 TB used"
      />

      <DashboardCard
        title="System Uptime"
        value="99.98%"
        icon="speed"
        icon-color="text-primary"
        subtext="Last downtime: 24d ago"
      />
    </div>

    <!-- Main Content Grid -->
    <div class="dashboard-content-grid">
      <div class="dashboard-main-section">
        <UserManagementTable />
      </div>

      <div class="dashboard-sidebar">
        <QuickConfigurationPanel />
      </div>
    </div>
  </div>
</template>

<script>
import DashboardCard from "../../../components/dashboard/adminDashboard/DashboardCard.vue";
import APICard from "../../../components/dashboard/adminDashboard/APICard.vue";
import UserManagementTable from "../../../components/dashboard/adminDashboard/UserManagementTable.vue";
import QuickConfigurationPanel from "../../../components/dashboard/adminDashboard/QuickConfigurationPanel.vue";


export default {
  name: "AdminDashboard",
  components: {
    DashboardCard,
    APICard,
    UserManagementTable,
    QuickConfigurationPanel,
  },
};
</script>

<style scoped>
  @import "../../../styles/views/dashboard/adminDashboard.css";
</style>