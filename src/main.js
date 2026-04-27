import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { createPinia } from 'pinia'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import App from './App.vue'
import './styles/shared/tailwind.css'

// Import components
import Login from './views/modules/authentication/Login.vue'
import Dashboard from './views/modules/dashboards/adminDashboard.vue'
import AccessManagement from './views/modules/accessControls/AccessManagement.vue'
import Wiki from './views/modules/wikis/wikiDump.vue'
import Leave from './views/modules/leaveTracker/Leave.vue'

// Project Modules
import PmoDashboard from './views/modules/projects/pmoDashboard/PmoDashboard.vue'
import PmoProjectSummary from './views/modules/projects/pmoDashboard/PmoDetailPage/PmoProjectSummary.vue'
import PmoResourcesList from './views/modules/projects/pmoDashboard/PmoDetailPage/PmoResourcesList.vue'
import PmoInvoiceTracking from './views/modules/projects/pmoDashboard/PmoDetailPage/PmoInvoiceTracking.vue'

import IndividualProject from './views/modules/projects/individualProject/IndProj.vue'
import ProjectDetailPage from './views/modules/projects/individualProject/IndProj-ProjDtlPage.vue'


// Create router
const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { requiresLayout: false, hideLayout: true },
    },
    {
      path: '/',
      redirect: '/login'
    },
    {
      path: '/dashboard',
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresLayout: true }
    },
    {
      path: '/access-management',
      name: 'AccessManagement',
      component: AccessManagement,
      meta: { requiresLayout: true }
    },
    {
      path: '/wiki',
      name: 'Wiki',
      component: Wiki,
      meta: { requiresLayout: true }
    },    
    {
      path: '/pmo-dashboard',
      name: 'PmoDashboard',
      component: PmoDashboard,
      meta: { requiresLayout: true },
      children: [
        {
          path: '',
          name: 'PmoDashboardContent',
          component: () => import('./views/modules/projects/pmoDashboard/PmoDashboardContent.vue'),
          meta: { requiresLayout: true }
        },
        {
          path: 'projectsummary',
          name: 'PmoProjectSummary',
          component: PmoProjectSummary,
          meta: { requiresLayout: true }
        },
        {
          path: 'resources',
          name: 'PmoResources',
          component: PmoResourcesList,
          meta: { requiresLayout: true }
        },
        {
          path: 'invoices',
          name: 'PmoInvoiceTracking',
          component: PmoInvoiceTracking,
          meta: { requiresLayout: true }
        }
      ]
    },
    {
      path: '/projects',
      name: 'Projects',
      component: IndividualProject,
      meta: { requiresLayout: true },
      children: [
        {
          path: '',
          name: 'MyProjects',
          component: () => import('./views/modules/projects/individualProject/IndProj-SummaryContent.vue'),
          meta: { requiresLayout: true }
        },
        // Project detail routes
        {
          path: ':id',
          name: 'ProjectDetail',
          component: ProjectDetailPage,
          meta: { requiresLayout: true }
        },
        {
          path: ':id/edit',
          name: 'ProjectEdit',
          component: ProjectDetailPage,
          meta: { requiresLayout: true }
        },
        {
          path: ':id/timeline',
          name: 'ProjectTimeline',
          component: () => import('./views/modules/projects/createProject/projectTimelineCreation/ProjectTimelinePlanner.vue'),
          meta: { requiresLayout: true }
        },
        {
          path: ':id/timeline/create',
          name: 'ProjectTimelineCreate',
          component: () => import('./views/modules/projects/createProject/projectTimelineCreation/ProjectTimelinePlanner.vue'),
          meta: { requiresLayout: true }
        }
      ]
    },
    {
      path: '/leave',
      name: 'Leave',
      component: Leave,
      meta: { requiresLayout: true }
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard'
    }
  ]
})

// Create and mount app
const app = createApp(App)

// Create Pinia instance
const pinia = createPinia()

// Configure vue-toastification
const toastOptions = {
  position: "top-right",
  timeout: 5000,
  closeOnClick: true,
  pauseOnFocusLoss: true,
  pauseOnHover: true,
  draggable: true,
  draggablePercent: 0.6,
  showCloseButtonOnHover: false,
  hideProgressBar: false,
  closeButton: "button",
  icon: false,
  rtl: false,
  transition: "Vue-Toastification__bounce",
  maxToasts: 5,
  newestOnTop: true,
  toastClassName: "custom-toast",
  bodyClassName: "custom-toast-body"
}

// Use plugins
app.use(pinia)
app.use(router)
app.use(Toast, toastOptions)

// Theme management
app.provide('theme', {
  toggleTheme: () => {
    const html = document.documentElement
    const isDark = html.classList.contains('dark')

    if (isDark) {
      html.classList.remove('dark')
      localStorage.setItem('pmo-theme', 'light')
    } else {
      html.classList.add('dark')
      localStorage.setItem('pmo-theme', 'dark')
    }
  }
})

app.mount('#app')

// Initialize theme
const savedTheme = localStorage.getItem('pmo-theme') || 'dark'
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}