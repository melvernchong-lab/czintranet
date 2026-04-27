import { 
  leaveTypes, 
  approvalStatuses,
  normalizeLeaveType, 
  getLeaveTypeConfig,
  getLeaveTypeIcon,
  getLeaveTypeColor,
  getLeaveTypeCategory,
  getLeaveTypeClass,
  isValidLeaveType,
  getLeaveTypeAbbreviation,
  getStatusConfig
} from './leaveTypes';

/**
 * Malaysian Public Holidays - Initial static data as fallback
 */
export const malaysianHolidays = {
  2024: [
    { date: '2024-01-01', name: 'New Year\'s Day', type: 'national' },
    { date: '2024-01-26', name: 'Thaipusam', type: 'national' },
    { date: '2024-02-10', name: 'Chinese New Year', type: 'national' },
    { date: '2024-02-11', name: 'Chinese New Year Holiday', type: 'national' },
    { date: '2024-03-11', name: 'Hari Raya Puasa', type: 'national' },
    { date: '2024-03-12', name: 'Hari Raya Puasa Holiday', type: 'national' },
    { date: '2024-04-10', name: 'Hari Raya Haji', type: 'national' },
    { date: '2024-05-01', name: 'Labour Day', type: 'national' },
    { date: '2024-05-22', name: 'Wesak Day', type: 'national' },
    { date: '2024-06-03', name: 'Agong\'s Birthday', type: 'national' },
    { date: '2024-06-17', name: 'Hari Raya Qurban', type: 'national' },
    { date: '2024-08-31', name: 'Merdeka Day', type: 'national' },
    { date: '2024-09-16', name: 'Malaysia Day', type: 'national' },
    { date: '2024-10-31', name: 'Deepavali', type: 'national' },
    { date: '2024-12-25', name: 'Christmas Day', type: 'national' },
    { date: '2024-12-31', name: 'New Year\'s Eve', type: 'observance' }
  ],
  2025: [
    { date: '2025-01-01', name: 'New Year\'s Day', type: 'national' },
    { date: '2025-01-14', name: 'Thaipusam', type: 'national' },
    { date: '2025-01-29', name: 'Chinese New Year', type: 'national' },
    { date: '2025-01-30', name: 'Chinese New Year Holiday', type: 'national' },
    { date: '2025-03-01', name: 'Hari Raya Puasa', type: 'national' },
    { date: '2025-03-02', name: 'Hari Raya Puasa Holiday', type: 'national' },
    { date: '2025-03-31', name: 'Hari Raya Haji', type: 'national' },
    { date: '2025-05-01', name: 'Labour Day', type: 'national' },
    { date: '2025-05-12', name: 'Wesak Day', type: 'national' },
    { date: '2025-06-02', name: 'Agong\'s Birthday', type: 'national' },
    { date: '2025-06-07', name: 'Hari Raya Qurban', type: 'national' },
    { date: '2025-08-31', name: 'Merdeka Day', type: 'national' },
    { date: '2025-09-16', name: 'Malaysia Day', type: 'national' },
    { date: '2025-10-20', name: 'Deepavali', type: 'national' },
    { date: '2025-12-25', name: 'Christmas Day', type: 'national' },
    { date: '2025-12-31', name: 'New Year\'s Eve', type: 'observance' }
  ]
};

/**
 * State-specific holidays
 */
export const stateHolidays = {
  'selangor': [
    { date: '2024-01-14', name: 'Sultan of Selangor\'s Birthday', type: 'state' },
    { date: '2025-01-12', name: 'Sultan of Selangor\'s Birthday', type: 'state' }
  ],
  'kuala-lumpur': [
    { date: '2024-02-01', name: 'Federal Territory Day', type: 'state' },
    { date: '2025-02-01', name: 'Federal Territory Day', type: 'state' }
  ],
  'johor': [
    { date: '2024-03-23', name: 'Hari Hol Almarhum Sultan Iskandar', type: 'state' }
  ],
  'penang': [
    { date: '2024-07-07', name: 'George Town World Heritage City Day', type: 'state' }
  ]
};

// ========== BACKEND INTEGRATION FUNCTIONS ==========

/**
 * Configuration for holiday data sources
 */
