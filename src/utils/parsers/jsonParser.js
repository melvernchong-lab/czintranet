// utils/parsers/jsonParser.js
export class JSONParser {
  static async parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target.result);
          
          // Support different JSON structures
          let timelineData;
          if (jsonData.groups) {
            timelineData = jsonData;
          } else if (jsonData.data && jsonData.data.groups) {
            timelineData = jsonData.data;
          } else {
            // Try to convert flat tasks to groups
            timelineData = this.convertToTimelineFormat(jsonData);
          }
          
          resolve(timelineData);
        } catch (error) {
          reject(new Error('Invalid JSON format: ' + error.message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  static convertToTimelineFormat(data) {
    const groups = new Map();
    
    // If data is an array of tasks
    if (Array.isArray(data)) {
      data.forEach((task, index) => {
        const groupName = task.group || task.swimlane || 'Imported Tasks';
        
        if (!groups.has(groupName)) {
          groups.set(groupName, []);
        }
        
        groups.get(groupName).push({
          id: task.id || `imported-${Date.now()}-${index}-${Math.random()}`,
          name: task.name || task.title || `Task ${index + 1}`,
          startDate: task.startDate || task.start || '',
          endDate: task.endDate || task.end || task.finish || '',
          durationDays: task.durationDays || parseInt(task.duration) || 0,
          progress: task.progress || task.percentComplete || 0,
          isMilestone: task.isMilestone || task.milestone || false,
          owner: task.owner || task.assignee || '',
          relationships: task.relationships || []
        });
      });
    }
    
    const timelineGroups = [];
    let groupIndex = 0;
    
    for (const [groupName, groupTasks] of groups) {
      timelineGroups.push({
        id: `swimlane-${Date.now()}-${groupIndex++}`,
        name: groupName,
        expanded: true,
        subGroups: [],
        tasks: groupTasks
      });
    }
    
    const allTasks = Array.from(groups.values()).flat();
    const summary = {
      totalTasks: allTasks.length,
      totalDuration: allTasks.reduce((sum, t) => sum + (t.durationDays || 0), 0),
      overallProgress: allTasks.length > 0 
        ? Math.round(allTasks.reduce((sum, t) => sum + (t.progress || 0), 0) / allTasks.length)
        : 0,
      milestoneCount: allTasks.filter(t => t.isMilestone).length
    };
    
    return { groups: timelineGroups, summary };
  }
}