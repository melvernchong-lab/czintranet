export const dashboardService = {
  async getDashboardData() {
    return {
      success: true,
      data: {
        stats: {
          projectsCount: '08',
          activeProjects: 6,
          planningProjects: 2,
          milestoneRate: 94.2,
          milestoneTrend: '+2.4% vs last quarter',
          healthIndex: '88/100',
          healthDescription: 'Weighted by strategic impact'
        },
        workload: {
          allocatedPercentage: 82,
          hoursPerWeek: 32,
          activeProjects: 8,
          capacityStatus: 'high',
          capacityMessage: 'Near peak capacity'
        },
        deliverables: [
          {
            id: 1,
            title: 'Final Budget Approval',
            dueDate: 'Tomorrow',
            project: 'Enterprise CRM Project',
            status: 'urgent',
            color: 'rose'
          },
          {
            id: 2,
            title: 'Steering Committee Memo',
            dueDate: 'In 3 Days',
            project: 'Cloud Infrastructure',
            status: 'upcoming',
            color: 'primary'
          }
        ]
      }
    }
  }
}