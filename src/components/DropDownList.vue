<!-- CustomDropdown.vue -->
<template>
  <div class="custom-dropdown" ref="dropdownRef">
    <div 
      class="dropdown-header" 
      :class="{ 'active': isOpen, 'has-value': selectedValue }"
      @click="toggleDropdown"
    >
      <span class="dropdown-label" :class="{ 'placeholder': !selectedValue }">
        {{ selectedValue ? selectedLabel : placeholder }}
      </span>
      <span class="material-symbols-outlined dropdown-arrow">
        {{ isOpen ? 'expand_less' : 'expand_more' }}
      </span>
    </div>
    
    <div v-if="isOpen" class="dropdown-panel">
      <div 
        v-for="option in options" 
        :key="option.value"
        class="dropdown-option"
        :class="{ 'selected': selectedValue === option.value }"
        @click="selectOption(option)"
      >
        {{ option.label }}
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue' // Make sure computed is imported

export default {
  name: 'CustomDropdown',
  inheritAttrs: false,
  props: {
    modelValue: {
      type: String,
      default: ''
    },
    options: {
      type: Array,
      required: true
    },
    placeholder: {
      type: String,
      default: 'Select'
    }
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const isOpen = ref(false)
    const dropdownRef = ref(null)
    
    const selectedValue = computed(() => props.modelValue)
    const selectedLabel = computed(() => {
      const option = props.options.find(opt => opt.value === selectedValue.value)
      return option ? option.label : ''
    })
    
    const toggleDropdown = () => {
      isOpen.value = !isOpen.value
    }
    
    const selectOption = (option) => {
      emit('update:modelValue', option.value)
      isOpen.value = false
    }
    
    const handleClickOutside = (event) => {
      if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
        isOpen.value = false
      }
    }
    
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
    })
    
    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
    })
    
    return {
      isOpen,
      dropdownRef,
      selectedValue,
      selectedLabel,
      toggleDropdown,
      selectOption
    }
  }
}
</script>

<style scoped>
@import '../styles/shared/dropdownlist.css';
</style>