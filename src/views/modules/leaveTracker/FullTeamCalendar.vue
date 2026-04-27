<template>
  <div class="full-calendar-modal" v-if="showFullCalendar" @click.self="handleBackdropClick">
    <div class="modal-overlay"></div>

    <div class="modal-container" ref="modalContainer" tabindex="-1">
      <div class="modal-header">
        <div class="modal-header-left">
          <h2 class="modal-title">People Out This {{ viewMode === 'month' ? 'Month' : 'Week' }}</h2>
          <span v-if="teamMembersInView.length > 0" class="calendar-count">
            {{ teamMembersInView.length }} {{ teamMembersInView.length === 1 ? 'person' : 'people' }} out
          </span>
        </div>
        <div class="modal-header-right">
          <div class="holiday-state-selector">
            <select v-model="selectedState" @change="loadHolidays" class="state-select">
              <option value="">All States</option>
              <option v-for="state in availableStates" :key="state.value" :value="state.value">
                {{ state.label }}
              </option>
            </select>
          </div>
          <button class="modal-close" @click="closeFullCalendar" aria-label="Close calendar">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div class="modal-body">
        <!-- Calendar Header with View Toggle -->
        <div class="full-calendar-header">
          <div class="legend-items">
            <!-- Leave Types -->
            <div v-for="type in legendLeaveTypes" :key="type.id" class="legend-item">
              <div class="legend-color" :class="type.className"></div>
              <span class="legend-label">{{ type.displayName }}</span>
            </div>
            <!-- Holiday Types -->
            <div class="legend-item">
              <div class="legend-color holiday-national"></div>
              <span class="legend-label">National Holiday</span>
            </div>
            <div class="legend-item">
              <div class="legend-color holiday-state"></div>
              <span class="legend-label">State Holiday</span>
            </div>
          </div>
          
          <div class="calendar-header-right">
            <!-- View Toggle -->
            <div class="view-toggle">
              <button class="view-toggle-btn" 
                      :class="{ 'active': viewMode === 'week' }" 
                      @click="setViewMode('week')">
                Week
              </button>
              <button class="view-toggle-btn" 
                      :class="{ 'active': viewMode === 'month' }" 
                      @click="setViewMode('month')">
                Month
              </button>
            </div>
            
            <!-- Export Button -->
            <button class="export-btn" @click="exportCalendar('csv')">
              <span class="material-symbols-outlined">download</span>
              Export
            </button>
            
            <!-- Navigation -->
            <div class="calendar-nav">
              <button class="nav-btn prev-btn" @click="goToPrevious" aria-label="Previous">
                <span class="material-symbols-outlined">chevron_left</span>
              </button>
              <span class="current-period">{{ currentPeriodDisplay }}</span>
              <button class="nav-btn next-btn" @click="goToNext" aria-label="Next">
                <span class="material-symbols-outlined">chevron_right</span>
              </button>
              <button class="nav-btn today-btn" @click="goToToday">
                Today
              </button>
            </div>
          </div>
        </div>

        <!-- WEEK VIEW -->
        <div v-if="viewMode === 'week'" class="week-view">
          <!-- Calendar Grid -->
          <div class="full-calendar-grid week-view">
            <!-- Days Header -->
            <div class="calendar-days-header week-days-header">
              <div v-for="day in weekDays" :key="day.date" 
                   class="calendar-day-header-week"
                   :class="{ 'today': day.isToday, 'weekend': day.isWeekend, 'holiday': day.hasHoliday }"
                   @click="handleDayClick(day)">
                <div class="day-header-content">
                  <div class="day-name">{{ day.day }}</div>
                  <div class="date-number">{{ day.dateNumber }}</div>
                  <div class="month-name">{{ day.month }}</div>
                  <div v-if="day.hasHoliday" class="holiday-indicator">
                    <span class="material-symbols-outlined">flag</span>
                  </div>
                  <div v-if="getMembersOutOnDate(day.date).length > 0" class="day-count">
                    {{ getMembersOutOnDate(day.date).length }}
                  </div>
                </div>
                <div v-if="day.holidays && day.holidays.length > 0" class="day-holidays">
                  <span class="holiday-name" v-for="holiday in day.holidays.slice(0, 2)" :key="holiday.name">
                    {{ holiday.name }}
                  </span>
                  <span v-if="day.holidays.length > 2" class="holiday-more">
                    +{{ day.holidays.length - 2 }} more
                  </span>
                </div>
              </div>
            </div>

            <!-- Team Members List -->
            <div class="calendar-members-list">
              <!-- Public Holidays Row -->
              <div v-if="hasHolidaysInWeek" class="calendar-member-row holiday-row">
                <div class="member-info-cell holiday-cell">
                  <div class="holiday-icon">
                    <span class="material-symbols-outlined">flag</span>
                  </div>
                  <div class="holiday-details">
                    <div class="member-name">Public Holidays</div>
                    <div class="holiday-description">Malaysia Public Holidays</div>
                  </div>
                </div>
                
                <!-- Holiday Days Cells -->
                <div v-for="day in weekDays" :key="`holiday-${day.date}`" 
                     class="day-cell-week"
                     :class="{ 'today': day.isToday, 'weekend': day.isWeekend, 'holiday-cell': true }"
                     @click="handleHolidayClick(day)">
                  <div v-if="day.holidays && day.holidays.length > 0" 
                       class="holiday-span-week"
                       :class="getHolidayClass(day.holidays[0])">
                    <div class="holiday-content-week">
                      <span class="material-symbols-outlined holiday-icon">
                        flag
                      </span>
                      <div class="holiday-info">
                        <span class="holiday-type">
                          {{ getHolidayTypeDisplay(day.holidays[0]) }}
                        </span>
                        <span class="holiday-name">
                          {{ day.holidays[0].name }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Team Members -->
              <div v-for="member in filteredTeamMembers" :key="member.id" class="calendar-member-row">
                <div class="member-info-cell" @click="handleMemberClick(member.id)">
                  <div class="member-avatar" 
                       :style="{ backgroundImage: `url('${getMemberAvatar(member)}')` }">
                  </div>
                  <div class="member-details">
                    <div class="member-name">{{ member.name }}</div>
                    <div v-if="member.department" class="member-department">{{ member.department }}</div>
                  </div>
                </div>
                
                <!-- Days Cells -->
                <div v-for="day in weekDays" :key="`${member.id}-${day.date}`" 
                     class="day-cell-week"
                     :class="{ 'today': day.isToday, 'weekend': day.isWeekend, 'holiday-day': day.hasHoliday }"
                     @click="handleMemberDayClick(member, day)">
                  <!-- Leave Span -->
                  <div v-if="isMemberOutOnDay(member, day.date)" 
                       class="leave-span-week"
                       :style="getLeaveSpanStyle(member, day)"
                       :class="getLeaveTypeClass(member.leaveTypeId)"
                       @click.stop="handleLeaveClick(member, day)">
                    <div class="leave-content-week">
                      <span class="material-symbols-outlined leave-icon">
                        {{ getLeaveTypeIcon(member.leaveTypeId) }}
                      </span>
                      <span class="leave-type">{{ getLeaveTypeDisplay(member.leaveTypeId) }}</span>
                      <span class="leave-duration">
                        {{ getLeaveDuration(member) }}
                      </span>
                    </div>
                  </div>
                  
                  <!-- Empty State -->
                  <div v-else class="day-empty-week">
                    <span v-if="day.hasHoliday" class="holiday-empty-icon">
                      <span class="material-symbols-outlined">flag</span>
                    </span>
                    <span v-else class="material-symbols-outlined">check_circle</span>
                  </div>
                </div>
              </div>
              
              <!-- Empty State -->
              <div v-if="filteredTeamMembers.length === 0 && !hasHolidaysInWeek" class="calendar-empty-state">
                <div class="empty-icon">
                  <span class="material-symbols-outlined">search_off</span>
                </div>
                <h3>No team members on leave this week</h3>
                <p>Try adjusting your filters or check back later.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- MONTH VIEW -->
        <div v-else class="month-view">
          <div class="full-calendar-grid month-view">
            <!-- Days Header -->
            <div class="calendar-days-header month-days-header">
              <div v-for="day in dayHeaders" :key="day.shortName" class="calendar-day-header-month"
                  :class="{ 'weekend': day.isWeekend }">
                <div class="day-header-content">
                  <div class="day-name">{{ day.shortName }}</div>
                </div>
              </div>
            </div>

            <!-- Weeks Grid -->
            <div class="calendar-weeks">
              <div v-for="week in monthWeeks" :key="week.weekNumber" class="calendar-week">
                <!-- Days in Week -->
                <div v-for="day in week.days" :key="day.date.getTime()" class="calendar-day-cell-month"
                    :class="{
                      'today': day.isToday,
                      'current-month': day.isCurrentMonth,
                      'weekend': day.isWeekend,
                      'has-leaves': day.membersOut.length > 0,
                      'has-holiday': day.holidays && day.holidays.length > 0
                    }"
                    @click="handleDayClick({ date: day.date, ...day })">
                  <div class="day-cell-header">
                    <div class="day-date" :class="{ 'today': day.isToday, 'holiday': day.hasHoliday }">
                      {{ day.date.getDate() }}
                      <div v-if="day.holidays && day.holidays.length > 0" class="holiday-indicator-month">
                        <span class="material-symbols-outlined">flag</span>
                      </div>
                    </div>
                  </div>

                  <div class="day-members-list" v-if="day.membersOut.length > 0 || (day.holidays && day.holidays.length > 0)">
                    <!-- Holidays First -->
                    <div v-if="day.holidays && day.holidays.length > 0" class="day-holiday-item">
                      <div class="holiday-dot" :class="getHolidayClass(day.holidays[0])"></div>
                      <span class="day-holiday-name">{{ day.holidays[0].name }}</span>
                    </div>
                    
                    <!-- Team Members -->
                    <div v-for="(member, index) in day.membersOut.slice(0, 2)" :key="member.id"
                        class="day-member-item" :class="getLeaveTypeClass(member.leaveTypeId)"
                        @click.stop="handleMemberClick(member.id)">
                      <div class="day-member-avatar"
                          :style="{ backgroundImage: `url('${getMemberAvatar(member)}')` }"></div>
                      <span class="day-member-name">{{ member.name }}</span>
                    </div>
                    <button v-if="day.membersOut.length > 2" class="day-member-more"
                        @click.stop="handleMoreClick(day.date)">
                      +{{ day.membersOut.length - 2 }} more
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Section -->
        <div class="calendar-statistics">
          <div class="stat-card">
            <div class="stat-icon">
              <span class="material-symbols-outlined">groups</span>
            </div>
            <div class="stat-content">
              <h4>Team Overview</h4>
              <div class="stat-numbers">
                <div class="stat-number">
                  <span class="number-label">Total Out</span>
                  <span class="number-value">{{ teamMembersInView.length }}</span>
                </div>
                <div class="stat-number">
                  <span class="number-label">Team Size</span>
                  <span class="number-value">{{ teamMembers.length }}</span>
                </div>
                <div class="stat-number">
                  <span class="number-label">Holidays</span>
                  <span class="number-value holiday-value">{{ holidaysInView.length }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">
              <span class="material-symbols-outlined">bar_chart</span>
            </div>
            <div class="stat-content">
              <h4>Leave Type Breakdown</h4>
              <div class="breakdown-items">
                <div v-for="(count, typeId) in leaveTypeBreakdown" :key="typeId" class="breakdown-item">
                  <div class="breakdown-color" :style="{ backgroundColor: getLeaveTypeColor(typeId) }"></div>
                  <span class="breakdown-label">{{ getLeaveTypeDisplay(typeId) }}</span>
                  <span class="breakdown-count">{{ count }}</span>
                </div>
                <div v-if="holidaysInView.length > 0" class="breakdown-item">
                  <div class="breakdown-color holiday-national"></div>
                  <span class="breakdown-label">Public Holidays</span>
                  <span class="breakdown-count">{{ holidaysInView.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="close-btn" @click="closeFullCalendar" aria-label="Close calendar">
          Close Calendar
        </button>
      </div>
    </div>

    <!-- View More Modal -->
    <div class="members-modal" v-if="showMembersModal" @click.self="closeMembersModal">
      <div class="members-modal-overlay"></div>
      <div class="members-modal-content" ref="membersModalContent">
        <div class="members-modal-header">
          <h3 class="members-modal-title">
            {{ selectedDay ? formatSelectedDate(selectedDay) : '' }}
          </h3>
          <button class="members-modal-close" @click="closeMembersModal" aria-label="Close">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="members-modal-body">
          <!-- Show Holidays -->
          <div v-if="selectedDayHolidays.length > 0" class="holiday-section">
            <h4 class="section-title">Public Holidays</h4>
            <div class="holiday-list">
              <div v-for="holiday in selectedDayHolidays" :key="holiday.name" class="holiday-item">
                <div class="holiday-icon">
                  <span class="material-symbols-outlined">flag</span>
                </div>
                <div class="holiday-info">
                  <div class="holiday-name">{{ holiday.name }}</div>
                  <div class="holiday-details">
                    <span class="holiday-type">{{ getHolidayTypeDisplay(holiday) }}</span>
                    <span v-if="holiday.state" class="holiday-state">• {{ getStateName(holiday.state) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Show Team Members -->
          <div v-if="selectedDayMembers.length > 0" class="members-section">
            <h4 class="section-title">Team Members on Leave</h4>
            <div class="members-list">
              <div v-for="member in selectedDayMembers" :key="member.id" class="member-item"
                  :class="getLeaveTypeClass(member.leaveTypeId)" @click="handleMemberClick(member.id)">
                <div class="member-avatar"
                    :style="{ backgroundImage: `url('${getMemberAvatar(member)}')` }">
                </div>
                <div class="member-info">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-leave-type">
                    {{ getLeaveTypeDisplay(member.leaveTypeId) }}
                  </div>
                  <div class="member-dates">
                    Duration: {{ formatDateRange(member.startDate, member.endDate) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  leaveTypes,
  normalizeLeaveType,
  getLeaveTypeConfig,
  getLeaveTypeIcon,
  getLeaveTypeColor,
  getLeaveTypeClass,
  getLeaveTypeCategory,
  getCommonLeaveTypes,
  getLegendLeaveTypes,
  getColorVariants,
  isValidLeaveType
} from "../../../utils/leaveTypes";

// Import holiday utilities
import { getHolidaysWithFallback } from '@/utils/upcomingLeaveUtil';

export default {
  name: 'FullTeamCalendar',
  props: {
    teamMembers: {
      type: Array,
      default: () => []
    },
    showFullCalendar: {
      type: Boolean,
      default: false
    },
    availableStates: {
      type: Array,
      default: () => [
        { value: 'selangor', label: 'Selangor' },
        { value: 'kuala-lumpur', label: 'Kuala Lumpur' },
        { value: 'johor', label: 'Johor' },
        { value: 'penang', label: 'Penang' },
        { value: 'perak', label: 'Perak' },
        { value: 'sabah', label: 'Sabah' },
        { value: 'sarawak', label: 'Sarawak' }
      ]
    }
  },
  emits: ['close', 'member-click', 'day-click', 'holiday-click'],
  
  data() {
    const today = new Date();
    return {
      leaveTypes,
      viewMode: 'week', // 'week' or 'month'
      currentWeekStart: null,
      currentMonthStart: null,
      boundHandleKeydown: null,
      showMembersModal: false,
      selectedDay: null,
      selectedDayMembers: [],
      selectedDayHolidays: [],
      isLoading: false,
      error: null,
      malaysiaHolidays: [],
      selectedState: '',
      holidaysLoading: false
    };
  },
  
  computed: {
    // Initialize dates
    computedWeekStart() {
      if (this.currentWeekStart) return this.currentWeekStart;
      
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(today.setDate(diff)).toISOString().split('T')[0];
    },
    
    computedMonthStart() {
      if (this.currentMonthStart) return this.currentMonthStart;
      
      const today = new Date();
      return new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    },
    
    // WEEK VIEW COMPUTED PROPERTIES
    weekDays() {
      const week = [];
      const startDate = new Date(this.computedWeekStart);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const holidays = this.getHolidaysForDate(date);
        const hasHoliday = holidays.length > 0;
        
        week.push({
          date: dateString,
          day: this.formatDayName(date.getDay()),
          dateNumber: date.getDate(),
          month: this.formatMonth(date.getMonth()),
          fullDate: date,
          isToday,
          isWeekend,
          holidays,
          hasHoliday
        });
      }
      
      return week;
    },
    
    hasHolidaysInWeek() {
      return this.weekDays.some(day => day.holidays && day.holidays.length > 0);
    },
    
    holidaysInView() {
      if (this.viewMode === 'week') {
        return this.getHolidaysInWeek();
      } else {
        return this.getHolidaysInMonth();
      }
    },
    
    // MONTH VIEW COMPUTED PROPERTIES
    currentPeriodDisplay() {
      if (this.viewMode === 'week') {
        const start = new Date(this.computedWeekStart);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        const options = { month: 'short', day: 'numeric' };
        const startStr = start.toLocaleDateString('en-US', options);
        const endStr = end.toLocaleDateString('en-US', options);
        
        return `${startStr} - ${endStr}, ${start.getFullYear()}`;
      } else {
        const date = new Date(this.computedMonthStart);
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        });
      }
    },
    
    dayHeaders() {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days.map((day, index) => ({
        shortName: day,
        isWeekend: index === 0 || index === 6
      }));
    },
    
    monthWeeks() {
      const weeks = [];
      const startDate = new Date(this.computedMonthStart);
      const year = startDate.getFullYear();
      const month = startDate.getMonth();

      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      const start = new Date(firstDay);
      start.setDate(firstDay.getDate() - firstDay.getDay());

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let currentDate = new Date(start);
      let weekNumber = Math.ceil((start.getDate() + firstDay.getDay()) / 7);

      while (currentDate <= lastDay || weeks.length < 6) {
        const weekDays = [];

        for (let i = 0; i < 7; i++) {
          const date = new Date(currentDate);
          const isCurrentMonth = date.getMonth() === month;
          const isToday = date.toDateString() === today.toDateString();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

          const membersOut = this.getMembersOutOnDate(date);
          const holidays = this.getHolidaysForDate(date);
          const hasHoliday = holidays.length > 0;

          weekDays.push({
            date,
            isCurrentMonth,
            isToday,
            isWeekend,
            membersOut,
            holidays,
            hasHoliday
          });

          currentDate.setDate(currentDate.getDate() + 1);
        }

        weeks.push({
          weekNumber,
          days: weekDays
        });

        weekNumber++;
        if (currentDate > lastDay && weekDays[6].date > lastDay) {
          break;
        }
      }

      return weeks;
    },
    
    // COMMON COMPUTED PROPERTIES
    teamMembersInView() {
      if (this.viewMode === 'week') {
        return this.getTeamMembersInWeek();
      } else {
        return this.getTeamMembersInMonth();
      }
    },
    
    filteredTeamMembers() {
      // For week view, show all team members
      // For month view, we filter in the day cells
      return this.teamMembers;
    },
    
    legendLeaveTypes() {
      return getLegendLeaveTypes();
    },
    
    leaveTypeBreakdown() {
      const breakdown = {};
      this.teamMembersInView.forEach(member => {
        const type = this.getNormalizedLeaveType(member.leaveTypeId);
        breakdown[type] = (breakdown[type] || 0) + 1;
      });
      return breakdown;
    }
  },
  
  watch: {
    showFullCalendar(newVal) {
      if (newVal) {
        this.initializeCalendar();
        this.setupEventListeners();
        this.loadHolidays();
      } else {
        this.cleanupEventListeners();
      }
    },
    selectedState() {
      this.loadHolidays();
    }
  },
  
  methods: {
    // ========== INITIALIZATION ==========
    
    async initializeCalendar() {
      this.selectedDay = null;
      this.selectedDayMembers = [];
      this.selectedDayHolidays = [];
      this.error = null;
      this.isLoading = false;
      
      // Initialize to current week/month
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      this.currentWeekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
      this.currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    },
    
    // ========== HOLIDAY MANAGEMENT ==========
    
    async loadHolidays() {
      this.holidaysLoading = true;
      try {
        const today = new Date();
        let endDate;
        
        if (this.viewMode === 'week') {
          endDate = new Date(this.computedWeekStart);
          endDate.setDate(endDate.getDate() + 30); // Load 30 days ahead for week view
        } else {
          endDate = new Date(this.computedMonthStart);
          endDate.setMonth(endDate.getMonth() + 2); // Load 2 months ahead for month view
        }
        
        // Get holidays for the selected state
        const holidays = await getHolidaysWithFallback(
          today.getFullYear(),
          this.selectedState || null
        );
        
        // Filter holidays within the date range
        this.malaysiaHolidays = holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          return holidayDate >= today && holidayDate <= endDate;
        });
        
      } catch (error) {
        console.error('Error loading Malaysia holidays:', error);
        this.malaysiaHolidays = [];
      } finally {
        this.holidaysLoading = false;
      }
    },
    
    getHolidaysForDate(date) {
      try {
        const checkDate = date instanceof Date ? date : new Date(date);
        const dateString = checkDate.toISOString().split('T')[0];
        
        return this.malaysiaHolidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          const holidayDateString = holidayDate.toISOString().split('T')[0];
          return holidayDateString === dateString;
        });
      } catch (error) {
        console.error('Error getting holidays for date:', date, error);
        return [];
      }
    },
    
    getHolidaysInWeek() {
      const holidays = [];
      this.weekDays.forEach(day => {
        if (day.holidays && day.holidays.length > 0) {
          holidays.push(...day.holidays);
        }
      });
      return holidays;
    },
    
    getHolidaysInMonth() {
      const holidays = [];
      this.monthWeeks.forEach(week => {
        week.days.forEach(day => {
          if (day.holidays && day.holidays.length > 0) {
            holidays.push(...day.holidays);
          }
        });
      });
      return holidays;
    },
    
    getHolidayClass(holiday) {
      if (holiday.type === 'national') {
        return 'holiday-national';
      } else if (holiday.type === 'state') {
        return 'holiday-state';
      }
      return 'holiday-other';
    },
    
    getHolidayTypeDisplay(holiday) {
      if (holiday.type === 'national') {
        return 'National Holiday';
      } else if (holiday.type === 'state') {
        return 'State Holiday';
      }
      return 'Holiday';
    },
    
    getStateName(stateValue) {
      const state = this.availableStates.find(s => s.value === stateValue);
      return state ? state.label : stateValue;
    },
    
    // ========== VIEW MODE MANAGEMENT ==========
    
    setViewMode(mode) {
      this.viewMode = mode;
      if (mode === 'week') {
        this.loadHolidays();
      }
    },
    
    // ========== NAVIGATION METHODS ==========
    
    goToPrevious() {
      if (this.viewMode === 'week') {
        const date = new Date(this.computedWeekStart);
        date.setDate(date.getDate() - 7);
        this.currentWeekStart = date.toISOString().split('T')[0];
      } else {
        const date = new Date(this.computedMonthStart);
        date.setMonth(date.getMonth() - 1);
        this.currentMonthStart = date.toISOString().split('T')[0];
      }
      this.loadHolidays();
    },
    
    goToNext() {
      if (this.viewMode === 'week') {
        const date = new Date(this.computedWeekStart);
        date.setDate(date.getDate() + 7);
        this.currentWeekStart = date.toISOString().split('T')[0];
      } else {
        const date = new Date(this.computedMonthStart);
        date.setMonth(date.getMonth() + 1);
        this.currentMonthStart = date.toISOString().split('T')[0];
      }
      this.loadHolidays();
    },
    
    goToToday() {
      const today = new Date();
      if (this.viewMode === 'week') {
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        this.currentWeekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
      } else {
        this.currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      }
      this.loadHolidays();
    },
    
    // ========== DATA PROCESSING ==========
    
    getTeamMembersInWeek() {
      const weekStart = new Date(this.computedWeekStart);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      return this.teamMembers.filter(member => {
        if (!member.startDate || !member.endDate) return false;
        
        try {
          const start = new Date(member.startDate);
          const end = new Date(member.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          return (start <= weekEnd && end >= weekStart);
        } catch (error) {
          console.error('Error parsing member dates:', member, error);
          return false;
        }
      });
    },
    
    getTeamMembersInMonth() {
      const startDate = new Date(this.computedMonthStart);
      const year = startDate.getFullYear();
      const month = startDate.getMonth();
      
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      
      return this.teamMembers.filter(member => {
        if (!member.startDate || !member.endDate) return false;
        
        try {
          const start = new Date(member.startDate);
          const end = new Date(member.endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          
          return (start <= monthEnd && end >= monthStart);
        } catch (error) {
          console.error('Error parsing member dates:', member, error);
          return false;
        }
      });
    },
    
    getMembersOutOnDate(date) {
      try {
        const checkDate = date instanceof Date ? date : new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        return this.teamMembers.filter(member => {
          if (!member.startDate || !member.endDate) return false;
          
          try {
            const start = new Date(member.startDate);
            const end = new Date(member.endDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            return checkDate >= start && checkDate <= end;
          } catch (error) {
            console.error('Error checking member date:', member, error);
            return false;
          }
        });
      } catch (error) {
        console.error('Error getting members out on date:', date, error);
        return [];
      }
    },
    
    isMemberOutOnDay(member, dateString) {
      return this.getMembersOutOnDate(dateString, [member]).length > 0;
    },
    
    // ========== LEAVE TYPE UTILITIES ==========
    
    getNormalizedLeaveType(typeId) {
      if (!typeId) return 'AL';
      
      const config = getLeaveTypeConfig(typeId);
      if (config) return config.id;
      
      const normalized = normalizeLeaveType(typeId);
      const normalizedConfig = getLeaveTypeConfig(normalized);
      return normalizedConfig ? normalizedConfig.id : 'AL';
    },
    
    getLeaveTypeConfig(typeId) {
      return getLeaveTypeConfig(typeId);
    },
    
    getLeaveTypeDisplay(typeId) {
      return normalizeLeaveType(typeId);
    },
    
    getLeaveTypeIcon(typeId) {
      return getLeaveTypeIcon(typeId);
    },
    
    getLeaveTypeColor(typeId) {
      return getLeaveTypeColor(typeId);
    },
    
    getLeaveTypeClass(typeId) {
      return getLeaveTypeClass(typeId);
    },
    
    getLeaveTypeCategory(typeId) {
      return getLeaveTypeCategory(typeId);
    },
    
    getColorVariants(color) {
      return getColorVariants(color);
    },
    
    // ========== WEEK VIEW SPECIFIC METHODS ==========
    
    getLeaveSpanStyle(member, day) {
      const spanInfo = this.getMemberLeaveSpan(member, day);
      const config = this.getLeaveTypeConfig(member.leaveTypeId);
      const variants = config ? this.getColorVariants(config.color) : {};
      
      return {
        gridColumn: `span ${spanInfo.span}`,
        backgroundColor: variants.light || 'rgba(107, 114, 128, 0.15)',
        borderColor: variants.border || 'rgba(107, 114, 128, 0.3)',
        color: variants.text || '#4B5563'
      };
    },
    
    getMemberLeaveSpan(member, currentDay) {
      if (!member.startDate || !member.endDate) return { span: 1, offset: 0 };
      
      const startDate = new Date(member.startDate);
      const endDate = new Date(member.endDate);
      const currentDate = new Date(currentDay.date);
      
      let span = 1;
      let offset = 0;
      
      // Find which day in the span this is
      this.weekDays.forEach((day, index) => {
        const dayDate = new Date(day.date);
        
        if (dayDate >= startDate && dayDate <= endDate) {
          if (dayDate.getTime() === currentDate.getTime()) {
            offset = index;
            
            // Calculate how many days from current to end
            let daysRemaining = 0;
            for (let i = index; i < this.weekDays.length; i++) {
              const futureDate = new Date(this.weekDays[i].date);
              if (futureDate <= endDate) {
                daysRemaining++;
              } else {
                break;
              }
            }
            span = Math.min(daysRemaining, 7 - index);
          }
        }
      });
      
      return { span, offset };
    },
    
    getLeaveDuration(member) {
      if (!member.startDate || !member.endDate) return '';
      return this.calculateDuration(member.startDate, member.endDate);
    },
    
    // ========== DATE FORMATTING ==========
    
    formatDate(dateString) {
      if (!dateString) return '';
      
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        });
      } catch (error) {
        console.error('Error formatting date:', dateString, error);
        return dateString;
      }
    },
    
    formatDateRange(startDate, endDate) {
      if (!startDate || !endDate) return '';
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start.getTime() === end.getTime()) {
          return this.formatDate(startDate);
        }
        
        if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
          const month = start.toLocaleDateString('en-US', { month: 'short' });
          return `${month} ${start.getDate()} - ${end.getDate()}, ${start.getFullYear()}`;
        }
        
        if (start.getFullYear() === end.getFullYear()) {
          const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return `${startStr} - ${endStr}, ${start.getFullYear()}`;
        }
        
        const startStr = this.formatDate(startDate);
        const endStr = this.formatDate(endDate);
        return `${startStr} - ${endStr}`;
      } catch (error) {
        console.error('Error formatting date range:', error);
        return `${startDate} - ${endDate}`;
      }
    },
    
    formatDayName(dayIndex) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[dayIndex];
    },
    
    formatMonth(monthIndex) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return months[monthIndex];
    },
    
    formatSelectedDate(date) {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    },
    
    // ========== CALCULATIONS ==========
    
    calculateDuration(startDate, endDate) {
      if (!startDate || !endDate) return '0 days';
      
      try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        if (diffDays === 1) return '1 day';
        return `${diffDays} days`;
      } catch (error) {
        return 'N/A';
      }
    },
    
    // ========== INTERACTION HANDLERS ==========
    
    handleMoreClick(date) {
      const members = this.getMembersOutOnDate(date);
      const holidays = this.getHolidaysForDate(date);
      
      if (members.length > 0 || holidays.length > 0) {
        this.selectedDay = date;
        this.selectedDayMembers = members;
        this.selectedDayHolidays = holidays;
        this.showMembersModal = true;
        
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      }
    },
    
    closeMembersModal() {
      this.showMembersModal = false;
      this.selectedDay = null;
      this.selectedDayMembers = [];
      this.selectedDayHolidays = [];
      
      document.body.style.overflow = 'hidden';
      document.body.classList.remove('modal-open');
    },
    
    handleBackdropClick(event) {
      if (event.target === event.currentTarget) {
        this.closeFullCalendar();
      }
    },
    
    handleMemberClick(memberId) {
      this.$emit('member-click', memberId);
    },
    
    handleHolidayClick(day) {
      if (day.holidays && day.holidays.length > 0) {
        this.$emit('holiday-click', {
          date: day.date,
          holidays: day.holidays
        });
      }
    },
    
    handleDayClick(dayData) {
      const members = this.getMembersOutOnDate(dayData.date);
      const holidays = this.getHolidaysForDate(dayData.date);
      
      if (members.length > 0 || holidays.length > 0) {
        this.selectedDay = dayData.date;
        this.selectedDayMembers = members;
        this.selectedDayHolidays = holidays;
        this.showMembersModal = true;
        
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');
      } else {
        this.$emit('day-click', {
          date: dayData.date,
          members: [],
          holidays: [],
          dayInfo: dayData
        });
      }
    },
    
    handleEmptyDayClick(date) {
      this.$emit('day-click', {
        date,
        members: [],
        holidays: [],
        dayInfo: {
          date,
          isCurrentMonth: true,
          isToday: date.toDateString() === new Date().toDateString(),
          isWeekend: date.getDay() === 0 || date.getDay() === 6
        }
      });
    },
    
    handleMemberDayClick(member, day) {
      if (this.isMemberOutOnDay(member, day.date)) {
        this.handleMemberClick(member.id);
      } else {
        this.handleDayClick(day);
      }
    },
    
    handleLeaveClick(member, day) {
      this.handleMemberClick(member.id);
    },
    
    closeFullCalendar() {
      this.$emit('close');
    },
    
    // ========== EXPORT FUNCTIONALITY ==========
    
    exportCalendar(format = 'csv') {
      try {
        const data = this.prepareExportData();
        
        if (format === 'csv') {
          this.exportAsCSV(data);
        } else {
          console.warn(`Unsupported export format: ${format}`);
          this.showErrorMessage(`Export format ${format} is not supported`);
        }
      } catch (error) {
        console.error('Export failed:', error);
        this.showErrorMessage('Failed to export calendar');
      }
    },
    
    prepareExportData() {
      const headers = ['Date', 'Day', 'Employee', 'Leave Type', 'Start Date', 'End Date', 'Duration', 'Status', 'Holiday'];
      
      const rows = [];
      
      // Determine date range based on view mode
      let startDate, endDate;
      if (this.viewMode === 'week') {
        startDate = new Date(this.computedWeekStart);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
      } else {
        startDate = new Date(this.computedMonthStart);
        const year = startDate.getFullYear();
        const month = startDate.getMonth();
        endDate = new Date(year, month + 1, 0);
      }
      
      // Generate dates in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const dayName = this.formatDayName(currentDate.getDay());
        const members = this.getMembersOutOnDate(currentDate);
        const holidays = this.getHolidaysForDate(currentDate);
        
        if (holidays.length > 0) {
          holidays.forEach(holiday => {
            rows.push([
              dateStr,
              dayName,
              '-',
              'Holiday',
              holiday.date,
              holiday.date,
              '1 day',
              'Public Holiday',
              holiday.name
            ]);
          });
        }
        
        if (members.length === 0 && holidays.length === 0) {
          rows.push([
            dateStr,
            dayName,
            '-',
            '-',
            '-',
            '-',
            '-',
            'No leave',
            '-'
          ]);
        } else if (members.length > 0) {
          members.forEach(member => {
            const config = this.getLeaveTypeConfig(member.leaveTypeId);
            
            rows.push([
              dateStr,
              dayName,
              member.name,
              config ? config.name : member.leaveTypeId,
              member.startDate,
              member.endDate,
              this.calculateDuration(member.startDate, member.endDate),
              'On Leave',
              holidays.length > 0 ? holidays.map(h => h.name).join(', ') : '-'
            ]);
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      return { headers, rows };
    },
    
    exportAsCSV(data) {
      const { headers, rows } = data;
      
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',') + '\n';
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      const fileName = `team-calendar-${this.viewMode}-${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    
    // ========== UI HELPERS ==========
    
    getMemberAvatar(member) {
      if (member.avatar) return member.avatar;
      
      // Generate fallback avatar
      const colors = [
        '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899',
        '#F59E0B', '#6366F1', '#06B6D4', '#84CC16', '#F43F5E'
      ];
      
      const nameHash = member.name
        ? member.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : 0;
      
      const colorIndex = nameHash % colors.length;
      const initials = this.getMemberInitials(member.name);
      
      return `data:image/svg+xml,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
          <rect width="100" height="100" fill="${colors[colorIndex]}" rx="50"/>
          <text x="50" y="58" font-family="Arial, sans-serif" font-size="40" 
                fill="white" text-anchor="middle" font-weight="bold" dy=".3em">
            ${initials}
          </text>
        </svg>
      `)}`;
    },
    
    getMemberInitials(name) {
      if (!name) return '?';
      
      return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
    },
    
    // ========== EVENT LISTENER MANAGEMENT ==========
    
    handleKeydown(event) {
      if (event.key === 'Escape' && this.showFullCalendar) {
        event.preventDefault();
        this.closeFullCalendar();
      } else if (event.key === 'ArrowLeft') {
        this.goToPrevious();
      } else if (event.key === 'ArrowRight') {
        this.goToNext();
      }
    },
    
    setupEventListeners() {
      this.boundHandleKeydown = this.handleKeydown.bind(this);
      document.addEventListener('keydown', this.boundHandleKeydown);
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
      
      this.$nextTick(() => {
        if (this.$refs.modalContainer) {
          this.$refs.modalContainer.focus();
        }
      });
    },
    
    cleanupEventListeners() {
      if (this.boundHandleKeydown) {
        document.removeEventListener('keydown', this.boundHandleKeydown);
        this.boundHandleKeydown = null;
      }
      
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
      
      if (this.showMembersModal) {
        this.closeMembersModal();
      }
    },
    
    // ========== ERROR HANDLING ==========
    
    showErrorMessage(message) {
      console.error('Error:', message);
      this.error = message;
      
      setTimeout(() => {
        this.error = null;
      }, 5000);
    }
  },
  
  mounted() {
    if (this.showFullCalendar) {
      this.setupEventListeners();
    }
  },
  
  beforeDestroy() {
    this.cleanupEventListeners();
  }
};
</script>

