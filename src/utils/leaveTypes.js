export const leaveTypes = [
  { id: 'AL', name: 'Annual Leave', category: 'Personal', color: '#10B981', icon: 'beach_access' },
  { id: 'MC', name: 'Medical Leave', category: 'Health', color: '#EF4444', icon: 'medical_services' },
  { id: 'CL', name: 'Compassionate Leave', category: 'Family', color: '#ec4899', icon: 'favorite' },
  { id: 'OS', name: 'Onsite Plan', category: 'Work', color: '#f59e0b', icon: 'location_on' },
  { id: 'WFH', name: 'Work From Home', category: 'Work', color: '#6366F1', icon: 'home' },
  { id: 'EL', name: 'Emergency Leave', category: 'Emergency', color: '#6b7280', icon: 'warning' },
  { id: 'BF', name: 'Brought Forward', category: 'Carryover', color: '#10b981', icon: 'event_available' },
  { id: 'ML', name: 'Maternity Leave', category: 'Family', color: '#8b5cf6', icon: 'pregnant_woman' },
  { id: 'PL', name: 'Parental Leave', category: 'Family', color: '#8b5cf6', icon: 'family_restroom' }
];

export const approvalStatuses = [
  { id: 'pending', name: 'Pending', color: '#F59E0B', icon: 'pending' },
  { id: 'approved', name: 'Approved', color: '#10B981', icon: 'check_circle' },
  { id: 'rejected', name: 'Rejected', color: '#EF4444', icon: 'cancel' },
  { id: 'cancelled', name: 'Cancelled', color: '#6B7280', icon: 'cancel' }
];

/**
 * Normalize a leave type string to its proper display name
 * Handles abbreviations (AL, MC, OS, etc.), full names, and aliases
 */
export function normalizeLeaveType(type) {
  if (!type) return 'Annual Leave';

  const trimmedType = type.trim();
  const lowerType = trimmedType.toLowerCase();
  const upperType = trimmedType.toUpperCase();

  // 1. Check exact abbreviation match (case-insensitive)
  const matchedByAbbreviation = leaveTypes.find(lt =>
    lt.id.toUpperCase() === upperType
  );

  if (matchedByAbbreviation) {
    return matchedByAbbreviation.name;
  }

  // 2. Check exact name match
  const matchedByName = leaveTypes.find(lt =>
    lt.name.toLowerCase() === lowerType
  );

  if (matchedByName) {
    return matchedByName.name;
  }

  // 3. Check partial name match
  const matchedByPartial = leaveTypes.find(lt =>
    lt.name.toLowerCase().includes(lowerType) ||
    lowerType.includes(lt.id.toLowerCase())
  );

  if (matchedByPartial) {
    return matchedByPartial.name;
  }

  // 4. Check approval statuses
  const matchedStatus = approvalStatuses.find(status =>
    status.id === lowerType || status.name.toLowerCase() === lowerType
  );

  if (matchedStatus) {
    return matchedStatus.name;
  }

  // 5. Check common aliases
  const aliasMap = {
    'sick': 'Medical Leave',
    'vacation': 'Annual Leave',
    'holiday': 'Annual Leave',
    'special': 'Compassionate Leave',
    'bereavement': 'Compassionate Leave',
    'remote': 'Onsite Plan',
    'client site': 'Onsite Plan',
    'work from home': 'Work From Home',
    'home office': 'Work From Home',
    'urgent': 'Emergency Leave',
    'pregnancy': 'Maternity Leave',
    'paternity': 'Parental Leave',
    'carryover': 'Brought Forward',
    'annual': 'Annual Leave',
    'medical': 'Medical Leave',
    'compassionate': 'Compassionate Leave',
    'onsite': 'Onsite Plan',
    'wfh': 'Work From Home',
    'emergency': 'Emergency Leave',
    'brought forward': 'Brought Forward',
    'maternity': 'Maternity Leave',
    'parental': 'Parental Leave'
  };

  if (aliasMap[lowerType]) {
    return aliasMap[lowerType];
  }

  // 6. Default to capitalized version
  return capitalizeFirstLetter(type);
}

/**
 * Get the leave type configuration by ID (accepts both abbreviation and name)
 */
