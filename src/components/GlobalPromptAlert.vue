<template>
  <!-- Alert Modal -->
  <div v-if="showAlert" class="prmpt-modal-overlay" @click.self="handleOverlayClick('alert')">
    <div class="prmpt-modal-container" @click.stop>
      <div class="prmpt-modal-header" :class="alertType">
        <span class="material-symbols-outlined prmpt-modal-icon">
          {{ computedAlertIcon }}
        </span>
        <h3 class="prmpt-modal-title">{{ alertTitle }}</h3>
      </div>
      <div class="prmpt-modal-body">
        <p v-html="alertMessage"></p>
      </div>
      <div class="prmpt-modal-footer">
        <button v-if="alertType === 'confirm'" @click="cancelAlert" class="prmpt-modal-btn prmpt-cancel-btn">
          {{ cancelText }}
        </button>
        <button @click="confirmAlert" class="prmpt-modal-btn prmpt-confirm-btn" :class="alertType">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>

  <!-- Prompt Modal -->
  <div v-if="showPrompt" class="prmpt-modal-overlay" @click.self="handleOverlayClick('prompt')">
    <div class="prmpt-modal-container" @click.stop>
      <div class="prmpt-modal-header">
        <span class="material-symbols-outlined prmpt-modal-icon">edit_note</span>
        <h3 class="prmpt-modal-title">{{ promptTitle }}</h3>
        <button class="prmpt-modal-close" @click="cancelPrompt" title="Close">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div class="prmpt-modal-body">
        <p class="prompt-message">{{ promptMessage }}</p>
        <input v-model="promptInput" type="text" class="prompt-input" :placeholder="promptPlaceholder"
          @keyup.enter="submitPrompt" ref="promptInputRef">
      </div>
      <div class="prmpt-modal-footer">
        <button @click="cancelPrompt" class="prmpt-modal-btn prmpt-cancel-btn">
          {{ promptCancelText }}
        </button>
        <button @click="submitPrompt" class="prmpt-modal-btn prmpt-confirm-btn" :disabled="!promptInput.trim()">
          {{ promptConfirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';

// Alert state
const showAlert = ref(false);
const alertTitle = ref('');
const alertMessage = ref('');
const alertType = ref('info');  
const alertIcon = ref('');
const confirmText = ref('OK');
const cancelText = ref('Cancel');

// Prompt state
const showPrompt = ref(false);
const promptTitle = ref('');
const promptMessage = ref('');
const promptInput = ref('');
const promptPlaceholder = ref('');
const promptConfirmText = ref('OK');
const promptCancelText = ref('Cancel');

// Modal options
const allowOutsideClick = ref(true);
const allowEscapeKey = ref(true);

// Resolve handlers
let alertResolve = null;
let promptResolve = null;

// Computed icon based on type
const computedAlertIcon = computed(() => {
  if (alertIcon.value) return alertIcon.value;
  
  const icons = {
    info: 'info',
    success: 'check_circle',
    warning: 'warning',
    error: 'error',
    confirm: 'help'
  };
  return icons[alertType.value] || 'info';
});

// Alert methods
const showAlertModal = (title, message, type = 'info', options = {}) => {
  return new Promise((resolve) => {
    showAlert.value = true;
    alertTitle.value = title;
    alertMessage.value = message;
    alertType.value = type;
    alertIcon.value = options.icon || '';
    confirmText.value = options.confirmText || 'OK';
    cancelText.value = options.cancelText || 'Cancel';
    allowOutsideClick.value = options.allowOutsideClick !== undefined ? options.allowOutsideClick : true;
    allowEscapeKey.value = options.allowEscapeKey !== undefined ? options.allowEscapeKey : true;
    alertResolve = resolve;
  });
};

const confirmAlert = () => {
  showAlert.value = false;
  if (alertResolve) alertResolve(true);
  resetAlert();
};

const cancelAlert = () => {
  showAlert.value = false;
  if (alertResolve) alertResolve(false);
  resetAlert();
};

const closeAlert = () => {
  if (alertType.value !== 'confirm') {
    confirmAlert();
  } else {
    cancelAlert();
  }
};

const resetAlert = () => {
  setTimeout(() => {
    alertTitle.value = '';
    alertMessage.value = '';
    alertType.value = 'info';
    alertIcon.value = '';
    confirmText.value = 'OK';
    cancelText.value = 'Cancel';
    allowOutsideClick.value = true;
    allowEscapeKey.value = true;
    alertResolve = null;
  }, 300);
};

// Prompt methods
const showPromptModal = (title, message, defaultValue = '', options = {}) => {
  return new Promise((resolve) => {
    showPrompt.value = true;
    promptTitle.value = title;
    promptMessage.value = message;
    promptInput.value = defaultValue;
    promptPlaceholder.value = options.placeholder || '';
    promptConfirmText.value = options.confirmText || 'OK';
    promptCancelText.value = options.cancelText || 'Cancel';
    allowOutsideClick.value = options.allowOutsideClick !== undefined ? options.allowOutsideClick : false;
    allowEscapeKey.value = options.allowEscapeKey !== undefined ? options.allowEscapeKey : true;
    promptResolve = resolve;
    
    nextTick(() => {
      if (promptInputRef.value) {
        promptInputRef.value.focus();
        promptInputRef.value.select();
      }
    });
  });
};

const submitPrompt = () => {
  if (!promptInput.value.trim()) return;
  showPrompt.value = false;
  if (promptResolve) promptResolve(promptInput.value.trim());
  resetPrompt();
};

const cancelPrompt = () => {
  showPrompt.value = false;
  if (promptResolve) promptResolve(null);
  resetPrompt();
};

const closePrompt = () => {
  cancelPrompt();
};

const resetPrompt = () => {
  setTimeout(() => {
    promptTitle.value = '';
    promptMessage.value = '';
    promptInput.value = '';
    promptPlaceholder.value = '';
    promptConfirmText.value = 'OK';
    promptCancelText.value = 'Cancel';
    allowOutsideClick = false;
    allowEscapeKey = true;
    promptResolve = null;
  }, 300);
};

// Handle overlay click
const handleOverlayClick = (type) => {
  if (type === 'alert' && allowOutsideClick.value) {
    if (alertType.value === 'confirm') {
      cancelAlert();
    } else {
      closeAlert();
    }
  } else if (type === 'prompt' && allowOutsideClick.value) {
    cancelPrompt();
  }
};

// Handle ESC key press
const handleEscapeKey = (event) => {
  if (event.key === 'Escape') {
    if (showAlert.value && allowEscapeKey.value) {
      event.preventDefault();
      if (alertType.value === 'confirm') {
        cancelAlert();
      } else {
        closeAlert();
      }
    } else if (showPrompt.value && allowEscapeKey.value) {
      event.preventDefault();
      cancelPrompt();
    }
  }
};

// Watch for prompt visibility to focus input
watch(showPrompt, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (promptInputRef.value) {
        promptInputRef.value.focus();
      }
    });
  }
});