export const holidayDataSources = {
  LOCAL_STORAGE: 'local_storage',
  BACKEND_API: 'backend_api',
  EXTERNAL_API: 'external_api',
  CACHE: 'cache'
};

/**
 * Fetch latest Malaysian holidays from backend API
 */
export async function fetchLatestMalaysiaHolidays(options = {}) {
  const {
    year = new Date().getFullYear(),
    state = null,
    forceRefresh = false,
    source = holidayDataSources.BACKEND_API
  } = options;

  try {
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = getCachedHolidays(year, state);
      if (cached) {
        console.log(`Using cached holidays for ${year}${state ? ` (${state})` : ''}`);
        return cached;
      }
    }

    let holidays = [];

    switch (source) {
      case holidayDataSources.BACKEND_API:
        holidays = await fetchFromBackendAPI(year, state);
        break;
      
      case holidayDataSources.EXTERNAL_API:
        holidays = await fetchFromExternalAPI(year, state);
        break;
      
      case holidayDataSources.LOCAL_STORAGE:
        holidays = await fetchFromLocalStorage(year, state);
        break;
      
      default:
        holidays = getStaticHolidays(year, state);
    }

    // Cache the results
    cacheHolidays(year, state, holidays);
    
    // Update the static holidays object
    updateStaticHolidays(year, holidays, state);

    return holidays;

  } catch (error) {
    console.error('Error fetching Malaysia holidays:', error);
    
    // Fallback to static data
    return getStaticHolidays(year, state);
  }
}

/**
 * Get holidays with automatic backend fallback
 */
export async function getHolidaysWithFallback(year, state = null) {
  try {
    // Try to get from backend first
    return await fetchLatestMalaysiaHolidays({ year, state });
  } catch (error) {
    console.warn('Using static holiday data as fallback');
    return getStaticHolidays(year, state);
  }
}

// ========== UPCOMING EVENTS FUNCTIONS ==========

/**
 * Event types for consistent categorization
 */
export const eventTypes = {
  LEAVE: 'leave',
  HOLIDAY: 'holiday',
  BIRTHDAY: 'birthday',
  ANNIVERSARY: 'anniversary',
  MEETING: 'meeting',
  ONSITE: 'onsite',
  REMOTE: 'remote'
};

/**
 * Get upcoming events for a specific member
 */
export async function getMemberUpcomingEvents(member, options = {}) {
  const {
    daysAhead = 30,
    state = 'selangor',
    includeHolidays = true,
    includeBirthdays = false,
    useLiveHolidays = true
  } = options;

  const today = new Date();
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysAhead);

  const events = [];

  // 1. Get member's upcoming leave using leaveTypes utilities
  if (member.leaveRequests && Array.isArray(member.leaveRequests)) {
    member.leaveRequests.forEach(leave => {
      if (leave.status === 'approved' || leave.status === 'pending') {
        const startDate = new Date(leave.startDate);
        const endLeaveDate = new Date(leave.endDate);

        if (startDate <= endDate && endLeaveDate >= today) {
          const leaveTypeConfig = getLeaveTypeConfig(leave.type);
          const statusConfig = getStatusConfig(leave.status);
          
          events.push({
            type: eventTypes.LEAVE,
            id: leave.id,
            title: normalizeLeaveType(leave.type),
            description: leave.reason || 'Personal',
            startDate: leave.startDate,
            endDate: leave.endDate,
            status: leave.status,
            statusDisplay: statusConfig ? statusConfig.name : leave.status,
            statusColor: statusConfig ? statusConfig.color : '#6B7280',
            color: leaveTypeConfig ? leaveTypeConfig.color : '#6B7280',
            icon: leaveTypeConfig ? leaveTypeConfig.icon : 'event',
            category: leaveTypeConfig ? leaveTypeConfig.category : 'Other',
            className: leaveTypeConfig ? getLeaveTypeClass(leave.type) : 'default',
            abbreviation: leaveTypeConfig ? getLeaveTypeAbbreviation(leave.type) : 'AL',
            duration: calculateDuration(leave.startDate, leave.endDate),
            daysUntil: calculateDaysUntil(leave.startDate),
            isMultiDay: !isSameDay(leave.startDate, leave.endDate),
            memberId: member.id,
            memberName: member.name,
            isLeave: true
          });
        }
      }
    });
  }

  // 2. Get Malaysian holidays (using backend or static data)
  if (includeHolidays) {
    let holidays = [];
    
    if (useLiveHolidays) {
      try {
        const startYear = today.getFullYear();
        const endYear = endDate.getFullYear();
        
        for (let year = startYear; year <= endYear; year++) {
          const yearHolidays = await getHolidaysWithFallback(year, state);
          holidays.push(...yearHolidays);
        }
      } catch (error) {
        console.error('Error fetching holidays:', error);
        holidays = getHolidaysInRange(today, endDate, state);
      }
    } else {
      holidays = getHolidaysInRange(today, endDate, state);
    }
    
    holidays.forEach(holiday => {
      events.push({
        type: eventTypes.HOLIDAY,
        id: `holiday-${holiday.date}`,
        title: holiday.name,
        description: 'Public Holiday',
        startDate: holiday.date,
        endDate: holiday.date,
        status: 'holiday',
        statusDisplay: 'Holiday',
        statusColor: holiday.type === 'national' ? '#DC2626' : '#7C3AED',
        color: holiday.type === 'national' ? '#DC2626' : '#7C3AED',
        icon: holiday.type === 'national' ? 'flag' : 'location_city',
        category: 'Holiday',
        className: `holiday-${holiday.type}`,
        abbreviation: 'HOL',
        duration: '1 day',
        daysUntil: calculateDaysUntil(holiday.date),
        isMultiDay: false,
        isHoliday: true,
        holidayType: holiday.type,
        state: holiday.state
      });
    });
  }

  // 3. Sort events by date
  return events.sort((a, b) => {
    return new Date(a.startDate) - new Date(b.startDate);
  });
}

