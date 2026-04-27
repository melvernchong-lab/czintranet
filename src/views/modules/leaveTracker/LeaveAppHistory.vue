<template>
  <div class="application-history-section">
    <!-- Application History -->
    <div class="leave-section-card">
      <div class="leave-section-header">
        <h3 class="leave-section-title">Application History</h3>
        <div class="leave-section-actions">
          <button @click="$emit('view-all')" class="view-all-btn">View All</button>
          <button @click="$emit('open-filter')" class="filter-btn">
            <span class="material-symbols-outlined">filter_list</span>
          </button>
        </div>
      </div>

      <div class="table-container">
        <div class="compact-table">
          <div class="table-header-row-lg">
            <div class="table-header-cell">Leave Type</div>
            <div class="table-header-cell">Details / Dates</div>
            <div class="table-header-cell">Days</div>
            <div class="table-header-cell">Status</div>
            <div class="table-header-cell">Action</div>
          </div>

          <div class="table-body">
            <div v-for="application in paginatedApplications" :key="application.id" class="table-row-lg">
              <div class="table-cell">
                <div class="user-info-combined">
                  <div class="type-icon-wrapper" :class="typeClass(application.type)">
                    <span class="material-symbols-outlined">{{ icon(application.type) }}</span>
                  </div>
                  <div class="type-info">
                    <span class="type-name">{{ applicationTypeDisplay(application.type) }}</span>
                    <span class="type-category">{{ leaveCategory(application.type) }}</span>
                  </div>
                </div>
              </div>

              <div class="table-cell">
                <div class="date-info-wrapper">
                  <div class="date-info">
                    <span class="date-range">{{ dateRange(application.startDate, application.endDate) }}</span>
                  </div>
                  <div class="data-reason">
                    <span class="date-reason">{{ application.reason || 'Personal' }}</span>
                  </div>
                </div>
              </div>

              <div class="table-cell">
                <span class="days-value">{{ application.days }} day{{ application.days > 1 ? 's' : '' }}</span>
              </div>

              <div class="table-cell">
                <span class="status-badge" :class="statusClass(application.status)">
                  {{ statusDisplay(application.status) }}
                </span>
              </div>

              <div class="table-cell">
                <ActionButton :items="actionMenuItems(application)" :contextData="application"
                  :dropdownPosition="'bottom-end'" :dropdownWidth="'200px'"
                  @action-click="$emit('action-click', $event)" />
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="applications.length === 0" class="empty-state">
            <span class="material-symbols-outlined empty-icon">description</span>
            <p class="empty-message">No leave applications found</p>
          </div>
        </div>
      </div>
      
      <!-- Pagination Footer -->
      <div class="card-footer" v-if="applications.length > 0">
        <span class="footer-text">
          Showing {{ paginationStart }} to {{ paginationEnd }} of {{ applications.length }} applications
        </span>
        <div class="pagination">
          <button class="pagination-btn" @click="prevPage" :disabled="currentPage === 1">
            <span class="material-symbols-outlined icon-xs">chevron_left</span>
          </button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
            <span class="material-symbols-outlined icon-xs">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ActionButton from "./../../../components/ActionMenuBtn.vue";
import {
  normalizeLeaveType,
  getLeaveTypeConfig,
  getStatusConfig,
  getLeaveTypeIcon,
  getLeaveTypeClass,
  getLeaveTypeCategory
} from '../../../utils/leaveTypes';

export default {
  name: 'ApplicationHistory',
  components: {
    ActionButton
  },
  props: {
    applications: {
      type: Array,
      required: true,
      default: () => []
    },
    maxVisible: {
      type: Number,
      default: 5
    },
    // Utility function props
    getApplicationTypeDisplay: {
      type: Function,
      default: null
    },
    getStatusDisplay: {
      type: Function,
      default: null
    },
    getIcon: {
      type: Function,
      default: null
    },
    getTypeClass: {
      type: Function,
      default: null
    },
    getLeaveCategory: {
      type: Function,
      default: null
    },
    getStatusClass: {
      type: Function,
      default: null
    },
    formatDateRange: {
      type: Function,
      default: null
    },
    getActionMenuItems: {
      type: Function,
      default: null
    }
  },
  emits: ['view-all', 'open-filter', 'action-click'],
  data() {
    return {
      currentPage: 1,
      itemsPerPage: 5 // You can make this a prop if needed
    };
  },
  computed: {
    // Pagination computed properties
    totalPages() {
      return Math.ceil(this.applications.length / this.itemsPerPage);
    },

    paginatedApplications() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.applications.slice(start, end);
    },

    paginationStart() {
      if (this.applications.length === 0) return 0;
      return (this.currentPage - 1) * this.itemsPerPage + 1;
    },

    paginationEnd() {
      const end = this.currentPage * this.itemsPerPage;
      return Math.min(end, this.applications.length);
    }
  },
  watch: {
    // Reset to first page when applications array changes (filtering, etc.)
    applications: {
      handler() {
        this.currentPage = 1;
      },
      deep: false
    }
  },
  methods: {
    // Pagination methods
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },

    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
      }
    },

    // Use provided utility functions or fallback to internal ones
    applicationTypeDisplay(typeId) {
      return this.getApplicationTypeDisplay
        ? this.getApplicationTypeDisplay(typeId)
        : normalizeLeaveType(typeId);
    },

    statusDisplay(statusId) {
      return this.getStatusDisplay
        ? this.getStatusDisplay(statusId)
        : (getStatusConfig(statusId)?.name || statusId);
    },

    icon(typeId) {
      return this.getIcon
        ? this.getIcon(typeId)
        : getLeaveTypeIcon(typeId);
    },

    typeClass(typeId) {
      return this.getTypeClass
        ? this.getTypeClass(typeId)
        : getLeaveTypeClass(typeId);
    },

    leaveCategory(typeId) {
      return this.getLeaveCategory
        ? this.getLeaveCategory(typeId)
        : getLeaveTypeCategory(typeId);
    },

    statusClass(statusId) {
      if (this.getStatusClass) {
        return this.getStatusClass(statusId);
      }
      const statusConfig = getStatusConfig(statusId);
      return statusConfig ? statusConfig.id : 'default';
    },

    dateRange(startDate, endDate) {
      if (this.formatDateRange) {
        return this.formatDateRange(startDate, endDate);
      }

      if (!startDate || !endDate) return '';
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.getTime() === end.getTime()) {
        return start.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('default', { month: 'short' })}, ${start.getFullYear()}`;
      }

      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    },

    actionMenuItems(application) {
      if (this.getActionMenuItems) {
        return this.getActionMenuItems(application);
      }

      // Fallback default action menu
      return [
        {
          label: 'View Details',
          icon: 'visibility',
          action: 'view_details',
        },
        {
          label: 'Edit',
          icon: 'edit',
          action: 'edit',
          disabled: !['pending', 'approved'].includes(application.status),
        },
        {
          label: 'Cancel Request',
          icon: 'cancel',
          action: 'cancel',
          danger: true,
          disabled: !['pending', 'approved'].includes(application.status),
        },
        { divider: true },
        {
          label: 'Share',
          icon: 'share',
          action: 'share',
        }
      ];
    }
  }
}
</script>

<style scoped>
@import "../../../styles/views/Leave/LeaveAppHistory.css";
</style>