// Setup keyboard event listeners
onMounted(() => {
  window.addEventListener('keydown', handleEscapeKey);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscapeKey);
});

// Expose methods globally with options
const globalModal = {
  // Alert types
  alert: (message, title = 'Alert', options = {}) =>
    showAlertModal(title, message, 'info', {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : true,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    }),

  success: (message, title = 'Success', options = {}) =>
    showAlertModal(title, message, 'success', {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : true,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    }),

  warning: (message, title = 'Warning', options = {}) =>
    showAlertModal(title, message, 'warning', {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : true,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    }),

  error: (message, title = 'Error', options = {}) =>
    showAlertModal(title, message, 'error', {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : true,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    }),

  confirm: (message, title = 'Confirm', options = {}) =>
    showAlertModal(title, message, 'confirm', {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : true,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    }),

  prompt: (message, title = 'Input', defaultValue = '', options = {}) =>
    showPromptModal(title, message, defaultValue, {
      allowOutsideClick: options.allowOutsideClick !== undefined ? options.allowOutsideClick : false,
      allowEscapeKey: options.allowEscapeKey !== undefined ? options.allowEscapeKey : true,
      ...options
    })
};

// Make available globally
onMounted(() => {
  window.globalModal = globalModal;
});

// Expose to template and parent components
defineExpose({
  showAlert,
  showPrompt,
  alertTitle,
  alertMessage,
  alertType,
  computedAlertIcon,
  confirmText,
  cancelText,
  promptTitle,
  promptMessage,
  promptInput,
  promptPlaceholder,
  promptConfirmText,
  promptCancelText,
  confirmAlert,
  cancelAlert,
  submitPrompt,
  cancelPrompt,
  closeAlert,
  closePrompt,
  handleOverlayClick,
  handleEscapeKey
});
</script>