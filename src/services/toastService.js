import { useToast } from 'vue-toastification'

class ToastService {
  constructor() {
    this.toast = useToast()
  }

  // Success toast
  success(message, options = {}) {
    return this.toast.success(message, {
      icon: '✅',
      timeout: 3000,
      ...options
    })
  }

  // Error toast
  error(message, options = {}) {
    return this.toast.error(message, {
      icon: '❌',
      timeout: 5000,
      ...options
    })
  }

  // Warning toast
  warning(message, options = {}) {
    return this.toast.warning(message, {
      icon: '⚠️',
      timeout: 4000,
      ...options
    })
  }

  // Info toast
  info(message, options = {}) {
    return this.toast.info(message, {
      icon: 'ℹ️',
      timeout: 3000,
      ...options
    })
  }

  // Project-specific toasts
  projectCreated(projectName) {
    return this.success(`Project "${projectName}" created successfully`, {
      timeout: 4000
    })
  }

  projectUpdated(projectName) {
    return this.success(`Project "${projectName}" updated successfully`, {
      timeout: 4000
    })
  }

  projectDeleted(projectName) {
    return this.info(`Project "${projectName}" deleted`, {
      timeout: 3000
    })
  }

  milestoneReached(projectName, milestone) {
    return this.success(`Milestone "${milestone}" reached for "${projectName}"`, {
      timeout: 5000
    })
  }

  projectAtRisk(projectName) {
    return this.warning(`Project "${projectName}" is at risk`, {
      timeout: 6000
    })
  }

  // Loading toast
  loading(message = 'Loading...') {
    return this.info(message, {
      timeout: false, // Doesn't auto-close
      closeButton: false
    })
  }

  // Dismiss toast
  dismiss(id) {
    this.toast.dismiss(id)
  }

  // Clear all toasts
  clear() {
    this.toast.clear()
  }

  // Promise toast
  async promise(promise, {
    pending = 'Loading...',
    success = 'Success!',
    error = 'An error occurred'
  }) {
    return this.toast.promise(promise, {
      pending,
      success,
      error
    })
  }
}

// Export singleton instance
export const toastService = new ToastService()

// Export composable for Vue components
export function useToastService() {
  return toastService
}