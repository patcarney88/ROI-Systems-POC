# Quick Reference - Cascade + Superforge Integration

## 🎯 The Setup

You now have **Cascade** (Claude Code) working cooperatively with **64 Superforge agents** across **22 specialized personas**.

### How It Works
- **Cascade = Orchestrator**: Talks to you, delegates tasks, monitors progress, integrates results
- **Superforge = Executor**: 64 parallel agents doing specialized development work
- **Dashboard = Monitor**: Real-time view of all agent activity at http://localhost:4000

## 🚀 Quick Commands

### Check Status
```bash
./scripts/cascade-superforge.sh status
```

### Start Dashboard
```bash
./scripts/cascade-superforge.sh start
```

### View Activity
```bash
./scripts/cascade-superforge.sh activity
```

### Delegate Task
```bash
# To dev team
./scripts/cascade-superforge.sh delegate "Build authentication API"

# To QA team
./scripts/cascade-superforge.sh delegate "Test login flow" qa
```

## 📊 Dashboard

**URL**: http://localhost:4000

Shows real-time:
- All active agents and their tasks
- Progress bars for each agent
- Completed/in-progress/pending counts
- Live activity feed
- Team statistics

## 🤝 How to Work with This System

### Just Talk to Cascade Normally

**You**: "I need to add a new feature for document uploads"

**Cascade will**:
1. Analyze your request
2. Break it into tasks
3. Delegate to appropriate Superforge personas:
   - backend-lead (API endpoints)
   - frontend-lead (UI components)
   - security-engineer (validation)
   - qa-engineer (testing)
4. Monitor their progress on the dashboard
5. Integrate their work
6. Deliver the complete feature to you

### Superforge Agents Work Autonomously

You don't need to manage them directly. They:
- Coordinate using the hive-mind protocol
- Execute tasks in parallel
- Report progress to the dashboard
- Escalate conflicts to Cascade
- Follow quality standards automatically

### Monitor Progress

Open http://localhost:4000 to see:
- **Dev Team**: backend-lead, frontend-lead, database-specialist, integration-specialist, performance-engineer
- **QA Team**: qa-engineer, performance-engineer, security-engineer
- **Design Team**: ux-ui-designer, product-designer, mobile-ux, visual-designer, ux-researcher
- **DevOps Team**: devops, architect

## 🎮 Common Workflows

### 1. New Feature Development
```
You → Cascade: "Add email notifications"
Cascade → Superforge: Delegates to email-specialist, backend-lead, frontend-lead
Superforge → Dashboard: Progress updates in real-time
Cascade → You: "Feature complete and tested"
```

### 2. Bug Fix
```
You → Cascade: "Login is broken"
Cascade → Superforge: Assigns to backend-lead, security-engineer
Superforge → Dashboard: Shows investigation and fix progress
Cascade → You: "Bug fixed and deployed"
```

### 3. Performance Optimization
```
You → Cascade: "App is slow"
Cascade → Superforge: Delegates to performance-engineer + relevant leads
Superforge → Dashboard: Parallel optimization tasks
Cascade → You: "Performance improved by X%"
```

## ✅ Quality Gates

Every deliverable goes through:
1. **Requirements** - Cascade validates with product-manager
2. **Design** - Cascade reviews with design team
3. **Implementation** - Superforge executes, Cascade validates
4. **Testing** - QA team tests, Cascade approves
5. **Deployment** - Cascade coordinates final deployment

## 🚨 If Something Goes Wrong

### Dashboard Not Running
```bash
./scripts/cascade-superforge.sh start
```

### Agents Conflicting
Cascade will automatically:
1. Pause affected workflows
2. Consult relevant personas
3. Apply consensus mechanism
4. Make final decision
5. Resume work

### Need to Override
Cascade has emergency override for:
- Critical bugs
- Security incidents
- Deployment failures

## 📁 Key Files

- `.cascade/agent-coordination.json` - Integration config
- `virtual-team-config.json` - 22 Superforge personas
- `hive-mind-protocol.md` - Agent coordination rules
- `team-dashboard/` - Real-time monitoring
- `CASCADE_SUPERFORGE_INTEGRATION.md` - Full documentation

## 🎯 Best Practices

### ✅ Do
- Let Cascade handle all user communication
- Trust Superforge agents to work autonomously
- Monitor progress via dashboard
- Ask Cascade for status updates
- Delegate complex tasks to multiple personas

### ❌ Don't
- Try to manage individual Superforge agents directly
- Bypass quality gates
- Interfere with parallel execution
- Duplicate work between systems

## 💡 Pro Tips

1. **Check the dashboard** before asking for status - it's always up to date
2. **Describe what you want**, not how to do it - Cascade will figure out the best approach
3. **Trust the process** - 64 agents working in parallel is powerful
4. **Review the activity feed** - shows complete audit trail of all work
5. **Use the CLI tool** - `./scripts/cascade-superforge.sh` for quick operations

## 📊 Current Status

Run this anytime:
```bash
./scripts/cascade-superforge.sh status
```

Shows:
- Integration mode (cooperative)
- Total agents available (64)
- Dashboard status
- Current task counts
- Persona configuration

## 🎉 You're All Set!

The integration is active and ready. Just:
1. **Tell Cascade what you need**
2. **Watch the dashboard** (http://localhost:4000)
3. **Get your work done** by 64 specialized agents

---

**Dashboard**: http://localhost:4000  
**CLI Tool**: `./scripts/cascade-superforge.sh`  
**Full Docs**: `CASCADE_SUPERFORGE_INTEGRATION.md`