/**
 * Get the next upcoming event (leave or holiday)
 */
export function getNextUpcomingEvent(member, options = {}) {
  // Get all upcoming events
  const events = getMemberUpcomingEvents(member, options);
  
  // Return the first event (they should already be sorted by date)
  return events.length > 0 ? events[0] : null;
}

/**
 * Get leave countdown information
 */
export function getLeaveCountdown(member) {
  const nextLeave = getNextUpcomingEvent(member, { includeHolidays: false });
  
  if (!nextLeave) {
    return {
      hasUpcomingLeave: false,
      message: 'No upcoming leave scheduled'
    };
  }

  const daysUntil = calculateDaysUntil(nextLeave.startDate);
  
  return {
    hasUpcomingLeave: true,
    daysUntil,
    event: nextLeave,
    message: `${nextLeave.title} in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`,
    urgency: getUrgencyLevel(daysUntil)
  };
}

/**
 * Get upcoming events grouped by type
 */
export function getUpcomingEventsByType(member, options = {}) {
  const events = getMemberUpcomingEvents(member, options);
  const grouped = {};
  
  events.forEach(event => {
    const type = event.type;
    if (!grouped[type]) {
      grouped[type] = [];
    }
    grouped[type].push(event);
  });
  
  return grouped;
}

/**
 * Get upcoming events for a specific leave type
 */
export function getUpcomingEventsByLeaveType(member, leaveType, options = {}) {
  const events = getMemberUpcomingEvents(member, options);
  const normalizedType = normalizeLeaveType(leaveType);
  
  return events.filter(event => 
    event.type === eventTypes.LEAVE && 
    event.title === normalizedType
  );
}

/**
 * Check if a specific leave type has upcoming events
 */
export function hasUpcomingLeaveType(member, leaveType, options = {}) {
  return getUpcomingEventsByLeaveType(member, leaveType, options).length > 0;
}

// ========== HOLIDAY FUNCTIONS ==========

/**
 * Get holidays within a date range
 */
export function getHolidaysInRange(startDate, endDate, state = 'selangor') {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const holidays = [];

  // Get holidays for each year in the range
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = malaysianHolidays[year] || [];
    const stateYearHolidays = stateHolidays[state]?.filter(h => 
      h.date.startsWith(year.toString())
    ) || [];

    [...yearHolidays, ...stateYearHolidays].forEach(holiday => {
      const holidayDate = new Date(holiday.date);
      if (holidayDate >= startDate && holidayDate <= endDate) {
        holidays.push({
          ...holiday,
          year,
          state: state || null
        });
      }
    });
  }

  return holidays;
}

