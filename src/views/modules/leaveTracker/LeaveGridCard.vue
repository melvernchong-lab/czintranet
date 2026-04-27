<template>
  <div class="leave-card" :class="`card-${type.toLowerCase()}`">
    <div class="leave-header">
      <div class="leave-icon" :class="type.toLowerCase()">
        <span class="material-symbols-outlined">{{ getIcon() }}</span>
      </div>
      <span class="leave-label">{{ getLabel() }}</span>
    </div>
    <div class="leave-content">
      <p class="leave-value">{{ getValue() }}</p>
      <p class="leave-detail">{{ detail }}</p>
    </div>
    <div class="leave-progress-bar">
      <div class="leave-progress-fill" 
           :class="type.toLowerCase()" 
           :style="{ width: percentage + '%' }"></div>
    </div>
  </div>
</template>

<script>
import { getLeaveTypeIcon, normalizeLeaveType } from '@/utils/leaveTypes';

export default {
  name: 'LeaveGridCard',
  props: {
    type: {
      type: String,
      required: true,
      validator: (value) => ['AL', 'OS', 'CL', 'MC', 'WFH', 'EL', 'BF', 'ML', 'PL'].includes(value)
    },
    data: {
      type: Object,
      required: true
    },
    detail: {
      type: String,
      required: true
    },
    percentage: {
      type: Number,
      default: 0
    }
  },
  methods: {
    getIcon() {
      return getLeaveTypeIcon(this.type);
    },
    getLabel() {
      return normalizeLeaveType(this.type);
    },
    getValue() {
      if (this.type === 'AL') {
        return `${this.data.balance} / ${this.data.total} days`;
      } else if (this.type === 'MC') {
        return `${this.data.taken} / ${this.data.limit || 10} days`;
      } else if (this.type === 'OS') {
        return `${this.data.logged || 42} Logged`;
      } else if (this.type === 'CL') {
        return `${this.data.used || 0} / ${this.data.limit || 2} days`;
      }
      return this.data.value || '0 days';
    }
  }
};
</script>

<style scoped>
@import "../../../styles/views/Leave/LeaveGridCard.css";
</style>