<style scoped>
/* Holiday State Selector */
.holiday-state-selector {
  margin-right: 16px;
}

.state-select {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  color: #1e293b;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .state-select {
  background: #232948;
  border-color: #323b67;
  color: white;
}

.state-select:hover {
  border-color: #3b82f6;
}

/* Holiday Legend */
.legend-color.holiday-national {
  background: #DC2626;
}

.legend-color.holiday-state {
  background: #7C3AED;
}

/* Day Header Holiday Styles */
.calendar-day-header-week.holiday {
  background: linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%);
}

.dark .calendar-day-header-week.holiday {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
}

.holiday-indicator {
  position: absolute;
  top: 8px;
  right: 30px;
  color: #DC2626;
}

.day-holidays {
  margin-top: 8px;
  font-size: 11px;
  color: #64748b;
  max-height: 32px;
  overflow: hidden;
}

.holiday-name {
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.holiday-more {
  color: #94a3b8;
  font-size: 10px;
}

/* Holiday Row */
.holiday-row {
  background: linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%);
  border-bottom: 2px solid #e2e8f0;
}

.dark .holiday-row {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
  border-color: #323b67;
}

.holiday-cell {
  background: transparent !important;
  border-right-color: #e2e8f0 !important;
}

.holiday-icon {
  color: #DC2626;
}

