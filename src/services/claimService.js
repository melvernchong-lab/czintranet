// /src/services/claimService.js
import api from '@/api/axiosConfig';
import { mapApiStatus, isValidStatusTransition } from '@/utils/claimConstants';

// Inline Cache Service (move to separate file later if needed)
const cacheService = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const { data, timestamp, ttl } = JSON.parse(item);
      
      // Check if cache is expired
      if (Date.now() - timestamp > ttl) {
        localStorage.removeItem(key);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  set(key, data, ttl = 5 * 60 * 1000) {
    try {
      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};

/**
 * Claims Service - Handles all API operations related to claims
 */
export const claimService = {
  // Cache configuration
  CACHE_KEYS: {
    CLAIMS_LIST: 'claims_list',
    CLAIM_DETAIL: 'claim_detail_',
    CLAIM_STATUS: 'claim_status_',
    CLAIM_TIMELINE: 'claim_timeline_'
  },
  
  CACHE_TTL: {
    LIST: 5 * 60 * 1000, // 5 minutes for lists
    DETAIL: 10 * 60 * 1000, // 10 minutes for details
    STATUS: 30 * 1000, // 30 seconds for status
    TIMELINE: 2 * 60 * 1000 // 2 minutes for timeline
  },

  // ==================== CRUD Operations ====================

  /**
   * Get all claims with pagination and filters
   */
  async getClaims(params = {}) {
    const cacheKey = `${this.CACHE_KEYS.CLAIMS_LIST}_${JSON.stringify(params)}`;
    
    try {
      // Check cache first
      const cached = cacheService.get(cacheKey);
      if (cached && !params.forceRefresh) {
        return {
          success: true,
          data: cached.data,
          fromCache: true,
          metadata: cached.metadata
        };
      }

      const response = await api.get('/claims', { params });
      const claims = response.data.data || response.data;
      const metadata = {
        pagination: response.data.pagination,
        total: response.data.total,
        page: response.data.page,
        limit: response.data.limit
      };

      // Cache the response
      cacheService.set(cacheKey, { data: claims, metadata }, this.CACHE_TTL.LIST);

      return {
        success: true,
        data: claims,
        fromCache: false,
        metadata,
        message: 'Claims retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching claims:', error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to fetch claims'),
        error: error.response?.data || error.message,
        status: error.response?.status
      };
    }
  },

  /**
   * Get a single claim by ID
   */
  async getClaimById(claimId, forceRefresh = false) {
    const cacheKey = `${this.CACHE_KEYS.CLAIM_DETAIL}${claimId}`;
    
    try {
      // Check cache first
      if (!forceRefresh) {
        const cached = cacheService.get(cacheKey);
        if (cached) {
          return {
            success: true,
            data: cached,
            fromCache: true
          };
        }
      }

      const response = await api.get(`/claims/${claimId}`);
      const claim = this.normalizeClaimData(response.data);

      // Cache the claim
      cacheService.set(cacheKey, claim, this.CACHE_TTL.DETAIL);

      // Also clear any list caches since we have fresh data
      this.clearListCaches();

      return {
        success: true,
        data: claim,
        fromCache: false
      };
    } catch (error) {
      console.error(`Error fetching claim ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to fetch claim details'),
        error: error.response?.data || error.message
      };
    }
  },

  /**
   * Create a new claim
   */
  async createClaim(claimData) {
    try {
      const formData = this.prepareClaimFormData(claimData);
      
      const response = await api.post('/claims', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const newClaim = this.normalizeClaimData(response.data);

      // Clear relevant caches
      this.clearListCaches();
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_DETAIL}${newClaim.id}`);

      return {
        success: true,
        data: newClaim,
        message: 'Claim created successfully'
      };
    } catch (error) {
      console.error('Error creating claim:', error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to create claim'),
        error: error.response?.data || error.message,
        validationErrors: error.response?.data?.errors
      };
    }
  },

  /**
   * Update an existing claim
   */
  async updateClaim(claimId, claimData) {
    try {
      const formData = this.prepareClaimFormData(claimData, true);
      
      const response = await api.put(`/claims/${claimId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedClaim = this.normalizeClaimData(response.data);

      // Clear caches
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_DETAIL}${claimId}`);
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_STATUS}${claimId}`);
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_TIMELINE}${claimId}`);
      this.clearListCaches();

      return {
        success: true,
        data: updatedClaim,
        message: 'Claim updated successfully'
      };
    } catch (error) {
      console.error(`Error updating claim ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to update claim'),
        error: error.response?.data || error.message,
        validationErrors: error.response?.data?.errors
      };
    }
  },

  /**
   * Delete a claim
   */
  async deleteClaim(claimId, reason = '') {
    try {
      const response = await api.delete(`/claims/${claimId}`, {
        data: { reason }
      });

      // Clear all related caches
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_DETAIL}${claimId}`);
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_STATUS}${claimId}`);
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_TIMELINE}${claimId}`);
      this.clearListCaches();

      return {
        success: true,
        message: response.data.message || 'Claim deleted successfully',
        data: response.data
      };
    } catch (error) {
      console.error(`Error deleting claim ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to delete claim'),
        error: error.response?.data || error.message
      };
    }
  },

  // ==================== Status Management ====================

  /**
   * Get claim status
   */
  async getClaimStatus(claimId) {
    const cacheKey = `${this.CACHE_KEYS.CLAIM_STATUS}${claimId}`;
    
    try {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }

      const response = await api.get(`/claims/${claimId}/status`);
      const statusData = {
        ...response.data,
        status: mapApiStatus(response.data.status)
      };

      cacheService.set(cacheKey, statusData, this.CACHE_TTL.STATUS);

      return {
        success: true,
        data: statusData,
        fromCache: false
      };
    } catch (error) {
      console.error(`Error fetching claim status ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to fetch claim status'),
        error: error.response?.data || error.message
      };
    }
  },

  /**
   * Update claim status
   */
  async updateClaimStatus(claimId, status, notes = '') {
    try {
      // Validate status transition
      const currentStatus = await this.getCurrentStatus(claimId);
      if (currentStatus && !isValidStatusTransition(currentStatus, status)) {
        return {
          success: false,
          message: `Invalid status transition from ${currentStatus} to ${status}`
        };
      }

      const response = await api.put(`/claims/${claimId}/status`, { 
        status, 
        notes,
        changedBy: this.getCurrentUserId()
      });

      // Clear caches
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_STATUS}${claimId}`);
      cacheService.remove(`${this.CACHE_KEYS.CLAIM_DETAIL}${claimId}`);
      this.clearListCaches();

      return {
        success: true,
        data: response.data,
        message: 'Claim status updated successfully'
      };
    } catch (error) {
      console.error(`Error updating claim status ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to update claim status'),
        error: error.response?.data || error.message
      };
    }
  },

  /**
   * Cancel a claim
   */
  async cancelClaim(claimId, reason = '') {
    return this.updateClaimStatus(claimId, 'cancelled', reason);
  },

  /**
   * Reject a claim
   */
  async rejectClaim(claimId, reason = '') {
    return this.updateClaimStatus(claimId, 'rejected', reason);
  },

  /**
   * Approve a claim
   */
  async approveClaim(claimId, notes = '') {
    return this.updateClaimStatus(claimId, 'approved', notes);
  },

  // ==================== Timeline & History ====================

  /**
   * Get claim timeline/history
   */
  async getClaimTimeline(claimId) {
    const cacheKey = `${this.CACHE_KEYS.CLAIM_TIMELINE}${claimId}`;
    
    try {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          fromCache: true
        };
      }

      const response = await api.get(`/claims/${claimId}/timeline`);
      
      cacheService.set(cacheKey, response.data, this.CACHE_TTL.TIMELINE);

      return {
        success: true,
        data: response.data,
        fromCache: false
      };
    } catch (error) {
      console.error(`Error fetching claim timeline ${claimId}:`, error);
      return {
        success: false,
        message: this.getErrorMessage(error, 'Failed to fetch claim history'),
        error: error.response?.data || error.message
      };
    }
  },

  // ==================== Helper Methods ====================

  /**
   * Normalize claim data from API
   */
  normalizeClaimData(apiData) {
    return {
      id: apiData.id,
      claimId: apiData.claimId || apiData.id,
      type: apiData.type,
      category: apiData.category,
      amount: parseFloat(apiData.amount) || 0,
      status: mapApiStatus(apiData.status),
      description: apiData.description,
      submittedDate: apiData.submittedDate || apiData.createdAt,
      processedDate: apiData.processedDate,
      paidDate: apiData.paidDate,
      receipt: apiData.hasReceipt || false,
      attachments: apiData.attachments || [],
      comments: apiData.comments || [],
      userId: apiData.userId,
      userName: apiData.userName,
      approverId: apiData.approverId,
      approverName: apiData.approverName,
      rejectionReason: apiData.rejectionReason,
      notes: apiData.notes,
      currency: apiData.currency || 'USD',
      exchangeRate: apiData.exchangeRate || 1,
      // Additional fields for UI
      statusDisplay: apiData.statusDisplay || apiData.status,
      categoryDisplay: apiData.categoryDisplay || apiData.category,
      formattedAmount: this.formatCurrency(apiData.amount, apiData.currency)
    };
  },

  /**
   * Prepare form data for claim submission/update
   */
  prepareClaimFormData(claimData, isUpdate = false) {
    const formData = new FormData();
    
    // Add claim data
    formData.append('type', claimData.type);
    formData.append('category', claimData.category);
    formData.append('amount', claimData.amount);
    formData.append('description', claimData.description);
    
    if (claimData.date) formData.append('date', claimData.date);
    if (claimData.currency) formData.append('currency', claimData.currency);
    if (claimData.exchangeRate) formData.append('exchangeRate', claimData.exchangeRate);
    if (claimData.notes) formData.append('notes', claimData.notes);
    
    // Add receipt file if provided
    if (claimData.receiptFile) {
      formData.append('receipt', claimData.receiptFile);
    }
    
    return formData;
  },

  /**
   * Get current claim status (helper for validation)
   */
  async getCurrentStatus(claimId) {
    try {
      const response = await this.getClaimStatus(claimId);
      if (response.success) {
        return response.data.status;
      }
      return null;
    } catch (error) {
      console.error(`Error getting current status for claim ${claimId}:`, error);
      return null;
    }
  },

  /**
   * Format currency
   */
  formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  },

  /**
   * Clear all list caches
   */
  clearListCaches() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.CACHE_KEYS.CLAIMS_LIST)) {
        cacheService.remove(key);
      }
    });
  },

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error, defaultMessage) {
    if (error.response) {
      switch (error.response.status) {
        case 400:
          return error.response.data.message || 'Invalid request. Please check your input.';
        case 401:
          return 'You need to be logged in to perform this action.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'Claim not found.';
        case 409:
          return 'This claim cannot be modified in its current state.';
        case 422:
          return 'Validation error. Please check your input.';
        case 429:
          return 'Too many requests. Please try again later.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return error.response.data.message || defaultMessage;
      }
    } else if (error.request) {
      return 'Network error. Please check your connection.';
    } else {
      return error.message || defaultMessage;
    }
  },

  /**
   * Get current user ID (to be implemented based on your auth system)
   */
  getCurrentUserId() {
    // This should come from your auth system
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id || 'current-user-id';
  }
};

export default claimService;