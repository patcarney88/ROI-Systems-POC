const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Team progress data store
let teamProgress = {
  dev: {
    name: 'Development Team',
    members: [
      { id: 1, name: 'Dev Agent 1', status: 'active', currentTask: 'Implementing document API', progress: 65, lastUpdate: new Date() },
      { id: 2, name: 'Dev Agent 2', status: 'active', currentTask: 'Building client endpoints', progress: 45, lastUpdate: new Date() },
      { id: 3, name: 'Dev Agent 3', status: 'idle', currentTask: 'Waiting for task', progress: 0, lastUpdate: new Date() }
    ],
    completedTasks: 12,
    inProgressTasks: 3,
    pendingTasks: 8,
    totalTasks: 23
  },
  qa: {
    name: 'QA Team',
    members: [
      { id: 4, name: 'QA Agent 1', status: 'active', currentTask: 'Testing auth endpoints', progress: 80, lastUpdate: new Date() },
      { id: 5, name: 'QA Agent 2', status: 'active', currentTask: 'Writing integration tests', progress: 55, lastUpdate: new Date() }
    ],
    completedTasks: 8,
    inProgressTasks: 2,
    pendingTasks: 5,
    totalTasks: 15
  }
};

// Activity log
let activityLog = [
  { timestamp: new Date(), team: 'dev', member: 'Dev Agent 1', action: 'Started task: Implementing document API', type: 'start' },
  { timestamp: new Date(Date.now() - 300000), team: 'qa', member: 'QA Agent 1', action: 'Completed: Auth endpoint tests', type: 'complete' },
  { timestamp: new Date(Date.now() - 600000), team: 'dev', member: 'Dev Agent 2', action: 'Started task: Building client endpoints', type: 'start' }
];

// API Endpoints
app.get('/api/progress', (req, res) => {
  res.json({
    success: true,
    data: teamProgress,
    timestamp: new Date()
  });
});

app.get('/api/activity', (req, res) => {
  res.json({
    success: true,
    data: activityLog.slice(-50).reverse(), // Last 50 activities
    timestamp: new Date()
  });
});

app.post('/api/update-progress', (req, res) => {
  const { team, memberId, progress, task, status } = req.body;
  
  if (!teamProgress[team]) {
    return res.status(400).json({ success: false, error: 'Invalid team' });
  }
  
  const member = teamProgress[team].members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' });
  }
  
  // Update member progress
  if (progress !== undefined) member.progress = progress;
  if (task) member.currentTask = task;
  if (status) member.status = status;
  member.lastUpdate = new Date();
  
  // Log activity
  const activity = {
    timestamp: new Date(),
    team,
    member: member.name,
    action: task ? `Working on: ${task}` : `Progress updated to ${progress}%`,
    type: 'update'
  };
  activityLog.push(activity);
  
  // Broadcast update to all connected clients
  io.emit('progress-update', {
    team,
    member,
    activity
  });
  
  res.json({ success: true, data: member });
});

app.post('/api/complete-task', (req, res) => {
  const { team, memberId, taskName } = req.body;
  
  if (!teamProgress[team]) {
    return res.status(400).json({ success: false, error: 'Invalid team' });
  }
  
  const member = teamProgress[team].members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' });
  }
  
  // Update task counts
  teamProgress[team].completedTasks++;
  teamProgress[team].inProgressTasks = Math.max(0, teamProgress[team].inProgressTasks - 1);
  
  // Reset member
  member.progress = 0;
  member.currentTask = 'Waiting for next task';
  member.status = 'idle';
  member.lastUpdate = new Date();
  
  // Log activity
  const activity = {
    timestamp: new Date(),
    team,
    member: member.name,
    action: `Completed: ${taskName}`,
    type: 'complete'
  };
  activityLog.push(activity);
  
  // Broadcast update
  io.emit('task-complete', {
    team,
    member,
    activity,
    teamStats: teamProgress[team]
  });
  
  res.json({ success: true, data: teamProgress[team] });
});

app.post('/api/start-task', (req, res) => {
  const { team, memberId, taskName } = req.body;
  
  if (!teamProgress[team]) {
    return res.status(400).json({ success: false, error: 'Invalid team' });
  }
  
  const member = teamProgress[team].members.find(m => m.id === memberId);
  if (!member) {
    return res.status(404).json({ success: false, error: 'Member not found' });
  }
  
  // Update task counts
  teamProgress[team].inProgressTasks++;
  teamProgress[team].pendingTasks = Math.max(0, teamProgress[team].pendingTasks - 1);
  
  // Update member
  member.progress = 0;
  member.currentTask = taskName;
  member.status = 'active';
  member.lastUpdate = new Date();
  
  // Log activity
  const activity = {
    timestamp: new Date(),
    team,
    member: member.name,
    action: `Started: ${taskName}`,
    type: 'start'
  };
  activityLog.push(activity);
  
  // Broadcast update
  io.emit('task-start', {
    team,
    member,
    activity,
    teamStats: teamProgress[team]
  });
  
  res.json({ success: true, data: member });
});

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Send current state to new client
  socket.emit('initial-state', {
    progress: teamProgress,
    activity: activityLog.slice(-20).reverse()
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Simulate progress updates (for demo purposes)
setInterval(() => {
  Object.keys(teamProgress).forEach(teamKey => {
    const team = teamProgress[teamKey];
    team.members.forEach(member => {
      if (member.status === 'active' && member.progress < 100) {
        // Random progress increment
        const increment = Math.floor(Math.random() * 5) + 1;
        member.progress = Math.min(100, member.progress + increment);
        member.lastUpdate = new Date();
        
        // Broadcast update
        io.emit('progress-update', {
          team: teamKey,
          member,
          activity: null
        });
        
        // Complete task if progress reaches 100
        if (member.progress === 100) {
          setTimeout(() => {
            const taskName = member.currentTask;
            teamProgress[teamKey].completedTasks++;
            teamProgress[teamKey].inProgressTasks = Math.max(0, teamProgress[teamKey].inProgressTasks - 1);
            
            member.progress = 0;
            member.currentTask = 'Waiting for next task';
            member.status = 'idle';
            
            const activity = {
              timestamp: new Date(),
              team: teamKey,
              member: member.name,
              action: `Completed: ${taskName}`,
              type: 'complete'
            };
            activityLog.push(activity);
            
            io.emit('task-complete', {
              team: teamKey,
              member,
              activity,
              teamStats: teamProgress[teamKey]
            });
          }, 1000);
        }
      }
    });
  });
}, 3000); // Update every 3 seconds

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Team Progress Dashboard Server Running`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`📡 API: http://localhost:${PORT}/api/progress\n`);
});
