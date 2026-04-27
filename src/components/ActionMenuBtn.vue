<template>
  <div class="action-menu-wrapper">
    <button
      class="action-menu-trigger"
      :class="{
        'action-menu-trigger--disabled': disabled,
        'action-menu-trigger--open': isOpen
      }"
      @click="toggleMenu"
      @keydown.esc="closeMenu"
      @keydown.enter="toggleMenu"
      @keydown.space="toggleMenu"
      :disabled="disabled"
      :aria-label="computedAriaLabel"
      aria-haspopup="true"
      :aria-expanded="isOpen"
      ref="triggerRef"
    >
      <span class="material-symbols-outlined">more_vert</span>
    </button>
    
    <transition name="action-menu">
      <div
        v-if="isOpen"
        class="action-menu-dropdown"
        :style="dropdownStyle"
        ref="dropdownRef"
        v-click-outside="closeMenu"
      >
        <div class="action-menu-items">
          <!-- Slot for custom dropdown content -->
          <slot name="dropdown">
            <!-- Default dropdown items -->
            <div
              v-for="(item, index) in items"
              :key="index"
              class="action-menu-item"
              :class="{
                'action-menu-item--danger': item.danger,
                'action-menu-item--disabled': item.disabled,
                'action-menu-item--divider': item.divider,
                'action-menu-item--selected': item.selected
              }"
              @click="handleItemClick(item)"
              @keydown.enter="handleItemClick(item)"
              @keydown.space="handleItemClick(item)"
              :tabindex="item.disabled ? -1 : 0"
              :aria-label="item.label"
              :aria-disabled="item.disabled"
              role="menuitem"
            >
              <span v-if="item.icon" class="action-menu-item-icon">
                <span class="material-symbols-outlined">{{ item.icon }}</span>
              </span>
              <span class="action-menu-item-label">{{ item.label }}</span>
              <span v-if="item.hint" class="action-menu-item-hint">{{ item.hint }}</span>
              <span v-if="item.selected" class="action-menu-item-check">
                <span class="material-symbols-outlined">check</span>
              </span>
            </div>
          </slot>
          
          <!-- Show empty state if no items -->
          <div v-if="!items.length && !$slots.dropdown" class="action-menu-empty">
            No actions available
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'ActionMenuButton',
  props: {
    // Menu items configuration
    items: {
      type: Array,
      default: () => [],
      validator: (items) => {
        return items.every(item => {
          // Validate item structure
          const isValid = typeof item === 'object' && item !== null;
          if (!isValid) return false;
          
          // Check for required properties
          if (item.divider) return true; // Divider doesn't need label
          
          // Normal items need a label
          return typeof item.label === 'string' || item.action;
        });
      }
    },
    
    // Component state
    disabled: {
      type: Boolean,
      default: false
    },
    
    // Accessibility
    ariaLabel: {
      type: String,
      default: ''
    },
    
    // Context data to pass with actions
    contextData: {
      type: [Object, Array, String, Number, Boolean],
      default: () => ({})
    },
    
    // Dropdown positioning
    dropdownPosition: {
      type: String,
      default: 'bottom-end', // 'bottom-start', 'bottom-end', 'top-start', 'top-end'
      validator: (value) => ['bottom-start', 'bottom-end', 'top-start', 'top-end'].includes(value)
    },
    
    // Dropdown width
    dropdownWidth: {
      type: String,
      default: 'auto'
    },
    
    // Max height for scrollable dropdown
    dropdownMaxHeight: {
      type: String,
      default: 'none'
    },
    
    // Custom classes
    triggerClass: {
      type: String,
      default: ''
    },
    
    // Auto close after action
    autoClose: {
      type: Boolean,
      default: true
    }
  },
  
  directives: {
    'click-outside': {
      bind(el, binding, vnode) {
        el.clickOutsideEvent = function(event) {
          if (!(el === event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event);
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unbind(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  },
  
  data() {
    return {
      isOpen: false,
      dropdownStyle: {}
    };
  },
  
  computed: {
    computedAriaLabel() {
      return this.ariaLabel || 'Actions menu';
    },
    
    hasCustomDropdown() {
      return !!this.$slots.dropdown;
    }
  },
  
  watch: {
    isOpen(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          this.positionDropdown();
          this.focusFirstItem();
        });
      }
    }
  },
  
  methods: {
    // Toggle dropdown visibility
    toggleMenu() {
      if (this.disabled) return;
      this.isOpen = !this.isOpen;
    },
    
    // Close dropdown
    closeMenu() {
      if (this.isOpen) {
        this.isOpen = false;
      }
    },
    
    // Handle item click
    handleItemClick(item) {
      if (item.disabled || item.divider) return;
      
      // Generate action name if not provided
      const actionName = item.action || this.generateActionName(item.label);
      
      // Emit action event with all relevant data
      this.$emit('action-click', {
        action: actionName,
        item: item,
        context: this.contextData,
        originalEvent: event,
        timestamp: Date.now()
      });
      
      // Also emit item-click for backward compatibility
      this.$emit('item-click', item, this.contextData);
      
      // Close dropdown if autoClose is enabled and item doesn't have keepOpen flag
      if (this.autoClose && !item.keepOpen) {
        this.closeMenu();
      }
      
      // Focus back on trigger after action
      this.$nextTick(() => {
        if (this.$refs.triggerRef) {
          this.$refs.triggerRef.focus();
        }
      });
    },
    
    // Generate action name from label
    generateActionName(label) {
      return label
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '_')
        .trim();
    },
    
    // Position dropdown based on position prop
    positionDropdown() {
      if (!this.$refs.triggerRef || !this.$refs.dropdownRef) return;
      
      const trigger = this.$refs.triggerRef;
      const dropdown = this.$refs.dropdownRef;
      const triggerRect = trigger.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      let style = {
        '--dropdown-width': this.dropdownWidth,
        '--dropdown-max-height': this.dropdownMaxHeight,
        position: 'absolute'
      };
      
      // Calculate position based on dropdownPosition prop
      switch (this.dropdownPosition) {
        case 'bottom-start':
          style.top = `${triggerRect.bottom + scrollY}px`;
          style.left = `${triggerRect.left + scrollX}px`;
          break;
          
        case 'bottom-end':
          style.top = `${triggerRect.bottom + scrollY}px`;
          style.right = `${viewportWidth - triggerRect.right - scrollX}px`;
          break;
          
        case 'top-start':
          style.bottom = `${viewportHeight - triggerRect.top + scrollY}px`;
          style.left = `${triggerRect.left + scrollX}px`;
          break;
          
        case 'top-end':
          style.bottom = `${viewportHeight - triggerRect.top + scrollY}px`;
          style.right = `${viewportWidth - triggerRect.right - scrollX}px`;
          break;
          
        default:
          // Default to bottom-end
          style.top = `${triggerRect.bottom + scrollY}px`;
          style.right = `${viewportWidth - triggerRect.right - scrollX}px`;
      }
      
      // Ensure dropdown stays within viewport bounds
      this.adjustDropdownPosition(style, triggerRect, dropdownRect, viewportWidth, viewportHeight, scrollY, scrollX);
      
      this.dropdownStyle = style;
    },
    
    // Adjust dropdown position to stay within viewport
    adjustDropdownPosition(style, triggerRect, dropdownRect, viewportWidth, viewportHeight, scrollY, scrollX) {
      // Check if dropdown would overflow viewport
      let needsAdjustment = false;
      
      if (this.dropdownPosition.includes('bottom') && 
          triggerRect.bottom + dropdownRect.height > viewportHeight) {
        // Would overflow bottom, move to top
        style.top = null;
        style.bottom = `${viewportHeight - triggerRect.top + scrollY}px`;
        needsAdjustment = true;
      }
      
      if (this.dropdownPosition.includes('top') && 
          triggerRect.top - dropdownRect.height < 0) {
        // Would overflow top, move to bottom
        style.bottom = null;
        style.top = `${triggerRect.bottom + scrollY}px`;
        needsAdjustment = true;
      }
      
      if (this.dropdownPosition.includes('end') && 
          triggerRect.right - dropdownRect.width < 0) {
        // Would overflow left, move to start
        style.right = null;
        style.left = `${triggerRect.left + scrollX}px`;
        needsAdjustment = true;
      }
      
      if (this.dropdownPosition.includes('start') && 
          triggerRect.left + dropdownRect.width > viewportWidth) {
        // Would overflow right, move to end
        style.left = null;
        style.right = `${viewportWidth - triggerRect.right - scrollX}px`;
        needsAdjustment = true;
      }
      
      return needsAdjustment;
    },
    
    // Focus first non-disabled item when dropdown opens
    focusFirstItem() {
      if (!this.$refs.dropdownRef) return;
      
      const firstItem = this.$refs.dropdownRef.querySelector('.action-menu-item:not(.action-menu-item--disabled)');
      if (firstItem) {
        firstItem.focus();
      }
    },
    
    // Public method to open dropdown programmatically
    open() {
      if (!this.disabled) {
        this.isOpen = true;
      }
    },
    
    // Public method to close dropdown programmatically
    close() {
      this.isOpen = false;
    },
    
    // Public method to toggle dropdown programmatically
    toggle() {
      this.toggleMenu();
    }
  },
  
  mounted() {
    // Close dropdown on window resize
    window.addEventListener('resize', this.closeMenu);
    
    // Close dropdown on Escape key press
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.isOpen) {
        this.closeMenu();
        if (this.$refs.triggerRef) {
          this.$refs.triggerRef.focus();
        }
      }
    });
  },
  
  beforeDestroy() {
    window.removeEventListener('resize', this.closeMenu);
  }
};
</script>

