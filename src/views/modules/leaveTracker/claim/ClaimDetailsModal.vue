<template>
  <div class="claim-records">
    <div class="records-header">
      <div class="records-tabs">
        <h3>Claim Records</h3>
        <div class="tab-switcher">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="$emit('tab-change', tab.id)"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>
      
      <div class="records-controls">
        <div class="search-box">
          <span class="search-icon material-symbols-outlined">search</span>
          <input 
            type="text" 
            :value="searchQuery"
            @input="$emit('search', $event.target.value)"
            placeholder="Search by ID, category or status..."
          />
        </div>
        <button class="filter-btn" @click="$emit('filter')">
          <span class="material-symbols-outlined">filter_list</span>
          <span>Filter</span>
        </button>
      </div>
    </div>
    
    <div class="records-table-container">
      <table class="records-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key" :class="column.class">
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="claim in claims" 
            :key="claim.id"
            :class="['claim-row', getRowClass(claim)]"
            @click="$emit('view-details', claim)"
          >
            <td class="claim-id">
              <span :class="['claim-id-text', getClaimIdClass(claim)]">
                {{ claim.claimId }}
              </span>
            </td>
            <td class="claim-date">{{ formatDate(claim.date) }}</td>
            <td class="claim-category">
              <span :class="['category-badge', getCategoryClass(claim.category)]">
                {{ claim.category }}
              </span>
            </td>
            <td class="claim-amount">${{ claim.amount.toFixed(2) }}</td>
            <td class="claim-status">
              <span class="status-indicator" :class="getStatusClass(claim.status)">
                <span class="status-dot"></span>
                {{ getStatusDisplay(claim.status) }}
              </span>
            </td>
            <td class="claim-receipt">
              <span 
                v-if="claim.receipt"
                class="receipt-icon material-symbols-outlined"
                @click.stop="$emit('download', claim)"
              >
                attach_file
              </span>
              <span v-else class="no-receipt">—</span>
            </td>
            <td class="claim-actions">
              <div class="action-menu" @click.stop>
                <span class="action-menu-icon material-symbols-outlined">more_horiz</span>
                <div class="action-menu-dropdown">
                  <button @click="$emit('view-details', claim)" class="action-item">
                    <span class="material-symbols-outlined">visibility</span>
                    View Details
                  </button>
                  <button @click="$emit('edit', claim)" class="action-item">
                    <span class="material-symbols-outlined">edit</span>
                    Edit
                  </button>
                  <button @click="$emit('download', claim)" class="action-item">
                    <span class="material-symbols-outlined">download</span>
                    Download
                  </button>
                  <div class="action-divider"></div>
                  <button @click="$emit('delete', claim)" class="action-item delete">
                    <span class="material-symbols-outlined">delete</span>
                    Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      
      <div v-if="claims.length === 0" class="empty-state">
        <span class="empty-icon material-symbols-outlined">receipt_long</span>
        <p>No claims found</p>
      </div>
    </div>
    
    <div class="records-footer">
      <div class="footer-info">
        <p>Displaying 1-{{ claims.length }} of {{ pagination.total }} claims</p>
      </div>
      <div class="footer-pagination">
        <button 
          class="pagination-btn"
          :disabled="pagination.currentPage === 1"
          @click="$emit('page-change', pagination.currentPage - 1)"
        >
          Previous
        </button>
        <button 
          class="pagination-btn primary"
          @click="$emit('page-change', pagination.currentPage + 1)"
        >
          Next Page
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClaimRecords',
  props: {
    claims: {
      type: Array,
      required: true,
      default: () => []
    },
    activeTab: {
      type: String,
      default: 'active'
    },
    searchQuery: {
      type: String,
      default: ''
    },
    pagination: {
      type: Object,
      default: () => ({
        currentPage: 1,
        total: 0
      })
    }
  },
  data() {
    return {
      tabs: [
        { id: 'active', label: 'Active', count: null },
        { id: 'history', label: 'History', count: null },
        { id: 'drafts', label: 'Drafts', count: 2 }
      ],
      columns: [
        { key: 'id', label: 'CLAIM ID', class: 'text-left' },
        { key: 'date', label: 'DATE', class: 'text-left' },
        { key: 'category', label: 'CATEGORY', class: 'text-left' },
        { key: 'amount', label: 'AMOUNT', class: 'text-left' },
        { key: 'status', label: 'STATUS', class: 'text-left' },
        { key: 'receipt', label: 'RECEIPT', class: 'text-center' },
        { key: 'actions', label: '', class: 'text-right' }
      ]
    };
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      });
    },
    
    getRowClass(claim) {
      if (claim.status === 'finance_review') {
        return 'active-row';
      } else if (claim.status === 'rejected') {
        return 'rejected-row';
      }
      return '';
    },
    
    getClaimIdClass(claim) {
      if (claim.status === 'finance_review') {
        return 'active-claim-id';
      }
      return '';
    },
    
    getCategoryClass(category) {
      const categoryClasses = {
        'Travel': 'travel',
        'Meal': 'meal',
        'Supplies': 'supplies',
        'Onsite': 'onsite',
        'Medical': 'medical'
      };
      return categoryClasses[category] || 'default';
    },
    
    getStatusClass(status) {
      const statusClasses = {
        'finance_review': 'review',
        'submitted': 'submitted',
        'paid': 'paid',
        'rejected': 'rejected',
        'draft': 'draft'
      };
      return statusClasses[status] || 'default';
    },
    
    getStatusDisplay(status) {
      const statusMap = {
        'finance_review': 'Finance Review',
        'submitted': 'Submitted',
        'paid': 'Paid',
        'rejected': 'Rejected',
        'draft': 'Draft'
      };
      return statusMap[status] || status;
    }
  }
};
</script>

