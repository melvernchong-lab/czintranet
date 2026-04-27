<template>
  <div class="page-content">
    <!-- Header Section - Hide on project detail pages -->
    <div class="header-container" v-if="!isProjectDetailRoute">
      <div class="projects-header">
        <div class="header-title-section">
          <div class="title-wrapper">
            <h1 class="page-title">Hey! {{currentUser?.name || 'User' }}, here's your projects</h1>
          </div>
          <p class="page-subtitle">
            Track progress and manage your project tasks efficiently
          </p>
        </div>
        <div class="header-actions">
          <button @click="openNewProjectModal" class="quick-action primary-btn">
            <span class="material-symbols-outlined icon-medium">add</span>
            <span>New Project</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Navigation Bar for Project Detail Pages -->
    <div class="project-nav-bar" v-if="isProjectDetailRoute">
      <button class="back-to-projects-btn" @click="goBackToProjects">
        <span class="material-symbols-outlined">arrow_back</span>
        <span>Back to Projects</span>
      </button>
      <div class="project-breadcrumb">
        <span class="breadcrumb-item">Projects</span>
        <span class="breadcrumb-separator">/</span>
        <span class="breadcrumb-item active">{{ currentProjectName || 'Project Details' }}</span>
      </div>
    </div>

    <!-- Router View for child routes (Project Detail, Timeline, etc.) -->
    <router-view 
      @project-created="handleProjectCreated"
      @project-selected="handleProjectSelected"
      @update-project-name="handleProjectNameUpdate"
    />

    <!-- Create Project Modal -->
    <CreateProjectModal 
      :is-visible="showCreateModal" 
      @close="showCreateModal = false"
      @create="handleProjectCreate" 
    />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import CreateProjectModal from '../createProject/CreateProjectModal.vue'

export default {
  name: 'IndividualProject',
  components: {
    CreateProjectModal
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const toast = useToast()
    
    // Modal state
    const showCreateModal = ref(false)
    const currentUser = ref(null)
    const userId = ref(null)
    const currentProjectName = ref('')

    // Check if current route is a project detail page
    const isProjectDetailRoute = computed(() => {
      // Check if route has an id parameter (project detail)
      return !!route.params.id && route.path.includes('/projects/')
    })

    // Load current user from localStorage
    const loadCurrentUser = () => {
      try {
        const storedUser = localStorage.getItem('current_user') || 
                           localStorage.getItem('user') || 
                           localStorage.getItem('loggedInUser')
        
        if (storedUser) {
          currentUser.value = JSON.parse(storedUser)
          userId.value = currentUser.value.id
          console.log('Current user loaded:', currentUser.value)
        } else {
          const storedUsers = localStorage.getItem('access_users')
          if (storedUsers) {
            const users = JSON.parse(storedUsers)
            const activeUser = users.find(u => u.status === 'active') || users[0]
            if (activeUser) {
              currentUser.value = activeUser
              userId.value = activeUser.id
              console.log('Fallback user loaded:', currentUser.value)
            }
          }
        }
        
        if (!currentUser.value) {
          currentUser.value = { id: 1, name: 'User' }
          userId.value = 1
        }
      } catch (error) {
        console.error('Error loading current user:', error)
        currentUser.value = { id: 1, name: 'User' }
        userId.value = 1
      }
    }

    // Load project name for breadcrumb
    const loadProjectName = () => {
      const projectId = route.params.id
      if (projectId) {
        const savedProjects = localStorage.getItem('saved_projects')
        if (savedProjects) {
          const projects = JSON.parse(savedProjects)
          const project = projects.find(p => p.id == projectId)
          if (project) {
            currentProjectName.value = project.name
          }
        }
      }
    }

    // Go back to projects list
    const goBackToProjects = () => {
      router.push('/projects')
    }

    // Handle project name update from detail page
    const handleProjectNameUpdate = (name) => {
      currentProjectName.value = name
    }

    // Methods
    const openNewProjectModal = () => {
      showCreateModal.value = true
      toast.info('Opening new project form...')
    }

    const handleProjectCreate = (projectData) => {
      const projectWithUser = {
        ...projectData,
        userId: userId.value,
        userEmail: currentUser.value?.email,
        createdAt: new Date().toISOString()
      }
      console.log('Project with user association:', projectWithUser)
      toast.success('Project created successfully!')
      showCreateModal.value = false
    }

    const handleProjectCreated = () => {
      toast.success('Project list refreshed')
    }

    const handleProjectSelected = (project) => {
      console.log('Selected project:', project)
      currentProjectName.value = project.name
      toast.info(`Opening ${project.name}`)
    }

    // Watch for route changes to update project name
    watch(() => route.params.id, () => {
      if (route.params.id) {
        loadProjectName()
      } else {
        currentProjectName.value = ''
      }
    }, { immediate: true })

    onMounted(() => {
      loadCurrentUser()
      loadProjectName()
    })

    return {
      currentUser,
      userId,
      showCreateModal,
      isProjectDetailRoute,
      currentProjectName,
      openNewProjectModal,
      handleProjectCreate,
      handleProjectCreated,
      handleProjectSelected,
      handleProjectNameUpdate,
      goBackToProjects
    }
  }
}
</script>

<style scoped>
@import '../../../../styles/shared/pages.css';

.projects-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.projects-view {
  margin-top: 24px;
}

/* Project Navigation Bar */
.project-nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  flex-wrap: wrap;
  gap: 16px;
}

.back-to-projects-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #6366f1;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.dark .back-to-projects-btn {
  background: #1e293b;
  border-color: #334155;
  color: #f1f5f9;
}

.back-to-projects-btn:hover {
  background: #6366f1;
  color: white;
  transform: translateX(-5px);
}

.back-to-projects-btn .material-symbols-outlined {
  font-size: 18px;
}

.project-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.breadcrumb-item {
  color: #64748b;
  transition: color 0.2s;
}

.dark .breadcrumb-item {
  color: #94a3b8;
}

.breadcrumb-item.active {
  color: #6366f1;
  font-weight: 600;
}

.dark .breadcrumb-item.active {
  color: #f1f5f9;
}

.breadcrumb-separator {
  color: #cbd5e1;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .projects-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .header-actions {
    width: 100%;
  }
  
  .quick-action.primary-btn {
    width: 100%;
    justify-content: center;
  }
  
  .project-nav-bar {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .back-to-projects-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>