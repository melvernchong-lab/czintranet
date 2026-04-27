// utils/parsers/msProjectParser.js - Fixed version

export class MSProjectParser {
  static async parse(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const content = e.target.result
          const fileName = file.name.toLowerCase()

          console.log('=== MS PROJECT PARSER ===')
          console.log('File name:', fileName)

          if (fileName.endsWith('.xml')) {
            console.log('Parsing XML file...')
            const data = await this.parseXML(content)
            
            if (!data.groups) data.groups = []
            if (!data.summary) {
              data.summary = {
                totalTasks: 0,
                totalDuration: 0,
                overallProgress: 0,
                milestoneCount: 0,
                relationshipsCount: 0
              }
            }

            console.log(`✅ Parse complete: ${data.groups.length} groups, ${data.summary.totalTasks} tasks`)
            resolve(data)
          } else if (fileName.endsWith('.mpp')) {
            reject(new Error(
              '❌ Binary MPP files are not supported\n\n' +
              'Please export your file as XML from MS Project:\n' +
              'File → Save As → XML Format (*.xml)'
            ))
          } else {
            reject(new Error('Please use .xml files exported from MS Project'))
          }
        } catch (error) {
          console.error('Parse error:', error)
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  static async parseXML(xmlString) {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml')

    const parserError = xmlDoc.querySelector('parsererror')
    if (parserError) {
      throw new Error('Invalid XML format. Please ensure you exported correctly from MS Project.')
    }

    console.log('XML loaded, searching for tasks and relationships...')

    // ============ GET ALL TASKS ============
    let taskElements = xmlDoc.getElementsByTagName('Task')
    if (taskElements.length === 0) {
      taskElements = xmlDoc.getElementsByTagName('task')
    }
    console.log(`Found ${taskElements.length} task elements`)

    // ============ FIRST PASS: Parse all tasks ============
    const tasks = []
    const taskMap = new Map()
    const idMap = new Map()

    for (let i = 0; i < taskElements.length; i++) {
      const taskEl = taskElements[i]

      const uid = this.getXMLText(taskEl, 'UID') || `task-${i}`
      const id = this.getXMLText(taskEl, 'ID') || i.toString()
      const name = this.getXMLText(taskEl, 'Name') || `Task ${i + 1}`
      
      const outlineLevel = parseInt(this.getXMLText(taskEl, 'OutlineLevel') || '1')
      const isSummary = this.getXMLText(taskEl, 'Summary') === '1'
      const isMilestone = this.getXMLText(taskEl, 'Milestone') === '1'

      // Get dates
      const startDate = this.getXMLText(taskEl, 'Start') || this.getXMLText(taskEl, 'StartDate')
      const finishDate = this.getXMLText(taskEl, 'Finish') || this.getXMLText(taskEl, 'FinishDate')
      const duration = this.getXMLText(taskEl, 'Duration')
      const percentComplete = this.getXMLText(taskEl, 'PercentComplete') || '0'

      // Parse predecessor links
      const predecessorLinks = []
      const linkElements = taskEl.getElementsByTagName('PredecessorLink')
      
      for (let j = 0; j < linkElements.length; j++) {
        const linkEl = linkElements[j]
        let predUID = this.getXMLText(linkEl, 'PredecessorUID')
        const linkType = this.getXMLText(linkEl, 'Type') || '0'
        const linkLag = this.getXMLText(linkEl, 'LinkLag') || '0'
        
        if (predUID) {
          predecessorLinks.push({
            predecessorUID: String(predUID),
            type: linkType,
            lag: parseInt(linkLag) || 0
          })
        }
      }

      const task = {
        uid: String(uid),
        id: parseInt(id),
        name: name.trim(),
        outlineLevel: outlineLevel,
        isSummary: isSummary,
        isMilestone: isMilestone,
        startDate: startDate ? this.formatDate(startDate) : '',
        finishDate: finishDate ? this.formatDate(finishDate) : '',
        duration: duration,
        percentComplete: parseInt(percentComplete) || 0,
        predecessorLinks: predecessorLinks,
        relationships: [],
        children: []
      }

      tasks.push(task)
      taskMap.set(String(uid), task)
      idMap.set(id, task)
    }

    console.log(`Parsed ${tasks.length} tasks`)

    // Sort tasks by ID to maintain order
    tasks.sort((a, b) => a.id - b.id)

    // ============ BUILD HIERARCHY USING OUTLINE LEVEL ============
    console.log('\n📊 Building hierarchy from OutlineLevel sequence...')
    
    const rootTasks = [] // Level 1 tasks become swimlanes
    const parentStack = [] // Stack to track parents at each level
    
    for (const task of tasks) {
      if (task.outlineLevel === 0) continue
      
      // Pop stack until we find the correct parent level
      while (parentStack.length >= task.outlineLevel) {
        parentStack.pop()
      }
      
      // Find parent (the task at the previous level)
      let parent = null
      if (parentStack.length > 0) {
        parent = parentStack[parentStack.length - 1]
      }
      
      // Add to parent or root
      if (parent) {
        parent.children.push(task)
        console.log(`  ${task.name} (L${task.outlineLevel}) -> parent: ${parent.name}`)
      } else {
        rootTasks.push(task)
        console.log(`  ${task.name} (L${task.outlineLevel}) -> ROOT (Swimlane)`)
      }
      
      // Push to stack for potential children
      parentStack.push(task)
    }
    
    console.log(`\n📌 Built hierarchy with ${rootTasks.length} root nodes`)
    
    // Root tasks at Level 1 become swimlanes
    const swimlaneRoots = rootTasks.filter(t => t.outlineLevel === 1)
    console.log(`Swimlane roots: ${swimlaneRoots.length}`)
    swimlaneRoots.forEach(s => {
      console.log(`  - ${s.name} (${s.children.length} direct children)`)
    })

    // ============ CONVERT TO GROUPS (SWIMLANES) WITH PROPER NESTING ============
    const groups = []
    
    // Helper to convert a task tree to UI format
    const convertTaskToUITask = (task, taskMap, idMap) => {
      const taskObj = {
        id: `task-${Date.now()}-${task.uid}-${Math.random().toString(36).substr(2, 6)}`,
        name: task.name,
        startDate: task.startDate,
        endDate: task.finishDate,
        durationDays: this.parseDuration(task.duration, task.startDate, task.finishDate),
        progress: task.percentComplete,
        isMilestone: task.isMilestone || false,
        isParent: task.children && task.children.length > 0,
        owner: this.extractOwner(task.name),
        relationships: [],
        children: []
      }
      
      // Recursively convert children
      if (task.children && task.children.length > 0) {
        for (const child of task.children) {
          // Skip summary tasks that are just containers with no real content
          if (child.isSummary && child.children.length === 0) continue
          
          const childTask = convertTaskToUITask(child, taskMap, idMap)
          if (childTask && childTask.name) {
            taskObj.children.push(childTask)
          }
        }
      }
      
      return taskObj
    }
    
    // Process each swimlane root
    for (const root of swimlaneRoots) {
      console.log(`\n📊 Creating SWIMLANE: ${root.name} (${root.children.length} children)`)
      
      const swimlane = {
        id: `swimlane-${Date.now()}-${root.uid}`,
        name: root.name,
        expanded: true,
        subGroups: [],
        tasks: []
      }
      
      // Process all children of this swimlane (Level 2 tasks)
      for (const child of root.children) {
        // Check if this child has its own children (Level 3+)
        const hasChildren = child.children && child.children.length > 0
        
        if (hasChildren) {
          // This is a parent task (like "Project Budgeting", "Architecture Assessment & Design")
          const parentTask = {
            id: `task-${Date.now()}-${child.uid}-${Math.random().toString(36).substr(2, 6)}`,
            name: child.name,
            startDate: child.startDate,
            endDate: child.finishDate,
            durationDays: this.parseDuration(child.duration, child.startDate, child.finishDate),
            progress: child.percentComplete,
            isMilestone: child.isMilestone || false,
            isParent: true,
            owner: this.extractOwner(child.name),
            relationships: [],
            children: []
          }
          
          // Add all grandchildren as children tasks
          for (const grandChild of child.children) {
            if (grandChild.name && !grandChild.isSummary) {
              const subTask = {
                id: `task-${Date.now()}-${grandChild.uid}-${Math.random().toString(36).substr(2, 6)}`,
                name: grandChild.name,
                startDate: grandChild.startDate,
                endDate: grandChild.finishDate,
                durationDays: this.parseDuration(grandChild.duration, grandChild.startDate, grandChild.finishDate),
                progress: grandChild.percentComplete,
                isMilestone: grandChild.isMilestone || false,
                isParent: grandChild.children && grandChild.children.length > 0,
                owner: this.extractOwner(grandChild.name),
                relationships: [],
                children: []
              }
              
              // Handle deeper nesting if needed
              if (grandChild.children && grandChild.children.length > 0) {
                for (const deepChild of grandChild.children) {
                  const deepTask = {
                    id: `task-${Date.now()}-${deepChild.uid}-${Math.random().toString(36).substr(2, 6)}`,
                    name: deepChild.name,
                    startDate: deepChild.startDate,
                    endDate: deepChild.finishDate,
                    durationDays: this.parseDuration(deepChild.duration, deepChild.startDate, deepChild.finishDate),
                    progress: deepChild.percentComplete,
                    isMilestone: deepChild.isMilestone || false,
                    isParent: false,
                    owner: this.extractOwner(deepChild.name),
                    relationships: [],
                    children: []
                  }
                  subTask.children.push(deepTask)
                  console.log(`      ✅ Deep child: ${deepChild.name}`)
                }
              }
              
              parentTask.children.push(subTask)
              console.log(`    ✅ Child task: ${grandChild.name} under ${child.name}`)
            }
          }
          
          swimlane.tasks.push(parentTask)
          console.log(`  ✅ Parent task: ${child.name} (${parentTask.children.length} children)`)
        } else {
          // This is a direct task without children
          const directTask = {
            id: `task-${Date.now()}-${child.uid}-${Math.random().toString(36).substr(2, 6)}`,
            name: child.name,
            startDate: child.startDate,
            endDate: child.finishDate,
            durationDays: this.parseDuration(child.duration, child.startDate, child.finishDate),
            progress: child.percentComplete,
            isMilestone: child.isMilestone || false,
            isParent: false,
            owner: this.extractOwner(child.name),
            relationships: [],
            children: []
          }
          swimlane.tasks.push(directTask)
          console.log(`  ✅ Direct task: ${child.name}`)
        }
      }
      
      // Only add swimlane if it has tasks
      if (swimlane.tasks.length > 0) {
        groups.push(swimlane)
        console.log(`  ✅ Swimlane "${root.name}" added with ${swimlane.tasks.length} tasks`)
      } else {
        console.log(`  ⚠️ Swimlane "${root.name}" had no tasks, checking if we need to add fallback...`)
        // If no tasks but has children, add them directly
        for (const child of root.children) {
          const directTask = {
            id: `task-${Date.now()}-${child.uid}-${Math.random().toString(36).substr(2, 6)}`,
            name: child.name,
            startDate: child.startDate,
            endDate: child.finishDate,
            durationDays: this.parseDuration(child.duration, child.startDate, child.finishDate),
            progress: child.percentComplete,
            isMilestone: child.isMilestone || false,
            isParent: child.children && child.children.length > 0,
            owner: this.extractOwner(child.name),
            relationships: [],
            children: []
          }
          swimlane.tasks.push(directTask)
        }
        if (swimlane.tasks.length > 0) {
          groups.push(swimlane)
          console.log(`  ✅ Swimlane "${root.name}" added with ${swimlane.tasks.length} tasks (fallback)`)
        }
      }
    }

    // ============ RESOLVE RELATIONSHIPS ============
    const typeMap = { '0': 'fs', '1': 'ss', '2': 'ff', '3': 'sf' }
    let relationshipCount = 0
    
    // Create a map to find tasks by UID
    const findAllTasks = (groups) => {
      const allTasks = []
      const search = (taskList) => {
        for (const task of taskList) {
          allTasks.push(task)
          if (task.children) search(task.children)
        }
      }
      for (const group of groups) {
        search(group.tasks)
        for (const subGroup of group.subGroups || []) {
          search(subGroup.tasks)
        }
      }
      return allTasks
    }
    
    const allUiTasks = findAllTasks(groups)
    const taskByOriginalUID = new Map()
    
    for (const uiTask of allUiTasks) {
      // Store mapping for relationships
      const uidMatch = uiTask.id.match(/task-\d+-([^-]+)-/)
      if (uidMatch) {
        taskByOriginalUID.set(uidMatch[1], uiTask)
      }
    }
    
    // Add relationships
    for (const task of tasks) {
      if (task.predecessorLinks && task.predecessorLinks.length > 0) {
        const targetTask = taskByOriginalUID.get(task.uid)
        
        for (const link of task.predecessorLinks) {
          const sourceTask = taskByOriginalUID.get(link.predecessorUID)
          
          if (targetTask && sourceTask) {
            if (!targetTask.relationships) targetTask.relationships = []
            
            targetTask.relationships.push({
              id: `rel-${Date.now()}-${Math.random()}`,
              taskId: sourceTask.id,
              type: typeMap[link.type] || 'fs',
              lag: link.lag,
              direction: 'incoming'
            })
            
            relationshipCount++
            console.log(`🔗 Relationship: ${sourceTask.name} → ${targetTask.name}`)
          }
        }
      }
    }
    
    console.log(`\n🔗 Processed ${relationshipCount} relationships`)

    // ============ FALLBACK: If no groups, create default ============
    if (groups.length === 0) {
      console.log('\n⚠️ No groups created, creating default group')
      
      const defaultSwimlane = {
        id: `swimlane-${Date.now()}`,
        name: 'Project Timeline',
        expanded: true,
        subGroups: [],
        tasks: []
      }
      
      for (const root of rootTasks) {
        const taskObj = convertTaskToUITask(root, taskMap, idMap)
        if (taskObj && taskObj.name) {
          defaultSwimlane.tasks.push(taskObj)
        }
      }
      
      if (defaultSwimlane.tasks.length > 0) {
        groups.push(defaultSwimlane)
      }
    }

    // ============ COLLECT ALL TASKS FOR SUMMARY ============
    const allUiTasksList = findAllTasks(groups)
    
    const tasksWithRelationships = allUiTasksList.filter(t => t.relationships && t.relationships.length > 0).length
    const totalRelationships = allUiTasksList.reduce((sum, t) => sum + (t.relationships?.length || 0), 0)
    
    const summary = {
      totalTasks: allUiTasksList.length,
      totalDuration: allUiTasksList.reduce((sum, t) => sum + (t.durationDays || 0), 0),
      overallProgress: allUiTasksList.length > 0 
        ? Math.round(allUiTasksList.reduce((sum, t) => sum + (t.progress || 0), 0) / allUiTasksList.length)
        : 0,
      milestoneCount: allUiTasksList.filter(t => t.isMilestone).length,
      relationshipsCount: totalRelationships,
      tasksWithRelationships: tasksWithRelationships
    }

    console.log(`\n📊 FINAL SUMMARY:`)
    console.log(`   Groups: ${groups.length}`)
    console.log(`   Total Tasks: ${summary.totalTasks}`)
    console.log(`   Tasks with Relationships: ${summary.tasksWithRelationships}`)
    console.log(`   Total Relationships: ${summary.relationshipsCount}`)
    
    console.log('\n📁 Final Group Structure:')
    groups.forEach(g => {
      console.log(`  Swimlane: ${g.name} (${g.tasks?.length || 0} tasks)`)
      g.tasks?.forEach(t => {
        console.log(`    ├─ ${t.name} (${t.children?.length || 0} children)`)
        t.children?.forEach(c => {
          console.log(`    │  └─ ${c.name}`)
        })
      })
    })

    return { groups, summary }
  }

  static parseDuration(durationStr, startDate, finishDate) {
    let durationDays = 0
    
    if (durationStr) {
      const hourMatch = durationStr.match(/(\d+(?:\.\d+)?)H/)
      if (hourMatch) {
        durationDays = Math.round(parseFloat(hourMatch[1]) / 8)
      } else {
        const dayMatch = durationStr.match(/(\d+(?:\.\d+)?)D/)
        if (dayMatch) {
          durationDays = Math.round(parseFloat(dayMatch[1]))
        }
      }
    }
    
    // Calculate from dates
    if (durationDays === 0 && startDate && finishDate) {
      const start = new Date(startDate)
      const end = new Date(finishDate)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffTime = Math.abs(end - start)
        durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
      }
    }
    
    return durationDays
  }

