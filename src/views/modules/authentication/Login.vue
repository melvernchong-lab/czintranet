<template>
  <div class="login-container">
    <!-- Split Screen Container -->
    <div class="login-split-screen">
      <!-- Left Side: Visual Branding (Hidden on mobile) -->
      <div class="login-branding-panel">
        <!-- Background Image with Overlay -->
        <div class="login-background-image"
          :style="{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBYWWFGDkLgdhqRFHfuNwx339lfuvA4w-_kupsTNpk15XHhy_Ip02BZKkN5UQ0ElK6MLvfK6zC_77gxSLF562yzVxCSXC5MYVWom7C4UXI8r67Ww5ABRqCAI7C5fm2TJIIjfo8-b_mP_aM9zg7cou4awD_0tKasi89KkFrqxlQE97d6xP7UbMb6R_GViL5vIUlvnV-hYyMJoERSe9__D_pTfegvp-fQMAMgSEeBg7zctGFC3nQgnPQ6mcHvC6Ib6q7LQRF8Y9qW15o')` }">
        </div>
        <div class="login-branding-overlay"></div>

        <!-- Branding Content -->
        <div class="login-branding-content">
          <div class="login-branding-header">
            <div class="login-branding-logo">
              <span class="material-symbols-outlined login-branding-icon">group</span>
            </div>
            <span class="login-branding-title">Cardzone</span>
          </div>
          <h1 class="login-branding-headline">
            Intelligence Internal Operation Hub
          </h1>
          <p class="login-branding-description">
            All-In-One Intelligence system for project oversight, resource planning, and financial tracking.
          </p>
          <div class="login-branding-features">
            <div class="login-branding-feature">
              <span class="material-symbols-outlined login-feature-icon">verified_user</span>
              <span>Enterprise Secure</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Side: Authentication Panel -->
      <div class="login-auth-panel">
        <div class="login-auth-content">
          <!-- Page Heading -->
          <div class="login-auth-header">
            <div class="login-mobile-branding">
              <span class="material-symbols-outlined login-mobile-icon">group</span>
              <span class="login-mobile-title">Cardzone</span>
            </div>
            <h2 class="login-auth-title">Welcome Back</h2>
            <p class="login-auth-subtitle">Please enter your credentials to access the system.</p>
          </div>

          <!-- Demo Credentials Section -->
          <div class="demo-credentials" v-if="showDemoCredentials">
            <div class="demo-header">
              <span class="material-symbols-outlined demo-icon">info</span>
              <h3>Demo Accounts</h3>
            </div>
            <p class="demo-description">Use any of these test accounts to login:</p>
            <div class="demo-accounts">
              <div v-for="account in demoCredentials" :key="account.email" class="demo-account" @click="fillCredentials(account)">
                <div class="demo-account-icon">
                  <span class="material-symbols-outlined">{{ account.icon }}</span>
                </div>
                <div class="demo-account-info">
                  <div class="demo-account-email">{{ account.email }}</div>
                  <div class="demo-account-role">{{ account.role }}</div>
                </div>
                <div class="demo-account-password">Password: {{ account.password }}</div>
              </div>
            </div>
            <button @click="showDemoCredentials = false" class="demo-hide-btn">
              Hide Demo Accounts
            </button>
          </div>

          <!-- Login Form -->
          <form class="login-form" @submit.prevent="handleLogin">
            <!-- Email Field -->
            <div class="login-form-group">
              <label class="login-form-label">Work Email</label>
              <div class="login-input-wrapper">
                <input v-model="email" class="login-form-input" placeholder="name@company.com" type="email"
                  required />
              </div>
            </div>

            <!-- Password Field -->
            <div class="login-form-group">
              <div class="login-form-header">
                <label class="login-form-label">Password</label>
                <a class="login-form-link" href="#" @click.prevent="toggleForgotPassword">Forgot Password?</a>
              </div>
              <div class="login-input-wrapper login-password-wrapper">
                <input v-model="password" :type="showPassword ? 'text' : 'password'"
                  class="login-form-input login-password-input" placeholder="••••••••" required />
                <button @click="togglePasswordVisibility" type="button" class="login-password-toggle">
                  <span class="material-symbols-outlined">
                    {{ showPassword ? 'visibility_off' : 'visibility' }}
                  </span>
                </button>
              </div>
            </div>

            <!-- Role Selection (Only for demo mode) -->
            <div class="login-form-group" v-if="showRoleSelection">
              <label class="login-form-label">Select Role</label>
              <div class="role-selection">
                <div v-for="role in roles" :key="role.id" 
                     :class="['role-option', { 'selected': selectedRole === role.id }]"
                     @click="selectRole(role.id)">
                  <span class="material-symbols-outlined role-icon">{{ role.icon }}</span>
                  <div class="role-info">
                    <div class="role-name">{{ role.name }}</div>
                    <div class="role-description">{{ role.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Remember Me Checkbox -->
            <div class="login-remember">
              <input v-model="rememberMe" id="remember-me" type="checkbox" class="login-checkbox" />
              <label for="remember-me" class="login-checkbox-label">
                Remember me
              </label>
              <button type="button" @click="showDemoCredentials = true" class="demo-toggle-btn">
                Show Demo Accounts
              </button>
            </div>

            <!-- Login Button -->
            <button type="submit" class="login-submit-btn" :disabled="isLoading">
              <span v-if="!isLoading">Sign In</span>
              <span v-else>
                <span class="loading-spinner"></span>
                Signing In...
              </span>
              <span class="material-symbols-outlined login-submit-icon">login</span>
            </button>

            <!-- Divider -->
            <div class="login-divider">
              <div class="login-divider-line"></div>
              <span class="login-divider-text">Or continue with</span>
              <div class="login-divider-line"></div>
            </div>

            <!-- SSO Button -->
            <button @click="handleSSO" type="button" class="login-sso-btn" :disabled="isLoading">
              <span class="material-symbols-outlined login-sso-icon">security</span>
              <span>Sign in with Single Sign-On (SSO)</span>
            </button>
          </form>

          <!-- Support Footer -->
          <div class="login-footer">
            <div class="login-footer-links">
              <a class="login-footer-link" href="#">Terms of Service</a>
              <a class="login-footer-link" href="#">Privacy Policy</a>
            </div>
            <div class="login-system-status">
              <div class="login-status-indicator"></div>
              <span class="login-status-text">System Operational</span>
            </div>
          </div>
        </div>

        <!-- Global Footer for bottom edge -->
        <div class="login-copyright">
          <p class="login-copyright-text">
            © {{ currentYear }} Cardzone Internal System. DEMO MODE
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Login',
  data() {
    return {
      email: '',
      password: '',
      selectedRole: '',
      showPassword: false,
      showRoleSelection: false,
      showDemoCredentials: false,
      rememberMe: false,
      isLoading: false,
      currentYear: new Date().getFullYear(),

      // Mock user database
      mockUsers: [
        {
          id: 1,
          email: 'admin@cardzone.com',
          password: 'admin123',
          name: 'System Administrator',
          role: 'admin',
          department: 'IT',
          permissions: ['all'],
          lastLogin: null,
          icon: 'admin_panel_settings'
        },
        {
          id: 2,
          email: 'pmo@cardzone.com',
          password: 'pmo123',
          name: 'PMO Director',
          role: 'pmo-director',
          department: 'Project Management',
          permissions: ['view_all', 'create_project', 'approve_budget'],
          lastLogin: null,
          icon: 'monitoring'
        },
        {
          id: 3,
          email: 'manager@cardzone.com',
          password: 'manager123',
          name: 'Project Manager',
          role: 'project-manager',
          department: 'Operations',
          permissions: ['view_assigned', 'create_task', 'update_status'],
          lastLogin: null,
          icon: 'assignment'
        },
        {
          id: 4,
          email: 'user@cardzone.com',
          password: 'user123',
          name: 'Team Member',
          role: 'team-member',
          department: 'Development',
          permissions: ['view_tasks', 'update_tasks'],
          lastLogin: null,
          icon: 'group'
        },
        {
          id: 5,
          email: 'finance@cardzone.com',
          password: 'finance123',
          name: 'Finance Manager',
          role: 'finance',
          department: 'Finance',
          permissions: ['view_financials', 'approve_budget', 'generate_reports'],
          lastLogin: null,
          icon: 'account_balance'
        }
      ],

      // Available roles for selection
      roles: [
        { id: 'admin', name: 'Administrator', description: 'Full system access', icon: 'admin_panel_settings' },
        { id: 'pmo-director', name: 'PMO Director', description: 'Portfolio management', icon: 'monitoring' },
        { id: 'project-manager', name: 'Project Manager', description: 'Project execution', icon: 'assignment' },
        { id: 'team-member', name: 'Team Member', description: 'Task execution', icon: 'group' },
        { id: 'finance', name: 'Finance Manager', description: 'Budget & financials', icon: 'account_balance' }
      ],

      // Demo credentials for easy access
      demoCredentials: [
        { email: 'admin@cardzone.com', password: 'admin123', role: 'Administrator', icon: 'admin_panel_settings' },
        { email: 'pmo@cardzone.com', password: 'pmo123', role: 'PMO Director', icon: 'monitoring' },
        { email: 'manager@cardzone.com', password: 'manager123', role: 'Project Manager', icon: 'assignment' },
        { email: 'user@cardzone.com', password: 'user123', role: 'Team Member', icon: 'group' },
        { email: 'finance@cardzone.com', password: 'finance123', role: 'Finance Manager', icon: 'account_balance' }
      ]
    }
  },
  methods: {
    // Fill credentials from demo account click
    fillCredentials(account) {
      this.email = account.email
      this.password = account.password
      this.showDemoCredentials = false
    },

    // Toggle password visibility
    togglePasswordVisibility() {
      this.showPassword = !this.showPassword
    },

    // Toggle forgot password (mock)
    toggleForgotPassword() {
      alert('Password reset feature is in demo mode. Contact system administrator in production.')
    },

    // Select role
    selectRole(roleId) {
      this.selectedRole = roleId
    },

    // Handle login with mock authentication
    async handleLogin() {
      // Basic validation
      if (!this.email || !this.password) {
        this.showError('Please enter both email and password')
        return
      }

      this.isLoading = true

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Find user in mock database
      const user = this.mockUsers.find(u => 
        u.email.toLowerCase() === this.email.toLowerCase() && 
        u.password === this.password
      )

      if (user) {
        // Update last login
        user.lastLogin = new Date().toISOString()
        
        // Store user data in localStorage (mock session)
        localStorage.setItem('user', JSON.stringify({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          department: user.department,
          permissions: user.permissions,
          lastLogin: user.lastLogin,
          icon: user.icon
        }))

        // Store remember me preference
        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email)
        } else {
          localStorage.removeItem('rememberedEmail')
        }

        // Show success message
        this.showSuccess(`Welcome back, ${user.name}!`)
        
        // Redirect based on role
        setTimeout(() => {
          this.redirectToDashboard(user.role)
        }, 500)

      } else {
        // Show error for invalid credentials
        this.showError('Invalid email or password. Try: admin@cardzone.com / admin123')
        
        // Auto-suggest demo credentials
        setTimeout(() => {
          this.showDemoCredentials = true
        }, 1000)
      }

      this.isLoading = false
    },

    // Redirect to appropriate dashboard
    redirectToDashboard(role) {
      const routes = {
        'admin': '/dashboard',
        'pmo-director': '/dashboard',
        'project-manager': '/projects',
        'team-member': '/tasks',
        'finance': '/finance'
      }
      
      this.$router.push(routes[role] || '/dashboard')
    },

    // Handle SSO (mock)
    handleSSO() {
      this.isLoading = true
      setTimeout(() => {
        this.isLoading = false
        alert('SSO authentication is in demo mode. Use regular login for testing.')
      }, 1000)
    },

    // Show success message
    showSuccess(message) {
      // You can replace this with a proper notification component
      console.log('Success:', message)
      // For now, use alert
      alert(message)
    },

    // Show error message
    showError(message) {
      console.error('Error:', message)
      alert(message)
    }
  },
  mounted() {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      this.email = rememberedEmail
      this.rememberMe = true
    }
    
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      const user = JSON.parse(storedUser)
      // Optional: Auto-redirect if session is recent (less than 1 hour)
      const lastLogin = new Date(user.lastLogin)
      const now = new Date()
      const hoursDiff = (now - lastLogin) / (1000 * 60 * 60)
      
      if (hoursDiff < 1) {
        this.$router.push('/dashboard')
      }
    }
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
@import '../../../styles/views/authenticate/login.css';

