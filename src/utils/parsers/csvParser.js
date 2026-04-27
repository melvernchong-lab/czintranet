// utils/parsers/csvParser.js
export class CSVParser {
  static async parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const csvText = e.target.result;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          const groups = new Map();
          const tasks = [];
          
          for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const values = this.parseCSVLine(lines[i]);
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            const task = {
              id: `imported-${Date.now()}-${i}-${Math.random()}`,
              name: row['Task Name'] || row['Name'] || row['Task'] || `Task ${i}`,
              startDate: row['Start Date'] || row['Start'] || '',
              endDate: row['End Date'] || row['End'] || row['Finish'] || '',
              durationDays: parseInt(row['Duration'] || row['Days'] || 0),
              progress: parseInt(row['Progress'] || row['% Complete'] || 0),
              isMilestone: (row['Type'] === 'Milestone' || row['Milestone'] === 'Yes'),
              owner: row['Owner'] || row['Assigned To'] || '',
              relationships: []
            };
            
            // Calculate duration if not provided
            if (!task.durationDays && task.startDate && task.endDate) {
              const start = new Date(task.startDate);
              const end = new Date(task.endDate);
              const diffTime = Math.abs(end - start);
              task.durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              task.duration = `${task.durationDays} days`;
            } else {
              task.duration = `${task.durationDays} days`;
            }
            
            const groupName = row['Swimlane'] || row['Phase'] || row['Group'] || 'Imported Tasks';
            
            if (!groups.has(groupName)) {
              groups.set(groupName, []);
            }
            groups.get(groupName).push(task);
            tasks.push(task);
          }
          
          // Convert to timeline groups format
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
          
          const summary = {
            totalTasks: tasks.length,
            totalDuration: tasks.reduce((sum, t) => sum + (t.durationDays || 0), 0),
            overallProgress: tasks.length > 0 
              ? Math.round(tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length)
              : 0,
            milestoneCount: tasks.filter(t => t.isMilestone).length
          };
          
          resolve({ groups: timelineGroups, summary });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  static parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }
}