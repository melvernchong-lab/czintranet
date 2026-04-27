<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="timeline-question-modal">
      <!-- Close button -->
      <button class="modal-close" @click="handleClose" aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>

      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon">
          <span class="material-symbols-outlined">timeline</span>
        </div>
        <h2 class="header-title">Project Timeline Setup</h2>
        <p class="header-subtitle">You've created project milestones. Would you like to create a timeline now or later?</p>
      </div>

      <!-- Options -->
      <div class="options-container">
        <!-- Create Now Option -->
        <div 
          class="option-card" 
          :class="{ selected: selectedOption === 'now', 'recommended': true }"
          @click="selectOption('now')"
        >
          <div class="option-badge" v-if="true">Recommended</div>
          <div class="option-icon primary">
            <span class="material-symbols-outlined">bolt</span>
          </div>
          <h3 class="option-title">Create Timeline Now</h3>
          <p class="option-description">
            Instantly generate a detailed project timeline with all milestones, tasks, and dependencies automatically organized.
          </p>
          <ul class="option-features">
            <li>
              <span class="material-symbols-outlined">check_circle</span>
              <span>Auto-generate tasks from milestones</span>
            </li>
            <li>
              <span class="material-symbols-outlined">check_circle</span>
              <span>Set up task dependencies automatically</span>
            </li>
            <li>
              <span class="material-symbols-outlined">check_circle</span>
              <span>Calculate project duration instantly</span>
            </li>
            <li>
              <span class="material-symbols-outlined">check_circle</span>
              <span>Ready to edit and customize</span>
            </li>
          </ul>
          <div class="option-action">
            <button class="btn-primary" @click.stop="confirmNow">
              <span class="material-symbols-outlined">auto_awesome</span>
              Create Timeline Now
            </button>
          </div>
        </div>

        <!-- Create Later Option -->
        <div 
          class="option-card" 
          :class="{ selected: selectedOption === 'later' }"
          @click="selectOption('later')"
        >
          <div class="option-icon secondary">
            <span class="material-symbols-outlined">schedule</span>
          </div>
          <h3 class="option-title">Create Later</h3>
          <p class="option-description">
            Save your milestones for now and create the timeline at a more convenient time.
          </p>
          <ul class="option-features">
            <li>
              <span class="material-symbols-outlined">save</span>
              <span>Save milestones to project</span>
            </li>
            <li>
              <span class="material-symbols-outlined">add_comment</span>
              <span>Continue working on other tasks</span>
            </li>
            <li>
              <span class="material-symbols-outlined">notifications</span>
              <span>Get reminder to create timeline later</span>
            </li>
            <li>
              <span class="material-symbols-outlined">edit_note</span>
              <span>Manual timeline creation anytime</span>
            </li>
          </ul>
          <div class="option-action">
            <button class="btn-secondary" @click.stop="confirmLater">
              <span class="material-symbols-outlined">event_busy</span>
              Remind Me Later
            </button>
          </div>
        </div>
      </div>

      <!-- Additional Info -->
      <div class="modal-footer">
        <div class="info-message">
          <span class="material-symbols-outlined">info</span>
          <span>You can always create or edit the timeline later from the project settings.</span>
        </div>
        
        <!-- Don't show again checkbox -->
        <label class="dont-show-again">
          <input type="checkbox" v-model="dontShowAgain" />
          <span>Don't show this again for this project</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from 'vue'

export default {
  name: 'TimelineQuestionModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    projectId: {
      type: [String, Number],
      default: null
    }
  },
  emits: ['close', 'create-now', 'create-later', 'update:dont-show-again'],
  setup(props, { emit }) {
    const selectedOption = ref('now')
    const dontShowAgain = ref(false)

    // Load preference from localStorage if projectId exists
    watch(() => props.visible, (isVisible) => {
      if (isVisible && props.projectId) {
        const storedPreference = localStorage.getItem(`timeline_creation_preference_${props.projectId}`)
        if (storedPreference === 'later') {
          selectedOption.value = 'later'
        } else if (storedPreference === 'now') {
          selectedOption.value = 'now'
        }
      }
    })

    const selectOption = (option) => {
      selectedOption.value = option
    }

    const confirmNow = () => {
      if (dontShowAgain.value && props.projectId) {
        localStorage.setItem(`timeline_creation_preference_${props.projectId}`, 'now')
        emit('update:dont-show-again', { projectId: props.projectId, value: true, choice: 'now' })
      }
      emit('create-now')
      emit('close')
    }

    const confirmLater = () => {
      if (dontShowAgain.value && props.projectId) {
        localStorage.setItem(`timeline_creation_preference_${props.projectId}`, 'later')
        emit('update:dont-show-again', { projectId: props.projectId, value: true, choice: 'later' })
      }
      emit('create-later')
      emit('close')
    }

    const handleClose = () => {
      emit('close')
    }

    return {
      selectedOption,
      dontShowAgain,
      selectOption,
      confirmNow,
      confirmLater,
      handleClose
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.timeline-question-modal {
  background: #ffffff;
  border-radius: 32px;
  max-width: 1100px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: slideUp 0.3s ease;
}

.dark .timeline-question-modal {
  background: #1e293b;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;
}

.dark .modal-close {
  background: #334155;
  color: #e2e8f0;
}

.modal-close:hover {
  background: #e2e8f0;
  transform: rotate(90deg);
}

.dark .modal-close:hover {
  background: #475569;
}

.modal-close .material-symbols-outlined {
  font-size: 20px;
}

.modal-header {
  text-align: center;
  padding: 40px 40px 20px 40px;
  border-bottom: 1px solid #e2e8f0;
}

.dark .modal-header {
  border-bottom-color: #334155;
}

.header-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}

.header-icon .material-symbols-outlined {
  font-size: 32px;
  color: white;
}

.header-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 8px 0;
}

