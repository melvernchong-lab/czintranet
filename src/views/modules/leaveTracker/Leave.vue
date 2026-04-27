<template>
  <div class="page-content">
    <div class="header-container">
      <div class="leave-header">
        <!-- Page Header -->
        <div class="leave-title-section">
          <div class="title-wrapper">
            <h1 class="page-title">{{ pageTitle }}</h1>
          </div>
          <div class="page-subtitle">
            <p class="page-subtitle-text">{{ pageSubtitle }}</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="quick-action primary-btn" @click="openRequestLeaveModal">
            <span class="material-symbols-outlined">add</span>
            <span>Request Day Off</span>
          </button>
          <button class="quick-action secondary-btn" @click="openNewClaimModal">
            <span class="material-symbols-outlined">payment</span>
            <span>Submit New Claim</span>
          </button>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="tabs-container">
        <div class="tabs-inner">
          <button @click="switchTab('leave')" :class="['tab', activeTab === 'leave' ? 'tab-active' : '']">
            <span class="material-symbols-outlined icon-medium">schedule</span>
            Schedule My Time
          </button>
          <button @click="switchTab('claim')" :class="['tab', activeTab === 'claim' ? 'tab-active' : '']">
            <span class="material-symbols-outlined icon-medium">payments</span>
            Submit My Claim
          </button>
        </div>
      </div>

      <!-- Leave Dashboard Content -->
      <div v-if="activeTab === 'leave'">
        <!-- Leave Grid Cards -->
        <div class="leave-grid">
          <LeaveGridCard type="AL" :data="annualLeave" detail="Valid until Dec 31, 2024"
            :percentage="annualLeave.percentage" />
          <LeaveGridCard type="OS" :data="{ logged: 42 }" detail="Current Year Activity" :percentage="60" />
          <LeaveGridCard type="MC" :data="{ taken: sickLeave.taken, limit: 10 }" detail="Taken this year"
            :percentage="(sickLeave.taken / 10) * 100" />
        </div>

        <!-- Application History & Sidebar -->
        <div class="content-grid">
          <!-- Left Column - Application History -->
          <div class="history-section">
            <ApplicationHistory :applications="visibleApplications" :max-visible="maxVisibleApplications"
              :show-load-more="hasMoreApplications" :get-application-type-display="getApplicationTypeDisplay"
              :get-status-display="getStatusDisplay" :get-icon="getIcon" :get-type-class="getTypeClass"
              :get-leave-category="getLeaveCategory" :get-status-class="getStatusClass"
              :format-date-range="formatDateRange" :get-action-menu-items="getActionMenuItems"
              @view-all="showAllApplications" @open-filter="openFilterModal" @action-click="handleApplicationAction"
              @load-more="loadMoreApplications" />
          </div>

          <!-- Right Column - Upcoming Leave -->
          <div class="upcoming-section">
            <UpcomingLeaveCard :member="currentUser" :config="upcomingConfig" @view-all-upcoming="handleViewAllUpcoming"
              @event-selected="handleEventSelected" @refresh-requested="handleRefreshRequested" />
          </div>
        </div>

        <TeamCalendar :team-members="teamMembers" @view-full-calendar="viewTeamCalendar" />
      </div>

      <!-- Claim Dashboard Content -->
      <div v-else-if="activeTab === 'claim'">
        <ClaimDashboard :claims="claims" :claim-types="claimTypes" :pagination="pagination"
          @new-claim="openNewClaimModal" @edit-claim="editClaim" @delete-claim="deleteClaim"
          @view-details="viewClaimDetails" />
      </div>
    </div>

    <!-- Modals -->
    <ApplicationDetailsModal v-if="showDetailsModal" :is-visible="showDetailsModal" :application="selectedApplication"
      :get-application-type-display="getApplicationTypeDisplay" :get-status-display="getStatusDisplay"
      :get-icon="getIcon" :get-type-class="getTypeClass" :get-status-class="getStatusClass"
      :get-leave-category="getLeaveCategory" :format-date="formatDate" :format-date-range="formatDateRange"
      @close="closeModal" />

    <ApplicationEditModal v-if="showEditModal" :is-visible="showEditModal" :application="selectedApplication"
      :annual-leave="annualLeave" :get-application-type-display="getApplicationTypeDisplay" :get-icon="getIcon"
      :get-type-class="getTypeClass" :get-leave-category="getLeaveCategory" :format-date-range="formatDateRange"
      @close="closeModal" @save="handleSaveApplication" />

  </div>
</template>

