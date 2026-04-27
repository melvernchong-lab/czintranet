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
@import '../../../../styles/views/Leave/Claim/ClaimRecords.css';
</style>