/**
 * Get Malaysian holiday calendar for a specific month
 */
export function getMonthlyHolidays(year, month, state = 'selangor') {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month
  
  return getHolidaysInRange(startDate, endDate, state);
}

// ========== WORKING DAYS CALCULATION ==========

/**
 * Calculate working days between two dates (excluding weekends and holidays)
 */
export async function calculateWorkingDays(startDate, endDate, state = 'selangor') {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let workingDays = 0;
  
  // Get all holidays in the range
  const holidays = await getHolidaysInRangeAsync(start, end, state);
  const holidayDates = holidays.map(h => h.date);

  // Iterate through each day
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay();
    const dateString = current.toISOString().split('T')[0];
    
    // Check if it's a weekday (Monday-Friday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Check if it's not a holiday
      if (!holidayDates.includes(dateString)) {
        workingDays++;
      }
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return workingDays;
}

/**
 * Check if a specific date is a working day
 */
export function isWorkingDay(date, state = 'selangor') {
  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();
  
  // Check if weekend
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false;
  }
  
  // Check if holiday
  const dateString = dateObj.toISOString().split('T')[0];
  const holidays = getHolidaysInRange(dateObj, dateObj, state);
  
  return holidays.length === 0;
}

/**
 * Get suggested leave dates based on holidays (bridge days)
 */
export function getSuggestedLeaveDates(startDate, duration = 1, state = 'selangor') {
  const suggestions = [];
  const start = new Date(startDate);
  
  // Look for holidays near the start date
  const searchStart = new Date(start);
  searchStart.setDate(start.getDate() - 7);
  const searchEnd = new Date(start);
  searchEnd.setDate(start.getDate() + 7);
  
  const nearbyHolidays = getHolidaysInRange(searchStart, searchEnd, state);
  
  nearbyHolidays.forEach(holiday => {
    const holidayDate = new Date(holiday.date);
    const daysBetween = Math.abs((holidayDate - start) / (1000 * 60 * 60 * 24));
    
    if (daysBetween <= 2) {
      suggestions.push({
        holiday: holiday.name,
        holidayDate: holiday.date,
        suggestedStart: formatDate(addDays(holidayDate, 1)),
        reason: `Extend ${holiday.name} holiday`,
        extraDaysOff: duration + 1
      });
    }
  });
  
  return suggestions;
}

// ========== TEAM FUNCTIONS ==========

/**
 * Get summary of upcoming events for a team
 */
export function getTeamUpcomingSummary(teamMembers, options = {}) {
  const summary = {
    totalMembers: teamMembers.length,
    membersOnLeave: 0,
    upcomingHolidays: 0,
    eventsByDate: {},
    membersByLeaveType: {},
    membersByStatus: {}
  };

  teamMembers.forEach(member => {
    const nextEvent = getNextUpcomingEvent(member, options);
    
    if (nextEvent) {
      // Check if member has any upcoming leave (not holidays)
      if (nextEvent.type === eventTypes.LEAVE) {
        summary.membersOnLeave++;
        
        // Count by leave type
        const leaveType = nextEvent.title;
        summary.membersByLeaveType[leaveType] = 
          (summary.membersByLeaveType[leaveType] || 0) + 1;
        
        // Count by status
        const status = nextEvent.statusDisplay || nextEvent.status;
        summary.membersByStatus[status] = 
          (summary.membersByStatus[status] || 0) + 1;
      } else if (nextEvent.type === eventTypes.HOLIDAY) {
        summary.upcomingHolidays++;
      }

      const dateKey = nextEvent.startDate;
      
      if (!summary.eventsByDate[dateKey]) {
        summary.eventsByDate[dateKey] = {
          date: nextEvent.startDate,
          leaves: 0,
          holidays: 0,
          events: []
        };
      }

      if (nextEvent.type === eventTypes.LEAVE) {
        summary.eventsByDate[dateKey].leaves++;
      } else if (nextEvent.type === eventTypes.HOLIDAY) {
        summary.eventsByDate[dateKey].holidays++;
      }

      summary.eventsByDate[dateKey].events.push({
        type: nextEvent.type,
        title: nextEvent.title,
        memberName: nextEvent.memberName || 'Public Holiday',
        color: nextEvent.color,
        icon: nextEvent.icon
      });
    }
  });

  // Convert eventsByDate object to array and sort
  summary.eventsByDate = Object.values(summary.eventsByDate)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return summary;
}

