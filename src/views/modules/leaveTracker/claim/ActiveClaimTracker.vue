<template>
  <div class="active-claim-tracker">
    <!-- Loading State -->
    <div v-if="loading && !useMockData" class="tracker-loading">
      <div class="loading-spinner"></div>
      <span>Loading claim status...</span>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !useMockData" class="tracker-error">
      <span class="material-symbols-outlined">error</span>
      <p>Unable to load claim status. 
        <button @click="fetchClaimStatus">Retry</button>
        <button @click="useMockData = true" class="use-mock-btn">Use Demo Data</button>
      </p>
    </div>

    <!-- Success State (API or Mock) -->
    <div v-else class="tracker-content">
      <!-- Demo Data Indicator -->
      <div v-if="useMockData" class="demo-indicator">
        <span class="material-symbols-outlined">info</span>
        <span>Showing demo data</span>
        <button @click="retryApi" class="retry-api-btn">Try API Again</button>
      </div>
      
      <div class="tracker-header">
        <div class="tracker-title">
          <div class="tracker-icon">
            <span class="material-symbols-outlined">analytics</span>
          </div>
          <h4>Active Claim Tracking: {{ claim.claimId }}</h4>
        </div>
        <div class="tracker-status">
          <span class="status-badge" :class="getStatusClass(claim.status)">
            {{ getStatusDisplay(claim.status) }}
          </span>
          <span class="submitted-date">Submitted {{ formatDate(claim.submittedDate) }}</span>
        </div>
      </div>
      
      <div class="tracker-progress">
        <div class="progress-bar-background"></div>
        <div class="progress-bar-fill" :style="{ width: progressPercentage + '%' }"></div>
        
        <div class="progress-steps">
          <div v-for="(phase, index) in phases" 
               :key="index"
               class="progress-step"
               :class="{ 
                 'current': phase.isCurrent,
                 'completed': phase.isCompleted,
                 'pending': !phase.isCompleted && !phase.isCurrent 
               }">
            <div class="step-circle-container">
              <div class="step-circle">
                <span v-if="phase.isCompleted" class="material-symbols-outlined">check</span>
                <span v-else-if="phase.isCurrent" class="material-symbols-outlined">{{ phase.icon }}</span>
                <span v-else class="material-symbols-outlined">{{ phase.icon }}</span>
              </div>
            </div>
            <div class="step-info">
              <span class="step-name">{{ phase.name }}</span>
              <span class="step-date">{{ phase.date ? formatDateShort(phase.date) : 'Pending' }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="tracker-actions">
        <button @click="$emit('view-details', claim)" class="view-details-btn">
          <span class="material-symbols-outlined">visibility</span>
          View Details
        </button>
        <button v-if="showCancelButton" @click="handleCancelClaim" class="cancel-claim-btn">
          <span class="material-symbols-outlined">close</span>
          Cancel Claim
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import { claimStatusConfig, claimPhasesConfig, getPhaseByStatus } from '@/utils/claimConstants';

export default {
  name: 'ActiveClaimTracker',
  props: {
    claimId: {
      type: String,
      default: 'CLM-2024-001' // Default demo claim ID
    },
    autoRefresh: {
      type: Boolean,
      default: true
    },
    refreshInterval: {
      type: Number,
      default: 30000 // 30 seconds
    },
    // New prop to force mock data (useful for development)
    forceMockData: {
      type: Boolean,
      default: false
    }
  },
  emits: ['view-details', 'cancel-claim', 'status-updated', 'error'],
  
  setup(props, { emit }) {
    // Reactive state
    const claim = ref(getMockClaim(props.claimId));
    const loading = ref(!props.forceMockData);
    const error = ref(null);
    const refreshTimer = ref(null);
    const useMockData = ref(props.forceMockData);

    // Mock claim data generator
    function getMockClaim(claimId) {
      const statuses = ['submitted', 'under_review', 'manager_approved', 'finance_review', 'approved', 'processing', 'paid'];
      const randomStatus = statuses[Math.floor(Math.random() * 3)]; // Only first 3 for active claims
      
      const today = new Date();
      const submittedDate = new Date(today);
      submittedDate.setDate(today.getDate() - Math.floor(Math.random() * 7)); // 0-7 days ago
      
      // Generate phases based on status
      const phases = generateMockPhases(randomStatus, submittedDate);
      
      return {
        id: claimId,
        claimId: claimId,
        type: ['TRV', 'MEAL', 'MED', 'OFF'][Math.floor(Math.random() * 4)],
        category: ['Travel', 'Meal', 'Medical', 'Supplies'][Math.floor(Math.random() * 4)],
        amount: (Math.random() * 500 + 50).toFixed(2),
        status: randomStatus,
        description: 'Mock claim for demonstration purposes',
        submittedDate: submittedDate.toISOString(),
        phases: phases,
        currentPhase: getCurrentPhaseName(randomStatus),
        phaseDates: getPhaseDates(phases, submittedDate),
        receipt: Math.random() > 0.5
      };
    }
    
    function generateMockPhases(status, baseDate) {
      const statusOrder = claimStatusConfig[status]?.order || 1;
      const dates = [];
      
      // Generate dates for completed phases
      for (let i = 0; i < statusOrder; i++) {
        const date = new Date(baseDate);
        date.setDate(date.getDate() + i);
        dates.push(date);
      }
      
      return claimPhasesConfig.map((phase, index) => ({
        ...phase,
        completed: phase.order < statusOrder,
        current: phase.order === statusOrder,
        date: dates[index] ? dates[index].toISOString() : null
      }));
    }
    
    function getCurrentPhaseName(status) {
      const order = claimStatusConfig[status]?.order || 1;
      const phase = claimPhasesConfig.find(p => p.order === order);
      return phase ? phase.name : 'Employee';
    }
    
    function getPhaseDates(phases, baseDate) {
      const dates = {};
      phases.forEach((phase, index) => {
        if (phase.date) {
          dates[phase.key] = phase.date;
        }
      });
      return dates;
    }

    // Computed properties
    const phases = computed(() => {
      const statusConfig = claimStatusConfig[claim.value.status] || claimStatusConfig.pending;
      return claimPhasesConfig.map(phase => ({
        ...phase,
        isCompleted: phase.order < statusConfig.order,
        isCurrent: phase.order === statusConfig.order,
        date: claim.value.phaseDates?.[phase.key]
      }));
    });

    const progressPercentage = computed(() => {
      const completedPhases = phases.value.filter(phase => phase.isCompleted).length;
      const totalPhases = phases.value.length;
      return (completedPhases / totalPhases) * 100;
    });

    const showCancelButton = computed(() => {
      const cancelableStatuses = ['pending', 'submitted', 'under_review'];
      return cancelableStatuses.includes(claim.value.status);
    });

    // Methods
    const fetchClaimStatus = async () => {
      // Try to use API first if not forcing mock data
      if (!useMockData.value) {
        try {
          loading.value = true;
          error.value = null;
          
          // Check if claimService exists (API might not be ready yet)
          if (typeof window.claimService !== 'undefined') {
            const response = await window.claimService.getClaimStatus(props.claimId);
            
            if (response.success) {
              claim.value = {
                ...claim.value,
                ...response.data,
                phases: response.data.phases || generatePhasesFromStatus(response.data.status)
              };
              
              emit('status-updated', claim.value);
              loading.value = false;
              return;
            } else {
              throw new Error(response.message || 'Failed to fetch claim status');
            }
          } else {
            // API service not available, fall back to mock data
            console.log('API service not available, using mock data');
            useMockData.value = true;
          }
        } catch (err) {
          console.warn('API call failed, falling back to mock data:', err.message);
          error.value = err.message;
          useMockData.value = true;
          emit('error', err);
        } finally {
          loading.value = false;
        }
      } else {
        // Already using mock data, just refresh it
        claim.value = getMockClaim(props.claimId);
      }
    };

    const retryApi = () => {
      useMockData.value = false;
      error.value = null;
      fetchClaimStatus();
    };

    const generatePhasesFromStatus = (status) => {
      const phaseConfig = getPhaseByStatus(status);
      return claimPhasesConfig.map(phase => ({
        ...phase,
        completed: phase.order < phaseConfig.order,
        current: phase.order === phaseConfig.order
      }));
    };

    const getStatusDisplay = (status) => {
      return claimStatusConfig[status]?.display || status;
    };

    const getStatusClass = (status) => {
      return claimStatusConfig[status]?.class || 'status-pending';
    };

    const formatDate = (dateString) => {
      if (!dateString) return 'Recently';
      
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    };

    const formatDateShort = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleCancelClaim = async () => {
      if (!confirm('Are you sure you want to cancel this claim? This action cannot be undone.')) {
        return;
      }

      try {
        loading.value = true;
        
        if (!useMockData.value) {
          // Try API cancellation
          if (typeof window.claimService !== 'undefined') {
            const response = await window.claimService.cancelClaim(props.claimId);
            
            if (response.success) {
              claim.value.status = 'cancelled';
              emit('cancel-claim', claim.value);
              await fetchClaimStatus();
            } else {
              throw new Error(response.message || 'Failed to cancel claim');
            }
          } else {
            // Fall back to mock cancellation
            claim.value.status = 'cancelled';
            emit('cancel-claim', claim.value);
          }
        } else {
          // Mock cancellation
          claim.value.status = 'cancelled';
          emit('cancel-claim', claim.value);
        }
      } catch (err) {
        error.value = err.message;
        emit('error', err);
        // Even if API fails, update UI with mock cancellation
        claim.value.status = 'cancelled';
      } finally {
        loading.value = false;
      }
    };

    const startAutoRefresh = () => {
      if (props.autoRefresh && !refreshTimer.value) {
        refreshTimer.value = setInterval(fetchClaimStatus, props.refreshInterval);
      }
    };

    const stopAutoRefresh = () => {
      if (refreshTimer.value) {
        clearInterval(refreshTimer.value);
        refreshTimer.value = null;
      }
    };

    // Lifecycle
    onMounted(async () => {
      // Start with mock data immediately if forced
      if (props.forceMockData) {
        useMockData.value = true;
        loading.value = false;
      } else {
        // Try API, fall back to mock if fails
        await fetchClaimStatus();
      }
      startAutoRefresh();
    });

    // Watchers
    watch(() => props.claimId, async () => {
      if (useMockData.value) {
        claim.value = getMockClaim(props.claimId);
      } else {
        await fetchClaimStatus();
      }
    });

    watch(() => props.autoRefresh, (newValue) => {
      if (newValue) {
        startAutoRefresh();
      } else {
        stopAutoRefresh();
      }
    });

    // Cleanup
    const cleanup = () => {
      stopAutoRefresh();
    };

    // Expose methods to parent if needed
    const refresh = fetchClaimStatus;
    const switchToMock = () => {
      useMockData.value = true;
      claim.value = getMockClaim(props.claimId);
    };
    const switchToApi = retryApi;

    return {
      claim,
      loading,
      error,
      phases,
      progressPercentage,
      showCancelButton,
      useMockData,
      fetchClaimStatus,
      retryApi,
      getStatusDisplay,
      getStatusClass,
      formatDate,
      formatDateShort,
      handleCancelClaim,
      refresh,
      switchToMock,
      switchToApi
    };
  }
};
</script>

<style scoped>
@import '../../../../styles/views/Leave/Claim/ActiveClaimTracker.css';

/* Loading State */
.tracker-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--muted-light);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-light);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