<style scoped>
/* Trigger Button */
.action-menu-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
  padding: 0;
  font-family: inherit;
  font-size: inherit;
  outline: none;
}

.action-menu-trigger:hover:not(.action-menu-trigger--disabled) {
  background: #f1f5f9;
  color: #334155;
}

.action-menu-trigger:active:not(.action-menu-trigger--disabled) {
  background: #e2e8f0;
  transform: scale(0.98);
}

.action-menu-trigger:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

.action-menu-trigger--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-menu-trigger--open {
  background: #e2e8f0;
  color: #334155;
}

.action-menu-trigger .material-symbols-outlined {
  font-size: 20px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  display: block;
  line-height: 1;
}

/* Dropdown */
.action-menu-dropdown {
  position: absolute;
  z-index: 1000;
  min-width: 180px;
  width: var(--dropdown-width, auto);
  max-width: 320px;
  max-height: var(--dropdown-max-height, none);
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 5px 10px rgba(0, 0, 0, 0.05);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  animation: dropdown-appear 0.15s ease-out;
}

.action-menu-items {
  padding: 4px 0;
  overflow-y: auto;
  max-height: inherit;
}

/* Dropdown Items */
.action-menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  color: #334155;
  font-size: 14px;
  font-weight: 400;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
  white-space: nowrap;
  outline: none;
  font-family: inherit;
  position: relative;
}