.holiday-description {
  font-size: 12px;
  color: #64748b;
}

.dark .holiday-description {
  color: #94a3b8;
}

/* Holiday Span */
.holiday-span-week {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.holiday-span-week.holiday-national {
  background: rgba(220, 38, 38, 0.15);
  border: 2px solid rgba(220, 38, 38, 0.3);
}

.holiday-span-week.holiday-state {
  background: rgba(124, 58, 237, 0.15);
  border: 2px solid rgba(124, 58, 237, 0.3);
}

.holiday-span-week:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.holiday-content-week {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.holiday-info {
  flex: 1;
  min-width: 0;
}

.holiday-type {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 2px;
}

.holiday-span-week.holiday-national .holiday-type {
  color: #DC2626;
}

.holiday-span-week.holiday-state .holiday-type {
  color: #7C3AED;
}

.holiday-name {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Month View Holiday Styles */
.calendar-day-cell-month.has-holiday {
  background: linear-gradient(135deg, #fef2f2 0%, #fce7f3 100%);
}

.dark .calendar-day-cell-month.has-holiday {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(236, 72, 153, 0.1) 100%);
}

.day-date.holiday {
  position: relative;
  padding-right: 20px;
}

.holiday-indicator-month {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  color: #DC2626;
  font-size: 12px;
}

.day-holiday-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 4px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 10px;
}

.day-holiday-item.holiday-national {
  background: rgba(220, 38, 38, 0.15);
  border-left: 2px solid #DC2626;
}

.day-holiday-item.holiday-state {
  background: rgba(124, 58, 237, 0.15);
  border-left: 2px solid #7C3AED;
}

.holiday-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.day-holiday-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  font-weight: 600;
}

/* Statistics Holiday Value */
.holiday-value {
  color: #DC2626;
}

.dark .holiday-value {
  color: #f87171;
}

/* Members Modal Holiday Styles */
.holiday-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.dark .section-title {
  color: white;
}

.holiday-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.holiday-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  border-left: 4px solid transparent;
}