<style scoped>
.claim-records {
  background: white;
  border: 1px solid #cfd3e7;
  border-radius: 1rem;
  overflow: hidden;
  margin: 2rem auto;
  max-width: 1400px;
  display: flex;
  flex-direction: column;
  min-height: 500px;
}

.records-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #cfd3e7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.records-tabs {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.records-tabs h3 {
  font-size: 0.875rem;
  font-weight: bold;
  color: #0d101b;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.tab-switcher {
  display: flex;
  background: #f8f9fc;
  padding: 0.25rem;
  border-radius: 0.5rem;
}

.tab-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  background: transparent;
  font-size: 0.75rem;
  font-weight: bold;
  color: #4c599a;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.tab-btn.active {
  background: white;
  color: #0d101b;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tab-count {
  background: rgba(76, 89, 154, 0.1);
  color: #4c599a;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  font-size: 0.625rem;
}

.records-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.search-box {
  position: relative;
  width: 18rem;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.125rem;
  color: #4c599a;
}

.search-box input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #cfd3e7;
  border-radius: 0.5rem;
  background: #f8f9fc;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.search-box input:focus {
  outline: none;
  border-color: #0d47a1;
  box-shadow: 0 0 0 2px rgba(13, 71, 161, 0.2);
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #cfd3e7;
  border-radius: 0.5rem;
  background: transparent;
  color: #4c599a;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: #f8f9fc;
}

.records-table-container {
  flex: 1;
  overflow: auto;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table thead {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #f8f9fc;
}

.records-table th {
  padding: 1rem 1.5rem;
  font-size: 0.625rem;
  font-weight: 900;
  color: #4c599a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #cfd3e7;
  text-align: left;
}

.claim-row {
  border-bottom: 1px solid #cfd3e7;
  transition: background-color 0.2s;
  cursor: pointer;
}

.claim-row:hover {
  background: rgba(13, 71, 161, 0.02);
}

.claim-row.active-row {
  background: rgba(13, 71, 161, 0.04);
}

.claim-row.rejected-row {
  opacity: 0.7;
}

.records-table td {
  padding: 1.25rem 1.5rem;
}

.claim-id-text {
  font-size: 0.875rem;
  font-weight: bold;
  color: #0d101b;
}

.active-claim-id {
  color: #0d47a1 !important;
}

.claim-date {
  font-size: 0.875rem;
  color: #4c599a;
}

.category-badge {
  display: inline-block;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: bold;
}

.category-badge.travel {
  background: rgba(59, 130, 246, 0.1);
  color: rgb(59, 130, 246);
}

.category-badge.meal {
  background: rgba(249, 115, 22, 0.1);
  color: rgb(249, 115, 22);
}

.category-badge.supplies {
  background: rgba(168, 85, 247, 0.1);
  color: rgb(168, 85, 247);
}

.category-badge.onsite {
  background: rgba(107, 114, 128, 0.1);
  color: rgb(107, 114, 128);
}

.category-badge.medical {
  background: rgba(239, 68, 68, 0.1);
  color: rgb(239, 68, 68);
}

.category-badge.default {
  background: rgba(76, 89, 154, 0.1);
  color: #4c599a;
}

.claim-amount {
  font-size: 0.875rem;
  font-weight: bold;
  color: #0d101b;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.status-indicator.review .status-dot {
  background: #0d47a1;
  animation: pulse 2s infinite;
}

.status-indicator.submitted .status-dot {
  background: rgb(245, 158, 11);
}

.status-indicator.paid .status-dot {
  background: rgb(34, 197, 94);
}

.status-indicator.rejected .status-dot {
  background: rgb(239, 68, 68);
}

.status-indicator.draft .status-dot {
  background: #4c599a;
}

.claim-receipt {
  text-align: center;
}

.receipt-icon {
  color: #4c599a;
  cursor: pointer;
  transition: color 0.2s;
  font-size: 1.125rem;
}

.receipt-icon:hover {
  color: #0d47a1;
}

.no-receipt {
  color: #9ca3af;
  font-size: 0.875rem;
}

.claim-actions {
  text-align: right;
}

.action-menu {
  position: relative;
  display: inline-block;
}

.action-menu-icon {
  color: #cfd3e7;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: all 0.2s;
  font-size: 1.25rem;
}

.action-menu-icon:hover {
  color: #4c599a;
  background: #f8f9fc;
}

.action-menu-dropdown {
  position: absolute;
  right: 0;
  top: 100%;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid #cfd3e7;
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  min-width: 160px;
  z-index: 20;
  display: none;
}

.action-menu:hover .action-menu-dropdown {
  display: block;
}

.action-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  color: #4c599a;
  font-size: 0.75rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  background: #f8f9fc;
}

