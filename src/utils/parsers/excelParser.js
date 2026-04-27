// utils/parsers/excelParser.js
import * as XLSX from 'xlsx';

export class ExcelParser {
  static async parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Assume first sheet contains timeline data
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet);
          
          const groups = new Map();
          const tasks = [];
          
          rows.forEach((row, index) => {
            // Map Excel columns to task properties
            const task = {
              id: `imported-${Date.now()}-${index}-${Math.random()}`,
              name: row['Task Name'] || row['Name'] || row['Task'] || `Task ${index + 1}`,
              startDate: this.parseExcelDate(row['Start Date'] || row['Start']),
              endDate: this.parseExcelDate(row['End Date'] || row['End'] || row['Finish']),
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
            
            // Group by swimlane/phase column
            const groupName = row['Swimlane'] || row['Phase'] || row['Group'] || 'Imported Tasks';
            
            if (!groups.has(groupName)) {
              groups.set(groupName, []);
            }
            groups.get(groupName).push(task);
            tasks.push(task);
          });
          
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
      reader.readAsArrayBuffer(file);
    });
  }
  
  static parseExcelDate(dateValue) {
    if (!dateValue) return '';
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return '';
    }
    
    // If it's an Excel serial number
    if (typeof dateValue === 'number') {
      const date = new Date((dateValue - 25569) * 86400 * 1000);
      return date.toISOString().split('T')[0];
    }
    
    return '';
  }
}