// ========== INITIALIZATION FUNCTIONS ==========

/**
 * Sync holidays for multiple years
 */
export async function syncHolidaysForYears(years = [], state = null) {
  const results = {};
  
  for (const year of years) {
    try {
      results[year] = await fetchLatestMalaysiaHolidays({
        year,
        state,
        forceRefresh: true
      });
    } catch (error) {
      console.error(`Failed to sync holidays for ${year}:`, error);
      results[year] = getStaticHolidays(year, state);
    }
  }
  
  return results;
}

/**
 * Initialize holiday data on app startup
 */
export async function initializeHolidayData(options = {}) {
  const {
    yearsToSync = [new Date().getFullYear(), new Date().getFullYear() + 1],
    state = null,
    onProgress = null
  } = options;

  console.log('Initializing holiday data...');

  const results = {};
  
  for (let i = 0; i < yearsToSync.length; i++) {
    const year = yearsToSync[i];
    
    if (onProgress) {
      onProgress({
        year,
        progress: (i + 1) / yearsToSync.length,
        message: `Fetching holidays for ${year}...`
      });
    }
    
    try {
      results[year] = await fetchLatestMalaysiaHolidays({
        year,
        state,
        forceRefresh: false
      });
      
      console.log(`Holidays for ${year} initialized: ${results[year].length} holidays`);
    } catch (error) {
      console.error(`Failed to initialize holidays for ${year}:`, error);
      results[year] = getStaticHolidays(year, state);
    }
  }
  
  if (onProgress) {
    onProgress({
      complete: true,
      message: 'Holiday data initialization complete'
    });
  }
  
  return results;
}

// ========== PRIVATE HELPER FUNCTIONS ==========

/**
 * Async version of getHolidaysInRange that uses backend data
 */
async function getHolidaysInRangeAsync(startDate, endDate, state = 'selangor') {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const holidays = [];

  for (let year = startYear; year <= endYear; year++) {
    try {
      const yearHolidays = await getHolidaysWithFallback(year, state);
      holidays.push(...yearHolidays.filter(holiday => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startDate && holidayDate <= endDate;
      }));
    } catch (error) {
      console.warn(`Failed to fetch holidays for ${year}, using static data`);
      const staticHolidays = getHolidaysInRange(startDate, endDate, state);
      holidays.push(...staticHolidays);
    }
  }

  return holidays;
}

/**
 * Fetch from external public APIs
 */
async function fetchFromExternalAPI(year, state) {
  const response = await fetch(
    `https://date.nager.at/api/v3/PublicHolidays/${year}/MY`
  );

  if (!response.ok) {
    throw new Error(`External API error: ${response.status}`);
  }

  const data = await response.json();
  
  // Transform to our format
  return data.map(holiday => ({
    date: holiday.date,
    name: holiday.localName || holiday.name,
    type: 'national',
    state: null,
    description: holiday.name
  }));
}

/**
 * Fetch from localStorage (for offline/cached data)
 */
