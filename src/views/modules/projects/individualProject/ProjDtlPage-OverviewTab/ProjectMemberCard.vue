<template>
  <div class="team-members-card">
    <div class="card-header">
      <h3 class="card-title">Team Members</h3>
    </div>
    <div class="card-content">
      <!-- Team List with conditional height -->
      <div class="team-list" :class="{ 'collapsed': !showAllMembers && hasMoreMembers }">
        <div v-for="member in displayedMembers" :key="member.id" class="team-member-item">
          <div class="member-avatar" :style="{ backgroundColor: member.avatarColor }">
            {{ member.initials }}
          </div>
          <div class="member-details">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-role">{{ member.role }}</div>
          </div>
          <div class="member-status online" :title="member.status || 'Online'"></div>
        </div>
        <div v-if="teamMembers.length === 0" class="empty-team">
          <span class="material-symbols-outlined">group_off</span>
          <p>No team members assigned</p>
        </div>
      </div>
      
      <!-- More Members Indicator (when collapsed) -->
      <button v-if="hasMoreMembers" class="view-more-btn" @click="toggleViewMore" :title="showAllMembers ? '' : 'View More'">
        <template v-if="!showAllMembers">
          <div class="more-indicator">
            <div class="indicator-content">
              <span class="material-symbols-outlined">more_horiz</span>
              <span>{{ remainingMembersCount }} more member{{ remainingMembersCount !== 1 ? 's' : '' }}</span>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="show-less-indicator">
            <span class="material-symbols-outlined">expand_less</span>
            <span>Show Less</span>
          </div>
        </template>
      </button>

      <button class="manage-permissions-btn" @click="$emit('edit')">
        <span class="material-symbols-outlined">manage_accounts</span>
        Manage Permissions
      </button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TeamMembersCard',
  props: {
    teamMembers: {
      type: Array,
      default: () => []
    },
    defaultVisibleCount: {
      type: Number,
      default: 3
    }
  },
  emits: ['edit'],
  setup(props) {
    const showAllMembers = ref(false)
    
    const hasMoreMembers = computed(() => {
      return props.teamMembers.length > props.defaultVisibleCount
    })
    
    const remainingMembersCount = computed(() => {
      return props.teamMembers.length - props.defaultVisibleCount
    })
    
    const displayedMembers = computed(() => {
      if (showAllMembers.value || !hasMoreMembers.value) {
        return props.teamMembers
      }
      return props.teamMembers.slice(0, props.defaultVisibleCount)
    })
    
    const isExpanded = computed(() => showAllMembers.value)
    
    const toggleViewMore = () => {
      showAllMembers.value = !showAllMembers.value
    }
    
    return {
      showAllMembers,
      hasMoreMembers,
      remainingMembersCount,
      displayedMembers,
      isExpanded,
      toggleViewMore
    }
  }
}
</script>

<style scoped>
/* ============================================
   TEAM MEMBERS CARD - WITH VIEW MORE BUTTON
   ============================================ */
.team-members-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dark .team-members-card {
  background: #1e293b;
  border-color: #334155;
}

/* Card Header */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 12px;
}

.dark .card-header {
  border-bottom-color: #334155;
}

.card-title {
  font-size: 18px;
  font-weight: 900;
  color: #1e293b;
  margin-bottom: 7px;
}

.dark .card-title {
  color: #f1f5f9;
}

/* Card Content */
.card-content {
  padding: 24px;
  position: relative;
}

/* Team List */
.team-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  overflow: hidden;
}

/* Collapsed state - limited height */
.team-list.collapsed {
  max-height: 280px;
  overflow-y: auto;
  position: relative;
}

/* Custom scrollbar for collapsed list */
.team-list.collapsed::-webkit-scrollbar {
  width: 4px;
}

.team-list.collapsed::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.team-list.collapsed::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.dark .team-list.collapsed::-webkit-scrollbar-track {
  background: #1e293b;
}

.dark .team-list.collapsed::-webkit-scrollbar-thumb {
  background: #334155;
}

/* Team Member Item */
.team-member-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 12px;
  transition: all 0.2s;
  width: 100%;
}

.dark .team-member-item {
  background: #0f172a;
}

.team-member-item:hover {
  transform: translateX(4px);
  background: #f1f5f9;
}

.dark .team-member-item:hover {
  background: #1e293b;
}

/* Member Avatar */
.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.2s;
}

/* Member Details */
.member-details {
  flex: 1;
  min-width: 0;
}

.member-name {
  font-weight: 700;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dark .member-name {
  color: #f1f5f9;
}

.member-role {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Member Status Indicator */
.member-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  flex-shrink: 0;
}

.member-status.online {
  background: #10b981;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.member-status.away {
  background: #f59e0b;
  box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
}

.member-status.busy {
  background: #ef4444;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

/* More Members Indicator */
.more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  margin-top: -8px;
  margin-bottom: 20px;
  border-radius: 12px;
  transition: all 0.2s;
  position: relative;
}

.dark .more-indicator {
  background: linear-gradient(180deg, transparent 0%, rgba(15, 23, 42, 0.9) 20%, #0f172a 100%);
}

.indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.dark .indicator-content {
  background: #1e293b;
  color: #818cf8;
}

.indicator-content .material-symbols-outlined {
  font-size: 16px;
}

/* Empty State */
.empty-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  gap: 12px;
  color: #94a3b8;
}

.empty-team .material-symbols-outlined {
  font-size: 48px;
  opacity: 0.5;
}

.empty-team p {
  font-size: 13px;
  margin: 0;
}

/* View More Button */
.view-more-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s;
  position: relative
}

