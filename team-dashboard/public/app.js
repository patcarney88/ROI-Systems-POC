// Initialize Socket.IO connection
const socket = io();

// State
let teamData = {};
let activityData = [];

// DOM Elements
const connectionStatus = document.getElementById('connectionStatus');
const connectionText = document.getElementById('connectionText');
const totalCompleted = document.getElementById('totalCompleted');
const totalInProgress = document.getElementById('totalInProgress');
const totalPending = document.getElementById('totalPending');
const activeAgents = document.getElementById('activeAgents');
const devMembers = document.getElementById('devMembers');
const qaMembers = document.getElementById('qaMembers');
const activityFeed = document.getElementById('activityFeed');

// Socket event handlers
socket.on('connect', () => {
    console.log('Connected to server');
    connectionStatus.classList.remove('disconnected');
    connectionText.textContent = 'Connected';
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
    connectionStatus.classList.add('disconnected');
    connectionText.textContent = 'Disconnected';
});

socket.on('initial-state', (data) => {
    console.log('Received initial state:', data);
    teamData = data.progress;
    activityData = data.activity;
    updateDashboard();
});

socket.on('progress-update', (data) => {
    console.log('Progress update:', data);
    if (teamData[data.team]) {
        const memberIndex = teamData[data.team].members.findIndex(m => m.id === data.member.id);
        if (memberIndex !== -1) {
            teamData[data.team].members[memberIndex] = data.member;
        }
    }
    if (data.activity) {
        activityData.unshift(data.activity);
        activityData = activityData.slice(0, 50); // Keep last 50
    }
    updateDashboard();
});

socket.on('task-complete', (data) => {
    console.log('Task complete:', data);
    if (teamData[data.team]) {
        const memberIndex = teamData[data.team].members.findIndex(m => m.id === data.member.id);
        if (memberIndex !== -1) {
            teamData[data.team].members[memberIndex] = data.member;
        }
        Object.assign(teamData[data.team], data.teamStats);
    }
    if (data.activity) {
        activityData.unshift(data.activity);
        activityData = activityData.slice(0, 50);
    }
    updateDashboard();
    showNotification(`${data.member.name} completed a task!`, 'success');
});

socket.on('task-start', (data) => {
    console.log('Task start:', data);
    if (teamData[data.team]) {
        const memberIndex = teamData[data.team].members.findIndex(m => m.id === data.member.id);
        if (memberIndex !== -1) {
            teamData[data.team].members[memberIndex] = data.member;
        }
        Object.assign(teamData[data.team], data.teamStats);
    }
    if (data.activity) {
        activityData.unshift(data.activity);
        activityData = activityData.slice(0, 50);
    }
    updateDashboard();
});

// Update dashboard
function updateDashboard() {
    updateOverallStats();
    updateTeamSection('dev', devMembers);
    updateTeamSection('qa', qaMembers);
    updateActivityFeed();
}

// Update overall stats
function updateOverallStats() {
    let completed = 0;
    let inProgress = 0;
    let pending = 0;
    let active = 0;
    
    Object.values(teamData).forEach(team => {
        completed += team.completedTasks || 0;
        inProgress += team.inProgressTasks || 0;
        pending += team.pendingTasks || 0;
        active += team.members.filter(m => m.status === 'active').length;
    });
    
    totalCompleted.textContent = completed;
    totalInProgress.textContent = inProgress;
    totalPending.textContent = pending;
    activeAgents.textContent = active;
}

// Update team section
function updateTeamSection(teamKey, container) {
    const team = teamData[teamKey];
    if (!team) return;
    
    // Update team stats
    document.getElementById(`${teamKey}Completed`).textContent = team.completedTasks || 0;
    document.getElementById(`${teamKey}InProgress`).textContent = team.inProgressTasks || 0;
    document.getElementById(`${teamKey}Pending`).textContent = team.pendingTasks || 0;
    
    // Update team progress bar
    const totalTasks = team.totalTasks || 1;
    const progressPercent = Math.round((team.completedTasks / totalTasks) * 100);
    document.getElementById(`${teamKey}Progress`).style.width = `${progressPercent}%`;
    
    // Update members
    container.innerHTML = team.members.map(member => `
        <div class="member-card">
            <div class="member-header">
                <div class="member-info">
                    <span class="member-name">${member.name}</span>
                    <span class="member-status ${member.status}">${member.status}</span>
                </div>
                <span class="member-progress-value">${member.progress}%</span>
            </div>
            <div class="member-task">${member.currentTask}</div>
            <div class="member-progress-bar">
                <div class="member-progress-fill" style="width: ${member.progress}%"></div>
            </div>
            <div class="member-last-update">Last update: ${formatTime(member.lastUpdate)}</div>
        </div>
    `).join('');
}

// Update activity feed
function updateActivityFeed() {
    activityFeed.innerHTML = activityData.map(activity => `
        <div class="activity-item type-${activity.type}">
            <div class="activity-header">
                <span class="activity-member">
                    ${activity.member}
                    <span class="activity-team ${activity.team}">${activity.team}</span>
                </span>
                <span class="activity-time">${formatTime(activity.timestamp)}</span>
            </div>
            <div class="activity-action">${activity.action}</div>
        </div>
    `).join('');
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleString();
}

// Show notification
function showNotification(message, type = 'info') {
    // Simple console notification for now
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // You could implement a toast notification system here
}

// Fetch initial data
async function fetchInitialData() {
    try {
        const response = await fetch('/api/progress');
        const result = await response.json();
        if (result.success) {
            teamData = result.data;
            updateDashboard();
        }
    } catch (error) {
        console.error('Error fetching initial data:', error);
    }
    
    try {
        const response = await fetch('/api/activity');
        const result = await response.json();
        if (result.success) {
            activityData = result.data;
            updateActivityFeed();
        }
    } catch (error) {
        console.error('Error fetching activity data:', error);
    }
}

// Initialize
fetchInitialData();

// Refresh data periodically (backup to WebSocket)
setInterval(fetchInitialData, 30000); // Every 30 seconds