/* Demo Credentials Styles */
.demo-credentials {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid #bae6fd;
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  animation: slideIn 0.3s ease;
}

.dark .demo-credentials {
  background: linear-gradient(135deg, #0c4a6e 0%, #075985 100%);
  border-color: #0ea5e9;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.demo-icon {
  color: #0ea5e9;
  font-size: 1.5rem;
}

.demo-header h3 {
  margin: 0;
  color: #0369a1;
  font-size: 1.1rem;
  font-weight: 600;
}

.dark .demo-header h3 {
  color: #bae6fd;
}

.demo-description {
  color: #475569;
  font-size: 0.9rem;
  margin-bottom: 1rem;
  line-height: 1.4;
}

.dark .demo-description {
  color: #cbd5e1;
}

.demo-accounts {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.demo-account {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.demo-account:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #0ea5e9;
}

.dark .demo-account {
  background: #1e293b;
  border-color: #334155;
}

.dark .demo-account:hover {
  border-color: #0ea5e9;
  background: #334155;
}

.demo-account-icon {
  width: 2.5rem;
  height: 2.5rem;
  background: #f0f9ff;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #0ea5e9;
}

.dark .demo-account-icon {
  background: #075985;
}

.demo-account-info {
  flex: 1;
}

.demo-account-email {
  font-weight: 500;
  color: #1e293b;
  font-size: 0.9rem;
}

.dark .demo-account-email {
  color: #f1f5f9;
}

.demo-account-role {
  font-size: 0.8rem;
  color: #64748b;
}

.dark .demo-account-role {
  color: #94a3b8;
}

.demo-account-password {
  font-size: 0.8rem;
  color: #059669;
  font-weight: 500;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.dark .demo-account-password {
  color: #10b981;
  background: #064e3b;
}

.demo-hide-btn {
  width: 100%;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid #cbd5e1;
  color: #64748b;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}

.demo-hide-btn:hover {
  background: #f1f5f9;
  border-color: #94a3b8;
}

.dark .demo-hide-btn {
  border-color: #475569;
  color: #94a3b8;
}

.dark .demo-hide-btn:hover {
  background: #334155;
}

.demo-toggle-btn {
  margin-left: auto;
  padding: 0.375rem 0.75rem;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s;
}

.demo-toggle-btn:hover {
  background: #e0f2fe;
  transform: translateY(-1px);
}

.dark .demo-toggle-btn {
  background: #075985;
  border-color: #0ea5e9;
  color: #bae6fd;
}

/* Role Selection Styles */
.role-selection {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.role-option {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem;
  border: 2px solid #e2e8f0;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.role-option:hover {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.role-option.selected {
  border-color: #0ea5e9;
  background: #f0f9ff;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
}

.dark .role-option {
  border-color: #475569;
}

.dark .role-option:hover,
.dark .role-option.selected {
  border-color: #0ea5e9;
  background: #1e293b;
}

.role-icon {
  color: #64748b;
  font-size: 1.5rem;
}

.role-option.selected .role-icon {
  color: #0ea5e9;
}

.role-info {
  flex: 1;
}

.role-name {
  font-weight: 500;
  color: #1e293b;
}

.dark .role-name {
  color: #f1f5f9;
}

.role-description {
  font-size: 0.8rem;
  color: #64748b;
}

.dark .role-description {
  color: #94a3b8;
}

/* Loading Spinner */
.loading-spinner {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Remember Me Section Adjustments */
.login-remember {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* Responsive Adjustments */
@media (max-width: 768px) {
  .demo-account {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .demo-account-password {
    align-self: stretch;
    text-align: center;
  }
  
  .login-remember {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .demo-toggle-btn {
    margin-left: 0;
    width: 100%;
  }
}

/* Add to existing CSS */
.login-checkbox-label {
  white-space: nowrap;
}
</style>