/* Error State */
.tracker-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
  color: var(--error);
  background: rgba(239, 68, 68, 0.05);
  border-radius: 8px;
}

.tracker-error .material-symbols-outlined {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.tracker-error button {
  background: none;
  border: none;
  color: var(--primary);
  text-decoration: underline;
  cursor: pointer;
  margin: 0.25rem;
  font-size: 0.875rem;
}

.use-mock-btn {
  color: var(--warning) !important;
}

/* Demo Indicator */
.demo-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 6px;
  color: #f59e0b;
  font-size: 0.75rem;
  margin-bottom: 1rem;
}

.demo-indicator .material-symbols-outlined {
  font-size: 1rem;
}

.retry-api-btn {
  background: rgba(245, 158, 11, 0.2);
  border: 1px solid rgba(245, 158, 11, 0.3);
  color: #f59e0b;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  margin-left: auto;
}

.retry-api-btn:hover {
  background: rgba(245, 158, 11, 0.3);
}

/* Status Badge Variations */
.status-badge.submitted {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border-color: rgba(245, 158, 11, 0.2);
}

.status-badge.under_review {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border-color: rgba(59, 130, 246, 0.2);
}

.status-badge.approved {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-color: rgba(16, 185, 129, 0.2);
}

.status-badge.paid {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  border-color: rgba(34, 197, 94, 0.2);
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.2);
}

