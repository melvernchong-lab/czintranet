<template>
  <div class="claim-main-content">
    <!-- Active Claim Tracking -->
    <ActiveClaimTracker 
      v-if="activeClaim"
      :claim="activeClaim"
      @view-details="viewClaimDetails"
    />

    <!-- Claim Records -->
    <ClaimRecords 
      :claims="filteredClaims"
      :active-tab="activeTab"
      :search-query="searchQuery"
      :pagination="pagination"
      @tab-change="handleTabChange"
      @search="handleSearch"
      @filter="openFilterModal"
      @view-details="viewClaimDetails"
      @edit="editClaim"
      @delete="deleteClaim"
      @download="downloadClaim"
      @page-change="handlePageChange"
      @new-claim="handleNewClaim"
    />

    <!-- Modals -->
    <ClaimDetailsModal 
      v-if="showDetailsModal"
      :is-visible="showDetailsModal"
      :claim="selectedClaim"
      @close="closeModal"
      @edit="handleEditClaim"
    />

    <!-- REMOVED: NewClaimModal from here since it's now global -->
  </div>
</template>

<script>
import ActiveClaimTracker from './ActiveClaimTracker.vue';
import ClaimRecords from './ClaimRecords.vue';
import ClaimDetailsModal from './ClaimDetailsModal.vue';

