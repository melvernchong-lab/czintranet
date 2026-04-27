<template>
    <div class="leave-sidebar-section">
        <!-- Next Out of Office Card -->
        <div class="leave-upcoming-card">
            <div class="leave-card-header">
                <div class="upcoming-card-header">
                    <h3 class="leave-card-title">Holiday Ahead</h3>
                </div>

                <!-- Loading State -->
                <div v-if="loading && !useMockData" class="upcoming-loading">
                    <div class="loading-spinner"></div>
                    <p>Loading upcoming events...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="error && !useMockData" class="upcoming-error">
                    <span class="material-symbols-outlined">error</span>
                    <p>{{ error }}</p>
                    <button @click="loadUpcomingEvents" class="retry-btn">Retry</button>
                </div>

                <!-- No Upcoming Events -->
                <div v-else-if="upcomingEvents.length === 0 && !useMockData" class="upcoming-empty">
                    <div class="empty-icon">
                        <span class="material-symbols-outlined">check_circle</span>
                    </div>
                    <p class="empty-message">No upcoming leave or holidays</p>
                </div>

                <!-- Upcoming Events -->
                <div v-else class="upcoming-content">
                    <!-- Unified event list showing up to 4 events -->
                    <div class="upcoming-events-list">
                        <div v-for="(event, index) in displayEvents" :key="event.id || event.date"
                            class="upcoming-event-item" @click="selectEvent(event)">

                            <div class="event-date-badge" :style="{ backgroundColor: getEventColor(event) }">
                                <span class="event-month">{{ formatMonthShort(event.startDate || event.date) }}</span>
                                <span class="event-day">{{ formatDay(event.startDate || event.date) }}</span>
                            </div>

                            <div class="event-details">
                                <div class="event-title">
                                    <span class="event-type-icon material-symbols-outlined"
                                        :style="{ color: getEventColor(event) }">
                                        {{ getEventIcon(event) }}
                                    </span>
                                    {{ getEventDisplayName(event) }}
                                </div>

                                <div class="event-info">
                                    <span class="event-duration">{{ event.duration || '1 day' }}</span>
                                    <span class="event-days-until">
                                        {{ getDaysUntil(event.startDate || event.date) }} days
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button v-if="hasMoreEvents" @click="openFullListingModal" class="view-all-upcoming-btn">
                Show More
                <span class=" material-symbols-outlined material-icons">arrow_forward</span>
            </button>
        </div>

        <!-- Full Listing Modal -->
        <div v-if="showFullListingModal" class="full-listing-modal" @click.self="closeFullListingModal">
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <h3 class="modal-title">All Upcoming Events</h3>
                    <button class="modal-close" @click="closeFullListingModal">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="events-tabs">
                        <button class="tab-btn" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'">
                            All Events ({{ allCombinedEvents.length }})
                        </button>
                        <button class="tab-btn" :class="{ active: activeTab === 'leave' }" @click="activeTab = 'leave'">
                            Leave ({{ leaveEvents.length }})
                        </button>
                        <button class="tab-btn" :class="{ active: activeTab === 'holidays' }"
                            @click="activeTab = 'holidays'">
                            Holidays ({{ holidayEvents.length }})
                        </button>
                    </div>

                    <div class="events-list">
                        <div v-if="filteredEvents.length === 0" class="no-events">
                            <span class="material-symbols-outlined">calendar_today</span>
                            <p>No upcoming events</p>
                        </div>

                        <div v-for="event in filteredEvents" :key="event.id || event.date" class="full-event-item"
                            @click="selectEvent(event)">
                            <div class="event-date" :style="{ backgroundColor: getEventColor(event) }">
                                <span class="event-month">{{ formatMonthShort(event.startDate || event.date) }}</span>
                                <span class="event-day">{{ formatDay(event.startDate || event.date) }}</span>
                            </div>
                            <div class="event-info">
                                <div class="event-header">
                                    <span class="event-type">
                                        <span class="material-symbols-outlined"
                                            :style="{ color: getEventColor(event) }">
                                            {{ getEventIcon(event) }}
                                        </span>
                                        {{ getEventDisplayName(event) }}
                                    </span>
                                    <span class="event-days">
                                        {{ getDaysUntil(event.startDate || event.date) }} days
                                    </span>
                                </div>
                                <p class="event-description">{{ event.description || event.title || event.name }}</p>
                                <div class="event-footer">
                                    <span class="event-duration">{{ event.duration || '1 day' }}</span>
                                    <span class="event-date-range">{{ formatDateRange(event.startDate, event.endDate)
                                        }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="close-btn" @click="closeFullListingModal">Close</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import {
    getMemberUpcomingEvents,
    getNextUpcomingEvent,
    getHolidaysWithFallback
} from '@/utils/upcomingLeaveUtil';

// Import leave type utilities
import {
    getLeaveTypeConfig,
    normalizeLeaveType,
    getLeaveTypeColor,
    getLeaveTypeIcon
} from '@/utils/leaveTypes';

export default {
    name: 'UpcomingLeaveCard',
    props: {
        // Member data
        member: {
            type: Object,
            required: true,
            default: () => ({})
        },

        // Configuration
        config: {
            type: Object,
            default: () => ({
                daysAhead: 60,
                state: 'selangor',
                includeHolidays: true,
                includeBirthdays: false,
                showHolidaysSection: true,
                showKnowledgeBase: true,
                showViewAll: true,
                showUpcomingList: true,
                showUpcomingCount: 2,
                useMockData: true
            })
        },

        // Available Malaysian states for filtering
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

    emits: [
        'view-all-upcoming',
        'request-leave',
        'event-selected',
        'holiday-selected',
        'open-knowledge-base',
        'refresh-requested'
    ],

    data() {
        return {
            // Upcoming events
            upcomingEvents: [],
            leaveEvents: [],
            holidayEvents: [],
            loading: false,
            error: null,
            refreshing: false,

            // Malaysia holidays
            malaysiaHolidays: [],
            holidaysLoading: false,
            holidaysError: null,
            selectedState: this.config.state || '',

            // Configuration from props with defaults
            daysAhead: this.config.daysAhead || 60,
            includeHolidays: this.config.includeHolidays !== false,
            showHolidaysSection: this.config.showHolidaysSection !== false,
            showUpcomingCount: this.config.showUpcomingCount || 2,
            useMockData: this.config.useMockData !== false,

            // Modal state
            showFullListingModal: false,
            activeTab: 'all'
        };
    },

    computed: {
        // Combine leave events and holidays
        allCombinedEvents() {
            const combined = [...this.leaveEvents, ...this.holidayEvents];
            // Sort by date (coming soon first)
            return combined.sort((a, b) => {
                const dateA = new Date(a.startDate || a.date);
                const dateB = new Date(b.startDate || b.date);
                return dateA - dateB;
            });
        },

        // Get display events based on screen size
        displayEvents() {
            const screenWidth = window.innerWidth;
            let maxEvents = 4; // Default for laptop/desktop

            if (screenWidth <= 768) {
                maxEvents = 2; // Tablet
            }
            if (screenWidth <= 480) {
                maxEvents = 1; // Mobile
            }

            return this.allCombinedEvents.slice(0, maxEvents);
        },

        // Check if there are more events to show
        hasMoreEvents() {
            return this.allCombinedEvents.length > this.showUpcomingCount;
        },

        // Filter events based on active tab
        filteredEvents() {
            switch (this.activeTab) {
                case 'leave':
                    return this.leaveEvents;
                case 'holidays':
                    return this.holidayEvents;
                default:
                    return this.allCombinedEvents;
            }
        },

        showViewAll() {
            return this.config.showViewAll !== false;
        }
    },

    watch: {
        member: {
            immediate: true,
            handler(newMember) {
                if (newMember && Object.keys(newMember).length > 0) {
                    this.loadUpcomingEvents();
                }
            }
        },

        config: {
            deep: true,
            handler(newConfig) {
                this.daysAhead = newConfig.daysAhead || 60;
                this.includeHolidays = newConfig.includeHolidays !== false;
                this.showHolidaysSection = newConfig.showHolidaysSection !== false;
                this.showUpcomingCount = newConfig.showUpcomingCount || 2;
                this.selectedState = newConfig.state || '';
                this.useMockData = newConfig.useMockData !== false;

                this.loadUpcomingEvents();
                if (this.showHolidaysSection) {
                    this.loadHolidays();
                }
            }
        }
    },

    created() {
        this.initializeData();
    },

    methods: {
        /**
         * Initialize data
         */
        async initializeData() {
            if (this.useMockData) {
                this.loadMockData();
            } else {
                await Promise.all([
                    this.loadUpcomingEvents(),
                    this.showHolidaysSection && this.loadHolidays()
                ]);
            }
        },

        /**
         * Load mock data for demonstration
         */
        loadMockData() {
            console.log('Loading mock data for demonstration...');

            // Mock leave events data using leave type configuration
            this.leaveEvents = [
                {
                    id: 1,
                    type: 'leave',
                    title: 'Annual Leave',
                    leaveType: 'AL',
                    description: 'Family vacation',
                    startDate: this.getDateInDays(5),
                    endDate: this.getDateInDays(7),
                    status: 'approved',
                    statusDisplay: 'Approved',
                    duration: '3 days',
                    daysUntil: 5,
                },
                {
                    id: 2,
                    type: 'leave',
                    title: 'Medical Leave',
                    leaveType: 'MC',
                    description: 'Dental appointment',
                    startDate: this.getDateInDays(10),
                    endDate: this.getDateInDays(10),
                    status: 'pending',
                    statusDisplay: 'Pending',
                    duration: '1 day',
                    daysUntil: 10,
                },
                {
                    id: 3,
                    type: 'leave',
                    title: 'Work From Home',
                    leaveType: 'WFH',
                    description: 'Remote work day',
                    startDate: this.getDateInDays(15),
                    endDate: this.getDateInDays(15),
                    status: 'approved',
                    statusDisplay: 'Approved',
                    duration: '1 day',
                    daysUntil: 15,
                },
                {
                    id: 4,
                    type: 'leave',
                    title: 'Onsite Plan',
                    leaveType: 'OS',
                    description: 'Client site visit',
                    startDate: this.getDateInDays(18),
                    endDate: this.getDateInDays(18),
                    status: 'approved',
                    statusDisplay: 'Approved',
                    duration: '1 day',
                    daysUntil: 18,
                }
            ];

            // Mock holiday events data
            this.holidayEvents = [
                {
                    date: this.getDateInDays(3),
                    name: 'Chinese New Year',
                    type: 'holiday',
                    holidayType: 'national',
                    state: null,
                    description: 'Chinese New Year Celebration',
                    duration: '2 days',
                    daysUntil: 3,
                },
                {
                    date: this.getDateInDays(12),
                    name: 'Hari Raya Puasa',
                    type: 'holiday',
                    holidayType: 'national',
                    state: null,
                    description: 'Eid al-Fitr',
                    duration: '2 days',
                    daysUntil: 12,
                },
                {
                    date: this.getDateInDays(20),
                    name: 'Sultan of Selangor\'s Birthday',
                    type: 'holiday',
                    holidayType: 'state',
                    state: 'selangor',
                    description: 'State holiday for Selangor',
                    duration: '1 day',
                    daysUntil: 20,
                }
            ];

            console.log('Mock data loaded successfully');
        },

        /**
         * Get a date X days from today (for mock data)
         */
        getDateInDays(daysFromNow) {
            const date = new Date();
            date.setDate(date.getDate() + daysFromNow);
            return date.toISOString().split('T')[0];
        },

        /**
         * Get event display name
         */
        getEventDisplayName(event) {
            if (event.type === 'holiday') {
                return event.name || 'Holiday';
            }

            // For leave events, use the normalized leave type name
            if (event.leaveType) {
                return normalizeLeaveType(event.leaveType);
            }

            return event.title || 'Leave';
        },

        /**
         * Get event color based on type
         */
        getEventColor(event) {
            if (event.type === 'holiday') {
                // Holiday colors
                if (event.holidayType === 'national') {
                    return '#DC2626'; // National holiday - red
                } else if (event.holidayType === 'state') {
                    return '#7C3AED'; // State holiday - purple
                }
                return '#8B5CF6'; // Default holiday color
            }

            // Leave event - get color from leave type configuration
            if (event.leaveType) {
                return getLeaveTypeColor(event.leaveType);
            }

            // Fallback colors
            if (event.status === 'approved') return '#10B981'; // Green
            if (event.status === 'pending') return '#F59E0B'; // Amber
            if (event.status === 'rejected') return '#EF4444'; // Red

            return '#6B7280'; // Default gray
        },

        /**
         * Get event icon based on type
         */
        getEventIcon(event) {
            if (event.type === 'holiday') {
                return 'flag'; // Holiday icon
            }

            // Leave event - get icon from leave type configuration
            if (event.leaveType) {
                return getLeaveTypeIcon(event.leaveType);
            }

            return 'event'; // Default leave icon
        },

        /**
         * Load upcoming events for the member
         */
        async loadUpcomingEvents() {
            if (this.useMockData) {
                this.loadMockData();
                return;
            }

            if (!this.member || Object.keys(this.member).length === 0) {
                this.error = 'No member data available';
                return;
            }

            this.loading = true;
            this.error = null;

            try {
                const events = await getMemberUpcomingEvents(this.member, {
                    daysAhead: this.daysAhead,
                    state: this.selectedState,
                    includeHolidays: false,
                    includeBirthdays: false
                });

                this.leaveEvents = events;

                if (this.includeHolidays) {
                    await this.loadHolidays();
                }

            } catch (error) {
                console.error('Error loading upcoming events:', error);
                this.error = 'Failed to load upcoming events';
                this.leaveEvents = [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Load Malaysia holidays
         */
        async loadHolidays() {
            if (this.useMockData) {
                return;
            }

            this.holidaysLoading = true;
            this.holidaysError = null;

            try {
                const today = new Date();
                const endDate = new Date(today);
                endDate.setDate(today.getDate() + this.daysAhead);

                const holidays = await getHolidaysWithFallback(
                    today.getFullYear(),
                    this.selectedState || null
                );

                this.holidayEvents = holidays
                    .filter(holiday => {
                        const holidayDate = new Date(holiday.date);
                        return holidayDate >= today && holidayDate <= endDate;
                    })
                    .map(holiday => ({
                        ...holiday,
                        type: 'holiday',
                        holidayType: holiday.type || 'national',
                        duration: '1 day'
                    }))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

            } catch (error) {
                console.error('Error loading Malaysia holidays:', error);
                this.holidaysError = 'Failed to load holidays';
                this.holidayEvents = [];
            } finally {
                this.holidaysLoading = false;
            }
        },

        /**
         * Format date helpers
         */
        formatDate(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('default', { month: 'short', day: 'numeric' });
        },

        formatMonth(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('default', { month: 'short' }).toUpperCase();
        },

        formatMonthShort(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.toLocaleDateString('default', { month: 'short' });
        },

        formatDay(dateString) {
            if (!dateString) return '';
            const date = new Date(dateString);
            return date.getDate();
        },

        formatDateRange(startDate, endDate) {
            if (!startDate || !endDate) return '';
            if (startDate === endDate) return this.formatDate(startDate);

            const start = new Date(startDate);
            const end = new Date(endDate);

            if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
                return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString('default', { month: 'short' })}`;
            }

            return `${this.formatDate(startDate)} - ${this.formatDate(endDate)}`;
        },

        getDaysUntil(dateString) {
            if (!dateString) return 0;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const target = new Date(dateString);
            target.setHours(0, 0, 0, 0);
            const diffTime = target - today;
            return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        },

        /**
         * Modal methods
         */
        openFullListingModal() {
            this.showFullListingModal = true;
            document.body.style.overflow = 'hidden';
        },

        closeFullListingModal() {
            this.showFullListingModal = false;
            document.body.style.overflow = '';
            this.activeTab = 'all';
        },

        /**
         * Event handlers
         */
        selectEvent(event) {
            console.log('Event selected:', event);
            if (event.type === 'holiday') {
                this.$emit('holiday-selected', event);
            } else {
                this.$emit('event-selected', event);
            }
        },

        viewAllUpcoming() {
            this.$emit('view-all-upcoming', {
                events: this.allCombinedEvents,
                member: this.member
            });
        }
    }
};
</script>

<style scoped>
/* Import the generated CSS from leaveTypes */
@import "../../../styles/views/Leave/UpcomingLeaveCard.css";
</style>