.dark .holiday-item {
  background: #232948;
}

.holiday-icon {
  width: 40px;
  height: 40px;
  background: #fef2f2;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #DC2626;
  flex-shrink: 0;
}

.dark .holiday-icon {
  background: rgba(239, 68, 68, 0.2);
}

.holiday-info {
  flex: 1;
}

.holiday-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  font-size: 14px;
}

.dark .holiday-name {
  color: white;
}

.holiday-details {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.dark .holiday-details {
  color: #94a3b8;
}

.holiday-type {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.holiday-state {
  font-style: italic;
}

/* Members Section */
.members-section {
  margin-top: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .holiday-state-selector {
    margin-right: 8px;
  }
  
  .state-select {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .holiday-span-week {
    padding: 6px;
  }
  
  .holiday-content-week {
    flex-direction: column;
    gap: 4px;
  }
  
  .holiday-type {
    font-size: 8px;
  }
  
  .holiday-name {
    font-size: 9px;
  }
}


/* Full Calendar Modal Styles */
.full-calendar-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  animation: modalFadeIn 0.3s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 9999;
  cursor: pointer;
}

.modal-container {
  position: relative;
  background: white;
  width: 95%;
  max-width: 1400px;
  max-height: 95vh;
  border-radius: 16px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.3s ease-out;
  cursor: default;
}

.dark .modal-container {
  background: #1a1d2d;
  border-color: #323b67;
}

@keyframes modalSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes modalFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dark .modal-header {
  border-color: #323b67;
}

.modal-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
}

.dark .modal-title {
  color: white;
}

.calendar-count {
  font-size: 14px;
  font-weight: 600;
  color: #64748b;
  background: #f1f5f9;
  padding: 4px 12px;
  border-radius: 20px;
}

.dark .calendar-count {
  color: #94a3b8;
  background: #232948;
}

.modal-close {
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.dark .modal-close:hover {
  color: white;
  background: #323b67;
}

.modal-body {
  padding: 32px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 24px 32px;
  background: #f8fafc;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dark .modal-footer {
  background: #15182a;
  border-color: #323b67;
}

.close-btn {
  padding: 12px 32px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  background: #3b82f6;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
}

.close-btn:hover {
  background: #2563eb;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.2);
}

.close-btn:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* Full Calendar Header */
.full-calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 16px;
}

.dark .full-calendar-header {
  border-color: #323b67;
}

.legend-items {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  flex: 1;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 14px;
  height: 14px;
  border-radius: 50%;
}

.legend-color.annual {
  background: #10b981;
}

.legend-color.medical {
  background: #ef4444;
}

.legend-color.onsite {
  background: #f59e0b;
}

.legend-color.wfh {
  background: #6366f1;
}

.legend-color.compassionate {
  background: #ec4899;
}

.legend-color.emergency {
  background: #f59e0b;
}

.legend-color.brought-forward {
  background: #6b7280;
}

.legend-color.maternity {
  background: #ec4899;
}

.legend-color.parental {
  background: #8b5cf6;
}

.legend-label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
}