<script>
import TeamCalendar from "./TeamCalendar.vue";
import UpcomingLeaveCard from "./UpcomingLeaveCard.vue";
import LeaveGridCard from "./LeaveGridCard.vue";
import ApplicationHistory from "./LeaveAppHistory.vue";
import ClaimDashboard from "./claim/ClaimApp.vue";
import ActionButton from "./../../../components/ActionMenuBtn.vue";
import ApplicationDetailsModal from "./LeaveAppDetails.vue";
import ApplicationEditModal from "./EditLeaveApp.vue";
import {
  leaveTypes,
  approvalStatuses,
  normalizeLeaveType,
  getLeaveTypeConfig,
  getStatusConfig,
  getLeaveTypeIcon,
  getLeaveTypeColor,
  getLeaveTypeCategory,
  getLeaveTypeClass,
  isValidLeaveType,
  getLeaveTypeAbbreviation
} from '../../../utils/leaveTypes';

export default {
  name: 'LeaveDashboard',
  components: {
    TeamCalendar,
    UpcomingLeaveCard,
    LeaveGridCard,
    ApplicationHistory,
    ClaimDashboard,
    ActionButton,
    ApplicationDetailsModal,
    ApplicationEditModal,
  },
  emits: ['view-full-calendar', 'member-click', 'day-click', 'open-request-leave', 'edit-application', 'show-application-details'],
  data() {
    return {
      activeTab: 'leave', // Default to leave tab

      // Tab titles and subtitles
      pageTitle: 'My Schedule & Claim',
      pageSubtitle: 'Manage your leave, onsite and Claim Planning ',

      leaveTypes,
      approvalStatuses,
      showEditModal: false,
      showDetailsModal: false,
      selectedApplication: null,
      maxVisibleApplications: 5,

      // LEAVE CARD ANALYTIC --- MOCK DATA >>> TO BUILD API FETCH DATA
      annualLeave: {
        balance: 18,
        used: 7,
        total: 25,
        validUntil: 'Dec 31, 2024',
        percentage: 72
      },

      sickLeave: {
        taken: 5,
        pending: 0
      },

      // NEW: Claim data
      claims: [
        {
          id: 1,
          type: 'TRV',
          description: 'Client meeting transportation',
          date: '2024-12-15',
          amount: 45.50,
          status: 'approved',
          receipt: true,
          statusDisplay: 'Approved'
        },
        {
          id: 2,
          type: 'MEAL',
          description: 'Team lunch',
          date: '2024-12-18',
          amount: 25.00,
          status: 'pending',
          receipt: true,
          statusDisplay: 'Pending'
        },
        {
          id: 3,
          type: 'MED',
          description: 'Medical consultation',
          date: '2024-12-10',
          amount: 120.00,
          status: 'approved',
          receipt: true,
          statusDisplay: 'Approved'
        },
        {
          id: 4,
          type: 'TRV',
          description: 'Conference travel',
          date: '2024-12-05',
          amount: 320.75,
          status: 'approved',
          receipt: true,
          statusDisplay: 'Approved'
        },
        {
          id: 5,
          type: 'MEAL',
          description: 'Working dinner',
          date: '2024-12-20',
          amount: 18.50,
          status: 'rejected',
          receipt: false,
          statusDisplay: 'Rejected'
        },
        {
          id: 6,
          type: 'OFF',
          description: 'Office supplies',
          date: '2024-12-12',
          amount: 65.25,
          status: 'pending',
          receipt: true,
          statusDisplay: 'Pending'
        }
      ],

      filteredClaims: [],
      maxVisibleClaims: 5,

      // Claim statistics
      monthlySubmitted: 0,
      monthlyApproved: 0,
      pendingAmount: 0,
      yearlyTotal: 0,

      // Claim types configuration
      claimTypes: {
        TRV: { name: 'Transportation', icon: 'directions_car', category: 'Travel', color: 'blue' },
        MEAL: { name: 'Meal Allowance', icon: 'restaurant', category: 'Food', color: 'green' },
        MED: { name: 'Medical', icon: 'medical_services', category: 'Healthcare', color: 'red' },
        OFF: { name: 'Office Supplies', icon: 'inventory_2', category: 'Supplies', color: 'orange' },
        TEL: { name: 'Telephone', icon: 'phone', category: 'Communication', color: 'purple' }
      },

      // APPLICATION HISTORY --- MOCK DATA >>> TO BUILD API FETCH DATA
      leaveApplications: [
        {
          id: 1,
          type: 'AL',
          startDate: '2024-12-20',
          endDate: '2024-12-24',
          days: 5,
          status: 'rejected',
          reason: 'Holiday break',
        },
        {
          id: 2,
          type: 'OS',
          startDate: '2025-01-15',
          endDate: '2025-01-15',
          days: 1,
          status: 'pending',
          reason: 'Client meeting'
        },
        {
          id: 3,
          type: 'CL',
          startDate: '2024-11-05',
          endDate: '2024-11-05',
          days: 1,
          status: 'approved',
          reason: 'Family emergency'
        },
        {
          id: 4,
          type: 'MC',
          startDate: '2024-10-10',
          endDate: '2024-10-11',
          days: 2,
          status: 'approved',
          reason: 'Sick leave'
        },
        {
          id: 5,
          type: 'WFH',
          startDate: '2024-09-20',
          endDate: '2024-09-20',
          days: 1,
          status: 'approved',
          reason: 'Remote work'
        },
        {
          id: 6,
          type: 'AL',
          startDate: '2024-08-15',
          endDate: '2024-08-16',
          days: 2,
          status: 'approved',
          reason: 'Family vacation'
        },
        {
          id: 7,
          type: 'MC',
          startDate: '2024-07-10',
          endDate: '2024-07-11',
          days: 2,
          status: 'approved',
          reason: 'Medical checkup'
        }
      ],

      filteredApplications: [],

      // Pagination
      pagination: {
        currentPage: 1,
        perPage: 4,
        total: 6
      },

      // ORGANIZATION LEAVE CALENDAR --- MOCK DATA >>> TO BUILD API FETCH DATA
      teamMembers: [
        {
          id: 1,
          name: 'Sarah Chen',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBILTXZaTkhkuzBPYhoEaUU3D3ro6fdlhJvYe5xtfapslo5vSAj4E3oDxGcJbA7_rcybvVHFz3k5bDIGTN14pzJlT13cy2p7sv-wypdjpO_zHondVCj1Lw1Sx5_Sq4AUiGbk1k2fucuKqmQYj8jEETIiuzZmC_hi5IXIQGXkbJBo9T40PYYXBPNdczYMWYHeJIz07DS4rxH2-g1jPrHeZcDV7QVaPpuH91avKwv_0SgsZ4ZLQ7qotf64sBzhPNIoEu8w1SrQUeiHZs',
          leaveTypeId: 'WFH',
          duration: '2 days',
          startDate: '2026-1-27',
          endDate: '2026-1-27'
        },
        {
          id: 2,
          name: 'Marcus Thorne',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsjb13efPdYVrcOhQNPFgTBye03FWVrWwwEWdgO3vC0_MaRd6SsYyL4t8AASxPDvgdApMdA6QQt3k03rBuk6oAii8ppGUP6zTle9m0gK9ebtqaMm_PjhWPlFbA76eDTujf2cwHzxij54aYSLQS3QRDSGx5Zv2twbPTtznBX3vnM2-efYlE-BV7zCQsE1XqweXLLuuzAFJTDApbZA4MasHShgVl3aDYtuQyQKSeO1LJjazK2G8hblYp6L_FKf5EdW0DT9X0R-F9eDk',
          leaveTypeId: 'AL',
          duration: '1 week',
          startDate: '2026-1-27',
          endDate: '2026-1-27'
        },
        {
          id: 3,
          name: 'Jamie Lannister',
          avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCfa0kRb54LWUDD37pNlhkebbVUSZICC1koMx8MTjWo_wPnKCv0_BYpSzJ40NCsHBd4NvNKOKHkXijMaeEWodsAyK4ab99T7da81OEM31mvqQWkP9zub6KVFAe4UmmXt1A4aqON6e8fYJWPnWjElY6Rony326Bj4SUysWrOHi5WQ24hDq_Uy_cHuE8EWq13Op_228RL22vBlg6OAstf9X0By1Ny-hYXvOcP6pEds8i7rfNgOisTYBhfwDk2_eYoebe4UUUDsrgrIxg',
          leaveTypeId: 'WFH',
          duration: '3 days',
          startDate: this.getTodayDate(),
          endDate: this.getTodayDate()
        },
        {
          id: 4,
          name: 'Alex Johnson',
          avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
          leaveTypeId: 'MC',
          duration: '1 day',
          startDate: this.getTodayDate(),
          endDate: this.getTodayDate()
        },
        {
          id: 5,
          name: 'Emma Wilson',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          leaveTypeId: 'OS',
          duration: '3 days',
          startDate: '2026-01-23',
          endDate: '2026-01-30'
        },
        {
          id: 6,
          name: 'David Kim',
          avatar: 'https://randomuser.me/api/portraits/men/67.jpg',
          leaveTypeId: 'BF',
          duration: '5 days',
          startDate: '2026-01-28',
          endDate: '2026-01-28'
        },
        {
          id: 7,
          name: 'Lisa Wong',
          avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
          leaveTypeId: 'MC',
          duration: '2 days',
          startDate: '2026-01-27',
          endDate: '2026-01-27'
        }
      ]
    }
  },

  computed: {
    leaveTypeOptions() {
      return this.leaveTypes;
    },

    approvalStatusOptions() {
      return this.approvalStatuses;
    },

    // Compute card data using leave type utilities
    leaveCards() {
      return [
        {
          id: 'AL',
          label: 'Annual',
          value: `${this.annualLeave.balance} / ${this.annualLeave.total} days`,
          detail: `Valid until ${this.annualLeave.validUntil}`,
          percentage: this.annualLeave.percentage,
          color: getLeaveTypeColor('AL')
        },
        {
          id: 'OS',
          label: 'Onsite',
          value: '42 Logged',
          detail: 'Current Year Activity',
          percentage: 60, // Mock percentage
          color: getLeaveTypeColor('OS')
        },
        {
          id: 'CL',
          label: 'Compassionate',
          value: '0 / 2 days',
          detail: 'Current Year Activity',
          percentage: 0,
          color: getLeaveTypeColor('CL')
        },
        {
          id: 'MC',
          label: 'Medical',
          value: `${this.sickLeave.taken} / 10 days`,
          detail: 'Taken this year',
          percentage: (this.sickLeave.taken / 10) * 100,
          color: getLeaveTypeColor('MC')
        }
      ];
    },

    // Show only first 5 applications
    visibleApplications() {
      return this.filteredApplications.slice(0, this.maxVisibleApplications);
    },

    // NEW: Claims computed properties
    visibleClaims() {
      return this.filteredClaims.slice(0, this.maxVisibleClaims);
    },

    hasMoreClaims() {
      return this.filteredClaims.length > this.maxVisibleClaims;
    },

    // Check if there are more applications to show
    hasMoreApplications() {
      return this.filteredApplications.length > this.maxVisibleApplications;
    },

    // Current user (for upcoming leave card)
    currentUser() {
      return {
        id: 'current-user',
        name: 'You',
        avatar: '',
        leaveTypeId: 'AL',
        duration: '0 days',
        startDate: this.getTodayDate(),
        endDate: this.getTodayDate()
      };
    },

    // Upcoming config
    upcomingConfig() {
      return {
        showRefresh: true,
        showViewAll: true,
        maxEvents: 5
      };
    }
  },

  watch: {
    activeTab(newTab) {
      this.calculateClaimStatistics();
    }
  },

  created() {
    this.initializeData();
    window.addEventListener('leave-request-submitted', this.handleLeaveRequest);
    window.addEventListener('claim-submitted', this.handleGlobalClaimSubmitted);
  },

  beforeUnmount() {
    window.removeEventListener('leave-request-submitted', this.handleLeaveRequest);
    window.addEventListener('claim-submitted', this.handleGlobalClaimSubmitted);
  },

  methods: {
    // ========== INITIALIZATION ==========

    initializeData() {
      this.teamMembers = this.validateTeamMemberData();
      this.filteredApplications = [...this.leaveApplications];
      this.filteredClaims = [...this.claims];
      this.calculateClaimStatistics();
    },

    // ========== TAB HANDLING ==========

    switchTab(tabName) {
      this.activeTab = tabName;
    },

    openFilterModal() {
      console.log('Open filter modal');
      // Implement filter modal logic here
    },

    loadMoreApplications() {
      this.maxVisibleApplications += 5;
    },

    // ========== CLAIM METHODS ==========
    handleGlobalClaimSubmitted(event) {
      const claimData = event.detail;
      this.handleNewClaimSubmit(claimData);
    },

    openNewClaimModal() {
      window.dispatchEvent(new CustomEvent('open-new-claim-modal'));
    },

    handleNewClaimSubmit(claimData) {
      console.log('New claim submitted:', claimData);

      // Add to claims array
      const newClaim = {
        id: this.claims.length + 1,
        type: claimData.type,
        description: claimData.title,
        date: claimData.date,
        amount: parseFloat(claimData.amount),
        status: 'pending',
        receipt: claimData.receipt ? true : false,
        statusDisplay: 'Pending'
      };

      this.claims.unshift(newClaim);
      this.filteredClaims = [...this.claims];
      this.calculateClaimStatistics();
      this.showSuccessMessage('Claim submitted successfully!');
    },

    getClaimTypeDisplay(typeId) {
      return this.claimTypes[typeId]?.name || typeId;
    },

    getClaimIcon(typeId) {
      return this.claimTypes[typeId]?.icon || 'receipt_long';
    },

    getClaimTypeClass(typeId) {
      const color = this.claimTypes[typeId]?.color || 'default';
      return `type-${color}`;
    },

    getClaimCategory(typeId) {
      return this.claimTypes[typeId]?.category || 'Expense';
    },

    getClaimActionMenuItems(claim) {
      const baseItems = [
        {
          label: 'View Details',
          icon: 'visibility',
          action: 'view_claim_details',
        },
        {
          label: 'Edit',
          icon: 'edit',
          action: 'edit_claim',
          disabled: !['pending'].includes(claim.status),
        },
        {
          label: 'View Receipt',
          icon: 'receipt',
          action: 'view_receipt',
          disabled: !claim.receipt,
        },
        {
          label: 'Cancel Claim',
          icon: 'cancel',
          action: 'cancel_claim',
          danger: true,
          disabled: !['pending'].includes(claim.status),
        },
        { divider: true }
      ];

      const extraItems = [
        {
          label: 'Download PDF',
          icon: 'download',
          action: 'download_claim',
        },
        {
          label: 'Share',
          icon: 'share',
          action: 'share_claim',
        }
      ];

      return [...baseItems, ...extraItems];
    },

    handleClaimAction(eventData) {
      const { action, context: claim } = eventData;
      console.log('Claim action triggered:', action, 'for claim:', claim);

      switch (action) {
        case 'view_claim_details':
          this.viewClaimDetails(claim);
          break;
        case 'edit_claim':
          this.editClaim(claim);
          break;
        case 'view_receipt':
          this.viewReceipt(claim);
          break;
        case 'cancel_claim':
          this.cancelClaim(claim);
          break;
        case 'download_claim':
          this.downloadClaim(claim);
          break;
        case 'share_claim':
          this.shareClaim(claim);
          break;
        default:
          console.warn('Unknown claim action:', action);
      }
    },

    viewClaimDetails(claim) {
      console.log('View claim details:', claim);
      // Implement claim details modal
      this.showSuccessMessage(`Viewing details for claim: ${claim.description}`);
    },

    editClaim(claim) {
      console.log('Edit claim:', claim);
      this.showSuccessMessage(`Editing claim: ${claim.description}`);
    },

    viewReceipt(claim) {
      console.log('View receipt for claim:', claim);
      this.showSuccessMessage(`Viewing receipt for claim: ${claim.description}`);
    },

    cancelClaim(claim) {
      const confirmMessage = `Are you sure you want to cancel this ${this.getClaimTypeDisplay(claim.type)} claim?\n\n` +
        `Amount: $${claim.amount.toFixed(2)}\n` +
        `Date: ${this.formatDate(claim.date)}`;

      if (!confirm(confirmMessage)) {
        return;
      }

      console.log('Cancelling claim:', claim);
      claim.status = 'cancelled';
      claim.statusDisplay = 'Cancelled';
      this.calculateClaimStatistics();
      this.showSuccessMessage('Claim cancelled successfully.');
    },

    deleteClaim(claim) {
      const confirmMessage = `Are you sure you want to delete claim: ${claim.description}?`;

      if (!confirm(confirmMessage)) {
        return;
      }

      const index = this.claims.findIndex(c => c.id === claim.id);
      if (index !== -1) {
        this.claims.splice(index, 1);
        this.filteredClaims = [...this.claims];
        this.calculateClaimStatistics();
        this.showSuccessMessage('Claim deleted successfully.');
      }
    },

    downloadClaim(claim) {
      console.log('Download claim:', claim);
      this.showSuccessMessage(`Downloading claim: ${claim.description}`);
    },

    shareClaim(claim) {
      console.log('Share claim:', claim);
      this.showSuccessMessage(`Sharing claim: ${claim.description}`);
    },

    showAllClaims() {
      console.log('Show all claims');
      this.$router.push('/claims');
    },

    calculateClaimStatistics() {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      this.monthlySubmitted = this.claims
        .filter(claim => {
          const claimDate = new Date(claim.date);
          return claimDate.getMonth() === currentMonth &&
            claimDate.getFullYear() === currentYear;
        })
        .reduce((sum, claim) => sum + claim.amount, 0);

      this.monthlyApproved = this.claims
        .filter(claim => {
          const claimDate = new Date(claim.date);
          return claim.status === 'approved' &&
            claimDate.getMonth() === currentMonth &&
            claimDate.getFullYear() === currentYear;
        })
        .reduce((sum, claim) => sum + claim.amount, 0);

      this.pendingAmount = this.claims
        .filter(claim => claim.status === 'pending')
        .reduce((sum, claim) => sum + claim.amount, 0);

      this.yearlyTotal = this.claims
        .filter(claim => new Date(claim.date).getFullYear() === currentYear)
        .reduce((sum, claim) => sum + claim.amount, 0);
    },

    // ========== ACTION MENU HANDLING ==========

    /**
     * Get action menu items based on application status
     */
    getActionMenuItems(application) {
      const baseItems = [
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
        { divider: true }
      ];

      // Add extra actions based on application type and status
      const extraItems = [];

      // Always available actions
      extraItems.push(
        {
          label: 'Share',
          icon: 'share',
          action: 'share',
        }
      );

      return [...baseItems, ...extraItems];
    },

    /**
     * Handle application action from dropdown menu
     */
    handleApplicationAction(eventData) {
      const { action, context: application, item } = eventData;
      console.log('Action triggered:', action, 'for application:', application);

      switch (action) {
        case 'view_details':
          this.viewApplicationDetails(application);
          break;
        case 'edit':
          this.editApplication(application);
          break;
        case 'cancel':
          this.cancelApplication(application);
          break;
        case 'request_extension':
          this.requestExtension(application);
          break;
        case 'share':
          this.shareApplication(application);
          break;
        default:
          console.warn('Unknown action:', action);
          this.showErrorMessage(`Action "${action}" is not implemented yet.`);
      }
    },

    viewApplicationDetails(application) {
      console.log('Opening details modal for:', application);

      // Enhance application data with timeline for demo
      const enhancedApplication = {
        ...application,
        timeline: this.generateTimeline(application),
        attachments: application.attachments || [],
        notes: application.notes || '',
        approver: application.approver || (application.status === 'approved' ? 'Manager Name' : null),
        approvedDate: application.approvedDate || (application.status === 'approved' ? this.formatDate(application.startDate) : null),
        comments: application.comments || '',
        createdDate: application.createdDate || application.startDate
      };

      this.selectedApplication = enhancedApplication;
      this.showDetailsModal = true;
    },

    /**
     * Generate timeline for application
     */
    generateTimeline(application) {
      const timeline = [
        {
          date: application.createdDate || application.startDate,
          action: 'Application submitted',
          by: 'You'
        }
      ];

      if (application.status === 'pending') {
        timeline.push({
          date: this.getTodayDate(),
          action: 'Under review',
          by: 'HR Department'
        });
      } else if (application.status === 'approved') {
        timeline.push(
          {
            date: application.approvedDate || application.startDate,
            action: 'Approved',
            by: application.approver || 'Manager'
          },
          {
            date: application.approvedDate || application.startDate,
            action: 'Added to calendar',
            by: 'System'
          }
        );
      } else if (application.status === 'rejected') {
        timeline.push({
          date: application.startDate,
          action: 'Rejected',
          by: application.approver || 'Manager'
        });
      }

      return timeline;
    },

    /**
     * Edit application - UPDATED
     */
    editApplication(application) {
      if (application.status !== 'pending') {
        this.showErrorMessage('Only pending applications can be edited.');
        return;
      }

      console.log('Opening edit modal for:', application);

      // Enhance application data for edit modal
      const enhancedApplication = {
        ...application,
        notes: application.notes || '',
        attachments: application.attachments || [],
        createdDate: application.createdDate || application.startDate
      };

      this.selectedApplication = enhancedApplication;
      this.showEditModal = true;
    },

    /**
     * Cancel application
     */
    cancelApplication(application) {
      if (!['pending', 'approved'].includes(application.status)) {
        this.showErrorMessage(`Cannot cancel an application with status: ${this.getStatusDisplay(application.status)}`);
        return;
      }

      const confirmMessage = `Are you sure you want to cancel this ${this.getApplicationTypeDisplay(application.type)} request?\n\n` +
        `Dates: ${this.formatDateRange(application.startDate, application.endDate)}\n` +
        `Reason: ${application.reason || 'Not specified'}`;

      if (!confirm(confirmMessage)) {
        return;
      }

      console.log('Cancelling application:', application);

      // Update application status
      application.status = 'cancelled';

      // Update leave balance if it was approved annual leave
      if (application.type === 'AL' && application.status === 'approved') {
        this.annualLeave.balance += application.days;
        this.annualLeave.used -= application.days;
        this.annualLeave.percentage = (this.annualLeave.balance / this.annualLeave.total) * 100;
        this.showSuccessMessage(`Application cancelled. ${application.days} day(s) have been added back to your annual leave balance.`);
      } else {
        this.showSuccessMessage('Application cancelled successfully.');
      }

      // In a real app, you would make an API call here
      // await this.cancelLeaveRequest(application.id);
    },

    /**
     * Share application
     */
    shareApplication(application) {
      console.log('Sharing application:', application);

      // Check if Web Share API is available
      if (navigator.share) {
        navigator.share({
          title: `${this.getApplicationTypeDisplay(application.type)} Leave Request`,
          text: `Leave request from ${application.startDate} to ${application.endDate} (${application.days} days)`,
          url: window.location.href
        }).then(() => {
          console.log('Shared successfully');
        }).catch((error) => {
          console.log('Error sharing:', error);
          this.showShareFallback(application);
        });
      } else {
        // Fallback for browsers that don't support Web Share API
        this.showShareFallback(application);
      }
    },

    showShareFallback(application) {
      const shareText = `${this.getApplicationTypeDisplay(application.type)} Leave Request\n` +
        `Dates: ${this.formatDateRange(application.startDate, application.endDate)}\n` +
        `Status: ${this.getStatusDisplay(application.status)}\n` +
        `Reason: ${application.reason || 'Not specified'}`;

      prompt('Copy the information below to share:', shareText);
    },

    // ========== LEAVE REQUEST HANDLING ==========

    openRequestLeaveModal() {
      this.$emit('open-request-leave');
    },

    async handleLeaveRequest(requestData) {
      try {
        // Validate request data
        if (!this.validateLeaveRequest(requestData)) {
          throw new Error('Invalid leave request data');
        }

        // Normalize leave type
        const normalizedType = normalizeLeaveType(requestData.type);
        const leaveTypeConfig = getLeaveTypeConfig(normalizedType);

        if (!leaveTypeConfig) {
          throw new Error('Invalid leave type');
        }

        // Check balance for annual leave
        if (leaveTypeConfig.id === 'AL' && requestData.duration > this.annualLeave.balance) {
          this.showErrorMessage('Insufficient annual leave balance');
          return;
        }

        // API call
        /*
        const response = await this.$api.post('/api/leave/requests', {
          ...requestData,
          type: leaveTypeConfig.id
        });
        */

        // Update local state (mock for now)
        this.updateLocalState({
          ...requestData,
          type: leaveTypeConfig.id,
          status: 'pending',
          id: this.leaveApplications.length + 1,
          createdDate: this.getTodayDate()
        });

        this.showSuccessMessage('Leave request submitted successfully');

      } catch (error) {
        this.handleError(error, 'Failed to submit leave request');
      }
    },

    validateLeaveRequest(data) {
      const requiredFields = ['type', 'startDate', 'endDate', 'duration'];
      return requiredFields.every(field => data[field]);
    },

    updateLocalState(newApplication) {
      // Add to applications list
      this.leaveApplications.unshift(newApplication);
      this.filteredApplications = [...this.leaveApplications];

      // Update statistics
      this.updateLocalStatistics(newApplication.type, newApplication.days);
    },

    updateLocalStatistics(type, duration) {
      switch (type) {
        case 'AL':
          this.annualLeave.balance -= duration;
          this.annualLeave.used += duration;
          this.annualLeave.percentage = (this.annualLeave.balance / this.annualLeave.total) * 100;
          break;

        case 'MC':
          this.sickLeave.taken += duration;
          break;

        default:
          break;
      }
    },

    handleError(error, defaultMessage) {
      const message = error.response?.data?.message || error.message || defaultMessage;
      this.showErrorMessage(message);

      // Log to error tracking service
      if (process.env.NODE_ENV === 'production') {
        console.error('Leave Request Error:', error);
      }
    },

    // ========== APPLICATION HISTORY ==========

    showAllApplications() {
      console.log('Show all applications');
      this.$router.push('/applications');
    },

    // ========== UPCOMING LEAVE HANDLING  ==========

    handleViewAllUpcoming(data) {
      console.log('View all upcoming events:', data);
      this.$router.push('/upcoming-events');
    },

    handleEventSelected(event) {
      console.log('Event selected:', event);
      this.showEventDetails(event);
    },

    handleRefreshRequested(type) {
      console.log('Refresh requested for:', type);
      if (type === 'upcoming') {
        this.loadDataFromAPI();
      }
    },

    showEventDetails(event) {
      const details = `
        Event Details:
        
        Title: ${event.title || 'Leave Event'}
        Dates: ${this.formatDateRange(event.startDate, event.endDate)}
        Duration: ${event.duration || 'N/A'}
        ${event.description ? `Description: ${event.description}` : ''}
        ${event.status ? `Status: ${event.status}` : ''}
      `;

      alert(details.trim());
    },

    /**
     * Handle save from edit modal
     */
    handleSaveApplication(updatedApplication) {
      console.log('Saving updated application:', updatedApplication);

      // Find and update the application in the list
      const index = this.leaveApplications.findIndex(app => app.id === updatedApplication.id);
      if (index !== -1) {
        // Update the application
        this.leaveApplications[index] = {
          ...this.leaveApplications[index],
          ...updatedApplication,
          days: updatedApplication.days,
          startDate: updatedApplication.startDate,
          endDate: updatedApplication.endDate,
          reason: updatedApplication.reason,
          notes: updatedApplication.notes,
          attachments: updatedApplication.attachments
        };

        // Update filtered applications
        this.filteredApplications = [...this.leaveApplications];

        // Update annual leave balance if it's an AL application
        if (updatedApplication.type === 'AL') {
          const oldDays = this.selectedApplication.days;
          const newDays = updatedApplication.days;
          const difference = oldDays - newDays;

          if (difference !== 0) {
            this.annualLeave.balance += difference;
            this.annualLeave.used -= difference;
            this.annualLeave.percentage = (this.annualLeave.balance / this.annualLeave.total) * 100;
          }
        }

        this.showSuccessMessage('Application updated successfully!');
      } else {
        this.showErrorMessage('Application not found');
      }

      this.closeModal();
    },

    // ========== LEAVE TYPE UTILITIES ==========

    getApplicationTypeDisplay(typeId) {
      return normalizeLeaveType(typeId);
    },

    getStatusDisplay(statusId) {
      const status = getStatusConfig(statusId);
      return status ? status.name : statusId;
    },

    getIcon(typeId) {
      return getLeaveTypeIcon(typeId);
    },

    getTypeClass(typeId) {
      return getLeaveTypeClass(typeId);
    },

    getLeaveCategory(typeId) {
      return getLeaveTypeCategory(typeId);
    },

    getStatusClass(statusId) {
      const statusConfig = getStatusConfig(statusId);
      return statusConfig ? statusConfig.id : 'default';
    },

    getColor(typeId) {
      return getLeaveTypeColor(typeId);
    },

    // ========== DATA VALIDATION ==========

    validateTeamMemberData() {
      return this.teamMembers.map(member => {
        // Ensure leaveTypeId is valid
        let validLeaveTypeId = member.leaveTypeId;

        if (!isValidLeaveType(validLeaveTypeId)) {
          // Try to normalize
          const normalized = normalizeLeaveType(validLeaveTypeId);
          const config = getLeaveTypeConfig(normalized);
          validLeaveTypeId = config ? config.id : 'AL'; // Default to Annual Leave
        }

        return {
          ...member,
          leaveTypeId: validLeaveTypeId,
          // Add display name for easier access
          leaveTypeDisplay: normalizeLeaveType(validLeaveTypeId),
          // Add color for styling
          leaveColor: getLeaveTypeColor(validLeaveTypeId)
        };
      });
    },

    // ========== DATE FORMATTING ==========

    getTodayDate() {
      const today = new Date();
      return today.toISOString().split('T')[0];
    },

    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    formatMonth(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('default', { month: 'short' }).toUpperCase();
    },

    formatDay(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.getDate();
    },

    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '';

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start.getTime() === end.getTime()) {
        return `${this.formatDate(startDate)}`;
      }

      // Check if same month
      if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
        return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('default', { month: 'short' })}, ${start.getFullYear()}`;
      }

      return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
    },

    getDaysUntil(dateString) {
      if (!dateString) return 0;
      const today = new Date();
      const target = new Date(dateString);
      const diffTime = target - today;
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    },

    // ========== UI UTILITIES ==========

    getDefaultReason(typeId) {
      const config = getLeaveTypeConfig(typeId);
      return config ? config.category : 'Personal';
    },

    showSuccessMessage(message) {
      console.log('Success:', message);
      alert(message); // Replace with proper toast/notification system
    },

    showErrorMessage(message) {
      console.error('Error:', message);
      alert(message); // Replace with proper toast/notification system
    },

    // ========== API INTEGRATION ==========

    async loadDataFromAPI() {
      try {
        // TODO: Implement actual API calls
        console.log('Loading data from API...');
        this.showSuccessMessage('Data refreshed successfully');
      } catch (error) {
        console.error('API Fetch Failed:', error);
        this.showErrorMessage('Failed to load data. Please try again.');
      }
    },

    // ========== ACTION HANDLERS ==========

    closeModal() {
      this.showEditModal = false;
      this.showDetailsModal = false;
      this.selectedApplication = null;
    },

    viewTeamCalendar() {
      console.log('View team calendar');
      this.$emit('view-team-calendar');
    },

    filterApplications(status) {
      if (!status) {
        this.filteredApplications = [...this.leaveApplications];
        return;
      }

      this.filteredApplications = this.leaveApplications.filter(
        app => app.status === status
      );
    }
  }
}
</script>

<style scoped>
@import '../../../styles/views/Leave/Leave.css';
@import '../../../styles/shared/pages.css';
@import '../../../styles/shared/globals.css';
@import '../../../styles/shared/tabs.css';
</style>