export default {
  name: 'ClaimDashboard',
  components: {
    ActiveClaimTracker,
    ClaimRecords,
    ClaimDetailsModal,
    // REMOVED: NewClaimModal import
  },
  data() {
    return {
      activeTab: 'active',
      searchQuery: '',
      showDetailsModal: false,
      // REMOVED: showNewClaimModal
      selectedClaim: null,
      
      // Mock data - enhanced with more details
      claims: [
        {
          id: 'CLM-1052',
          claimId: 'CLM-1052',
          date: '2023-10-12',
          category: 'Travel',
          amount: 850.00,
          status: 'finance_review',
          receipt: true,
          description: 'Client meeting transportation',
          submittedDate: '2023-10-12',
          currentPhase: 'Finance Review',
          phases: [
            { name: 'Employee', date: 'Oct 12', completed: true },
            { name: 'Manager', date: 'Oct 14', completed: true },
            { name: 'Finance Review', date: null, completed: false, current: true },
            { name: 'Paid', date: null, completed: false }
          ],
          items: [
            { description: 'Flight ticket', amount: 450.00 },
            { description: 'Hotel stay', amount: 300.00 },
            { description: 'Taxi fares', amount: 100.00 }
          ],
          type: 'TRV',
          statusDisplay: 'Finance Review'
        },
        {
          id: 'CLM-1049',
          claimId: 'CLM-1049',
          date: '2023-10-08',
          category: 'Meal',
          amount: 45.50,
          status: 'submitted',
          receipt: true,
          description: 'Team lunch meeting',
          type: 'MEAL',
          statusDisplay: 'Submitted'
        },
        {
          id: 'CLM-1030',
          claimId: 'CLM-1030',
          date: '2023-10-01',
          category: 'Supplies',
          amount: 120.00,
          status: 'paid',
          receipt: true,
          description: 'Office stationery',
          type: 'OFF',
          statusDisplay: 'Paid',
          paymentDate: '2023-10-05',
          paymentMethod: 'Bank Transfer'
        },
        {
          id: 'CLM-1025',
          claimId: 'CLM-1025',
          date: '2023-09-28',
          category: 'Onsite',
          amount: 325.00,
          status: 'rejected',
          receipt: true,
          description: 'Client site visit',
          type: 'TEL',
          statusDisplay: 'Rejected',
          rejectionReason: 'Insufficient documentation'
        },
        {
          id: 'CLM-1020',
          claimId: 'CLM-1020',
          date: '2023-09-25',
          category: 'Travel',
          amount: 150.00,
          status: 'paid',
          receipt: true,
          description: 'Train ticket',
          type: 'TRV',
          statusDisplay: 'Paid',
          paymentDate: '2023-09-28'
        },
        {
          id: 'CLM-1015',
          claimId: 'CLM-1015',
          date: '2023-09-20',
          category: 'Medical',
          amount: 75.25,
          status: 'draft',
          receipt: false,
          description: 'Medical consultation',
          type: 'MED',
          statusDisplay: 'Draft'
        }
      ],
      
      pagination: {
        currentPage: 1,
        perPage: 4,
        total: 24
      }
    };
  },
  
  computed: {
    activeClaim() {
      return this.claims.find(claim => claim.status === 'finance_review') || null;
    },
    
    filteredClaims() {
      let filtered = [...this.claims];
      
      // Filter by active tab
      if (this.activeTab === 'active') {
        filtered = filtered.filter(claim => 
          ['submitted', 'finance_review'].includes(claim.status)
        );
      } else if (this.activeTab === 'history') {
        filtered = filtered.filter(claim => 
          ['paid', 'rejected'].includes(claim.status)
        );
      } else if (this.activeTab === 'drafts') {
        filtered = filtered.filter(claim => claim.status === 'draft');
      }
      
      // Filter by search query
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        filtered = filtered.filter(claim => 
          claim.claimId.toLowerCase().includes(query) ||
          claim.category.toLowerCase().includes(query) ||
          claim.description?.toLowerCase().includes(query) ||
          claim.statusDisplay?.toLowerCase().includes(query) ||
          claim.type?.toLowerCase().includes(query)
        );
      }
      
      // Apply pagination
      const start = (this.pagination.currentPage - 1) * this.pagination.perPage;
      const end = start + this.pagination.perPage;
      return filtered.slice(start, end);
    }
  },
  
  created() {
    // Listen for global claim submission events
    window.addEventListener('claim-submitted', this.handleGlobalClaimSubmitted);
  },
  
  beforeUnmount() {
    // Clean up event listener
    window.removeEventListener('claim-submitted', this.handleGlobalClaimSubmitted);
  },
  
  methods: {
    // Handle new claim button click
    handleNewClaim() {
      // Dispatch global event to open claim modal
      window.dispatchEvent(new CustomEvent('open-new-claim-modal'));
    },
    
    // Handle global claim submission
    handleGlobalClaimSubmitted(event) {
      const claimData = event.detail;
      console.log('Global claim submitted received:', claimData);
      
      // Add to claims array
      const newClaim = {
        id: `CLM-${1000 + this.claims.length + 1}`,
        claimId: `CLM-${1000 + this.claims.length + 1}`,
        date: new Date().toISOString().split('T')[0],
        category: this.getCategoryFromType(claimData.type),
        amount: parseFloat(claimData.amount),
        status: 'submitted',
        receipt: claimData.receipt ? true : false,
        description: claimData.title || claimData.description,
        submittedDate: new Date().toISOString().split('T')[0],
        type: claimData.type,
        statusDisplay: 'Submitted'
      };
      
      this.claims.unshift(newClaim);
      this.showSuccessMessage('Claim submitted successfully!');
      
      // Switch to active tab to show the new claim
      this.activeTab = 'active';
      this.pagination.currentPage = 1;
    },
    
    // Helper method to get category from type
    getCategoryFromType(type) {
      const typeMap = {
        'TRV': 'Travel',
        'MEAL': 'Meal',
        'MED': 'Medical',
        'OFF': 'Supplies',
        'TEL': 'Communication'
      };
      return typeMap[type] || 'Other';
    },
    
    viewClaimDetails(claim) {
      this.selectedClaim = claim;
      this.showDetailsModal = true;
    },
    
    editClaim(claim) {
      console.log('Edit claim:', claim);
      // You could dispatch a global event for editing too
      // window.dispatchEvent(new CustomEvent('edit-claim-modal', { detail: claim }));
      // For now, just show a message
      this.showSuccessMessage(`Editing claim ${claim.claimId}`);
    },
    
    deleteClaim(claim) {
      if (confirm(`Are you sure you want to delete claim ${claim.claimId}? This action cannot be undone.`)) {
        const index = this.claims.findIndex(c => c.id === claim.id);
        if (index !== -1) {
          this.claims.splice(index, 1);
          this.showSuccessMessage('Claim deleted successfully');
        }
      }
    },
    
    downloadClaim(claim) {
      console.log('Download claim:', claim);
      // Create a simple text file for download
      const content = `
        Claim Details
        -------------
        ID: ${claim.claimId}
        Date: ${claim.date}
        Category: ${claim.category}
        Amount: $${claim.amount.toFixed(2)}
        Status: ${claim.statusDisplay}
        Description: ${claim.description}
        Receipt: ${claim.receipt ? 'Yes' : 'No'}
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `claim-${claim.claimId}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      this.showSuccessMessage(`Claim ${claim.claimId} downloaded`);
    },
    
    handleEditClaim(claim) {
      this.closeModal();
      this.editClaim(claim);
    },
    
    handleTabChange(tab) {
      this.activeTab = tab;
      this.pagination.currentPage = 1;
    },
    
    handleSearch(query) {
      this.searchQuery = query;
      this.pagination.currentPage = 1;
    },
    
    handlePageChange(page) {
      this.pagination.currentPage = page;
    },
    
    openFilterModal() {
      console.log('Open filter modal');
      // Could dispatch global event for filter modal too
      // window.dispatchEvent(new CustomEvent('open-filter-modal'));
      this.showSuccessMessage('Filter modal would open here');
    },
    
    closeModal() {
      this.showDetailsModal = false;
      this.selectedClaim = null;
    },
    
    showSuccessMessage(message) {
      // In a real app, use a toast notification system
      console.log('Success:', message);
      
      // Temporary alert for demonstration
      const toast = document.createElement('div');
      toast.className = 'claim-toast success';
      toast.textContent = message;
      toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        animation: fadeInOut 3s ease-in-out;
      `;
      
      document.body.appendChild(toast);
      
      // Add CSS animation
      const style = document.createElement('style');
      style.textContent = `
        @keyframes fadeInOut {
          0%, 100% { opacity: 0; transform: translateY(-10px); }
          10%, 90% { opacity: 1; transform: translateY(0); }
        }
      `;
      document.head.appendChild(style);
      
      setTimeout(() => {
        document.body.removeChild(toast);
        document.head.removeChild(style);
      }, 3000);
    },
    
    showErrorMessage(message) {
      console.error('Error:', message);
      alert(`Error: ${message}`);
    }
  }
};
</script>

<style scoped>
/* Responsive styles */
@media (max-width: 768px) {
  .claim-main-content {
    padding: 1rem;
  }
}
</style>