.action-item .material-symbols-outlined {
  font-size: 1rem;
}

.action-item.delete {
  color: #ef4444;
}

.action-divider {
  height: 1px;
  background: #cfd3e7;
  margin: 0.25rem 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.empty-icon {
  font-size: 3rem;
  color: #e5e7eb;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280;
  font-size: 0.875rem;
}

.records-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #cfd3e7;
  background: #f8f9fc;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-info p {
  font-size: 0.6875rem;
  font-weight: bold;
  color: #4c599a;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.footer-pagination {
  display: flex;
  gap: 0.5rem;
}

.pagination-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #cfd3e7;
  border-radius: 0.5rem;
  background: white;
  color: #4c599a;
  font-size: 0.75rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: #f8f9fc;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-btn.primary {
  background: #0d47a1;
  color: white;
  border-color: #0d47a1;
  box-shadow: 0 1px 2px rgba(13, 71, 161, 0.2);
}

.pagination-btn.primary:hover {
  background: #0c24a1;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.dark .claim-records {
  background: #1a1d2e;
  border-color: #2d324a;
}

.dark .records-header {
  border-bottom-color: #2d324a;
}

.dark .records-tabs h3 {
  color: white;
}

.dark .tab-switcher {
  background: #2d324a;
}

.dark .tab-btn {
  color: #8b95c9;
}

.dark .tab-btn.active {
  background: #1a1d2e;
  color: white;
}

.dark .search-box input {
  background: #2d324a;
  border-color: #2d324a;
  color: white;
}

.dark .search-box input:focus {
  border-color: #0d47a1;
}

.dark .filter-btn {
  border-color: #2d324a;
  color: #8b95c9;
}

.dark .filter-btn:hover {
  background: #2d324a;
}

.dark .records-table thead {
  background: #242942;
}

.dark .records-table th {
  color: #8b95c9;
  border-bottom-color: #2d324a;
}

.dark .claim-row {
  border-bottom-color: #2d324a;
}

.dark .claim-row:hover {
  background: rgba(255, 255, 255, 0.02);
}

.dark .claim-row.active-row {
  background: rgba(13, 71, 161, 0.1);
}

.dark .claim-id-text {
  color: white;
}

.dark .claim-date {
  color: #8b95c9;
}

.dark .category-badge.travel {
  background: rgba(59, 130, 246, 0.2);
  color: rgb(96, 165, 250);
}

.dark .category-badge.meal {
  background: rgba(249, 115, 22, 0.2);
  color: rgb(251, 146, 60);
}

.dark .category-badge.supplies {
  background: rgba(168, 85, 247, 0.2);
  color: rgb(192, 132, 252);
}

.dark .category-badge.onsite {
  background: rgba(107, 114, 128, 0.2);
  color: rgb(156, 163, 175);
}

.dark .category-badge.medical {
  background: rgba(239, 68, 68, 0.2);
  color: rgb(252, 165, 165);
}

.dark .claim-amount {
  color: white;
}

.dark .receipt-icon {
  color: #8b95c9;
}

.dark .receipt-icon:hover {
  color: #0d47a1;
}

.dark .action-menu-icon:hover {
  background: #2d324a;
}

.dark .action-menu-dropdown {
  background: #1a1d2e;
  border-color: #2d324a;
}

.dark .action-item {
  color: #8b95c9;
}

.dark .action-item:hover {
  background: #2d324a;
}

.dark .action-divider {
  background: #2d324a;
}

.dark .empty-icon {
  color: #2d324a;
}

.dark .empty-state p {
  color: #8b95c9;
}

.dark .records-footer {
  background: #242942;
  border-top-color: #2d324a;
}

.dark .pagination-btn {
  background: #1a1d2e;
  border-color: #2d324a;
  color: #8b95c9;
}

.dark .pagination-btn:hover:not(:disabled) {
  background: #2d324a;
}

.dark .pagination-btn.primary {
  background: #0d47a1;
  border-color: #0d47a1;
}
</style>