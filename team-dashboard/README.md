# Team Progress Dashboard

Real-time monitoring dashboard for QA and Development teams working in Claude Code Terminal.

## Features

- **Real-time Updates**: WebSocket-based live progress tracking
- **Team Monitoring**: Separate views for Dev and QA teams
- **Task Tracking**: Monitor completed, in-progress, and pending tasks
- **Activity Feed**: Live feed of all team activities
- **Progress Visualization**: Visual progress bars and statistics
- **Auto-simulation**: Demo mode with automatic progress updates

## Quick Start

### Installation

```bash
cd team-dashboard
npm install
```

### Running the Dashboard

```bash
npm start
```

The dashboard will be available at: **http://localhost:4000**

### Development Mode (with auto-reload)

```bash
npm run dev
```

## API Endpoints

### GET /api/progress
Get current team progress data
```json
{
  "success": true,
  "data": {
    "dev": { ... },
    "qa": { ... }
  }
}
```

### GET /api/activity
Get recent activity log
```json
{
  "success": true,
  "data": [
    {
      "timestamp": "2025-01-08T...",
      "team": "dev",
      "member": "Dev Agent 1",
      "action": "Started: Implementing document API",
      "type": "start"
    }
  ]
}
```

### POST /api/update-progress
Update member progress
```json
{
  "team": "dev",
  "memberId": 1,
  "progress": 75,
  "task": "Implementing document API",
  "status": "active"
}
```

### POST /api/start-task
Start a new task
```json
{
  "team": "dev",
  "memberId": 1,
  "taskName": "Building client endpoints"
}
```

### POST /api/complete-task
Complete a task
```json
{
  "team": "dev",
  "memberId": 1,
  "taskName": "Implementing document API"
}
```

## WebSocket Events

### Client → Server
- `connection`: Initial connection

### Server → Client
- `initial-state`: Initial data on connection
- `progress-update`: Member progress updated
- `task-start`: New task started
- `task-complete`: Task completed

## Dashboard Features

### Overall Statistics
- Total tasks completed across all teams
- Tasks currently in progress
- Pending tasks count
- Active agents count

### Team Cards
- Development Team monitoring
- QA Team monitoring
- Individual member progress
- Current task for each member
- Team-level statistics

### Activity Feed
- Real-time activity stream
- Color-coded by activity type:
  - 🟢 Green: Task completed
  - 🔵 Blue: Task started
  - 🟡 Yellow: Progress update

## Demo Mode

The dashboard includes an auto-simulation feature that:
- Automatically increments progress for active members
- Completes tasks when progress reaches 100%
- Generates realistic activity logs
- Updates every 3 seconds

To disable demo mode, comment out the `setInterval` block in `server.js`.

## Customization

### Adding Team Members

Edit the `teamProgress` object in `server.js`:

```javascript
let teamProgress = {
  dev: {
    members: [
      { 
        id: 1, 
        name: 'Your Agent Name', 
        status: 'active', 
        currentTask: 'Your Task', 
        progress: 0 
      }
    ]
  }
};
```

### Styling

Modify `public/styles.css` to customize:
- Color scheme (CSS variables in `:root`)
- Layout and spacing
- Animations and transitions

## Integration with Claude Code Terminal

To integrate with your actual Claude Code Terminal workflow:

1. **Remove demo simulation** from `server.js`
2. **Send progress updates** via API:
   ```bash
   curl -X POST http://localhost:4000/api/update-progress \
     -H 'Content-Type: application/json' \
     -d '{"team":"dev","memberId":1,"progress":50}'
   ```
3. **Start tasks** when agents begin work
4. **Complete tasks** when agents finish

## Tech Stack

- **Backend**: Node.js + Express
- **Real-time**: Socket.IO
- **Frontend**: Vanilla JavaScript
- **Styling**: CSS3 with custom properties

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

MIT
