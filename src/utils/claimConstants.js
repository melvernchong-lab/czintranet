// Claim Status Configuration
export const claimStatusConfig = {
  draft: {
    display: 'Draft',
    order: 0,
    class: 'status-draft'
  },
  submitted: {
    display: 'Submitted',
    order: 1,
    class: 'status-submitted'
  },
  under_review: {
    display: 'Under Review',
    order: 2,
    class: 'status-under_review'
  },
  manager_approved: {
    display: 'Manager Approved',
    order: 3,
    class: 'status-approved'
  },
  finance_review: {
    display: 'Finance Review',
    order: 4,
    class: 'status-under_review'
  },
  approved: {
    display: 'Approved',
    order: 5,
    class: 'status-approved'
  },
  processing: {
    display: 'Processing Payment',
    order: 6,
    class: 'status-processing'
  },
  paid: {
    display: 'Paid',
    order: 7,
    class: 'status-paid'
  },
  rejected: {
    display: 'Rejected',
    order: -1,
    class: 'status-rejected'
  },
  cancelled: {
    display: 'Cancelled',
    order: -2,
    class: 'status-cancelled'
  }
};

// Claim Phases Configuration
export const claimPhasesConfig = [
  {
    key: 'employee',
    name: 'Employee',
    order: 1,
    icon: 'person'
  },
  {
    key: 'manager',
    name: 'Manager',
    order: 2,
    icon: 'supervisor_account'
  },
  {
    key: 'finance',
    name: 'Finance',
    order: 3,
    icon: 'account_balance'
  },
  {
    key: 'processing',
    name: 'Processing',
    order: 4,
    icon: 'sync'
  },
  {
    key: 'completed',
    name: 'Completed',
    order: 5,
    icon: 'check_circle'
  }
];

// Helper functions
export const getPhaseByStatus = (status) => {
  const statusOrder = claimStatusConfig[status]?.order || 0;
  
  if (statusOrder <= 0) return claimPhasesConfig[0]; // Draft/Rejected/Cancelled
  
  const phase = claimPhasesConfig.find(p => p.order === statusOrder) || 
                claimPhasesConfig[claimPhasesConfig.length - 1];
  return phase;
};

export const getNextStatus = (currentStatus) => {
  const statuses = Object.keys(claimStatusConfig);
  const currentIndex = statuses.indexOf(currentStatus);
  
  if (currentIndex < statuses.length - 1) {
    return statuses[currentIndex + 1];
  }
  
  return currentStatus;
};

export const isValidStatusTransition = (fromStatus, toStatus) => {
  const validTransitions = {
    draft: ['submitted', 'cancelled'],
    submitted: ['under_review', 'rejected', 'cancelled'],
    under_review: ['manager_approved', 'rejected', 'cancelled'],
    manager_approved: ['finance_review', 'rejected', 'cancelled'],
    finance_review: ['approved', 'rejected', 'cancelled'],
    approved: ['processing', 'rejected', 'cancelled'],
    processing: ['paid', 'rejected', 'cancelled'],
    paid: [], // Terminal state
    rejected: [], // Terminal state
    cancelled: [] // Terminal state
  };
  
  return validTransitions[fromStatus]?.includes(toStatus) || false;
};

// API Status Mapping
export const mapApiStatus = (apiStatus) => {
  if (!apiStatus) return 'draft';
  
  const statusMap = {
    'PENDING': 'submitted',
    'IN_REVIEW': 'under_review',
    'APPROVED': 'approved',
    'PAID': 'paid',
    'REJECTED': 'rejected',
    'CANCELLED': 'cancelled',
    'DRAFT': 'draft',
    'SUBMITTED': 'submitted',
    'UNDER_REVIEW': 'under_review',
    'MANAGER_APPROVED': 'manager_approved',
    'FINANCE_REVIEW': 'finance_review',
    'PROCESSING': 'processing'
  };
  
  // Convert to uppercase for case-insensitive matching
  const upperStatus = apiStatus.toUpperCase();
  return statusMap[upperStatus] || apiStatus.toLowerCase();
};

// Helper to get status display text
export const getStatusDisplay = (status) => {
  return claimStatusConfig[status]?.display || status;
};

// Helper to get status class
export const getStatusClass = (status) => {
  return claimStatusConfig[status]?.class || 'status-pending';
};