export const projectService = {
  async getProjects() {
    return {
      success: true,
      data: [
        {
          id: 1,
          name: 'Enterprise CRM Overhaul',
          role: 'Lead PM',
          client: 'Nexus Systems',
          progress: 78,
          health: 'good',
          healthColor: 'emerald',
          timeline: 'Mar 24, 2024',
          icon: 'rocket_launch',
          iconColor: 'text-emerald-600',
          iconBg: 'bg-emerald-50 dark:bg-emerald-900/20',
          status: 'active',
          priority: 'high',
          category: 'Digital Transformation'
        },
        {
          id: 2,
          name: 'Q4 Supply Chain Optimization',
          role: 'Strategic Lead',
          client: 'Logistics Inc.',
          progress: 32,
          health: 'at-risk',
          healthColor: 'rose',
          issue: 'Resource Gap',
          timeline: 'Feb 28, 2024',
          icon: 'warning',
          iconColor: 'text-rose-600',
          iconBg: 'bg-rose-100 dark:bg-rose-900/40',
          status: 'at-risk',
          priority: 'critical',
          category: 'Operations'
        }
      ]
    }
  },
  
  async createProject(data) {
    console.log('Creating project:', data)
    return { success: true, data }
  },
  
  async updateProject(id, data) {
    console.log('Updating project:', id, data)
    return { success: true, data }
  },
  
  async resolveIssue(projectId) {
    console.log('Resolving issue for project:', projectId)
    return { success: true }
  }
}