.dark .header-title {
  color: #f1f5f9;
}

.header-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
}

.dark .header-subtitle {
  color: #94a3b8;
}

.options-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 32px 40px;
}

.option-card {
  position: relative;
  padding: 28px;
  border-radius: 24px;
  background: #f8fafc;
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.dark .option-card {
  background: #0f172a;
  border-color: #334155;
}

.option-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  border-color: #6366f1;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(79, 70, 229, 0.02));
}

.option-card.recommended {
  border-color: #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.02));
}

.option-badge {
  position: absolute;
  top: -12px;
  right: 20px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.option-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.option-icon.primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  color: white;
}

.option-icon.secondary {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.option-icon .material-symbols-outlined {
  font-size: 28px;
}

.option-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 12px 0;
}

.dark .option-title {
  color: #f1f5f9;
}

.option-description {
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
  margin: 0 0 20px 0;
}

.dark .option-description {
  color: #94a3b8;
}

.option-features {
  list-style: none;
  padding: 0;
  margin: 0 0 24px 0;
}

.option-features li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  font-size: 13px;
  color: #475569;
}

.dark .option-features li {
  color: #cbd5e1;
}

.option-features li .material-symbols-outlined {
  font-size: 18px;
  color: #10b981;
}

.option-action {
  margin-top: 20px;
}

.btn-primary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  border-radius: 40px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
}

.btn-primary .material-symbols-outlined {
  font-size: 18px;
}

.btn-secondary {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 24px;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  border-radius: 40px;
  color: #475569;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dark .btn-secondary {
  background: #1e293b;
  border-color: #334155;
  color: #94a3b8;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  border-color: #f59e0b;
  color: #f59e0b;
}

.btn-secondary .material-symbols-outlined {
  font-size: 18px;
}

.modal-footer {
  padding: 20px 40px 32px 40px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.dark .modal-footer {
  border-top-color: #334155;
}

.info-message {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #64748b;
}

.dark .info-message {
  color: #94a3b8;
}

.info-message .material-symbols-outlined {
  font-size: 16px;
  color: #6366f1;
}

.dont-show-again {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #475569;
  cursor: pointer;
}

.dark .dont-show-again {
  color: #94a3b8;
}

.dont-show-again input {
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #6366f1;
}

/* Responsive Design */
@media (max-width: 768px) {
  .options-container {
    grid-template-columns: 1fr;
    gap: 20px;
    padding: 24px;
  }

  .modal-header {
    padding: 30px 24px 20px;
  }

  .header-title {
    font-size: 24px;
  }

  .header-subtitle {
    font-size: 14px;
  }

  .option-card {
    padding: 20px;
  }

  .option-title {
    font-size: 20px;
  }

  .modal-footer {
    padding: 20px 24px 28px;
    flex-direction: column;
    align-items: flex-start;
  }

  .info-message {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .timeline-question-modal {
    width: 95%;
    border-radius: 24px;
  }

  .modal-header {
    padding: 24px 20px 16px;
  }

  .header-icon {
    width: 48px;
    height: 48px;
  }

  .header-icon .material-symbols-outlined {
    font-size: 24px;
  }

  .header-title {
    font-size: 20px;
  }

  .options-container {
    padding: 20px;
  }

  .option-icon {
    width: 48px;
    height: 48px;
  }

  .option-icon .material-symbols-outlined {
    font-size: 24px;
  }

  .option-title {
    font-size: 18px;
  }

  .option-features li {
    font-size: 12px;
  }

  .btn-primary,
  .btn-secondary {
    padding: 12px 20px;
    font-size: 13px;
  }

  .modal-footer {
    padding: 16px 20px 24px;
  }
}
</style>