.view-more-btn::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: white;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.1s, visibility 0.1s;
  pointer-events: none;
  margin-bottom: 8px;
}


/* Manage Permissions Button */
.manage-permissions-btn,
.show-less-indicator {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6366f1;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 10px;
}

.dark .manage-permissions-btn
.dark .show-less-indicator {
  border-color: #334155;
  color: #94a3b8;
}

.manage-permissions-btn .material-symbols-outlined {
  font-size: 16px;
}

.manage-permissions-btn:hover,
.show-less-indicator:hover {
  background: #f8fafc;
  border-color: #6366f1;
  color: #6366f1;
}

.dark .manage-permissions-btn:hover
.dark .show-less-indicator:hover {
  background: #0f172a;
}

/* ============================================
   RESPONSIVE BREAKPOINTS
   ============================================ */

/* Tablet (768px - 1024px) */
@media (max-width: 992px) {
  .card-header {
    padding: 16px 20px;
  }
  
  .card-content {
    padding: 20px;
  }
  
  .team-list {
    gap: 10px;
  }
  
  .team-member-item {
    padding: 10px;
  }
  
  .team-list.collapsed {
    max-height: 260px;
  }
}

/* Mobile Landscape (576px - 768px) */
@media (max-width: 768px) {
  .member-avatar {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
  
  .member-name {
    font-size: 13px;
  }
  
  .member-role {
    font-size: 10px;
  }
  
  .team-list.collapsed {
    max-height: 240px;
  }
  
  .indicator-content {
    padding: 4px 12px;
    font-size: 11px;
  }
}

/* Mobile Portrait (320px - 576px) */
@media (max-width: 576px) {
  .card-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
  }
  
  .card-title {
    font-size: 16px;
    margin-bottom: 0;
  }
  
  .view-more-btn {
    padding: 4px 10px;
    font-size: 11px;
  }
  
  .view-more-btn .material-symbols-outlined {
    font-size: 14px;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .team-list {
    gap: 8px;
  }
  
  .team-list.collapsed {
    max-height: 220px;
  }
  
  .team-member-item {
    padding: 10px;
    gap: 10px;
  }
  
  .member-avatar {
    width: 32px;
    height: 32px;
    font-size: 11px;
  }
  
  .member-name {
    font-size: 12px;
  }
  
  .member-role {
    font-size: 9px;
  }
  
  .manage-permissions-btn {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .manage-permissions-btn .material-symbols-outlined {
    font-size: 14px;
  }
  
  .empty-team .material-symbols-outlined {
    font-size: 36px;
  }
  
  .empty-team p {
    font-size: 12px;
  }
  
  .indicator-content {
    padding: 4px 10px;
    font-size: 10px;
  }
  
  .indicator-content .material-symbols-outlined {
    font-size: 14px;
  }
}

/* Small Mobile (up to 375px) */
@media (max-width: 375px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .view-more-btn {
    width: 100%;
    justify-content: center;
  }
  
  .team-member-item {
    flex-wrap: wrap;
    justify-content: space-between;
  }
  
  .member-details {
    flex: 1;
    min-width: auto;
  }
  
  .member-name {
    white-space: normal;
    word-break: break-word;
  }
  
  .member-role {
    white-space: normal;
    word-break: break-word;
  }
  
  .team-list.collapsed {
    max-height: 200px;
  }
}

/* Touch Device Optimizations */
@media (hover: none) and (pointer: coarse) {
  .view-more-btn,
  .manage-permissions-btn {
    min-height: 40px;
  }
  
  .view-more-btn .material-symbols-outlined,
  .manage-permissions-btn .material-symbols-outlined {
    font-size: 18px;
  }
  
  .team-member-item {
    cursor: pointer;
  }
  
  .more-indicator {
    min-height: 44px;
  }
}

/* Desktop Large Screens (above 1440px) */
@media (min-width: 1440px) {
  .team-list {
    gap: 16px;
  }
  
  .team-list.collapsed {
    max-height: 320px;
  }
  
  .team-member-item {
    padding: 14px;
  }
  
  .member-avatar {
    width: 44px;
    height: 44px;
    font-size: 16px;
  }
  
  .member-name {
    font-size: 15px;
  }
  
  .member-role {
    font-size: 11px;
  }
}

/* Print Styles */
@media print {
  .view-more-btn,
  .manage-permissions-btn,
  .more-indicator {
    display: none;
  }
  
  .team-members-card {
    border: 1px solid #ccc;
    break-inside: avoid;
  }
  
  .team-list {
    max-height: none !important;
    overflow: visible !important;
  }
  
  .team-member-item {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
</style>