export function getLeaveTypeConfig(typeId) {
  if (!typeId) return null;

  const upperTypeId = typeId.toUpperCase().trim();

  // First try exact abbreviation match
  const byAbbreviation = leaveTypes.find(lt => lt.id === upperTypeId);
  if (byAbbreviation) return byAbbreviation;

  // Then try to normalize and find by name
  const normalized = normalizeLeaveType(typeId);
  return leaveTypes.find(lt => lt.name === normalized) || null;
}

/**
 * Get status configuration by ID
 */
export function getStatusConfig(statusId) {
  if (!statusId) return null;
  return approvalStatuses.find(s => s.id === statusId.toLowerCase()) || null;
}

/**
 * Capitalize the first letter of a string
 */
export function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

/**
 * Get the icon for a leave type
 */
export function getLeaveTypeIcon(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.icon : 'event';
}

/**
 * Get the color for a leave type
 */
export function getLeaveTypeColor(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.color : '#6B7280';
}

/**
 * Get the category for a leave type
 */
export function getLeaveTypeCategory(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.category : 'Other';
}

/**
 * Get CSS class for a leave type (returns lowercase abbreviation)
 */
export function getLeaveTypeClass(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.id.toLowerCase() : 'default';
}

/**
 * Get all common leave types for legends/guides
 */
export function getCommonLeaveTypes() {
  const commonTypeIds = ['AL', 'MC', 'OS', 'WFH', 'CL', 'BF'];
  return commonTypeIds.map(typeId => {
    const config = getLeaveTypeConfig(typeId);
    return {
      id: typeId,
      displayName: config ? config.name : typeId,
      className: typeId.toLowerCase(),
      color: config ? config.color : '#6B7280'
    };
  });
}

/**
 * Get all leave types in legend format
 */
export function getLegendLeaveTypes() {
  return leaveTypes.map(type => ({
    id: type.id,
    displayName: type.name,
    className: type.id.toLowerCase(),
    color: type.color,
    icon: type.icon,
    category: type.category
  }));
}

/**
 * Get color variants for different UI states
 */
export function getColorVariants(color) {
  const colorMap = {
    '#10B981': { // Green - Annual Leave
      light: 'rgba(16, 185, 129, 0.15)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#065F46'
    },
    '#EF4444': { // Red - Medical Leave
      light: 'rgba(239, 68, 68, 0.15)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#991B1B'
    },
    '#ec4899': { // Pink - Compassionate Leave
      light: 'rgba(236, 72, 153, 0.15)',
      border: 'rgba(236, 72, 153, 0.3)',
      text: '#9D174D'
    },
    '#f59e0b': { // Orange - Onsite Plan
      light: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#92400E'
    },
    '#6366F1': { // Indigo - Work From Home
      light: 'rgba(99, 102, 241, 0.15)',
      border: 'rgba(99, 102, 241, 0.3)',
      text: '#3730A3'
    },
    '#6b7280': { // Gray - Emergency Leave
      light: 'rgba(107, 114, 128, 0.15)',
      border: 'rgba(107, 114, 128, 0.3)',
      text: '#4B5563'
    },
    '#8b5cf6': { // Purple - Maternity/Parental Leave
      light: 'rgba(139, 92, 246, 0.15)',
      border: 'rgba(139, 92, 246, 0.3)',
      text: '#5B21B6'
    },
    '#F59E0B': { // Amber - Pending status
      light: 'rgba(245, 158, 11, 0.15)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#92400E'
    }
  };

  return colorMap[color] || {
    light: 'rgba(107, 114, 128, 0.15)',
    border: 'rgba(107, 114, 128, 0.3)',
    text: '#4B5563'
  };
}

/**
 * Get the dot class for a leave type
 */
export function getLeaveTypeDotClass(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? `legend-label-dot-${config.id.toLowerCase()}` : 'legend-label-dot-default';
}

/**
 * Get the dot color for a leave type
 */
export function getLeaveTypeDotColor(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.color : '#6B7280';
}

/**
 * Generate CSS for leave type dots
 */
export function generateLeaveTypeDotCSS() {
  let css = '.legend-label-dot {\n';
  css += '  width: 8px;\n';
  css += '  height: 8px;\n';
  css += '  border-radius: 50%;\n';
  css += '  flex-shrink: 0;\n';
  css += '  display: inline-block;\n'; /* Added this */
  css += '}\n\n';

  // Generate dot styles for each leave type
  leaveTypes.forEach(type => {
    const className = type.id.toLowerCase();
    css += `.legend-label-dot-${className} {\n`;
    css += `  background-color: ${type.color};\n`;
    css += '}\n\n';
  });

  // Generate dot styles for statuses
  approvalStatuses.forEach(status => {
    const className = status.id.toLowerCase();
    css += `.legend-label-dot-${className} {\n`;
    css += `  background-color: ${status.color};\n`;
    css += '}\n\n';
  });

  css += `.legend-label-dot-default {\n`;
  css += '  background-color: #6B7280;\n';
  css += '}\n';

  return css;
}