.action-menu-item:hover:not(.action-menu-item--disabled):not(.action-menu-item--divider) {
  background: #f1f5f9;
  color: #1e293b;
}

.action-menu-item:focus-visible:not(.action-menu-item--disabled) {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  z-index: 1;
}

.action-menu-item--danger {
  color: #dc2626;
}

.action-menu-item--danger:hover:not(.action-menu-item--disabled) {
  background: #fee2e2;
  color: #b91c1c;
}

.action-menu-item--disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.action-menu-item--divider {
  height: 1px;
  background: #e2e8f0;
  margin: 4px 0;
  padding: 0;
  pointer-events: none;
  min-height: 1px;
}

.action-menu-item--selected {
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 500;
}

.action-menu-item--selected:hover {
  background: #dbeafe;
}

/* Icons */
.action-menu-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 18px;
  color: inherit;
  flex-shrink: 0;
}

.action-menu-item-icon .material-symbols-outlined {
  font-size: 18px;
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20;
  display: block;
  line-height: 1;
}

.action-menu-item-label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: left;
}

.action-menu-item-hint {
  font-size: 12px;
  color: #94a3b8;
  margin-left: 8px;
  flex-shrink: 0;
}

.action-menu-item-check {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  color: #3b82f6;
  flex-shrink: 0;
}

.action-menu-item-check .material-symbols-outlined {
  font-size: 16px;
  font-variation-settings: 'FILL' 1;
}

/* Empty State */
.action-menu-empty {
  padding: 24px 16px;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
  font-style: italic;
}

/* Animation */
.action-menu-enter-active,
.action-menu-leave-active {
  transition: all 0.15s ease;
}

.action-menu-enter-from,
.action-menu-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

@keyframes dropdown-appear {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

</style>