.status-badge.cancelled {
  background: rgba(107, 114, 128, 0.1);
  color: #6b7280;
  border-color: rgba(107, 114, 128, 0.2);
}

/* Cancel Button */
.cancel-claim-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: transparent;
  color: var(--error);
  border: 1px solid var(--error);
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.cancel-claim-btn:hover {
  background: rgba(239, 68, 68, 0.05);
  transform: translateY(-1px);
}

/* Animations */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive Actions */
.tracker-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-light);
}

@media (max-width: 768px) {
  .tracker-actions {
    flex-direction: column;
  }
  
  .view-details-btn,
  .cancel-claim-btn {
    width: 100%;
    justify-content: center;
  }
  
  .demo-indicator {
    flex-wrap: wrap;
  }
  
  .retry-api-btn {
    margin-left: 0;
    margin-top: 0.25rem;
  }
}

/* Dark mode support */
.dark .tracker-error {
  background: rgba(239, 68, 68, 0.1);
}

.dark .cancel-claim-btn:hover {
  background: rgba(239, 68, 68, 0.15);
}

.dark .demo-indicator {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
}

.dark .retry-api-btn {
  background: rgba(245, 158, 11, 0.25);
  border-color: rgba(245, 158, 11, 0.4);
}

.dark .retry-api-btn:hover {
  background: rgba(245, 158, 11, 0.35);
}
</style>