/**
 * Get CSS for all leave types
 */
export function generateLeaveTypeCSS() {
  let css = '';

  // Include the dot CSS first
  css += generateLeaveTypeDotCSS();

  leaveTypes.forEach(type => {
    const variants = getColorVariants(type.color);
    const className = type.id.toLowerCase();

    css += `
      /* Leave type ${type.name} */
      .legend-color.${className} { background: ${type.color}; }
      .guide-color.${className} { background: ${type.color}; }
      .status-dot-${className} { background-color: ${type.color}; }
      
      .type-icon-wrapper.${className} {
        background-color: ${variants.light};
        color: ${type.color};
      }
      
      .day-member-item.${className} {
        background: ${variants.light};
        border-left: 3px solid ${type.color};
      }
      
      .member-item.${className} {
        border-left-color: ${type.color};
      }
      
      .stacked-avatar-name-line.${className} {
        background: ${variants.light};
        border-left: 3px solid ${type.color};
      }
      
      /* Dot styles - already included in generateLeaveTypeDotCSS() */
    `;
  });

  // Add status colors
  approvalStatuses.forEach(status => {
    const variants = getColorVariants(status.color);
    const className = status.id.toLowerCase();

    css += `
      .status-badge.${className} {
        background-color: ${variants.light};
        color: ${variants.text};
      }
      
      .status-dot-${className} {
        background-color: ${status.color};
      }
    `;
  });

  return css;
}

/**
 * Get inline style object for a leave type dot
 */
export function getLeaveTypeDotStyle(typeId, size = '8px') {
  const color = getLeaveTypeDotColor(typeId);
  return {
    width: size,
    height: size,
    backgroundColor: color,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-block'
  };
}

/**
 * Get complete dot configuration
 */
export function getLeaveTypeDotConfig(typeId) {
  const config = getLeaveTypeConfig(typeId);
  if (!config) {
    return {
      className: 'legend-label-dot-default',
      color: '#6B7280',
      style: {
        backgroundColor: '#6B7280',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        flexShrink: 0,
        display: 'inline-block'
      }
    };
  }

  const className = config.id.toLowerCase();
  return {
    className: `legend-label-dot-${className}`,
    color: config.color,
    style: {
      backgroundColor: config.color,
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      flexShrink: 0,
      display: 'inline-block'
    }
  };
}

/**
 * Inject CSS variables for leave types
 */
export function injectLeaveTypeCSSVariables() {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  leaveTypes.forEach(type => {
    const variants = getColorVariants(type.color);
    const varName = type.id.toLowerCase();

    root.style.setProperty(`--color-${varName}`, type.color);
    root.style.setProperty(`--color-${varName}-light`, variants.light);
    root.style.setProperty(`--color-${varName}-border`, variants.border);
    root.style.setProperty(`--color-${varName}-text`, variants.text);
  });

  approvalStatuses.forEach(status => {
    const variants = getColorVariants(status.color);
    const varName = status.id.toLowerCase();

    root.style.setProperty(`--color-${varName}`, status.color);
    root.style.setProperty(`--color-${varName}-light`, variants.light);
    root.style.setProperty(`--color-${varName}-border`, variants.border);
    root.style.setProperty(`--color-${varName}-text`, variants.text);
  });
}

/**
 * Validate if a leave type ID is valid
 */
export function isValidLeaveType(typeId) {
  return !!getLeaveTypeConfig(typeId);
}

/**
 * Convert a leave type to its abbreviation
 */
export function getLeaveTypeAbbreviation(typeId) {
  const config = getLeaveTypeConfig(typeId);
  return config ? config.id : 'AL'; // Default to Annual Leave
}

/**
 * Get all leave type abbreviations
 */
export function getAllLeaveTypeAbbreviations() {
  return leaveTypes.map(lt => lt.id);
}

/**
 * Get leave types by category
 */
export function getLeaveTypesByCategory(category) {
  return leaveTypes.filter(lt => lt.category === category);
}