  static extractOwner(taskName) {
    const patterns = [
      { pattern: /PM/i, owner: 'PM' },
      { pattern: /Project Manager/i, owner: 'Project Manager' },
      { pattern: /Tech Lead/i, owner: 'Tech Lead' },
      { pattern: /Tech \d/i, owner: 'Tech' },
      { pattern: /Network/i, owner: 'Network' },
      { pattern: /DBA/i, owner: 'DBA' },
      { pattern: /Business Analyst|BA/i, owner: 'BA' }
    ]
    
    for (const { pattern, owner } of patterns) {
      if (pattern.test(taskName)) {
        return owner
      }
    }
    return ''
  }

  static getXMLText(element, tagName) {
    const tag = element.getElementsByTagName(tagName)
    return tag.length > 0 ? tag[0].textContent : null
  }

  static formatDate(dateStr) {
    if (!dateStr) return ''
    
    try {
      let date
      
      if (dateStr.includes('T')) {
        date = new Date(dateStr)
      } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
        date = new Date(dateStr)
      } else if (dateStr.match(/\d{1,2}-[A-Za-z]{3}-\d{4}/)) {
        const parts = dateStr.split('-')
        const monthMap = {
          'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
          'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
        }
        date = new Date(parseInt(parts[2]), monthMap[parts[1]], parseInt(parts[0]))
      } else {
        date = new Date(dateStr)
      }
      
      if (isNaN(date.getTime())) return ''
      
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    } catch (error) {
      return ''
    }
  }
}

export default MSProjectParser