async function fetchFromLocalStorage(year, state) {
  const key = `malaysia_holidays_${year}${state ? `_${state}` : ''}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    return JSON.parse(stored);
  }
  
  return getStaticHolidays(year, state);
}

/**
 * Get holidays from static data
 */
function getStaticHolidays(year, state) {
  const nationalHolidays = malaysianHolidays[year] || [];
  const stateSpecific = state ? (stateHolidays[state] || []).filter(h => 
    h.date.startsWith(year.toString())
  ) : [];
  
  return [...nationalHolidays, ...stateSpecific].map(holiday => ({
    ...holiday,
    state: state || null
  }));
}

/**
 * Cache holidays in localStorage
 */
function cacheHolidays(year, state, holidays) {
  const key = `malaysia_holidays_${year}${state ? `_${state}` : ''}`;
  
  try {
    localStorage.setItem(key, JSON.stringify(holidays));
    
    // Also store metadata
    const metaKey = `malaysia_holidays_meta_${year}${state ? `_${state}` : ''}`;
    localStorage.setItem(metaKey, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      source: 'api',
      count: holidays.length
    }));
  } catch (error) {
    console.warn('Could not cache holidays:', error);
  }
}

/**
 * Get cached holidays
 */
function getCachedHolidays(year, state) {
  const key = `malaysia_holidays_${year}${state ? `_${state}` : ''}`;
  
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    
    const holidays = JSON.parse(stored);
    
    // Check if cache is still valid (7 days)
    const metaKey = `malaysia_holidays_meta_${year}${state ? `_${state}` : ''}`;
    const metaStored = localStorage.getItem(metaKey);
    
    if (metaStored) {
      const meta = JSON.parse(metaStored);
      const lastUpdated = new Date(meta.lastUpdated);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      if (lastUpdated > sevenDaysAgo) {
        return holidays;
      }
    }
  } catch (error) {
    console.warn('Error reading cached holidays:', error);
  }
  
  return null;
}

/**
 * Update static holidays object
 */
function updateStaticHolidays(year, holidays, state = null) {
  if (!state) {
    // National holidays
    if (!malaysianHolidays[year]) {
      malaysianHolidays[year] = [];
    }
    
    holidays.forEach(holiday => {
      const existingIndex = malaysianHolidays[year].findIndex(h => h.date === holiday.date);
      if (existingIndex === -1) {
        malaysianHolidays[year].push(holiday);
      }
    });
  } else {
    // State holidays
    if (!stateHolidays[state]) {
      stateHolidays[state] = [];
    }
    
    holidays.forEach(holiday => {
      const existingIndex = stateHolidays[state].findIndex(h => h.date === holiday.date);
      if (existingIndex === -1) {
        stateHolidays[state].push(holiday);
      }
    });
  }
}

/**
 * Fetch from backend API
 */
async function fetchFromBackendAPI(year, state) {
  const endpoint = '/api/malaysia-holidays';
  
  const params = new URLSearchParams();
  params.append('year', year);
  if (state) params.append('state', state);

  const response = await fetch(`${endpoint}?${params.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`API responded with status: ${response.status}`);
  }

  const data = await response.json();
  
  // Transform to consistent format
  return data.holidays.map(holiday => ({
    date: formatDate(holiday.date),
    name: holiday.name,
    type: holiday.type || 'national',
    state: holiday.state || null,
    description: holiday.description || ''
  }));
}

// ========== UTILITY FUNCTIONS ==========

function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch (error) {
    return dateString;
  }
}

function calculateDuration(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
}

function calculateDaysUntil(date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const diffTime = target - today;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function isSameDay(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function getUrgencyLevel(daysUntil) {
  if (daysUntil <= 3) return 'high';
  if (daysUntil <= 7) return 'medium';
  return 'low';
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ========== DEFAULT EXPORT ==========

export default {
  // Leave Types & Statuses (re-exported from leaveTypes.js)
  leaveTypes,
  approvalStatuses,
  normalizeLeaveType,
  getLeaveTypeConfig,
  getLeaveTypeIcon,
  getLeaveTypeColor,
  getLeaveTypeCategory,
  getLeaveTypeClass,
  isValidLeaveType,
  getLeaveTypeAbbreviation,
  getStatusConfig,
  
  // Holiday Data
  malaysianHolidays,
  stateHolidays,
  holidayDataSources,
  
  // Main Functions
  fetchLatestMalaysiaHolidays,
  syncHolidaysForYears,
  initializeHolidayData,
  getHolidaysWithFallback,
  
  // Event Types
  eventTypes,
  
  // Upcoming Events
  getMemberUpcomingEvents,
  getNextUpcomingEvent,
  getLeaveCountdown,
  getUpcomingEventsByType,
  getUpcomingEventsByLeaveType,
  hasUpcomingLeaveType,
  
  // Holidays
  getHolidaysInRange,
  getMonthlyHolidays,
  
  // Working Days
  calculateWorkingDays,
  isWorkingDay,
  getSuggestedLeaveDates,
  
  // Team Functions
  getTeamUpcomingSummary
};