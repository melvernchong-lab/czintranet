<template>
    <div class="team-calendar-section">
        <div class="leave-sidebar-card team-calendar-card">
            <div class="calendar-card-header">
                <div class="calendar-header-main">
                    <h3 class="calendar-card-title">People Out This Week</h3>
                    <span v-if="teamMembersThisWeek.length > 0" class="calendar-count">
                        {{ teamMembersThisWeek.length }} people out
                    </span>
                </div>

                <div class="calendar-header-right">
                    <div class="legend-items">
                        <div v-for="type in legendLeaveTypes" :key="type.id" class="legend-item">
                            <div class="legend-color" :class="type.className"></div>
                            <span class="legend-label">{{ type.displayName }}</span>
                        </div>
                    </div>

                    <div class="calendar-week-nav">
                        <button class="nav-btn prev-week" @click="goToPrevWeek">
                            <span class="material-symbols-outlined">chevron_left</span>
                        </button>
                        <span class="current-week-range">{{ formatWeekRange }}</span>
                        <button class="nav-btn next-week" @click="goToNextWeek">
                            <span class="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            <div class="calendar-container">
                <div v-if="teamMembersThisWeek.length > 0">
                    <div class="calendar-header">
                        <div v-for="day in weekDays" :key="day.date" class="calendar-day-header"
                            :class="{ 'today-column': day.isToday }">
                            <div class="day-of-week-date-container">
                                <div class="day-of-week" :class="{ 'today-column': day.isToday }">{{ day.day }},</div>
                                <div class="date-number" :class="{ 'today-column': day.isToday }">{{ day.dateNumber }}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="calendar-grid-compact">
                        <div class="calendar-days-compact">
                            <div v-for="day in weekDays" :key="day.date" class="calendar-day-compact"
                                :class="{ 'today-column': day.isToday }">
                                <div class="calendar-day-cell-compact">
                                    <div class="members-stack-container" :class="{ 'today-column': day.isToday }">
                                        <div v-for="(member, index) in getMembersOutOnDay(day.date)" :key="member.id"
                                            class="stacked-member-line">
                                            <div class="stacked-avatar-name-line"
                                                :class="[getTypeClass(member.leaveTypeId)]">
                                                <div class="stacked-avatar-line"
                                                    :style="{ backgroundImage: `url('${member.avatar}')` }">
                                                </div>
                                                <div class="stacked-name-line">
                                                    <span class="member-name">{{ member.name }}</span>
                                                    <div class="legend-label-dot"
                                                        :class="getLeaveTypeDotClass(member.leaveTypeId)"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button v-if="getMembersOutOnDay(day.date, 0).length > 3" class="member-count-line"
                                        @click.stop="handleMoreClick(day.date)">
                                        +{{ getMembersOutOnDay(day.date, 0).length - 3 }} more
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="calendar-empty-compact">
                    <div class="empty-icon-compact">
                        <span class="material-symbols-outlined">check_circle</span>
                    </div>
                    <p class="empty-message-compact">No one out this week</p>
                </div>
            </div>

            <a href="#" class="view-full-schedule-compact" @click.prevent="openFullCalendar">
                View Full Calendar
                <span class="material-symbols-outlined">arrow_forward</span>
            </a>
        </div>

        <!-- Full Calendar Modal -->
        <FullTeamCalendar :showFullCalendar="showFullCalendar" :teamMembers="teamMembers" @close="closeFullCalendar"
            @member-click="handleMemberClick" @day-click="handleDayClick" />
    </div>

    <div class="more-members-modal" v-if="showMembersModal" @click.self="closeMembersModal">
        <div class="more-members-modal-overlay"></div>
        <div class="more-members-modal-content" ref="membersModalContent">
            <div class="more-members-modal-header">
                <h3 class="more-members-modal-title">
                    {{ selectedDay ? formatSelectedDate(selectedDay) : '' }}
                </h3>
                <button class="more-members-modal-close" @click="closeMembersModal" aria-label="Close">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            <div class="more-members-modal-body">
                <div v-if="selectedDayMembers.length > 0" class="more-members-list">
                    <div v-for="member in selectedDayMembers" :key="member.id" class="more-member-item"
                        :class="getTypeClass(member.leaveTypeId)" @click="handleMemberClick(member.id)">
                        <div class="more-member-avatar" :style="{ backgroundImage: `url('${member.avatar}')` }">
                        </div>
                        <div class="more-member-info">
                            <div class="more-member-name">{{ member.name }}</div>
                            <div class="more-member-leave-type">
                                {{ getApplicationTypeDisplay(member.leaveType) }}
                            </div>
                            <div class="more-member-dates">
                                Duration: {{ formatDateRange(member.startDate, member.endDate) }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import FullTeamCalendar from "./FullTeamCalendar.vue";
import {
    leaveTypes,
    approvalStatuses,
    normalizeLeaveType,
    getLeaveTypeConfig,
    getLeaveTypeIcon,
    getLeaveTypeColor,
    getLeaveTypeClass,
    getLeaveTypeCategory,
    getCommonLeaveTypes,
    getLegendLeaveTypes,
    getColorVariants,
    isValidLeaveType,
    getLeaveTypeDotClass
} from "../../../utils/leaveTypes";

export default {
    name: 'TeamCalendar',
    components: {
        FullTeamCalendar
    },
    props: {
        teamMembers: {
            type: Array,
            default: () => []
        }
    },
    emits: ['view-full-calendar', 'member-click', 'day-click'],

    data() {
        const getWeekStartDate = (date) => {
            const d = new Date(date);
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(d.setDate(diff)).toISOString().split('T')[0];
        };

        const today = new Date();

        return {
            currentWeekStart: getWeekStartDate(today),
            showFullCalendar: false,
            leaveTypes,
            approvalStatuses,
            showMembersModal: false,
            selectedDay: null,
            selectedDayMembers: [],
            boundHandleKeydown: null,
            isLoading: false,
            error: null,
            validatedTeamMembers: [] // Local copy to avoid mutating props
        };
    },

    computed: {
        weekDays() {
            const week = [];
            const startDate = new Date(this.currentWeekStart);

            for (let i = 0; i < 5; i++) { // Weekdays only (Mon-Fri)
                const date = new Date(startDate);
                date.setDate(startDate.getDate() + i);

                const today = new Date();
                const isToday = date.toDateString() === today.toDateString();
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                const formattedDate = this.formatDateToMMMDD(date);

                week.push({
                    date: date.toISOString().split('T')[0],
                    day: this.formatDayName(date.getDay()),
                    dateNumber: formattedDate,
                    isToday,
                    isWeekend,
                    fullDate: date
                });
            }

            return week;
        },

        formatWeekRange() {
            const start = new Date(this.currentWeekStart);
            const end = new Date(start);
            end.setDate(start.getDate() + 4); // Monday to Friday

            const startFormatted = this.formatDateShort(this.currentWeekStart);
            const endFormatted = this.formatDateShort(end.toISOString().split('T')[0]);

            return `${startFormatted} - ${endFormatted}`;
        },

        teamMembersThisWeek() {
            const weekStart = new Date(this.currentWeekStart);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 4); // Monday to Friday
            weekEnd.setHours(23, 59, 59, 999);

            return this.validatedTeamMembers.filter(member => {
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

        legendLeaveTypes() {
            const commonTypes = ['annual', 'medical', 'onsite', 'wfh', 'compassionate'];
            return commonTypes.map(typeId => {
                const config = this.getLeaveTypeConfig(typeId);
                if (config) {
                    return {
                        id: typeId,
                        displayName: config.name,
                        className: typeId
                    };
                }
                return {
                    id: typeId,
                    displayName: typeId.charAt(0).toUpperCase() + typeId.slice(1),
                    className: typeId
                };
            });
        },

        // Statistics for the current week
        weeklyStats() {
            const stats = {
                totalOut: 0,
                byType: {},
                byDay: {}
            };

            this.weekDays.forEach(day => {
                const members = this.getMembersOutOnDate(day.date);
                stats.byDay[day.date] = members.length;
                stats.totalOut += members.length;

                members.forEach(member => {
                    const type = this.getNormalizedLeaveType(member.leaveTypeId);
                    stats.byType[type] = (stats.byType[type] || 0) + 1;
                });
            });

            return stats;
        }
    },

    watch: {
        teamMembers: {
            immediate: true,
            handler(newVal) {
                this.validatedTeamMembers = this.validateTeamMemberData(newVal);
            }
        },

        showFullCalendar(newVal) {
            if (newVal) {
                this.setupEventListeners();
            } else {
                this.cleanupEventListeners();
            }
        }
    },

    methods: {
        // ========== INITIALIZATION ==========

        initializeData() {
            this.validatedTeamMembers = this.validateTeamMemberData(this.teamMembers);
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

        // ========== DATA VALIDATION ==========

        validateTeamMemberData(members) {
            return members.map(member => {
                // Ensure leaveTypeId is valid
                let validLeaveTypeId = member.leaveTypeId || member.leaveType;

                const normalized = this.getNormalizedLeaveType(validLeaveTypeId);
                const config = getLeaveTypeConfig(normalized);
                validLeaveTypeId = config ? config.id : 'AL';

                // Validate dates
                let startDate = member.startDate;
                let endDate = member.endDate;

                try {
                    if (startDate) new Date(startDate);
                    if (endDate) new Date(endDate);
                } catch (error) {
                    console.warn('Invalid date format for member:', member.id);
                    startDate = this.getTodayDate();
                    endDate = this.getTodayDate();
                }

                return {
                    ...member,
                    leaveTypeId: validLeaveTypeId,
                    startDate,
                    endDate,
                    leaveTypeDisplay: this.getLeaveTypeDisplay(validLeaveTypeId),
                    leaveColor: this.getLeaveTypeColor(validLeaveTypeId),
                    duration: this.calculateDuration(startDate, endDate)
                };
            });
        },

        // ========== DATA PROCESSING ==========

        getMembersOutOnDate(dateString, membersList = null) {
            const members = membersList || this.validatedTeamMembers;
            const targetDate = new Date(dateString);
            targetDate.setHours(0, 0, 0, 0);

            return members.filter(member => {
                if (!member.startDate || !member.endDate) return false;

                try {
                    const startDate = new Date(member.startDate);
                    const endDate = new Date(member.endDate);

                    startDate.setHours(0, 0, 0, 0);
                    endDate.setHours(23, 59, 59, 999);

                    return targetDate >= startDate && targetDate <= endDate;
                } catch (error) {
                    console.error('Error processing member dates:', member, error);
                    return false;
                }
            });
        },

        isMemberOutOnDay(member, dateString) {
            return this.getMembersOutOnDate(dateString, [member]).length > 0;
        },

        getMembersOutOnDay(dateString, limit = 3) {
            const allMembers = this.teamMembersThisWeek.filter(member => {
                return this.isMemberOutOnDay(member, dateString);
            });
            return limit > 0 ? allMembers.slice(0, limit) : allMembers;
        },

        // ========== DATE FORMATTING ==========

        getTodayDate() {
            const today = new Date();
            return today.toISOString().split('T')[0];
        },

        formatDate(dateString) {
            if (!dateString) return '';

            try {
                const date = new Date(dateString);
                return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
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

                // Check if same month
                if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                    return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('default', { month: 'short' })}`;
                }

                // Check if same year
                if (start.getFullYear() === end.getFullYear()) {
                    const startStr = start.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    const endStr = end.toLocaleDateString('default', { month: 'short', day: 'numeric' });
                    return `${startStr} - ${endStr}`;
                }

                // Different years
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

        formatDateToMMMDD(date) {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        },

        formatDateShort(dateString) {
            const date = new Date(dateString);
            const month = date.toLocaleDateString('default', { month: 'short' });
            const day = date.getDate();
            return `${month} ${day}`;
        },

        formatSelectedDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
        },

        getDaysUntil(dateString) {
            if (!dateString) return 0;
            const today = new Date();
            const target = new Date(dateString);
            const diffTime = target - today;
            return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
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
            if (members.length > 0) {
                this.selectedDay = date;
                this.selectedDayMembers = members;
                this.showMembersModal = true;

                // Prevent body scrolling
                document.body.style.overflow = 'hidden';
                this.setupEventListeners();

                this.$nextTick(() => {
                    if (this.$refs.membersModalContent) {
                        this.$refs.membersModalContent.focus();
                    }
                });
            }
        },

        closeMembersModal() {
            this.showMembersModal = false;
            this.selectedDay = null;
            this.selectedDayMembers = [];

            // Restore body scrolling
            document.body.style.overflow = '';
            this.cleanupEventListeners();
        },

        openFullCalendar() {
            this.showFullCalendar = true;
            this.$emit('view-full-calendar');
        },

        closeFullCalendar() {
            this.showFullCalendar = false;
        },

        getTypeClass(typeId) {
            const config = this.getLeaveTypeConfig(typeId);
            return config ? config.id.toLowerCase() : 'default';
        },

        getApplicationTypeDisplay(typeId) {
            return this.getLeaveTypeDisplay(typeId);
        },

        getLeaveTypeDotClass(typeId) {
            return getLeaveTypeDotClass(typeId);
        },

        handleMemberClick(memberId) {
            this.$emit('member-click', memberId);
        },

        handleDayClick(data) {
            this.$emit('day-click', data);
        },

        // ========== CALENDAR NAVIGATION ==========

        goToPrevWeek() {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() - 7);
            this.currentWeekStart = date.toISOString().split('T')[0];
        },

        goToNextWeek() {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + 7);
            this.currentWeekStart = date.toISOString().split('T')[0];
        },

        goToToday() {
            const today = new Date();
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            this.currentWeekStart = new Date(today.setDate(diff)).toISOString().split('T')[0];
        },

        // ========== EVENT LISTENER MANAGEMENT ==========

        handleKeydown(event) {
            // Handle Escape key to close modals
            if (event.key === 'Escape') {
                event.preventDefault();
                if (this.showMembersModal) {
                    this.closeMembersModal();
                } else if (this.showFullCalendar) {
                    this.closeFullCalendar();
                }
            }
        },

        setupEventListeners() {
            // Bind the keydown handler to ensure proper 'this' context
            this.boundHandleKeydown = this.handleKeydown.bind(this);
            document.addEventListener('keydown', this.boundHandleKeydown);
        },

        cleanupEventListeners() {
            // Remove event listener
            if (this.boundHandleKeydown) {
                document.removeEventListener('keydown', this.boundHandleKeydown);
                this.boundHandleKeydown = null;
            }
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

        // ========== ERROR HANDLING ==========

        showErrorMessage(message) {
            console.error('Error:', message);
            this.error = message;

            setTimeout(() => {
                this.error = null;
            }, 5000);
        },

        showSuccessMessage(message) {
            console.log('Success:', message);
        }
    },

    created() {
        this.initializeData();
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
@import "../../../styles/views/Leave/TeamCalendar.css";
</style>