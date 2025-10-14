# 🚀 Team Dashboard - Quick Start

## Access the Dashboard

**Dashboard URL**: http://localhost:4000

The dashboard is now running and showing real-time progress for your QA and Dev teams!

## What You'll See

### 📊 Overall Statistics
- **Tasks Completed**: Total across all teams
- **In Progress**: Currently active tasks
- **Pending**: Queued tasks
- **Active Agents**: Team members currently working

### 💻 Development Team
- 3 Dev Agents
- Real-time progress tracking
- Current task for each agent
- Team completion statistics

### 🧪 QA Team
- 2 QA Agents
- Testing progress monitoring
- Individual task tracking
- Test completion metrics

### 📝 Activity Feed
Live stream of all team activities:
- Task starts (blue)
- Task completions (green)
- Progress updates (yellow)

## Features

✅ **Real-time Updates** - WebSocket-based live data  
✅ **Auto-simulation** - Demo mode with automatic progress  
✅ **Beautiful UI** - Modern, responsive design  
✅ **Activity Tracking** - Complete audit trail  
✅ **Team Metrics** - Comprehensive statistics  

## API Integration

### Update Progress
```bash
curl -X POST http://localhost:4000/api/update-progress \
  -H 'Content-Type: application/json' \
  -d '{
    "team": "dev",
    "memberId": 1,
    "progress": 75,
    "task": "Your task description"
  }'
```

### Start New Task
```bash
curl -X POST http://localhost:4000/api/start-task \
  -H 'Content-Type: application/json' \
  -d '{
    "team": "qa",
    "memberId": 4,
    "taskName": "Testing new feature"
  }'
```

### Complete Task
```bash
curl -X POST http://localhost:4000/api/complete-task \
  -H 'Content-Type: application/json' \
  -d '{
    "team": "dev",
    "memberId": 2,
    "taskName": "Building client endpoints"
  }'
```

## Server Management

### Check Status
```bash
curl http://localhost:4000/api/progress
```

### View Activity Log
```bash
curl http://localhost:4000/api/activity
```

### Stop Server
Press `Ctrl+C` in the terminal running the server

### Restart Server
```bash
cd team-dashboard
npm start
```

## Demo Mode

The dashboard includes automatic progress simulation:
- Agents automatically make progress every 3 seconds
- Tasks complete when reaching 100%
- Activity feed updates in real-time

To disable demo mode, edit `server.js` and comment out the `setInterval` block.

## Customization

### Add Team Members
Edit `server.js` and modify the `teamProgress` object

### Change Colors
Edit `public/styles.css` and update CSS variables in `:root`

### Adjust Update Frequency
Change the interval in `server.js` (default: 3000ms)

## Tech Stack

- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + CSS3
- **Real-time**: WebSocket connections
- **Port**: 4000

## Troubleshooting

### Port Already in Use
Change the port in `server.js`:
```javascript
const PORT = process.env.PORT || 5000; // Change to your preferred port
```

### Dashboard Not Loading
1. Check server is running: `curl http://localhost:4000/api/progress`
2. Check browser console for errors
3. Ensure no firewall blocking port 4000

### WebSocket Not Connecting
1. Check browser supports WebSocket
2. Verify no proxy blocking WebSocket connections
3. Check server logs for connection errors

## Next Steps

1. **Open Dashboard**: http://localhost:4000
2. **Watch Real-time Updates**: Progress bars update automatically
3. **Monitor Activity**: Check the activity feed for all team actions
4. **Integrate with Your Workflow**: Use the API endpoints to send real progress updates

---

**Enjoy monitoring your team's progress! 🎉**