.dark .legend-label {
  color: #94a3b8;
}

.calendar-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

/* View Toggle */
.view-toggle {
  display: flex;
  background: #f1f5f9;
  border-radius: 8px;
  padding: 4px;
  border: 1px solid #e2e8f0;
}

.dark .view-toggle {
  background: #232948;
  border-color: #323b67;
}

.view-toggle-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.dark .view-toggle-btn {
  color: #929bc9;
}

.view-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.dark .view-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.view-toggle-btn.active {
  background: white;
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .view-toggle-btn.active {
  background: #3b82f6;
  color: white;
}

/* Export Button */
.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.dark .export-btn {
  background: #232948;
  border-color: #323b67;
  color: #929bc9;
}

.export-btn:hover {
  background: #e2e8f0;
}

.dark .export-btn:hover {
  background: #323b67;
}

/* Calendar Navigation */
.calendar-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-period {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  min-width: 200px;
  text-align: center;
}

.dark .current-period {
  color: white;
}

.nav-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
  border: none;
}

.dark .nav-btn {
  background: #232948;
  border-color: #323b67;
  color: #929bc9;
}

.nav-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.dark .nav-btn:hover {
  background: #323b67;
  color: white;
}

.today-btn {
  width: auto;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

/* WEEK VIEW STYLES */
.week-view {
  margin-bottom: 32px;
}

.calendar-days-header.week-days-header {
  display: grid;
  grid-template-columns: 250px repeat(7, 1fr);
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
  border: 1px solid #e2e8f0;
  border-bottom: none;
}

.dark .calendar-days-header.week-days-header {
  background: #232948;
  border-color: #323b67;
}

.calendar-day-header-week {
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border-right: 1px solid #e2e8f0;
}

.dark .calendar-day-header-week {
  border-color: #323b67;
}

.calendar-day-header-week:last-child {
  border-right: none;
}

.calendar-day-header-week:hover {
  background: #e2e8f0;
}

.dark .calendar-day-header-week:hover {
  background: #323b67;
}

.calendar-day-header-week.today {
  background: #dbeafe;
}

.dark .calendar-day-header-week.today {
  background: rgba(59, 130, 246, 0.2);
}

.calendar-day-header-week.weekend {
  background: #fef2f2;
}

.dark .calendar-day-header-week.weekend {
  background: rgba(239, 68, 68, 0.1);
}

.day-header-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.day-name {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .day-name {
  color: #94a3b8;
}

.date-number {
  font-size: 20px;
  font-weight: 700;
  color: #1e293b;
}

.dark .date-number {
  color: white;
}

.month-name {
  font-size: 12px;
  color: #64748b;
}

.dark .month-name {
  color: #94a3b8;
}

.day-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 600;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Calendar Members List */
.calendar-members-list {
  border: 1px solid #e2e8f0;
  border-radius: 0 0 8px 8px;
  overflow: hidden;
}

.dark .calendar-members-list {
  border-color: #323b67;
}

.calendar-member-row {
  display: grid;
  grid-template-columns: 250px repeat(7, 1fr);
  border-bottom: 1px solid #e2e8f0;
}

.dark .calendar-member-row {
  border-color: #323b67;
}

.calendar-member-row:last-child {
  border-bottom: none;
}

.calendar-member-row:hover {
  background: #f8fafc;
}

.dark .calendar-member-row:hover {
  background: #232948;
}

.member-info-cell {
  padding: 16px 20px;
  border-right: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dark .member-info-cell {
  border-color: #323b67;
}

.member-info-cell:hover {
  background: #e2e8f0;
}

.dark .member-info-cell:hover {
  background: #323b67;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  background-color: #e2e8f0;
}

.dark .member-avatar {
  background-color: #323b67;
}

.member-details {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 2px;
}

.dark .member-name {
  color: white;
}

.member-department {
  font-size: 12px;
  color: #64748b;
}

.dark .member-department {
  color: #94a3b8;
}

/* Day Cells for Week View */
.day-cell-week {
  padding: 8px;
  border-right: 1px solid #e2e8f0;
  min-height: 80px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.dark .day-cell-week {
  border-color: #323b67;
}

.day-cell-week:last-child {
  border-right: none;
}

.day-cell-week:hover {
  background: #f8fafc;
}

.dark .day-cell-week:hover {
  background: #232948;
}

.day-cell-week.today {
  background: rgba(59, 130, 246, 0.05);
}

.day-cell-week.weekend {
  background: #fef2f2;
}

.dark .day-cell-week.weekend {
  background: rgba(239, 68, 68, 0.05);
}

/* Leave Span for Week View */
.leave-span-week {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  bottom: 8px;
  border-radius: 8px;
  border-left: 4px solid;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.leave-span-week:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.leave-content-week {
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.leave-icon {
  font-size: 16px;
  margin-bottom: 4px;
}

.leave-type {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.leave-duration {
  font-size: 11px;
  opacity: 0.8;
}

/* Day Empty for Week View */
.day-empty-week {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #cbd5e1;
}

/* Empty State for Week View */
.calendar-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  color: #94a3b8;
}

.dark .empty-icon {
  background: #232948;
  color: #929bc9;
}

.calendar-empty-state h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.dark .calendar-empty-state h3 {
  color: white;
}

.calendar-empty-state p {
  margin: 0 0 20px 0;
  color: #64748b;
  font-size: 14px;
}

.dark .calendar-empty-state p {
  color: #94a3b8;
}

/* MONTH VIEW STYLES */
.month-view {
  margin-bottom: 32px;
  width: 100%;
}

.calendar-days-header.month-days-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.calendar-day-header-month {
  padding: 12px 8px;
  background: #dbe9f8;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

.dark .calendar-day-header-month {
  background: #232948;
  border-color: #323b67;
}

.calendar-day-header-month.weekend {
  background: rgba(211, 211, 211, 0.507);}

.dark .calendar-day-header-month.weekend {
  background: rgba(239, 68, 68, 0.05);
}

.calendar-weeks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.calendar-week {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  width: 100%;
}

.calendar-day-cell-month {
  min-height: 120px;
  padding: 12px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .calendar-day-cell-month {
  background: #232948;
  border-color: #323b67;
}

.calendar-day-cell-month:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.calendar-day-cell-month.today {
  background: rgba(59, 130, 246, 0.1);
  border-color: rgba(59, 130, 246, 0.3);
}

.calendar-day-cell-month:not(.current-month) {
  background: rgba(211, 211, 211, 0.507);
  opacity: 0.7;
}

.dark .calendar-day-cell-month:not(.current-month) {
  background: #15182a;
}

.calendar-day-cell-month.weekend {
  background: rgba(211, 211, 211, 0.507);
}

.dark .calendar-day-cell-month.weekend {
  background: rgba(239, 68, 68, 0.05);
}

.day-cell-header {
  margin-bottom: 8px;
}

.day-date {
  font-size: 14px;
  font-weight: 700;
  color: #1e293b;
}

.dark .day-date {
  color: white;
}

.day-date.today {
  color: #3b82f6;
  font-weight: 800;
}

.day-members-list {
  flex: 1;
  overflow-y: auto;
  max-height: 80px;
}

.day-member-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 11px;
  transition: all 0.2s;
  cursor: pointer;
}

.day-member-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.dark .day-member-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.day-member-item.annual {
  background: rgba(16, 185, 129, 0.15);
  border-left: 3px solid #10b981;
}

.day-member-item.medical {
  background: rgba(239, 68, 68, 0.15);
  border-left: 3px solid #ef4444;
}

.day-member-item.compassionate {
  background: rgba(236, 72, 153, 0.15);
  border-left: 3px solid #ec4899;
}

.day-member-item.onsite {
  background: rgba(245, 158, 11, 0.15);
  border-left: 3px solid #f59e0b;
}

.day-member-item.wfh {
  background: rgba(99, 102, 241, 0.15);
  border-left: 3px solid #6366f1;
}

.day-member-avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 2px solid white;
  flex-shrink: 0;
}

.dark .day-member-avatar {
  border-color: #1a1d2d;
}

.day-member-name {
  font-weight: 600;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.dark .day-member-name {
  color: white;
}

.day-member-more {
  font-size: 10px;
  color: #64748b;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  width: 100%;
}

.dark .day-member-more {
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.1);
}

.day-member-more:hover {
  background: rgba(0, 0, 0, 0.1);
}

.dark .day-member-more:hover {
  background: rgba(255, 255, 255, 0.2);
}

.day-empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  opacity: 0.5;
  cursor: pointer;
}

.empty-day-icon {
  font-size: 20px;
  font-weight: bold;
  color: #10b981;
}

/* Statistics Section */
.calendar-statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 32px;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.dark .stat-card {
  background: #232948;
  border-color: #323b67;
}

.stat-icon {
  width: 48px;
  height: 48px;
  background: #dbeafe;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1d4ed8;
  flex-shrink: 0;
}

.dark .stat-icon {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.stat-content {
  flex: 1;
}

.stat-content h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.dark .stat-content h4 {
  color: white;
}

.stat-numbers {
  display: flex;
  gap: 24px;
}

.stat-number {
  display: flex;
  flex-direction: column;
}

.number-label {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
}

.dark .number-label {
  color: #94a3b8;
}

.number-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.dark .number-value {
  color: white;
}

.breakdown-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.breakdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.breakdown-item:hover {
  background: #f8fafc;
}

.dark .breakdown-item:hover {
  background: #2a3156;
}

.breakdown-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.breakdown-label {
  flex: 1;
  font-size: 14px;
  color: #475569;
}

.dark .breakdown-label {
  color: #94a3b8;
}

.breakdown-count {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.dark .breakdown-count {
  color: white;
}

/* View more modal styles (keep your existing modal styles) */
.members-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: modalFadeIn 0.2s ease-out;
}

.members-modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(2px);
  z-index: 10001;
  cursor: pointer;
}

.members-modal-content {
  position: relative;
  background: white;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  border-radius: 12px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  z-index: 10002;
  display: flex;
  flex-direction: column;
  animation: modalSlideIn 0.2s ease-out;
}

.dark .members-modal-content {
  background: #1a1d2d;
  border-color: #323b67;
}

.members-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.dark .members-modal-header {
  border-color: #323b67;
}

.members-modal-title {
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
}

.dark .members-modal-title {
  color: white;
}

.members-modal-close {
  color: #94a3b8;
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.members-modal-close:hover {
  color: #1e293b;
  background: #f1f5f9;
}

.dark .members-modal-close:hover {
  color: white;
  background: #323b67;
}

.members-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 8px;
  background: #f8fafc;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.dark .member-item {
  background: #232948;
}

.member-item:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dark .member-item:hover {
  background: #2a3156;
}

.member-item.annual {
  border-left-color: #10b981;
}

.member-item.medical {
  border-left-color: #ef4444;
}

.member-item.compassionate {
  border-left-color: #ec4899;
}

.member-item.onsite {
  border-left-color: #f59e0b;
}

.member-item.wfh {
  border-left-color: #6366f1;
}

.member-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 3px solid white;
  flex-shrink: 0;
}

.dark .member-avatar {
  border-color: #1a1d2d;
}

.member-info {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
  font-size: 16px;
}

.dark .member-name {
  color: white;
}

.member-leave-type {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 2px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dark .member-leave-type {
  color: #94a3b8;
}

.member-dates {
  font-size: 12px;
  color: #94a3b8;
}

.dark .member-dates {
  color: #929bc9;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .calendar-days-header.week-days-header {
    grid-template-columns: 200px repeat(7, 1fr);
  }
  
  .calendar-member-row {
    grid-template-columns: 200px repeat(7, 1fr);
  }
  
  .member-info-cell {
    padding: 12px 16px;
  }
}

@media (max-width: 1024px) {
  .full-calendar-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .calendar-header-right {
    flex-direction: column;
    align-items: stretch;
  }
  
  .view-toggle {
    align-self: flex-start;
  }
  
  .calendar-nav {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .modal-container {
    width: 100%;
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }

  .modal-header {
    padding: 16px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 16px 20px;
  }

  .calendar-days-header.week-days-header {
    grid-template-columns: 150px repeat(7, 1fr);
  }
  
  .calendar-member-row {
    grid-template-columns: 150px repeat(7, 1fr);
  }
  
  .member-info-cell {
    padding: 8px 12px;
  }
  
  .member-avatar {
    width: 32px;
    height: 32px;
  }
  
  .member-name {
    font-size: 12px;
  }
  
  .calendar-day-cell-month {
    min-height: 100px;
    padding: 8px;
  }
  
  .calendar-statistics {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .modal-title {
    font-size: 18px;
  }
  
  .calendar-days-header.week-days-header {
    grid-template-columns: 120px repeat(7, 1fr);
  }
  
  .calendar-member-row {
    grid-template-columns: 120px repeat(7, 1fr);
  }
  
  .member-info-cell {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }
  
  .member-details {
    display: none;
  }
  
  .calendar-day-cell-month {
    min-height: 80px;
    padding: 6px;
  }
  
  .day-member-name {
    display: none;
  }
  
  .day-member-avatar {
    width: 24px;
    height: 24px;
  }
  
  .close-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Print styles */
@media print {
  .full-calendar-modal {
    position: static;
    display: block;
  }

  .modal-overlay {
    display: none;
  }

  .modal-container {
    position: static;
    transform: none;
    width: 100%;
    max-width: 100%;
    max-height: none;
    box-shadow: none;
    border: 1px solid #000;
  }

  .modal-close,
  .close-btn {
    display: none;
  }
  
  .modal-footer {
    display: none;
  }
}
</style>